/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import SidebarMenu    from '../components/SidebarMenu';
   import ItemContent    from '../components/ItemContent';
import ProgressBar    from '../components/ProgressBar';
import { flatten, findById } from '../utils/items';
import { getModule, IItem, IModule, ItemStatus } from '../api/modules';
   import { useAuth }     from '../context/AuthContext';
   import './PrerequisPage.css';

   export default function PrerequisPage() {
     const MODULE_ID = 'prerequis';
     const { user }  = useAuth();
     const favKey    = `favs_${user?.username}`;

     const [mod, setMod]            = useState<IModule | null>(null);
     const [selectedId, setSelId ]  = useState<string>('');
    const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
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
    const updateStatus = (id: string, st: ItemStatus) =>
      setStatuses(prev => {
        if (st === 'to_validate') {
          fetch('/api/validations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user?.username, moduleId: MODULE_ID, itemId: id }),
          }).catch(console.error);
        }
        const next = { ...prev, [id]: st };
        localStorage.setItem(`status_${MODULE_ID}`, JSON.stringify(next));
        return next;
      });

    const requestValidation = (id: string) => updateStatus(id, 'to_validate');

    const requestHelp = (id: string) => {
      const message = prompt('Décrivez votre problème :');
      if (!message) return;
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          target: 'manager',
          title: `Besoin d'aide sur ${findById(mod!.items, id)?.title}`,
          message,
          category: 'help',
        }),
      }).catch(console.error);
      updateStatus(id, 'need_help');
    };

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
           visited={Object.keys(statuses).filter(
             k => statuses[k] === 'validated' || statuses[k] === 'auto_done'
           )}
         />

         <main className="content-area">
           <ProgressBar
             current={Object.values(statuses).filter(
               s => s === 'validated' || s === 'auto_done'
             ).length}
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
               validationRequired={item.validationRequired}
               validationType={item.validationType}
               onRequestValidation={() => requestValidation(item.id)}
               onRequestHelp={() => requestHelp(item.id)}
               status={statuses[item.id] ?? 'not_started'}
               onStatusChange={(s) => updateStatus(item.id, s)}
               isFav={favs.includes(item.id)}
               onToggleFav={() => toggleFav(item.id)}
             />
          )}
         </main>
       </div>
     );
   }