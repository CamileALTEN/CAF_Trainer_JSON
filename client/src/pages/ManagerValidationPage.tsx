import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IValidation, updateValidation } from '../api/modules';

export default function ManagerValidationPage() {
  const { user } = useAuth();
  const [list, setList] = useState<IValidation[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/validations?status=pending`)
      .then(r => r.json())
      .then((vals: IValidation[]) => {
        const filtered = vals.filter(v => !v.managerId || v.managerId === user.id);
        setList(filtered);
      })
      .catch(() => {});
  }, [user]);

  const act = async (id: string, status: 'approved' | 'rejected') => {
    const feedback = status === 'rejected' ? prompt('Message (optionnel) ?') || undefined : undefined;
    const val = await updateValidation(id, { status, feedback });
    setList(prev => prev.filter(v => v.id !== id));
  };

  if (!user) return null;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Validations en attente</h1>
      {list.length === 0 && <p>Aucune validation en attente.</p>}
      <ul>
        {list.map(v => (
          <li key={v.id} style={{ marginBottom: 8 }}>
            {v.username} – {v.itemId}
            <button onClick={() => act(v.id, 'approved')} style={{ marginLeft: 8 }}>Valider</button>
            <button onClick={() => act(v.id, 'rejected')} style={{ marginLeft: 8 }}>Refuser</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
