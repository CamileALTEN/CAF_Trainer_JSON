import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

export default function ChecklistUrlPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/checklist-url')
      .then(r => r.json())
      .then(d => setUrl(d.url || ''))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/checklist-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Erreur');
      setMsg('✅ Enregistré');
    } catch (err) {
      setMsg('❌ Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>URL de la checklist</h2>
      <form onSubmit={submit}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://…"
          required
        />
        <button type="submit" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding:2rem;max-width:480px;margin:auto;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
  form{display:flex;flex-direction:column;gap:.75rem;margin-top:1rem;}
  input{padding:.5rem;border:1px solid #bbb;border-radius:4px;}
  button[type="submit"]{padding:.6rem;background:#008bd2;color:#fff;border:none;border-radius:4px;}
  button[type="submit"]:hover:not(:disabled){background:#006fa1;}
`;
