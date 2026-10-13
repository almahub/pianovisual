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
    "fullBackupBtn",
    "restoreBackupBtn",
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
  for (const method of ["saveJsonExport", "createFullBackup", "restoreFullBackup", "selectJsonFolder", "questStatus", "questPullJson", "questPreviewPush", "questPushJson"]) {
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
  assert.match(app, /colorsBySong\[song\.id\]\[trackId\] = input\.value/);
  assert.match(app, /activeColorByMidi\.set\(n\.midi, colorFromInstrument\(n\.trackId/);
  assert.match(app, /ctx\.fillStyle = colorFromInstrument\(n\.trackId/);
});

test("same-named tracks keep independent colors and legacy colors migrate", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("function defaultInstrumentHsl("), app.indexOf("function midiToName("));
  const stored = new Map();
  const state = { selectedSongId: "song-1", player: { colorsBySong: { "song-1": { "Acoustic Grand Piano": "#123456" } } } };
  const { colorFromInstrument, migrateInstrumentColors, defaultInstrumentHsl } = new Function("state", "localStorage", "toast",
    `${source}\nreturn { colorFromInstrument, migrateInstrumentColors, defaultInstrumentHsl };`)(
    state, { setItem: (key, value) => stored.set(key, value) }, () => {},
  );
  const tracks = [
    { id: "track:0", instrument: "Acoustic Grand Piano" },
    { id: "track:1", instrument: "Acoustic Grand Piano" },
  ];
  assert.notEqual(defaultInstrumentHsl(tracks[0].instrument, false, tracks[0].id)[0],
    defaultInstrumentHsl(tracks[1].instrument, false, tracks[1].id)[0]);
  migrateInstrumentColors("song-1", tracks);
  assert.equal(state.player.colorsBySong["song-1"]["Acoustic Grand Piano"], undefined);
  assert.equal(state.player.colorsBySong["song-1"]["track:0"], "#123456");
  assert.equal(state.player.colorsBySong["song-1"]["track:1"], "#123456");
  state.player.colorsBySong["song-1"]["track:0"] = "#ff0000";
  assert.equal(colorFromInstrument("track:0", tracks[0].instrument), "#ff0000");
  assert.equal(colorFromInstrument("track:1", tracks[1].instrument), "#123456");
  assert.ok(stored.has("pv_visualizer_colors_v1"));
});

