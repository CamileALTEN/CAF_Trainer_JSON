import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IUser } from '../api/auth';
import { IProgress, IModule, getModules } from '../api/modules';
import ProgressBar from '../components/ProgressBar';
import RadarTracker from '../components/RadarTracker';
import { flatten } from '../utils/items';
import './ProgressPage.css';

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caf, setCaf] = useState<IUser[]>([]);
  const [prog, setProg] = useState<IProgress[]>([]);
  const [mods, setMods] = useState<IModule[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users?managerId=${user!.id}`).then(r => r.json()),
      fetch(`/api/progress?managerId=${user!.id}`).then(r => r.json()),
      getModules(),
    ]).then(([u, p, m]) => {
      setCaf(u);
      setProg(p);
      setMods(m);
    }).finally(() => setLoading(false));
  }, [user]);

  const items = mods.flatMap(m => flatten(m.items));
  const itemMap = new Map(items.map(it => [it.id, it.title]));
  const totalItems = items.length;

  const getStarted = (username: string) =>
    prog.filter(p => p.username === username)
       .flatMap(p => p.started)
       .map(id => itemMap.get(id) || id);

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
        const visited = getVisitedCount(c.username);
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="name_box">
                <div className="row">
        <span className="user">{c.username}</span>
        <div className="progress-container">
          <ProgressBar 
            current={visited} 
            total={Math.max(1, totalItems)} 
          />
        </div>
        <button 
          className="toggle" 
          onClick={() => setOpen(isOpen ? null : c.id)}
        >
          {isOpen ? '⬆️' : '⬇️'}
        </button>
      </div>
            {isOpen && (
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
