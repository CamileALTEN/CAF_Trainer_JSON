import { Router }     from 'express';
import bcrypt          from 'bcrypt';
import { read, write } from '../config/dataStore';
import { IUser, Role } from '../models/IUser';
import { IProgress } from '../models/IProgress';

const router   = Router();
const TABLE    = 'users';
const hash     = (pwd: string) => bcrypt.hashSync(pwd, 8);
const mailRx = /^[a-z0-9]+(\.[a-z0-9]+)?@alten\.com$/i;


/* ───────────── GET liste complète ───────────── */
router.get('/', (_req, res) => {
    const { managerId } = _req.query as { managerId?: string };
    let list = read<IUser>(TABLE);
    if (managerId) list = list.filter(u => u.managerIds?.includes(managerId));
    res.json(list.map(({ password, ...u }) => u));
});

/* ───────────── POST création ─────────────────── */
router.post('/', (req, res) => {
const { username, password, role, site, managerIds, sites, cafTypeId } = req.body as Partial<IUser>;

if (!username || !password || !role)
    return res.status(400).json({ error: 'Champs manquants' });
if (!mailRx.test(username))
    return res.status(400).json({ error: 'Username doit être prenom.nom@alten.com' });

const list = read<IUser>(TABLE);
if (list.some(u => u.username === username))
    return res.status(409).json({ error: 'Nom déjà pris' });

if (role === 'manager' && managerIds?.length)
    return res.status(400).json({ error: 'Un manager ne peut avoir de managerIds' });
if (role === 'caf' && (!managerIds || managerIds.length === 0))
    return res.status(400).json({ error: 'managerIds requis pour un CAF' });
if (role === 'caf' && !cafTypeId)
    return res.status(400).json({ error: 'cafTypeId requis pour un CAF' });
if (role === 'manager' && (!sites || sites.length === 0))
    return res.status(400).json({ error: 'sites requis pour un manager' });

const user: IUser = {
    id: Date.now().toString(),
    username,
    password: hash(password),
    role: role as Role,
    site: role === 'caf' ? site : undefined,
    cafTypeId: role === 'caf' ? cafTypeId : undefined,
    managerIds: role === 'caf' ? managerIds : undefined,
    sites: role === 'manager' ? sites : undefined,
};
list.push(user); write(TABLE, list);
const { password: _p, ...clean } = user;
res.status(201).json(clean);
});

/* ───────────── PATCH mot de passe ────────────── */
router.patch('/:id/password', (req, res) => {
const { password } = req.body as { password: string };
if (!password) return res.status(400).json({ error: 'pwd manquant' });

const list = read<IUser>(TABLE);
const idx  = list.findIndex(u => u.id === req.params.id);
if (idx === -1) return res.status(404).json({ error: 'Introuvable' });

list[idx].password = hash(password);
write(TABLE, list);
res.json({ ok: true });
});

/* ───────────── PATCH général ─────────────────── */
router.patch('/:id', (req, res) => {
const data = req.body as Partial<IUser>;
const list = read<IUser>(TABLE);
const idx  = list.findIndex(u => u.id === req.params.id);
if (idx === -1) return res.status(404).json({ error: 'Introuvable' });

if (data.username) {
    if (!mailRx.test(data.username))
    return res.status(400).json({ error: 'Username doit être prenom.nom@alten.com' });
    if (list.some(u => u.username === data.username && u.id !== req.params.id))
    return res.status(409).json({ error: 'Nom déjà pris' });
}

let updated = { ...list[idx], ...data } as IUser;

  // enlever les champs incompatibles lors d'un changement de rôle
  if (data.role && data.role !== list[idx].role) {
    if (data.role === 'manager') {
      updated.managerIds = undefined;
      updated.site = undefined;
      updated.cafTypeId = undefined;
    } else if (data.role === 'caf') {
      updated.sites = undefined;
    } else {
      updated.managerIds = undefined;
      updated.site = undefined;
      updated.sites = undefined;
      updated.cafTypeId = undefined;
    }
  }

  if (updated.role === 'manager' && updated.managerIds?.length)
    return res.status(400).json({ error: 'Un manager ne peut avoir de managerIds' });
  if (updated.role === 'caf' && (!updated.managerIds || updated.managerIds.length === 0))
    return res.status(400).json({ error: 'managerIds requis pour un CAF' });
  if (updated.role === 'caf' && !updated.cafTypeId)
    return res.status(400).json({ error: 'cafTypeId requis pour un CAF' });
  if (updated.role === 'manager' && (!updated.sites || updated.sites.length === 0))
    return res.status(400).json({ error: 'sites requis pour un manager' });

  // si le nom d'utilisateur change, mettre à jour la progression associée
  if (data.username && data.username !== list[idx].username) {
    const prog = read<IProgress>('progress');
    prog.forEach(p => {
      if (p.username === list[idx].username) p.username = data.username as string;
    });
    write('progress', prog);
  }

Object.assign(list[idx], updated);
write(TABLE, list);
const { password, ...clean } = list[idx];
res.json(clean);
});

/* ───────────── DELETE ────────────────────────── */
router.delete('/:id', (req, res) => {
const list  = read<IUser>(TABLE);
const after = list.filter(u => u.id !== req.params.id);
if (after.length === list.length)
    return res.status(404).json({ error: 'Introuvable' });
write(TABLE, after);
res.status(204).end();
});

export default router;