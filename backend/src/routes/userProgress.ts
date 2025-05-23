import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IUserProgress } from '../models/IUserProgress';

const router = Router();
const TABLE = 'userProgress';

router.patch('/:userId/items/:itemId/status', (req, res) => {
  const { status } = req.body as Partial<IUserProgress>;
  const { userId, itemId } = req.params;

  if (!status) return res.status(400).json({ error: 'status manquant' });

  const list = read<IUserProgress>(TABLE);
  const idx = list.findIndex(p => p.userId === userId && p.itemId === itemId);

  if (idx === -1) list.push({ userId, itemId, status });
  else list[idx].status = status;

  write(TABLE, list);
  res.json({ ok: true });
});

export default router;
