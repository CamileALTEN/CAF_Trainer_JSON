/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
import SidebarMenu    from '../components/SidebarMenu';
import ItemContent    from '../components/ItemContent';
import ProgressBar    from '../components/ProgressBar';
import { flatten, findById } from '../utils/items';
import { getModule, IItem, IModule, ProgressState, IProgress } from '../api/modules';
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
    getModule(MODULE_ID).then((m) => {
      setMod(m);
      setSelId(m.items[0]?.id ?? '');
    });
    if(user){
      fetch(`/api/progress/${user.username}`)
        .then(r=>r.json())
        .then((rows:IProgress[])=>{
          const row = rows.find(r=>r.moduleId===MODULE_ID);
          setStates(row?.states ?? {});
        }).catch(()=>{});
    }
  }, [user]);

  /* ---------- helpers ---------- */
  const changeState = (id: string, st: ProgressState) =>
    setStates(prev => {
      const next = { ...prev, [id]: st };
      if(user){
        fetch('/api/progress',{
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({username:user.username,moduleId:MODULE_ID,itemId:id,state:st})
        }).catch(()=>{});
      }
      return next;
    });

  useEffect(() => {
    const st = states[selectedId];
    if(selectedId && (!st || st === 'not_started')){
      changeState(selectedId,'in_progress');
    }
  }, [selectedId]);

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
            current={Object.values(states).filter(st=>st==='finished'||st==='validated').length}
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
             state={states[item.id] ?? 'not_started'}
             onChangeState={(st)=>changeState(item.id, st)}
             isFav={favs.includes(item.id)}
             onToggleFav={() => toggleFav(item.id)}
             />
           )}
         </main>
       </div>
     );
   }