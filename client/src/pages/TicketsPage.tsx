import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IUser } from '../api/auth';
import { ITicket, TicketStatus, TicketPriority, replyTicket, getTickets, updateTicket } from '../api/tickets';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'admin' | 'manager' | 'both'>('manager');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    getTickets({ username: user.username, role: user.role, managerId: user.managerId })
      .then(setTickets)
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'caf') {
      fetch('/api/users')
        .then(r => r.json())
        .then(setAllUsers)
        .catch(console.error);
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload: any = {
      username: user.username,
      target,
      title,
      message,
      category,
      priority,
    };
    if (attachment) {
      const base64 = await fileToBase64(attachment);
      payload.attachment = base64;
    }
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setTickets(prev => [...prev, data]);
    setTitle('');
    setMessage('');
  };

  const changeStatus = async (id: string, status: TicketStatus) => {
    const data = await updateTicket(id, { status });
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  const assign = async (id: string, assigneeId: string) => {
    if (!user) return;
    const data = await updateTicket(id, { assignedToId: assigneeId, author: user.username, role: user.role });
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Tickets</h2>
      <div className="filters">
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Statut</option>
          <option value="open">Ouvert</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="closed">Fermé</option>
        </select>
        <input placeholder="Catégorie" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} />
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
          <option value="">Priorité</option>
          <option value="low">Faible</option>
          <option value="normal">Normal</option>
          <option value="high">Élevée</option>
        </select>
      </div>
      {user?.role === 'caf' && (
        <form className="new-ticket" onSubmit={submit}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre"
            required
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Message"
            required
          />
          <input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="Catégorie"
          />
          <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}>
            <option value="low">Faible</option>
            <option value="normal">Normal</option>
            <option value="high">Élevée</option>
          </select>
          <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} />
          <select value={target} onChange={e => setTarget(e.target.value as any)}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="both">Les deux</option>
          </select>
          <button type="submit">Envoyer</button>
        </form>
      )}
      {(() => {
        const filtered = tickets.filter(t => {
          if (filterStatus && t.status !== filterStatus) return false;
          if (filterCategory && t.category !== filterCategory) return false;
          if (filterPriority && t.priority !== filterPriority) return false;
          return true;
        });
        return (
          <ul className="ticket-list">
            {filtered.map(t => (
          <li key={t.id} className={t.status}>
            <div className="header">
              <strong>{t.title}</strong>
              <span className="meta">
                {t.username} – {new Date(t.date).toLocaleString()} – {t.status}
              </span>
            </div>
            <p>{t.message}</p>
            {t.category && <p className="meta">Catégorie: {t.category}</p>}
            <p className="meta">Priorité: {t.priority}</p>
            {t.assignedToId && (
              <p className="meta">Assigné à {allUsers.find(u=>u.id===t.assignedToId)?.username || t.assignedToId}</p>
            )}
            {t.attachment && (
              <p><a href={t.attachment} target="_blank" rel="noreferrer">Pièce jointe</a></p>
            )}
            {t.replies.length > 0 && (
              <ul className="replies">
                {t.replies.map((r,idx)=>(
                  <li key={idx}><strong>{r.author}</strong> ({r.role}) : {r.message}</li>
                ))}
              </ul>
            )}
            {user && user.role !== 'caf' && (
              <form onSubmit={async e=>{e.preventDefault(); const msg=(e.currentTarget.elements.namedItem('reply') as HTMLInputElement).value; if(!msg) return; const rep= await replyTicket(t.id,{author:user.username,role:user.role as any,message:msg}); setTickets(prev=>prev.map(tk=>tk.id===t.id?{...tk,replies:[...tk.replies,rep]}:tk)); (e.currentTarget.elements.namedItem('reply') as HTMLInputElement).value='';}}>
                <input name="reply" placeholder="Répondre" />
              </form>
            )}
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <select value={t.assignedToId || ''} onChange={e => assign(t.id, e.target.value)}>
                <option value="">-- assigner --</option>
                {allUsers.filter(u=>u.role==='manager' || u.role==='admin').map(u=>(
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            )}
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <div className="actions">
                <button onClick={() => changeStatus(t.id, 'open')}>Ouvrir</button>
                <button onClick={() => changeStatus(t.id, 'in_progress')}>En cours</button>
                <button onClick={() => changeStatus(t.id, 'resolved')}>Résolu</button>
                <button onClick={() => changeStatus(t.id, 'closed')}>Clore</button>
              </div>
            )}
          </li>
        ))}
          </ul>
        );
      })()}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 1rem;
  max-width: 800px;
  margin: auto;

  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}

  .new-ticket input,
  .new-ticket textarea,
  .new-ticket select {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }
  .new-ticket textarea { min-height: 80px; }
  .new-ticket button { padding: 0.5rem 1rem; }

  .filters{display:flex;gap:.5rem;margin-bottom:1rem;}
  .filters select, .filters input{padding:0.25rem;}

  .ticket-list { list-style: none; padding: 0; }
  .ticket-list li { border-bottom: 1px solid #ddd; padding: 0.5rem 0; }
  .ticket-list li .header { display: flex; justify-content: space-between; }
  .ticket-list li .meta { font-size: 0.8rem; color: #666; }
  .actions button { margin-right: 0.5rem; }
  .replies { list-style:none;padding-left:1rem; }
  .replies li{ font-size:0.9rem; margin-bottom:0.25rem; }
`;
