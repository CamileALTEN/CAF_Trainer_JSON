import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IHelpRequest } from '../models/IHelpRequest';
import { IUser } from '../models/IUser';
import { notify } from '../utils/notifier';

const router = Router();
const TABLE = 'helpRequests';

router.get('/', (_req, res) => {
  res.json(read<IHelpRequest>(TABLE));
});

router.post('/', (req, res) => {
  const { username, moduleId, itemId, itemTitle, message, notifyManager, email } = req.body as Partial<IHelpRequest> & { notifyManager?: boolean };
  if (!username || !moduleId || !itemId)
    return res.status(400).json({ error: 'Données manquantes' });

  const list = read<IHelpRequest>(TABLE);
  const entry: IHelpRequest = {
    id: Date.now().toString(),
    username,
    moduleId,
    itemId,
    itemTitle: itemTitle ?? '',
    message: message ?? '',
    notifyManager: !!notifyManager,
    email,
    date: new Date().toISOString(),
  };
  list.push(entry);
  write(TABLE, list);

  const users = read<IUser>('users');
  const to: string[] = [];
  if (notifyManager) {
    const author = users.find(u => u.username === username);
    const managerMail = author && author.managerId ? users.find(u => u.id === author.managerId)?.username : undefined;
    if (managerMail) to.push(managerMail);
  }
  if (email) to.push(email);

  notify({
    username,
    category: 'help',
    message: `Demande d'aide sur "${itemTitle}"`,
    to,
  }).catch(err => console.error('[HELP]', (err as Error).message));

  res.status(201).json(entry);
});

export default router;
