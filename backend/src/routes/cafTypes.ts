import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ICafType } from '../models/ICafType';

const router = Router();
const TABLE = 'cafTypes';

function load(): ICafType[] { return read<ICafType>(TABLE); }
function save(list: ICafType[]) { write<ICafType>(TABLE, list); }
function findIndex(id: string, list = load()) { return list.findIndex(t => t.id === id); }

router.get('/', (_req, res) => res.json(load()));

router.post('/', (req, res) => {
  const { name } = req.body as Partial<ICafType>;
  if (!name) return res.status(400).json({ error: 'name requis' });
  const list = load();
  const type: ICafType = { id: Date.now().toString(), name };
  list.push(type);
  save(list);
  res.status(201).json(type);
});

router.patch('/:id', (req, res) => {
  const list = load();
  const idx = findIndex(req.params.id, list);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  Object.assign(list[idx], req.body);
  save(list);
  res.json(list[idx]);
});

router.delete('/:id', (req, res) => {
  const list = load();
  const idx = findIndex(req.params.id, list);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  list.splice(idx, 1);
  save(list);
  res.status(204).end();
});

export default router;
