import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = process.cwd();
const libraryDir = path.join(root, 'library');
const jsonDir = path.join(libraryDir, 'json');
const pianoJsonDir = path.join(libraryDir, 'jsonpiano');
const dbPath = path.join(libraryDir, 'db.json');
const pianoDbPath = path.join(libraryDir, 'dbpiano.json');
const PORT = 6199;
const BASE = `http://127.0.0.1:${PORT}`;

let serverProc;
let backupDir;

function defaultDb() {
  return {
    songs: [],
    collections: [
      { id: 'col-favorites', name: 'Preferiti', type: 'preferiti', sortOrder: 0 },
      { id: 'col-study', name: 'Studio', type: 'studio', sortOrder: 1 },
      { id: 'col-smart-key-g', name: 'Tonalita di Sol', type: 'playlist', sortOrder: 100, smartRule: { keyIncludes: 'G' } },
      { id: 'col-smart-bpm90', name: 'BPM < 90', type: 'playlist', sortOrder: 101, smartRule: { bpmLt: 90 } },
      { id: 'col-smart-beginner', name: 'Difficolta Principiante', type: 'playlist', sortOrder: 102, smartRule: { difficulty: 'principiante' } }
    ],
    songCollection: [],
    tags: [],
    songTags: [],
    practiceMeta: [],
    updatedAt: new Date().toISOString()
  };
}

async function resetLibrary() {
  await fs.mkdir(jsonDir, { recursive: true });
  await fs.mkdir(pianoJsonDir, { recursive: true });
  const entries = await fs.readdir(jsonDir);
  const pianoEntries = await fs.readdir(pianoJsonDir);
  await Promise.all(entries.filter((x) => x.endsWith('.json')).map((x) => fs.rm(path.join(jsonDir, x), { force: true })));
  await Promise.all(pianoEntries.filter((x) => x.endsWith('.json')).map((x) => fs.rm(path.join(pianoJsonDir, x), { force: true })));
  await fs.writeFile(dbPath, JSON.stringify(defaultDb(), null, 2) + '\n', 'utf8');
  await fs.writeFile(pianoDbPath, JSON.stringify({ ...defaultDb(), collections: [] }, null, 2) + '\n', 'utf8');
}

