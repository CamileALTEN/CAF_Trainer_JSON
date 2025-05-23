import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IValidationEntry } from '../models/IValidation';
import { IProgress, ItemStatus } from '../models/IProgress';
import { IUser } from '../models/IUser';

const router = Router();
const TABLE = 'validations';

function load() { return read<IValidationEntry>(TABLE); }
function save(list: IValidationEntry[]) { write(TABLE, list); }

router.get('/', (req, res) => {
  const { managerId, username, moduleId } = req.query as {
    managerId?: string; username?: string; moduleId?: string;
  };
  let list = load();
  if (username) list = list.filter(v => v.username === username);
  if (moduleId) list = list.filter(v => v.moduleId === moduleId);

  if (managerId) {
    const users = read<IUser>('users');
    const caf = users.filter(u => u.managerId === managerId).map(u => u.username);
    list = list.filter(v => caf.includes(v.username));
  }
  res.json(list);
});

router.post('/', (req, res) => {
  const { username, moduleId, itemId } = req.body as Partial<IValidationEntry>;
  if (!username || !moduleId || !itemId)
    return res.status(400).json({ error: 'Données manquantes' });
  const list = load();
  const entry: IValidationEntry = {
    id: Date.now().toString(),
    username,
    moduleId,
    itemId,
    date: new Date().toISOString(),
    status: 'pending',
  };
  list.push(entry);
  save(list);
  res.status(201).json(entry);
});

router.patch('/:id', (req, res) => {
  const { status } = req.body as Partial<IValidationEntry>;
  if (!status) return res.status(400).json({ error: 'Données manquantes' });

  const list = load();
  const idx = list.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  list[idx].status = status as any;
  save(list);

  if (status === 'approved') {
    const progress = read<IProgress>('progress');
    const entry = list[idx];
    const idxP = progress.findIndex(p => p.username === entry.username && p.moduleId === entry.moduleId);
    if (idxP !== -1) {
      progress[idxP].statuses[entry.itemId] = 'validated';
      write('progress', progress);
    }
    list.splice(idx,1);
    save(list);
  }

  if (status === 'rejected') {
    list.splice(idx,1);
    save(list);
  }

  res.json({ ok: true });
});

export default router;
