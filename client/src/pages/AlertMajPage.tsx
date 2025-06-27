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
import './AlertMajPage.css';

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
  const [outdated, setOutdated] = useState<{id:string;module:string;title:string;date:string;user:string;reason:string;sites:string[]}[]>([]);
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
      const list: {id:string;module:string;title:string;date:string;user:string;reason:string;sites:string[]}[] = [];
      ms.forEach(m => {
        flatten(m.items).forEach(it => {
          if (it.outdatedInfo) {
            const sites = it.outdatedInfo.site ? [it.outdatedInfo.site] : (it.profiles ?? []);
            list.push({
              id: it.id,
              module: m.title,
              title: it.title,
              date: it.outdatedInfo.date,
              user: it.outdatedInfo.user,
              reason: it.outdatedInfo.reason,
              sites,
            });
          }
        });
      });
      setOutdated(list);
    });
  }, []);

  useEffect(() => {
    const list: {id:string;module:string;title:string;date:string;user:string;reason:string;sites:string[]}[] = [];
    modules.forEach(m => {
      flatten(m.items).forEach(it => {
        if (it.outdatedInfo) {
          const sites = it.outdatedInfo.site ? [it.outdatedInfo.site] : (it.profiles ?? []);
          list.push({
            id: it.id,
            module: m.title,
            title: it.title,
            date: it.outdatedInfo.date,
            user: it.outdatedInfo.user,
            reason: it.outdatedInfo.reason,
            sites,
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
    <div className="alert-maj-page">
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
          <div className="section-box">
          <h2>
            Revue périodique du contenu
            <InfoTooltip>
              <div>
                Cette page permet de sélectionner les items qui ont été inspectés lors de la revue périodique du contenu de CAF-Trainer.
                Les items sélectionnés seront marqués comme mis à jour et enregistrés dans l'historique. Il faudra faire de même avec les documents situés dans le Drive et mettre à jour le GSheet de suivi accesible en cliquant sur la bannière en haut de la page.
                <br />
                <div style={{ marginTop: '10px' }} />
                <strong>⚠️Attention⚠️</strong>: il est nécessaire de comprendre que lorsque l'inspection périodique s'active, les items ne sont pas nécessairement obsolètes.
                <br /> ➡️ Il s'agit simplement de vérifier que les items sont toujours à jour et pertinents. Si un item est obsolète, il doit être marqué comme tel dans la page d'édition de contenu.
              </div>
            </InfoTooltip>
          </h2>
         
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
                    {it.title}&nbsp;&nbsp;&nbsp;
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
        </div>
        <div className="right">
          <div className="section-box">


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
           
        

          <form onSubmit={saveConf} className="conf-form">


            <label>Texte de l'alerte :</label>
            <input value={conf.text} onChange={e=>setConf({...conf,text:e.target.value})} />

            

            <label>URL du fichier de suivi des mises à jours des docs du drive :</label>
            <input value={conf.url} onChange={e=>setConf({...conf,url:e.target.value})} />

            
            <label>Fréquence :</label>
            <div className="freq">
              <input type="number" value={freqValue} onChange={e=>setFreqValue(parseInt(e.target.value,10)||0)} />&nbsp;&nbsp;&nbsp;
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
       
            <label>Seuil items non à jour</label>
            <input type="number" value={maxOutdated} onChange={e=>setMaxOutdated(parseInt(e.target.value,10)||0)} />
            <div style={{ marginTop: '20px' }} />
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
      </div>
      <div style={{ marginTop: '20px' }} />
      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '1rem 0' }} />


      <div style={{ marginTop: '15px' }} />


      <div className="section-box">
      <h3 className="history-title">Informations des items à mettre à jour
        <InfoTooltip>
          <p>
            Cette section affiche les items qui ont été marqués comme obsolètes dans CAF-Trainer.
            Vous pouvez consulter les détails de chaque item, y compris la date de la dernière mise à jour, l'utilisateur qui l'a marqué comme obsolète et le commentaire associé.
          </p>
        </InfoTooltip>
      </h3>
      <div style={{ marginTop: '10px' }} />

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
                <td className="site-cell">
                  {it.sites.map(s => (
                    <span key={s} className="site-badge">
                      <span className="color-dot" style={{ background: SITE_COLORS[s] || '#ccc' }} /> {s}
                    </span>
                  ))}
                </td>
                <td>{new Date(it.date).toLocaleDateString()}</td>
                <td>{it.user}</td>
                <td><button onClick={()=>setCommentView(it.reason)}>Voir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '1rem 0' }} />

      <div className="section-box">
      <h3 className="history-title">Historique</h3>
      <div className="history-actions">
        <button onClick={exportCsv}>Exporter au format CSV</button>&nbsp;&nbsp;&nbsp;
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
      </div>
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
            <h4>Détails :</h4>
            <p>{commentView}</p>
            <div style={{ marginTop: '10px' }} />
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
    </div>
  );
}

