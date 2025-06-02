import { Router } from 'express';
import { read, write } from '../config/dataStore';

export interface ChecklistConfig {
  url: string;
}

const router = Router();
const TABLE = 'checklist';

function load(): ChecklistConfig {
  const list = read<ChecklistConfig>(TABLE);
  return list[0] ?? { url: '' };
}

function save(conf: ChecklistConfig) {
  write<ChecklistConfig>(TABLE, [conf]);
}

router.get('/', (_req, res) => {
  res.json(load());
});

router.put('/', (req, res) => {
  const { url } = req.body as Partial<ChecklistConfig>;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'url manquante' });
  }
  save({ url });
  res.json({ url });
});

export default router;
