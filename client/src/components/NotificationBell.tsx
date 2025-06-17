import React, { useEffect, useState } from 'react';
import { Bell, Check, Pin, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

export interface INotification {
  id: string;
  type?: string;
  message?: string;
  action?: { type: string; url?: string };
  tags?: string[];
  etat?: { luPar: string[]; nonLuPar: string[] };
  dateEnvoi?: string;
}

const typeToIcon: Record<string, JSX.Element> = {
  info: <Bell size={20} />,
  'succès': <Check size={20} color="green" />,
  alerte: <Bell size={20} color="orange" />,
  erreur: <Bell size={20} color="red" />,
  système: <Bell size={20} />,
  rappel: <Bell size={20} />,
  boost: <Bell size={20} color="purple" />,
  recommandation: <Bell size={20} color="blue" />,
};

function rel(d?: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const j = Math.floor(h / 24);
  return `${j}j`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<INotification[]>([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [pinned, setPinned] = useState<string[]>(() => {
    const s = localStorage.getItem('pinned-notifs');
    return s ? JSON.parse(s) : [];
  });

  const load = () => {
    if (!user) return;
    fetch(`/api/notifications/${user.id}`)
      .then((r) => r.json())
      .then(setList)
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 120000);
    return () => clearInterval(id);
  }, [user]);

  const unreadCount = list.filter((n) => n.etat?.nonLuPar?.includes(user?.id || '')).length;

  const markRead = (id: string) => {
    if (!user) return;
    fetch(`/api/notifications/${id}/lu/${user.id}`, { method: 'PATCH' })
      .then(load)
      .catch(() => {});
  };

  const togglePin = (id: string) => {
    setPinned((p) => {
      const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      localStorage.setItem('pinned-notifs', JSON.stringify(next));
      return next;
    });
  };

  let items = [...list];
  if (filter !== 'all') items = items.filter((n) => n.type === filter);
  items.sort((a, b) => {
    const da = new Date(a.dateEnvoi || '').getTime();
    const db = new Date(b.dateEnvoi || '').getTime();
    return sort === 'desc' ? db - da : da - db;
  });
  items.sort((a, b) => (pinned.includes(b.id) ? 1 : 0) - (pinned.includes(a.id) ? 1 : 0));

  const handleSwipe = (e: React.TouchEvent, id: string) => {
    const startX = e.touches[0].clientX;
    const handleEnd = (ev: TouchEvent) => {
      const diff = startX - ev.changedTouches[0].clientX;
      if (diff > 50) markRead(id);
      document.removeEventListener('touchend', handleEnd);
    };
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div className="notif-bell">
      <button className="icon-btn" onClick={() => setOpen((o) => !o)}>
        <Bell />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
      <div className={`notif-drawer${open ? ' open' : ''}`}>
        <header>
          <strong>Notifications</strong>
          <button onClick={() => setOpen(false)}>✕</button>
        </header>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Toutes</option>
            <option value="info">Info</option>
            <option value="succès">Succès</option>
            <option value="alerte">Alerte</option>
            <option value="erreur">Erreur</option>
            <option value="système">Système</option>
            <option value="rappel">Rappel</option>
            <option value="boost">Boost</option>
            <option value="recommandation">Reco</option>
          </select>
          <button onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}>↕</button>
        </div>
        <ul className="list">
          {items.map((n) => (
            <li
              key={n.id}
              className={pinned.includes(n.id) ? 'pinned' : ''}
              onTouchStart={(e) => handleSwipe(e, n.id)}
            >
              <span className="icon">{typeToIcon[n.type || 'info']}</span>
              <div className="msg">
                <span className="text">{n.message}</span>
                <span className="date">{rel(n.dateEnvoi)}</span>
              </div>
              <div className="actions">
                {n.action?.type === 'link' && n.action.url && (
                  <button onClick={() => { setOpen(false); navigate(n.action!.url!); }}>
                    <ExternalLink size={16} />
                  </button>
                )}
                <button onClick={() => markRead(n.id)}>
                  <Check size={16} />
                </button>
                <button onClick={() => togglePin(n.id)}>
                  <Pin size={16} fill={pinned.includes(n.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

