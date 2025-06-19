const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');

function load() {
  const rootEnv = path.join(ROOT, '.env');
  const backEnv = path.join(BACKEND, '.env');
  if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
  if (fs.existsSync(backEnv)) dotenv.config({ path: backEnv, override: true });
}

function normalize(p) {
  return p.split(/[\\/]+/).join(path.sep);
}

function resolveDir(envVar, fallback) {
  const value = process.env[envVar];
  if (value) {
    const norm = normalize(value);
    return path.isAbsolute(value)
      ? path.resolve(norm)
      : path.resolve(BACKEND, norm);
  }
  return path.resolve(BACKEND, fallback);
}

module.exports = { load, resolveDir, ROOT, BACKEND };
