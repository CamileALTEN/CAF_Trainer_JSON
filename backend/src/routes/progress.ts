import { Router } from 'express';
import { read } from '../config/dataStore';
import { IProgress } from '../models/IProgress';
import { IUser } from '../models/IUser';
import { IUserProgress } from '../models/IUserProgress';
import { IModule, IItem } from '../models/IModule';

const router = Router();
const PROGRESS = 'userProgress';
const MODULES = 'modules';

function mapItemsToModules(modules: IModule[]): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (items: IItem[], moduleId: string) => {
    items.forEach(it => {
      map.set(it.id, moduleId);
      if (it.children) walk(it.children, moduleId);
    });
  };
  modules.forEach(m => walk(m.items, m.id));
  return map;
}

function buildProgress(userId: string, username: string): IProgress[] {
  const modules = read<IModule>(MODULES);
  const map = mapItemsToModules(modules);
  const list = read<IUserProgress>(PROGRESS).filter(p => p.userId === userId);
  const grouped: Record<string, string[]> = {};
  list.forEach(p => {
    const mId = map.get(p.itemId);
    if (!mId) return;
    if (p.status === 'non_commencé') return;
    if (!grouped[mId]) grouped[mId] = [];
    grouped[mId].push(p.itemId);
  });
  return Object.entries(grouped).map(([moduleId, visited]) => ({
    username,
    moduleId,
    visited,
  }));
}

// GET /api/progress/:username – progression d'un CAF
router.get('/:username', (req, res) => {
  const users = read<IUser>('users');
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'Utilisateur inconnu' });
  res.json(buildProgress(user.id, user.username));
});

// GET /api/progress?managerId=… – progression de tous les CAF d'un manager
router.get('/', (req, res) => {
  const { managerId } = req.query as { managerId?: string };
  const users = read<IUser>('users');
  const targets = managerId
    ? users.filter(u => u.managerId === managerId)
    : users.filter(u => u.role === 'caf');
  const result: IProgress[] = [];
  targets.forEach(u => {
    result.push(...buildProgress(u.id, u.username));
  });
  res.json(result);
});

export default router;
