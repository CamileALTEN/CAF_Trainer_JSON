import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IQuizResult } from '../models/IQuizResult';

const router = Router();
const TABLE = 'quizResults';

router.get('/:username', (req, res) => {
  const rows = read<IQuizResult>(TABLE).filter(r => r.username === req.params.username);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { username, moduleId, itemId, answers, score } = req.body as Partial<IQuizResult>;
  if (!username || !moduleId || !itemId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Données manquantes' });
  }
  const list = read<IQuizResult>(TABLE);
  const date = new Date().toISOString();
  const rec: IQuizResult = { username, moduleId, itemId, answers, score: score ?? 0, date };
  const idx = list.findIndex(r => r.username === username && r.moduleId === moduleId && r.itemId === itemId);
  if (idx === -1) list.push(rec); else list[idx] = rec;
  write(TABLE, list);
  res.json({ ok: true });
});

export default router;
