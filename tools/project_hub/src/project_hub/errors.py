class ProjectHubError(Exception):
    """Base class for expected, user-facing Project Hub failures."""


class ConfigError(ProjectHubError):
    """The committed Project Hub configuration is invalid or incomplete."""


class AuthError(ProjectHubError):
    """Per-user Google authentication failed or is unavailable."""


class RemoteError(ProjectHubError):
    """Google Sheets could not be read."""


class SchemaError(ProjectHubError):
    """The remote spreadsheet schema does not match the configured schema."""


class SnapshotError(ProjectHubError):
    """The local snapshot cannot be read or written safely."""
