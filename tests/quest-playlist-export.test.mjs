import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const initSql = require('sql.js/dist/sql-asm.js');
const { buildQuestPlaylistDatabase } = require('../electron/quest-playlist-export.cjs');

async function fixture() {
  const SQL = await initSql();
  const db = new SQL.Database();
  db.run(`CREATE TABLE Profile(profileId INTEGER PRIMARY KEY, profileName TEXT);
    CREATE TABLE Piece(pieceId INTEGER PRIMARY KEY, pieceName TEXT);
    CREATE TABLE UserPlaylist(userPlaylistId INTEGER PRIMARY KEY AUTOINCREMENT, profileId INTEGER NOT NULL, playlistName TEXT NOT NULL, createdTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP, updatedTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE UNIQUE INDEX playlist_unique ON UserPlaylist(profileId, playlistName);
    CREATE TABLE UserPlaylistPiece(userPlaylistPieceId INTEGER PRIMARY KEY AUTOINCREMENT, userPlaylistId INTEGER NOT NULL, pieceId INTEGER NOT NULL, sortOrder INTEGER DEFAULT 0, addedTimestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE UNIQUE INDEX piece_unique ON UserPlaylistPiece(userPlaylistId,pieceId);
    INSERT INTO Profile VALUES(1,'User'); INSERT INTO Piece VALUES(500003,'Ultimo Amore');
    INSERT INTO UserPlaylist(profileId,playlistName) VALUES(1,'Existing'); INSERT INTO UserPlaylistPiece(userPlaylistId,pieceId,sortOrder) VALUES(1,500003,0);`);
  const bytes = Buffer.from(db.export()); db.close(); return { SQL, bytes };
}

test('creates a Quest playlist in a copy without modifying original data', async () => {
  const { SQL, bytes } = await fixture(); const before = Buffer.from(bytes);
  const result = await buildQuestPlaylistDatabase(bytes, { profileId: 1, destinationId: 0, playlistName: 'Local', pieceIds: [500003] });
  assert.deepEqual(bytes, before);
  assert.equal(result.created, true); assert.equal(result.added, 1);
  const db = new SQL.Database(result.bytes);
  assert.equal(db.exec('SELECT COUNT(*) FROM UserPlaylist')[0].values[0][0], 2);
  assert.equal(db.exec('SELECT COUNT(*) FROM UserPlaylistPiece')[0].values[0][0], 2);
  assert.equal(db.exec('PRAGMA integrity_check')[0].values[0][0], 'ok'); db.close();
});

test('is additive, rejects unknown pieces and never replaces an existing name', async () => {
  const { bytes } = await fixture();
  const same = await buildQuestPlaylistDatabase(bytes, { profileId: 1, destinationId: 1, playlistName: 'Existing', pieceIds: [500003] });
  assert.equal(same.added, 0);
  await assert.rejects(buildQuestPlaylistDatabase(bytes, { profileId: 1, destinationId: 0, playlistName: 'existing', pieceIds: [] }), /omonima/);
  await assert.rejects(buildQuestPlaylistDatabase(bytes, { profileId: 1, destinationId: 1, playlistName: 'Existing', pieceIds: [999] }), /non piu disponibile/);
});
