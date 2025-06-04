import { Router } from 'express';
import { computeAnalytics } from '../utils/analytics';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const data = computeAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Cannot load analytics' });
  }
});

export default router;
