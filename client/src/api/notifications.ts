export interface INotification {
  id: string;
  type?: string;
  message?: string;
  cible?: { userIds?: string[]; roles?: string[] };
  action?: { type: string; url?: string };
  tags?: string[];
  etat?: { luPar: string[]; nonLuPar: string[] };
  dateEnvoi?: string;
  expireraLe?: string;
  origine?: string;
}

export async function getAllNotifications(): Promise<INotification[]> {
  const res = await fetch('/api/notifications', { headers: { 'x-role': 'admin' } });
  return res.json();
}

export async function createNotification(data: Partial<INotification> & { type: string; message: string }): Promise<INotification> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-role': 'admin' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function launchInactiveCampaign(): Promise<void> {
  await fetch('/api/notifications/campaign/inactive', {
    method: 'POST',
    headers: { 'x-role': 'admin' },
  });
}