async function api(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const txt = await res.text();
  const body = txt ? JSON.parse(txt) : {};
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

function makeItem({ sourceFileName = 'piece.mid', title = 'Piece', artist = 'Tester', midiSeed = 'A' } = {}) {
  const midiBase64 = Buffer.from(`midi-${midiSeed}`).toString('base64');
  const jsonData = {
    supportingTracks: [{ notes: [{ midi: 60, time: 0, velocity: 0.7, duration: 0.5 }], myInstrument: -5, theirInstrument: 0 }],
    start_time: 0,
    song_length: 1,
    resolution: 480,
    tempos: [{ bpm: 120, ticks: 0, time: 0 }],
    keySignatures: [{ key: 'C', scale: 'major', ticks: 0 }],
    timeSignatures: [{ ticks: 0, timeSignature: [4, 4], measures: 0 }],
    name: title,
    artist
  };
  return {
    sourceFileName,
    midiBase64,
    jsonData,
    song: {
      title,
      artist,
      composer: artist,
      genre: 'Classica',
      difficulty: 'intermedio',
      key: 'C major',
      bpm: 120,
      duration: 1,
      instruments: ['acoustic grand piano'],
      tags: [],
      collectionIds: []
    }
  };
}

function makeCompatiblePianoVisionJson() {
  const track = (name, number, notes) => ({
    channel: number,
    controlChanges: {},
    pitchBends: [],
    instrument: { family: 'piano', number, name },
    name,
    notes: notes.map((note, index) => ({
      midi: note,
      time: index * 0.5,
      duration: 0.45,
      velocity: 0.8,
      ticks: index * 240,
      durationTicks: 216,
      name: `N${note}`,
    })),
  });
  const originalTracks = [
    track('Lead', 0, [72, 74, 76, 77]),
    track('Harmony', 1, [60, 64, 65, 69]),
    track('Bass', 2, [36, 36, 41, 43]),
  ];
  return {
    supportingTracks: originalTracks.map((item) => ({ notes: item.notes, myInstrument: -5, theirInstrument: item.instrument.number })),
    start_time: 0,
    song_length: 2,
    resolution: 480,
    tempos: [{ bpm: 120, ticks: 0, time: 0 }],
    keySignatures: [{ key: 'C', scale: 'major', ticks: 0 }],
    timeSignatures: [{ ticks: 0, timeSignature: [4, 4], measures: 0 }],
    measures: [{ ticksStart: 0, totalTicks: 1920, time: 0, timeSignature: [4, 4] }],
    tracksV2: {
      right: [{ direction: 'up', notes: [], measureTicksStart: 0, measureTicksEnd: 1920 }],
      left: [{ direction: 'down', notes: [], measureTicksStart: 0, measureTicksEnd: 1920 }],
    },
    original: { header: { ppq: 480, tempos: [{ bpm: 120, ticks: 0 }], timeSignatures: [] }, tracks: originalTracks },
    accompanyingInstruments: [0, 1, 2],
    accompanyingChannels: [0, 1, 2],
    accompanyingTracks: [],
    name: 'Skill Source',
    artist: 'Tester',
  };
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < 8000) {
    try {
      const res = await fetch(`${BASE}/api/library`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error('Server did not start in time');
}

test.before(async () => {
  backupDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pianovisual-lib-backup-'));
  await fs.cp(libraryDir, backupDir, { recursive: true });
  serverProc = spawn('node', ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
});

test.after(async () => {
  if (serverProc) {
    serverProc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 200));
  }
  await fs.rm(libraryDir, { recursive: true, force: true });
  await fs.cp(backupDir, libraryDir, { recursive: true });
  await fs.rm(backupDir, { recursive: true, force: true });
});

test.beforeEach(async () => {
  await resetLibrary();
});

test('remote catalog rejects unsafe or oversized deferred downloads', async () => {
  await assert.rejects(
    api('/api/remote-catalog/fetch', { method: 'POST', body: JSON.stringify({ paths: ['../secret.mid'] }) }),
    /400/,
  );
  await assert.rejects(
    api('/api/remote-catalog/fetch', {
      method: 'POST',
      body: JSON.stringify({ paths: Array.from({ length: 21 }, (_, i) => `Artist/Song-${i}.mid`) }),
    }),
    /400/,
  );
});

test('overwrite succeeded keeps one song and updates metadata', async () => {
  const first = makeItem({ sourceFileName: 'same.mid', title: 'Old Title', artist: 'A', midiSeed: 'same' });
  const second = makeItem({ sourceFileName: 'same.mid', title: 'New Title', artist: 'A', midiSeed: 'same' });

  let result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [first] }) });
  assert.equal(result.importedCount, 1);

  result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ overwrite: true, items: [second] }) });
  assert.equal(result.importedCount, 1);
  assert.equal(result.overwrittenCount, 1);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 1);
  assert.equal(db.songs[0].title, 'New Title');
});

test('overwrite failed leaves original song untouched', async () => {
  const first = makeItem({ sourceFileName: 'f.mid', title: 'Original', artist: 'A', midiSeed: 'x' });
  await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [first] }) });

  const db1 = await api('/api/library');
  const song = db1.songs[0];
  const dbRaw = JSON.parse(await fs.readFile(dbPath, 'utf8'));
  dbRaw.songs[0].jsonPath = '/library/json/missing-dir/non-existent.json';
  await fs.writeFile(dbPath, JSON.stringify(dbRaw, null, 2) + '\n', 'utf8');

  const second = makeItem({ sourceFileName: 'f.mid', title: 'Should Not Replace', artist: 'A', midiSeed: 'x' });
  const result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ overwrite: true, items: [second] }) });
  assert.equal(result.importedCount, 0);
  assert.equal(result.skipped.length, 1);

  const db2 = await api('/api/library');
  assert.equal(db2.songs.length, 1);
  assert.equal(db2.songs[0].id, song.id);
  assert.equal(db2.songs[0].title, 'Original');
});

