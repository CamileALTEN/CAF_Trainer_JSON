/* client/src/pages/PrerequisPage.tsx
   ────────────────────────────────── */
import React, { useEffect, useState } from 'react';
import SidebarMenu    from '../components/SidebarMenu';
import ItemContent    from '../components/ItemContent';
import ProgressBar    from '../components/ProgressBar';
import AdvancedHelpEditor from '../components/AdvancedHelpEditor';
   import { flatten, findById } from '../utils/items';
import { getModule, IItem, IModule } from '../api/modules';
import { ItemStatus, updateItemStatus, sendHelpRequest } from '../api/userProgress';
   import { useAuth }     from '../context/AuthContext';
   import './PrerequisPage.css';

   export default function PrerequisPage() {
     const MODULE_ID = 'prerequis';
     const { user }  = useAuth();
     const favKey    = `favs_${user?.username}`;

     const [mod, setMod]            = useState<IModule | null>(null);
     const [selectedId, setSelId ]  = useState<string>('');
     const [visitedIds, setVisited] = useState<string[]>(
       () => JSON.parse(localStorage.getItem(`visited_${MODULE_ID}`) ?? '[]'),
     );
    const [favs, setFavs] = useState<string[]>(
      () => JSON.parse(localStorage.getItem(favKey) ?? '[]'),
    );
    const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(() =>
      JSON.parse(localStorage.getItem(`status_${MODULE_ID}_${user?.id}`) ?? '{}')
    );
    const [helpItemId, setHelpItemId] = useState<string | null>(null);

     /* ---------- chargement module ---------- */
     useEffect(() => {
       getModule(MODULE_ID).then((m) => {
         setMod(m);
         setSelId(m.items[0]?.id ?? '');
       });
     }, []);

     /* ---------- helpers ---------- */

    const toggleFav = (id: string) =>
      setFavs((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem(favKey, JSON.stringify(next));
        return next;
      });

    const changeStatus = (id: string, st: ItemStatus) => {
      setStatuses(prev => {
        const next = { ...prev, [id]: st };
        if (user?.id) {
          localStorage.setItem(`status_${MODULE_ID}_${user.id}`, JSON.stringify(next));
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

     /* ---------- rendu ---------- */
     if (!mod) return <p>Chargement…</p>;
     const item = findById(mod.items, selectedId);

     return (
       <div className="prerequis-page">
         <SidebarMenu
           items={mod.items}
           selected={selectedId}
           onSelect={setSelId}
           visited={visitedIds}
         />

         <main className="content-area">
           <ProgressBar
             current={Object.values(statuses).filter(s => s === 'terminé' || s === 'validé').length}
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
              requiresValidation={item.requiresValidation}
              validationMode={item.validationMode}
              isFav={favs.includes(item.id)}
              onToggleFav={() => toggleFav(item.id)}
              status={statuses[item.id] ?? 'non_commencé'}
              onStatusChange={st => changeStatus(item.id, st)}
              onHelpRequest={() => setHelpItemId(item.id)}
            />
          )}
        </main>
        <AdvancedHelpEditor
          open={helpItemId !== null}
          onClose={() => setHelpItemId(null)}
          onSubmit={sendHelp}
        />
      </div>
    );
  }
