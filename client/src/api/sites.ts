export interface ISite {
  id: string;
  name: string;
  color: string;
}

export async function getSites(): Promise<ISite[]> {
  const res = await fetch('/api/sites');
  return res.json();
}

export async function createSite(data: Omit<ISite, 'id'>): Promise<ISite> {
  const res = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateSite(id: string, data: Partial<Omit<ISite,'id'>>): Promise<ISite> {
  const res = await fetch(`/api/sites/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSite(id: string): Promise<void> {
  await fetch(`/api/sites/${id}`, { method: 'DELETE' });
}
