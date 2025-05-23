import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPending,
  getCompleted,
  sendValidation,
  IUserItem,
} from '../api/validations';
import './ValidationsPage.css';

export default function ValidationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<IUserItem[]>([]);
  const [completed, setCompleted] = useState<IUserItem[]>([]);

  useEffect(() => {
    getPending().then(setPending);
  }, []);

  useEffect(() => {
    if (tab === 'history') getCompleted().then(setCompleted);
  }, [tab]);

  const approve = async (p: IUserItem, comment: string) => {
    await sendValidation(p.userId, p.itemId, {
      action: 'approve',
      comment,
      managerId: user!.id,
    });
    setPending(prev => prev.filter(x => !(x.userId === p.userId && x.itemId === p.itemId)));
  };

  const reject = async (p: IUserItem, comment: string) => {
    await sendValidation(p.userId, p.itemId, {
      action: 'reject',
      comment,
      managerId: user!.id,
    });
    setPending(prev => prev.filter(x => !(x.userId === p.userId && x.itemId === p.itemId)));
  };

  const rollback = async (c: IUserItem, status: 'en_cours' | 'non_commencé') => {
    if (!window.confirm('Confirmer ce changement ?')) return;
    const res = await sendValidation(c.userId, c.itemId, {
      action: 'rollback',
      targetStatus: status,
      managerId: user!.id,
    });
    setCompleted(prev => prev.map(x => (x.userId === c.userId && x.itemId === c.itemId ? res : x)));
  };

  return (
    <div className="validations-page">
      <h1>Validations</h1>
      <div className="tabs">
        <button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>
          À valider
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          Historique &amp; modifications
        </button>
      </div>

      {tab === 'pending' && (
        <table className="list">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Item</th>
              <th>Statut</th>
              <th>Commentaire</th>
              <th colSpan={2}></th>
            </tr>
          </thead>
          <tbody>
            {pending.map(p => (
              <tr key={p.userId + '-' + p.itemId}>
                <td>{p.userId}</td>
                <td>{p.itemId}</td>
                <td>{p.status}</td>
                <td>
                  <input type="text" onChange={e => (p as any).comment = e.target.value} />
                </td>
                <td>
                  <button onClick={() => approve(p, (p as any).comment || '')}>Valider</button>
                </td>
                <td>
                  <button onClick={() => reject(p, (p as any).comment || '')}>Refuser</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'history' && (
        <table className="list">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Item</th>
              <th>Statut</th>
              <th>Rollback</th>
            </tr>
          </thead>
          <tbody>
            {completed.map(c => (
              <tr key={c.userId + '-' + c.itemId}>
                <td>{c.userId}</td>
                <td>{c.itemId}</td>
                <td>{c.status}</td>
                <td>
                  <select onChange={e => rollback(c, e.target.value as 'en_cours' | 'non_commencé')} defaultValue="">
                    <option value="">Choisir…</option>
                    <option value="en_cours">en_cours</option>
                    <option value="non_commencé">non_commencé</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
