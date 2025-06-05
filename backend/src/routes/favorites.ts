import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IUserFavorites } from '../models/IFavorites';
import { recordFavorite } from '../utils/analytics';

const router = Router();
const TABLE = 'favorites';

router.get('/:userId', (req, res) => {
  const list = read<IUserFavorites>(TABLE);
  const row = list.find(f => f.userId === req.params.userId);
  res.json(row ? row.items : []);
});

router.post('/', async (req, res) => {
  const { userId, itemId } = req.body as { userId: string; itemId: string };
  if (!userId || !itemId) return res.status(400).json({ error: 'Missing data' });
  const list = read<IUserFavorites>(TABLE);
  let row = list.find(f => f.userId === userId);
  if (!row) {
    row = { userId, items: [itemId] };
    list.push(row);
  } else if (!row.items.includes(itemId)) {
    row.items.push(itemId);
  }
  write(TABLE, list);
  try { await recordFavorite(userId, itemId); } catch { /* ignore */ }
  res.json({ ok: true });
});

router.delete('/', (req, res) => {
  const { userId, itemId } = req.body as { userId: string; itemId: string };
  if (!userId || !itemId) return res.status(400).json({ error: 'Missing data' });
  const list = read<IUserFavorites>(TABLE);
  const row = list.find(f => f.userId === userId);
  if (row) {
    row.items = row.items.filter(id => id !== itemId);
    write(TABLE, list);
  }
  res.json({ ok: true });
});

export default router;
