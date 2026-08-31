import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');
const remote = process.argv.includes('--remote');

function runQuery(sql) {
  const args = [
    'wrangler',
    'd1',
    'execute',
    'roar-db',
    remote ? '--remote' : '--local',
    '--command',
    sql,
    '--json',
  ];
  const output = execFileSync('npx', args, {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  const parsed = JSON.parse(output);
  const batch = Array.isArray(parsed) ? parsed[0] : parsed;
  return batch?.results || [];
}

const videoRows = runQuery(
  'SELECT id, title, url, thumbnail, soustitre, description FROM projects ORDER BY sort_order ASC, id ASC'
);
const imageRows = runQuery(
  'SELECT alt, url FROM gallery_images ORDER BY sort_order ASC, id ASC'
);

const videos = videoRows.map((row) => ({
  id: row.id,
  title: row.title,
  url: row.url,
  thumbnail: row.thumbnail,
  soustitre: row.soustitre ?? '',
  description: row.description ?? '',
}));

const images = imageRows.map((row) => ({
  alt: row.alt,
  url: row.url,
}));

fs.writeFileSync(
  path.join(projectRoot, 'public', 'videos.json'),
  `${JSON.stringify(videos, null, 2)}\n`,
  'utf8'
);
fs.writeFileSync(
  path.join(projectRoot, 'public', 'images.json'),
  `${JSON.stringify(images, null, 2)}\n`,
  'utf8'
);

console.log(`Exporté ${videos.length} projets et ${images.length} images vers public/.`);
