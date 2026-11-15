const initSqlJs = require('sql.js/dist/sql-asm.js');

function rows(db, sql) {
  const statement = db.prepare(sql);
  try { const result = []; while (statement.step()) result.push(statement.getAsObject()); return result; }
  finally { statement.free(); }
}

async function readQuestCollections(userBytes, staticBytes) {
  const SQL = await initSqlJs();
  let user, catalog;
  try {
    user = new SQL.Database(userBytes);
    catalog = new SQL.Database(staticBytes);
    for (const database of [user, catalog]) {
      const check = rows(database, 'PRAGMA quick_check');
      if (Object.values(check[0] || {})[0] !== 'ok') throw new Error('Database Quest non integro');
    }
    const profiles = new Map(rows(user, 'SELECT profileId, profileName FROM Profile').map((p) => [p.profileId, p.profileName]));
    const own = new Map(rows(user, 'SELECT pieceId, pieceName, pieceComposer, pieceJsonFilename FROM Piece').map((p) => [p.pieceId, p]));
    const builtin = new Map(rows(catalog, 'SELECT pieceId, pieceName, pieceComposer, pieceJsonFilename FROM Piece').map((p) => [p.pieceId, p]));
    function piece(id) {
      if (own.has(id) && builtin.has(id)) return { pieceId: id, title: '', artist: '', fileName: '', origin: 'unknown' };
      const found = own.get(id) || builtin.get(id);
      return { pieceId: id, title: String(found?.pieceName || ''), artist: String(found?.pieceComposer || ''), fileName: String(found?.pieceJsonFilename || ''), origin: own.has(id) ? 'imported' : builtin.has(id) ? 'catalog' : 'unknown' };
    }
    const favorites = rows(user, 'SELECT profileId, pieceId FROM FavoriteSong').map((entry) => ({ profileId: entry.profileId, profileName: profiles.get(entry.profileId) || `Profilo ${entry.profileId}`, ...piece(entry.pieceId) }));
    const playlists = rows(user, 'SELECT userPlaylistId, profileId, playlistName FROM UserPlaylist').map((entry) => ({ id: entry.userPlaylistId, profileId: entry.profileId, profileName: profiles.get(entry.profileId) || `Profilo ${entry.profileId}`, name: String(entry.playlistName || ''), songs: [] }));
    const listById = new Map(playlists.map((list) => [list.id, list]));
    for (const entry of rows(user, 'SELECT userPlaylistId, pieceId, sortOrder FROM UserPlaylistPiece ORDER BY userPlaylistId, sortOrder, userPlaylistPieceId')) {
      listById.get(entry.userPlaylistId)?.songs.push(piece(entry.pieceId));
    }
    const importedPieces = [...own.values()].filter((entry) => !builtin.has(entry.pieceId)).map((entry) => piece(entry.pieceId));
    return { profiles: [...profiles].map(([id, name]) => ({ id, name })), favorites, playlists, importedPieces };
  } finally { user?.close(); catalog?.close(); }
}

function key(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function compareQuestCollections(remote, localSongs, remoteHashes, localHashes, localDb, versionHashes = new Map()) {
  function match(piece) {
    const hash = piece.origin === 'imported' ? remoteHashes.get(piece.fileName) : '';
    const exact = hash ? localSongs.filter((song) => localHashes.get(song.jsonPath) === hash || versionHashes.get(song.id) === hash) : [];
    if (exact.length) return { ...piece, match: exact.length === 1 ? 'identical' : 'ambiguous', candidates: exact.map(candidate) };
    const title = key(piece.title), artist = key(piece.artist);
    const possible = title && artist ? localSongs.filter((song) => {
      const localTitle = key(song.title), localArtist = key(song.artist || song.composer);
      const surname = artist.split(' ').at(-1);
      const stripped = surname && localTitle.startsWith(`${surname} `) ? localTitle.slice(surname.length + 1) : localTitle;
      return localArtist === artist && (localTitle === title || stripped === title);
    }) : [];
    return { ...piece, match: possible.length === 1 ? 'possible' : possible.length > 1 ? 'ambiguous' : 'missing', candidates: possible.map(candidate) };
  }
  function candidate(song) {
    const favorite = (localDb.songCollection || []).some((entry) => entry.songId === song.id && entry.collectionId === 'col-favorites');
    const memberships = new Set((localDb.songCollection || []).filter((entry) => entry.songId === song.id).map((entry) => entry.collectionId));
    const playlists = (localDb.collections || []).filter((item) => item.type === 'playlist' && !item.smartRule && memberships.has(item.id)).map((item) => item.name);
    return { id: song.id, title: song.title || '', artist: song.artist || '', variantType: song.variantType || '', favorite, playlists };
  }
  return {
    profiles: remote.profiles || [],
    favorites: remote.favorites.map(match),
    playlists: remote.playlists.map((list) => ({ ...list, localPlaylists: (localDb.collections || []).filter((item) => item.type === 'playlist' && !item.smartRule && key(item.name) === key(list.name)).map((item) => ({ id: item.id, name: item.name })), songs: list.songs.map(match) })),
  };
}

module.exports = { readQuestCollections, compareQuestCollections };
