/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import SidebarMenu    from '../components/SidebarMenu';
   import ItemContent, { ItemStatus }    from '../components/ItemContent';
   import ProgressBar    from '../components/ProgressBar';
   import { flatten, findById } from '../utils/items';
   import { getModule, IItem, IModule, IProgress } from '../api/modules';
   import { useAuth }     from '../context/AuthContext';
   import './PrerequisPage.css';

   export default function PrerequisPage() {
     const MODULE_ID = 'prerequis';
     const { user }  = useAuth();
     const favKey    = `favs_${user?.username}`;

     const [mod, setMod]            = useState<IModule | null>(null);
     const [selectedId, setSelId ]  = useState<string>('');
    const [status, setStatus] = useState<Record<string, ItemStatus>>({});
     const [favs, setFavs] = useState<string[]>(
       () => JSON.parse(localStorage.getItem(favKey) ?? '[]'),
     );

     /* ---------- chargement module ---------- */
    useEffect(() => {
      getModule(MODULE_ID).then((m) => {
        setMod(m);
        setSelId(m.items[0]?.id ?? '');
        if (user) {
          fetch(`/api/progress/${user.username}`)
            .then(r => r.json())
            .then((rows: IProgress[]) => {
              const row = rows.find(p => p.moduleId === MODULE_ID);
              if (!row) return;
              const st: Record<string, ItemStatus> = {};
              row.started.forEach(id => { st[id] = 'in-progress'; });
              row.needValidation?.forEach(id => { st[id] = 'need-validation'; });
              row.visited.forEach(id => { st[id] = 'done'; });
              setStatus(st);
            })
            .catch(console.error);
        }
      });
    }, [user]);

     /* ---------- helpers ---------- */
    const changeStatus = (id: string, s: ItemStatus) =>
      setStatus((prev) => {
        const next = { ...prev, [id]: s };
        if (user) {
          const entries = Object.entries(next);
          const visited = entries.filter(([,st])=>st==='done').map(([k])=>k);
          const needValidation = entries.filter(([,st])=>st==='need-validation').map(([k])=>k);
          const started = entries.filter(([,st])=>st==='in-progress').map(([k])=>k);
          fetch('/api/progress', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, moduleId: MODULE_ID, visited, started, needValidation }),
          }).catch(console.error);
        }
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
           visited={Object.entries(status).filter(([,s])=>s==='done').map(([k])=>k)}
         />

         <main className="content-area">
           <ProgressBar
             current={Object.values(status).filter(s=>s==='done').length}
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
              needValidation={item.needValidation}
              status={status[item.id] ?? 'new'}
              onStatusChange={(s)=>changeStatus(item.id,s)}
              isFav={favs.includes(item.id)}
              onToggleFav={() => toggleFav(item.id)}
            />
           )}
         </main>
       </div>
     );
   }