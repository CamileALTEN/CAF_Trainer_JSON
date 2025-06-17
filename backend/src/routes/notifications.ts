import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { INotification } from '../models/INotification';

const router = Router();
const NOTIFS = 'notifications';

/**
  * GET /api/notifications
  */
router.get('/', (req, res) => {
  res.json(read<INotification>(NOTIFS));
});

// GET /api/notifications/for/:username – toutes les notifs ciblant l'utilisateur
router.get('/for/:username', (req, res) => {
  const list = read<INotification>(NOTIFS);
  const { username } = req.params;
  const result = list.filter((n) =>
    !n.cible || n.cible.includes(username) || n.username === username
  );
  res.json(result);
});

/**
* POST /api/notifications
* Body: { username, date, message? }
*/
router.post('/', (req, res) => {
  const notifs = read<INotification>(NOTIFS);
  const entry: INotification = {
    id: Date.now().toString(),
    dateEnvoi: new Date().toISOString(),
    date: new Date().toISOString(), // compat old clients
    ...req.body as Omit<INotification, 'id'>,
    etat: {
      luPar: [],
      nonLuPar: req.body.cible ? [...req.body.cible] : [],
    },
  };
  notifs.push(entry);
  write(NOTIFS, notifs);
  res.status(201).json(entry);
});

// PATCH /api/notifications/:id/read – marque une notif comme lue par username
router.patch('/:id/read', (req, res) => {
  const { id } = req.params;
  const { username } = req.body as { username: string };
  const notifs = read<INotification>(NOTIFS);
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' });
  }
  const state = notifs[idx].etat || { luPar: [], nonLuPar: [] };
  if (!state.luPar.includes(username)) state.luPar.push(username);
  state.nonLuPar = state.nonLuPar.filter((u) => u !== username);
  notifs[idx].etat = state;
  write(NOTIFS, notifs);
  res.json({ ok: true });
});

export default router;
