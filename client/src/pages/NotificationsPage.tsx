import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

interface INotification {         /* ← typage local */
  id: string;
  username: string;
  date: string;
  message?: string;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<INotification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(setNotifs)
      .catch(console.error);
  }, []);

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Demandes de mot de passe oublié</h2>
      {notifs.length === 0
        ? <p>Aucune notification.</p>
        : (
          <ul>
            {notifs.map(n => (
              <li key={n.id}>
                {n.username} – {new Date(n.date).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
    </Wrapper>
  );
}

const Wrapper = styled.div`  padding:1rem;
  .btn-back{background:none;border:none;color:#043962;font-size:1rem;cursor:pointer;padding:6px 8px;border-radius:4px;transition:background .15s;}
  .btn-back:hover{background:#e9f2ff;}
  ul{list-style:none;padding:0}
  li{padding:.5rem 0;border-bottom:1px solid #ddd}
      `;