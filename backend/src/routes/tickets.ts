import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ITicket, TicketStatus, TicketPriority, TicketReply } from '../models/ITicket';
import { IUser } from '../models/IUser';
import { notify } from '../utils/notifier';

const router = Router();
const TABLE = 'tickets';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

function load() { return read<ITicket>(TABLE); }
function save(list: ITicket[]) { write(TABLE, list); }

router.get('/', (req, res) => {
  const { username, role, managerId } = req.query as {
    username?: string;
    role?: 'admin' | 'manager' | 'caf';
    managerId?: string;
  };
  let list = load();
  if (role === 'caf' && username) {
    list = list.filter(t => t.username === username);
  } else if (role === 'manager') {
    list = list.filter(t => t.username === username || t.managerId === managerId);
  }
  res.json(list);
});

router.post('/', (req, res) => {
  const { username, target, title, message, category, priority, attachment } = req.body as Partial<ITicket>;
  if (!username || !target || !title || !message)
    return res.status(400).json({ error: 'Données manquantes' });

  const users = read<IUser>('users');
  const author = users.find(u => u.username === username);

  const ticket: ITicket = {
    id: Date.now().toString(),
    username,
    managerId: author?.managerId,
    target: target as any,
    assignedToId: undefined,
    assignments: [],
    category,
    priority: (priority as TicketPriority) || 'normal',
    attachment,
    title,
    message,
    status: 'open',
    date: new Date().toISOString(),
    replies: [],
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
    message: `Nouveau ticket de ${username} intitulé "${title}" :       ${message}.`,
    to,
  }).catch(err => console.error('[TICKET]', (err as Error).message));

  res.status(201).json(ticket);
});

router.post('/:id/reply', (req, res) => {
  const { author, role, message } = req.body as Partial<TicketReply & { role: 'admin' | 'manager' | 'caf' }>;
  if (!author || !role || !message) return res.status(400).json({ error: 'Données manquantes' });

  const list = load();
  const ticket = list.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Introuvable' });

  const reply: TicketReply = { author, role, message, date: new Date().toISOString() };
  ticket.replies.push(reply);
  save(list);

  const to: string[] = mailRx.test(ticket.username) ? [ticket.username] : [];
  notify({
    username: author,
    category: 'ticket',
    message: `Nouvelle réponse au ticket "${ticket.title}"`,
    to,
  }).catch(err => console.error('[TICKET]', (err as Error).message));

  res.status(201).json(reply);
});

router.patch('/:id', (req, res) => {
  const { status, assignedToId, author, role } = req.body as {
    status?: TicketStatus;
    assignedToId?: string;
    author?: string;
    role?: 'admin' | 'manager';
  };

  const list = load();
  const ticket = list.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Introuvable' });

  const users = read<IUser>('users');

  if (assignedToId) {
    if (ticket.assignedToId && ticket.assignedToId !== assignedToId && role !== 'admin') {
      return res.status(403).json({ error: 'Réassignation réservée aux admins' });
    }
    ticket.assignedToId = assignedToId;
    ticket.assignments = ticket.assignments || [];
    ticket.assignments.push({ assigneeId: assignedToId, date: new Date().toISOString() });
    const assignee = users.find(u => u.id === assignedToId)?.username;
    const to = assignee && mailRx.test(assignee) ? [assignee] : [];
    notify({
      username: author || 'system',
      category: 'ticket',
      message: `Ticket "${ticket.title}" assigné à ${assignee}`,
      to,
    }).catch(err => console.error('[TICKET]', (err as Error).message));
  }

  if (status) {
    ticket.status = status;
    const to: string[] = mailRx.test(ticket.username) ? [ticket.username] : [];
    if (status === 'resolved' || status === 'closed') {
      notify({
        username: ticket.username,
        category: 'ticket',
        message: `Ticket "${ticket.title}" ${status === 'resolved' ? 'résolu' : 'fermé'}`,
        to,
      }).catch(err => console.error('[TICKET]', (err as Error).message));
    } else {
      notify({
        username: ticket.username,
        category: 'ticket',
        message: `Mise à jour du ticket "${ticket.title}" : ${status}`,
        to,
      }).catch(err => console.error('[TICKET]', (err as Error).message));
    }
  }

  save(list);
  res.json(ticket);
});

export default router;
