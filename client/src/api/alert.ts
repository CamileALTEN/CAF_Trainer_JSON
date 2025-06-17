export interface IAlertConfig {
  text: string;
  url: string;
  frequency: number; // seconds
  active: boolean;
  lastAck?: string;
}

export interface IAlertAction {
  id: string;
  date: string;
  items: string[];
  user: string;
  comment?: string;
}

export async function getAlertConfig(): Promise<IAlertConfig> {
  const res = await fetch('/api/alert');
  return res.json();
}

export async function saveAlertConfig(conf: Partial<IAlertConfig>): Promise<IAlertConfig> {
  const res = await fetch('/api/alert', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conf),
  });
  return res.json();
}

export async function getAlertActions(): Promise<IAlertAction[]> {
  const res = await fetch('/api/alert/actions');
  return res.json();
}

export async function createAlertAction(items: string[], user: string, comment: string = ''): Promise<IAlertAction> {
  const res = await fetch('/api/alert/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, user, comment }),
  });
  return res.json();
}
