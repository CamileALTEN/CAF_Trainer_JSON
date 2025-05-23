import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IUserProgress } from '../models/IUserProgress';
import { ItemStatus } from '../models/types';
import { IValidationLog } from '../models/IValidationLog';

const router = Router();
const PROGRESS = 'userProgress';
const LOGS = 'validationLogs';

router.get('/pending', (_req, res) => {
  const list = read<IUserProgress>(PROGRESS);
  res.json(list.filter(p => p.status === 'en_attente'));
});

router.get('/completed', (_req, res) => {
  const list = read<IUserProgress>(PROGRESS);
  res.json(list.filter(p => p.status === 'terminé' || p.status === 'validé'));
});

router.post('/:userId/:itemId', (req, res) => {
  const { userId, itemId } = req.params;
  const { action, targetStatus, comment, managerId } = req.body as {
    action: 'approve' | 'reject' | 'rollback';
    targetStatus?: ItemStatus;
    comment?: string;
    managerId?: string;
  };

  const list = read<IUserProgress>(PROGRESS);
  const idx = list.findIndex(p => p.userId === userId && p.itemId === itemId);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });

  const oldStatus = list[idx].status;
  let newStatus: ItemStatus = oldStatus;

  if (action === 'approve') newStatus = 'validé';
  else if (action === 'reject') newStatus = 'en_cours';
  else if (action === 'rollback') {
    if (!targetStatus || (targetStatus !== 'en_cours' && targetStatus !== 'non_commencé')) {
      return res.status(400).json({ error: 'targetStatus requis' });
    }
    newStatus = targetStatus;
  } else {
    return res.status(400).json({ error: 'action inconnue' });
  }

  list[idx].status = newStatus;
  write(PROGRESS, list);

  const logs = read<IValidationLog>(LOGS);
  logs.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    managerId: managerId ?? 'unknown',
    userId,
    itemId,
    oldStatus,
    newStatus,
    comment,
  });
  write(LOGS, logs);

  res.json(list[idx]);
});

export default router;
