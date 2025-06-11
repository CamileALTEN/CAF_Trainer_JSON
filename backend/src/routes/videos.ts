import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
// Stocke les vidéos dans le même dossier que celui exposé par index.ts
const DIR = path.resolve(__dirname, '../..', 'video');

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

router.post('/', (req, res) => {
  const { data } = req.body as { data?: string };
  if (!data) return res.status(400).json({ error: 'Donnée manquante' });

  const m = data.match(/^data:(video\/\w+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: 'Format invalide' });

  const ext = m[1].split('/')[1];
  const base64 = m[2];
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(DIR, name), base64, 'base64');
  res.json({ url: `/videos/${name}` });
});

export default router;
