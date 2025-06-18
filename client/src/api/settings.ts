export interface ISettings {
  mailEnabled: boolean;
}

export async function getSettings(): Promise<ISettings> {
  const res = await fetch('/api/settings');
  return res.json();
}

export async function saveSettings(conf: Partial<ISettings>): Promise<ISettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conf),
  });
  return res.json();
}
