import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModules, IModule } from '../api/modules';
import {
  getAlertConfig,
  saveAlertConfig,
  getAlertActions,
  createAlertAction,
  IAlertAction,
  IAlertConfig,
} from '../api/alert';

export default function AlertMajPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conf, setConf] = useState<IAlertConfig | null>(null);
  const [actions, setActions] = useState<IAlertAction[]>([]);
  const [modules, setModules] = useState<IModule[]>([]);
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    getAlertConfig().then(setConf);
    getAlertActions().then(setActions);
    getModules().then(setModules);
  }, []);

  const toggleItem = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const saveConf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conf) return;
    setSaving(true);
    const saved = await saveAlertConfig(conf);
    setConf(saved);
    setSaving(false);
  };

  const markDone = async () => {
    const items = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const act = await createAlertAction(items);
    setActions(prev => [...prev, act]);
    setChecked({});
    const updated = await getAlertConfig();
    setConf(updated);
  };

  if (!conf) return <p style={{padding:'2rem'}}>Chargement…</p>;

  const listItems = modules.flatMap(m => m.items.map(it => ({
    id: it.id,
    title: it.title,
  })));
  const filtered = search
    ? listItems.filter(it =>
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        it.id.toLowerCase().includes(search.toLowerCase())
      )
    : listItems;

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Alerte de mise à jour</h2>
      <form onSubmit={saveConf} className="conf-form">
        <label>Texte</label>
        <input value={conf.text} onChange={e=>setConf({...conf,text:e.target.value})} />
        <label>URL</label>
        <input value={conf.url} onChange={e=>setConf({...conf,url:e.target.value})} />
        <label>Rappel (s)</label>
        <input type="number" value={conf.frequency} onChange={e=>setConf({...conf,frequency:parseInt(e.target.value,10)})} />
        <label>
          <input type="checkbox" checked={conf.active} onChange={e=>setConf({...conf,active:e.target.checked})} />
          Bandeau actif
        </label>
        <button type="submit" disabled={saving}>{saving?'…':'Enregistrer'}</button>
      </form>

      <h3>Documents à jour</h3>
      <div className="popup">
        <input placeholder="rechercher" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="list">
          {filtered.map(it => (
            <label key={it.id}>
              <input type="checkbox" checked={!!checked[it.id]} onChange={()=>toggleItem(it.id)} /> {it.title}
            </label>
          ))}
        </div>
        <button onClick={markDone}>Valider</button>
      </div>

      <h3>Historique</h3>
      <ul className="history">
        {actions.map(a => (
          <li key={a.id}>
            <span>{new Date(a.date).toLocaleString()}</span>
            <button onClick={()=>alert(a.items.join(', '))}>Voir</button>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding:2rem;max-width:600px;margin:auto;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
  .conf-form{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem;}
  .conf-form input[type="number"], .conf-form input[type="text"], .conf-form input[type="url"], .conf-form input:not([type]){padding:.5rem;border:1px solid #bbb;border-radius:4px;}
  .conf-form button{padding:.5rem;background:#008bd2;color:#fff;border:none;border-radius:4px;}
  .conf-form button:hover:not(:disabled){background:#006fa1;}
  .popup{border:1px solid #ccc;padding:.5rem;border-radius:4px;margin-bottom:1rem;}
  .popup input{width:100%;margin-bottom:.5rem;padding:.25rem;}
  .popup .list{max-height:150px;overflow:auto;margin-bottom:.5rem;}
  .history li{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:.25rem 0;}
`;

