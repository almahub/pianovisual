import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectPianoVisionJson } from "../compatibility.js";

test("compatibility check reports missing musical data without rejecting valid partial files", () => {
  const report = inspectPianoVisionJson({ tempos: [{ bpm: 0 }], timeSignatures: [], supportingTracks: [], tracksV2: { right: [], left: [] }, measures: [], song_length: 0 });
  assert.ok(report.issues.some((issue) => issue.includes("Tempi")));
  assert.ok(report.issues.some((issue) => issue.includes("Nessuna nota")));
  assert.ok(report.issues.some((issue) => issue.includes("misura")));
  assert.doesNotThrow(() => inspectPianoVisionJson({ original: { tracks: {} }, tracksV2: { right: {}, left: [] } }));
});

test("measure end uses the tempo map including changes within a measure", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("function ticksToSeconds("), app.indexOf("function mapControlChanges("));
  const build = new Function("round", "midiToName", "clamp01", "durationType", "normalizeTempos", `${source}\nreturn { buildTracksV2 };`);
  const { buildTracksV2 } = build((value) => value, () => ({}), (value) => value, () => "quarter", () => []);
  const measures = [{ time: 0, timeSignature: [4, 4], ticksStart: 0, totalTicks: 1920 }];
  const output = buildTracksV2([], measures, 480, [{ ticks: 0, bpm: 60 }, { ticks: 960, bpm: 120 }]);
  assert.equal(output.right[0].timeEnd, 3);
  assert.equal(output.left[0].timeEnd, 3);
});

test("manual hands follow original track IDs after filtering without altering the source", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const trackSource = app.slice(app.indexOf("function ticksToSeconds("), app.indexOf("function mapControlChanges("));
  const build = new Function("round", "midiToName", "clamp01", "durationType", "normalizeTempos", `${trackSource}\nreturn buildTracksV2;`);
  const buildTracksV2 = build((v) => v, () => ({}), (v) => v, () => "quarter", () => []);
  const source = app.slice(app.indexOf("function filterJsonByActiveInstruments("), app.indexOf("function jsonWithSongMetadata("));
  const filter = new Function("buildTracksV2", `${source}\nreturn filterJsonByActiveInstruments;`)(buildTracksV2);
  const track = (midi) => ({ instrument: { name: "Piano" }, notes: [{ midi, ticks: 0, durationTicks: 480, time: 0, duration: 1, velocity: 0.7 }] });
  const tracks = [track(48), track(60), track(72)];
  const json = { original: { tracks }, supportingTracks: tracks.map((item) => ({ notes: item.notes })),
    resolution: 480, tempos: [{ ticks: 0, bpm: 120 }], measures: [{ time: 0, timeSignature: [4, 4], ticksStart: 0, totalTicks: 1920 }], song_length: 1 };
  const before = JSON.stringify(json);
  const song = { handAssignments: { right: "track:2", left: "track:0" } };
  const output = filter(json, song, ["track:0", "track:2"]);
  assert.deepEqual(output.tracksV2.right[0].notes.map((note) => note.note), [72]);
  assert.deepEqual(output.tracksV2.left[0].notes.map((note) => note.note), [48]);
  assert.equal(output.supportingTracks.length, 2);
  assert.equal(JSON.stringify(json), before);
  assert.throws(() => filter(json, song, ["track:0"]), /non e selezionata/);
});

test("validation distinguishes invalid notes from playable-range warnings", () => {
  const base = { tempos: [{ bpm: 120 }], timeSignatures: [{ ticks: 0 }], resolution: 480, song_length: 1,
    measures: [{}], tracksV2: { right: [{}], left: [{}] }, supportingTracks: [{ notes: [{ midi: 10, time: 0, duration: 1 }] }] };
  const warning = inspectPianoVisionJson(base);
  assert.equal(warning.errors.length, 0);
  assert.ok(warning.warnings.some((item) => item.includes("88 tasti")));
  base.supportingTracks[0].notes[0].midi = 200;
  assert.ok(inspectPianoVisionJson(base).errors.some((item) => item.includes("MIDI")));
});

