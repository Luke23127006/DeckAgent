import { spawn } from 'node:child_process'
import { join } from 'node:path'

/**
 * Asks the user for one folder in the folder dialog of the operating system.
 * Resolves with the folder, or `null` when the user closes the dialog without choosing.
 * The dialog closes when `signal` aborts.
 */
export type PickDirectory = (signal: AbortSignal) => Promise<string | null>

/** The computer has no folder dialog that DeckAgent can open. The caller falls back to a typed path. */
export class FolderPickerUnavailableError extends Error {
  constructor() {
    super('FOLDER_PICKER_UNAVAILABLE')
    this.name = 'FolderPickerUnavailableError'
  }
}

/**
 * The Windows folder dialog (`IFileOpenDialog` with the pick-folders option), opened by a short PowerShell
 * script that compiles a small COM wrapper. The script runs without a profile, and the folder comes back on
 * standard output. The dialog opens over the window that has the focus, which is the browser the user just used.
 */
export const pickerTypes = `
using System;
using System.Runtime.InteropServices;
public static class DeckAgentFolderDialog {
  [ComImport, Guid("DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")] class FileOpenDialog {}
  [ComImport, Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IShellItem {
    void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);
    void GetParent(out IShellItem ppsi);
    void GetDisplayName(uint sigdnName, [MarshalAs(UnmanagedType.LPWStr)] out string ppszName);
    void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
    void Compare(IShellItem psi, uint hint, out int piOrder);
  }
  [ComImport, Guid("42f85136-db7e-439c-85f1-e4075d135fc8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IFileDialog {
    [PreserveSig] int Show(IntPtr parent);
    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
    void SetFileTypeIndex(uint iFileType);
    void GetFileTypeIndex(out uint piFileType);
    void Advise(IntPtr pfde, out uint pdwCookie);
    void Unadvise(uint dwCookie);
    void SetOptions(uint fos);
    void GetOptions(out uint pfos);
    void SetDefaultFolder(IShellItem psi);
    void SetFolder(IShellItem psi);
    void GetFolder(out IShellItem ppsi);
    void GetCurrentSelection(out IShellItem ppsi);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
    void GetResult(out IShellItem ppsi);
    void AddPlace(IShellItem psi, int fdap);
    void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
    void Close(int hr);
    void SetClientGuid(ref Guid guid);
    void ClearClientData();
    void SetFilter(IntPtr pFilter);
  }
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  public static string Pick(string title) {
    IFileDialog dialog = (IFileDialog)new FileOpenDialog();
    uint options;
    dialog.GetOptions(out options);
    dialog.SetOptions(options | 0x20 | 0x40 | 0x8);
    dialog.SetTitle(title);
    int result = dialog.Show(GetForegroundWindow());
    if (result == unchecked((int)0x800704C7)) return null;
    if (result != 0) Marshal.ThrowExceptionForHR(result);
    IShellItem item;
    dialog.GetResult(out item);
    string path;
    item.GetDisplayName(0x80058000, out path);
    return path;
  }
}
`

export function pickerScript(tail?: string): string {
  return `$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -TypeDefinition @'${pickerTypes}'@
${
  tail ??
  `$path = [DeckAgentFolderDialog]::Pick('Chọn thư mục dự án')
if ($path) { 'OK:' + $path } else { 'CANCEL' }`
}
`
}

/** The folder dialog of Windows. Any other system gets `FolderPickerUnavailableError`. */
export function windowsFolderPicker(): PickDirectory {
  return (signal: AbortSignal) =>
    new Promise<string | null>((resolve, reject) => {
      if (process.platform !== 'win32') {
        reject(new FolderPickerUnavailableError())
        return
      }
      // The full path of the system PowerShell: no lookup on PATH, and no shell between DeckAgent and it.
      const shell = join(
        process.env.SystemRoot ?? 'C:\\Windows',
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe',
      )
      const encoded = Buffer.from(pickerScript(), 'utf16le').toString('base64')
      const child = spawn(
        shell,
        ['-NoProfile', '-NonInteractive', '-STA', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
        {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'ignore'],
        },
      )
      let output = ''
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', (chunk: string) => {
        output += chunk
      })
      const stop = () => child.kill()
      if (signal.aborted) stop()
      signal.addEventListener('abort', stop, { once: true })
      child.once('error', () => reject(new FolderPickerUnavailableError()))
      child.once('close', code => {
        signal.removeEventListener('abort', stop)
        const line = output.replace(/^\uFEFF/, '').trim()
        if (signal.aborted) reject(new Error('FOLDER_PICKER_CANCELLED'))
        else if (code === 0 && line === 'CANCEL') resolve(null)
        else if (code === 0 && line.startsWith('OK:') && line.length > 3) resolve(line.slice(3))
        else reject(new Error('FOLDER_PICKER_FAILED'))
      })
    })
}
