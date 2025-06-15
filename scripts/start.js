const fs = require('fs');
const path = require('path');
const figlet = require('figlet');
const concurrently = require('concurrently');

// Print CAF Trainer logo from file
const logoPath = path.join(__dirname, 'logo.txt');
try {
  const logo = fs.readFileSync(logoPath, 'utf8');
  console.log(logo);
} catch (err) {
  console.error('Unable to read logo:', err);
}

// Print the remaining text using figlet
try {
  console.log(figlet.textSync('Operationnel'));
} catch (err) {
  console.error('figlet error:', err);
}

// Start backend and client concurrently
concurrently([
  { command: 'npm run start:backend', name: 'backend', prefixColor: 'blue' },
  { command: 'npm run start:client', name: 'client', prefixColor: 'green' }
]).catch(() => process.exit(1));
