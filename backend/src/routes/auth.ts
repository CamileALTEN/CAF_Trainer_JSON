/* backend/src/routes/auth.ts
───────────────────────────────────────────────────────────────────────── */

import { Router }        from 'express';
import { startSession }  from '../utils/analytics';
import bcrypt            from 'bcrypt';
import { read, write }   from '../config/dataStore';
import { IUser }         from '../models/IUser';
import { notify }        from '../utils/notifier';
import { NotificationCategory } from '../models/INotification';

const router   = Router();
const USERS    = 'users';
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;


/* ───────────────────────── LOGIN ───────────────────────── */
router.post('/login', (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    const users = read<IUser>(USERS);

    const user = users.find(u => {
    if (u.username !== username) return false;
    /* mot de passe haché ? → bcrypt.compare */
    if (u.password.startsWith('$2')) return bcrypt.compareSync(password, u.password);
    /* anciens comptes demo non hachés */
    return u.password === password;
    });

    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const { id, role, site } = user;
    startSession(id, role as any).catch(() => undefined);
    res.json({ id, username, role, site });
});

/* ───────────────────────── REGISTER ────────────────────── */
router.post('/register', (req, res) => {
    const { username, password, role, site, managerIds, sites } = req.body as Partial<IUser>;

    if (!username || !password || !role)
    return res.status(400).json({ error: 'Champs manquants' });
    if (!mailRx.test(username))
    return res.status(400).json({ error: 'Format attendu : prenom.nom@alten.com' });

    const users = read<IUser>(USERS);
    if (users.some(u => u.username === username))
    return res.status(409).json({ error: 'Nom déjà pris' });

    const id = Date.now().toString();
    const newUser: IUser = {
    id,
    username,
    password: bcrypt.hashSync(password, 8),
    role,
    site: role === 'caf' ? site : undefined,
    sites: role === 'manager' ? sites : undefined,
    managerIds: role === 'caf' ? managerIds : undefined,
    } as IUser;

    users.push(newUser);
    write(USERS, users);
    res.status(201).json({ id, username, role, site: newUser.site, managerIds: newUser.managerIds, sites: newUser.sites });
});

/* ───────────────────────── FORGOT PWD ───────────────────── */
router.post('/forgot', (req, res) => {
    const { username } = req.body as { username: string };
    if (!username) return res.status(400).json({ error: 'Username requis' });

    const users = read<IUser>(USERS);
    const user  = users.find(u => u.username === username);
    if (!user)  return res.status(404).json({ error: 'Compte introuvable' });

    const message = 'Demande de réinitialisation de mot de passe';

    /* destinataires : tous les admins possédant une adresse valide + manager référent éventuel */
    const admins      = users
      .filter(u => u.role === 'admin' && mailRx.test(u.username))
      .map(u => u.username);
    const managerMails = (user.managerIds || [])
      .map(id => users.find(u => u.id === id)?.username)
      .filter((m): m is string => !!m);

    const to = [
      ...admins,
      ...managerMails.filter(m => mailRx.test(m)),
    ];

    if (to.length === 0) {
      console.error('[FORGOT] Aucun destinataire e‑mail valide');
      return res.status(500).json({ error: 'Aucun destinataire e‑mail valide' });
    }

    notify({
      username,
      category: 'password',
      message,
      to,
    })
      .then(() => res.json({ ok: true }))
      .catch(err => {
        console.error('[FORGOT]', (err as Error).message);
        res.status(500).json({ error: 'Envoi e‑mail impossible' });
      });
});

export default router;
