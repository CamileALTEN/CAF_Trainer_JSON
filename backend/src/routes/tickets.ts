import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ITicket, TicketStatus } from '../models/ITicket';
import { IUser } from '../models/IUser';
import { notify } from '../utils/notifier';

const router = Router();
const TABLE = 'tickets';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

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
  const admins = users
    .filter(u => u.role === 'admin' && mailRx.test(u.username))
    .map(u => u.username);
  const managerMail = ticket.managerId
    ? users.find(u => u.id === ticket.managerId)?.username
    : undefined;

  const to: string[] = [];
  if (ticket.target === 'admin' || ticket.target === 'both') to.push(...admins);
  if ((ticket.target === 'manager' || ticket.target === 'both') && managerMail && mailRx.test(managerMail)) to.push(managerMail);

  notify({
    username,
    category: 'ticket',
    message: `Nouveau ticket: ${title}`,
    to,
  }).catch(err => console.error('[TICKET]', (err as Error).message));

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
  const ticket = list[idx];
  const to: string[] = mailRx.test(ticket.username) ? [ticket.username] : [];

  notify({
    username: ticket.username,
    category: 'ticket',
    message: `Mise à jour du ticket "${ticket.title}" : ${status}`,
    to,
  }).catch(err => console.error('[TICKET]', (err as Error).message));

  res.json(ticket);
});

export default router;
