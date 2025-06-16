import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISite, getSites, createSite, updateSite, deleteSite } from '../api/sites';
import './AdminSitesPage.css';

export default function AdminSitesPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<ISite[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { getSites().then(setSites); }, []);

  const startEdit = (s: ISite) => { setEditingId(s.id); setName(s.name); setColor(s.color); };
  const cancel = () => { setEditingId(null); setName(''); setColor('#000000'); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const up = await updateSite(editingId, { name, color });
      setSites(prev => prev.map(s => s.id === up.id ? up : s));
    } else {
      const created = await createSite({ name, color });
      setSites(prev => [...prev, created]);
    }
    cancel();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Supprimer ce site ?')) return;
    await deleteSite(id);
    setSites(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="admin-sites">
      <button className="btn-back" onClick={() => navigate('/admin')}>← Retour dashboard</button>
      <h1>Gestion des sites</h1>
      <form onSubmit={submit} className="site-form">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nom" required />
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} />
        <button type="submit">{editingId ? 'Sauvegarder' : 'Créer'}</button>
        {editingId && <button type="button" onClick={cancel}>Annuler</button>}
      </form>
      <ul className="site-list">
        {sites.map(s => (
          <li key={s.id}>
            <span><span className="color-dot" style={{ background:s.color }} /> {s.name}</span>
            <span>
              <button onClick={() => startEdit(s)}>✏️</button>{' '}
              <button onClick={() => remove(s.id)}>🗑️</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
