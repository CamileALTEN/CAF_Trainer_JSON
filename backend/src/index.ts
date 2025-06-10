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
import analyticsRouter from './routes/analytics';
import favoritesRouter from './routes/favorites';
import quizRouter from './routes/quiz';

const app = express();
const PORT = process.env.PORT || 5000;

const IMG_DIR = path.resolve(__dirname, '../image');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/images', express.static(IMG_DIR));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/notifications', notifsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/checklist-url', checklistRouter);
app.use('/api/images', imagesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/quiz-results', quizRouter);

app.get('/', (_req, res) => {
res.send('🚀 Backend TS démarré !');
});

app.listen(PORT, () => {
console.log(`🚀 Backend TS sur http://localhost:${PORT}`);
});