import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModules, IModule } from '../api/modules';
import { flatten } from '../utils/items';
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
  const [freqValue, setFreqValue] = useState(0);
  const [freqUnit, setFreqUnit] = useState<'s'|'min'|'d'|'mo'>('d');
  const [details, setDetails] = useState<IAlertAction|null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      navigate('/');
    }
  }, [user, navigate]);

  const UNITS = { s: 1, min: 60, d: 86400, mo: 2592000 } as const;

  const parseName = (u: string) => {
    const m = u.match(/^(\w+)\.(\w+)@/);
    if (m) return `${m[1]} ${m[2]}`;
    return u;
  };

  useEffect(() => {
    getAlertConfig().then(c => {
      setConf(c);
      // derive value/unit from seconds
      if (c.frequency % UNITS.mo === 0) {
        setFreqUnit('mo');
        setFreqValue(c.frequency / UNITS.mo);
      } else if (c.frequency % UNITS.d === 0) {
        setFreqUnit('d');
        setFreqValue(c.frequency / UNITS.d);
      } else if (c.frequency % UNITS.min === 0) {
        setFreqUnit('min');
        setFreqValue(c.frequency / UNITS.min);
      } else {
        setFreqUnit('s');
        setFreqValue(c.frequency);
      }
    });
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
    const payload = {
      text: conf.text,
      url: conf.url,
      frequency: freqValue * UNITS[freqUnit],
    };
    const saved = await saveAlertConfig(payload);
    setConf(saved);
    setSaving(false);
  };

  const markDone = async () => {
    const items = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const name = parseName(user?.username || '');
    const act = await createAlertAction(items, name);
    setActions(prev => [...prev, act]);
    setChecked({});
    const updated = await getAlertConfig();
    setConf(updated);
    window.location.reload();
  };

  const exportCsv = () => {
    const rows = ['date,utilisateur,module,item'];
    actions.forEach(a => {
      a.items.forEach(id => {
        const info = itemMap[id];
        if (info) rows.push(`${new Date(a.date).toLocaleString()},${a.user.replace(/,/g,' ')},${info.module.replace(/,/g,' ')},${info.title.replace(/,/g,' ')}`);
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alert-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetHistory = async () => {
    await fetch('/api/alert/actions', { method: 'DELETE' });
    setActions([]);
    setResetOpen(false);
    setConfirmText('');
  };

  const itemMap = React.useMemo(() => {
    const map: Record<string, { module: string; title: string }> = {};
    modules.forEach(m => {
      flatten(m.items).forEach(it => {
        map[it.id] = { module: m.title, title: it.title };
      });
    });
    return map;
  }, [modules]);

  const listItems = modules.flatMap(m =>
    flatten(m.items).map(it => ({ id: it.id, title: it.title }))
  );
  const filtered = search
    ? listItems.filter(it =>
        it.title.toLowerCase().includes(search.toLowerCase()) ||
        it.id.toLowerCase().includes(search.toLowerCase())
      )
    : listItems;

  return (
    <Wrapper>
      {!conf ? (
        <p style={{padding:'2rem'}}>Chargement…</p>
      ) : (
        <>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Alerte de mise à jour</h2>
      <form onSubmit={saveConf} className="conf-form">
        <label>Texte</label>
        <input value={conf.text} onChange={e=>setConf({...conf,text:e.target.value})} />
        <label>URL</label>
        <input value={conf.url} onChange={e=>setConf({...conf,url:e.target.value})} />
        <label>Rappel</label>
        <div className="freq">
          <input type="number" value={freqValue} onChange={e=>setFreqValue(parseInt(e.target.value,10)||0)} />
          <select value={freqUnit} onChange={e=>setFreqUnit(e.target.value as any)}>
            <option value="s">secondes</option>
            <option value="min">minutes</option>
            <option value="d">jours</option>
            <option value="mo">mois</option>
          </select>
        </div>
        <button type="submit" disabled={saving}>{saving?'…':'Enregistrer'}</button>
      </form>

      <h3>Documents à jour</h3>
      <div className="popup">
        <input placeholder="rechercher" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="list">
          {filtered.map(it => (
            <label key={it.id} className="item">
              <input type="checkbox" checked={!!checked[it.id]} onChange={()=>toggleItem(it.id)} />
              <span>{it.title}</span>
            </label>
          ))}
        </div>
        <button onClick={markDone}>Valider</button>
      </div>

      <h3>Historique</h3>
      <div className="history-actions">
        <button onClick={exportCsv}>Exporter CSV</button>
        <button className="danger" onClick={()=>setResetOpen(true)}>Vider l'historique</button>
      </div>
      <ul className="history">
        {[...actions].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).map(a => (
          <li key={a.id}>
            <span>{new Date(a.date).toLocaleString()} – {a.user}</span>
            <button onClick={()=>setDetails(a)}>Voir</button>
          </li>
        ))}
      </ul>
      {details && (
        <div className="history-popup">
          <div className="box">
            <h4>Détails</h4>
            <p>Validé par {details.user} le {new Date(details.date).toLocaleString()}</p>
            <ul>
              {details.items
                .map(id => itemMap[id])
                .sort((a,b)=>a.module.localeCompare(b.module))
                .map((it,i)=> (
                  <li key={i}><strong>{it.module}</strong> - {it.title}</li>
                ))}
            </ul>
            <button onClick={()=>setDetails(null)}>Fermer</button>
          </div>
        </div>
      )}
      {resetOpen && (
        <div className="history-popup warn">
          <div className="box">
            <p className="warning">Cette action est <strong>irréversible</strong> !</p>
            <p>Veuillez taper&nbsp;: <code>CONFIRMER</code></p>
            <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} />
            <div className="actions">
              <button onClick={()=>setResetOpen(false)}>Annuler</button>
              <button disabled={confirmText!=="CONFIRMER"} onClick={resetHistory}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
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
  .popup .list{max-height:300px;overflow:auto;margin-bottom:.5rem;}
  .history li{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:.25rem 0;}
  .popup .list label.item{display:flex;align-items:center;gap:.5rem;padding:2px 0;}
  .freq{display:flex;gap:.25rem;align-items:center;}
  .history-actions{display:flex;gap:.5rem;margin-bottom:.5rem;}
  .history-popup{background:rgba(0,0,0,0.6);position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;}
  .history-popup .box{background:#fff;padding:1rem;border-radius:8px;max-height:80vh;overflow:auto;}
  .history-popup.warn .box{background:#ffe6e6;border:2px solid #c00;}
  .history-popup.warn .warning{color:#c00;font-weight:bold;margin-bottom:.5rem;}
  .history-popup .actions{display:flex;gap:.5rem;margin-top:.5rem;}
`;

