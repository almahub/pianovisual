import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { planFavoriteSync } = createRequire(import.meta.url)('../electron/favorite-sync.cjs');

function db(favorites = [], sync = {}) {
  return { songs: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], songCollection: favorites.map((songId) => ({ songId, collectionId: 'col-favorites' })), questFavoriteSync: sync };
}

test('adds a mapped favorite and removes only previously managed favorites after Quest removal', () => {
  const scope = { device: 'quest', profileId: 1, remoteIds: [42], choices: [{ pieceId: 42, songId: 'a' }] };
  const first = planFavoriteSync(db(['b']), scope);
  assert.deepEqual(first.added, ['a']);
  assert.deepEqual(first.removed, []);
  const second = planFavoriteSync(db(['a', 'b'], { version: 1, bindings: first.bindings, managedSongIds: first.managedSongIds }), { ...scope, remoteIds: [], choices: [] });
  assert.deepEqual(second.removed, ['a']);
  assert.deepEqual(second.favoriteIds, ['b']);
});

test('never claims or deletes a local favorite that already existed', () => {
  const scope = { device: 'quest', profileId: 1, remoteIds: [42], choices: [{ pieceId: 42, songId: 'a' }] };
  const first = planFavoriteSync(db(['a']), scope);
  assert.deepEqual(first.managedSongIds, []);
  const second = planFavoriteSync(db(['a'], { version: 1, bindings: first.bindings, managedSongIds: first.managedSongIds }), { ...scope, remoteIds: [], choices: [] });
  assert.deepEqual(second.removed, []);
  assert.deepEqual(second.favoriteIds, ['a']);
});

test('keeps songs linked by another profile and ignores stale unrelated ownership', () => {
  const sync = { version: 1, bindings: [{ device: 'quest', profileId: 1, pieceId: 1, songId: 'a' }, { device: 'quest', profileId: 2, pieceId: 1, songId: 'a' }], managedSongIds: ['a', 'c'] };
  const result = planFavoriteSync(db(['a', 'c'], sync), { device: 'quest', profileId: 1, remoteIds: [], choices: [] });
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.favoriteIds, ['a', 'c']);
});

test('rejects invalid mappings and never mutates inputs', () => {
  const input = db(['b']);
  const original = JSON.stringify(input);
  assert.throws(() => planFavoriteSync(input, { device: 'quest', profileId: 1, remoteIds: [1], choices: [{ pieceId: 2, songId: 'a' }] }));
  assert.equal(JSON.stringify(input), original);
});
