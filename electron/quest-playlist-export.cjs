const initSqlJs = require('sql.js/dist/sql-asm.js');

async function buildQuestPlaylistDatabase(bytes, { profileId, destinationId, playlistName, pieceIds }) {
  if (!Number.isSafeInteger(profileId) || profileId < 1 || !Number.isSafeInteger(destinationId) || destinationId < 0 || typeof playlistName !== 'string' || !playlistName.trim() || playlistName.length > 120 || !Array.isArray(pieceIds) || pieceIds.length > 5000 || pieceIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(pieceIds).size !== pieceIds.length) throw new Error('Selezione playlist non valida');
  const SQL = await initSqlJs(), db = new SQL.Database(Uint8Array.from(bytes));
  const one = (sql, values = []) => { const stmt = db.prepare(sql); try { stmt.bind(values); return stmt.step() ? stmt.getAsObject() : null; } finally { stmt.free(); } };
  try {
    if (Object.values(one('PRAGMA integrity_check') || {})[0] !== 'ok') throw new Error('Database Quest non integro');
    if (!one('SELECT profileId FROM Profile WHERE profileId=?', [profileId])) throw new Error('Profilo Quest non trovato');
    for (const id of pieceIds) if (!one('SELECT pieceId FROM Piece WHERE pieceId=?', [id])) throw new Error(`Brano Quest ${id} non piu disponibile`);
    db.run('BEGIN IMMEDIATE');
    let target = destinationId;
    if (!target) {
      if (one('SELECT userPlaylistId FROM UserPlaylist WHERE profileId=? AND lower(playlistName)=lower(?)', [profileId, playlistName.trim()])) throw new Error('Playlist omonima esistente: selezionala esplicitamente');
      db.run('INSERT INTO UserPlaylist(profileId, playlistName) VALUES(?,?)', [profileId, playlistName.trim()]);
      target = Number(Object.values(one('SELECT last_insert_rowid()'))[0]);
    } else if (!one('SELECT userPlaylistId FROM UserPlaylist WHERE userPlaylistId=? AND profileId=?', [target, profileId])) throw new Error('Playlist Quest di destinazione non trovata');
    let order = Number(one('SELECT COALESCE(MAX(sortOrder),-1) AS lastOrder FROM UserPlaylistPiece WHERE userPlaylistId=?', [target]).lastOrder) + 1;
    let added = 0;
    for (const id of pieceIds) {
      if (one('SELECT userPlaylistPieceId FROM UserPlaylistPiece WHERE userPlaylistId=? AND pieceId=?', [target, id])) continue;
      db.run('INSERT INTO UserPlaylistPiece(userPlaylistId,pieceId,sortOrder) VALUES(?,?,?)', [target, id, order++]);
      added++;
    }
    if (added) db.run('UPDATE UserPlaylist SET updatedTimestamp=CURRENT_TIMESTAMP WHERE userPlaylistId=?', [target]);
    db.run('COMMIT');
    if (Object.values(one('PRAGMA integrity_check') || {})[0] !== 'ok') throw new Error('Database modificato non integro');
    const result = Buffer.from(db.export());
    if (result.length < bytes.length) throw new Error('Dimensione database ridotta: scrittura non consentita');
    return { bytes: result, playlistId: target, added, created: !destinationId };
  } finally { db.close(); }
}

module.exports = { buildQuestPlaylistDatabase };
