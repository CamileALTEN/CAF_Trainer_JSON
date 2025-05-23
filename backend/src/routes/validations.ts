import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IValidation, ValidationStatus } from '../models/IValidation';

const router = Router();
const TABLE = 'validations';

router.get('/', (_req, res) => {
  res.json(read<IValidation>(TABLE));
});

router.post('/', (req, res) => {
  const { username, moduleId, itemId, itemTitle } = req.body as Partial<IValidation>;
  if (!username || !moduleId || !itemId)
    return res.status(400).json({ error: 'Données manquantes' });

  const list = read<IValidation>(TABLE);
  const entry: IValidation = {
    id: Date.now().toString(),
    username,
    moduleId,
    itemId,
    itemTitle: itemTitle ?? '',
    date: new Date().toISOString(),
    status: 'pending',
  };
  list.push(entry);
  write(TABLE, list);
  res.status(201).json(entry);
});

router.patch('/:id', (req, res) => {
  const { status } = req.body as Partial<IValidation> & { status?: ValidationStatus };
  if (!status) return res.status(400).json({ error: 'Données manquantes' });
  const list = read<IValidation>(TABLE);
  const idx = list.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });
  list[idx].status = status;
  write(TABLE, list);
  res.json(list[idx]);
});

export default router;
