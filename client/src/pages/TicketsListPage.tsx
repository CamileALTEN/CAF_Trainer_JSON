import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ITicket,
  TicketStatus,
  TicketPriority,
  replyTicket,
  updateTicket,
  getTickets,
  exportTicket,
} from '../api/tickets';
import AdvancedEditor                  from '../components/AdvancedEditor';
export default function TicketsListPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState<TicketPriority>('normal');

  useEffect(() => {
    getTickets(search)
      .then(setTickets)
      .catch(console.error);
  }, [search]);


  const changeStatus = async (id: string, status: TicketStatus) => {
    const data = await updateTicket(id, { status });
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
  };

  const startEdit = (t: ITicket) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditMessage(t.message);
    setEditCategory(t.category || '');
    setEditPriority(t.priority);
  };

  const submitEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const data = await updateTicket(id, {
      title: editTitle,
      message: editMessage,
      category: editCategory,
      priority: editPriority,
    });
    setTickets(prev => prev.map(t => (t.id === id ? data : t)));
    setEditingId(null);
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
      {(user?.role === 'caf' || user?.role === 'manager') && (
        <Link className="btn-create" to="new">Nouveau ticket</Link>
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
            {editingId === t.id ? (
              <form onSubmit={e => submitEdit(e, t.id)} className="edit-form">
                <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} required />
                <AdvancedEditor value={editMessage} onChange={setEditMessage} />
                <input value={editCategory} onChange={e=>setEditCategory(e.target.value)} placeholder="Catégorie" />
                <select value={editPriority} onChange={e=>setEditPriority(e.target.value as TicketPriority)}>
                  <option value="low">Faible 🟢</option>
                  <option value="normal">Normale 🟠</option>
                  <option value="high">Élevée 🔴</option>
                </select>
                <button type="submit">Enregistrer</button>
                <button type="button" onClick={()=>setEditingId(null)}>Annuler</button>
              </form>
            ) : (
              <>
                <div className="message" dangerouslySetInnerHTML={{ __html: t.message }} />
                {t.category && <p className="meta">Catégorie: {t.category}</p>}
                <p className="meta">Priorité: {t.priority}</p>
              </>
            )}
            {editingId !== t.id && user?.username === t.username && (
              <button className="btn-edit" onClick={() => startEdit(t)}>Modifier</button>
            )}
            {t.replies.length > 0 && (
              <ul className="replies">
                {t.replies.map((r,idx)=>(
                  <li key={idx}><strong>{r.author}</strong> ({r.role}) : {r.message}</li>
                ))}
              </ul>
            )}
            {user && user.role !== 'caf' && (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const input = form.elements.namedItem('reply') as HTMLInputElement;
                  const msg = input.value;
                  if (!msg) return;
                  input.value = '';
                  const rep = await replyTicket(t.id, {
                    author: user.username,
                    role: user.role as any,
                    message: msg,
                  });
                  setTickets(prev =>
                    prev.map(tk =>
                      tk.id === t.id ? { ...tk, replies: [...tk.replies, rep] } : tk
                    )
                  );
                }}
              >
                <input name="reply" placeholder="Répondre" />
              </form>
            )}
            {(user?.role === 'manager' || user?.role === 'admin') && (
              <div className="actions">
                <button onClick={() => changeStatus(t.id, 'open')}>Ouvrir 📩</button>
                <button onClick={() => changeStatus(t.id, 'pending')}>En attente ⏳</button>
                <button onClick={() => changeStatus(t.id, 'closed')}>Clore ☑️</button>
                <button onClick={() => toggleArchive(t.id, true)}>Archiver 📥​</button>
                <button onClick={() => doExport(t.id)}>Exporter (JSON) 📤​</button>
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

  .search { width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
  .btn-create{display:inline-block;margin-bottom:1rem;background:#008bd2;color:#fff;padding:.5rem 1rem;border-radius:4px;text-decoration:none;}
  .btn-create:hover{background:#006fa1;}

  .ticket-list { list-style: none; padding: 0; }
  .ticket-list li { border-bottom: 1px solid #ddd; padding: 0.5rem 0; }
  .ticket-list li .header { display: flex; justify-content: space-between; }
  .ticket-list li .meta { font-size: 0.8rem; color: #666; }
  .actions button { margin-right: 0.5rem; }
  .replies { list-style:none;padding-left:1rem; }
  .replies li{ font-size:0.9rem; margin-bottom:0.25rem; }
  .message{margin:0.5rem 0;}
    .message ul,
  .message ol{
    margin-left:1.25rem;
    padding-left:1.25rem;
  }
  .message blockquote{
    margin-left:1rem;
    padding-left:1rem;
    border-left:4px solid #e5e7eb;
    color:#374151;
  }
  .message blockquote p{margin:0;}
  .btn-edit{background:none;border:none;color:#008bd2;cursor:pointer;margin-bottom:0.5rem;}
  .btn-edit:hover{text-decoration:underline;}
  .edit-form input,
  .edit-form select{display:block;width:100%;margin-bottom:.5rem;padding:.5rem;}
  .edit-form button{margin-right:.5rem;}
`;
