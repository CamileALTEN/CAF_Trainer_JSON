import { Router } from 'express';
import { read, write } from '../config/dataStore';
import { ISettings } from '../models/ISettings';

const router = Router();
const TABLE = 'settings';

function load(): ISettings {
  return read<ISettings>(TABLE)[0] ?? { mailEnabled: true };
}

function save(s: ISettings) {
  write<ISettings>(TABLE, [s]);
}

router.get('/', (_req, res) => {
  res.json(load());
});

router.put('/', (req, res) => {
  const { mailEnabled, admin } = req.body as Partial<ISettings> & { admin?: string };
  const settings = load();
  if (typeof mailEnabled === 'boolean') {
    settings.mailEnabled = mailEnabled;
    console.log(`[SETTINGS] mailEnabled=${mailEnabled} by ${admin || 'unknown'} at ${new Date().toISOString()}`);
  }
  save(settings);
  res.json(settings);
});

export default router;
