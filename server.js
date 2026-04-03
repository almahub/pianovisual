import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";

const LIBRARY_DIR = process.env.PIANOVISUAL_LIBRARY_DIR
  ? path.resolve(process.env.PIANOVISUAL_LIBRARY_DIR)
  : path.join(__dirname, "library");
const JSON_DIR = path.join(LIBRARY_DIR, "json");
const EXPORTS_DIR = path.join(LIBRARY_DIR, "exports");
const DB_PATH = path.join(LIBRARY_DIR, "db.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function createDefaultDb() {
  return {
    songs: [],
    collections: [
      { id: "col-favorites", name: "Preferiti", type: "preferiti", sortOrder: 0 },
      { id: "col-study", name: "Studio", type: "studio", sortOrder: 1 },
      {
        id: "col-smart-key-g",
        name: "Tonalita di Sol",
        type: "playlist",
        sortOrder: 100,
        smartRule: { keyIncludes: "G" },
      },
      {
        id: "col-smart-bpm90",
        name: "BPM < 90",
        type: "playlist",
        sortOrder: 101,
        smartRule: { bpmLt: 90 },
      },
      {
        id: "col-smart-beginner",
        name: "Difficolta Principiante",
        type: "playlist",
        sortOrder: 102,
        smartRule: { difficulty: "principiante" },
      },
    ],
    songCollection: [],
    tags: [],
    songTags: [],
    practiceMeta: [],
    updatedAt: nowIso(),
  };
}

async function ensureSetup() {
  await fs.mkdir(LIBRARY_DIR, { recursive: true });
  await fs.mkdir(JSON_DIR, { recursive: true });
  await fs.mkdir(EXPORTS_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, `${JSON.stringify(createDefaultDb(), null, 2)}\n`, "utf8");
  }
}

async function readDb() {
  await ensureSetup();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const db = { ...createDefaultDb(), ...parsed };
  if (migrateDbSchema(db)) {
    db.updatedAt = nowIso();
    await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  }
  return db;
}

async function writeDb(db) {
  db.updatedAt = nowIso();
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8") || "{}";
  return JSON.parse(raw);
}

