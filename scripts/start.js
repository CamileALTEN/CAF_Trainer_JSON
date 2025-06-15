const readline = require('readline');
const { spawn } = require('child_process');
const figlet = require('figlet');
const ora = require('ora');
const open = require('open');
const path = require('path');
const fs = require('fs');


const logoPath = path.join(__dirname, 'logo.txt');
try {
  const logo = fs.readFileSync(logoPath, 'utf8');
  console.log(logo);
} catch (err) {
  console.error('Unable to read logo:', err);
}

function ascii(text) {
  return figlet.textSync(text, { font: 'Slant' });
}


const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Lancer CAF-Trainer avec les logs ? (o/n) ', answer => {
  rl.close();
  const wantLogs = answer.trim().toLowerCase() === 'o';

  if (wantLogs) {
    spawn('npm', ['run', 'start:combined'], { stdio: 'inherit', shell: true });
    return;
  }

  const spinner = ora('Compilation en cours...').start();

  const backend = spawn('npm', ['--workspace', 'backend', 'start'], { shell: true, stdio: 'ignore' });
  const client = spawn('npm', ['--workspace', 'client', 'start'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });

  let opened = false;
  client.stdout.on('data', data => {
    const str = data.toString();
    if (!opened && str.includes('Compiled successfully')) {
      opened = true;
      spinner.stop();
      console.log('\n' + ascii('- Opérationnel -') +'\n'+'\n'+'You can now view CAF-Trainer in the browser.');
      console.log('Local:            http://localhost:3000')
    }
  });
});
