/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import SidebarMenu    from '../components/SidebarMenu';
   import ItemContent, { ItemStatus }    from '../components/ItemContent';
   import ProgressBar    from '../components/ProgressBar';
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
     const [status, setStatus] = useState<Record<string, ItemStatus>>(
       () => JSON.parse(localStorage.getItem(`status_${MODULE_ID}`) ?? '{}'),
     );
     const [favs, setFavs] = useState<string[]>(
       () => JSON.parse(localStorage.getItem(favKey) ?? '[]'),
     );

     /* ---------- chargement module ---------- */
     useEffect(() => {
       getModule(MODULE_ID).then((m) => {
         setMod(m);
         setSelId(m.items[0]?.id ?? '');
       });
     }, []);

     /* ---------- helpers ---------- */
     const changeStatus = (id: string, s: ItemStatus) =>
       setStatus((prev) => {
         const next = { ...prev, [id]: s };
         localStorage.setItem(`status_${MODULE_ID}`, JSON.stringify(next));
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