import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js/dist/sql-asm.js');
const { readQuestCollections, compareQuestCollections } = require('../electron/quest-comparison.cjs');

test('reads profiles, imported songs and catalog favorites without changing databases', async () => {
  const SQL = await initSqlJs();
  const user = new SQL.Database(), catalog = new SQL.Database();
  user.run(`CREATE TABLE Profile(profileId INTEGER, profileName TEXT);
    CREATE TABLE Piece(pieceId INTEGER, pieceName TEXT, pieceComposer TEXT, pieceJsonFilename TEXT);
    CREATE TABLE FavoriteSong(profileId INTEGER, pieceId INTEGER);
    CREATE TABLE UserPlaylist(userPlaylistId INTEGER, profileId INTEGER, playlistName TEXT);
    CREATE TABLE UserPlaylistPiece(userPlaylistPieceId INTEGER, userPlaylistId INTEGER, pieceId INTEGER, sortOrder INTEGER);
    INSERT INTO Profile VALUES(1,'Profile 1'); INSERT INTO FavoriteSong VALUES(1,42);
    INSERT INTO Piece VALUES(500,'Example Song','Example Artist','selected.json');
    INSERT INTO UserPlaylist VALUES(7,1,'Example Playlist'); INSERT INTO UserPlaylistPiece VALUES(1,7,500,0);`);
  catalog.run(`CREATE TABLE Piece(pieceId INTEGER, pieceName TEXT, pieceComposer TEXT, pieceJsonFilename TEXT);
    INSERT INTO Piece VALUES(42,'Catalog Song','Catalog Artist','remote.json');`);
  const userBytes = user.export(), staticBytes = catalog.export();
  const result = await readQuestCollections(userBytes, staticBytes);
  assert.equal(result.favorites[0].origin, 'catalog');
  assert.equal(result.favorites[0].title, 'Catalog Song');
  assert.equal(result.playlists[0].songs[0].origin, 'imported');
  assert.equal(result.playlists[0].songs[0].fileName, 'selected.json');
  user.close(); catalog.close();
});

test('distinguishes identical content, possible title matches, missing songs and ambiguous versions', () => {
  const piece = { pieceId: 1, title: 'Example Song', artist: 'Example Artist', fileName: 'selected.json', origin: 'imported' };
  const local = [{ id: '1', title: 'Artist - Example Song', artist: 'Example Artist', jsonPath: '/library/json/a.json' }];
  const db = { songCollection: [{ songId: '1', collectionId: 'col-favorites' }], collections: [] };
  const compare = (songs, hashes, remoteHash = 'abc') => compareQuestCollections({ favorites: [piece], playlists: [] }, songs, new Map([['selected.json', remoteHash]]), new Map(hashes), db).favorites[0];
  assert.equal(compare(local, [['/library/json/a.json', 'abc']]).match, 'identical');
  assert.equal(compare(local, []).match, 'possible');
  assert.equal(compare([], []).match, 'missing');
  assert.equal(compare([...local, { ...local[0], id: '2' }], []).match, 'ambiguous');
  assert.equal(compare(local, []).candidates[0].favorite, true);
});

test('catalog filename cannot be claimed identical to an imported JSON by hash', () => {
  const piece = { title: 'Song', artist: 'Artist', fileName: 'same.json', origin: 'catalog' };
  const local = [{ id: '1', title: 'Song', artist: 'Artist', jsonPath: '/library/json/same.json' }];
  const result = compareQuestCollections({ favorites: [piece], playlists: [] }, local, new Map([['same.json', 'x']]), new Map([['/library/json/same.json', 'x']]), {});
  assert.equal(result.favorites[0].match, 'possible');
});
