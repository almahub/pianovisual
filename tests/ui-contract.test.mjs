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
    "saveBatchBtn",
    "downloadSelectedBtn",
    "deleteSelectedBtn",
    "convertSelectedPianoBtn",
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

test("desktop JSON export refuses to write inside the live library JSON folder", async () => {
  const main = await fs.readFile(path.join(root, "electron", "main.cjs"), "utf8");
  assert.equal(main.includes('ipcMain.handle("library:save-json-export"'), true);
  assert.equal(main.includes('path.relative(libraryJsonDir, targetPath)'), true);
  assert.equal(main.includes('diversa dalle cartelle library\\\\json e library\\\\jsonpiano'), true);
});

test("visualizer export rebuilds PianoVision tracks from selected instruments", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("clone.tracksV2 = buildTracksV2(clone.original.tracks"), true);
  assert.equal(app.includes("clone.song_length = Math.max(0, filteredDuration)"), true);
  assert.equal(app.includes("filteredByInstruments"), true);
});

test("instrument toggles update the loaded count and scheduled audio", async () => {
  const app = await fs.readFile(path.join(root, "app.js"), "utf8");
  assert.equal(app.includes("loadedInstruments.length ? loadedInstruments : instrumentsForSong(song)"), true);
  assert.equal(app.includes("stopScheduledAudio();"), true);
  assert.equal(app.includes("if (wasPlaying && hasPlayableNotes) await playPlayer(resumeAt)"), true);
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
