import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICafType, getCafTypes, createCafType, updateCafType, deleteCafType } from '../api/cafTypes';
import './AdminCafTypesPage.css';

export default function AdminCafTypesPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<ICafType[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { getCafTypes().then(setTypes); }, []);

  const startEdit = (t: ICafType) => { setEditingId(t.id); setName(t.name); };
  const cancel = () => { setEditingId(null); setName(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const up = await updateCafType(editingId, { name });
      setTypes(prev => prev.map(t => t.id === up.id ? up : t));
    } else {
      const created = await createCafType({ name });
      setTypes(prev => [...prev, created]);
    }
    cancel();
  };

  const remove = async (id: string) => {
    if (id === '1') return;
    if (!window.confirm('Supprimer ce type ?')) return;
    await deleteCafType(id);
    setTypes(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="admin-sites">
      <button className="btn-back" onClick={() => navigate('/admin')}>← Retour dashboard</button>
      <h1>Gestion des types de CAF</h1>
      <form onSubmit={submit} className="site-form">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom" required />
        <button type="submit">{editingId ? 'Sauvegarder' : 'Créer'}</button>
        {editingId && <button type="button" onClick={cancel}>Annuler</button>}
      </form>
      <ul className="site-list">
        {types.map(t => (
          <li key={t.id}>
            <span>{t.name}</span>
            <span>
              <button onClick={() => startEdit(t)}>✏️</button>{' '}
              {t.id !== '1' && (
                <button onClick={() => remove(t.id)}>🗑️</button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
