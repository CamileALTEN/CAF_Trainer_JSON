export interface ICafType {
  id: string;
  name: string;
}

export async function getCafTypes(): Promise<ICafType[]> {
  const res = await fetch('/api/caf-types');
  return res.json();
}

export async function createCafType(data: Omit<ICafType, 'id'>): Promise<ICafType> {
  const res = await fetch('/api/caf-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCafType(id: string, data: Partial<Omit<ICafType,'id'>>): Promise<ICafType> {
  const res = await fetch(`/api/caf-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCafType(id: string): Promise<void> {
  await fetch(`/api/caf-types/${id}`, { method: 'DELETE' });
}
