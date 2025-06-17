import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { IAlertConfig, IAlertAction } from '../models/IAlertConfig';

const router = Router();
const CONF = 'alertConfig';
const ACTS = 'alertActions';

function loadConf(): IAlertConfig {
  return read<IAlertConfig>(CONF)[0] ?? {
    text: 'Mise à jour nécessaire du contenu des modules',
    url: '#',
    frequency: 0,
    active: false,
  };
}

function saveConf(c: IAlertConfig) {
  write<IAlertConfig>(CONF, [c]);
}

function loadActs(): IAlertAction[] {
  return read<IAlertAction>(ACTS);
}

function saveActs(list: IAlertAction[]) {
  write<IAlertAction>(ACTS, list);
}

router.get('/', (_req, res) => {
  res.json(loadConf());
});

router.put('/', (req, res) => {
  const conf = loadConf();
  const { text, url, frequency, active } = req.body as Partial<IAlertConfig>;
  if (text !== undefined) conf.text = text;
  if (url !== undefined) conf.url = url;
  if (typeof frequency === 'number') conf.frequency = frequency;
  if (typeof active === 'boolean') conf.active = active;
  saveConf(conf);
  res.json(conf);
});

router.get('/actions', (_req, res) => {
  res.json(loadActs());
});

function parseName(u: string) {
  const m = u.match(/^(\w+)\.(\w+)@/);
  if (m)
    return `${m[1]} ${m[2]}`;
  return u;
}

router.post('/actions', (req, res) => {
  const list = loadActs();
  const { items, user, comment } = req.body as { items: string[]; user: string; comment?: string };
  const entry: IAlertAction = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    items: items || [],
    user: parseName(user || ''),
    comment: comment ?? ''
  };
  list.push(entry);
  saveActs(list);

  const conf = loadConf();
  conf.active = false;
  conf.lastAck = entry.date;
  saveConf(conf);

  res.status(201).json(entry);
});

router.delete('/actions', (_req, res) => {
  saveActs([]);
  res.status(204).end();
});

export default router;
