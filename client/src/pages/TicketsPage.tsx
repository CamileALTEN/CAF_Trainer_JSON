import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ITicket, TicketStatus, TicketPriority, replyTicket, patchTicket } from '../api/tickets';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then(setTickets)
      .catch(console.error);
  }, []);

  const changeStatus = async (id: string, status: TicketStatus) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  const editTicket = async (ticket: ITicket) => {
    const title = prompt('Titre :', ticket.title) ?? ticket.title;
    const message = prompt('Message :', ticket.message) ?? ticket.message;
    const category = prompt('Catégorie :', ticket.category ?? '') ?? ticket.category;
    const priority = (prompt('Priorité (low|normal|high) :', ticket.priority) ?? ticket.priority) as TicketPriority;
    const updated = await patchTicket(ticket.id, { title, message, category, priority });
    setTickets(prev => prev.map(t => (t.id === ticket.id ? updated : t)));
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Tickets</h2>
      {(user?.role === 'caf' || user?.role === 'manager' || user?.role === 'admin') && (
        <Link className="btn" to={user.role === 'caf' ? '/tickets/new' : `/${user.role}/tickets/new`}>Nouveau ticket</Link>
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
            <div className="msg" dangerouslySetInnerHTML={{ __html: t.message }} />
            {t.category && <p className="meta">Catégorie: {t.category}</p>}
            <p className="meta">Priorité: {t.priority}</p>
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
            {user && user.username === t.username && (
              <button className="btn-edit" onClick={() => editTicket(t)}>Modifier</button>
            )}
            {user && user.role !== 'caf' && (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const input = form.elements.namedItem('reply') as HTMLInputElement;
                  const msg = input.value;
                  if (!msg) return;
                  const rep = await replyTicket(t.id, {
                    author: user.username,
                    role: user.role as any,
                    message: msg,
                  });
                  setTickets(prev =>
                    prev.map(tk => (tk.id === t.id ? { ...tk, replies: [...tk.replies, rep] } : tk))
                  );
                  input.value = '';
                }}
              >
                <input name="reply" placeholder="Répondre" />
              </form>
            )}
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
  .btn{display:inline-block;margin-bottom:1rem;background:#008bd2;color:#fff;padding:.5rem 1rem;border-radius:4px;text-decoration:none;}
  .btn:hover{background:#006fa1;color:#fff;}

  .ticket-list { list-style: none; padding: 0; }
  .ticket-list li { border-bottom: 1px solid #ddd; padding: 0.5rem 0; }
  .ticket-list li .header { display: flex; justify-content: space-between; }
  .ticket-list li .meta { font-size: 0.8rem; color: #666; }
  .actions button { margin-right: 0.5rem; }
  .replies { list-style:none;padding-left:1rem; }
  .replies li{ font-size:0.9rem; margin-bottom:0.25rem; }
  .btn-edit{background:#f0f0f0;border:none;padding:0.25rem 0.5rem;border-radius:4px;margin-top:0.25rem;cursor:pointer;}
  .btn-edit:hover{background:#e2e2e2;}
`;
