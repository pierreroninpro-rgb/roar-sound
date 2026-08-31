const PROJECT_FIELDS = ['title', 'url', 'thumbnail', 'soustitre', 'description'];
const IMAGE_FIELDS = ['alt', 'url'];

function rowToVideo(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    thumbnail: row.thumbnail,
    soustitre: row.soustitre ?? '',
    description: row.description ?? '',
  };
}

function rowToImage(row) {
  return {
    id: row.id,
    alt: row.alt,
    url: row.url,
  };
}

export function toPublicVideos(rows) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    thumbnail: row.thumbnail,
    soustitre: row.soustitre ?? '',
    description: row.description ?? '',
  }));
}

export function toPublicImages(rows) {
  return rows.map((row) => ({
    alt: row.alt,
    url: row.url,
  }));
}

export async function listProjects(db) {
  const { results } = await db.prepare(
    'SELECT id, title, url, thumbnail, soustitre, description, sort_order FROM projects ORDER BY sort_order ASC, id ASC'
  ).all();
  return (results || []).map(rowToVideo);
}

export async function listImages(db) {
  const { results } = await db.prepare(
    'SELECT id, alt, url, sort_order FROM gallery_images ORDER BY sort_order ASC, id ASC'
  ).all();
  return (results || []).map(rowToImage);
}

export async function exportPublicPayload(db) {
  const [videos, images] = await Promise.all([listProjects(db), listImages(db)]);
  return {
    videos: toPublicVideos(videos),
    images: toPublicImages(images),
  };
}

function pick(body, fields) {
  const data = {};
  for (const key of fields) {
    if (body[key] !== undefined) data[key] = String(body[key]).trim();
  }
  return data;
}

export async function createProject(db, body) {
  const data = pick(body, PROJECT_FIELDS);
  if (!data.title || !data.url || !data.thumbnail) {
    throw new Error('title, url et thumbnail sont requis.');
  }
  data.soustitre = data.soustitre || '';
  data.description = data.description || '';

  const max = await db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM projects').first();
  const sortOrder = (max?.max_order ?? -1) + 1;

  const result = await db.prepare(
    `INSERT INTO projects (title, url, thumbnail, soustitre, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(data.title, data.url, data.thumbnail, data.soustitre, data.description, sortOrder).run();

  const id = result.meta.last_row_id;
  return (await db.prepare(
    'SELECT id, title, url, thumbnail, soustitre, description FROM projects WHERE id = ?'
  ).bind(id).first());
}

export async function updateProject(db, id, body) {
  const existing = await db.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
  if (!existing) return null;

  const data = pick(body, PROJECT_FIELDS);
  const current = await db.prepare(
    'SELECT title, url, thumbnail, soustitre, description FROM projects WHERE id = ?'
  ).bind(id).first();

  const next = {
    title: data.title ?? current.title,
    url: data.url ?? current.url,
    thumbnail: data.thumbnail ?? current.thumbnail,
    soustitre: data.soustitre ?? current.soustitre,
    description: data.description ?? current.description,
  };

  await db.prepare(
    `UPDATE projects SET title = ?, url = ?, thumbnail = ?, soustitre = ?, description = ? WHERE id = ?`
  ).bind(next.title, next.url, next.thumbnail, next.soustitre, next.description, id).run();

  return db.prepare(
    'SELECT id, title, url, thumbnail, soustitre, description FROM projects WHERE id = ?'
  ).bind(id).first();
}

export async function deleteProject(db, id) {
  const existing = await db.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();
  if (!existing) return false;
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return true;
}

export async function createImage(db, body) {
  const data = pick(body, IMAGE_FIELDS);
  if (!data.alt || !data.url) {
    throw new Error('alt et url sont requis.');
  }
  const max = await db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM gallery_images').first();
  const sortOrder = (max?.max_order ?? -1) + 1;
  const result = await db.prepare(
    'INSERT INTO gallery_images (alt, url, sort_order) VALUES (?, ?, ?)'
  ).bind(data.alt, data.url, sortOrder).run();
  const id = result.meta.last_row_id;
  return db.prepare('SELECT id, alt, url FROM gallery_images WHERE id = ?').bind(id).first();
}

export async function updateImage(db, id, body) {
  const existing = await db.prepare('SELECT id FROM gallery_images WHERE id = ?').bind(id).first();
  if (!existing) return null;
  const data = pick(body, IMAGE_FIELDS);
  const current = await db.prepare('SELECT alt, url FROM gallery_images WHERE id = ?').bind(id).first();
  const next = {
    alt: data.alt ?? current.alt,
    url: data.url ?? current.url,
  };
  await db.prepare('UPDATE gallery_images SET alt = ?, url = ? WHERE id = ?').bind(next.alt, next.url, id).run();
  return db.prepare('SELECT id, alt, url FROM gallery_images WHERE id = ?').bind(id).first();
}

export async function deleteImage(db, id) {
  const existing = await db.prepare('SELECT id FROM gallery_images WHERE id = ?').bind(id).first();
  if (!existing) return false;
  await db.prepare('DELETE FROM gallery_images WHERE id = ?').bind(id).run();
  return true;
}

export async function reorder(db, table, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('ids doit être un tableau non vide.');
  }
  const statements = ids.map((id, index) =>
    db.prepare(`UPDATE ${table} SET sort_order = ? WHERE id = ?`).bind(index, Number(id))
  );
  await db.batch(statements);
}
