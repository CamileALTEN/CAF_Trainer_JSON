const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../backend/src/data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
