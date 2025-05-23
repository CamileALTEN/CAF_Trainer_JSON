/* client/src/pages/ModulePage.tsx
   ───────────────────────────────────────────────────────────
   Version intégrale mise à jour :
   • ré‑apparition des flèches ← / →
   • champ de recherche plein‑texte (titre + contenu) avec suggestions
*/

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate }  from 'react-router-dom';

import SidebarMenu     from '../components/SidebarMenu';
import ItemContent     from '../components/ItemContent';
import ProgressBar     from '../components/ProgressBar';
import Loader          from '../components/Loader';

import { getModule, IItem, IModule, IQuiz, ItemStatus } from '../api/modules';
import { flatten }     from '../utils/items';
import { useAuth }     from '../context/AuthContext';
import './ModulePage.css';

/* ------------------------------------------------------------------ */
/*  Helpers profils                                                    */
/* ------------------------------------------------------------------ */
const matchSite = (site?: string) => (it: IItem) =>
  it.enabled && (it.profiles?.length ? it.profiles.includes(site!) : true);

const filterBySite = (branch: IItem[], site?: string): IItem[] =>
  branch
    .filter(matchSite(site))
    .map((it) => ({ ...it, children: filterBySite(it.children ?? [], site) }));

/* ------------------------------------------------------------------ */
/*  Composant                                                          */
/* ------------------------------------------------------------------ */
export default function ModulePage() {
  const { moduleId }   = useParams<{ moduleId: string }>();
  const { user }       = useAuth();
  const site           = user?.site;
  const username       = user?.username;

  const navigate       = useNavigate();

  /* ---------------- état principal ---------------- */
  const [mod,      setMod]  = useState<IModule | null>(null);
  const [items,    setIt]   = useState<IItem[]>([]);
  const [selected, setSel]  = useState('');
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [busy,     setBusy] = useState(true);
  const [open,     setOpen] = useState(false);
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});

  /* ---------------- favoris ---------------- */
  const favKey = `favs_${username}`;
  const [favs, setFavs] = useState<string[]>(
    () => JSON.parse(localStorage.getItem(favKey) ?? '[]'),
  );
  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(favKey, JSON.stringify(next));
      return next;
    });

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
        const filtered = filterBySite(m.items, site);
        setMod({ ...m, items: filtered });
        setIt(filtered);
        setSel(filtered[0]?.id ?? '');
        setStatuses(
          JSON.parse(localStorage.getItem(`status_${moduleId}`) ?? '{}'),
        );
        setQuizPassed(JSON.parse(localStorage.getItem(`quiz_${moduleId}`) ?? '{}'));
      })
      .catch(() => navigate('/'))
      .finally(() => setTimeout(() => setBusy(false), 450)); // petit délai pour le loader
  }, [moduleId, site, navigate]);

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

  /* ---------------- changement statut ---------------- */
  const updateStatus = (id: string, st: ItemStatus) =>
    setStatuses((prev) => {
      const item = find(id)!;
      if (st === 'auto_done' && item.quiz?.enabled && !quizPassed[id]) {
        alert('Vous devez réussir le quiz avant de valider cet item.');
        return prev;
      }
      if (st === 'to_validate') {
        fetch('/api/validations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, itemId: id }),
        }).catch(console.error);
      }
      const next = { ...prev, [id]: st };
      localStorage.setItem(`status_${moduleId}`, JSON.stringify(next));

      if (username) {
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, moduleId, statuses: next }),
        }).catch(console.error);
      }
      return next;
    });

  const markQuizPassed = (id: string) => {
    setQuizPassed(prev => {
      const next = { ...prev, [id]: true };
      localStorage.setItem(`quiz_${moduleId}`, JSON.stringify(next));
      return next;
    });
    updateStatus(id, 'validated');
  };

  const requestValidation = (id: string) => updateStatus(id, 'to_validate');

  const requestHelp = (id: string) => {
    const message = prompt('Décrivez votre problème :');
    if (!message) return;
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        target: 'manager',
        title: `Besoin d'aide sur ${find(id)?.title}`,
        message,
        category: 'help',
      }),
    }).catch(console.error);
    updateStatus(id, 'need_help');
  };

  /* ---------------- états spéciaux ---------------- */
  if (busy)      return <Loader />;
  if (!mod)      return <p style={{ padding: '2rem' }}>Module introuvable…</p>;
  if (!items.length)
    return <p style={{ padding: '2rem' }}>Aucun contenu pour votre profil.</p>;

  const item      = find(selected)!;
  const total     = flat.length;
  const completed = Object.values(statuses).filter(
    (s) => s === 'validated' || s === 'auto_done',
  ).length;
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
          onSelect={(id) => {
            setSel(id);
            setOpen(false);
          }}
          visited={Object.keys(statuses).filter(
            (k) => statuses[k] === 'validated' || statuses[k] === 'auto_done',
          )}
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
          quizPassed={quizPassed[item.id]}
          onQuizPassed={() => markQuizPassed(item.id)}
          validationRequired={item.validationRequired}
          validationType={item.validationType}
          onRequestValidation={() => requestValidation(item.id)}
          onRequestHelp={() => requestHelp(item.id)}
          status={statuses[item.id] ?? 'not_started'}
          onStatusChange={(s) => updateStatus(item.id, s)}
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