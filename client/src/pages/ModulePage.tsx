/* client/src/pages/ModulePage.tsx
   ───────────────────────────────────────────────────────────
   Version intégrale mise à jour :
   • ré‑apparition des flèches ← / →
   • champ de recherche plein‑texte (titre + contenu) avec suggestions
*/

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate }  from 'react-router-dom';

import SidebarMenu     from '../components/SidebarMenu';
import ItemContent, { ItemStatus }     from '../components/ItemContent';
import ProgressBar     from '../components/ProgressBar';
import Loader          from '../components/Loader';

import { getModule, IItem, IModule, IQuiz, IProgress } from '../api/modules';
import { flatten }     from '../utils/items';
import { useAuth }     from '../context/AuthContext';
import axios          from 'axios';
import { getQuizResults } from '../api/quiz';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites';
import './ModulePage.css';

/* ------------------------------------------------------------------ */
/*  Helpers profils                                                    */
/* ------------------------------------------------------------------ */
const matchSite = (site?: string, typeId?: string) => (it: IItem) =>
  it.enabled &&
  (it.profiles?.length ? it.profiles.includes(site!) : true) &&
  (it.cafTypes?.length ? it.cafTypes.includes(typeId!) : true);

const filterBySite = (branch: IItem[], site?: string, typeId?: string): IItem[] =>
  branch
    .filter(matchSite(site, typeId))
    .map((it) => ({ ...it, children: filterBySite(it.children ?? [], site, typeId) }));

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */
export default function ModulePage() {
  const { moduleId }   = useParams<{ moduleId: string }>();
  const { user }       = useAuth();
  const site           = user?.site;
  const cafTypeId      = user?.cafTypeId ?? '1';
  const username       = user?.username;
  const quizKey        = username ? `quiz_${username}_${moduleId}` : `quiz_${moduleId}`;


  const navigate       = useNavigate();

  /* ---------------- état principal ---------------- */
  const [mod,      setMod]  = useState<IModule | null>(null);
  const [items,    setIt]   = useState<IItem[]>([]);
  const [selected, setSel]  = useState('');
  const [status, setStatus] = useState<Record<string, ItemStatus>>({});
  const [busy,     setBusy] = useState(true);
  const [open,     setOpen] = useState(false);
  interface QuizPassData { answers: number[][]; }
  const [quizPassed, setQuizPassed] = useState<Record<string, QuizPassData>>({});

  /* ---------------- favoris ---------------- */
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    getFavorites(user.id)
      .then(setFavs)
      .catch(() => setFavs([]));
  }, [user]);
  const toggleFav = async (id: string) => {
    if (!user) return;
    setFavs((prev) => {
      if (prev.includes(id)) {
        removeFavorite(user.id, id).catch(() => undefined);
        return prev.filter((x) => x !== id);
      }
      addFavorite(user.id, id).catch(() => undefined);
      try { axios.post('/api/analytics/favorite', { userId: user.id, itemId: id }); } catch { /* ignore */ }
      return [...prev, id];
    });
  };

  /* ---------------- recherche plein‑texte ---------------- */
  const [term, setTerm] = useState('');
  const matches = useMemo(() => {
    if (term.trim().length < 2) return [] as IItem[];
    const low = term.toLowerCase();
    return flatten(items)
      .filter(it =>
        it.title.toLowerCase().includes(low) ||
        it.content.toLowerCase().includes(low))
      .slice(0, 10);
  }, [term, items]);

  /* ---------------- chargement ---------------- */
  useEffect(() => {
    if (!moduleId) return;
    setBusy(true);
    getModule(moduleId)
      .then((m) => {
        const filtered = filterBySite(m.items, site, cafTypeId);
        setMod({ ...m, items: filtered });
        setIt(filtered);
        setSel(filtered[0]?.id ?? '');
        {
          const raw = JSON.parse(localStorage.getItem(quizKey) ?? '{}');
          const norm: Record<string, QuizPassData> = {};
          for (const [k, v] of Object.entries(raw)) {
            if (v && typeof v === 'object' && Array.isArray((v as any).answers)) {
              norm[k] = { answers: (v as any).answers };
            }
          }
          setQuizPassed(norm);
        }
        if (username) {
          fetch(`/api/progress/${username}`)
            .then((r) => r.json())
            .then((rows: IProgress[]) => {
              const row = rows.find((p) => p.moduleId === moduleId);
              if (!row) return;
              const st: Record<string, ItemStatus> = {};
              row.started.forEach((id) => {
                st[id] = 'in-progress';
              });
              row.needValidation?.forEach((id) => {
                st[id] = 'need-validation';
              });
              row.visited.forEach((id) => {
                st[id] = 'done';
              });
              setStatus(st);
              setQuizPassed(prev => {
                const next: Record<string, QuizPassData> = {};
                for (const [k, v] of Object.entries(prev)) {
                  if (row.visited.includes(k)) next[k] = v;
                }
                localStorage.setItem(quizKey, JSON.stringify(next));
                return next;
              });
            })
            .catch(console.error);
          getQuizResults(username)
            .then(rows => {
              const map: Record<string, QuizPassData> = {};
              rows
                .filter(r => r.moduleId === moduleId && r.score >= 80)
                .forEach(r => { map[r.itemId] = { answers: r.answers }; });
              setQuizPassed(prev => {
                const merged = { ...prev, ...map };
                localStorage.setItem(quizKey, JSON.stringify(merged));
                return merged;
              });
            })
            .catch(console.error);
        } else {
          setStatus({});
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setTimeout(() => setBusy(false), 450)); // petit délai pour le loader
  }, [moduleId, site, cafTypeId, username, navigate]);

  /* ---------------- indexation rapide ---------------- */
  const find = useMemo(() => {
    const map = new Map<string, IItem>();
    const walk = (list: IItem[]) =>
      list.forEach((it) => {
        map.set(it.id, it);
        if (it.children) walk(it.children);
      });
    walk(items);
    return (id: string) => map.get(id) ?? null;
  }, [items]);

  /* ---------------- navigation ← / → ---------------- */
  const flat = useMemo(() => flatten(items), [items]);
  const curIndex = flat.findIndex((x) => x.id === selected);
  const prevId   = curIndex > 0 ? flat[curIndex - 1].id : null;
  const nextId   = curIndex !== -1 && curIndex < flat.length - 1 ? flat[curIndex + 1].id : null;

  /* ---------------- changement de statut ---------------- */
  const changeStatus = (id: string, s: ItemStatus) =>
    setStatus((prev) => {
      const item = find(id)!;
      if (s === 'done' && item.quiz?.enabled && !quizPassed[id]) {
        alert('Vous devez réussir le quiz avant de valider cet item.');
        return prev;
      }
      const next = { ...prev, [id]: s };

      /* push au backend pour suivi manager */
      if (username) {
        const entries = Object.entries(next);
        const visited = entries
          .filter(([, st]) => st === 'done')
          .map(([k]) => k);
        const needValidation = entries
          .filter(([, st]) => st === 'need-validation')
          .map(([k]) => k);
        const started = entries
          .filter(([, st]) => st === 'in-progress')
          .map(([k]) => k);
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, visited, started, needValidation }),
        }).catch(console.error);
      }
      return next;
    });

  const markQuizPassed = (id: string, answers: number[][]) => {
    setQuizPassed(prev => {
      const next = { ...prev, [id]: { answers } };
      localStorage.setItem(`quiz_${moduleId}`, JSON.stringify(next));
      return next;
    });
    setStatus(prev => {
      if (prev[id] === 'in-progress') {
        const up: Record<string, ItemStatus> = { ...prev, [id]: 'done' };
        if (username) {
        const entries = Object.entries(up);
        const visited = entries
          .filter(([, st]) => st === 'done')
          .map(([k]) => k);
        const needValidation = entries
          .filter(([, st]) => st === 'need-validation')
          .map(([k]) => k);
        const started = entries
          .filter(([, st]) => st === 'in-progress')
          .map(([k]) => k);
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, visited, started, needValidation }),
        }).catch(console.error);
        }
        return up;
      }
      return prev;
    });
  };

  /* ---------------- états spéciaux ---------------- */
  if (busy)      return <Loader />;
  if (!mod)      return <p style={{ padding: '2rem' }}>Module introuvable…</p>;
  if (!items.length)
    return <p style={{ padding: '2rem' }}>Aucun contenu pour votre profil.</p>;

  const item      = find(selected)!;
  const total     = flat.length;
  const completed = Object.values(status).filter((s) => s === 'done').length;
  const cls       = `module-page${open ? ' open' : ''}`;

  return (
    <div className={cls}>
      {/* -------- panneau latéral -------- */}
      <aside className="module-sidebar">
        <header>
          <button className="back-modules" onClick={() => navigate('/')}>← Modules</button>
          <h2>{mod.title}</h2>
          <button className="close" onClick={() => setOpen(false)}>×</button>
        </header>

        <SidebarMenu
          items={items}
          selected={selected}
          onSelect={(id) => { setSel(id); setOpen(false); }}
          visited={Object.entries(status).filter(([,s])=>s==='done').map(([k])=>k)}
        />
      </aside>

      {/* -------- contenu -------- */}
      <main className="module-content">
        <button className="btn-back" onClick={() => navigate('/')}>← Retour</button>
        {/* barre recherche + suggestions */}
        <input
          type="search"
          placeholder="🔍 Rechercher dans le module…"
          value={term}
          onChange={e => setTerm(e.target.value)}
          style={{ marginBottom: 12, padding: 6, width: '100%' }}
        />
        {matches.length > 0 && (
          <ul style={{
            position: 'absolute', zIndex: 1000, background: '#fff',
            listStyle: 'none', padding: 0, margin: 0, border: '1px solid #ddd',
            maxHeight: 200, overflowY: 'auto', width: 'calc(100% - 48px)',
          }}>
            {matches.map(m => (
              <li key={m.id}>
                <button
                  style={{ all: 'unset', display: 'block', width: '100%', padding: '6px 8px', cursor: 'pointer' }}
                  onClick={() => { setSel(m.id); setTerm(''); }}
                >
                  {m.title}
                </button>
              </li>
            ))}
          </ul>
        )}

        <ProgressBar current={completed} total={Math.max(1, total)} />

        <ItemContent
          title={item.title}
          subtitle={item.subtitle}
          images={item.images}
          description={item.content}
          links={item.links}

          videos={item.videos}
          quiz={item.quiz}
          quizPassed={!!quizPassed[item.id]}
          quizAnswers={quizPassed[item.id]?.answers}
          onQuizPassed={(ans) => markQuizPassed(item.id, ans)}
          moduleId={moduleId!}
          itemId={item.id}
          username={username}
          needValidation={item.needValidation}
          status={status[item.id] ?? 'new'}
          onStatusChange={(s) => changeStatus(item.id, s)}
          isFav={favs.includes(item.id)}
          onToggleFav={() => toggleFav(item.id)}
        />
      </main>

      {/* bouton hamburger */}
      {!open && (
        <button className="toggle-sidebar" onClick={() => setOpen(true)}>☰</button>
      )}

      {/* flèches navigation */}
      {prevId && (
        <button className="nav-arrow prev" onClick={() => setSel(prevId)} title="Précédent">←</button>
      )}
      {nextId && (
        <button className="nav-arrow next" onClick={() => setSel(nextId)} title="Suivant">→</button>
      )}
    </div>
  );
}