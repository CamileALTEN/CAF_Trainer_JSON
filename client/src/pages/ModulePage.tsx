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
import AdvancedHelpEditor from '../components/AdvancedHelpEditor';

import { getModule, IItem, IModule, IQuiz } from '../api/modules';
import { ItemStatus, updateItemStatus, sendHelpRequest } from '../api/userProgress';
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
  const [visited,  setVis]  = useState<string[]>([]);
  const [busy,     setBusy] = useState(true);
  const [open,     setOpen] = useState(false);
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [helpItemId, setHelpItemId] = useState<string | null>(null);

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
        setVis(JSON.parse(localStorage.getItem(`visited_${moduleId}`) ?? '[]'));
        setQuizPassed(JSON.parse(localStorage.getItem(`quiz_${moduleId}`) ?? '{}'));
        if (user?.id) {
          setStatuses(
            JSON.parse(localStorage.getItem(`status_${moduleId}_${user.id}`) ?? '{}')
          );
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setTimeout(() => setBusy(false), 450)); // petit délai pour le loader
  }, [moduleId, site, navigate, user]);

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

  /* ---------------- visite toggle ---------------- */
  const toggleVisited = (id: string) =>
    setVis((prev) => {
      const item = find(id)!;
      if (
        item.requiresValidation &&
        item.validationMode === 'quiz' &&
        !quizPassed[id]
      ) {
        alert('Vous devez réussir le quiz avant de valider cet item.');
        return prev;
      }
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(`visited_${moduleId}`, JSON.stringify(next));

      /* push au backend pour suivi manager */
      if (username) {
        fetch('/api/progress', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ username, moduleId, visited: next }),
        }).catch(console.error);
      }
      return next;
    });

  const markQuizPassed = (id: string) => {
    setQuizPassed(prev => {
      const next = { ...prev, [id]: true };
      localStorage.setItem(`quiz_${moduleId}`, JSON.stringify(next));
      const item = find(id)!;
      if (item.requiresValidation && item.validationMode === 'quiz') {
        changeStatus(id, 'validé');
      }
      return next;
    });
  };

  const changeStatus = (id: string, st: ItemStatus) => {
    setStatuses(prev => {
      const next = { ...prev, [id]: st };
      if (moduleId && user?.id) {
        localStorage.setItem(`status_${moduleId}_${user.id}`, JSON.stringify(next));
        updateItemStatus(user.id, id, st).catch(console.error);
      }
      return next;
    });
  };

  const sendHelp = async (msg: string, email?: string) => {
    if (!helpItemId || !user) return;
    await sendHelpRequest(user.id, helpItemId, msg, email).catch(console.error);
    changeStatus(helpItemId, 'besoin_aide');
    setHelpItemId(null);
  };

  /* ---------------- états spéciaux ---------------- */
  if (busy)      return <Loader />;
  if (!mod)      return <p style={{ padding: '2rem' }}>Module introuvable…</p>;
  if (!items.length)
    return <p style={{ padding: '2rem' }}>Aucun contenu pour votre profil.</p>;

  const item      = find(selected)!;
  const total     = flat.length;
  const completed = visited.filter((id) => flat.some((x) => x.id === id)).length;
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
          visited={visited}
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
          requiresValidation={item.requiresValidation}
          validationMode={item.validationMode}
          isVisited={visited.includes(item.id)}
          onToggleVisited={() => toggleVisited(item.id)}
          isFav={favs.includes(item.id)}
          onToggleFav={() => toggleFav(item.id)}
          status={statuses[item.id] ?? 'non_commencé'}
          onStatusChange={st => changeStatus(item.id, st)}
          onHelpRequest={() => setHelpItemId(item.id)}
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

      <AdvancedHelpEditor
        open={helpItemId !== null}
        onClose={() => setHelpItemId(null)}
        onSubmit={sendHelp}
      />
    </div>
  );
}