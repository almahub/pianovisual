export function inspectPianoVisionJson(data) {
  const issues = [];
  const errors = [], warnings = [];
  const error = (message) => { errors.push(message); issues.push(message); };
  const warning = (message) => { warnings.push(message); issues.push(message); };
  if (!data || typeof data !== "object" || Array.isArray(data)) return { issues: ["Il JSON non contiene un oggetto valido."], errors: ["Il JSON non contiene un oggetto valido."], warnings, measureCount: 0, trackCount: 0 };
  const tempos = Array.isArray(data.tempos) ? data.tempos : [];
  const signatures = Array.isArray(data.timeSignatures) ? data.timeSignatures : [];
  const measures = Array.isArray(data.measures) ? data.measures : [];
  const tracks = Array.isArray(data.supportingTracks) ? data.supportingTracks : [];
  if (!tempos.length || tempos.some((tempo) => !Number.isFinite(Number(tempo?.bpm)) || Number(tempo.bpm) <= 0)) error("Tempi mancanti o non validi.");
  if (!signatures.length) error("Indicazioni di tempo mancanti.");
  else if (signatures.some((signature) => !Array.isArray(signature?.timeSignature) || signature.timeSignature.length !== 2 || signature.timeSignature.some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0))) warning("Alcune indicazioni di tempo sono incomplete o non valide.");
  if (!Number.isFinite(Number(data.resolution)) || Number(data.resolution) <= 0) warning("Risoluzione MIDI mancante o non valida.");
  if (!tracks.some((track) => Array.isArray(track?.notes) && track.notes.length) &&
      !(Array.isArray(data.original?.tracks) && data.original.tracks.some((track) => Array.isArray(track?.notes) && track.notes.length)) &&
      !["right", "left"].some((hand) => Array.isArray(data.tracksV2?.[hand]) && data.tracksV2[hand].some((measure) => Array.isArray(measure?.notes) && measure.notes.length))) error("Nessuna nota riconosciuta nelle tracce.");
  if (!measures.length) warning("Nessuna misura presente.");
  const hands = data.tracksV2;
  if (!hands || !Array.isArray(hands.right) || !Array.isArray(hands.left)) warning("Tracce per mano destra e sinistra mancanti.");
  else if (measures.length && (hands.right.length !== measures.length || hands.left.length !== measures.length)) warning("Il numero di misure delle mani differisce dalle misure del brano; verificare nel Quest.");
  const supportingNotes = tracks.flatMap((track) => Array.isArray(track?.notes) ? track.notes : []);
  const originalNotes = (Array.isArray(data.original?.tracks) ? data.original.tracks : []).flatMap((track) => Array.isArray(track?.notes) ? track.notes : []);
  const handNotes = ["right", "left"].flatMap((hand) => (Array.isArray(hands?.[hand]) ? hands[hand] : []).flatMap((measure) => Array.isArray(measure?.notes) ? measure.notes.map((note) => note && ({ midi: note.note, time: note.start, duration: note.duration })) : []));
  const notes = supportingNotes.length ? supportingNotes : originalNotes.length ? originalNotes : handNotes;
  const maxEnd = notes.reduce((end, note) => {
    const start = Number(note?.time), duration = Number(note?.duration);
    return Number.isFinite(start) && Number.isFinite(duration) ? Math.max(end, start + duration) : end;
  }, 0);
  if (notes.some((note) => !note || !Number.isInteger(note.midi) || note.midi < 0 || note.midi > 127)) error("Almeno una nota MIDI non e valida.");
  if (notes.some((note) => note && Number.isInteger(note.midi) && (note.midi < 21 || note.midi > 108))) warning("Alcune note sono fuori dalla tastiera standard a 88 tasti.");
  if (notes.some((note) => !note || !Number.isFinite(note.time) || note.time < 0 || !Number.isFinite(note.duration) || note.duration <= 0)) warning("Alcune note hanno tempi o durate da verificare.");
  if (!Number.isFinite(Number(data.song_length)) || Number(data.song_length) < 0) warning("Durata del brano non valida.");
  else if (maxEnd > Number(data.song_length) + 0.05) warning("La durata indicata termina prima dell'ultima nota di accompagnamento.");
  return { issues, errors, warnings, measureCount: measures.length, trackCount: tracks.length, noteCount: notes.length, tempoCount: tempos.length };
}
