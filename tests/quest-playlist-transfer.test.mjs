import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

async function setup() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pianovisual-send-test-'));
  const library = path.join(root, 'library'); await fs.mkdir(library);
  const user = Buffer.from('original database');
  const db = { songs: [{ id: 'song', title: 'Title', jsonPath: '/library/json/song.json' }], collections: [{ id: 'list', type: 'playlist', name: 'List' }], songCollection: [{ songId: 'song', collectionId: 'list' }] };
  await fs.writeFile(path.join(library, 'db.json'), JSON.stringify(db));
  await fs.writeFile(path.join(library, 'dbpiano.json'), JSON.stringify({ songs: [], collections: [], songCollection: [] }));
  const file = path.join(root, 'song.json'); await fs.writeFile(file, 'music');
  const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
  const handlers = {}, commands = []; let running = false, remoteHash = hash(user), stageHash = '', failWrite = false;
  const runAdb = async (args) => {
    commands.push(args);
    const command = args[3] || '';
    if (args[2] === 'push') { stageHash = hash(await fs.readFile(args[3])); return { stdout: '' }; }
    if (command.startsWith('if pidof') && command.includes('echo STOPPED')) return { stdout: running ? 'RUNNING' : 'STOPPED' };
    if (command.startsWith('if pidof') && command.includes('dd if=')) { if (failWrite) throw new Error('USB disconnected'); remoteHash = stageHash; return { stdout: '' }; }
    if (command === 'sha256sum') return { stdout: `${remoteHash} file` };
    return { stdout: '' };
  };
  const source = await fs.readFile(new URL('../electron/main.cjs', import.meta.url), 'utf8');
  const start = source.indexOf('const outgoingPlaylistPreviews = new Map();');
  const end = source.indexOf('ipcMain.handle("quest:preview-push"', start);
  assert.ok(start >= 0 && end > start);
  const register = new Function('ipcMain','getQuestDevice','runAdb','readQuestSnapshots','readQuestCollections','runtimeLibraryDir','remoteQuestFiles','localLibraryJsonFiles','localQuestTransferFiles','sha256File','buildQuestPlaylistDatabase','app','QUEST_JSON_DIR','fs','path','os','crypto',source.slice(start,end));
  register({ handle: (name, fn) => { handlers[name] = fn; } }, async () => 'device', runAdb,
    async () => [user, Buffer.from('static')], async () => ({ profiles: [{ id: 1 }], playlists: [], importedPieces: [{ pieceId: 5, title: 'Title', artist: '', fileName: 'song.json' }] }),
    () => library, async () => [{ fileName: 'song.json', hash: hash(Buffer.from('music')) }], async () => new Map([['json/song.json', { localPath: file }]]), async () => new Map(),
    async (target) => hash(await fs.readFile(target)), async () => ({ bytes: Buffer.from('modified database'), added: 1, created: true }),
    { getPath: () => root }, '/quest', fs, path, os, crypto);
  return { root, handlers, commands, setRunning: (value) => { running = value; }, setFailWrite: (value) => { failWrite = value; } };
}

async function cleanup(root) {
  const resolved = path.resolve(root);
  const relative = path.relative(path.resolve(os.tmpdir()), resolved);
  if (!relative.startsWith('pianovisual-send-test-') || relative.includes(path.sep)) throw new Error('Invalid temporary directory');
  await fs.rm(resolved, { recursive: true, force: true });
}

test('outgoing Quest playlist backs up, validates and verifies the write', async (t) => {
  const ctx = await setup(); t.after(() => cleanup(ctx.root));
  const preview = await ctx.handlers['quest:preview-outgoing-playlist'](null, { localId: 'list', profileId: 1 });
  const sent = await ctx.handlers['quest:send-outgoing-playlist'](null, { token: preview.token, destinationId: 0, choices: [{ songId: 'song', pieceId: 5 }] });
  assert.equal(sent.added, 1);
  assert.equal((await fs.readFile(sent.backupPath)).toString(), 'original database');
  assert.ok(ctx.commands.some((args) => String(args[3]).includes('conv=notrunc')));
});

test('outgoing Quest playlist refuses to write if the game starts after preview', async (t) => {
  const ctx = await setup(); t.after(() => cleanup(ctx.root));
  const preview = await ctx.handlers['quest:preview-outgoing-playlist'](null, { localId: 'list', profileId: 1 });
  ctx.setRunning(true);
  await assert.rejects(ctx.handlers['quest:send-outgoing-playlist'](null, { token: preview.token, destinationId: 0, choices: [{ songId: 'song', pieceId: 5 }] }), /Chiudi/);
  assert.ok(!ctx.commands.some((args) => String(args[3]).includes('conv=notrunc')));
});

test('failed Quest database write reports the backup and warns not to start the game', async (t) => {
  const ctx = await setup(); t.after(() => cleanup(ctx.root));
  const preview = await ctx.handlers['quest:preview-outgoing-playlist'](null, { localId: 'list', profileId: 1 });
  ctx.setFailWrite(true);
  await assert.rejects(ctx.handlers['quest:send-outgoing-playlist'](null, { token: preview.token, destinationId: 0, choices: [{ songId: 'song', pieceId: 5 }] }), /non avviare PianoVision; backup sul PC/);
});

test('outgoing Quest playlist rejects mismatched pieces and modified local files', async (t) => {
  const ctx = await setup(); t.after(() => cleanup(ctx.root));
  let preview = await ctx.handlers['quest:preview-outgoing-playlist'](null, { localId: 'list', profileId: 1 });
  await assert.rejects(ctx.handlers['quest:send-outgoing-playlist'](null, { token: preview.token, destinationId: 0, choices: [{ songId: 'song', pieceId: 99 }] }), /Collegamento brano non valido/);
  preview = await ctx.handlers['quest:preview-outgoing-playlist'](null, { localId: 'list', profileId: 1 });
  await fs.writeFile(path.join(ctx.root, 'song.json'), 'modified');
  await assert.rejects(ctx.handlers['quest:send-outgoing-playlist'](null, { token: preview.token, destinationId: 0, choices: [{ songId: 'song', pieceId: 5 }] }), /cambiati/);
  assert.ok(!ctx.commands.some((args) => String(args[3]).includes('conv=notrunc')));
});
