import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TicketPriority, createTicket } from '../api/tickets';
import AdvancedEditor from '../components/AdvancedEditor';

export default function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [target, setTarget] = useState<'admin' | 'manager' | 'both'>(
    user?.role === 'manager' ? 'admin' : 'manager'
  );

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      username: user.username,
      target: user.role === 'manager' ? 'admin' : target,
      title,
      message,
      category,
      priority,
    };
    await createTicket(payload);
    navigate(-1);
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Nouveau ticket</h2>
      <form onSubmit={submit} className="new-ticket">
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
        {user.role !== 'manager' && (
          <select value={target} onChange={e => setTarget(e.target.value as any)}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="both">Les deux</option>
          </select>
        )}
        <button type="submit">Envoyer</button>
      </form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 1rem;
  max-width: 600px;
  margin: auto;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
  .new-ticket input,
  .new-ticket select{display:block;width:100%;margin-bottom:.5rem;padding:.5rem;}
  .advanced-editor{margin-bottom:.5rem;}
  .new-ticket button{padding:.5rem 1rem;}
`;
