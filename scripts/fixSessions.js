const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis le .env racine
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Puis, si present, complete avec le .env du backend sans ecraser
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

function isAbsolute(p) {
  return path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p);
}

function normalize(p) {
  return p.split(/[\\/]+/).join(path.sep);
}

function getDir(envVar, fallback) {
  const value = process.env[envVar];
  if (value) {
    const norm = normalize(value);
    return isAbsolute(value)
      ? path.normalize(norm)
      : path.resolve(__dirname, '../backend', norm);
  }
  return path.resolve(__dirname, '../backend', fallback);
}

const DATA_DIR = getDir('DATA_DIR', 'src/data');
const FILE = path.join(DATA_DIR, 'analytics.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { sessions: [], favorites: [], averages: {} };
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addMissingLogouts() {
  const data = load();
  if (!Array.isArray(data.sessions)) return;

  let changed = false;

  data.sessions.forEach((s) => {
    if (!s.logout && s.login) {
      const loginDate = new Date(s.login);
      const logoutDate = new Date(loginDate.getTime() + 10 * 60 * 1000);
      s.logout = logoutDate.toISOString();

      const duration = Math.ceil((logoutDate.getTime() - loginDate.getTime()) / 60000);
      const stats = data.averages?.[s.userId] || { avg: 0, count: 0 };
      const newAvg = (stats.avg * stats.count + duration) / (stats.count + 1);
      data.averages = data.averages || {};
      data.averages[s.userId] = { avg: newAvg, prevAvg: stats.avg, count: stats.count + 1 };

      changed = true;
    }
  });

  if (changed) {
    save(data);
    console.log('Analytics updated.');
  } else {
    console.log('No missing logouts found.');
  }
}

addMissingLogouts();
