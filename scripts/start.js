const readline = require('readline');
const { spawn } = require('child_process');
const figlet = require('figlet');
const ora = require('ora');
const open = require('open');

function ascii(text) {
  return figlet.textSync(text, { font: 'Standard' });
}

console.log(ascii('CAF Trainer'));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Voulez-vous les logs ? (o/n) ', answer => {
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
      console.log('\n' + ascii('Operationnel'));
      open('http://localhost:3000');
    }
  });
});
