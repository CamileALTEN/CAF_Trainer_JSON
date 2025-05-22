import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ITicket,
  TicketStatus,
  TicketPriority,
  replyTicket,
  createTicket,
  updateTicket,
  getTickets,
  exportTicket,
} from '../api/tickets';
import AdvancedEditor from '../components/AdvancedEditor';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'admin' | 'manager' | 'both'>('manager');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getTickets(search)
      .then(setTickets)
      .catch(console.error);
  }, [search]);

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
    const data = await createTicket(payload);
    setTickets(prev => [...prev, data]);
    setTitle('');
    setMessage('');
  };

  const changeStatus = async (id: string, status: TicketStatus) => {
    const data = await updateTicket(id, { status });
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  const toggleArchive = async (id: string, value: boolean) => {
    const data = await updateTicket(id, { archived: value });
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const doExport = async (id: string) => {
    const blob = await exportTicket(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Tickets</h2>
      <input
        className="search"
        placeholder="Recherche"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {user?.role === 'caf' && (
        <form className="new-ticket" onSubmit={submit}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre"
            required
          />
          <AdvancedEditor value={message} onChange={setMessage} />
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
          <select value={target} onChange={e => setTarget(e.target.value as any)}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="both">Les deux</option>
          </select>
          <button type="submit">Envoyer</button>
        </form>
      )}
      <ul className="ticket-list">
        {tickets.map(t => (
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
              <div className="actions">
                <button onClick={() => changeStatus(t.id, 'open')}>Ouvrir</button>
                <button onClick={() => changeStatus(t.id, 'pending')}>En attente</button>
                <button onClick={() => changeStatus(t.id, 'closed')}>Clore</button>
                <button onClick={() => toggleArchive(t.id, true)}>Archiver</button>
                <button onClick={() => doExport(t.id)}>Exporter</button>
              </div>
            )}
          </li>
        ))}
      </ul>
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
  .new-ticket select {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }
  .advanced-editor { margin-bottom: 0.5rem; }
  .search { width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
  .new-ticket button { padding: 0.5rem 1rem; }

  .ticket-list { list-style: none; padding: 0; }
  .ticket-list li { border-bottom: 1px solid #ddd; padding: 0.5rem 0; }
  .ticket-list li .header { display: flex; justify-content: space-between; }
  .ticket-list li .meta { font-size: 0.8rem; color: #666; }
  .actions button { margin-right: 0.5rem; }
  .replies { list-style:none;padding-left:1rem; }
  .replies li{ font-size:0.9rem; margin-bottom:0.25rem; }
`;
