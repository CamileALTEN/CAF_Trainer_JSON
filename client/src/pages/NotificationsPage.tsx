import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface INotification {
  id: string;
  username?: string;
  date?: string;
  dateEnvoi?: string;
  type?: string;
  message?: string;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<INotification[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notifications/${user.id}`)
      .then(r => r.json())
      .then(setNotifs)
      .catch(console.error);
  }, [user]);

  return (
    <Wrapper>
      <button className="btn-back" onClick={() => navigate(-1)}>← Retour</button>
      <h2>Notifications</h2>
      {notifs.length === 0
        ? <p>Aucune notification.</p>
        : (
          <ul>
            {notifs.map(n => {
              const d = n.dateEnvoi || n.date || '';
              const markRead = () => {
                if (!user) return;
                fetch(`/api/notifications/${n.id}/lu/${user.id}`, {
                  method: 'PATCH',
                }).catch(console.error);
              };
              return (
                <li key={n.id}>
                  {n.username || 'Système'} – {d ? new Date(d).toLocaleString() : ''}
                  {n.message ? ` – ${n.message}` : ''}
                  <button onClick={markRead} style={{ marginLeft: '0.5rem' }}>Lu</button>
                </li>
              );
            })}
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