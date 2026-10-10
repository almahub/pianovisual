import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "index.html");

test("ui critical controls exist for key workflows", async () => {
  const html = await fs.readFile(indexPath, "utf8");
  const requiredIds = [
    "appVersionBadge",
    "updateStatusBtn",
    "openLibraryFolderBtn",
    "syncLibraryBtn",
    "newPlaylistBtn",
    "playlistCreateBtn",
    "saveBatchBtn",
    "downloadSelectedBtn",
    "deleteSelectedBtn",
    "convertSelectedPianoBtn",
    "exportSelectedFilteredBtn",
    "libraryToolbar",
    "pianoLabPanel",
    "pianoEngineStatus",
    "createPianoReductionBtn",
    "remoteCatalogPanel",
    "remoteCatalogSearch",
    "remoteConvertBtn",
    "remoteImportBtn",
    "importJsonFolderBtn",
    "importJsonFolderPanelBtn",
    "questStatusBtn",
    "questPullBtn",
    "questPushBtn",
    "exportVisualizerSelectionBtn",
    "exportVisualizerToPianoBtn",
    "downloadImportReportBtn",
    "archiveConflictPolicySelect",
    "archiveDedupPolicySelect",
    "visualizerLegend",
  ];
  for (const id of requiredIds) {
    assert.equal(html.includes(`id=\"${id}\"`), true, `missing #${id}`);
  }
});

test("secondary UI controls are grouped into collapsible sections", async () => {
  const html = await fs.readFile(indexPath, "utf8");
  assert.equal((html.match(/class="sidebar-block sidebar-group"/g) || []).length, 4);
  assert.equal(html.includes('class="toolbar-menu"'), true);
  assert.equal(html.includes('class="detail-more-actions"'), true);
});

test("desktop bridge exposes safe export, folder import and Quest sync actions", async () => {
  const preload = await fs.readFile(path.join(root, "electron", "preload.cjs"), "utf8");
  for (const method of ["saveJsonExport", "selectJsonFolder", "questStatus", "questPullJson", "questPreviewPush", "questPushJson"]) {
    assert.equal(preload.includes(`${method}:`), true, `missing desktop bridge method ${method}`);
  }
});

test("playlist actions and detail layout remain available", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const css = await fs.readFile(path.join(root, "style.css"), "utf8");
  const html = await fs.readFile(indexPath, "utf8");
  assert.match(app, /data-rename-playlist-id=/);
  assert.match(app, /data-delete-playlist-id=/);
  assert.match(app, /data-rename-playlist-form=/);
  assert.doesNotMatch(app, /prompt\(/);
  assert.match(html, /id="playlistCreateForm"/);
  assert.match(app, /I brani resteranno nella libreria/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) clamp\(420px, 36%, 560px\)/);
  assert.match(css, /#visualizerCanvas\s*\{[^}]*max-width: 100%/);
  assert.match(css, /\.detail-panel\s*\{[^}]*position: sticky/);
  assert.match(app, /activeInstrumentsForSong\(song, availableInstruments\)/);
});

test("visualizer instrument colors can be changed, reset and persisted per song", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.match(app, /data-instrument-color=/);
  assert.match(app, /data-instrument-color-reset=/);
  assert.match(app, /pv_visualizer_colors_v1/);
  assert.match(app, /colorsBySong\[song\.id\]\[instrument\] = input\.value/);
  assert.match(app, /activeColorByMidi\.set\(n\.midi, colorFromInstrument\(n\.instrument, false, state\.player\.loadedSongId\)\)/);
  assert.match(app, /ctx\.fillStyle = colorFromInstrument\(n\.instrument, past, state\.player\.loadedSongId\)/);
});

test("desktop JSON export refuses to write inside the live library JSON folder", async () => {
  const main = await fs.readFile(path.join(root, "electron", "main.cjs"), "utf8");
  assert.equal(main.includes('ipcMain.handle("library:save-json-export"'), true);
  assert.equal(main.includes('path.relative(libraryJsonDir, targetPath)'), true);
  assert.equal(main.includes('diversa dalle cartelle library\\\\json e library\\\\jsonpiano'), true);
});

