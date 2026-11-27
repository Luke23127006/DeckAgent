import { LegacyBrowserMount } from '../../components/legacy-browser-mount.tsx'

/** The settings route: mounts the legacy screens with the settings panel open. */
export function SettingsPage() {
  return <LegacyBrowserMount openSettings />
}
