import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ISite } from '../models/ISite';

const router = Router();
const TABLE = 'sites';

function load(): ISite[] { return read<ISite>(TABLE); }
function save(list: ISite[]) { write<ISite>(TABLE, list); }
function findIndex(id: string, list = load()) { return list.findIndex(s => s.id === id); }

router.get('/', (_req, res) => res.json(load()));

router.post('/', (req, res) => {
  const { name, color } = req.body as Partial<ISite>;
  if (!name || !color) return res.status(400).json({ error: 'name et color requis' });
  const list = load();
  const site: ISite = { id: Date.now().toString(), name, color };
  list.push(site);
  save(list);
  res.status(201).json(site);
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
