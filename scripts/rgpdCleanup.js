
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../backend/src/data');
const ARCHIVE_DIR = path.join(__dirname, '../backend/archive');

if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function getCurrentDate() {
  try {
    const res = await fetch('http://worldtimeapi.org/api/timezone/etc/utc');
    const { utc_datetime } = await res.json();
    return new Date(utc_datetime);
  } catch {
    return new Date();
  }
}

const SIX_MONTHS = 1000 * 60 * 60 * 24 * 30 * 6;
const THREE_YEARS = 1000 * 60 * 60 * 24 * 365 * 3;

function moveEntries(list, archiveList, predicate) {
  const remaining = [];
  for (const item of list) {
    if (predicate(item)) archiveList.push(item); else remaining.push(item);
  }
  return remaining;
}

function removeEntries(list, predicate) {
  return list.filter(item => !predicate(item));
}

async function main() {
  const now = await getCurrentDate();

  const usersFile = path.join(DATA_DIR, 'users.json');
  const users = readJSON(usersFile);
  const usersArchiveFile = path.join(ARCHIVE_DIR, 'users.json');
  const usersArchive = readJSON(usersArchiveFile);

  const files = {
    progress: 'progress.json',
    tickets: 'tickets.json',
    favorites: 'favorites.json',
    quizResults: 'quizResults.json',
    notifications: 'notifications.json',
    analytics: 'analytics.json'
  };

  const data = {};
  const archives = {};
  for (const key in files) {
    data[key] = readJSON(path.join(DATA_DIR, files[key]));
    const archFile = path.join(ARCHIVE_DIR, files[key]);
    archives[key] = readJSON(archFile);
  }

  const newUsers = [];
  const newUsersArchive = [];

  function transferUserData(user) {
    const { id, username } = user;
    data.progress = moveEntries(data.progress, archives.progress, p => p.username === username);
    data.tickets = moveEntries(data.tickets, archives.tickets, t => t.username === username || t.managerId === id);
    data.favorites = moveEntries(data.favorites, archives.favorites, f => f.userId === id);
    data.quizResults = moveEntries(data.quizResults, archives.quizResults, q => q.username === username);
    data.notifications = moveEntries(data.notifications, archives.notifications, n => n.username === username);
    if (data.analytics.sessions) {
      archives.analytics.sessions = archives.analytics.sessions || [];
      const remain = [];
      for (const s of data.analytics.sessions) {
        if (s.userId === id) archives.analytics.sessions.push(s); else remain.push(s);
      }
      data.analytics.sessions = remain;
    }
  }

  for (const u of users) {
    if (!u.deletedAt) { newUsers.push(u); continue; }
    const diff = now - new Date(u.deletedAt).getTime();
    if (diff < SIX_MONTHS) {
      newUsers.push(u);
    } else if (diff < SIX_MONTHS + THREE_YEARS) {
      transferUserData(u);
      newUsersArchive.push(u);
    }
    // if diff >= 3y+6m : do not keep user or data
  }

  for (const u of usersArchive) {
    const diff = now - new Date(u.deletedAt).getTime();
    if (diff < SIX_MONTHS + THREE_YEARS) {
      newUsersArchive.push(u);
    }
    // else discard permanently
  }

  writeJSON(usersFile, newUsers);
  writeJSON(usersArchiveFile, newUsersArchive);

  for (const key in files) {
    writeJSON(path.join(DATA_DIR, files[key]), data[key]);
    writeJSON(path.join(ARCHIVE_DIR, files[key]), archives[key]);
  }
}

main();

