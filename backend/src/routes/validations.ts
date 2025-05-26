import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IValidation } from '../models/IValidation';
import { IProgress } from '../models/IProgress';

const router = Router();
const TABLE = 'validations';

function load() { return read<IValidation>(TABLE); }
function save(list: IValidation[]) { write(TABLE, list); }

router.get('/', (req, res) => {
  const { managerId, username, status, moduleId } = req.query as {
    managerId?: string;
    username?: string;
    status?: string;
    moduleId?: string;
  };
  let list = load();
  if (managerId) list = list.filter(v => v.managerId === managerId);
  if (username) list = list.filter(v => v.username === username);
  if (status) list = list.filter(v => v.status === status);
  if (moduleId) list = list.filter(v => v.moduleId === moduleId);
  res.json(list);
});

router.post('/', (req, res) => {
  const { username, managerId, moduleId, itemId } = req.body as Partial<IValidation>;
  if (!username || !moduleId || !itemId)
    return res.status(400).json({ error: 'Données manquantes' });
  const list = load();
  const val: IValidation = {
    id: Date.now().toString(),
    username,
    managerId,
    moduleId,
    itemId,
    status: 'pending',
    date: new Date().toISOString(),
  };
  list.push(val);
  save(list);
  res.status(201).json(val);
});

router.patch('/:id', (req, res) => {
  const { status, feedback } = req.body as Partial<IValidation>;
  if (!status) return res.status(400).json({ error: 'Status manquant' });
  const list = load();
  const idx = list.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  list[idx].status = status as any;
  list[idx].feedback = feedback;
  save(list);

  if (status === 'approved') {
    const progress = read<IProgress>('progress');
    const v = list[idx];
    const idxp = progress.findIndex(p => p.username===v.username && p.moduleId===v.moduleId);
    if (idxp !== -1) {
      if (!progress[idxp].visited.includes(v.itemId))
        progress[idxp].visited.push(v.itemId);
    } else {
      progress.push({ username:v.username, moduleId:v.moduleId, visited:[v.itemId] });
    }
    write('progress', progress);
  }

  res.json(list[idx]);
});

export default router;
