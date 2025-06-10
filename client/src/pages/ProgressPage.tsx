import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IUser } from '../api/auth';
import { IProgress, IModule, getModules } from '../api/modules';
import ProgressBar from '../components/ProgressBar';
import RadarTracker from '../components/RadarTracker';
import { flatten } from '../utils/items';
import { fuzzySearch } from '../utils/fuzzySearch';
import './ProgressPage.css';

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caf, setCaf] = useState<IUser[]>([]);
  const [prog, setProg] = useState<IProgress[]>([]);
  const [mods, setMods] = useState<IModule[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [superUser, setSuperUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downQuery, setDownQuery] = useState('');
  const [upQuery, setUpQuery] = useState('');
  const [averages, setAverages] = useState<Record<string, { avg: number; prevAvg?: number }>>({});

  useEffect(() => {
    setDownQuery('');
    setUpQuery('');
  }, [superUser]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users?managerId=${user!.id}`).then(r => r.json()),
      fetch(`/api/progress?managerId=${user!.id}`).then(r => r.json()),
      getModules(),
      fetch('/api/analytics/averages').then(r => r.json()),
    ]).then(([u, p, m, a]) => {
      setCaf(u);
      setProg(p);
      setMods(m);
      setAverages(a);
    }).finally(() => setLoading(false));
  }, [user]);

  const items = mods.flatMap(m =>
    flatten(m.items).map(it => ({ id: it.id, title: it.title, moduleId: m.id }))
  );
  const itemMap = new Map(items.map(it => [it.id, it.title]));
  const itemInfo = new Map(items.map(it => [it.id, it]));
  const totalItems = items.length;

  const getStarted = (username: string) =>
    prog.filter(p => p.username === username)
       .flatMap(p => p.started)
       .map(id => itemMap.get(id) || id);

  const getNeedValidation = (username: string) =>
    prog.filter(p => p.username === username)
       .flatMap(p => (p.needValidation || []).map(id => ({ id, title: itemMap.get(id) || id, moduleId: p.moduleId })));

  const validateItem = (username: string, moduleId: string, id: string) => {
    setProg(prev => prev.map(p => {
      if (p.username === username && p.moduleId === moduleId) {
        const needVal = p.needValidation.filter(x => x !== id);
        const visited = [...p.visited, id];
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, visited, started: p.started, needValidation: needVal }),
        }).catch(console.error);
        return { ...p, needValidation: needVal, visited };
      }
      return p;
    }));
  };

  const invalidateItem = (username: string, moduleId: string, id: string) => {
    setProg(prev => prev.map(p => {
      if (p.username === username && p.moduleId === moduleId) {
        const needVal = p.needValidation.filter(x => x !== id);
        const visited = p.visited.filter(x => x !== id);
        const started = p.started.filter(x => x !== id);
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, visited, started, needValidation: needVal }),
        }).catch(console.error);
        return { ...p, needValidation: needVal, visited, started };
      }
      return p;
    }));
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, date: new Date().toISOString(), category: 'validation', message: `Item ${id} invalide` }),
    }).catch(console.error);
  };

  const getVisitedItems = (username: string) =>
    prog.filter(p => p.username === username)
       .flatMap(p => p.visited.map(id => ({
         id,
         moduleId: p.moduleId,
         title: itemMap.get(id) || id,
       })));

  const getNotVisitedItems = (username: string) => {
    const byUser = prog.filter(p => p.username === username);
    const visited = new Set<string>();
    const started = new Set<string>();
    const needVal = new Set<string>();
    byUser.forEach(p => {
      p.visited.forEach(id => visited.add(id));
      p.started.forEach(id => started.add(id));
      p.needValidation.forEach(id => needVal.add(id));
    });
    return items.filter(it =>
      !visited.has(it.id) && !started.has(it.id) && !needVal.has(it.id)
    );
  };

  const downgradeItem = (username: string, moduleId: string, id: string) => {
    setProg(prev => prev.map(p => {
      if (p.username === username && p.moduleId === moduleId) {
        const visited = p.visited.filter(x => x !== id);
        const started = p.started.filter(x => x !== id);
        const needValidation = p.needValidation.filter(x => x !== id);
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, visited, started, needValidation }),
        }).catch(console.error);
        fetch('/api/quiz-results', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, itemId: id }),
        }).catch(console.error);
        return { ...p, visited, started, needValidation };
      }
      return p;
    }));
  };

  const upgradeItem = (username: string, moduleId: string, id: string) => {
    const entry = prog.find(p => p.username === username && p.moduleId === moduleId);
    const visited = entry ? [...entry.visited, id] : [id];
    const started = entry ? entry.started : [];
    const needValidation = entry ? entry.needValidation : [];
    fetch('/api/progress', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, moduleId, visited, started, needValidation }),
    }).catch(console.error);
    if (entry) {
      setProg(prev => prev.map(p => p === entry ? { ...p, visited } : p));
    } else {
      setProg(prev => [...prev, { username, moduleId, visited, started: [], needValidation: [] }]);
    }
  };

  const getVisitedCount = (username: string) =>
    prog.filter(p => p.username === username)
       .reduce((n, p) => n + p.visited.length, 0);

  if (loading) return <div className="progress-wrapper"><p>Chargement…</p></div>;

  return (
    <div className="progress-wrapper">
      <button className="btn-back" onClick={() => navigate('/manager')}>← Retour</button>
      <h1>Suivi de progression</h1>
      {caf.map(c => {
        const started = getStarted(c.username);
        const needVal = getNeedValidation(c.username);
        const visited = getVisitedCount(c.username);
        const avg = averages[c.id]?.avg ?? 0;
        const prev = averages[c.id]?.prevAvg ?? avg;
        const trend = prev ? ((avg - prev) / prev) * 100 : 0;
        const isOpen = open === c.id;
        const supervising = superUser === c.id;
        return (
          <div key={c.id} className="name_box">
                <div className="row">
        <span className="user">{c.username}</span>
        <span className="kpi">{Math.round(avg)} min {trend >= 0 ? '▲' : '▼'}{Math.round(Math.abs(trend))}%</span>
        <div className="progress-container">
          <ProgressBar
            current={visited}
            total={Math.max(1, totalItems)}
          />
        </div>
        <button
          className="supervise"
          onClick={() => setSuperUser(supervising ? null : c.id)}
        >
          👮
        </button>
        <button
          className="toggle"
          onClick={() => setOpen(isOpen ? null : c.id)}
        >
          {isOpen ? '⬆️' : '⬇️'}
        </button>
      </div>
            {supervising ? (
              <div className="supervision_box">
                <h3>Supervision</h3>
                {needVal.length === 0 ? (
                  <p>Aucun item à valider.</p>
                ) : (
                  <ul>
                    {needVal.map((it) => (
                      <li key={it.id}>
                        {it.title}{' '}
                        <button onClick={() => validateItem(c.username, it.moduleId, it.id)}>👍</button>{' '}
                        <button onClick={() => invalidateItem(c.username, it.moduleId, it.id)}>👎</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="tool_box">
                  <h4>Rétrograder</h4>
                  <input
                    type="search"
                    placeholder="Recherche item visité"
                    value={downQuery}
                    onChange={e => setDownQuery(e.target.value)}
                  />
                  <ul>
                    {fuzzySearch(getVisitedItems(c.username), downQuery, it => it.title).map(it => (
                      <li key={it.id}>
                        {it.title}{' '}
                        <button onClick={() => downgradeItem(c.username, it.moduleId, it.id)}>Downgrade ? 📉</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="tool_box">
                  <h4>Upgrade</h4>
                  <input
                    type="search"
                    placeholder="Recherche item non visité"
                    value={upQuery}
                    onChange={e => setUpQuery(e.target.value)}
                  />
                  <ul>
                    {fuzzySearch(getNotVisitedItems(c.username), upQuery, it => it.title).map(it => (
                      <li key={it.id}>
                        {it.title}{' '}
                        <button onClick={() => upgradeItem(c.username, it.moduleId, it.id)}>Upgrade ?📈</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : isOpen && (
              <>
              <div className="stat_box">
                <h3>En cours</h3>
                {started.length === 0 ? (
                  <p>Aucun item en cours.</p>
                ) : (
                  <ul>
                    {started.map((t,idx) => <li key={idx}>{t}</li>)}
                  </ul>
                )}
              </div>
              <div className="stat_box progress_tracker">
                <h3>Progress Tracker</h3>
                <RadarTracker modules={mods} progress={prog} username={c.username} site={c.site}  />
              </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
