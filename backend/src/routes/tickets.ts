import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ITicket, TicketStatus } from '../models/ITicket';
import { IUser } from '../models/IUser';

const router = Router();
const TABLE = 'tickets';

function load() { return read<ITicket>(TABLE); }
function save(list: ITicket[]) { write(TABLE, list); }

router.get('/', (_req, res) => {
  res.json(load());
});

router.post('/', (req, res) => {
  const { username, target, title, message } = req.body as Partial<ITicket>;
  if (!username || !target || !title || !message)
    return res.status(400).json({ error: 'Données manquantes' });

  const users = read<IUser>('users');
  const author = users.find(u => u.username === username);

  const ticket: ITicket = {
    id: Date.now().toString(),
    username,
    managerId: author?.managerId,
    target: target as any,
    title,
    message,
    status: 'open',
    date: new Date().toISOString(),
  };

  const list = load();
  list.push(ticket);
  save(list);
  res.status(201).json(ticket);
});

router.patch('/:id', (req, res) => {
  const { status } = req.body as { status: TicketStatus };
  if (!status) return res.status(400).json({ error: 'Statut manquant' });

  const list = load();
  const idx = list.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Introuvable' });

  list[idx].status = status;
  save(list);
  res.json(list[idx]);
});

export default router;
