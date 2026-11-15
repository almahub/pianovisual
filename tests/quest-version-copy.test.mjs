import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { versionCopy } = require('../electron/quest-version-copy.cjs');
const { compareQuestCollections } = require('../electron/quest-comparison.cjs');

test('version copies preserve the source and create distinct deterministic names', () => {
  const source = Buffer.from(JSON.stringify({ name: 'Example Song', artist: 'Example Artist', notes: [1, 2] }));
  const original = Buffer.from(source);
  const song = { id: 'one', title: 'Example Song', versionName: 'ss', variantType: 'selected_instruments', jsonPath: '/library/jsonselected/a.json' };
  const first = versionCopy(source, song);
  const second = versionCopy(source, { ...song, id: 'two', versionName: 'ss2' });
  assert.deepEqual(source, original);
  assert.equal(JSON.parse(first.content).name, 'Example Song [ss]');
  assert.equal(JSON.parse(second.content).name, 'Example Song [ss2]');
  assert.notEqual(first.fileName, second.fileName);
  assert.deepEqual(versionCopy(source, song), first);
  assert.notEqual(versionCopy(Buffer.from('{"name":"Example Song","notes":[3]}'), song).fileName, first.fileName);
  assert.equal(versionCopy(source, { ...song, versionName: '' }), null);
});

test('favorite and playlist matching accepts a verified labeled-copy hash', () => {
  const piece = { pieceId: 1, title: 'Example Song [ss]', artist: 'Example Artist', origin: 'imported', fileName: 'copy.json' };
  const song = { id: 'one', title: 'Example Song', artist: 'Example Artist', jsonPath: '/library/jsonselected/a.json' };
  const remote = { profiles: [], favorites: [piece], playlists: [{ songs: [piece], name: 'test' }] };
  const result = compareQuestCollections(remote, [song], new Map([['copy.json', 'copyhash']]), new Map(), { songCollection: [], collections: [] }, new Map([['one', 'copyhash']]));
  assert.equal(result.favorites[0].match, 'identical');
  assert.equal(result.playlists[0].songs[0].candidates[0].id, 'one');
  const changed = compareQuestCollections(remote, [song], new Map([['copy.json', 'different']]), new Map(), { songCollection: [], collections: [] }, new Map([['one', 'copyhash']]));
  assert.notEqual(changed.favorites[0].match, 'identical');
});
