$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ToolRoot = Join-Path $RepoRoot "tools/project_hub"
$ConfigPath = Join-Path $ToolRoot "config/project-hub.json"
$VenvCommand = Join-Path $ToolRoot ".venv/Scripts/project-hub.exe"

if (Test-Path -LiteralPath $VenvCommand) {
    & $VenvCommand --config $ConfigPath @args
    exit $LASTEXITCODE
}

if (Get-Command uv -ErrorAction SilentlyContinue) {
    & uv run --project $ToolRoot project-hub --config $ConfigPath @args
    exit $LASTEXITCODE
}

$PreviousPythonPath = $env:PYTHONPATH
try {
    $env:PYTHONPATH = if ($PreviousPythonPath) {
        "$ToolRoot/src$([IO.Path]::PathSeparator)$PreviousPythonPath"
    } else {
        "$ToolRoot/src"
    }
    & python -m project_hub --config $ConfigPath @args
    exit $LASTEXITCODE
} finally {
    $env:PYTHONPATH = $PreviousPythonPath
}
