import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModules, IModule } from '../api/modules';
import { ISite, getSites } from '../api/sites';
import { flatten } from '../utils/items';
import {
  getAlertConfig,
  saveAlertConfig,
  getAlertActions,
  createAlertAction,
  IAlertAction,
  IAlertConfig,
} from '../api/alert';
import InfoTooltip from '../components/InfoTooltip';
import styled from 'styled-components';

export default function AlertMajPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conf, setConf] = useState<IAlertConfig | null>(null);
  const [actions, setActions] = useState<IAlertAction[]>([]);
  const [modules, setModules] = useState<IModule[]>([]);
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [freqValue, setFreqValue] = useState(0);
  const [freqUnit, setFreqUnit] = useState<'s'|'min'|'d'|'mo'>('d');
  const [maxOutdated, setMaxOutdated] = useState(5);
  const [sites, setSites] = useState<ISite[]>([]);
  const [details, setDetails] = useState<IAlertAction|null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [outdated, setOutdated] = useState<{id:string;module:string;title:string;date:string;user:string;reason:string;site:string}[]>([]);
  const [commentView,setCommentView]=useState<string|null>(null);

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

  useEffect(() => { getSites().then(setSites); }, []);

  const SITE_COLORS = useMemo(() => {
    const map: Record<string, string> = {};
    sites.forEach(s => { map[s.name] = s.color; });
    return map;
  }, [sites]);

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
      setMaxOutdated(c.maxOutdated ?? 5);
    });
    getAlertActions().then(setActions);
    getModules().then(ms => {
      setModules(ms);
      const list: {id:string;module:string;title:string;date:string;user:string;reason:string;site:string}[] = [];
      ms.forEach(m => {
        flatten(m.items).forEach(it => {
          if (it.outdatedInfo) {
            list.push({
              id: it.id,
              module: m.title,
              title: it.title,
              date: it.outdatedInfo.date,
              user: it.outdatedInfo.user,
              reason: it.outdatedInfo.reason,
              site: it.outdatedInfo.site || ''
            });
          }
        });
      });
      setOutdated(list);
    });
  }, []);

  useEffect(() => {
    const list: {id:string;module:string;title:string;date:string;user:string;reason:string;site:string}[] = [];
    modules.forEach(m => {
      flatten(m.items).forEach(it => {
        if (it.outdatedInfo) {
          list.push({
            id: it.id,
            module: m.title,
            title: it.title,
            date: it.outdatedInfo.date,
            user: it.outdatedInfo.user,
            reason: it.outdatedInfo.reason,
            site: it.outdatedInfo.site || ''
          });
        }
      });
    });
    setOutdated(list);
  }, [modules]);

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
      maxOutdated,
    };
    const saved = await saveAlertConfig(payload);
    setConf(saved);
    setSaving(false);
  };

  const markDone = async () => {
    setSubmitting(true);
    const items = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const name = parseName(user?.username || '');
    const act = await createAlertAction(items, name, '');
    setActions(prev => [...prev, act]);
    setChecked({});
    const updated = await getAlertConfig();
    setConf(updated);
    const mods = await getModules();
    setModules(mods);
    setSubmitting(false);
    window.location.reload();
  };

  const exportCsv = () => {
    const rows = ['date,utilisateur,module,item,commentaire'];
    actions.forEach(a => {
      a.items.forEach(id => {
        const info = itemMap[id];
        if (info) rows.push(`${new Date(a.date).toLocaleString()},${a.user.replace(/,/g,' ')},${info.module.replace(/,/g,' ')},${info.title.replace(/,/g,' ')},${a.comment?.replace(/,/g,' ') ?? ''}`);
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

  const filteredModules = React.useMemo(() => {
    return modules.map(m => {
      const items = flatten(m.items).filter(it => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          it.title.toLowerCase().includes(q) ||
          it.id.toLowerCase().includes(q)
        );
      });
      return { title: m.title, items };
    }).filter(m => m.items.length);
  }, [modules, search]);

  return (
    <Wrapper>
      {!conf ? (
        <p style={{padding:'2rem'}}>Chargement…</p>
      ) : (
        <>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '10vh', 
        marginBottom: '1vh',
        }}>
        <h1>Outils de gestion des mises à jour</h1>
      </div>

      <div className="layout">
        <div className="left">
          <h2>
            Revue périodique du contenu
            <InfoTooltip>
              <div>
                Cette page permet de sélectionner les items qui ont été inspectés lors de la revue périodique du contenu de CAF-Trainer.
                Les items sélectionnés seront marqués comme mis à jour et enregistrés dans l'historique. Il faudra faire de même avec les documents situés dans le Drive et mettre à jour le GSheet de suivi accesible en cliquant sur la bannière en haut de la page.
                <br />
                <strong>Attention</strong> : il est nécessaire de comprendre que lorsque l'inspection périodique s'active, les items ne sont pas nécessairement obsolètes.
                Il s'agit simplement de vérifier que les items sont toujours à jour et pertinents. Si un item est obsolète, il doit être marqué comme tel dans la page d'édition de contenu.
              </div>
            </InfoTooltip>
          </h2>
          <div style={{ marginTop: '20px' }} />
          <h3>
            Sélection des items inspectés
            <InfoTooltip>
              <i>
                Sélectionnez les items qui ont été inspectés lors de la revue périodique du contenu.
                Les items sélectionnés seront marqués comme mis à jour et enregistrés dans l'historique.
              </i>
            </InfoTooltip>
          </h3>
          <div style={{ marginTop: '20px' }} />
          <h4>Liste des items</h4>
          <input className="search" placeholder="rechercher" value={search} onChange={e=>setSearch(e.target.value)} />
          
          <div className="legend">
            {sites.map(s => (
              <span key={s.id}>
                <span className="color-dot" style={{ background: s.color }} /> {s.name}
              </span>
            ))}
          </div>
          <div className="list">
            
            {filteredModules.map(mod => (
              <div key={mod.title} className="module">
                <h4>{mod.title}</h4>
                {mod.items.map(it => (
                  <button
                    key={it.id}
                    type="button"
                    className={checked[it.id] ? 'item-btn selected' : 'item-btn'}
                    onClick={() => toggleItem(it.id)}
                  >
                    {it.title}
                    {(it.profiles ?? []).map(p => (
                      <span
                        key={p}
                        className="color-dot"
                        style={{ background: SITE_COLORS[p] || '#ccc' }}
                        title={p}
                      />
                    ))}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <button
            className={`validate${submitting ? ' loading' : ''}`}
            onClick={markDone}
            disabled={submitting}
          >
            Soumettre
          </button>
        </div>
        <div className="right">


          <h2>
            Configuration des alertes
            <InfoTooltip>
              <div>Cette page permet de configurer les alertes de revue périodique de contenu.</div>
            </InfoTooltip>
          </h2>

            <div style={{ marginTop: '20px' }} />


          <h3>
            Alerte de revue périodique de contenu
            <InfoTooltip>
              <i>Cette alerte est déclenchée périodiquement pour rappeler aux utilisateurs de vérifier les mises à jour du contenu.</i>
            </InfoTooltip>
          </h3>
          <div style={{ marginTop: '20px' }} />
        

          <form onSubmit={saveConf} className="conf-form">


            <label>Texte de l'alerte :</label>
            <input value={conf.text} onChange={e=>setConf({...conf,text:e.target.value})} />

            <div style={{ marginTop: '5px' }} />

            <label>URL du fichier de suivi des mises à jours des docs du drive :</label>
            <input value={conf.url} onChange={e=>setConf({...conf,url:e.target.value})} />

            <div style={{ marginTop: '5px' }} />
            <label>Fréquence :</label>
            <div className="freq">
              <input type="number" value={freqValue} onChange={e=>setFreqValue(parseInt(e.target.value,10)||0)} />
              <select value={freqUnit} onChange={e=>setFreqUnit(e.target.value as any)}>
                <option value="s">secondes</option>
                <option value="min">minutes</option>
                <option value="d">jours</option>
                <option value="mo">mois</option>
              </select>
            </div>
            <div style={{ marginTop: '20px' }} />


            <h3>
              Alerte sur le seuil d'items indiqués comme obsolètes dans CAF-Trainer
              <InfoTooltip>
                <i>Cette alerte est déclenchée lorsque le nombre d'items obsolètes dépasse un seuil défini. Les items sont déclarés obsolètes
                par les utilisateurs dans le page d'édition de contenu.</i>
              </InfoTooltip>
            </h3>
          <div style={{ marginTop: '10px' }} />
            <label>Seuil items non à jour</label>
            <input type="number" value={maxOutdated} onChange={e=>setMaxOutdated(parseInt(e.target.value,10)||0)} />
            <button
              type="submit"
              className={saving ? 'loading' : ''}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>


      <div style={{ marginTop: '20px' }} />

      <h3 className="history-title">Items à mettre à jour</h3>
      <div className="out-table-wrapper">
        <table className="out-table">
          <thead>
            <tr>
              <th>Item</th><th>Module</th><th>Site</th><th>Date</th><th>Par</th><th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {outdated.map(it => (
              <tr key={it.id}>
                <td>{it.title}</td>
                <td>{it.module}</td>
                <td>{it.site}</td>
                <td>{new Date(it.date).toLocaleDateString()}</td>
                <td>{it.user}</td>
                <td><button onClick={()=>setCommentView(it.reason)}>Voir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="history-title">Historique</h3>
      <div className="history-actions">
        <button onClick={exportCsv}>Exporter CSV</button>
        <button className="danger" onClick={()=>setResetOpen(true)}>Vider l'historique</button>
      </div>
      <ul className="history">
        {[...actions].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(a => (
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
            {details.comment && <p><em>{details.comment}</em></p>}
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
      {commentView && (
        <div className="history-popup">
          <div className="box">
            <p>{commentView}</p>
            <button onClick={()=>setCommentView(null)}>Fermer</button>
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
  padding:2rem;max-width:1000px;margin:auto;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
  .layout{display:flex;gap:2rem;margin-bottom:1rem;}
  .left{flex:1;}
  .right{flex:1;border-left:2px solid #ccc;padding-left:2rem;}
  .conf-form{display:flex;flex-direction:column;gap:.5rem;}
  .conf-form input[type="number"], .conf-form input[type="text"], .conf-form input[type="url"], .conf-form input:not([type]){padding:.5rem;border:1px solid #bbb;border-radius:4px;}
  .conf-form button{padding:.5rem;background:#008bd2;color:#fff;border:none;border-radius:4px;}
  .conf-form button:hover:not(:disabled){background:#006fa1;}
    .loading{position:relative;color:transparent !important;}
  .loading::after{
    content:'';position:absolute;top:50%;left:50%;width:16px;height:16px;margin-top:-8px;margin-left:-8px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;
  }
  .search{width:100%;margin-bottom:.5rem;padding:.25rem;}
  .legend{display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap;font-size:.85rem;}
  .color-dot{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:middle;}
  .list{max-height:300px;overflow:auto;margin-bottom:.5rem;}
  .module h4{margin:0.25rem 0;}
  .item-btn{display:block;width:100%;text-align:left;border:none;padding:.25rem .5rem;margin-bottom:2px;background:#f5f5f5;border-radius:4px;cursor:pointer;color:#043962;}
  .item-btn.selected{background:#043962;color:#fff;}
  .validate{padding:.5rem;background:#008bd2;color:#fff;border:none;border-radius:4px;}
  .validate:hover{background:#006fa1;}
  .history li{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:.25rem 0;}
  .freq{display:flex;gap:.25rem;align-items:center;}
  .history-actions{display:flex;gap:.5rem;margin-bottom:.5rem;}
  .history-title{text-align:center;margin-top:1rem;}
  .history-popup{background:rgba(0,0,0,0.6);position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;}
  .history-popup .box{background:#fff;padding:1rem;border-radius:8px;max-height:80vh;overflow:auto;}
  .history-popup.warn .box{background:#ffe6e6;border:2px solid #c00;}
  .history-popup.warn .warning{color:#c00;font-weight:bold;margin-bottom:.5rem;}
  .history-popup .actions{display:flex;gap:.5rem;margin-top:.5rem;}
  .out-table-wrapper{max-height:200px;overflow:auto;margin-bottom:1rem;}
  .out-table{width:100%;border-collapse:collapse;}
  .out-table th,.out-table td{border:1px solid #ddd;padding:4px 8px;text-align:left;}
  .out-table th{background:#f5f5f5;}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
`;