test("one selected track splits at a configurable pitch without changing source or accompaniment", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const trackSource = app.slice(app.indexOf("function ticksToSeconds("), app.indexOf("function mapControlChanges("));
  const buildTracksV2 = new Function("round", "midiToName", "clamp01", "durationType", "normalizeTempos", `${trackSource}\nreturn buildTracksV2;`)((v) => v, () => ({}), (v) => v, () => "quarter", () => []);
  const filterSource = app.slice(app.indexOf("function filterJsonByActiveInstruments("), app.indexOf("function jsonWithSongMetadata("));
  const filter = new Function("buildTracksV2", `${filterSource}\nreturn filterJsonByActiveInstruments;`)(buildTracksV2);
  const note = (midi) => ({ midi, ticks: 0, durationTicks: 480, time: 0, duration: 1, velocity: 0.7 });
  const tracks = [{ notes: [note(72)] }, { notes: [note(59), note(60), note(65)] }, { notes: [note(45)] }];
  const json = { original: { tracks }, supportingTracks: tracks.map((track) => ({ notes: track.notes })),
    resolution: 480, tempos: [{ ticks: 0, bpm: 120 }], measures: [{ time: 0, timeSignature: [4, 4], ticksStart: 0, totalTicks: 1920 }] };
  const before = JSON.stringify(json);
  const song = { handAssignments: { right: "auto", left: "auto", splitTrack: "track:1", splitMidi: 60 } };
  const output = filter(json, song, ["track:1", "track:2"]);
  assert.deepEqual(output.tracksV2.right[0].notes.map((item) => item.note), [60, 65]);
  assert.deepEqual(output.tracksV2.left[0].notes.map((item) => item.note), [59]);
  assert.equal(output.supportingTracks.length, 2);
  song.handAssignments.splitMidi = 65;
  const changed = filter(json, song, ["track:1", "track:2"]);
  assert.deepEqual(changed.tracksV2.right[0].notes.map((item) => item.note), [65]);
  assert.deepEqual(changed.tracksV2.left[0].notes.map((item) => item.note), [59, 60]);
  assert.throws(() => filter(json, song, ["track:2"]), /non e selezionata/);
  assert.equal(JSON.stringify(json), before);
});

test("saved split version exports only enabled hands without mutating stored notes", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("function ticksToSeconds("), app.indexOf("function mapControlChanges("));
  const buildTracksV2 = new Function("round", "midiToName", "clamp01", "durationType", "normalizeTempos", `${source}\nreturn buildTracksV2;`)((v) => v, () => ({}), (v) => v, () => "quarter", () => []);
  const filterSource = app.slice(app.indexOf("function filterJsonByActiveInstruments("), app.indexOf("function jsonWithSongMetadata("));
  const filter = new Function("buildTracksV2", `${filterSource}\nreturn filterJsonByActiveInstruments;`)(buildTracksV2);
  const note = (midi) => ({ midi, ticks: 0, durationTicks: 480, time: 0, duration: 1, velocity: 0.7 });
  const tracks = [{ notes: [note(48), note(72)] }, { notes: [note(65)] }];
  const data = { original: { tracks }, supportingTracks: tracks.map((t) => ({ notes: t.notes })), resolution: 480,
    tempos: [{ ticks: 0, bpm: 120 }], measures: [{ time: 0, timeSignature: [4, 4], ticksStart: 0, totalTicks: 1920 }] };
  const before = JSON.stringify(data);
  const song = { variantType: "selected_instruments", splitTrackIndex: 0, splitMidi: 60 };
  const result = filter(data, song, ["hand:right", "track:1"]);
  assert.deepEqual(result.tracksV2.right[0].notes.map((n) => n.note), [72]);
  assert.equal(result.tracksV2.left[0].notes.length, 0);
  assert.deepEqual(result.original.tracks[0].notes.map((n) => n.midi), [72]);
  assert.deepEqual(result.supportingTracks[0].notes.map((n) => n.midi), [72]);
  assert.equal(JSON.stringify(data), before);
});
