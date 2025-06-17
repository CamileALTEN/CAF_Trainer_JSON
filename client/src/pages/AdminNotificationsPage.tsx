import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNotification, getAllNotifications, INotification, launchInactiveCampaign } from '../api/notifications';
import './AdminNotificationsPage.css';

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<INotification[]>([]);
  const [type, setType] = useState('info');
  const [message, setMessage] = useState('');
  const [targets, setTargets] = useState('');
  const [link, setLink] = useState('');
  const [exp, setExp] = useState('');

  const load = () => { getAllNotifications().then(setList); };
  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cible = targets.split(',').map(t => t.trim()).filter(Boolean);
    const created = await createNotification({
      type,
      message,
      cible: { userIds: cible },
      action: link ? { type: 'link', url: link } : undefined,
      expireraLe: exp || undefined,
    });
    setList(prev => [created, ...prev]);
    setMessage('');
    setTargets('');
    setLink('');
    setExp('');
  };

  const launch = async () => {
    if (!window.confirm('Lancer la campagne de relance ?')) return;
    await launchInactiveCampaign();
    load();
  };

  const countRead = (n: INotification) => n.etat?.luPar?.length || 0;
  const countUnread = (n: INotification) => n.etat?.nonLuPar?.length || 0;

  return (
    <div className="admin-notifs">
      <button className="btn-back" onClick={() => navigate('/admin')}>← Retour dashboard</button>
      <h1>Notifications</h1>

      <form onSubmit={submit} className="notif-form">
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="info">info</option>
          <option value="succès">succès</option>
          <option value="alerte">alerte</option>
          <option value="erreur">erreur</option>
          <option value="système">système</option>
          <option value="rappel">rappel</option>
          <option value="boost">boost</option>
          <option value="recommandation">recommandation</option>
        </select>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" required />
        <input type="text" value={targets} onChange={e=>setTargets(e.target.value)} placeholder="Cible: ids séparés par des virgules" />
        <input type="text" value={link} onChange={e=>setLink(e.target.value)} placeholder="Lien (optionnel)" />
        <input type="date" value={exp} onChange={e=>setExp(e.target.value)} />
        <button type="submit">Envoyer</button>
      </form>

      {message && (
        <div className="preview">Prévisualisation: [{type}] {message}</div>
      )}

      <button className="btn-campaign" onClick={launch}>Lancer campagne intelligente</button>

      <h2>Historique</h2>
      <table className="notif-table">
        <thead>
          <tr><th>Date</th><th>Type</th><th>Message</th><th>Lu</th><th>Non lu</th></tr>
        </thead>
        <tbody>
          {list.map(n => (
            <tr key={n.id}>
              <td>{n.dateEnvoi ? new Date(n.dateEnvoi).toLocaleDateString() : ''}</td>
              <td>{n.type}</td>
              <td>{n.message}</td>
              <td>{countRead(n)}</td>
              <td>{countUnread(n)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="suggestions">
        <h3>Suggestions automatiques</h3>
        <ul>
          <li>Relancer CAFs inactifs depuis +3j</li>
          <li>Notifiez tous les managers sur le ticket non traité X</li>
          <li>Prévenez les CAFs sur le module mis à jour Y</li>
        </ul>
      </div>
    </div>
  );
}
