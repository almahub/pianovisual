import { parseDocument, DomUtils } from 'htmlparser2';

const ORIGIN = 'https://www.mutopiaproject.org';
const text = (node) => node ? DomUtils.textContent(node).replace(/\s+/g, ' ').trim() : '';
const descendants = (node, name) => DomUtils.findAll((entry) => entry.type === 'tag' && entry.name === name, node.children || []);
const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);

function allowedUrl(value, kind) {
  try {
    const url = new URL(value, `${ORIGIN}/cgibin/`);
    if (url.origin !== ORIGIN || url.hash || url.username || url.password) return null;
    if (kind === 'midi' && (!/^\/ftp\//.test(url.pathname) || !/\.midi?$/i.test(url.pathname) || url.search)) return null;
    if (kind === 'page' && (url.pathname !== '/cgibin/piece-info.cgi' || !/^\d+$/.test(url.searchParams.get('id') || '') || [...url.searchParams.keys()].some((key) => key !== 'id'))) return null;
    return url;
  } catch { return null; }
}

export function parseMutopiaComposers(html) {
  const document = parseDocument(html);
  const select = DomUtils.findOne((node) => node.type === 'tag' && node.name === 'select' && node.attribs?.name === 'Composer', document.children);
  if (!select) throw new Error('Elenco compositori Mutopia non riconosciuto');
  return descendants(select, 'option').map((option) => ({ path: option.attribs?.value || '', name: text(option) }))
    .filter((item) => /^[a-z0-9_-]{1,100}$/i.test(item.path) && item.name);
}

export function parseMutopiaResults(html) {
  const document = parseDocument(html);
  const tables = DomUtils.findAll((node) => node.type === 'tag' && node.name === 'table' && hasClass(node, 'result-table'), document.children);
  const songs = [];
  for (const table of tables) {
    const rows = descendants(table, 'tr');
    const first = rows[0] ? descendants(rows[0], 'td') : [];
    const title = text(first[0]);
    const artist = text(first[1]).replace(/^by\s+/i, '').replace(/\s*\(\d{4}[\s–-]+\d{4}\)\s*$/, '').trim();
    const opus = text(first[2]);
    const links = descendants(table, 'a');
    const midi = links.map((link) => allowedUrl(link.attribs?.href, 'midi')).find(Boolean);
    const page = links.map((link) => allowedUrl(link.attribs?.href, 'page')).find(Boolean);
    if (!title || !midi || !page) continue;
    let fileName;
    try { fileName = decodeURIComponent(midi.pathname.split('/').pop()); } catch { continue; }
    const compact = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    songs.push({ path: midi.pathname, fileName, title: opus && !compact(title).includes(compact(opus)) ? `${title} (${opus})` : title, artist, composer: artist, sourcePageUrl: page.href });
  }
  const next = DomUtils.findOne((node) => node.type === 'tag' && node.name === 'a' && /^Next\s+\d+/i.test(text(node)), document.children);
  return { songs, hasMore: Boolean(next) };
}
