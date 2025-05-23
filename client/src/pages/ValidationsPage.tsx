import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Validation {
  id: string;
  username: string;
  moduleId: string;
  itemId: string;
  itemTitle: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ValidationsPage() {
  const [list, setList] = useState<Validation[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/validations')
      .then(res => res.json())
      .then(setList)
      .catch(console.error);
  }, []);

  const update = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/validations/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setList(prev => prev.map(v => (v.id === id ? data : v)));
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 800, margin: 'auto' }}>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Validations</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {list.map(v => (
          <li key={v.id} style={{ borderBottom: '1px solid #ddd', padding: '0.5rem 0' }}>
            <strong>{v.itemTitle}</strong> – {v.username} – {new Date(v.date).toLocaleString()} – {v.status}
            {v.status === 'pending' && (
              <>
                {' '}<button onClick={() => update(v.id, 'approved')}>Valider</button>{' '}
                <button onClick={() => update(v.id, 'rejected')}>Refuser</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
