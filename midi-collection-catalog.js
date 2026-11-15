import { parseDocument, DomUtils } from 'htmlparser2';

const ORIGIN = 'https://midicollection.com';
const nodes = (parent, name) => DomUtils.findAll((node) => node.type === 'tag' && node.name === name, parent.children || []);

function localUrl(value) {
  try {
    const url = new URL(value, ORIGIN);
    return url.origin === ORIGIN && !url.username && !url.password && !url.search && !url.hash ? url : null;
  } catch { return null; }
}

export function parseMidiCollectionArtists(html) {
  const document = parseDocument(html);
  const grids = DomUtils.findAll((node) => node.type === 'tag' && node.name === 'div' && (node.attribs?.class || '').split(/\s+/).includes('artist-grid'), document.children);
  if (!grids.length) throw new Error('Elenco artisti MIDI Collection non riconosciuto');
  const artists = [];
  for (const grid of grids) for (const anchor of nodes(grid, 'a')) {
    const url = localUrl(anchor.attribs?.href);
    const counter = nodes(anchor, 'span').find((node) => (node.attribs?.class || '').split(/\s+/).includes('count'));
    const countText = counter ? DomUtils.textContent(counter).trim() : '';
    const name = DomUtils.textContent(anchor).replace(/\s*\(\d+\)\s*$/, '').trim();
    if (!url || !/^\/artist\/[a-z0-9-]+$/i.test(url.pathname) || !name || !/^\(\d+\)$/.test(countText)) continue;
    artists.push({ path: url.pathname, name, count: Number(countText.slice(1, -1)) });
  }
  return artists;
}

export function parseMidiCollectionArtistSongs(html, artist) {
  const document = parseDocument(html);
  const list = DomUtils.findOne((node) => node.type === 'tag' && node.name === 'ul' && (node.attribs?.class || '').split(/\s+/).includes('songs'), document.children);
  if (!list) throw new Error('Pagina artista MIDI Collection non riconosciuta');
  const songs = [];
  for (const row of nodes(list, 'li')) {
    const button = nodes(row, 'button').find((node) => node.attribs['data-midi-id'] && node.attribs['data-url']);
    const id = button?.attribs['data-midi-id'];
    const midi = button && localUrl(button.attribs['data-url']);
    const page = nodes(row, 'a').map((node) => localUrl(node.attribs?.href)).find((url) => /^\d+$/.test(id || '') && url && url.pathname.startsWith(`/song/${id}/`));
    const title = String(button?.attribs['data-title'] || '').trim();
    if (!midi || !midi.pathname.startsWith('/midi/') || !/\.midi?$/i.test(midi.pathname) || !page || !title) continue;
    let fileName;
    try { fileName = decodeURIComponent(midi.pathname.split('/').pop()); } catch { continue; }
    songs.push({ path: midi.pathname, fileName, title, artist, sourcePageUrl: page.href });
  }
  return songs;
}

export function parseMidiCollectionResults(html) {
  const document = parseDocument(html);
  const root = DomUtils.findOne((node) => node.type === 'tag' && node.name === 'div' && (node.attribs?.class || '').split(/\s+/).includes('results-wrap'), document.children);
  if (!root) throw new Error('Risultati MIDI Collection non riconosciuti');
  const page = Number(root.attribs['data-page']);
  const totalPages = Number(root.attribs['data-total-pages']);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(totalPages) || totalPages < 0 || totalPages > 100000) throw new Error('Paginazione MIDI Collection non valida');
  const songs = [], seen = new Set();
  for (const row of nodes(root, 'tr')) {
    const id = row.attribs['data-midi-id'];
    if (!/^\d+$/.test(id || '')) continue;
    const button = nodes(row, 'button').find((node) => node.attribs['data-midi-id'] === id && node.attribs['data-url']);
    const midi = button && localUrl(button.attribs['data-url']);
    const pageLink = nodes(row, 'a').map((node) => localUrl(node.attribs?.href)).find((url) => url && url.pathname.startsWith(`/song/${id}/`));
    const title = String(row.attribs['data-title'] || '').trim();
    const artist = String(row.attribs['data-artist'] || '').trim();
    if (!midi || !midi.pathname.startsWith('/midi/') || !/\.midi?$/i.test(midi.pathname) || !pageLink || !title || seen.has(midi.pathname)) continue;
    let fileName;
    try { fileName = decodeURIComponent(midi.pathname.split('/').pop()); } catch { continue; }
    seen.add(midi.pathname);
    songs.push({ path: midi.pathname, fileName, title, artist, sourcePageUrl: pageLink.href });
  }
  const paragraph = nodes(document, 'p').map((node) => DomUtils.textContent(node).trim()).find((value) => /^Result:\s*\d+$/i.test(value));
  const total = paragraph ? Number(paragraph.match(/\d+/)[0]) : null;
  return { songs, page, total, hasMore: page < totalPages };
}
