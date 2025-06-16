import path from 'path';
import dotenv from 'dotenv';

// Charger **immédiatement** le .env du dossier backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import fs from 'fs';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import modulesRouter from './routes/modules';
import notifsRouter from './routes/notifications';
import progressRouter from './routes/progress';
import ticketsRouter from './routes/tickets';
import checklistRouter from './routes/checklist';
import imagesRouter from './routes/images';
import videosRouter from './routes/videos';
import analyticsRouter from './routes/analytics';
import favoritesRouter from './routes/favorites';
import quizRouter from './routes/quiz';
import sitesRouter from './routes/sites';
import cafTypesRouter from './routes/cafTypes';

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_IMG_DIR = path.resolve('A:/CAF-Trainer/backend/image');
const IMG_DIR = process.env.IMAGE_DIR
  ? path.resolve(process.env.IMAGE_DIR)
  : DEFAULT_IMG_DIR;
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
const DEFAULT_VID_DIR = path.resolve('A:/CAF-Trainer/backend/video');
const VID_DIR = process.env.VIDEO_DIR
  ? path.resolve(process.env.VIDEO_DIR)
  : DEFAULT_VID_DIR;
if (!fs.existsSync(VID_DIR)) fs.mkdirSync(VID_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use('/images', express.static(IMG_DIR));
app.use('/videos', express.static(VID_DIR));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/notifications', notifsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/checklist-url', checklistRouter);
app.use('/api/images', imagesRouter);
app.use('/api/videos', videosRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/quiz-results', quizRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/caf-types', cafTypesRouter);

app.get('/', (_req, res) => {
res.send('🚀 Backend TS démarré !');
});

app.listen(PORT, () => {
console.log(`🚀 Backend TS sur http://localhost:${PORT}`);
});