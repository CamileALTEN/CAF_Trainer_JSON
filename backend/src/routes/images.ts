import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
// Stocke les images dans le dossier défini par IMAGE_DIR ou à côté du backend
const DEFAULT_DIR = path.resolve('A:/CAF-Trainer/backend/image');
const DIR = process.env.IMAGE_DIR
  ? path.resolve(process.env.IMAGE_DIR)
  : DEFAULT_DIR;

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

router.post('/', (req, res) => {
  const { data } = req.body as { data?: string };
  if (!data) return res.status(400).json({ error: 'Donnée manquante' });

  const m = data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) return res.status(400).json({ error: 'Format invalide' });

  const ext = m[1].split('/')[1];
  const base64 = m[2];
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(DIR, name), base64, 'base64');
  res.json({ url: `/images/${name}` });
});

export default router;
