import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = process.cwd();
const libraryDir = path.join(root, 'library');
const jsonDir = path.join(libraryDir, 'json');
const dbPath = path.join(libraryDir, 'db.json');
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
  const entries = await fs.readdir(jsonDir);
  await Promise.all(entries.filter((x) => x.endsWith('.json')).map((x) => fs.rm(path.join(jsonDir, x), { force: true })));
  await fs.writeFile(dbPath, JSON.stringify(defaultDb(), null, 2) + '\n', 'utf8');
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
