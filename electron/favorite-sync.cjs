function planFavoriteSync(db, { device, profileId, remoteIds, choices }) {
  if (typeof device !== 'string' || !device || device.length > 200 || !Number.isSafeInteger(profileId) || profileId < 1 || !Array.isArray(remoteIds) || !Array.isArray(choices) || remoteIds.length > 5000 || choices.length > 5000) throw new Error('Dati sincronizzazione non validi');
  if (remoteIds.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(remoteIds).size !== remoteIds.length) throw new Error('Preferiti Quest non validi');
  const remoteSet = new Set(remoteIds), validSongs = new Set((db.songs || []).map((song) => song.id));
  const choiceMap = new Map();
  for (const choice of choices) {
    if (!remoteSet.has(choice.pieceId) || !validSongs.has(choice.songId) || choiceMap.has(choice.pieceId)) throw new Error('Collegamenti selezionati non validi');
    choiceMap.set(choice.pieceId, choice.songId);
  }
  const stored = db.questFavoriteSync || {};
  if (stored.version && stored.version !== 1) throw new Error('Versione sincronizzazione non supportata');
  const previous = Array.isArray(stored.bindings) ? stored.bindings : [];
  const managed = new Set(Array.isArray(stored.managedSongIds) ? stored.managedSongIds : []);
  const favoriteIds = new Set((db.songCollection || []).filter((entry) => entry.collectionId === 'col-favorites').map((entry) => entry.songId));
  const bindings = previous.filter((entry) => entry.device !== device || entry.profileId !== profileId);
  for (const id of remoteIds) {
    const old = previous.find((entry) => entry.device === device && entry.profileId === profileId && entry.pieceId === id);
    const songId = choiceMap.get(id) || (old && validSongs.has(old.songId) ? old.songId : '');
    if (songId) bindings.push({ device, profileId, pieceId: id, songId });
  }
  const linked = new Set(bindings.map((entry) => entry.songId));
  const previouslyLinkedHere = new Set(previous.filter((entry) => entry.device === device && entry.profileId === profileId).map((entry) => entry.songId));
  const added = [];
  for (const entry of bindings) {
    if (entry.device === device && entry.profileId === profileId && !favoriteIds.has(entry.songId)) {
      favoriteIds.add(entry.songId); managed.add(entry.songId); added.push(entry.songId);
    }
  }
  const removed = [];
  for (const songId of managed) {
    if (previouslyLinkedHere.has(songId) && !linked.has(songId)) {
      if (favoriteIds.delete(songId)) removed.push(songId);
      managed.delete(songId);
    }
  }
  return { added, removed, bindings, managedSongIds: [...managed], favoriteIds: [...favoriteIds] };
}

module.exports = { planFavoriteSync };
