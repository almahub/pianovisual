const crypto = require('node:crypto');

function versionCopy(bytes, song) {
  const version = String(song?.versionName || '').trim();
  if (!version || !['selected_instruments', 'piano_reduction'].includes(song?.variantType)) return null;
  const data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON del brano non valido');
  const title = String(song.title || data.name || '').trim();
  if (!title || !song.id) throw new Error('Titolo o identificativo della versione mancante');
  data.name = `${title} [${version}]`;
  const content = Buffer.from(JSON.stringify(data), 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  const id = crypto.createHash('sha256').update(String(song.id)).update('\0').update(hash).digest('hex');
  return { content, hash, fileName: `pv-version-${id}.json`, title: data.name };
}

module.exports = { versionCopy };
