//  \client\src\pages\RegisterUserPage.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { Role, IUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function RegisterUserPage() {
  const { user } = useAuth();                     // admin ou manager
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<Role>('caf');
  const [site,      setSite]      = useState('Nantes');             // site du CAF
  const [sites,     setSites]     = useState<string[]>([]);         // sites du manager

  const [managers,  setManagers]  = useState<IUser[]>([]);
  const [managerIds,setManagerIds]= useState<string[]>([]);

  const [msg,      setMsg]      = useState('');
  const [loading,  setLoading]  = useState(false);

  function toggleSite(value: string) {
    setSites(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  }

  function toggleManager(id: string) {
    setManagerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  /* ───────── chargement managers pour l’admin ───────── */
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch('/api/users')
      .then(r => r.json())
      .then((list: IUser[]) => setManagers(list.filter(u => u.role === 'manager')));
  }, [user]);

  useEffect(() => {
    if (user?.role === 'manager') setManagerIds([user.id]);
  }, [user]);

  /* ───────── constantes d’affichage ───────── */
  const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

  const allowed:Role[] = user?.role === 'admin'
    ? ['caf','manager','admin'] : ['caf'];

  /* ───────── soumission ───────── */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');

    if (!mailRx.test(username))
      return setMsg('❌ Le nom doit être de la forme prenom.nom@alten.com');
    if (role === 'caf' && managerIds.length === 0 && user?.role === 'admin')
      return setMsg('❌ Sélectionnez un manager pour le CAF');

    setLoading(true);
    try {
      const body = {
        username,
        password,
        role,
        site: role === 'caf' ? site : undefined,
        sites: role === 'manager' ? sites : undefined,
        managerIds: role === 'caf'
          ? (user?.role === 'manager' ? [user.id] : managerIds)
          : undefined,
      };

      const res = await fetch('/api/users', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setMsg(`✅ Compte créé : ${data.username}`);
      setUsername(''); setPassword(''); setManagerIds([]); setSites([]);
    } catch (err:any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      {loading && <Loader />}
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Créer un compte</h2>

      <Form onSubmit={submit}>
        <label>Rôle
          <select value={role} onChange={e=>setRole(e.target.value as Role)}>
            {allowed.map(r=><option key={r}>{r}</option>)}
          </select>
        </label>

        {role === 'caf' && (
          <label>Site
            <select value={site} onChange={e=>setSite(e.target.value)}>
              <option>Nantes</option>
              <option>Montoir</option>
            </select>
          </label>
        )}

        {role === 'manager' && (
          <fieldset>
            <legend>Sites</legend>
            <label>
              <input type="checkbox" value="Nantes"
                     checked={sites.includes('Nantes')}
                     onChange={e=>toggleSite(e.target.value)} />
              Nantes
            </label>
            <label>
              <input type="checkbox" value="Montoir"
                     checked={sites.includes('Montoir')}
                     onChange={e=>toggleSite(e.target.value)} />
              Montoir
            </label>
          </fieldset>
        )}

        {role === 'caf' && user?.role === 'admin' && (
          <fieldset>
            <legend>Managers</legend>
            {managers.map(m => (
              <label key={m.id}>
                <input type="checkbox" value={m.id}
                       checked={managerIds.includes(m.id)}
                       onChange={e=>toggleManager(e.target.value)} />
                {m.username}
              </label>
            ))}
          </fieldset>
        )}

        <label>Utilisateur (mail Alten)
          <input
            value={username}
            onChange={e=>setUsername(e.target.value)}
            placeholder="prenom.nom@alten.com"
            required
          />
        </label>

        <label>Mot de passe
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? '…' : 'Créer'}
        </button>
        {msg && <p>{msg}</p>}
      </Form>
    </Wrapper>
  );
}

/* ───────── styles ───────── */
const Wrapper = styled.div`  padding:2rem; max-width:360px; margin:auto;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
      `;
const Form    = styled.form`  display:flex; flex-direction:column; gap:.75rem;
  input,select{padding:.5rem; border:1px solid #bbb; border-radius:4px;}
  button{padding:.6rem; background:#008bd2; color:#fff; border:none; border-radius:4px;}
  button:hover:not(:disabled){background:#006fa1;}
      `;