const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

(async () => {
  const driveInput = await ask('Lettre du lecteur cible (ex: C): ');
  const folderInput = await ask('Nom du dossier principal (CAF-Trainer par defaut): ');

  const drive = (driveInput || 'C').trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
  const folder = (folderInput || 'CAF-Trainer').trim() || 'CAF-Trainer';

  const rootPath = `${drive}:\\${folder}`;

  const envUpdates = {
    DATA_DIR: `${rootPath}\\backend\\src\\data`,
    IMAGE_DIR: `${rootPath}\\backend\\image`,
    VIDEO_DIR: `${rootPath}\\backend\\video`,
    ARCHIVE_DIR: `${rootPath}\\backend\\src\\archive`,
  };

  const envFiles = [path.join(__dirname, '.env'), path.join(__dirname, 'backend', '.env')];

  for (const file of envFiles) {
    let content = '';
    if (fs.existsSync(file)) content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const env = {};
    for (const line of lines) {
      const m = line.match(/^([^=]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
    Object.assign(env, envUpdates);
    const newContent = Object.entries(env).map(([k,v]) => `${k}=${v}`).join('\n');
    fs.writeFileSync(file, newContent);
    console.log(`Mis a jour: ${file}`);
  }
})();
