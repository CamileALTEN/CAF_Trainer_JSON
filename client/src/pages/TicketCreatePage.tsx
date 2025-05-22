import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TicketPriority, createTicket } from '../api/tickets';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TicketCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'admin' | 'manager' | 'both'>(user?.role === 'manager' ? 'admin' : 'manager');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [attachment, setAttachment] = useState<File | null>(null);

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
    await createTicket(payload);
    navigate(-1);
  };

  const disableTarget = user?.role === 'manager';

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Nouveau ticket</h2>
      <form className="new-ticket" onSubmit={submit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" required />
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" required />
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Catégorie" />
        <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}>
          <option value="low">Faible</option>
          <option value="normal">Normal</option>
          <option value="high">Élevée</option>
        </select>
        <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} />
        <select value={target} onChange={e => setTarget(e.target.value as any)} disabled={disableTarget}>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="both">Les deux</option>
        </select>
        <button type="submit">Envoyer</button>
      </form>
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
`;
