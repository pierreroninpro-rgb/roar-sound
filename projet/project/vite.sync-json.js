import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const MAX_BYTES = 8 * 1024 * 1024;

function writePublicJson(root, videos, images) {
  const publicDir = path.join(root, 'public');
  if (Array.isArray(videos)) {
    fs.writeFileSync(
      path.join(publicDir, 'videos.json'),
      `${JSON.stringify(videos, null, 2)}\n`,
      'utf8'
    );
  }
  if (Array.isArray(images)) {
    fs.writeFileSync(
      path.join(publicDir, 'images.json'),
      `${JSON.stringify(images, null, 2)}\n`,
      'utf8'
    );
  }
}

function uniqueFilename(dir, originalName) {
  const ext = path.extname(originalName).toLowerCase() || '.png';
  const base = path
    .basename(originalName, path.extname(originalName))
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  let name = `${base}${ext}`;
  let i = 1;
  while (fs.existsSync(path.join(dir, name))) {
    name = `${base}-${i}${ext}`;
    i += 1;
  }
  return name;
}

function savePublicImage(root, filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Format non supporté. Utilise png, jpg, webp ou gif.');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error('Fichier trop lourd (max 8 Mo).');
  }

  const dir = path.join(root, 'public', 'images');
  fs.mkdirSync(dir, { recursive: true });
  const safeName = uniqueFilename(dir, filename);
  const dest = path.join(dir, safeName);
  const resolvedDir = path.resolve(dir);
  if (!path.resolve(dest).startsWith(resolvedDir + path.sep)) {
    throw new Error('Nom de fichier invalide.');
  }
  fs.writeFileSync(dest, buffer);
  return `/images/${safeName}`;
}

function jsonResponse(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function syncJsonPlugin() {
  return {
    name: 'sync-json-dev',
    configureServer(server) {
      server.ws.on('admin:sync-json', (data) => {
        try {
          writePublicJson(server.config.root, data?.videos, data?.images);
        } catch (err) {
          console.error('[sync-json]', err);
        }
      });

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/__dev/upload-image' || req.method !== 'POST') {
          next();
          return;
        }

        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            if (!body.filename || !body.data) {
              throw new Error('Fichier manquant.');
            }
            const buffer = Buffer.from(body.data, 'base64');
            const publicPath = savePublicImage(server.config.root, body.filename, buffer);
            jsonResponse(res, 200, { path: publicPath });
          } catch (err) {
            jsonResponse(res, 400, { error: err.message || 'Upload impossible.' });
          }
        });
      });
    },
  };
}