test("detail view no longer contains the redundant piano reduction banner", async () => {
  const html = await fs.readFile(indexPath, "utf8");
  assert.doesNotMatch(html, /id="pianoReductionCta"/);
  assert.match(html, /id="convertSelectedPianoBtn"/);
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

test("visualizer filters selected tracks even when instrument names repeat", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const filterSource = app.slice(app.indexOf("function filterJsonByActiveInstruments("), app.indexOf("async function exportFilteredSongJson()"));
  const tracksSource = app.slice(app.indexOf("function extractPianoReductionTracks("), app.indexOf("function buildPlayableNotesFromTracks("));
  const build = new Function("repairMojibake", "instrumentsForSong", "clamp01", "buildTracksV2",
    `${filterSource}\n${tracksSource}\nreturn { trackOptionsFromJson, filterJsonByActiveInstruments };`);
  const { trackOptionsFromJson, filterJsonByActiveInstruments } = build(
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
      { instrument: { name: "Piano" }, notes: [{ midi: 67, time: 1, duration: 1 }] },
    ] },
    supportingTracks: [{ notes: [{ midi: 60, time: 0, duration: 1 }] }, { notes: [{ midi: 67, time: 1, duration: 1 }] }],
    accompanyingInstruments: [0, 0],
    accompanyingTracks: [{ midi: 60, trackId: 0 }, { midi: 67, trackId: 1 }],
  };
  assert.deepEqual(trackOptionsFromJson(json, song), [
    { id: "track:0", instrument: "Piano" }, { id: "track:1", instrument: "Piano" },
  ]);
  const filtered = filterJsonByActiveInstruments(json, song, ["track:1"]);
  assert.equal(filtered.name, "Brano");
  assert.equal(filtered.original.tracks.length, 1);
  assert.equal(filtered.original.tracks[0].instrument.name, "Piano");
  assert.equal(filtered.supportingTracks.length, 1);
  assert.equal(filtered.supportingTracks[0].notes[0].midi, 67);
  assert.deepEqual(filtered.accompanyingTracks, [{ midi: 67, trackId: 0 }]);
  assert.equal(filtered.accompanyingInstruments.length, 1);
  assert.equal(json.original.tracks.length, 2);

  const supportingOnlyNotes = structuredClone(json);
  for (const track of supportingOnlyNotes.original.tracks) track.notes = [];
  assert.deepEqual(trackOptionsFromJson(supportingOnlyNotes, song).map((entry) => entry.id), ["support:0", "support:1"]);
  const filteredSupporting = filterJsonByActiveInstruments(supportingOnlyNotes, song, ["support:1"]);
  assert.equal(filteredSupporting.supportingTracks.length, 1);
  assert.equal(filteredSupporting.supportingTracks[0].notes[0].midi, 67);

  const handsOnly = { tracksV2: { right: [{ notes: [{ note: 60, start: 0, duration: 1 }] }], left: [{ notes: [{ note: 48, start: 0, duration: 1 }] }] } };
  assert.deepEqual(trackOptionsFromJson(handsOnly, song).map((entry) => entry.id), ["hand:right", "hand:left"]);
  const filteredHands = filterJsonByActiveInstruments(handsOnly, song, ["hand:right"]);
  assert.equal(filteredHands.tracksV2.right[0].notes.length, 1);
  assert.equal(filteredHands.tracksV2.left[0].notes.length, 0);

  const withEmpty = structuredClone(json);
  withEmpty.original.tracks.unshift({ instrument: { name: "Piano" }, notes: [] });
  withEmpty.accompanyingInstruments.unshift(0);
  const filteredWithEmpty = filterJsonByActiveInstruments(withEmpty, song, ["track:2"]);
  assert.equal(filteredWithEmpty.supportingTracks[0].notes[0].midi, 67);
  assert.equal(filteredWithEmpty.original.tracks.length, 1);

  const tenTracks = {
    original: { tracks: Array.from({ length: 10 }, (_, idx) => ({
      instrument: { name: "Piano" }, notes: [{ midi: 60 + idx, time: idx, duration: 1 }],
    })) },
    supportingTracks: Array.from({ length: 10 }, (_, idx) => ({ notes: [{ midi: 60 + idx, time: idx, duration: 1 }] })),
  };
  assert.equal(filterJsonByActiveInstruments(tenTracks, song, ["track:9"]).supportingTracks.length, 1);
  assert.equal(filterJsonByActiveInstruments(tenTracks, song, ["track:9"]).supportingTracks[0].notes[0].midi, 69);
  assert.equal(filterJsonByActiveInstruments(tenTracks, song, Array.from({ length: 10 }, (_, idx) => `track:${idx}`)).supportingTracks.length, 10);
});

test("legacy instrument-name selection maps to all matching track ids", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("function activeInstrumentsForSong("), app.indexOf("function renderDetail()"));
  const selected = new Function("state", `${source}\nreturn activeInstrumentsForSong;`)({ player: { activeInstrumentsBySong: {} } });
  const options = [
    { id: "track:0", instrument: "Piano" },
    { id: "track:1", instrument: "Piano" },
    { id: "track:2", instrument: "Violino" },
  ];
  assert.deepEqual(selected({ id: "song", activeInstruments: ["Piano"] }, options), ["track:0", "track:1"]);
  assert.deepEqual(selected({ id: "song", activeInstruments: ["track:1"] }, options), ["track:1"]);
});

test("visualizer plays only selected track when names repeat", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("function buildPlayableNotesFromTracks("), app.indexOf("function renderVisualizerLegend("));
  const buildPlayableNotesFromTracks = new Function(`${source}\nreturn buildPlayableNotesFromTracks;`)();
  const groups = [
    { id: "track:0", instrument: "Piano", notes: [{ midi: 60, time: 0, duration: 1 }] },
    { id: "track:1", instrument: "Piano", notes: [{ midi: 72, time: 1, duration: 1 }] },
  ];
  assert.deepEqual(buildPlayableNotesFromTracks(groups, ["track:1"]).notes.map((note) => note.midi), [72]);
});

test("MIDI conversion maps each supporting track to its instrument number", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("function buildOutput("), app.indexOf("function midiMainKey("));
  const buildOutput = new Function("buildMeasures", "buildTracksV2", "normalizeTempos", "mapOriginal", "round", "clamp01", "ticksToSeconds",
    `${source}\nreturn buildOutput;`)(
    () => [], () => ({ right: [], left: [] }), () => [{ bpm: 120, ticks: 0, time: 0 }],
    () => ({ tracks: [] }), (value) => value, (value) => value, () => 0,
  );
  const track = (number, midi) => ({ instrument: { number }, notes: [{ midi, time: 0, duration: 1, velocity: 0.7 }] });
  const json = buildOutput({ header: { ppq: 480 }, tracks: [track(0, 60), track(40, 64), track(73, 67)] }, {});
  assert.deepEqual(json.supportingTracks.map((item) => item.theirInstrument), [0, 40, 73]);
  assert.equal(json.supportingTracks[1].notes[0].midi, 64);
});

