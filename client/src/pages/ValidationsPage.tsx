import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getModules } from '../api/modules';
import { flatten } from '../utils/items';
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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [itemTitles, setItemTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const usersList = await fetch(`/api/users?managerId=${user!.id}`).then(r => r.json());
      const uMap: Record<string, string> = {};
      usersList.forEach((u: any) => { uMap[u.id] = u.username; });
      setUserNames(uMap);

      const mods = await getModules();
      const iMap: Record<string, string> = {};
      mods.forEach(m => flatten(m.items).forEach(it => { iMap[it.id] = it.title; }));
      setItemTitles(iMap);

      const pend = await getPending();
      setPending(pend.filter(p => uMap[p.userId]));
    }
    load();
  }, [user]);

  useEffect(() => {
    if (tab === 'history') {
      getCompleted().then(list => {
        setCompleted(list.filter(p => userNames[p.userId]));
      });
    }
  }, [tab, userNames]);

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
        pending.length === 0 ? (
          <p>Aucun item à valider</p>
        ) : (
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
                  <td>{userNames[p.userId] ?? p.userId}</td>
                  <td>{itemTitles[p.itemId] ?? p.itemId}</td>
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
        )
      )}

      {tab === 'history' && (
        completed.length === 0 ? (
          <p>Aucune validation terminée</p>
        ) : (
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
                  <td>{userNames[c.userId] ?? c.userId}</td>
                  <td>{itemTitles[c.itemId] ?? c.itemId}</td>
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
        )
      )}
    </div>
  );
}