test('skip single duplicate imports only new item', async () => {
  const existing = makeItem({ sourceFileName: 'dup.mid', title: 'Dup', artist: 'A', midiSeed: 'dup' });
  await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [existing] }) });

  const duplicate = makeItem({ sourceFileName: 'dup.mid', title: 'Dup', artist: 'A', midiSeed: 'dup' });
  const fresh = makeItem({ sourceFileName: 'fresh.mid', title: 'Fresh', artist: 'B', midiSeed: 'fresh' });
  const result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [duplicate, fresh] }) });

  assert.equal(result.importedCount, 1);
  assert.equal(result.skipped.length, 1);
  const db = await api('/api/library');
  assert.equal(db.songs.length, 2);
});

test('duplicate inside same batch imports first and skips second', async () => {
  const a = makeItem({ sourceFileName: 'sameA.mid', title: 'X', artist: 'A', midiSeed: 'z' });
  const b = makeItem({ sourceFileName: 'sameB.mid', title: 'X', artist: 'A', midiSeed: 'z' });

  const result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [a, b] }) });
  assert.equal(result.importedCount, 1);
  assert.equal(result.skipped.length, 1);
  assert.equal(Array.isArray(result.report), true);
  assert.equal(result.report.length >= 2, true);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 1);
});

test('import-json-archive skip duplicate keeps original', async () => {
  const first = {
    fileName: 'arch-a.json',
    jsonData: {
      supportingTracks: [{ notes: [{ midi: 60, time: 0, velocity: 0.7, duration: 0.5 }], myInstrument: -5, theirInstrument: 0 }],
      start_time: 0,
      song_length: 1,
      resolution: 480,
      tempos: [{ bpm: 120, ticks: 0, time: 0 }],
      keySignatures: [{ key: 'C', scale: 'major', ticks: 0 }],
      timeSignatures: [{ ticks: 0, timeSignature: [4, 4], measures: 0 }],
      name: 'Archive Song',
      artist: 'Archive Artist',
    },
  };
  await api('/api/library/import-json-archive', { method: 'POST', body: JSON.stringify({ items: [first] }) });

  const dup = structuredClone(first);
  dup.fileName = 'arch-dup.json';
  const result = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [dup], conflictPolicy: 'skip' }),
  });
  assert.equal(result.importedCount, 0);
  assert.equal(result.overwrittenCount, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.report.some((r) => r.status === 'skipped'), true);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 1);
  assert.equal(db.songs[0].title, 'Archive Song');
});

test('JSON roundtrip does not duplicate a MIDI song when artist is empty', async () => {
  const midiItem = makeItem({ sourceFileName: 'roundtrip.mid', title: 'Roundtrip', artist: '', midiSeed: 'roundtrip' });
  let result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [midiItem] }) });
  assert.equal(result.importedCount, 1);

  result = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [{ fileName: 'copied-from-quest.json', jsonData: midiItem.jsonData }], conflictPolicy: 'skip' }),
  });
  assert.equal(result.importedCount, 0);
  assert.equal(result.skipped.length, 1);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 1);
  assert.equal((await fs.readdir(jsonDir)).filter((name) => name.endsWith('.json')).length, 1);
});

test('disk realignment preserves MIDI hash used for duplicate detection', async () => {
  const item = makeItem({ sourceFileName: 'realign.mid', title: 'Realign', artist: '', midiSeed: 'realign' });
  await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [item] }) });
  const before = await api('/api/library');
  const midiHash = before.songs[0].fileHash;

  await api('/api/library/sync-from-json', { method: 'POST', body: JSON.stringify({ mode: 'add_only' }) });
  const afterSync = await api('/api/library');
  assert.equal(afterSync.songs[0].fileHash, midiHash);
  assert.equal(typeof afterSync.songs[0].jsonContentHash, 'string');

  const result = await api('/api/library/import-batch', { method: 'POST', body: JSON.stringify({ items: [item] }) });
  assert.equal(result.importedCount, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal((await api('/api/library')).songs.length, 1);
});

