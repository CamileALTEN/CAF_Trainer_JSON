import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IProgress } from '../models/IProgress';
import { IUser } from '../models/IUser';
import { IModule, IItem } from '../models/IModule';
import { createNotificationAuto } from '../utils/notifier';

const router = Router();
const TABLE = 'progress';

// GET /api/progress/:username – lecture complète d’un CAF
router.get('/:username', (req, res) => {
  const rows = read<IProgress>(TABLE).filter((p) => p.username === req.params.username);
  res.json(rows);
});

// PATCH /api/progress – MAJ d'un module
router.patch('/', (req, res) => {
  const {
    username,
    moduleId,
    visited = [],
    started = [],
    needValidation = [],
  } = req.body as Partial<IProgress>;

  if (!username || !moduleId) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const uniqVisited = Array.from(new Set(visited));
  const uniqNeedVal = Array.from(new Set(needValidation)).filter((id) => !uniqVisited.includes(id));
  const uniqStarted = Array.from(new Set(started))
    .filter((id) => !uniqVisited.includes(id) && !uniqNeedVal.includes(id));

  const list = read<IProgress>(TABLE);
  const idx = list.findIndex((p) => p.username === username && p.moduleId === moduleId);
  const modules = read<IModule>('modules');
  const mod = modules.find((m) => m.id === moduleId);
  const collectIds = (items: IItem[]): string[] =>
    items.reduce((arr, it) => [...arr, it.id, ...(it.children ? collectIds(it.children) : [])], [] as string[]);
  const allIds = mod ? collectIds(mod.items) : [];
  const previouslyVisited = idx === -1 ? [] : list[idx].visited;

  if (idx === -1) {
    list.push({ username, moduleId, visited: uniqVisited, started: uniqStarted, needValidation: uniqNeedVal });
  } else {
    list[idx].visited = uniqVisited;
    list[idx].started = uniqStarted;
    list[idx].needValidation = uniqNeedVal;
  }

  const nowCompleted = allIds.length > 0 && allIds.every((id) => uniqVisited.includes(id));
  const wasCompleted = allIds.length > 0 && allIds.every((id) => previouslyVisited.includes(id));
  if (mod && nowCompleted && !wasCompleted) {
    createNotificationAuto({
      type: 'success',
      message: `Bravo, vous avez terminé le module "${mod.title}" !`,
      cible: [username],
      origine: 'module_completed',
    });
  }

  write(TABLE, list);
  res.json({ ok: true });
});

// GET /api/progress?managerId=… – progression de tous les CAF d’un manager
router.get('/', (req, res) => {
  const { managerId } = req.query as { managerId?: string };
  const rows = read<IProgress>(TABLE);
  const users = read<IUser>('users');

  if (managerId) {
    const cafIds = users.filter(u => u.managerIds?.includes(managerId)).map(u => u.username);
    return res.json(rows.filter(r => cafIds.includes(r.username)));
  }
  res.json(rows);
});

export default router;
