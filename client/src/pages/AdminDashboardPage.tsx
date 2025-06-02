/* AdminDashboardPage – gestion complète des comptes
   ───────────────────────────────────────────────── */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
   import { IUser, Role } from '../api/auth';
   import { IModule } from '../api/modules';
   import './AdminDashboardPage.css';

   export default function AdminDashboardPage() {
   const [users, setUsers] = useState<IUser[]>([]);
   const [modules, setModules] = useState<IModule[]>([]);
   const [loading, setLoading] = useState(true);
   const [managers, setManagers] = useState<IUser[]>([]);
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editUsername, setEditUsername] = useState('');
   const [editRole, setEditRole] = useState<Role>('caf');
   const [editSite, setEditSite] = useState('Nantes');
   const [editManagerIds, setEditManagerIds] = useState<string[]>([]);

   const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

     /* ───────── chargement initial ───────── */
     useEffect(() => {
       Promise.all([
         fetch('/api/users').then(r => r.json()),
         fetch('/api/modules').then(r => r.json()),
       ])
         .then(([u, m]) => {
           const mods: IModule[] =
             Array.isArray(m) ? m :
             m && typeof m === 'object' && Array.isArray((m as any).modules) ? (m as any).modules : [];
           setUsers(u);
           setManagers(u.filter((x: IUser) => x.role === 'manager'));
           setModules(mods);
         })
         .finally(() => setLoading(false));
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
      setEditSite(u.site || 'Nantes');
      setEditManagerIds(u.managerIds || []);
    };

    const saveEdit = async (id: string) => {
      if (!mailRx.test(editUsername)) return alert('Email invalide');

      const body = {
        username: editUsername,
        role: editRole,
        site: editRole === 'caf' || editRole === 'manager' ? editSite : undefined,
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
     if (loading) return <div className="admin-dashboard"><p>Chargement…</p></div>;

     // Tri des utilisateurs par rôle : admin → manager → caf
     const rolePriority: Record<string, number> = { admin: 0, manager: 1, caf: 2 };
     const sortedUsers = [...users].sort((a, b) => {
       const pa = rolePriority[a.role] ?? 3;
       const pb = rolePriority[b.role] ?? 3;
       if (pa !== pb) return pa - pb;
       return a.username.localeCompare(b.username);
     });

    const totalItems = modules.reduce((n, m) => n + (m.items?.length ?? 0), 0);

    // distribution des rôles pour le graphique
    const roleData = [
      { name: 'admin',   value: users.filter(u => u.role === 'admin').length },
      { name: 'manager', value: users.filter(u => u.role === 'manager').length },
      { name: 'caf',     value: users.filter(u => u.role === 'caf').length },
    ];
    const COLORS = ['#043962', '#008bd2', '#00c49f'];

     return (
       <div className="admin-dashboard">
         <h1>Tableau de bord admin</h1>

        <section className="cards">
          <Stat label="Comptes" value={users.length} />
          <Stat label="Modules" value={modules.length} />
          <Stat label="Items" value={totalItems} />
        </section>

        <section className="chart-area">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={80}>
                {roleData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <div className="quick">
          <Link to="/admin/create"><button>+ Créer un compte</button></Link>
          <Link to="/admin/modules"><button>📝 Modules</button></Link>
        <Link to="/admin/notifications"><button>🔔 Notifications</button></Link>
        <Link to="/admin/tickets"><button>📋 Tickets</button></Link>
        <Link to="/admin/checklist-url"><button>URL Checklist 📋</button></Link>
      </div>

         <h2>Comptes</h2>
         <table>
           <thead>
             <tr><th>User</th><th>Rôle</th><th>Site</th><th>Manager</th><th/></tr>
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
                      <option value="manager">manager</option>
                      <option value="caf">caf</option>
                    </select>
                  </td>
                  <td>
                    {editRole === 'caf' || editRole === 'manager' ? (
                      <select value={editSite} onChange={e => setEditSite(e.target.value)}>
                        <option>Nantes</option>
                        <option>Montoir</option>
                      </select>
                    ) : '—'}
                  </td>
                  <td>
                    {editRole === 'caf' ? (
                      <select
                        multiple
                        value={editManagerIds}
                        onChange={e =>
                          setEditManagerIds(Array.from(e.target.selectedOptions).map(o => o.value))
                        }
                      >
                        {managers.map(m => (
                          <option key={m.id} value={m.id}>{m.username}</option>
                        ))}
                      </select>
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
                  <td>{u.role}</td>
                  <td>{u.site ?? '—'}</td>
                  <td>
                    {u.managerIds && u.managerIds.length > 0
                      ? u.managerIds
                          .map(id => users.find(m => m.id === id)?.username || id)
                          .join(', ')
                      : '—'}
                  </td>
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
       </div>
     );
   }

   const Stat = ({ label, value }: { label: string; value: number }) => (
     <div className="card">
       <h3>{label}</h3>
       <p className="big">{value}</p>
     </div>
   );