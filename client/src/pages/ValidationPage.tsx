import React, { useEffect, useState } from 'react';
import { getValidations, updateValidation, IValidationEntry } from '../api/validations';
import { useAuth } from '../context/AuthContext';

export default function ValidationPage() {
  const { user } = useAuth();
  const [list, setList] = useState<IValidationEntry[]>([]);
  useEffect(() => {
    getValidations(user?.role === 'manager' ? user.id : undefined).then(setList);
  }, [user]);

  const approve = async (id: string) => {
    await updateValidation(id, 'approved');
    setList(prev => prev.filter(v => v.id !== id));
  };
  const reject = async (id: string) => {
    const reason = prompt('Raison du refus ?');
    await updateValidation(id, 'rejected');
    setList(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Validations à traiter</h1>
      {list.length === 0 ? (
        <p>Aucun item à valider.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Module</th>
              <th>Item</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(v => (
              <tr key={v.id}>
                <td>{v.username}</td>
                <td>{v.moduleId}</td>
                <td>{v.itemId}</td>
                <td>{new Date(v.date).toLocaleString()}</td>
                <td>
                  <button onClick={() => approve(v.id)}>Valider</button>
                  <button onClick={() => reject(v.id)}>Refuser</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