function sanitizeName(name) {
  return String(name || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

async function pathExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(absPath, jsonData) {
  const tmpPath = `${absPath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.writeFile(tmpPath, `${JSON.stringify(jsonData, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, absPath);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mojibakeScore(value) {
  return (String(value || "").match(/[ÐÑÃÂ�]/g) || []).length;
}

function repairMojibake(value) {
  const original = String(value || "");
  if (!original) return original;
  if (mojibakeScore(original) === 0) return original;
  const repaired = Buffer.from(original, "latin1").toString("utf8");
  return mojibakeScore(repaired) < mojibakeScore(original) ? repaired : original;
}

function inferGenreFromSignals(signals) {
  const s = normalizeText(signals.join(" "));
  if (!s) return "";
  if (/\b(classica|classico|barocco|romantico|sonata|nocturne|notturno|preludio|fuga|waltz|valzer|chopin|mozart|beethoven|bach|liszt|tchaikovsky)\b/.test(s)) return "Classica";
  if (/\b(jazz|swing|blues|bebop)\b/.test(s)) return "Jazz";
  if (/\b(pop|synthpop|indie pop)\b/.test(s)) return "Pop";
  if (/\b(rock|metal|punk)\b/.test(s)) return "Rock";
  if (/\b(film|soundtrack|ost|cinematic)\b/.test(s)) return "Soundtrack";
  if (/\b(electronic|edm|house|techno|trance|ambient)\b/.test(s)) return "Electronic";
  if (/\b(folk|traditional)\b/.test(s)) return "Folk";
  return "";
}

function songTagsBySongId(db) {
  const bySong = new Map();
  const tagNameById = new Map((db.tags || []).map((t) => [t.id, t.name]));
  for (const st of db.songTags || []) {
    const tagName = tagNameById.get(st.tagId);
    if (!tagName) continue;
    const arr = bySong.get(st.songId) || [];
    arr.push(tagName);
    bySong.set(st.songId, arr);
  }
  return bySong;
}

function migrateDbSchema(db) {
  let changed = false;
  const tagsMap = songTagsBySongId(db);

  for (const song of db.songs || []) {
    const fixedTitle = repairMojibake(song.title || "");
    if (fixedTitle !== song.title) {
      song.title = fixedTitle;
      changed = true;
    }
    const fixedArtist = repairMojibake(song.artist || "");
    if (fixedArtist !== song.artist) {
      song.artist = fixedArtist;
      changed = true;
    }
    const fixedComposer = repairMojibake(song.composer || "");
    if (fixedComposer !== song.composer) {
      song.composer = fixedComposer;
      changed = true;
    }

    if (typeof song.genre !== "string") {
      song.genre = "";
      changed = true;
    }
    if (song.midiPath !== "") {
      song.midiPath = "";
      changed = true;
    }
    if (!String(song.genre || "").trim()) {
      const inferred = inferGenreFromSignals([
        song.title || "",
        song.artist || "",
        song.composer || "",
        song.key || "",
        song.sourceFileName || "",
        ...(tagsMap.get(song.id) || []),
      ]);
      song.genre = inferred || "Altro";
      changed = true;
    }
  }

  return changed;
}

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function collectionById(db, id) {
  return db.collections.find((c) => c.id === id);
}

function songById(db, id) {
  return db.songs.find((s) => s.id === id);
}

function applySongPatch(song, patch) {
  const allowed = [
    "title",
    "artist",
    "composer",
    "genre",
    "difficulty",
    "key",
    "bpm",
    "duration",
    "instruments",
    "favorite",
    "studyStatus",
    "playbackSpeed",
    "lastPracticePointSec",
    "favoriteLoops",
  ];

  for (const key of allowed) {
    if (Object.hasOwn(patch, key)) {
      if (["title", "artist", "composer", "genre"].includes(key)) {
        song[key] = repairMojibake(String(patch[key] || ""));
      } else {
        song[key] = patch[key];
      }
    }
  }

  song.updatedAt = nowIso();
}

function applySmartMembership(db, song) {
  for (const c of db.collections.filter((x) => x.smartRule)) {
    const rule = c.smartRule;
    let ok = true;
    if (rule.keyIncludes && !String(song.key || "").includes(rule.keyIncludes)) ok = false;
    if (rule.bpmLt && Number(song.bpm || 0) >= rule.bpmLt) ok = false;
    if (rule.difficulty && song.difficulty !== rule.difficulty) ok = false;

    const has = db.songCollection.some((sc) => sc.songId === song.id && sc.collectionId === c.id);
    if (ok && !has) db.songCollection.push({ songId: song.id, collectionId: c.id });
    if (!ok && has) {
      db.songCollection = db.songCollection.filter((sc) => !(sc.songId === song.id && sc.collectionId === c.id));
    }
  }
}

function inferSongMetadataFromJson(jsonData, fileName) {
  const baseTitle = String(fileName || "").replace(/\.json$/i, "");
  const tempos = Array.isArray(jsonData?.tempos) ? jsonData.tempos : [];
  const keySigs = Array.isArray(jsonData?.keySignatures) ? jsonData.keySignatures : [];
  const supporting = Array.isArray(jsonData?.supportingTracks) ? jsonData.supportingTracks : [];

  const duration =
    Number(jsonData?.song_length || 0) ||
    supporting.reduce((mx, track) => {
      const maxTrack = (track.notes || []).reduce((a, n) => Math.max(a, Number(n.time || 0) + Number(n.duration || 0)), 0);
      return Math.max(mx, maxTrack);
    }, 0);

  return {
    title: repairMojibake(String(jsonData?.name || baseTitle || "Senza titolo")),
    artist: repairMojibake(String(jsonData?.artist || "")),
    composer: repairMojibake(String(jsonData?.composer || "")),
    genre: repairMojibake(String(jsonData?.genre || "")),
    difficulty: String(jsonData?.difficulty || "intermedio"),
    key: keySigs[0] ? `${keySigs[0].key || "C"} ${keySigs[0].scale || "major"}` : "C major",
    bpm: Number(tempos[0]?.bpm || 120),
    duration: Number(duration || 0),
    instruments: Array.isArray(jsonData?.instruments) ? jsonData.instruments : [],
  };
}

function validatePianoVisionJsonData(jsonData) {
  const errors = [];
  if (!jsonData || typeof jsonData !== "object" || Array.isArray(jsonData)) {
    return { ok: false, errors: ["payload non oggetto"] };
  }

  const hasTracks =
    (Array.isArray(jsonData.supportingTracks) && jsonData.supportingTracks.length > 0) ||
    (Array.isArray(jsonData?.original?.tracks) && jsonData.original.tracks.length > 0) ||
    (jsonData.tracksV2 && typeof jsonData.tracksV2 === "object");
  if (!hasTracks) errors.push("tracce mancanti (supportingTracks/original.tracks/tracksV2)");

  if (!Array.isArray(jsonData.tempos) || jsonData.tempos.length === 0) {
    errors.push("tempos mancanti");
  }
  if (!Array.isArray(jsonData.timeSignatures) || jsonData.timeSignatures.length === 0) {
    errors.push("timeSignatures mancanti");
  }

  const songLength = Number(jsonData.song_length || 0);
  if (!Number.isFinite(songLength) || songLength < 0) errors.push("song_length non valido");

  return { ok: errors.length === 0, errors };
}

function findDuplicateSong(db, { hash, title, artist }) {
  const duplicateByHash = hash ? db.songs.find((s) => s.fileHash === hash) : null;
  const duplicateByName = db.songs.find(
    (s) =>
      normalizeText(artist) &&
      normalizeText(s.title) === normalizeText(title) &&
      normalizeText(s.artist) === normalizeText(artist),
  );
  return {
    duplicate: duplicateByHash || duplicateByName || null,
    reason: duplicateByHash ? "hash-file uguale" : duplicateByName ? "titolo+artista uguali" : "",
  };
}

function dedupeIncomingItems(items, mode = "keep_first", keyFn = (item) => [String(item?.sourceFileName || "").toLowerCase()]) {
  const kept = [];
  const dropped = [];
  const keyToIdx = new Map();

  for (const item of items) {
    const keys = keyFn(item).filter(Boolean);
    let conflictIdx = -1;
    for (const k of keys) {
      if (keyToIdx.has(k)) {
        conflictIdx = keyToIdx.get(k);
        break;
      }
    }

    if (conflictIdx === -1) {
      kept.push(item);
      const idx = kept.length - 1;
      for (const k of keys) keyToIdx.set(k, idx);
      continue;
    }

    if (mode === "keep_last") {
      const prev = kept[conflictIdx];
      if (prev) dropped.push({ item: prev, reason: "duplicato interno batch (tenuto ultimo)" });
      kept[conflictIdx] = item;
      for (const [k, v] of keyToIdx.entries()) {
        if (v === conflictIdx) keyToIdx.delete(k);
      }
      for (const k of keys) keyToIdx.set(k, conflictIdx);
    } else {
      dropped.push({ item, reason: "duplicato interno batch (tenuto primo)" });
    }
  }

  return { kept, dropped };
}

function decodeEscapedUrl(raw) {
  return String(raw || "")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
}

function extractHtmlMeta(html, baseUrl) {
  const getMeta = (prop) => {
    const r1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
    const r2 = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
    return html.match(r1)?.[1] || html.match(r2)?.[1] || "";
  };

  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
  const title = getMeta("og:title") || titleTag;
  const artist = getMeta("music:musician") || getMeta("author") || "";
  const composer = getMeta("music:composer") || "";

  const midiLinks = new Set();

  const directAbs = html.match(/https?:\/\/[^"'\\s>]+\.midi?(?:\?[^"'\\s>]*)?/gi) || [];
  for (const link of directAbs) midiLinks.add(decodeEscapedUrl(link));

  const attrRegex = /(href|src)=["']([^"']+\.midi?(?:\?[^"']*)?)["']/gi;
  let m;
  while ((m = attrRegex.exec(html))) {
    try {
      const abs = new URL(decodeEscapedUrl(m[2]), baseUrl).toString();
      midiLinks.add(abs);
    } catch {
      // ignore malformed URLs
    }
  }

  const midiUrlJson = html.match(/"midiUrl"\s*:\s*"([^"]+)"/i)?.[1];
  if (midiUrlJson) {
    try {
      midiLinks.add(new URL(decodeEscapedUrl(midiUrlJson), baseUrl).toString());
    } catch {
      // ignore malformed URLs
    }
  }

  return {
    title: String(title || "").trim(),
    artist: String(artist || "").trim(),
    composer: String(composer || "").trim(),
    midiCandidates: [...midiLinks],
  };
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/library") {
    const db = await readDb();
    sendJson(res, 200, db);
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/export") {
    const db = await readDb();
    const exportData = {
      exportedAt: nowIso(),
      db,
      files: {
        jsonDir: "/library/json",
      },
    };
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pianovisual-backup-${Date.now()}.json"`,
    });
    res.end(JSON.stringify(exportData, null, 2));
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/library/json-files") {
    await ensureSetup();
    const entries = await fs.readdir(JSON_DIR, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json")) continue;
      const abs = path.join(JSON_DIR, entry.name);
      const content = await fs.readFile(abs, "utf8");
      files.push({ fileName: entry.name, content });
    }
    sendJson(res, 200, { files });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/library/export-json-copy") {
    // Legacy endpoint retained for compatibility; disk-copy export disabled.
    sendJson(res, 200, { copiedCount: 0, exportId: "", exportPath: "", disabled: true });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/remote/resolve") {
    const payload = await readBodyJson(req);
    const rawUrl = String(payload.url || "").trim();
    if (!rawUrl) {
      sendJson(res, 400, { error: "URL richiesta" });
      return true;
    }

    let sourceUrl;
    try {
      sourceUrl = new URL(rawUrl);
      if (!["http:", "https:"].includes(sourceUrl.protocol)) throw new Error("protocollo");
    } catch {
      sendJson(res, 400, { error: "URL non valida" });
      return true;
    }

    const fetchWithUA = async (target) =>
      fetch(target, {
        headers: {
          "User-Agent": "PianoVisualBot/1.0 (+https://local.pianovisual)",
          Accept: "*/*",
        },
      });

    let sourceRes;
    try {
      sourceRes = await fetchWithUA(sourceUrl.toString());
    } catch {
      sendJson(res, 400, {
        error:
          "Download URL non riuscito (sito non raggiungibile o blocco anti-bot). Prova con un link diretto .mid.",
      });
      return true;
    }
    if (!sourceRes.ok) {
      sendJson(res, 400, { error: `Impossibile leggere URL (HTTP ${sourceRes.status})` });
      return true;
    }

    const contentType = sourceRes.headers.get("content-type") || "";

    const toMidiResponse = async (midiRes, refUrl) => {
      const arr = Buffer.from(await midiRes.arrayBuffer());
      const fileHash = hashBuffer(arr);
      const pathName = new URL(refUrl).pathname;
      const name = sanitizeName(path.basename(pathName || "remote.mid")) || "remote.mid";
      sendJson(res, 200, {
        ok: true,
        type: "midi",
        sourceUrl: refUrl,
        fileName: name.toLowerCase().endsWith(".mid") || name.toLowerCase().endsWith(".midi") ? name : `${name}.mid`,
        midiBase64: arr.toString("base64"),
        fileHash,
      });
    };

    if (contentType.includes("audio/midi") || /\.midi?(\?|$)/i.test(sourceUrl.toString())) {
      await toMidiResponse(sourceRes, sourceUrl.toString());
      return true;
    }

    const html = await sourceRes.text();
    const meta = extractHtmlMeta(html, sourceUrl.toString());

    for (const candidate of meta.midiCandidates) {
      try {
        const midiRes = await fetchWithUA(candidate);
        if (!midiRes.ok) continue;
        const ct = midiRes.headers.get("content-type") || "";
        if (ct.includes("audio/midi") || /\.midi?(\?|$)/i.test(candidate)) {
          const arr = Buffer.from(await midiRes.arrayBuffer());
          const fileHash = hashBuffer(arr);
          const pathName = new URL(candidate).pathname;
          const name = sanitizeName(path.basename(pathName || "remote.mid")) || "remote.mid";
          sendJson(res, 200, {
            ok: true,
            type: "page_with_midi",
            sourceUrl: sourceUrl.toString(),
            resolvedMidiUrl: candidate,
            fileName: name.toLowerCase().endsWith(".mid") || name.toLowerCase().endsWith(".midi") ? name : `${name}.mid`,
            midiBase64: arr.toString("base64"),
            fileHash,
            metadata: {
              title: meta.title,
              artist: meta.artist,
              composer: meta.composer,
            },
          });
          return true;
        }
      } catch {
        // continue with next candidate
      }
    }

    sendJson(res, 200, {
      ok: true,
      type: "metadata_only",
      sourceUrl: sourceUrl.toString(),
      metadata: {
        title: meta.title,
        artist: meta.artist,
        composer: meta.composer,
      },
      message:
        "Nessun link MIDI diretto trovato. Puoi usare i metadata rilevati oppure fornire un URL .mid diretto.",
    });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/library/import-json-archive") {
    const payload = await readBodyJson(req);
    const items = Array.isArray(payload.items) ? payload.items : [];
    const conflictPolicy = payload.conflictPolicy === "overwrite" || payload.overwrite === true ? "overwrite" : "skip";
    const dedupPolicy = payload.dedupPolicy === "keep_last" ? "keep_last" : "keep_first";
    if (items.length === 0) {
      sendJson(res, 400, { error: "items vuoto" });
      return true;
    }

    const db = await readDb();
    const imported = [];
    const skipped = [];
    const report = [];
    let overwrittenCount = 0;

    const { kept, dropped } = dedupeIncomingItems(items, dedupPolicy, (item) => {
      const fileName = sanitizeName(item?.fileName || "");
      const keys = [];
      if (fileName) keys.push(`file:${normalizeText(fileName)}`);
      if (item?.jsonData && typeof item.jsonData === "object") {
        const nm = normalizeText(item.jsonData?.name || "");
        const ar = normalizeText(item.jsonData?.artist || "");
        if (nm && ar) keys.push(`ta:${nm}||${ar}`);
        if (nm) keys.push(`title:${nm}`);
      }
      return keys;
    });

    for (const d of dropped) {
      const fileName = sanitizeName(d.item?.fileName || `${uid("song")}.json`);
      const row = { sourceFileName: fileName, status: "skipped", reason: d.reason };
      skipped.push({ fileName, reason: d.reason });
      report.push(row);
    }

    for (const item of kept) {
      const fileName = sanitizeName(item.fileName || `${uid("song")}.json`);
      const safeFile = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
      const jsonData = item.jsonData;
      if (!jsonData || typeof jsonData !== "object") {
        const reason = "json non valido";
        skipped.push({ fileName: safeFile, reason });
        report.push({ sourceFileName: safeFile, status: "error", reason });
        continue;
      }

      const validation = validatePianoVisionJsonData(jsonData);
      if (!validation.ok) {
        const reason = `schema non valido: ${validation.errors.join(", ")}`;
        skipped.push({ fileName: safeFile, reason });
        report.push({ sourceFileName: safeFile, status: "error", reason });
        continue;
      }

      const jsonText = JSON.stringify(jsonData, null, 2);
      const hash = hashBuffer(Buffer.from(jsonText, "utf8"));
      const meta = inferSongMetadataFromJson(jsonData, safeFile);
      const { duplicate, reason: duplicateReason } = findDuplicateSong(db, {
        hash,
        title: meta.title,
        artist: meta.artist,
      });

      try {
        if (duplicate && conflictPolicy !== "overwrite") {
          skipped.push({
            fileName: safeFile,
            reason: duplicateReason || "duplicato",
            existingSongId: duplicate.id,
          });
          report.push({
            sourceFileName: safeFile,
            status: "skipped",
            reason: duplicateReason || "duplicato",
            existingSongId: duplicate.id,
          });
          continue;
        }

        if (duplicate && conflictPolicy === "overwrite") {
          const targetJsonRel = String(duplicate.jsonPath || "").replace(/^\//, "");
          const targetJsonAbs = targetJsonRel ? path.join(__dirname, targetJsonRel) : path.join(JSON_DIR, safeFile);
          await writeJsonAtomic(targetJsonAbs, jsonData);

          duplicate.title = repairMojibake(meta.title || duplicate.title || "Senza titolo");
          duplicate.artist = repairMojibake(meta.artist || duplicate.artist || "");
          duplicate.composer = repairMojibake(meta.composer || duplicate.composer || "");
          duplicate.genre = repairMojibake(meta.genre || duplicate.genre || "");
          duplicate.difficulty = meta.difficulty || duplicate.difficulty || "intermedio";
          duplicate.key = meta.key || duplicate.key || "C major";
          duplicate.bpm = Number(meta.bpm || duplicate.bpm || 120);
          duplicate.duration = Number(meta.duration || duplicate.duration || 0);
          duplicate.instruments = Array.isArray(meta.instruments) ? meta.instruments : duplicate.instruments || [];
          duplicate.updatedAt = nowIso();
          duplicate.fileHash = hash;
          duplicate.sourceFileName = safeFile;
          duplicate.jsonPath = `/${path.relative(__dirname, targetJsonAbs).replace(/\\/g, "/")}`;
          duplicate.midiPath = "";
          applySmartMembership(db, duplicate);

          imported.push(duplicate);
          overwrittenCount += 1;
          report.push({
            sourceFileName: safeFile,
            status: "overwritten",
            songId: duplicate.id,
            reason: duplicateReason || "duplicato sovrascritto",
          });
          continue;
        }

        const songId = uid("song");
        const sourceBase = sanitizeName(path.basename(safeFile, ".json")) || `${hash.slice(0, 16)}-${songId}`;
        let jsonFileName = `${sourceBase}.json`;
        let seq = 2;
        while (
          db.songs.some((s) => String(s.jsonPath || "").endsWith(`/${jsonFileName}`)) ||
          (await pathExists(path.join(JSON_DIR, jsonFileName)))
        ) {
          jsonFileName = `${sourceBase}-${seq}.json`;
          seq += 1;
        }
        const jsonPathAbs = path.join(JSON_DIR, jsonFileName);
        await writeJsonAtomic(jsonPathAbs, jsonData);

        const song = {
          id: songId,
          ...meta,
          importedAt: nowIso(),
          updatedAt: nowIso(),
          fileHash: hash,
          sourceFileName: safeFile,
          jsonPath: `/library/json/${jsonFileName}`,
          midiPath: "",
        };
        db.songs.push(song);
        db.practiceMeta.push({
          songId,
          lastPracticePointSec: 0,
          playbackSpeed: 1,
          favoriteLoops: [],
          studyStatus: "to_study",
        });
        applySmartMembership(db, song);
        imported.push(song);
        report.push({ sourceFileName: safeFile, status: "imported", songId: song.id });
      } catch (error) {
        const reason = `errore import: ${error.message}`;
        skipped.push({ fileName: safeFile, reason });
        report.push({ sourceFileName: safeFile, status: "error", reason });
      }
    }

    await writeDb(db);
    sendJson(res, 200, {
      importedCount: imported.length,
      overwrittenCount,
      skipped,
      songs: imported,
      report,
      conflictPolicy,
      dedupPolicy,
    });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/library/import-batch") {
    const payload = await readBodyJson(req);
    const items = Array.isArray(payload.items) ? payload.items : [];
    const overwriteAll = payload.overwrite === true;
    const batchDuplicatePolicy = payload.batchDuplicatePolicy === "keep_last" ? "keep_last" : "keep_first";
    if (items.length === 0) {
      sendJson(res, 400, { error: "items vuoto" });
      return true;
    }

    const db = await readDb();
    const imported = [];
    const skipped = [];
    const report = [];
    let overwrittenCount = 0;

    const applySongTags = (songId, tags, replace = false) => {
      if (!Array.isArray(tags)) return;
      if (replace) db.songTags = db.songTags.filter((st) => st.songId !== songId);
      for (const rawTag of tags) {
        const tagName = String(rawTag || "").trim().toLowerCase();
        if (!tagName) continue;
        let tag = db.tags.find((t) => t.name === tagName);
        if (!tag) {
          tag = { id: uid("tag"), name: tagName, createdAt: nowIso() };
          db.tags.push(tag);
        }
        const exists = db.songTags.some((st) => st.songId === songId && st.tagId === tag.id);
        if (!exists) db.songTags.push({ songId, tagId: tag.id });
      }
    };

    const applySongCollections = (songId, collectionIds, favorite) => {
      if (Array.isArray(collectionIds)) {
        const allowed = new Set(collectionIds);
        db.songCollection = db.songCollection.filter((sc) => {
          if (sc.songId !== songId) return true;
          const col = collectionById(db, sc.collectionId);
          if (col?.smartRule) return true;
          if (sc.collectionId === "col-favorites") return true;
          return false;
        });
        for (const cid of allowed) {
          const c = collectionById(db, cid);
          if (!c || c.smartRule) continue;
          const exists = db.songCollection.some((sc) => sc.songId === songId && sc.collectionId === cid);
          if (!exists) db.songCollection.push({ songId, collectionId: cid });
        }
      }

      if (typeof favorite === "boolean") {
        const has = db.songCollection.some((sc) => sc.songId === songId && sc.collectionId === "col-favorites");
        if (favorite && !has) db.songCollection.push({ songId, collectionId: "col-favorites" });
        if (!favorite && has) {
          db.songCollection = db.songCollection.filter((sc) => !(sc.songId === songId && sc.collectionId === "col-favorites"));
        }
      }
    };

    const { kept, dropped } = dedupeIncomingItems(items, batchDuplicatePolicy, (item) => {
      const source = sanitizeName(item?.sourceFileName || "");
      const songTitle = normalizeText(item?.song?.title || "");
      const songArtist = normalizeText(item?.song?.artist || "");
      const keys = [];
      if (source) keys.push(`file:${normalizeText(source)}`);
      if (songTitle && songArtist) keys.push(`ta:${songTitle}||${songArtist}`);
      if (item?.midiBase64) keys.push(`midi:${hashBuffer(Buffer.from(item.midiBase64, "base64"))}`);
      return keys;
    });

    for (const d of dropped) {
      const sourceFileName = sanitizeName(d.item?.sourceFileName || "song.mid");
      skipped.push({ sourceFileName, reason: d.reason, existingSongId: "" });
      report.push({ sourceFileName, status: "skipped", reason: d.reason });
    }

    for (const item of kept) {
      const midiBase64 = item.midiBase64;
      const songMeta = item.song || {};
      const jsonData = item.jsonData;
      const sourceFileName = sanitizeName(item.sourceFileName || "song.mid");
      if (!midiBase64 || !jsonData) {
        skipped.push({ sourceFileName, reason: "payload incompleto", existingSongId: "" });
        report.push({ sourceFileName, status: "error", reason: "payload incompleto" });
        continue;
      }

      const validation = validatePianoVisionJsonData(jsonData);
      if (!validation.ok) {
        const reason = `schema non valido: ${validation.errors.join(", ")}`;
        skipped.push({ sourceFileName, reason, existingSongId: "" });
        report.push({ sourceFileName, status: "error", reason });
        continue;
      }

      const midiBuffer = Buffer.from(midiBase64, "base64");
      const hash = hashBuffer(midiBuffer);
      const hashPrefix = hash.slice(0, 16);

      const { duplicate, reason: duplicateReason } = findDuplicateSong(db, {
        hash,
        title: songMeta.title,
        artist: songMeta.artist,
      });
      const itemOverwrite = overwriteAll || item.overwrite === true;
      if (duplicate && !itemOverwrite) {
        skipped.push({
          sourceFileName,
          reason: duplicateReason || "duplicato",
          existingSongId: duplicate.id,
        });
        report.push({
          sourceFileName,
          status: "skipped",
          reason: duplicateReason || "duplicato",
          existingSongId: duplicate.id,
        });
        continue;
      }

      try {
        if (duplicate && itemOverwrite) {
          const targetSong =
            (item.overwriteSongId && songById(db, String(item.overwriteSongId))) ||
            songById(db, duplicate.id) ||
            null;
          if (!targetSong) {
            skipped.push({
              sourceFileName,
              reason: "overwrite target non trovato",
              existingSongId: duplicate.id,
            });
            continue;
          }

          const targetJsonRel = String(targetSong.jsonPath || "").replace(/^\//, "");
          const targetJsonAbs = targetJsonRel ? path.join(__dirname, targetJsonRel) : path.join(JSON_DIR, `${hashPrefix}-${targetSong.id}.json`);
          await writeJsonAtomic(targetJsonAbs, jsonData);

          targetSong.title = repairMojibake(songMeta.title || "Senza titolo");
          targetSong.artist = repairMojibake(songMeta.artist || "");
          targetSong.composer = repairMojibake(songMeta.composer || "");
          targetSong.genre = repairMojibake(songMeta.genre || "");
          targetSong.difficulty = songMeta.difficulty || targetSong.difficulty || "intermedio";
          targetSong.key = songMeta.key || targetSong.key || "C major";
          targetSong.bpm = Number(songMeta.bpm || targetSong.bpm || 120);
          targetSong.duration = Number(songMeta.duration || targetSong.duration || 0);
          targetSong.instruments = Array.isArray(songMeta.instruments) ? songMeta.instruments : targetSong.instruments || [];
          targetSong.updatedAt = nowIso();
          targetSong.fileHash = hash;
          targetSong.sourceFileName = sourceFileName;
          targetSong.jsonPath = `/${path.relative(__dirname, targetJsonAbs).replace(/\\/g, "/")}`;
          targetSong.midiPath = "";

          let practice = db.practiceMeta.find((pm) => pm.songId === targetSong.id);
          if (!practice) {
            practice = { songId: targetSong.id, lastPracticePointSec: 0, playbackSpeed: 1, favoriteLoops: [], studyStatus: "to_study" };
            db.practiceMeta.push(practice);
          }
          if (Object.hasOwn(songMeta, "lastPracticePointSec")) practice.lastPracticePointSec = Number(songMeta.lastPracticePointSec || 0);
          if (Object.hasOwn(songMeta, "playbackSpeed")) practice.playbackSpeed = Number(songMeta.playbackSpeed || 1);
          if (Array.isArray(songMeta.favoriteLoops)) practice.favoriteLoops = songMeta.favoriteLoops;
          if (Object.hasOwn(songMeta, "studyStatus")) practice.studyStatus = songMeta.studyStatus || "to_study";

          applySongTags(targetSong.id, songMeta.tags, true);
          applySongCollections(targetSong.id, songMeta.collectionIds, typeof songMeta.favorite === "boolean" ? songMeta.favorite : undefined);
          applySmartMembership(db, targetSong);

          imported.push(targetSong);
          overwrittenCount += 1;
          report.push({
            sourceFileName,
            status: "overwritten",
            songId: targetSong.id,
            reason: duplicateReason || "duplicato sovrascritto",
          });
          continue;
        }

        const songId = uid("song");
        const ext = path.extname(sourceFileName);
        const sourceBase = sanitizeName(path.basename(sourceFileName, ext)) || `${hashPrefix}-${songId}`;
        let jsonFileName = `${sourceBase}.json`;
        let seq = 2;
        while (
          db.songs.some((s) => String(s.jsonPath || "").endsWith(`/${jsonFileName}`)) ||
          (await pathExists(path.join(JSON_DIR, jsonFileName)))
        ) {
          jsonFileName = `${sourceBase}-${seq}.json`;
          seq += 1;
        }

        const jsonPath = path.join(JSON_DIR, jsonFileName);
        await writeJsonAtomic(jsonPath, jsonData);

        const song = {
          id: songId,
          title: repairMojibake(songMeta.title || "Senza titolo"),
          artist: repairMojibake(songMeta.artist || ""),
          composer: repairMojibake(songMeta.composer || ""),
          genre: repairMojibake(songMeta.genre || ""),
          difficulty: songMeta.difficulty || "intermedio",
          key: songMeta.key || "C major",
          bpm: Number(songMeta.bpm || 120),
          duration: Number(songMeta.duration || 0),
          instruments: Array.isArray(songMeta.instruments) ? songMeta.instruments : [],
          importedAt: nowIso(),
          updatedAt: nowIso(),
          fileHash: hash,
          sourceFileName,
          jsonPath: `/library/json/${jsonFileName}`,
          midiPath: "",
        };

        db.songs.push(song);

        const practice = {
          songId,
          lastPracticePointSec: Number(songMeta.lastPracticePointSec || 0),
          playbackSpeed: Number(songMeta.playbackSpeed || 1),
          favoriteLoops: Array.isArray(songMeta.favoriteLoops) ? songMeta.favoriteLoops : [],
          studyStatus: songMeta.studyStatus || "to_study",
        };
        db.practiceMeta.push(practice);

        applySongTags(songId, songMeta.tags, false);
        applySongCollections(songId, songMeta.collectionIds, typeof songMeta.favorite === "boolean" ? songMeta.favorite : undefined);
        applySmartMembership(db, song);
        imported.push(song);
        report.push({ sourceFileName, status: "imported", songId: song.id });
      } catch (error) {
        skipped.push({
          sourceFileName,
          reason: `errore import: ${error.message}`,
          existingSongId: duplicate?.id || "",
        });
        report.push({
          sourceFileName,
          status: "error",
          reason: `errore import: ${error.message}`,
          existingSongId: duplicate?.id || "",
        });
      }
    }

    await writeDb(db);
    sendJson(res, 200, {
      importedCount: imported.length,
      overwrittenCount,
      songs: imported,
      skipped,
      report,
      batchDuplicatePolicy,
    });
    return true;
  }

  if (req.method === "PUT" && /^\/api\/songs\/[^/]+$/.test(url.pathname)) {
    const songId = url.pathname.split("/").pop();
    const payload = await readBodyJson(req);
    const db = await readDb();
    const song = songById(db, songId);
    if (!song) {
      sendJson(res, 404, { error: "Song non trovata" });
      return true;
    }

    applySongPatch(song, payload.song || {});

    const practice = db.practiceMeta.find((pm) => pm.songId === songId);
    if (practice) {
      if (Object.hasOwn(payload.song || {}, "studyStatus")) practice.studyStatus = payload.song.studyStatus;
      if (Object.hasOwn(payload.song || {}, "playbackSpeed")) practice.playbackSpeed = Number(payload.song.playbackSpeed || 1);
      if (Object.hasOwn(payload.song || {}, "lastPracticePointSec")) {
        practice.lastPracticePointSec = Number(payload.song.lastPracticePointSec || 0);
      }
      if (Array.isArray(payload.song?.favoriteLoops)) {
        practice.favoriteLoops = payload.song.favoriteLoops;
      }
    }

    if (Array.isArray(payload.tags)) {
      db.songTags = db.songTags.filter((st) => st.songId !== songId);
      for (const rawTag of payload.tags) {
        const tagName = String(rawTag || "").trim().toLowerCase();
        if (!tagName) continue;
        let tag = db.tags.find((t) => t.name === tagName);
        if (!tag) {
          tag = { id: uid("tag"), name: tagName, createdAt: nowIso() };
          db.tags.push(tag);
        }
        db.songTags.push({ songId, tagId: tag.id });
      }
    }

    if (Array.isArray(payload.collectionIds)) {
      const allowed = new Set(payload.collectionIds);
      db.songCollection = db.songCollection.filter((sc) => {
        if (sc.songId !== songId) return true;
        const col = collectionById(db, sc.collectionId);
        if (col?.smartRule) return true;
        if (sc.collectionId === "col-favorites") return true;
        return false;
      });
      for (const cid of allowed) {
        const c = collectionById(db, cid);
        if (!c || c.smartRule) continue;
        const exists = db.songCollection.some((sc) => sc.songId === songId && sc.collectionId === cid);
        if (!exists) db.songCollection.push({ songId, collectionId: cid });
      }
    }

    if (Object.hasOwn(payload, "favorite")) {
      const has = db.songCollection.some((sc) => sc.songId === songId && sc.collectionId === "col-favorites");
      if (payload.favorite && !has) db.songCollection.push({ songId, collectionId: "col-favorites" });
      if (!payload.favorite && has) {
        db.songCollection = db.songCollection.filter((sc) => !(sc.songId === songId && sc.collectionId === "col-favorites"));
      }
    }

    applySmartMembership(db, song);
    await writeDb(db);
    sendJson(res, 200, { ok: true, song });
    return true;
  }

  if (req.method === "DELETE" && /^\/api\/songs\/[^/]+$/.test(url.pathname)) {
    const songId = url.pathname.split("/").pop();
    const db = await readDb();
    const song = songById(db, songId);
    if (!song) {
      sendJson(res, 404, { error: "Song non trovata" });
      return true;
    }

    db.songs = db.songs.filter((s) => s.id !== songId);
    db.songCollection = db.songCollection.filter((sc) => sc.songId !== songId);
    db.songTags = db.songTags.filter((st) => st.songId !== songId);
    db.practiceMeta = db.practiceMeta.filter((pm) => pm.songId !== songId);

    const jsonFile = path.join(__dirname, song.jsonPath.replace(/^\//, ""));
    const midiFile = song.midiPath ? path.join(__dirname, song.midiPath.replace(/^\//, "")) : "";
    await fs.rm(jsonFile, { force: true });
    if (midiFile) await fs.rm(midiFile, { force: true });

    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/collections") {
    const payload = await readBodyJson(req);
    const name = String(payload.name || "").trim();
    const type = String(payload.type || "playlist").trim();
    if (!name) {
      sendJson(res, 400, { error: "Nome richiesto" });
      return true;
    }

    const db = await readDb();
    const exists = db.collections.find((c) => c.type === type && c.name.toLowerCase() === name.toLowerCase() && !c.smartRule);
    if (exists) {
      sendJson(res, 200, { collection: exists });
      return true;
    }

    const collection = {
      id: uid("col"),
      name,
      type,
      sortOrder: db.collections.length,
      createdAt: nowIso(),
    };
    db.collections.push(collection);
    await writeDb(db);
    sendJson(res, 201, { collection });
    return true;
  }

  if (req.method === "PUT" && /^\/api\/collections\/[^/]+$/.test(url.pathname)) {
    const cid = url.pathname.split("/").pop();
    const payload = await readBodyJson(req);
    const db = await readDb();
    const c = collectionById(db, cid);
    if (!c) {
      sendJson(res, 404, { error: "Collection non trovata" });
      return true;
    }
    if (c.smartRule) {
      sendJson(res, 400, { error: "Smart playlist non rinominabile" });
      return true;
    }
    if (typeof payload.name === "string" && payload.name.trim()) c.name = payload.name.trim();
    await writeDb(db);
    sendJson(res, 200, { collection: c });
    return true;
  }

  if (req.method === "DELETE" && /^\/api\/collections\/[^/]+$/.test(url.pathname)) {
    const cid = url.pathname.split("/").pop();
    if (["col-favorites", "col-study"].includes(cid)) {
      sendJson(res, 400, { error: "Collection di sistema non eliminabile" });
      return true;
    }

    const db = await readDb();
    const c = collectionById(db, cid);
    if (!c) {
      sendJson(res, 404, { error: "Collection non trovata" });
      return true;
    }
    if (c.smartRule) {
      sendJson(res, 400, { error: "Smart playlist non eliminabile" });
      return true;
    }

    db.collections = db.collections.filter((x) => x.id !== cid);
    db.songCollection = db.songCollection.filter((sc) => sc.collectionId !== cid);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.method === "GET" && url.pathname === "/api/tags") {
    const db = await readDb();
    sendJson(res, 200, { tags: db.tags });
    return true;
  }

  if (req.method === "POST" && url.pathname === "/api/tags") {
    const payload = await readBodyJson(req);
    const name = String(payload.name || "").trim().toLowerCase();
    if (!name) {
      sendJson(res, 400, { error: "Nome tag richiesto" });
      return true;
    }
    const db = await readDb();
    let tag = db.tags.find((t) => t.name === name);
    if (!tag) {
      tag = { id: uid("tag"), name, createdAt: nowIso() };
      db.tags.push(tag);
      await writeDb(db);
      sendJson(res, 201, { tag });
      return true;
    }
    sendJson(res, 200, { tag });
    return true;
  }

  if (req.method === "PUT" && /^\/api\/tags\/[^/]+$/.test(url.pathname)) {
    const tagId = url.pathname.split("/").pop();
    const payload = await readBodyJson(req);
    const name = String(payload.name || "").trim().toLowerCase();
    if (!name) {
      sendJson(res, 400, { error: "Nome tag richiesto" });
      return true;
    }
    const db = await readDb();
    const tag = db.tags.find((t) => t.id === tagId);
    if (!tag) {
      sendJson(res, 404, { error: "Tag non trovato" });
      return true;
    }
    tag.name = name;
    await writeDb(db);
    sendJson(res, 200, { tag });
    return true;
  }

  if (req.method === "DELETE" && /^\/api\/tags\/[^/]+$/.test(url.pathname)) {
    const tagId = url.pathname.split("/").pop();
    const db = await readDb();
    const exists = db.tags.some((t) => t.id === tagId);
    if (!exists) {
      sendJson(res, 404, { error: "Tag non trovato" });
      return true;
    }
    db.tags = db.tags.filter((t) => t.id !== tagId);
    db.songTags = db.songTags.filter((st) => st.tagId !== tagId);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return true;
  }

  return false;
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const normalized = pathname.replace(/^\/+/, "");
  const isLibraryAsset = normalized.startsWith("library/");
  const staticRoot = isLibraryAsset ? LIBRARY_DIR : __dirname;
  const relativePath = isLibraryAsset ? normalized.slice("library/".length) : normalized;
  const filePath = path.join(staticRoot, relativePath);
  if (!filePath.startsWith(staticRoot)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const st = await fs.stat(filePath);
    if (st.isDirectory()) {
      sendText(res, 403, "Forbidden");
      return;
    }
    const ext = path.extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch {
    sendText(res, 404, "Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (!handled) sendJson(res, 404, { error: "API route non trovata" });
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error?.message || "Server error" });
  }
});

await ensureSetup();

function listenAsync(port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

let boundPort = PORT;
try {
  await listenAsync(PORT);
} catch (err) {
  if (err?.code !== "EADDRINUSE") throw err;
  let started = false;
  for (let p = PORT + 1; p <= PORT + 20; p += 1) {
    try {
      await listenAsync(p);
      boundPort = p;
      started = true;
      break;
    } catch (inner) {
      if (inner?.code !== "EADDRINUSE") throw inner;
    }
  }
  if (!started) throw err;
}

if (boundPort !== PORT) {
  console.log(`Porta ${PORT} occupata, avviato su http://localhost:${boundPort} (bind ${HOST})`);
} else {
  console.log(`PianoVisual server in ascolto su http://localhost:${boundPort} (bind ${HOST})`);
}

if (process.env.CODESPACES === "true" && process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
  const publicUrl = `https://${process.env.CODESPACE_NAME}-${boundPort}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
  console.log(`Apri da browser (Codespaces): ${publicUrl}`);
}
