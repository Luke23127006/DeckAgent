---
status: accepted
---

# OpenCode installation and application resources

The Local Web application requires the pinned OpenCode executable for model work. Its dependency installation supplies that executable on Windows x64, so users do not install OpenCode globally or change PATH. The [runtime provisioning issue](https://github.com/Luke23127006/DeckAgent/issues/105) tracks implementation and clean-machine release evidence.

## Installation and ownership

Keep runtime discovery in the Local Web application and resource preparation in repository tooling. The application declares the exact `opencode-windows-x64` version as an optional production dependency. The package manager checks the tarball integrity in the lockfile. This package contains the executable and needs no installation hook. Optional status lets unsupported platforms install the repository without claiming their runtime works.

The release resource command copies the installed executable, package metadata and upstream MIT notice into an application resource directory. A manifest names the version, platform, architecture, fixed executable location and SHA-256 digest. Preparation verifies the version and staged bytes before publishing the directory. An identical destination is reused; a different destination is not overwritten. Ordinary builds do not create a second executable copy. A complete application installer and clean-machine release verification remain separate deliverables.

## Resolution and compatibility

An explicit command-line executable overrides the environment setting. A nonempty environment override precedes prepared application resources, the workspace-installed platform package and the historical PATH lookup. A broken explicit override or present but invalid resource directory reports failure rather than selecting a different executable. Existing explicit CLI integrations remain valid. No new agent runtime or Vela dependency is introduced.

Startup verifies bundled-resource integrity and the executable version before publishing runtime availability. Missing or incompatible runtimes keep history, Settings and drafts available. Recovery restores the installed dependencies or release resources and restarts the Host. Startup makes no model request and reads no provider-global OpenCode configuration.

The executable resources are separate from Application Storage. Provider credentials, isolated configuration, native sessions, tool authorization and user project folders retain their existing owners and behavior. Only Windows x64 resource installation is exercised initially; another platform needs its own package selection and verification before being declared supported.
