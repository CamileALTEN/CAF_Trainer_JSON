import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getModules } from '../api/modules';
import { IUserProgress, getUserProgress, updateItemStatus } from '../api/userProgress';
import { flatten } from '../utils/items';
import './ManagerKanbanPage.css';

export default function ManagerKanbanPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<IUserProgress[]>([]);
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

      const prog = await getUserProgress({ managerId: user!.id });
      setProgress(prog);
    }
    load();
  }, [user]);

  const statusLabels: Record<IUserProgress['status'], string> = {
    non_commencé: 'Non commencé',
    en_cours: 'En cours',
    besoin_aide: "Besoin d'aide",
    terminé: 'Terminé',
    soumis_validation: 'À valider',
    en_attente: 'En attente',
    validé: 'Validé',
  };

  const statuses = Object.keys(statusLabels) as IUserProgress['status'][];

  function onDragStart(ev: React.DragEvent<HTMLDivElement>, p: IUserProgress) {
    ev.dataTransfer.setData('text/plain', `${p.userId}|${p.itemId}`);
  }

  async function onDrop(ev: React.DragEvent<HTMLDivElement>, status: IUserProgress['status']) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData('text/plain');
    const [userId, itemId] = data.split('|');
    await updateItemStatus(userId, itemId, status);
    setProgress(prev => prev.map(p => p.userId === userId && p.itemId === itemId ? { ...p, status } : p));
  }

  return (
    <div className="kanban-page">
      <h1>Suivi Kanban</h1>
      <div className="kanban-board">
        {statuses.map(s => (
          <div key={s} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, s)}>
            <h3>{statusLabels[s]}</h3>
            {progress.filter(p => p.status === s).map(p => (
              <div
                key={p.userId + '-' + p.itemId}
                className="kanban-card"
                draggable
                onDragStart={e => onDragStart(e, p)}
              >
                <strong>{userNames[p.userId] ?? p.userId}</strong>
                <div>{itemTitles[p.itemId] ?? p.itemId}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