test('Piano Lab creates a separate compatible reduction linked to the full song', async () => {
  const sourceJson = makeCompatiblePianoVisionJson();
  const drums = {
    ...structuredClone(sourceJson.original.tracks[0]),
    channel: 9,
    name: 'Drums',
    instrument: { family: 'drums', number: 0, name: 'Drum Kit' },
    notes: sourceJson.original.tracks[0].notes.map((note, index) => ({ ...note, midi: index % 2 ? 38 : 36 })),
  };
  sourceJson.original.tracks.push(drums);
  sourceJson.supportingTracks.push({ notes: drums.notes, myInstrument: -5, theirInstrument: 0 });
  sourceJson.accompanyingInstruments.push(0);
  sourceJson.accompanyingChannels.push(9);
  const imported = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [{ fileName: 'skill-source.json', jsonData: sourceJson }] }),
  });
  assert.equal(imported.importedCount, 1);
  const status = await api('/api/piano-reduction/status');
  assert.equal(status.available, true);

  const result = await api('/api/piano-reduction/create', {
    method: 'POST',
    body: JSON.stringify({ songId: imported.songs[0].id }),
  });
  assert.equal(result.song.variantType, 'piano_reduction');
  assert.equal(result.song.derivedFromSongId, imported.songs[0].id);
  assert.equal(result.song.title, 'Skill Source piano');
  assert.match(result.song.jsonPath, /^\/library\/jsonpiano\//);
  assert.equal(result.summary.measures, 1);
  assert.equal(Object.values(result.song.reductionRoleSourceIndices).includes(3), false);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 2);
  const fullDb = JSON.parse(await fs.readFile(dbPath, 'utf8'));
  const pianoDb = JSON.parse(await fs.readFile(pianoDbPath, 'utf8'));
  assert.equal(fullDb.songs.length, 1);
  assert.equal(pianoDb.songs.length, 1);
  const reduced = JSON.parse(await fs.readFile(path.join(pianoJsonDir, path.basename(result.song.jsonPath)), 'utf8'));
  assert.equal(reduced.tracksV2.right.length, reduced.measures.length);
  assert.equal(reduced.tracksV2.left.length, reduced.measures.length);
  assert.equal(reduced.original.tracks[3].name, 'Drums');
  assert.equal('reductionRoleSourceIndices' in reduced, false);
});

test('Visualizer selection can be reduced and stored directly in Piano Lab', async () => {
  const sourceJson = makeCompatiblePianoVisionJson();
  const imported = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [{ fileName: 'visual-selection.json', jsonData: sourceJson }] }),
  });
  const filtered = structuredClone(sourceJson);
  filtered.original.tracks = [sourceJson.original.tracks[0], sourceJson.original.tracks[2]];
  filtered.supportingTracks = [sourceJson.supportingTracks[0], sourceJson.supportingTracks[2]];
  filtered.accompanyingInstruments = [sourceJson.accompanyingInstruments[0], sourceJson.accompanyingInstruments[2]];
  filtered.accompanyingChannels = [sourceJson.accompanyingChannels[0], sourceJson.accompanyingChannels[2]];

  const result = await api('/api/piano-reduction/create', {
    method: 'POST',
    body: JSON.stringify({
      songId: imported.songs[0].id,
      sourceJson: filtered,
      selectedInstruments: ['Lead', 'Bass'],
    }),
  });
  assert.deepEqual(result.song.reductionSourceInstruments, ['Lead', 'Bass']);
  const reduced = JSON.parse(await fs.readFile(path.join(pianoJsonDir, path.basename(result.song.jsonPath)), 'utf8'));
  assert.equal(reduced.original.tracks.length, 2);
  assert.deepEqual(reduced.original.tracks.map((track) => track.name), ['Lead', 'Bass']);
});

test('existing piano reductions migrate from json and db.json to the dedicated library', async () => {
  const legacyFileName = 'legacy-song-piano.json';
  await fs.writeFile(path.join(jsonDir, legacyFileName), JSON.stringify(makeCompatiblePianoVisionJson(), null, 2) + '\n', 'utf8');
  const legacyDb = defaultDb();
  legacyDb.songs.push({
    id: 'piano-legacy',
    title: 'Legacy Song · Riduzione piano',
    artist: 'Tester',
    genre: 'Classica',
    midiPath: '',
    sourceFileName: legacyFileName,
    jsonPath: `/library/json/${legacyFileName}`,
    variantType: 'piano_reduction',
  });
  legacyDb.practiceMeta.push({ songId: 'piano-legacy', lastPracticePointSec: 0, playbackSpeed: 1, favoriteLoops: [], studyStatus: 'to_study' });
  await fs.writeFile(dbPath, JSON.stringify(legacyDb, null, 2) + '\n', 'utf8');

  const merged = await api('/api/library');
  const migrated = merged.songs.find((song) => song.id === 'piano-legacy');
  assert.equal(migrated.title, 'Legacy Song piano');
  assert.equal(migrated.jsonPath, `/library/jsonpiano/${legacyFileName}`);
  assert.equal(await fs.stat(path.join(pianoJsonDir, legacyFileName)).then(() => true), true);
  await assert.rejects(fs.access(path.join(jsonDir, legacyFileName)));
  assert.equal((JSON.parse(await fs.readFile(dbPath, 'utf8'))).songs.length, 0);
  assert.equal((JSON.parse(await fs.readFile(pianoDbPath, 'utf8'))).songs.length, 1);
});