test("visualizer export rebuilds PianoVision tracks from selected instruments", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("clone.tracksV2 = buildTracksV2("), true);
  assert.equal(app.includes("clone.song_length = Math.max(0, filteredDuration)"), true);
  assert.equal(app.includes("filteredByInstruments"), true);
  assert.equal(app.includes("async function exportVisualizerSelectionToPiano()"), true);
  assert.equal(app.includes("sourceJson: filtered"), true);
  assert.equal(app.includes('el.exportVisualizerToPianoBtn.addEventListener("click", exportVisualizerSelectionToPiano)'), true);
  assert.equal(app.includes('el.exportSelectedFilteredBtn.addEventListener("click", exportSelectedFilteredJson)'), true);
  assert.equal(app.includes('const fileName = `${sanitizeFileName(song.title || song.id || "song")}.json`'), true);
  assert.equal(app.includes('`${base}-filtered.json`'), false);
});

test("visualizer reads JSON track names and filters only selected instruments", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const filterSource = app.slice(app.indexOf("function trackInstrumentNameFromJson("), app.indexOf("async function exportFilteredSongJson()"));
  const tracksSource = app.slice(app.indexOf("function extractPianoReductionTracks("), app.indexOf("function buildPlayableNotesFromTracks("));
  const build = new Function("repairMojibake", "instrumentsForSong", "clamp01", "buildTracksV2",
    `${filterSource}\n${tracksSource}\nreturn { instrumentNamesFromJson, filterJsonByActiveInstruments };`);
  const { instrumentNamesFromJson, filterJsonByActiveInstruments } = build(
    (value) => value,
    (song) => song.instruments || [],
    (value) => value,
    () => ({ right: [], left: [] }),
  );
  const song = { title: "Brano", instruments: [] };
  const json = {
    name: "Brano",
    original: { tracks: [
      { instrument: { name: "Piano" }, notes: [{ midi: 60, time: 0, duration: 1 }] },
      { instrument: { name: "Violino" }, notes: [{ midi: 67, time: 1, duration: 1 }] },
    ] },
    supportingTracks: [{ notes: [{ midi: 60, time: 0, duration: 1 }] }, { notes: [{ midi: 67, time: 1, duration: 1 }] }],
  };
  assert.deepEqual(instrumentNamesFromJson(json, song), ["Piano", "Violino"]);
  const filtered = filterJsonByActiveInstruments(json, song, ["Piano"]);
  assert.equal(filtered.name, "Brano");
  assert.equal(filtered.original.tracks.length, 1);
  assert.equal(filtered.original.tracks[0].instrument.name, "Piano");
  assert.equal(filtered.supportingTracks.length, 1);
  assert.equal(json.original.tracks.length, 2);

  const supportingOnlyNotes = structuredClone(json);
  for (const track of supportingOnlyNotes.original.tracks) track.notes = [];
  assert.deepEqual(instrumentNamesFromJson(supportingOnlyNotes, song), ["Piano", "Violino"]);
  const filteredSupporting = filterJsonByActiveInstruments(supportingOnlyNotes, song, ["Violino"]);
  assert.equal(filteredSupporting.supportingTracks.length, 1);
  assert.equal(filteredSupporting.supportingTracks[0].notes[0].midi, 67);

  const handsOnly = { tracksV2: { right: [{ notes: [{ note: 60, start: 0, duration: 1 }] }], left: [{ notes: [{ note: 48, start: 0, duration: 1 }] }] } };
  assert.deepEqual(instrumentNamesFromJson(handsOnly, song), ["Mano destra", "Mano sinistra"]);
  const filteredHands = filterJsonByActiveInstruments(handsOnly, song, ["Mano destra"]);
  assert.equal(filteredHands.tracksV2.right[0].notes.length, 1);
  assert.equal(filteredHands.tracksV2.left[0].notes.length, 0);
});

