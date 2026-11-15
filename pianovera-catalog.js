import { parseDocument, DomUtils } from "htmlparser2";

const ORIGIN = "https://pianovera.com";

function hasClass(node, name) {
  return (node.attribs?.class || "").split(/\s+/).includes(name);
}

function safeUrl(value, pattern) {
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN || url.search || url.username || url.password || !pattern.test(url.pathname)) return null;
    url.hash = "";
    return url;
  } catch { return null; }
}

export function parsePianoveraCatalog(html) {
  const doc = parseDocument(html);
  const cards = DomUtils.findAll((node) => node.type === "tag" && node.name === "article" && hasClass(node, "midi-card"), doc.children);
  const songs = [], seen = new Set();
  for (const card of cards) {
    const heading = DomUtils.findOne((node) => node.type === "tag" && node.name === "h3", card.children);
    const titleLink = heading && DomUtils.findOne((node) => node.type === "tag" && node.name === "a", heading.children);
    const composerNode = DomUtils.findOne((node) => node.type === "tag" && hasClass(node, "mc-comp"), card.children);
    const anchors = DomUtils.findAll((node) => node.type === "tag" && node.name === "a", card.children);
    const page = safeUrl(titleLink?.attribs?.href, /^\/en\/midi\/[a-z0-9-]+\/$/i);
    const midi = anchors.map((a) => safeUrl(a.attribs?.href, /^\/(?:assets\/partitions|midi\/files)\/[a-z0-9_./%-]+\.midi?$/i)).find(Boolean);
    const title = titleLink ? DomUtils.textContent(titleLink).replace(/\s+/g, " ").trim() : "";
    const composer = composerNode ? DomUtils.textContent(composerNode).replace(/\s+/g, " ").trim() : "";
    if (!page || !midi || !title || seen.has(midi.pathname)) continue;
    seen.add(midi.pathname);
    let fileName;
    try { fileName = decodeURIComponent(midi.pathname.split("/").pop()); } catch { continue; }
    songs.push({ path: midi.pathname, fileName, title, artist: composer, composer, sourcePageUrl: page.href });
  }
  return songs;
}