test("artist cards load a matching online thumbnail without storing it in song JSON", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("async function renderArtistPhotos()"), app.indexOf("function shouldShowTable()"));
  let attached;
  const target = {
    dataset: { artistPhoto: "Vasco Rossi" },
    querySelector: () => null,
    replaceChildren: (node) => { attached = node; },
  };
  const state = { view: "artists", artistPhotos: new Map(), artistPhotosLoading: false };
  const renderArtistPhotos = new Function("state", "el", "document", "fetch", "URLSearchParams",
    `${source}\nreturn renderArtistPhotos;`)(
    state,
    { playlistsCards: { querySelectorAll: () => [target] } },
    { createElement: (tag) => ({ tag, append(child) { this.child = child; } }) },
    async (url) => {
      assert.match(url, /it\.wikipedia\.org\/w\/api\.php/);
      return { ok: true, json: async () => ({ query: { pages: { 1: {
        title: "Vasco Rossi", thumbnail: { source: "https://thumb.wikimedia.org/photo.jpg" },
      } } } }) };
    },
    URLSearchParams,
  );
  await renderArtistPhotos();
  assert.equal(attached.tag, "a");
  assert.equal(attached.child.src, "https://thumb.wikimedia.org/photo.jpg");
  assert.equal(state.artistPhotos.size, 1);
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
    { id: "song-a", title: "Stesso Titolo", artist: "Artista A", jsonPath: "/a.json", activeInstruments: ["Piano"] },
    { id: "song-b", title: "Stesso Titolo", artist: "Artista B", jsonPath: "/b.json", activeInstruments: ["Violino"] },
  ];
  const run = new Function("state", "el", "toast", "showLoading", "JSZip", "fetch", "trackOptionsFromJson",
    "activeInstrumentsForSong", "filterJsonByActiveInstruments", "jsonWithSongMetadata", "sanitizeFileName", "downloadBlob", "updateSelectionInfo",
    `${source}\nreturn exportSelectedFilteredJson;`)(
    { db: { songs }, selectedSongIds: new Set(songs.map((song) => song.id)) },
    { exportSelectedFilteredBtn: { disabled: false } },
    () => {}, () => {}, FakeZip,
    async () => ({ ok: true, json: async () => ({ name: "Stesso Titolo" }) }),
    () => [{ id: "track:0", instrument: "Piano" }, { id: "track:1", instrument: "Violino" }],
    (song) => song.activeInstruments,
    (json, song, active) => ({ ...json, tracks: active }),
    (json, song) => ({ ...json, name: song.title, artist: song.artist }),
    (name) => name,
    (blob, name) => { downloaded = { blob, name }; },
    () => {},
  );
  await run();
  assert.equal(downloaded.name, "pianovisual-json-selezionati.zip");
  assert.deepEqual([...entries.keys()], ["song-a/Stesso Titolo.json", "song-b/Stesso Titolo.json"]);
  assert.deepEqual(entries.get("song-a/Stesso Titolo.json").tracks, ["Piano"]);
  assert.deepEqual(entries.get("song-b/Stesso Titolo.json").tracks, ["Violino"]);
  assert.equal(entries.get("song-a/Stesso Titolo.json").artist, "Artista A");
  assert.equal(entries.get("song-b/Stesso Titolo.json").artist, "Artista B");
});

test("selected JSON download includes edited catalog metadata", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  const source = app.slice(app.indexOf("async function downloadSelectedSongsJson()"), app.indexOf("async function exportSelectedFilteredJson()"));
  const entries = new Map();
  class FakeZip {
    folder() { return this; }
    file(name, content) { entries.set(name, JSON.parse(content)); }
    async generateAsync() { return entries; }
  }
  const song = { id: "song-a", title: "Titolo corretto", artist: "Artista corretto", jsonPath: "/library/json/song-a.json" };
  const run = new Function("state", "toast", "showLoading", "JSZip", "fetch", "jsonWithSongMetadata",
    "sanitizeFileName", "downloadBlob", `${source}\nreturn downloadSelectedSongsJson;`)(
    { db: { songs: [song] }, selectedSongIds: new Set([song.id]) },
    () => {}, () => {}, FakeZip,
    async () => ({ ok: true, json: async () => ({ name: "Vecchio titolo", artist: "" }) }),
    (json, entry) => ({ ...json, name: entry.title, artist: entry.artist }),
    (name) => name, () => {},
  );
  await run();
  assert.equal(entries.get("song-a.json").name, "Titolo corretto");
  assert.equal(entries.get("song-a.json").artist, "Artista corretto");
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
