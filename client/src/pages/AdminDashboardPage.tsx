/* AdminDashboardPage – gestion complète des comptes
   ───────────────────────────────────────────────── */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminSideMenu from '../components/AdminSideMenu';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import { IUser, Role } from '../api/auth';
import { roleLabel } from '../utils/roleLabels';
import { IModule } from '../api/modules';
import { IAnalytics } from '../api/analytics';
import { ISite, getSites } from '../api/sites';
import { ICafType, getCafTypes } from '../api/cafTypes';
import { getSettings, saveSettings, ISettings } from '../api/settings';
   import './AdminDashboardPage.css';

   export default function AdminDashboardPage() {
   const [users, setUsers] = useState<IUser[]>([]);
  const [modules, setModules] = useState<IModule[]>([]);
  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<IUser[]>([]);
  const [sites, setSites] = useState<ISite[]>([]);
  const [cafTypes, setCafTypes] = useState<ICafType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Role>('caf');
  const [editSite, setEditSite] = useState('');     // site CAF
  const [editCafTypeId, setEditCafTypeId] = useState('1');
  const [editSites, setEditSites] = useState<string[]>([]); // sites manager
  const [editManagerIds, setEditManagerIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<ISettings | null>(null);

   const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

  /* ───────── chargement initial ───────── */
  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/modules').then(r => r.json()),
      fetch('/api/analytics').then(r => r.json()),
    ])
      .then(([u, m, a]) => {
        const mods: IModule[] =
          Array.isArray(m) ? m :
          m && typeof m === 'object' && Array.isArray((m as any).modules) ? (m as any).modules : [];
        setUsers(u);
        setManagers(u.filter((x: IUser) => x.role === 'manager'));
        setModules(mods);
        setAnalytics(a as IAnalytics);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getSites().then(setSites);
  }, []);
  useEffect(() => {
    getCafTypes().then(setCafTypes);
  }, []);
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

     /* ───────── helpers ───────── */
     const deleteUser = async (id: string) => {
       if (!window.confirm('Supprimer ce compte ?')) return;
       await fetch(`/api/users/${id}`, { method: 'DELETE' });
       setUsers(prev => prev.filter(u => u.id !== id));
     };

     const resetPwd = async (id: string) => {
       const pwd = prompt('Nouveau mot de passe :');
       if (!pwd) return;
       await fetch(`/api/users/${id}/password`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ password: pwd }),
       });
       alert('Mot de passe modifié');
     };

    const startEdit = (u: IUser) => {
      setEditingId(u.id);
      setEditUsername(u.username);
      setEditRole(u.role);
      setEditSite(u.site || sites[0]?.name || '');
      setEditCafTypeId(u.cafTypeId ?? '1');
      setEditSites(u.sites || []);
      setEditManagerIds(u.managerIds || []);
    };

    const toggleEditSite = (value: string) => {
      setEditSites(prev =>
        prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
      );
    };

  const toggleEditManager = (id: string) => {
    setEditManagerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleMail = async () => {
    if (!settings) return;
    const updated = await saveSettings({ mailEnabled: !settings.mailEnabled });
    setSettings(updated);
  };

    const saveEdit = async (id: string) => {
      if (!mailRx.test(editUsername)) return alert('Email invalide');

      const orig = users.find(u => u.id === id);
      const body = {
        username: editUsername,
        role: editRole,
        site: editRole === 'caf' ? editSite : undefined,
        cafTypeId:
          editRole === 'caf'
            ? editCafTypeId || orig?.cafTypeId || '1'
            : undefined,
        sites: editRole === 'manager' ? editSites : undefined,
        managerIds: editRole === 'caf' ? editManagerIds : undefined,
      };

      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setUsers(prev => prev.map(x => (x.id === data.id ? data : x)));
      setEditingId(null);
    };

     /* ───────── rendu ───────── */
  if (loading || !analytics) return <div className="admin-dashboard"><p>Chargement…</p></div>;

     // Tri des utilisateurs par rôle : admin → manager → caf
     const rolePriority: Record<string, number> = { admin: 0, manager: 1, caf: 2 };
     const sortedUsers = [...users].sort((a, b) => {
       const pa = rolePriority[a.role] ?? 3;
       const pb = rolePriority[b.role] ?? 3;
       if (pa !== pb) return pa - pb;
       return a.username.localeCompare(b.username);
     });


    const COLORS = ['#043962', '#008bd2', '#00c49f'];

  const siteData = analytics.sites.map(s => ({ name: s.site, value: s.count }));
  const favMax = Math.max(...analytics.favorites.map(f => f.count), 0);
  const favTicks = Array.from({ length: favMax + 1 }, (_, i) => i);

     return (
      <div className="admin-dashboard">
        <h1>Tableau de bord admin</h1>
        
        <AdminSideMenu />
        <h2>Statistiques</h2>
        <section className="analytics-grid">
          <Stat label="Comptes" value={analytics.counts.accounts} />
          <Stat label="Modules" value={analytics.counts.modules} />
          <Stat label="Items" value={analytics.counts.items} />
          <Stat label="Visiteurs aujourd’hui" value={analytics.visitors.today} />
          <Stat label="Visiteurs semaine" value={analytics.visitors.week} />
          <Stat label={`Visiteurs ${analytics.visitors.month.label}`} value={analytics.visitors.month.count} />
          <Stat label="Durée CAF (min)" value={Math.round(analytics.sessions.avgDurationCaf)} />
          <Stat label="Durée référent (min)" value={Math.round(analytics.sessions.avgDurationManager)} />
        </section>

        <section className="chart-area">
          <h3>Connexion par heure (100 dernières sessions)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.sessions.byHour}>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              {(() => {
                const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
                return <YAxis ticks={ticks} domain={[0, 100]} allowDecimals={false} />;
              })()}
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="chart-area">
          <h3>Favoris CAF</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.favorites}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis ticks={favTicks} domain={[0, favMax]} allowDecimals={false} />
              <Tooltip formatter={(val:number, _name:string, entry:any)=>[val]} />
              <Bar dataKey="count" fill="#82ca9d">
                
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>


        <section className="chart-area">
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
        </section>



         <h2>Comptes</h2>
         <table>
           <thead>
            <tr><th>User 👤</th><th>Rôle 💬</th><th>Site📍</th><th>Type</th><th>Référent 👨‍💼</th><th/></tr>
           </thead>
           <tbody>
            {sortedUsers.map(u => (
              editingId === u.id ? (
                <tr key={u.id} className="edit-form">
                  <td>
                    <input
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as Role)}
                    >
                      <option value="admin">admin</option>
                      <option value="manager">référent</option>
                      <option value="caf">caf</option>
                    </select>
                  </td>
                  <td>
                    {editRole === 'caf' ? (
                      <select value={editSite} onChange={e => setEditSite(e.target.value)}>
                        {sites.map(s => (
                          <option key={s.id}>{s.name}</option>
                        ))}
                      </select>
                    ) : editRole === 'manager' ? (
                      <div className="check">
                        {sites.map(s => (
                          <label key={s.id}>
                            <input type="checkbox" value={s.name} checked={editSites.includes(s.name)} onChange={e=>toggleEditSite(e.target.value)} /> {s.name}
                          </label>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    {editRole === 'caf' ? (
                      <select value={editCafTypeId} onChange={e=>setEditCafTypeId(e.target.value)}>
                        {cafTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : '—'}
                  </td>
                  <td>
                    {editRole === 'caf' ? (
                      <div className="check">
                        {managers.map(m => (
                          <label key={m.id}>
                            <input type="checkbox" value={m.id} checked={editManagerIds.includes(m.id)} onChange={e=>toggleEditManager(e.target.value)} /> {m.username}
                          </label>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => saveEdit(u.id)}>💾</button>{' '}
                    <button onClick={() => setEditingId(null)}>✖️</button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>{u.role === 'manager' ? u.sites?.join(', ') ?? '—' : u.site ?? '—'}</td>
                  <td>{u.role === 'caf' ? cafTypes.find(t=>t.id===u.cafTypeId)?.name || '—' : '—'}</td>
                  <td>{u.role === 'caf' ?
                        (u.managerIds?.map(id => users.find(m => m.id === id)?.username || id).join(', ') || '—')
                        : '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => startEdit(u)} title="Modifier">✏️</button>{' '}
                    <button onClick={() => resetPwd(u.id)} title="Réinit. MDP">🔑</button>{' '}
                    {u.role === 'caf' && <button onClick={() => deleteUser(u.id)} title="Supprimer">🗑️</button>}
                    {u.role === 'manager' && <button onClick={() => deleteUser(u.id)} title="Supprimer">🗑️</button>}
                    {u.role === 'admin' && <button onClick={() => deleteUser(u.id)} title="Supprimer">🗑️</button>}
                  </td>
                </tr>
              )
            ))}
           </tbody>
         </table>
         <div className="mail-switch">
          <span>Mailing</span>
          <label className="switch">
            <input type="checkbox" checked={settings?.mailEnabled ?? true} onChange={toggleMail} />
            <span className="slider" />
          </label>
        </div>
       </div>
     );
   }

   const Stat = ({ label, value }: { label: string; value: number }) => (
     <div className="card">
       <h3>{label}</h3>
       <p className="big">{value}</p>
     </div>
   );