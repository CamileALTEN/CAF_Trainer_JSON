/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
import SidebarMenu    from '../components/SidebarMenu';
import ItemContent    from '../components/ItemContent';
import ProgressBar    from '../components/ProgressBar';
import { getProgress, updateItemState, ProgressState } from '../api/progress';
   import { flatten, findById } from '../utils/items';
   import { getModule, IItem, IModule } from '../api/modules';
   import { useAuth }     from '../context/AuthContext';
   import './PrerequisPage.css';

   export default function PrerequisPage() {
     const MODULE_ID = 'prerequis';
     const { user }  = useAuth();
     const favKey    = `favs_${user?.username}`;

     const [mod, setMod]            = useState<IModule | null>(null);
    const [selectedId, setSelId ]  = useState<string>('');
    const [states, setStates] = useState<Record<string, ProgressState>>({});
     const [favs, setFavs] = useState<string[]>(
       () => JSON.parse(localStorage.getItem(favKey) ?? '[]'),
     );

     /* ---------- chargement module ---------- */
     useEffect(() => {
       Promise.all([getModule(MODULE_ID), user ? getProgress(user.username) : Promise.resolve([])])
         .then(([m, prog]) => {
           setMod(m);
           setSelId(m.items[0]?.id ?? '');
           const row = prog.find(p => p.moduleId === MODULE_ID);
           setStates(row?.states ?? {});
         });
     }, []);

     /* ---------- helpers ---------- */
    const setItemState = (id: string, st: ProgressState) =>
      setStates((prev) => {
        const next = { ...prev, [id]: st };
        if (user) updateItemState(user.username, MODULE_ID, id, st).catch(console.error);
        return next;
      });

     const toggleFav = (id: string) =>
       setFavs((prev) => {
         const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
         localStorage.setItem(favKey, JSON.stringify(next));
         return next;
       });

     /* ---------- rendu ---------- */
     if (!mod) return <p>Chargement…</p>;
     const item = findById(mod.items, selectedId);

     return (
       <div className="prerequis-page">
        <SidebarMenu
          items={mod.items}
          selected={selectedId}
          onSelect={setSelId}
          states={states}
        />

         <main className="content-area">
          <ProgressBar
            current={Object.values(states).filter(s => s==='finished' || s==='validated').length}
            total={flatten(mod.items).length}
          />

           {item && (
           <ItemContent
              title={item.title}
              subtitle={item.subtitle}
              images={item.images}
              description={item.content}
              links={item.links}

              videos={item.videos}
              state={states[item.id] ?? 'not-started'}
              onChangeState={(st) => setItemState(item.id, st)}
              hasQuiz={item.quiz}
              isFav={favs.includes(item.id)}
              onToggleFav={() => toggleFav(item.id)}
            />
           )}
         </main>
       </div>
     );
   }
