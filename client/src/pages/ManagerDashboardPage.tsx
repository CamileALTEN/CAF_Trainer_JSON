/* client/src/pages/ManagerDashboardPage.tsx
   ────────────────────────────────────────── */
   import React, { useEffect, useState } from 'react';
   import { useAuth }   from '../context/AuthContext';
   import { IUser }     from '../api/auth';
  import { IProgress, IModule, getModules } from '../api/modules';
  import ProgressBar   from '../components/ProgressBar';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import CircleMenu from '../components/CircleMenu';
import { ICafType, getCafTypes } from '../api/cafTypes';
import { IAnalytics, getAnalytics } from '../api/analytics';
import './ManagerDashboardPage.css';
const COLORS = ['#043962', '#008bd2', '#00c49f'];

   export default function ManagerDashboardPage() {
  const { user } = useAuth();               // rôle == manager
  const [caf,setCaf]         = useState<IUser[]>([]);
  const [prog,setProg]       = useState<IProgress[]>([]);
  const [mods,setMods]       = useState<IModule[]>([]);
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [loading,setLoading] = useState(true);
  const [cafTypes, setCafTypes] = useState<ICafType[]>([]);

    useEffect(()=>{
      Promise.all([
        fetch(`/api/users?managerId=${user!.id}`).then(r=>r.json()),
        fetch(`/api/progress?managerId=${user!.id}`).then(r=>r.json()),
        getModules(),
        getAnalytics(),
      ]).then(([u,p,m,a])=>{ setCaf(u); setProg(p); setMods(m); setAnalytics(a); })
        .finally(()=>setLoading(false));
    },[user]);
    useEffect(()=>{ getCafTypes().then(setCafTypes); },[]);

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

    const favMax = Math.max(...(analytics?.favorites.map(f => f.count) || [0]));
    const favTicks = Array.from({ length: favMax + 1 }, (_, i) => i);

     if(loading || !analytics) return <p style={{padding:'2rem'}}>Chargement…</p>;

     return (
       <div className="manager-dashboard">
         <h1>Dashboard manager</h1>

        <section className="cards">
          <StatCard label="CAF supervisés" value={caf.length} />
          <div className="card">
            <h3>Répartition par site</h3>
            <ResponsiveContainer width="100%" height={300}>
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
      <CircleMenu />

        <div className="card progress-card">
          <h3>Avancée globale</h3>
          <ProgressBar current={totalVisited} total={totalPossible} />
        </div>

        <section className="chart-area">
          <h3>Favoris CAF</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.favorites}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis ticks={favTicks} domain={[0, favMax]} allowDecimals={false} />
              <Tooltip formatter={(val:number)=>[val]} />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </section>

         <h2>Changer un mot de passe</h2>
         <table>
           <thead><tr><th>Utilisateur</th><th>Site</th><th>Type</th><th>Réinit. MDP</th></tr></thead>
           <tbody>
            {caf.map(c=>(
              <tr key={c.id}>
                <td>{c.username}</td><td>{c.site}</td>
                <td>
                  <select value={c.cafTypeId ?? '1'} onChange={e=>changeType(c.id, e.target.value)}>
                    {cafTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
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

  async function changeType(id: string, typeId: string) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cafTypeId: typeId }),
    });
    setCaf(prev => prev.map(c => c.id === id ? { ...c, cafTypeId: typeId } : c));
  }
   }

  const StatCard = ({label,value}:{label:string;value:number})=>(
    <div className="card"><h3>{label}</h3><p className="big">{value}</p></div>
  );