test("batch filtered export keeps song titles and separates duplicate filenames", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("async function exportSelectedFilteredJson()"), app.indexOf("async function deleteSelectedSongs()"));
  const entries = new Map();
  let downloaded;
  class FakeZip {
    folder() { return this; }
    file(name, content) { entries.set(name, JSON.parse(content)); }
    async generateAsync() { return entries; }
  }
  const songs = [
    { id: "song-a", title: "Stesso Titolo", jsonPath: "/a.json", activeInstruments: ["Piano"] },
    { id: "song-b", title: "Stesso Titolo", jsonPath: "/b.json", activeInstruments: ["Violino"] },
  ];
  const run = new Function("state", "el", "toast", "showLoading", "JSZip", "fetch", "instrumentNamesFromJson",
    "activeInstrumentsForSong", "filterJsonByActiveInstruments", "sanitizeFileName", "downloadBlob", "updateSelectionInfo",
    `${source}\nreturn exportSelectedFilteredJson;`)(
    { db: { songs }, selectedSongIds: new Set(songs.map((song) => song.id)) },
    { exportSelectedFilteredBtn: { disabled: false } },
    () => {}, () => {}, FakeZip,
    async () => ({ ok: true, json: async () => ({ name: "Stesso Titolo" }) }),
    () => ["Piano", "Violino"],
    (song) => song.activeInstruments,
    (json, song, active) => ({ ...json, tracks: active }),
    (name) => name,
    (blob, name) => { downloaded = { blob, name }; },
    () => {},
  );
  await run();
  assert.equal(downloaded.name, "pianovisual-json-selezionati.zip");
  assert.deepEqual([...entries.keys()], ["song-a/Stesso Titolo.json", "song-b/Stesso Titolo.json"]);
  assert.deepEqual(entries.get("song-a/Stesso Titolo.json").tracks, ["Piano"]);
  assert.deepEqual(entries.get("song-b/Stesso Titolo.json").tracks, ["Violino"]);
});

test("library BPM values are formatted with two decimals", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("function formatTableBpm(value)"), true);
  assert.equal(app.includes("bpm.toFixed(2)"), true);
  assert.equal(app.includes("formatTableBpm(song.bpm)"), true);
});

test("instrument toggles update the loaded count and scheduled audio", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("loadedInstruments.length ? loadedInstruments : instrumentsForSong(song)"), true);
  assert.equal(app.includes("stopScheduledAudio();"), true);
  assert.equal(app.includes("if (wasPlaying && hasPlayableNotes) await playPlayer(resumeAt)"), true);
});

test("piano reductions expose melody right and chords plus bass left", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes('{ key: "right", instrument: "Voce / Melodia · mano destra" }'), true);
  assert.equal(app.includes('{ key: "left", instrument: "Accordi e basso · mano sinistra" }'), true);
  assert.equal(app.includes("return pianoHands;"), true);
  assert.equal(app.includes("sourceTrackGroup("), false);
  assert.equal(app.includes("Accompagnamento ${idx + 1}"), false);
  assert.equal(app.includes('arrangementMode === "piano_solo"'), false);
  assert.equal(app.includes("loadedSong?.reductionChords"), true);
  assert.equal(app.includes("Accordo: ${activeChord.symbol}"), true);
});

test("desktop package includes and unpacks the local piano reduction engine", async () => {
  const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.build.files.includes("skill/music-to-piano-json/**/*"), true);
  assert.equal(pkg.build.asarUnpack.includes("skill/music-to-piano-json/**/*"), true);
});

test("library selection supports queued piano reductions", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("async function createSelectedPianoReductions()"), true);
  assert.equal(app.includes("function deduplicatePianoSources(songs)"), true);
  assert.equal(app.includes("ATTENZIONE: rilevate"), true);
  assert.equal(app.includes("copie saltate"), true);
  assert.equal(app.includes('kind: "piano-reduction-batch"'), true);
  assert.equal(app.includes('el.convertSelectedPianoBtn.addEventListener("click", createSelectedPianoReductions)'), true);
});
