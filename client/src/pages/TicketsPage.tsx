import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ITicket, TicketStatus } from '../api/tickets';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'admin' | 'manager' | 'both'>('manager');

  useEffect(() => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(console.error);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        target,
        title,
        message,
      }),
    });
    const data = await res.json();
    setTickets(prev => [...prev, data]);
    setTitle('');
    setMessage('');
  };

  const changeStatus = async (id: string, status: TicketStatus) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Tickets</h2>
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
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <div className="actions">
                <button onClick={() => changeStatus(t.id, 'open')}>Ouvrir</button>
                <button onClick={() => changeStatus(t.id, 'pending')}>En attente</button>
                <button onClick={() => changeStatus(t.id, 'closed')}>Clore</button>
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
  .new-ticket textarea,
  .new-ticket select {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }
  .new-ticket textarea { min-height: 80px; }
  .new-ticket button { padding: 0.5rem 1rem; }

  .ticket-list { list-style: none; padding: 0; }
  .ticket-list li { border-bottom: 1px solid #ddd; padding: 0.5rem 0; }
  .ticket-list li .header { display: flex; justify-content: space-between; }
  .ticket-list li .meta { font-size: 0.8rem; color: #666; }
  .actions button { margin-right: 0.5rem; }
`;
