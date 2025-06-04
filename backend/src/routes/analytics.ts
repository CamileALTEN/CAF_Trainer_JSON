import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const DATA_FILE = path.resolve(__dirname, '../data/analytics.json');

router.get('/', (_req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Cannot load analytics' });
  }
});

export default router;
