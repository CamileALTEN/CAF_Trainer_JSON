import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IUserProgress } from '../models/IUserProgress';
import { IHelpRequest } from '../models/IHelpRequest';
import { IUser } from '../models/IUser';
import { sendMail } from '../utils/mailer';

const router = Router();
const TABLE = 'userProgress';
const HELP_TABLE = 'helpRequests';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

router.get('/', (req, res) => {
  const { managerId } = req.query as { managerId?: string };
  const list = read<IUserProgress>(TABLE);
  if (managerId) {
    const users = read<IUser>('users');
    const cafIds = users.filter(u => u.managerId === managerId).map(u => u.id);
    return res.json(list.filter(p => cafIds.includes(p.userId)));
  }
  res.json(list);
});

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const list = read<IUserProgress>(TABLE).filter(p => p.userId === userId);
  res.json(list);
});

router.patch('/:userId/items/:itemId/status', (req, res) => {
  const { status } = req.body as Partial<IUserProgress>;
  const { userId, itemId } = req.params;

  if (!status) return res.status(400).json({ error: 'status manquant' });

  const list = read<IUserProgress>(TABLE);
  const idx = list.findIndex(p => p.userId === userId && p.itemId === itemId);

  if (idx === -1) list.push({ userId, itemId, status });
  else list[idx].status = status;

  write(TABLE, list);
  res.json({ ok: true });
});

router.post('/:userId/items/:itemId/help-request', (req, res) => {
  const { message, email } = req.body as { message?: string; email?: string };
  const { userId, itemId } = req.params;

  if (!message) return res.status(400).json({ error: 'message manquant' });

  let to = email;
  if (!to) {
    const users = read<IUser>('users');
    const user = users.find(u => u.id === userId);
    const managerMail = user?.managerId ? users.find(u => u.id === user.managerId)?.username : undefined;
    if (managerMail && mailRx.test(managerMail)) to = managerMail;
  }

  const list = read<IHelpRequest>(HELP_TABLE);
  const entry: IHelpRequest = {
    id: Date.now().toString(),
    userId,
    itemId,
    message,
    email: to,
    date: new Date().toISOString(),
  };
  list.push(entry);
  write(HELP_TABLE, list);

  if (to && process.env.MAIL_USER && process.env.MAIL_PASS) {
    sendMail(to, 'CAF‑Trainer Aide', `<p>${message}</p>`).catch(err =>
      console.error('[HELP]', (err as Error).message)
    );
  }

  res.status(201).json(entry);
});

export default router;
