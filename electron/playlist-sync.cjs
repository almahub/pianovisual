const NEW_PLAYLIST = '__create__';

function planPlaylistSync(db, { device, profileId, playlistId, playlistName, localId, remoteIds, choices }) {
  if (typeof device !== 'string' || !device || device.length > 200 || !Number.isSafeInteger(profileId) || profileId < 1 || !Number.isSafeInteger(playlistId) || playlistId < 1 || typeof playlistName !== 'string' || !playlistName.trim() || playlistName.length > 120 || typeof localId !== 'string' || !Array.isArray(remoteIds) || !Array.isArray(choices) || remoteIds.length > 5000 || choices.length > 5000) throw new Error('Dati playlist non validi');
  if (remoteIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(remoteIds).size !== remoteIds.length) throw new Error('Brani Quest non validi');
  const stored = db.questPlaylistSync || {};
  if (stored.version && stored.version !== 1) throw new Error('Versione sincronizzazione playlist non supportata');
  const all = Array.isArray(stored.playlists) ? stored.playlists : [];
  const previous = all.find((list) => list.device === device && list.profileId === profileId && list.playlistId === playlistId);
  const lists = db.collections || [];
  const oldExists = previous && lists.some((list) => list.id === previous.localId && list.type === 'playlist' && !list.smartRule);
  if (oldExists && previous.localId !== localId) throw new Error('Playlist gia collegata a una playlist locale diversa');
  if (localId === NEW_PLAYLIST) {
    if (lists.some((list) => list.type === 'playlist' && !list.smartRule && String(list.name || '').trim().toLowerCase() === playlistName.trim().toLowerCase())) throw new Error('Esiste gia una playlist locale con questo nome: selezionala esplicitamente');
  } else if (!lists.some((list) => list.id === localId && list.type === 'playlist' && !list.smartRule)) throw new Error('Playlist locale non disponibile');
  const remoteSet = new Set(remoteIds), validSongs = new Set((db.songs || []).map((song) => song.id)), choiceMap = new Map();
  for (const choice of choices) {
    if (!remoteSet.has(choice.pieceId) || !validSongs.has(choice.songId) || choiceMap.has(choice.pieceId)) throw new Error('Collegamenti brani non validi');
    choiceMap.set(choice.pieceId, choice.songId);
  }
  const pieces = [];
  for (const pieceId of remoteIds) {
    const old = previous?.pieces?.find((item) => item.pieceId === pieceId);
    const songId = choiceMap.get(pieceId) || (old && validSongs.has(old.songId) ? old.songId : '');
    if (songId) pieces.push({ pieceId, songId });
  }
  const mapping = { device, profileId, playlistId, localId, pieces };
  const otherLists = all.filter((item) => !(item.device === device && item.profileId === profileId && item.playlistId === playlistId));
  const playlists = [...otherLists, mapping];
  const managed = (Array.isArray(stored.managedMemberships) ? stored.managedMemberships : []).map((item) => ({ ...item }));
  const members = new Set((db.songCollection || []).filter((item) => item.collectionId === localId).map((item) => item.songId));
  const added = [];
  for (const piece of pieces) if (!members.has(piece.songId)) {
    members.add(piece.songId); added.push(piece.songId); managed.push({ collectionId: localId, songId: piece.songId });
  }
  const previouslyLinked = new Set(previous?.localId === localId ? (previous.pieces || []).map((item) => item.songId) : []);
  const stillLinked = new Set(playlists.filter((item) => item.localId === localId).flatMap((item) => (item.pieces || []).map((piece) => piece.songId)));
  const removed = [];
  const keptManaged = managed.filter((item) => {
    if (item.collectionId === localId && previouslyLinked.has(item.songId) && !stillLinked.has(item.songId)) {
      if (members.delete(item.songId)) removed.push(item.songId);
      return false;
    }
    return true;
  });
  return { create: localId === NEW_PLAYLIST, name: playlistName.trim(), localId, added, removed, playlists, managedMemberships: keptManaged };
}

module.exports = { planPlaylistSync, NEW_PLAYLIST };
