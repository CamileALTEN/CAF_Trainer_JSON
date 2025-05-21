import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { INotification } from '../models/INotification';
import { IUser } from '../models/IUser';
import { sendMail } from '../utils/mailer';

const router = Router();
const NOTIFS = 'notifications';

/**
  * GET /api/notifications
  */
router.get('/', (req, res) => {
  const { managerId } = req.query as { managerId?: string };
  const notifs = read<INotification>(NOTIFS);

  if (managerId) {
    const users = read<IUser>('users');
    const cafs  = users.filter(u => u.managerId === managerId).map(u => u.username);
    return res.json(notifs.filter(n => cafs.includes(n.username)));
  }

  res.json(notifs);
});

/**
* POST /api/notifications
* Body: { username, date, message? }
*/
router.post('/', async (req, res) => {
  const notifs = read<INotification>(NOTIFS);
  const entry: INotification = {
    id: Date.now().toString(),
    ...(req.body as Omit<INotification, 'id'>),
  };
  notifs.push(entry);
  write(NOTIFS, notifs);

  // tentative d'envoi de mail au manager référent
  try {
    const users    = read<IUser>('users');
    const caf      = users.find(u => u.username === entry.username);
    const manager  = caf && caf.managerId
      ? users.find(u => u.id === caf.managerId)
      : undefined;
    const mailRx   = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;

    if (manager && mailRx.test(manager.username)) {
      await sendMail(
        manager.username,
        'CAF‑Trainer : nouvelle notification',
        `<p>${entry.username} : ${entry.message ?? ''}</p>`
      );
    }
  } catch (err) {
    console.error('[NOTIF]', (err as Error).message);
  }

  res.status(201).json(entry);
});

export default router;