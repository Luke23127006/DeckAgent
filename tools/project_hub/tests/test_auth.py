from __future__ import annotations

import pytest

from project_hub.auth import READONLY_SCOPE, _assert_readonly_scope
from project_hub.errors import AuthError


class _Credentials:
    def __init__(self, scopes, granted_scopes=None):
        self.scopes = scopes
        self.granted_scopes = granted_scopes


def test_readonly_scope_is_accepted() -> None:
    _assert_readonly_scope(_Credentials([READONLY_SCOPE]))


def test_write_capable_scope_is_rejected() -> None:
    credentials = _Credentials(
        [READONLY_SCOPE],
        granted_scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )

    with pytest.raises(AuthError, match="write-capable"):
        _assert_readonly_scope(credentials)
