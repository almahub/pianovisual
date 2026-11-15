import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { planPlaylistSync } = createRequire(import.meta.url)('../electron/playlist-sync.cjs');

const scope = { device: 'quest', profileId: 1, playlistId: 2, playlistName: 'Vinicio', localId: '__create__', remoteIds: [4], choices: [{ pieceId: 4, songId: 'a' }] };
const db = (collections = [], membership = [], sync = {}) => ({ songs: [{ id: 'a' }, { id: 'b' }], collections, songCollection: membership, questPlaylistSync: sync });

test('creates and links a playlist without mutating its inputs', () => {
  const input = db(), before = JSON.stringify(input), result = planPlaylistSync(input, scope);
  assert.equal(result.create, true);
  assert.deepEqual(result.added, ['a']);
  assert.equal(result.playlists[0].pieces[0].songId, 'a');
  assert.equal(JSON.stringify(input), before);
});

test('requires explicit selection when a local playlist has the same name', () => {
  assert.throws(() => planPlaylistSync(db([{ id: 'p', type: 'playlist', name: 'vinicio' }]), scope), /selezionala/);
});

test('protects existing manual membership and removes only a managed song', () => {
  const collection = [{ id: 'p', type: 'playlist', name: 'Vinicio' }];
  const member = [{ collectionId: 'p', songId: 'b' }];
  const first = planPlaylistSync(db(collection, member), { ...scope, localId: 'p', remoteIds: [4, 5], choices: [{ pieceId: 4, songId: 'a' }, { pieceId: 5, songId: 'b' }] });
  assert.deepEqual(first.added, ['a']);
  const second = planPlaylistSync(db(collection, [...member, { collectionId: 'p', songId: 'a' }], { version: 1, playlists: first.playlists, managedMemberships: first.managedMemberships }), { ...scope, localId: 'p', remoteIds: [], choices: [] });
  assert.deepEqual(second.removed, ['a']);
});

test('retains a managed song still linked by another profile', () => {
  const lists = [{ id: 'p', type: 'playlist', name: 'Vinicio' }];
  const sync = { version: 1, playlists: [{ device: 'quest', profileId: 1, playlistId: 2, localId: 'p', pieces: [{ pieceId: 4, songId: 'a' }] }, { device: 'quest', profileId: 2, playlistId: 3, localId: 'p', pieces: [{ pieceId: 4, songId: 'a' }] }], managedMemberships: [{ collectionId: 'p', songId: 'a' }] };
  assert.deepEqual(planPlaylistSync(db(lists, [{ collectionId: 'p', songId: 'a' }], sync), { ...scope, localId: 'p', remoteIds: [], choices: [] }).removed, []);
});
