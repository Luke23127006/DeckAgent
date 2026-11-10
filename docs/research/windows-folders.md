# Folders on Windows

How a program tells that two paths are the same folder on Windows, and whether a folder put at the place of a moved one is the same folder. Checked on 08-11-2026 on Windows 11 with NTFS drives (`C:`, `D:`) and Node v22.19.0, by running Node calls on test folders.

1. When are two paths the same folder?
   - Run: one folder `Proj`, reached by eight paths: as typed, lower case, upper case with a trailing `\`, a trailing `\.`, a lower-case drive letter, a junction (`mklink /J`), a drive letter from `subst` (`Q:\`), and a network path (`\\localhost\C$\...`). Each path went through `fs.realpathSync`, `fs.realpathSync.native` and `fs.statSync(..., { bigint: true })` (`dev` and `ino`).
   - Observation: `fs.realpathSync` keeps the typed case and leaves `Q:\` and the network path as typed: four of the eight paths give a different string.
   - Observation: `fs.realpathSync.native` gives one string for case, trailing `\`, `\.`, drive letter, junction and `subst`, but the network path stays different.
   - Observation: `dev:ino` is the same for all eight paths; another folder (`OneDrive`) has a different `ino`.
   - Not run: a symbolic link (`New-Item -ItemType SymbolicLink` needs administrator rights here), a real network share on another computer, and a OneDrive folder.
   - Inference: comparing `dev:ino` finds the same folder in every case run; `realpathSync.native` misses network paths; plain `realpathSync` makes one folder into two for a different case or a `subst` drive.
   - Inference: a folder ID on a network share may be missing or unstable `[assumed]`, so a check by ID needs a fallback to the `realpathSync.native` path.
   - => Two paths are the same folder when their `dev:ino` match; when the ID cannot be read, they are the same when their `realpathSync.native` paths match.

2. Is a folder put at the place of a moved one the same folder?
   - Run: read `dev:ino` of `Proj` twice in two Node processes; moved `Proj` to `Moved` and read it; made a new empty `Proj` at the old place and read it; removed it, moved the old folder back and read it.
   - Observation: the ID is the same across processes, stays with the folder when it moves, and comes back with it when it is moved back; the new folder at the old place has another `ino`.
   - Not run: a USB drive (exFAT) and a network share; this computer has only NTFS drives.
   - => On NTFS, comparing the saved `dev:ino` tells a folder put at the old place from the chosen one, and a folder moved back is recognised again.
