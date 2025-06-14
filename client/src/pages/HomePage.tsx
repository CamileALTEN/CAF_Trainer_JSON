/* client/src/pages/HomePage.tsx
   ─────────────────────────────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import { Link } from 'react-router-dom';

import ProgressBar        from '../components/ProgressBar';
import { getModules,
         IModule,
         IItem,
         IProgress }      from '../api/modules';
   import { flatten }        from '../utils/items';
   import { useAuth }        from '../context/AuthContext';
   import './HomePage.css';

   /* ───────── util : filtre profils / enabled ───────── */
   const matchSite = (site?: string) => (it: IItem) =>
     it.enabled &&
     (it.profiles?.length ? it.profiles.includes(site!) : true);

   const filterBySite = (branch: IItem[], site?: string): IItem[] =>
     branch
       .filter(matchSite(site))
       .map(it => ({ ...it, children: filterBySite(it.children ?? [], site) }));

   /* ─────────────────────────────────────────────────── */
   export default function HomePage() {
     const { user } = useAuth();           // ← on connaît le site du CAF
     const site = user?.site;              // « Nantes » | « Montoir » | undefined

    const [modules, setModules] = useState<IModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const [progress, setProgress] = useState<IProgress[]>([]);

    /* charge la liste une seule fois */
    useEffect(() => {
      getModules()
        .then((mods) => {
           if (!Array.isArray(mods)) throw new Error('Réponse inattendue du serveur');

           /* garde seulement les modules actifs et au moins 1 item valable */
           const filtered = mods
             .filter(m => m.enabled)
             .map(m => ({ ...m, items: filterBySite(m.items, site) }))
             .filter(m => flatten(m.items).length > 0);

           setModules(filtered);
         })
         .catch((e) => setError(e.message ?? 'Erreur réseau'))
        .finally(() => setLoading(false));
    }, [site]);

    useEffect(() => {
      if (user) {
        fetch(`/api/progress/${user.username}`)
          .then((r) => r.json())
          .then((rows: IProgress[]) => setProgress(rows))
          .catch(console.error);
      } else {
        setProgress([]);
      }
    }, [user]);

     /* états spéciaux */
     if (loading) return <p style={{ padding: '2rem' }}>Chargement…</p>;
     if (error)   return <p style={{ padding: '2rem', color: '#c00' }}>❌ {error}</p>;
     if (modules.length === 0)
       return <p style={{ padding: '2rem' }}>Aucun module disponible pour votre profil.</p>;

     /* progression globale */
    const totalItems   = modules.reduce(
       (n, m) => n + flatten(m.items).length,
       0,
     );
   const totalVisited = progress.reduce((n, p) => n + p.visited.length, 0);

     /* rendu normal */
     return (
       <div className="home">
         <h1>CAF‑Trainer – Modules</h1>

         {/* ───────── barre principale ───────── */}
         <div className="overall-progress">
           <ProgressBar current={totalVisited} total={Math.max(1, totalItems)} />
         </div>

         <div className="modules-grid">
          {modules.map((m) => {
           const flat = flatten(m.items);
           const row = progress.find(p => p.moduleId === m.id);
           const current = row ? row.visited.length : 0;

             return (
               <div key={m.id} className="module-card">
                 <h2 className="module-title">{m.title}</h2>

                 {/* résumé / description si présent */}
                 {m.summary && (
                   <p
                     className="summary"
                     dangerouslySetInnerHTML={{ __html: m.summary }}
                   />
                 )}

                 {/* ───────── barre du module ───────── */}
                 <div className="module-progress.progress">
                   <ProgressBar
                     current={current}
                     total={Math.max(1, flat.length)}
                   />
                 </div>

                 <Link to={`/modules/${m.id}`} className="module-btn">
                   Accéder
                 </Link>
               </div>
             );
           })}
         </div>
       </div>
     );
   }