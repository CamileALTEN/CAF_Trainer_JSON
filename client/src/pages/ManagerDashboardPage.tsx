/* client/src/pages/ManagerDashboardPage.tsx
   ────────────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import { useAuth }   from '../context/AuthContext';
   import styled        from 'styled-components';
   import { IUser }     from '../api/auth';
  import { IProgress, IModule, getModules } from '../api/modules';
  import ProgressBar   from '../components/ProgressBar';
  import { Link }      from 'react-router-dom';
  import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

   export default function ManagerDashboardPage() {
    const { user } = useAuth();               // rôle == manager
    const [caf,setCaf]         = useState<IUser[]>([]);
    const [prog,setProg]       = useState<IProgress[]>([]);
    const [mods,setMods]       = useState<IModule[]>([]);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
      Promise.all([
        fetch(`/api/users?managerId=${user!.id}`).then(r=>r.json()),
        fetch(`/api/progress?managerId=${user!.id}`).then(r=>r.json()),
        getModules(),
      ]).then(([u,p,m])=>{ setCaf(u); setProg(p); setMods(m); })
        .finally(()=>setLoading(false));
    },[user]);

    /* répartition par site */
    const siteMap = caf.reduce<Record<string, number>>((acc, c) => {
      const site = c.site || '—';
      acc[site] = (acc[site] || 0) + 1;
      return acc;
    }, {});
    const siteData = Object.entries(siteMap).map(([name, value]) => ({ name, value }));

    /* progression globale */
    const itemsPerUser = mods.reduce((n,m)=> n + (m.items?.length ?? 0), 0);
    const totalPossible = itemsPerUser * caf.length;
    const totalVisited = prog.reduce((n,p)=> n + p.visited.length, 0);

     if(loading) return <p style={{padding:'2rem'}}>Chargement…</p>;

     return (
       <Wrapper>
         <h1>Dashboard manager</h1>

        <section className="cards">
          <StatCard label="CAF supervisés" value={caf.length} />
          <div className="card">
            <h3>Répartition par site</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={siteData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {siteData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ----------- actions rapides ----------- */}
       <div className="quick-wheel">
         <button className="center">☰</button>
         <Link to="/manager/create" className="btn" title="Créer un compte CAF">
           <span>➕</span><span className="label">Créer</span>
         </Link>
         <Link to="/manager/modules" className="btn" title="Modules">
           <span>📝</span><span className="label">Modules</span>
         </Link>
         <Link to="/manager/tickets" className="btn" title="Tickets">
           <span>📋</span><span className="label">Tickets</span>
         </Link>
         <Link to="/manager/checklist-url" className="btn" title="Checklist">
           <span>🔗</span><span className="label">Checklist</span>
         </Link>
         <Link to="/manager/progress" className="btn" title="Progression">
           <span>📊</span><span className="label">Progression</span>
         </Link>
       </div>

        <div className="card progress-card">
          <h3>Avancée globale</h3>
          <ProgressBar current={totalVisited} total={totalPossible} />
        </div>

         <h2>Changer un mot de passe</h2>
         <table>
           <thead><tr><th>Utilisateur</th><th>Site</th><th>Réinit. MDP</th></tr></thead>
           <tbody>
             {caf.map(c=>(
               <tr key={c.id}>
                 <td>{c.username}</td><td>{c.site}</td>
                 <td>
                   <button onClick={()=>resetPwd(c.id)}>🔑</button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </Wrapper>
     );

     async function resetPwd(id:string){
       const pwd = prompt('Nouveau mot de passe :');
       if(!pwd) return;
       await fetch(`/api/users/${id}/password`,{
         method:'PATCH',
         headers:{'Content-Type':'application/json'},
         body:JSON.stringify({password:pwd}),
       });
       alert('Mot de passe modifié');
     }
   }

   const StatCard = ({label,value}:{label:string;value:number})=>(
     <div className="card"><h3>{label}</h3><p className="big">{value}</p></div>
   );

   const Wrapper = styled.div`
     padding:1.5rem;
     max-width:960px;
     margin:auto;
     .cards{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
     .card{background:#f9f9f9;padding:1rem;border-radius:8px;text-align:center;
           box-shadow:0 1px 3px rgba(0,0,0,.1);width:100%}
     .progress-card{margin-bottom:1.5rem}
     .big{font-size:2rem;font-weight:bold;color:#008BD2;margin-top:.5rem}
   
    /* ---- actions rapides (roue) ---- */
    .quick-wheel{position:fixed;bottom:1.5rem;right:1.5rem;width:220px;height:220px;}
    .quick-wheel .center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;background:#008bd2;color:#fff;border:none;width:48px;height:48px;border-radius:50%;}
    .quick-wheel a{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);background:#008bd2;color:#fff;border-radius:50%;width:72px;height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;font-size:1.2rem;opacity:0;transition:transform .3s,opacity .3s;}
    .quick-wheel a span.label{font-size:.65rem;margin-top:2px;}
    .quick-wheel:hover a{opacity:1;transform:translate(-50%,-50%) scale(1);}
    .quick-wheel:hover a:nth-child(2){transform:translate(-50%,-50%) rotate(0deg) translate(100px) rotate(0deg);}
    .quick-wheel:hover a:nth-child(3){transform:translate(-50%,-50%) rotate(72deg) translate(100px) rotate(-72deg);}
    .quick-wheel:hover a:nth-child(4){transform:translate(-50%,-50%) rotate(144deg) translate(100px) rotate(-144deg);}
    .quick-wheel:hover a:nth-child(5){transform:translate(-50%,-50%) rotate(216deg) translate(100px) rotate(-216deg);}
    .quick-wheel:hover a:nth-child(6){transform:translate(-50%,-50%) rotate(288deg) translate(100px) rotate(-288deg);}
    .btn{background:#008bd2;color:#fff;border:none;border-radius:50%;width:72px;height:72px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-decoration:none;}
    .btn:hover{background:#006fa1}
   
     table{width:100%;border-collapse:collapse;margin-top:1rem}
     th,td{border-bottom:1px solid #e0e0e0;padding:.5rem .75rem}
  `;