import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
// Dossier de stockage des images
const DIR = process.env.IMG_DIR
  ? path.resolve(process.env.IMG_DIR)
  : path.resolve(__dirname, '../..', 'image');

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
