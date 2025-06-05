import { Router } from 'express';
import { computeAnalytics, startSession, endSession, recordFavorite } from '../utils/analytics';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const data = computeAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Cannot load analytics' });
  }
});

router.post('/login', async (req, res) => {
  const { userId, role } = req.body as { userId: string; role: any };
  if (!userId || !role) return res.status(400).json({ error: 'Missing data' });
  await startSession(userId, role);
  res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: 'Missing data' });
  await endSession(userId);
  res.json({ ok: true });
});

router.post('/favorite', async (req, res) => {
  const { userId, itemId } = req.body as { userId: string; itemId: string };
  if (!userId || !itemId) return res.status(400).json({ error: 'Missing data' });
  await recordFavorite(userId, itemId);
  res.json({ ok: true });
});

export default router;
