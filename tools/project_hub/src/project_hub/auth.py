from __future__ import annotations

import json
import os
import stat
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from contextlib import suppress
from pathlib import Path
from typing import Any

from project_hub.errors import AuthError

READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"
SCOPES = (READONLY_SCOPE,)
AUTH_DIR_ENV = "PROJECT_HUB_AUTH_DIR"
CLIENT_FILE_ENV = "PROJECT_HUB_GOOGLE_CLIENT_FILE"


def user_auth_dir() -> Path:
    override = os.environ.get(AUTH_DIR_ENV)
    if override:
        return Path(override).expanduser().resolve()
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA")
        if base:
            return Path(base) / "project-hub"
        return Path.home() / "AppData" / "Local" / "project-hub"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "project-hub"
    base = os.environ.get("XDG_CONFIG_HOME")
    return (Path(base) if base else Path.home() / ".config") / "project-hub"


def token_path() -> Path:
    return user_auth_dir() / "token.json"


def default_client_file() -> Path:
    override = os.environ.get(CLIENT_FILE_ENV)
    if override:
        return Path(override).expanduser().resolve()
    return user_auth_dir() / "client_secret.json"


def authenticate(
    *,
    client_file: Path | None = None,
    open_browser: bool = True,
    login_hint: str | None = None,
) -> Any:
    source = (client_file or default_client_file()).expanduser().resolve()
    if not source.is_file():
        raise AuthError(
            f"Google OAuth desktop client file not found: {source}. "
            f"Set {CLIENT_FILE_ENV} or pass --client-secrets."
        )
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError as exc:
        raise AuthError(
            "Google OAuth dependency is missing. Install the project with `pip install -e .`."
        ) from exc
    try:
        flow = InstalledAppFlow.from_client_secrets_file(str(source), scopes=list(SCOPES))
        kwargs: dict[str, Any] = {"prompt": "consent select_account"}
        if login_hint:
            kwargs["login_hint"] = login_hint
        credentials = flow.run_local_server(
            host="127.0.0.1",
            port=0,
            open_browser=open_browser,
            success_message="Project Hub authentication completed. You may close this window.",
            **kwargs,
        )
    except Exception as exc:
        raise AuthError(f"Google OAuth flow failed: {exc}") from exc
    _assert_readonly_scope(credentials)
    _save_credentials(credentials)
    return credentials


def load_credentials(*, refresh: bool = True) -> Any:
    path = token_path()
    if not path.is_file():
        raise AuthError(f"No user token found at {path}. Run `project-hub auth` first.")
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
    except ImportError as exc:
        raise AuthError(
            "Google authentication dependency is missing. Install with `pip install -e .`."
        ) from exc
    try:
        credentials = Credentials.from_authorized_user_file(str(path), scopes=list(SCOPES))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise AuthError(f"Cannot load user token {path}: {exc}") from exc
    _assert_readonly_scope(credentials)
    if refresh and not credentials.valid:
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
            except Exception as exc:
                raise AuthError(
                    "Google token refresh failed. Run `project-hub logout`, then "
                    "authenticate again. "
                    f"Details: {exc}"
                ) from exc
            _save_credentials(credentials)
        else:
            raise AuthError("Google token is invalid and cannot be refreshed. Authenticate again.")
    return credentials


def _assert_readonly_scope(credentials: Any) -> None:
    scopes = set(credentials.scopes or SCOPES)
    scopes.update(getattr(credentials, "granted_scopes", None) or ())
    if READONLY_SCOPE not in scopes:
        raise AuthError("OAuth token does not include the required spreadsheets.readonly scope")
    write_scopes = {
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
    }
    unexpected = scopes.intersection(write_scopes)
    if unexpected:
        raise AuthError(
            "Refusing OAuth token with write-capable scope(s): " + ", ".join(sorted(unexpected))
        )


def _save_credentials(credentials: Any) -> None:
    directory = user_auth_dir()
    directory.mkdir(parents=True, exist_ok=True)
    with suppress(OSError):
        os.chmod(directory, stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
    data = credentials.to_json().encode("utf-8")
    descriptor, name = tempfile.mkstemp(prefix=".token.", dir=directory)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        with suppress(OSError):
            os.chmod(temporary, stat.S_IRUSR | stat.S_IWUSR)
        os.replace(temporary, token_path())
    finally:
        temporary.unlink(missing_ok=True)


def logout(*, revoke: bool = False) -> bool:
    path = token_path()
    if not path.is_file():
        return False
    if revoke:
        credentials = load_credentials(refresh=False)
        value = credentials.refresh_token or credentials.token
        if not value:
            raise AuthError("Stored credential has no token that can be revoked")
        body = urllib.parse.urlencode({"token": value}).encode("ascii")
        request = urllib.request.Request(
            "https://oauth2.googleapis.com/revoke",
            data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.status != 200:
                    raise AuthError(f"Google token revocation returned HTTP {response.status}")
        except (OSError, urllib.error.HTTPError) as exc:
            raise AuthError(
                f"Could not revoke the Google token; local token retained: {exc}"
            ) from exc
    path.unlink()
    return True


def auth_status() -> dict[str, Any]:
    path = token_path()
    result: dict[str, Any] = {"tokenPath": str(path), "authenticated": False}
    if not path.is_file():
        return result
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        scopes = raw.get("scopes", [])
        if isinstance(scopes, str):
            scopes = [scopes]
        result["readonlyScope"] = READONLY_SCOPE in scopes
        result["authenticated"] = bool(result["readonlyScope"])
        result["readable"] = True
        result["clientIdSuffix"] = _redact_client_id(str(raw.get("client_id", "")))
    except (OSError, json.JSONDecodeError, TypeError):
        result["readable"] = False
    return result


def _redact_client_id(client_id: str) -> str:
    if not client_id:
        return "unknown"
    suffix = client_id[-24:]
    return f"...{suffix}"
