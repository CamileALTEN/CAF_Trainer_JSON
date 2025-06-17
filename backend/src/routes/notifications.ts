import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { NotificationJSON } from '../models/NotificationJSON';
import { buildIndexes } from '../utils/notificationIndex';
import { IUser } from '../models/IUser';
import { getAnalyticsFile } from '../utils/analytics';
import { createNotificationAuto } from '../utils/notifier';

const router = Router();
const TABLE = 'notifications';

function load() {
  const list = read<NotificationJSON>(TABLE);
  const indexes = buildIndexes(list);
  return { list, indexes };
}

function save(list: NotificationJSON[]) {
  write(TABLE, list);
}

// GET /api/notifications (admin)
router.get('/', (req, res) => {
  if (req.headers['x-role'] !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  const { list } = load();
  list.sort((a, b) => new Date(b.dateEnvoi).valueOf() - new Date(a.dateEnvoi).valueOf());
  res.json(list);
});

// GET /api/notifications/:userId?type=boost
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const { type } = req.query as { type?: string };
  const { list, indexes } = load();
  const targetIds = new Set([
    ...(indexes.byUserId[userId] || []),
    ...(indexes.byUserId['*'] || []),
  ]);
  let ids = Array.from(targetIds);
  if (type) {
    const fromType = (indexes.byType as Record<string, string[]>)[type] || [];
    ids = ids.filter((id) => fromType.includes(id));
  }
  const result = list.filter((n) => ids.includes(n.id));
  result.sort(
    (a, b) =>
      new Date(b.dateEnvoi).valueOf() - new Date(a.dateEnvoi).valueOf()
  );
  res.json(result);
});

/**
* POST /api/notifications (admin)
*/
router.post('/', (req, res) => {
  if (req.headers['x-role'] !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const data = req.body as Partial<NotificationJSON>;
  if (!data.type || !data.message)
    return res.status(400).json({ error: 'type et message requis' });

  const { list } = load();
  const entry: NotificationJSON = {
    id: Date.now().toString(),
    type: data.type,
    message: data.message,
    cible: data.cible || { userIds: [] },
    action: data.action,
    tags: data.tags,
    origine: data.origine || 'manual',
    dateEnvoi: new Date().toISOString(),
    expireraLe: data.expireraLe,
    etat: {
      luPar: [],
      nonLuPar: data.cible?.userIds ? [...data.cible.userIds] : [],
    },
  };
  list.push(entry);
  save(list);
  res.status(201).json(entry);
});

// POST /api/notifications/campaign/inactive
router.post('/campaign/inactive', (req, res) => {
  if (req.headers['x-role'] !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const days = 3;
  const { sessions } = getAnalyticsFile();
  const users = read<IUser>('users').filter(u => u.role === 'caf');
  const cutoff = Date.now() - days * 86400000;
  const target: string[] = [];
  users.forEach(u => {
    const last = sessions
      .filter(s => s.userId === u.id)
      .sort((a, b) => new Date(b.login).getTime() - new Date(a.login).getTime())[0];
    const lastTime = last ? new Date(last.login).getTime() : 0;
    if (lastTime < cutoff) target.push(u.id);
  });

  if (target.length > 0) {
    createNotificationAuto({
      type: 'boost',
      message: "Revenez progresser sur CAF-Trainer !",
      cible: target,
      tags: ['campaign','inactif'],
      origine: 'campaign_inactive',
    });
  }
  res.json({ count: target.length });
});

// GET /api/notifications/suggestions (admin)
router.get('/suggestions', (req, res) => {
  if (req.headers['x-role'] !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });
  res.json([
    'Relancer CAFs inactifs depuis +3j',
    'Notifiez tous les managers sur le ticket non traité X',
    'Prévenez les CAFs sur le module mis à jour Y',
  ]);
});

// PATCH /api/notifications/:notifId/lu/:userId
router.patch('/:notifId/lu/:userId', (req, res) => {
  const { notifId, userId } = req.params;
  const { list } = load();
  const idx = list.findIndex((n) => n.id === notifId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const state = list[idx].etat || { luPar: [], nonLuPar: [] };
  if (!state.luPar.includes(userId)) state.luPar.push(userId);
  state.nonLuPar = state.nonLuPar.filter((u) => u !== userId);
  list[idx].etat = state;
  save(list);
  res.json({ ok: true });
});

// DELETE /api/notifications/:notifId (admin)
router.delete('/:notifId', (req, res) => {
  if (req.headers['x-role'] !== 'admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { notifId } = req.params;
  const { list } = load();
  const idx = list.findIndex((n) => n.id === notifId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list.splice(idx, 1);
  save(list);
  res.json({ ok: true });
});

export default router;
