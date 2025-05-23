export interface IValidationEntry {
  id: string;
  username: string;
  moduleId: string;
  itemId: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function getValidations(managerId?: string): Promise<IValidationEntry[]> {
  const res = await fetch(`/api/validations${managerId ? '?managerId=' + managerId : ''}`);
  return res.json();
}

export async function updateValidation(id: string, status: 'approved' | 'rejected') {
  await fetch(`/api/validations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