test('Piano Lab refuses a second reduction made from a duplicate source song', async () => {
  const imported = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [{ fileName: 'duplicate-source.json', jsonData: makeCompatiblePianoVisionJson() }] }),
  });
  const original = imported.songs[0];
  const originalFileName = path.basename(original.jsonPath);
  const copyFileName = 'duplicate-source-copy.json';
  await fs.copyFile(path.join(jsonDir, originalFileName), path.join(jsonDir, copyFileName));

  const storedDb = JSON.parse(await fs.readFile(dbPath, 'utf8'));
  const copy = { ...storedDb.songs[0], id: 'song-duplicate-copy', sourceFileName: copyFileName, jsonPath: `/library/json/${copyFileName}` };
  storedDb.songs.push(copy);
  storedDb.practiceMeta.push({ songId: copy.id, lastPracticePointSec: 0, playbackSpeed: 1, favoriteLoops: [], studyStatus: 'to_study' });
  await fs.writeFile(dbPath, JSON.stringify(storedDb, null, 2) + '\n', 'utf8');

  await api('/api/piano-reduction/create', {
    method: 'POST',
    body: JSON.stringify({ songId: original.id }),
  });
  await assert.rejects(
    api('/api/piano-reduction/create', { method: 'POST', body: JSON.stringify({ songId: copy.id }) }),
    /409.*Esiste già una riduzione/,
  );
  const merged = await api('/api/library');
  assert.equal(merged.songs.filter((song) => song.variantType === 'piano_reduction').length, 1);
});

test('import-json-archive overwrite duplicate updates metadata', async () => {
  const first = {
    fileName: 'arch-a.json',
    jsonData: {
      supportingTracks: [{ notes: [{ midi: 60, time: 0, velocity: 0.7, duration: 0.5 }], myInstrument: -5, theirInstrument: 0 }],
      start_time: 0,
      song_length: 1,
      resolution: 480,
      tempos: [{ bpm: 120, ticks: 0, time: 0 }],
      keySignatures: [{ key: 'C', scale: 'major', ticks: 0 }],
      timeSignatures: [{ ticks: 0, timeSignature: [4, 4], measures: 0 }],
      name: 'Archive Song',
      artist: 'Archive Artist',
    },
  };
  await api('/api/library/import-json-archive', { method: 'POST', body: JSON.stringify({ items: [first] }) });

  const second = {
    fileName: 'arch-b.json',
    jsonData: {
      supportingTracks: [{ notes: [{ midi: 62, time: 0, velocity: 0.7, duration: 0.5 }], myInstrument: -5, theirInstrument: 0 }],
      start_time: 0,
      song_length: 2,
      resolution: 480,
      tempos: [{ bpm: 90, ticks: 0, time: 0 }],
      keySignatures: [{ key: 'G', scale: 'major', ticks: 0 }],
      timeSignatures: [{ ticks: 0, timeSignature: [4, 4], measures: 0 }],
      name: 'Archive Song',
      artist: 'Archive Artist',
    },
  };
  const result = await api('/api/library/import-json-archive', {
    method: 'POST',
    body: JSON.stringify({ items: [second], conflictPolicy: 'overwrite' }),
  });
  assert.equal(result.importedCount, 1);
  assert.equal(result.overwrittenCount, 1);
  assert.equal(result.report.some((r) => r.status === 'overwritten'), true);

  const db = await api('/api/library');
  assert.equal(db.songs.length, 1);
  assert.equal(db.songs[0].bpm, 90);
  assert.equal(db.songs[0].key, 'G major');
});
