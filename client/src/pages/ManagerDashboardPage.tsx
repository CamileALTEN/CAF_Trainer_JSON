/* client/src/pages/ManagerDashboardPage.tsx
   ────────────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import { useAuth }   from '../context/AuthContext';
   import { IUser }     from '../api/auth';
  import { IProgress, IModule, getModules } from '../api/modules';
  import ProgressBar   from '../components/ProgressBar';
  import { Link }      from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import './ManagerDashboardPage.css';
const COLORS = ['#043962', '#008bd2', '#00c49f'];

   export default function ManagerDashboardPage() {
  const { user } = useAuth();               // rôle == manager
  const [caf,setCaf]         = useState<IUser[]>([]);
  const [prog,setProg]       = useState<IProgress[]>([]);
  const [mods,setMods]       = useState<IModule[]>([]);
  const [loading,setLoading] = useState(true);
  const [wheelOpen,setWheelOpen] = useState(false);

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
       <div className="manager-dashboard">
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
       <div className={`quick-wheel${wheelOpen ? ' open' : ''}`}>
         <button className="center" onClick={() => setWheelOpen(o => !o)}>☰</button>
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
       </div>
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
