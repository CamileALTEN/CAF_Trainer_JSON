const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function main() {
  const localInput = await ask('Utiliser les chemins locaux du projet ? (O/n) ');
  const useLocal = !localInput || localInput.trim().toLowerCase().startsWith('o');

  let rootUpdates;
  let backendUpdates;

  if (useLocal) {
    rootUpdates = {
      DATA_DIR: './backend/src/data',
      IMAGE_DIR: './backend/image',
      VIDEO_DIR: './backend/video',
      ARCHIVE_DIR: './backend/archive',
    };
    backendUpdates = {
      DATA_DIR: './src/data',
      IMAGE_DIR: '../image',
      VIDEO_DIR: '../video',
      ARCHIVE_DIR: '../archive',
    };
  } else {
    const driveInput = await ask('Lettre du lecteur cible (ex: C): ');
    const drive = (driveInput || 'C').trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
    let rootPath;
    if (drive === 'C') {
      const base = process.env.USERPROFILE || `${drive}:\\Users\\Default`;
      rootPath = path.join(base, 'CAF-Trainer');
    } else {
      rootPath = `${drive}:\\CAF-Trainer`;
    }
    const abs = {
      DATA_DIR: `${rootPath}\\backend\\src\\data`,
      IMAGE_DIR: `${rootPath}\\backend\\image`,
      VIDEO_DIR: `${rootPath}\\backend\\video`,
      ARCHIVE_DIR: `${rootPath}\\backend\\archive`,
    };
    rootUpdates = abs;
    backendUpdates = abs;
  }

  const envFiles = [
    { file: path.join(__dirname, '.env'), updates: rootUpdates },
    { file: path.join(__dirname, 'backend', '.env'), updates: backendUpdates },
  ];

  for (const { file, updates } of envFiles) {
    let content = '';
    if (fs.existsSync(file)) content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const env = {};
    for (const line of lines) {
      const m = line.match(/^([^=]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
    Object.assign(env, updates);
    const newContent = Object.entries(env).map(([k,v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(file, newContent);
    console.log(`Mis a jour: ${file}`);
  }
}

main();
