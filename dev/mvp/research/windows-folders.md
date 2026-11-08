# Folders on Windows

Question: **how does DeckAgent tell that two paths are the same folder** on Windows, and **whether a folder put at the place of a moved one is the same folder**? Opened on **08-11-2026** for the first build (workspaces and new chat), **RQ-4** (ticket [#52](https://github.com/Luke23127006/DeckAgent/issues/52)) and **RQ-5** (ticket [#53](https://github.com/Luke23127006/DeckAgent/issues/53)). Each check **adds a numbered item** with what was run, what was seen, and what it means for DeckAgent.

1. **When two paths are the same folder** (RQ-4, 08-11-2026, Windows 11, NTFS, Node v22.19.0)
   - Run: one folder `Proj`, reached by **eight paths**: as typed, **lower case**, **upper case with a trailing `\`**, a trailing `\.`, a **lower-case drive letter**, a **junction** (`mklink /J`), a **drive letter from `subst`** (`Q:\`), and a **network path** (`\\localhost\C$\...`). Each path went through `fs.realpathSync`, `fs.realpathSync.native` and `fs.statSync(..., { bigint: true })` (`dev` and `ino`).
   - Observation: `fs.realpathSync` **keeps the typed case** and **leaves `Q:\` and the network path as typed**: **four of the eight** paths give a **different string**.
   - Observation: `fs.realpathSync.native` gives **one string** for case, trailing `\`, `\.`, drive letter, junction and `subst`, but the **network path stays different**.
   - Observation: **`dev:ino` is the same for all eight paths**; another folder (`OneDrive`) has a **different `ino`**.
   - Not run: a **symbolic link** (`New-Item -ItemType SymbolicLink` needs **administrator rights** here), a **real network share** on another computer, and a **OneDrive folder used as a workspace**.
   - Inference: comparing **`dev:ino`** finds the same folder in **every case run**; `realpathSync.native` misses **network paths**; the plain `realpathSync` used by the reference at `5bd9c17` **would make one folder into two workspaces** for a **different case** or a **`subst` drive**.
   - Inference: a folder ID on a **network share** may be **missing or unstable** `[assumed]`, so a check by ID **needs a fallback** to the `realpathSync.native` path.
   - Ruling (PO, 08-11-2026, ticket [#52](https://github.com/Luke23127006/DeckAgent/issues/52)): two paths are **the same folder** when their **`dev:ino` match**; when the ID **cannot be read**, they are the same when their **`realpathSync.native` paths match**.
2. **A folder put at the place of a moved one** (RQ-5, 08-11-2026, Windows 11, NTFS drive `C:`, Node v22.19.0)
   - Run: read `dev:ino` of `Proj` **twice in two Node processes**; **moved** `Proj` to `Moved` and read it; **made a new empty `Proj`** at the old place and read it; removed it, **moved the old folder back** and read it.
   - Observation: the ID is the **same across processes**, **stays with the folder when it moves**, and **comes back with it** when it is moved back; the **new folder at the old place has another `ino`**.
   - Not run: a **USB drive (exFAT)** and a **network share**; this computer has **only NTFS drives** (`C:`, `D:`).
   - Inference: on NTFS, comparing the **saved `dev:ino`** tells a **folder put at the old place** from the **chosen one**, so DeckAgent **does not treat it as the same folder**; a folder **moved back** is **recognised again**.
   - Ruling (PO, 08-11-2026, ticket [#53](https://github.com/Luke23127006/DeckAgent/issues/53)): DeckAgent **does not treat the folder at the old place as the chosen one**; it **says a different folder is there** and lets the user **use it for the workspace** (FR-142, UC-013 A12).
