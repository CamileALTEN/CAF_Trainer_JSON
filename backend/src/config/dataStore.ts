import fs from 'fs';
import path from 'path';

// Permet de rediriger les fichiers JSON via la variable d'environnement DATA_DIR
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', 'data');

export function read<T = any>(name: string): T[] {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8');
    }
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content) as T[];
}

export function write<T = any>(name: string, data: T[]): void {
    const file = path.join(DATA_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}