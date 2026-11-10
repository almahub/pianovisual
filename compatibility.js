export function inspectPianoVisionJson(data) {
  const issues = [];
  const warning = (message) => issues.push(message);
  if (!data || typeof data !== "object" || Array.isArray(data)) return { issues: ["Il JSON non contiene un oggetto valido."], measureCount: 0, trackCount: 0 };
  const tempos = Array.isArray(data.tempos) ? data.tempos : [];
  const signatures = Array.isArray(data.timeSignatures) ? data.timeSignatures : [];
  const measures = Array.isArray(data.measures) ? data.measures : [];
  const tracks = Array.isArray(data.supportingTracks) ? data.supportingTracks : [];
  if (!tempos.length || tempos.some((tempo) => !Number.isFinite(Number(tempo?.bpm)) || Number(tempo.bpm) <= 0)) warning("Tempi mancanti o non validi.");
  if (!signatures.length) warning("Indicazioni di tempo mancanti.");
  if (!Number.isFinite(Number(data.resolution)) || Number(data.resolution) <= 0) warning("Risoluzione MIDI mancante o non valida.");
  if (!tracks.some((track) => Array.isArray(track?.notes) && track.notes.length) &&
      !(Array.isArray(data.original?.tracks) && data.original.tracks.some((track) => Array.isArray(track?.notes) && track.notes.length)) &&
      !["right", "left"].some((hand) => Array.isArray(data.tracksV2?.[hand]) && data.tracksV2[hand].some((measure) => Array.isArray(measure?.notes) && measure.notes.length))) warning("Nessuna nota riconosciuta nelle tracce.");
  if (!measures.length) warning("Nessuna misura presente.");
  const hands = data.tracksV2;
  if (!hands || !Array.isArray(hands.right) || !Array.isArray(hands.left)) warning("Tracce per mano destra e sinistra mancanti.");
  else if (measures.length && (hands.right.length !== measures.length || hands.left.length !== measures.length)) warning("Il numero di misure delle mani differisce dalle misure del brano; verificare nel Quest.");
  const maxEnd = tracks.reduce((max, track) => (Array.isArray(track?.notes) ? track.notes : []).reduce((end, note) => {
    const start = Number(note.time), duration = Number(note.duration);
    return Number.isFinite(start) && Number.isFinite(duration) ? Math.max(end, start + duration) : end;
  }, max), 0);
  if (!Number.isFinite(Number(data.song_length)) || Number(data.song_length) < 0) warning("Durata del brano non valida.");
  else if (maxEnd > Number(data.song_length) + 0.05) warning("La durata indicata termina prima dell'ultima nota di accompagnamento.");
  return { issues, measureCount: measures.length, trackCount: tracks.length };
}
