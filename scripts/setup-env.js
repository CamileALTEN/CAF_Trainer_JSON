const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const data = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of data) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function saveEnv(file, env) {
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

(async () => {
  const type = (await ask('Utiliser le dossier local ou un lecteur réseau ? (L/R) ')).trim().toUpperCase();
  let base;
  if (type === 'R') {
    const letter = (await ask('Lettre du lecteur monté (ex: Z): ')).trim().toUpperCase();
    base = `${letter}:\\CAF-Trainer\\backend`;
  } else {
    base = 'backend';
  }

  const envVars = {
    DATA_DIR: path.join(base, 'src', 'data'),
    IMAGE_DIR: path.join(base, 'image'),
    VIDEO_DIR: path.join(base, 'video'),
    ARCHIVE_DIR: path.join(base, 'archive')
  };

  const rootEnvFile = path.resolve(__dirname, '..', '.env');
  const backEnvFile = path.resolve(__dirname, '..', 'backend', '.env');

  const rootEnv = loadEnv(rootEnvFile);
  const backEnv = loadEnv(backEnvFile);

  Object.assign(rootEnv, envVars);
  Object.assign(backEnv, envVars);

  saveEnv(rootEnvFile, rootEnv);
  saveEnv(backEnvFile, backEnv);
  console.log('Variables d\'environnement mises à jour.');
})();
