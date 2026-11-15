const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { pathToFileURL } = require("node:url");
const { parseAdbDevices, findWindowsMtpQuest } = require("./quest-connection.cjs");
const { createBackupArchive, restoreBackupArchive } = require("./backup.cjs");
const { readQuestCollections, compareQuestCollections } = require("./quest-comparison.cjs");
const { buildQuestPlaylistDatabase } = require("./quest-playlist-export.cjs");
const { versionCopy } = require("./quest-version-copy.cjs");

const execFileAsync = promisify(execFile);
const QUEST_JSON_DIR = "/sdcard/Android/data/com.ZarApps.PianoVision/files";

const isDev = !app.isPackaged;
const DEFAULT_PORT = 5173;
const HOST = "127.0.0.1";

let mainWindow = null;
let serverModule = null;
let serverPort = DEFAULT_PORT;
let quitting = false;
let autoUpdaterRef = null;

function projectRoot() {
  return path.resolve(__dirname, "..");
}

function serverEntryPath() {
  return path.join(projectRoot(), "server.js");
}

function dbExamplePath() {
  return path.join(projectRoot(), "library", "db.example.json");
}

function runtimeLibraryDir() {
  return path.join(app.getPath("userData"), "library");
}

async function ensureRuntimeLibrary() {
  const base = runtimeLibraryDir();
  const jsonDir = path.join(base, "json");
  const pianoJsonDir = path.join(base, "jsonpiano");
  const selectedJsonDir = path.join(base, "jsonselected");
  const midiDir = path.join(base, "midi");
  const exportsDir = path.join(base, "exports");
  const dbPath = path.join(base, "db.json");
  const pianoDbPath = path.join(base, "dbpiano.json");

  await fs.mkdir(base, { recursive: true });
  await fs.mkdir(jsonDir, { recursive: true });
  await fs.mkdir(pianoJsonDir, { recursive: true });
  await fs.mkdir(selectedJsonDir, { recursive: true });
  await fs.mkdir(midiDir, { recursive: true });
  await fs.mkdir(exportsDir, { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    const seed = await fs.readFile(dbExamplePath(), "utf8");
    await fs.writeFile(dbPath, seed, "utf8");
  }
  try {
    await fs.access(pianoDbPath);
  } catch {
    await fs.writeFile(pianoDbPath, `${JSON.stringify({ songs: [], collections: [], songCollection: [], tags: [], songTags: [], practiceMeta: [], updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  }
}

async function localLibraryJsonFiles() {
  const files = new Map();
  for (const directoryName of ["json", "jsonpiano", "jsonselected"]) {
    const directory = path.join(runtimeLibraryDir(), directoryName);
    for (const fileName of await fs.readdir(directory)) {
      if (!fileName.toLowerCase().endsWith(".json") || path.basename(fileName) !== fileName) continue;
      files.set(`${directoryName}/${fileName}`, { directoryName, fileName, localPath: path.join(directory, fileName) });
    }
  }
  return files;
}

async function readJsonFilesRecursive(rootDir, limit = 5000) {
  const items = [];
  const errors = [];
  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (items.length + errors.length >= limit) throw new Error(`Limite di ${limit} file JSON superato`);
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
        try {
          items.push({ fileName: entry.name, jsonData: JSON.parse(await fs.readFile(absolute, "utf8")) });
        } catch (error) {
          errors.push({ sourceFileName: entry.name, status: "error", reason: `JSON parse error: ${error.message}` });
        }
      }
    }
  }
  await visit(rootDir);
  return { items, errors };
}

async function runAdb(args) {
  try {
    return await execFileAsync("adb", args, { windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("ADB non trovato. Installa Android SDK Platform Tools e aggiungi adb al PATH.");
    throw new Error(String(error.stderr || error.message || "Comando ADB fallito").trim());
  }
}

async function getQuestDevice() {
  const status = parseAdbDevices((await runAdb(["devices"])).stdout);
  if (status.code !== "ready") throw new Error(status.message);
  return status.serial;
}

async function localQuestTransferFiles(labeled) {
  const files = await localLibraryJsonFiles();
  if (!labeled) return files;
  const databases = await Promise.all(['db.json', 'dbpiano.json'].map(async (name) => JSON.parse(await fs.readFile(path.join(runtimeLibraryDir(), name), 'utf8'))));
  const byPath = new Map();
  for (const song of databases.flatMap((db) => db.songs || [])) {
    if (!song.jsonPath?.startsWith('/library/')) continue;
    const key = song.jsonPath.slice(9);
    if (byPath.has(key) && byPath.get(key).id !== song.id) throw new Error('Piu brani condividono lo stesso JSON: impossibile etichettare in sicurezza.');
    byPath.set(key, song);
  }
  for (const [id, file] of files) {
    const song = byPath.get(id);
    if (!song?.versionName || !['selected_instruments', 'piano_reduction'].includes(song.variantType)) continue;
    const copy = versionCopy(await fs.readFile(file.localPath), song);
    files.set(id, { ...file, fileName: copy.fileName, content: copy.content, hash: copy.hash, displayName: copy.title });
  }
  return files;
}

async function remoteQuestFiles(serial) {
  const command = `if [ -d '${QUEST_JSON_DIR}' ]; then for f in '${QUEST_JSON_DIR}'/*.json; do [ -f "$f" ] || continue; sha256sum "$f" || exit 1; done; fi`;
  const { stdout } = await runAdb(["-s", serial, "shell", command]);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^([a-fA-F0-9]{64})\s+(.+\.json)$/))
    .filter(Boolean)
    .map((match) => ({ hash: match[1].toLowerCase(), remotePath: match[2], fileName: path.posix.basename(match[2]) }))
    .filter((item) => path.posix.basename(item.fileName) === item.fileName);
}

async function sha256File(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

async function startBackend() {
  await ensureRuntimeLibrary();
  process.env.HOST = HOST;
  process.env.PORT = String(DEFAULT_PORT);
  process.env.PIANOVISUAL_LIBRARY_DIR = runtimeLibraryDir();
  process.env.PIANOVISUAL_APP_VERSION = app.getVersion();

  const serverUrl = pathToFileURL(serverEntryPath()).href;
  serverModule = await import(`${serverUrl}?ts=${Date.now()}`);
  serverPort = Number(serverModule?.boundPort || DEFAULT_PORT);
}

async function stopBackend() {
  if (!serverModule?.server) return;
  try {
    await new Promise((resolve) => {
      serverModule.server.close(() => resolve());
    });
  } catch {
    // ignore
  } finally {
    serverModule = null;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 920,
    minWidth: 1120,
    minHeight: 700,
    autoHideMenuBar: false,
    title: "PianoVisual",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://${HOST}:${serverPort}/`);
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Apri cartella dati",
          click: () => shell.openPath(runtimeLibraryDir()),
        },
        { type: "separator" },
        { role: "quit", label: "Esci" },
      ],
    },
    {
      label: "Aggiornamenti",
      submenu: [
        {
          label: "Verifica aggiornamenti",
          click: async () => {
            if (!autoUpdaterRef) {
              dialog.showMessageBox({ type: "info", message: "Aggiornamenti automatici disponibili solo nell'app installata." });
              return;
            }
            try {
              await autoUpdaterRef.checkForUpdates();
            } catch (error) {
              dialog.showErrorBox("Aggiornamenti", error.message || "Verifica aggiornamenti fallita");
            }
          },
        },
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Repository GitHub",
          click: () => shell.openExternal("https://github.com/almahub/pianovisual"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

ipcMain.handle("library:open-folder", async () => {
  const result = await shell.openPath(runtimeLibraryDir());
  if (result) return { ok: false, error: result };
  return { ok: true, path: runtimeLibraryDir() };
});

ipcMain.handle("backup:create", async (_, settings) => {
  const suggestedName = `PianoVisual-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  const selected = await dialog.showSaveDialog(mainWindow, {
    title: "Backup completo PianoVisual",
    defaultPath: path.join(app.getPath("downloads"), suggestedName),
    filters: [{ name: "Backup PianoVisual", extensions: ["zip"] }],
  });
  if (selected.canceled || !selected.filePath) return { canceled: true };
  return { canceled: false, ...await createBackupArchive({
    libraryDir: runtimeLibraryDir(), targetPath: selected.filePath,
    settings, appVersion: app.getVersion(),
  }) };
});

ipcMain.handle("backup:restore", async () => {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "Ripristina backup PianoVisual",
    properties: ["openFile"],
    filters: [{ name: "Backup PianoVisual", extensions: ["zip"] }],
  });
  if (selected.canceled || !selected.filePaths[0]) return { canceled: true };
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    buttons: ["Annulla", "Ripristina"],
    defaultId: 0,
    cancelId: 0,
    title: "Ripristina backup",
    message: "Sostituire la libreria e le impostazioni correnti con il backup selezionato?",
    detail: "La libreria attuale verra conservata accanto alla nuova come copia prima del ripristino.",
  });
  if (confirmation.response !== 1) return { canceled: true };
  return { canceled: false, ...await restoreBackupArchive({
    archivePath: selected.filePaths[0], libraryDir: runtimeLibraryDir(),
  }) };
});

ipcMain.handle("library:save-json-export", async (_, bytes, suggestedName) => {
  const safeName = path.basename(String(suggestedName || "pianovisual-json.zip")).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const selected = await dialog.showSaveDialog(mainWindow, {
    title: "Esporta archivio JSON",
    defaultPath: path.join(app.getPath("downloads"), safeName),
    filters: [{ name: "Archivio ZIP", extensions: ["zip"] }],
  });
  if (selected.canceled || !selected.filePath) return { canceled: true };

  const targetPath = path.resolve(selected.filePath);
  const libraryJsonDir = path.resolve(runtimeLibraryDir(), "json");
  const libraryPianoJsonDir = path.resolve(runtimeLibraryDir(), "jsonpiano");
  const relativeToLibrary = path.relative(libraryJsonDir, targetPath);
  const relativeToPianoLibrary = path.relative(libraryPianoJsonDir, targetPath);
  const insideFullLibrary = relativeToLibrary === "" || (!relativeToLibrary.startsWith("..") && !path.isAbsolute(relativeToLibrary));
  const insidePianoLibrary = relativeToPianoLibrary === "" || (!relativeToPianoLibrary.startsWith("..") && !path.isAbsolute(relativeToPianoLibrary));
  const relativeToRoot = path.relative(runtimeLibraryDir(), targetPath);
  const insideRoot = relativeToRoot === "" || (!relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot));
  if (insideFullLibrary || insidePianoLibrary || insideRoot) {
    throw new Error("Scegli una destinazione diversa dalle cartelle library\\json e library\\jsonpiano: contengono i file originali delle librerie.");
  }

  const data = Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []));
  if (data.length === 0) throw new Error("Archivio ZIP vuoto");
  if (data.length > 512 * 1024 * 1024) throw new Error("Archivio ZIP troppo grande (massimo 512 MB)");
  if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4b) throw new Error("Contenuto ZIP non valido");
  await fs.writeFile(targetPath, data, { flag: "w" });
  return { canceled: false, filePath: targetPath };
});

ipcMain.handle("json:select-folder", async () => {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "Seleziona cartella contenente JSON",
    properties: ["openDirectory"],
  });
  if (selected.canceled || !selected.filePaths[0]) return { canceled: true, items: [], errors: [] };
  const result = await readJsonFilesRecursive(selected.filePaths[0]);
  return { ...result, canceled: false, folderPath: selected.filePaths[0] };
});

ipcMain.handle("quest:status", async () => {
  let status;
  try {
    status = parseAdbDevices((await runAdb(["devices"])).stdout);
  } catch (error) {
    status = { code: "adb-error", message: error.message };
  }
  if (status.code !== "ready") {
    const mtpName = await findWindowsMtpQuest();
    if (mtpName && status.code === "none") {
      return {
        ok: false,
        connection: "mtp",
        message: `${mtpName} collegato per il trasferimento file (MTP), ma non rilevato via ADB. Attiva la modalita sviluppatore e il debug USB, autorizza questo PC nel visore e premi Rileva Quest 3.`,
      };
    }
    return { ok: false, connection: mtpName ? "mtp" : "none", message: status.message };
  }
  const files = await remoteQuestFiles(status.serial);
  return { ok: true, serial: status.serial, remotePath: QUEST_JSON_DIR, jsonCount: files.length };
});

ipcMain.handle("quest:pull-json", async () => {
  const serial = await getQuestDevice();
  const remoteFiles = await remoteQuestFiles(serial);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-quest-"));
  const errors = [];
  try {
    for (const item of remoteFiles) {
      try {
        await runAdb(["-s", serial, "pull", item.remotePath, path.join(tempDir, item.fileName)]);
      } catch (error) {
        errors.push({ sourceFileName: item.fileName, status: "error", reason: error.message });
      }
    }
    const parsed = await readJsonFilesRecursive(tempDir);
    return { serial, remotePath: QUEST_JSON_DIR, items: parsed.items, errors: [...errors, ...parsed.errors] };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

async function readQuestSnapshots(serial) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-quest-compare-"));
  try {
    const names = ["pvuser_testing4.bytes", "pvstatic.bytes"];
    const snapshots = [];
    for (const name of names) {
      const remote = `${QUEST_JSON_DIR}/${name}`;
      const check = `if [ -s '${remote}-wal' ] || [ -s '${remote}-journal' ]; then echo JOURNAL_ACTIVE; else stat -c '%s:%Y' '${remote}'; fi`;
      const before = (await runAdb(["-s", serial, "shell", check])).stdout.trim();
      if (!/^\d+:\d+$/.test(before)) throw new Error(`Database ${name} non disponibile o con journal attivo; chiudi PianoVision e riprova.`);
      const local = path.join(tempDir, name);
      await runAdb(["-s", serial, "pull", remote, local]);
      const after = (await runAdb(["-s", serial, "shell", check])).stdout.trim();
      if (before !== after || Number(before.split(":")[0]) !== (await fs.stat(local)).size) throw new Error(`Database ${name} modificato durante la lettura; chiudi PianoVision e riprova.`);
      snapshots.push(await fs.readFile(local));
    }
    return snapshots;
  } finally {
    await Promise.all(["pvuser_testing4.bytes", "pvstatic.bytes"].map((name) => fs.rm(path.join(tempDir, name), { force: true })));
    await fs.rmdir(tempDir);
  }
}

async function getQuestComparison() {
    const serial = await getQuestDevice();
    const remote = await readQuestCollections(...await readQuestSnapshots(serial));
    const readLocalDb = async (name) => JSON.parse(await fs.readFile(path.join(runtimeLibraryDir(), name), "utf8"));
    const main = await readLocalDb("db.json"), piano = await readLocalDb("dbpiano.json");
    const uniqueById = (items) => [...new Map(items.map((item) => [item.id, item])).values()];
    const localDb = { songs: uniqueById([...(main.songs || []), ...(piano.songs || [])]), collections: uniqueById([...(main.collections || []), ...(piano.collections || [])]), songCollection: [...(main.songCollection || []), ...(piano.songCollection || [])] };
    const remoteHashes = new Map((await remoteQuestFiles(serial)).map((file) => [file.fileName, file.hash]));
    const relevantHashes = new Set([...remote.favorites, ...remote.playlists.flatMap((list) => list.songs)].filter((piece) => piece.origin === "imported").map((piece) => remoteHashes.get(piece.fileName)).filter(Boolean));
    const localHashes = new Map();
    for (const [relative, file] of await localLibraryJsonFiles()) {
      if (!localDb.songs.some((song) => song.jsonPath === `/library/${relative}`)) continue;
      const hash = await sha256File(file.localPath);
      if (relevantHashes.has(hash)) localHashes.set(`/library/${relative}`, hash);
    }
    const versionHashes = new Map();
    for (const [relative, file] of await localQuestTransferFiles(true)) {
      if (!file.hash || !relevantHashes.has(file.hash)) continue;
      for (const song of localDb.songs.filter((item) => item.jsonPath === `/library/${relative}`)) versionHashes.set(song.id, file.hash);
    }
    const comparison = compareQuestCollections(remote, localDb.songs, remoteHashes, localHashes, localDb, versionHashes);
    const snapshot = crypto.createHash("sha256").update(JSON.stringify({ serial, profiles: comparison.profiles, favorites: comparison.favorites })).digest("hex");
    const playlistSnapshot = crypto.createHash("sha256").update(JSON.stringify({ serial, profiles: comparison.profiles, playlists: comparison.playlists })).digest("hex");
    return { serial, ...comparison, snapshot, playlistSnapshot, syncBindings: (main.questFavoriteSync?.bindings || []).filter((entry) => entry.device === serial), playlistBindings: (main.questPlaylistSync?.playlists || []).filter((entry) => entry.device === serial), localManualPlaylists: localDb.collections.filter((entry) => entry.type === "playlist" && !entry.smartRule).map((entry) => ({ id: entry.id, name: entry.name })) };
}

ipcMain.handle("quest:compare-collections", getQuestComparison);

ipcMain.handle("quest:apply-favorite-sync", async (_, request) => {
  if (!request || typeof request.snapshot !== "string" || typeof request.revision !== "string" || !Number.isSafeInteger(request.profileId) || !Array.isArray(request.choices)) throw new Error("Richiesta di sincronizzazione non valida.");
  const current = await getQuestComparison();
  if (request.snapshot !== current.snapshot || request.serial !== current.serial) throw new Error("Il Quest o i preferiti sono cambiati: ripeti il confronto.");
  if (!current.profiles.some((profile) => profile.id === request.profileId)) throw new Error("Profilo Quest non disponibile.");
  const favorites = current.favorites.filter((song) => song.profileId === request.profileId);
  for (const choice of request.choices) {
    const piece = favorites.find((song) => song.pieceId === choice.pieceId);
    if (!piece || !piece.candidates.some((candidate) => candidate.id === choice.songId)) throw new Error("Una corrispondenza non e piu disponibile: ripeti il confronto.");
  }
  const response = await fetch(`http://${HOST}:${serverPort}/api/quest/favorites-apply`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device: current.serial, profileId: request.profileId, remoteIds: favorites.map((song) => song.pieceId), choices: request.choices, revision: request.revision }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Sincronizzazione non riuscita.");
  return result;
});

ipcMain.handle("quest:apply-playlist-sync", async (_, request) => {
  if (!request || typeof request.snapshot !== "string" || typeof request.revision !== "string" || !Number.isSafeInteger(request.profileId) || !Number.isSafeInteger(request.playlistId) || typeof request.localId !== "string" || !Array.isArray(request.choices)) throw new Error("Richiesta playlist non valida.");
  const current = await getQuestComparison();
  if (request.snapshot !== current.playlistSnapshot || request.serial !== current.serial) throw new Error("Il Quest o le playlist sono cambiati: ripeti il confronto.");
  const playlist = current.playlists.find((item) => item.profileId === request.profileId && item.id === request.playlistId);
  if (!playlist) throw new Error("Playlist Quest non disponibile: ripeti il confronto.");
  for (const choice of request.choices) {
    const piece = playlist.songs.find((song) => song.pieceId === choice.pieceId);
    if (!piece || !piece.candidates.some((candidate) => candidate.id === choice.songId)) throw new Error("Una corrispondenza non e piu disponibile: ripeti il confronto.");
  }
  const response = await fetch(`http://${HOST}:${serverPort}/api/quest/playlist-apply`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device: current.serial, profileId: playlist.profileId, playlistId: playlist.id, playlistName: playlist.name, localId: request.localId, remoteIds: playlist.songs.map((song) => song.pieceId), choices: request.choices, revision: request.revision }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Sincronizzazione playlist non riuscita.");
  return result;
});

const outgoingPlaylistPreviews = new Map();

async function requirePianoVisionClosed(serial) {
  const { stdout } = await runAdb(["-s", serial, "shell", "if pidof com.ZarApps.PianoVision >/dev/null; then echo RUNNING; else echo STOPPED; fi"]);
  if (stdout.trim() !== "STOPPED") throw new Error("Chiudi completamente PianoVision sul Quest prima di procedere.");
}

async function prepareOutgoingPlaylist(serial, localId, profileId) {
  await requirePianoVisionClosed(serial);
  const [userBytes, staticBytes] = await readQuestSnapshots(serial);
  const remote = await readQuestCollections(userBytes, staticBytes);
  if (!remote.profiles.some((profile) => profile.id === profileId)) throw new Error("Profilo Quest non disponibile.");
  const main = JSON.parse(await fs.readFile(path.join(runtimeLibraryDir(), "db.json"), "utf8"));
  const piano = JSON.parse(await fs.readFile(path.join(runtimeLibraryDir(), "dbpiano.json"), "utf8"));
  const localDb = { songs: [...(main.songs || []), ...(piano.songs || [])], collections: [...(main.collections || []), ...(piano.collections || [])], relations: [...(main.songCollection || []), ...(piano.songCollection || [])] };
  const playlist = localDb.collections.find((item) => item.id === localId && item.type === "playlist" && !item.smartRule);
  if (!playlist) throw new Error("Playlist locale non disponibile.");
  const ids = new Set(localDb.relations.filter((item) => item.collectionId === localId).map((item) => item.songId));
  const remoteFiles = new Map((await remoteQuestFiles(serial)).map((file) => [file.fileName, file.hash]));
  const localFiles = await localLibraryJsonFiles();
  const labeledFiles = await localQuestTransferFiles(true);
  const songs = [];
  for (const song of localDb.songs.filter((item) => ids.has(item.id))) {
    const local = typeof song.jsonPath === "string" && song.jsonPath.startsWith("/library/") ? localFiles.get(song.jsonPath.slice(9)) : null;
    let localHash = "";
    if (local) localHash = await sha256File(local.localPath);
    const labeledHash = typeof song.jsonPath === 'string' ? labeledFiles.get(song.jsonPath.slice(9))?.hash : '';
    const candidates = remote.importedPieces.filter((piece) => localHash && (remoteFiles.get(piece.fileName) === localHash || (labeledHash && remoteFiles.get(piece.fileName) === labeledHash))).map((piece) => ({ pieceId: piece.pieceId, title: piece.title, artist: piece.artist }));
    songs.push({ id: song.id, title: song.title || "", artist: song.artist || "", localHash, candidates });
  }
  const profilePlaylists = remote.playlists.filter((item) => item.profileId === profileId).map((item) => ({ id: item.id, name: item.name, pieceIds: item.songs.map((song) => song.pieceId) }));
  const data = { serial, profileId, localId, playlistName: String(playlist.name || ""), songs, profilePlaylists, userHash: crypto.createHash("sha256").update(userBytes).digest("hex") };
  const signature = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  return { data, signature, userBytes };
}

ipcMain.handle("quest:preview-outgoing-playlist", async (_, request) => {
  if (!request || typeof request.localId !== "string" || !Number.isSafeInteger(request.profileId)) throw new Error("Selezione playlist non valida.");
  const serial = await getQuestDevice();
  const prepared = await prepareOutgoingPlaylist(serial, request.localId, request.profileId);
  const token = crypto.randomBytes(24).toString("hex");
  outgoingPlaylistPreviews.clear();
  outgoingPlaylistPreviews.set(token, { ...prepared.data, signature: prepared.signature, createdAt: Date.now() });
  return { token, ...prepared.data };
});

ipcMain.handle("quest:send-outgoing-playlist", async (_, request) => {
  const preview = outgoingPlaylistPreviews.get(request?.token);
  outgoingPlaylistPreviews.delete(request?.token);
  if (!preview || Date.now() - preview.createdAt > 10 * 60 * 1000 || !Array.isArray(request.choices) || !Number.isSafeInteger(request.destinationId) || request.destinationId < 0) throw new Error("Anteprima scaduta o selezione non valida.");
  const serial = await getQuestDevice();
  if (serial !== preview.serial) throw new Error("Il Quest e cambiato: ripeti l'anteprima.");
  const current = await prepareOutgoingPlaylist(serial, preview.localId, preview.profileId);
  if (current.signature !== preview.signature) throw new Error("Playlist, database o file sono cambiati: ripeti l'anteprima.");
  const seenSongs = new Set(), seenPieces = new Set();
  for (const choice of request.choices) {
    const song = current.data.songs.find((entry) => entry.id === choice.songId);
    if (!song || seenSongs.has(choice.songId) || seenPieces.has(choice.pieceId) || !song.candidates.some((piece) => piece.pieceId === choice.pieceId)) throw new Error("Collegamento brano non valido: ripeti l'anteprima.");
    seenSongs.add(choice.songId); seenPieces.add(choice.pieceId);
  }
  if (request.destinationId && !current.data.profilePlaylists.some((entry) => entry.id === request.destinationId)) throw new Error("Playlist Quest di destinazione non valida.");
  const built = await buildQuestPlaylistDatabase(current.userBytes, { profileId: preview.profileId, destinationId: request.destinationId, playlistName: preview.playlistName, pieceIds: request.choices.map((entry) => entry.pieceId) });
  const backupDir = path.join(app.getPath("userData"), "backups", "quest-playlist");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `pvuser-${Date.now()}-${crypto.randomBytes(5).toString("hex")}.bytes`);
  await fs.writeFile(backupPath, current.userBytes, { flag: "wx" });
  if (await sha256File(backupPath) !== preview.userHash) throw new Error(`Backup non verificato: ${backupPath}`);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-quest-send-"));
  const localStage = path.join(tempDir, "playlist.bytes");
  const remoteStage = `${QUEST_JSON_DIR}/.pianovisual-playlist-${crypto.randomBytes(12).toString("hex")}.tmp`;
  const dbFile = `${QUEST_JSON_DIR}/pvuser_testing4.bytes`;
  const stageHash = crypto.createHash("sha256").update(built.bytes).digest("hex");
  let writeStarted = false;
  try {
    await fs.writeFile(localStage, built.bytes, { flag: "wx" });
    await runAdb(["-s", serial, "push", localStage, remoteStage]);
    await requirePianoVisionClosed(serial);
    const shell = `if pidof com.ZarApps.PianoVision >/dev/null; then echo GAME_RUNNING; exit 11; fi; if [ -s '${dbFile}-wal' ] || [ -s '${dbFile}-journal' ]; then echo JOURNAL_ACTIVE; exit 12; fi; if ! sha256sum '${dbFile}' | grep -q '^${preview.userHash} '; then echo DATABASE_CHANGED; exit 13; fi; if ! sha256sum '${remoteStage}' | grep -q '^${stageHash} '; then echo STAGE_CHANGED; exit 14; fi; dd if='${remoteStage}' of='${dbFile}' conv=notrunc`;
    writeStarted = true;
    await runAdb(["-s", serial, "shell", shell]);
    const verify = (await runAdb(["-s", serial, "shell", "sha256sum", dbFile])).stdout.trim().split(/\s+/)[0];
    if (verify !== stageHash) throw new Error("Verifica del database sul Quest fallita");
    return { created: built.created, added: built.added, backupPath, skipped: preview.songs.length - request.choices.length };
  } catch (error) {
    throw new Error(`${error.message}${writeStarted ? ` Il database potrebbe essere incompleto: non avviare PianoVision; backup sul PC: ${backupPath}` : ` Backup sul PC: ${backupPath}`}`);
  } finally {
    try { await runAdb(["-s", serial, "shell", "rm", "-f", remoteStage]); } catch { /* The Quest may have disconnected. */ }
    await fs.rm(localStage, { force: true });
    await fs.rmdir(tempDir);
  }
});

ipcMain.handle("quest:preview-push", async (_, labeled = false) => {
  const serial = await getQuestDevice();
  const localFiles = await localQuestTransferFiles(labeled === true);
  const remoteMap = new Map((await remoteQuestFiles(serial)).map((item) => [item.fileName, item.hash]));
  const files = [];
  for (const [id, { fileName, directoryName, localPath, hash: copyHash, displayName }] of localFiles) {
    const hash = copyHash || await sha256File(localPath);
    const remoteHash = remoteMap.get(fileName) || "";
    files.push({ id, fileName, displayName: displayName || fileName, directoryName, localHash: hash, remoteHash, status: !remoteHash ? "new" : remoteHash === hash ? "same" : "changed" });
  }
  return {
    serial,
    remotePath: QUEST_JSON_DIR,
    files,
    summary: {
      new: files.filter((item) => item.status === "new").length,
      changed: files.filter((item) => item.status === "changed").length,
      same: files.filter((item) => item.status === "same").length,
    },
  };
});

ipcMain.handle("quest:push-json", async (_, requestedFiles, expectedSerial, labeled = false) => {
  const serial = await getQuestDevice();
  if (typeof expectedSerial !== "string" || !expectedSerial || serial !== expectedSerial) throw new Error("Il Quest e cambiato dopo l'anteprima. Ripeti il confronto.");
  const selection = Array.isArray(requestedFiles) ? requestedFiles : [];
  if (selection.length === 0 || selection.length > 5000) throw new Error("Selezione file non valida");
  const localFiles = await localQuestTransferFiles(labeled === true);
  const remoteBefore = new Map((await remoteQuestFiles(serial)).map((item) => [item.fileName, item.hash]));
  const seenNames = new Set();
  for (const item of selection) {
    const local = localFiles.get(item?.id);
    if (!local || !/^[a-f0-9]{64}$/.test(item.localHash || "") || !/^(?:[a-f0-9]{64})?$/.test(item.remoteHash || "")) throw new Error("Selezione file non valida: ripeti l'anteprima.");
    if (seenNames.has(local.fileName.toLowerCase())) throw new Error(`Seleziona una sola versione di ${local.fileName}.`);
    seenNames.add(local.fileName.toLowerCase());
    if ((local.hash || await sha256File(local.localPath)) !== item.localHash || (remoteBefore.get(local.fileName) || "") !== item.remoteHash) throw new Error(`Il file ${local.fileName} e cambiato dopo l'anteprima. Ripeti il confronto.`);
  }
  await runAdb(["-s", serial, "shell", "mkdir", "-p", QUEST_JSON_DIR]);
  const errors = [];
  const pushed = [];
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pianovisual-quest-versions-'));
  try {
  for (const item of selection) {
    const { fileName, localPath, content } = localFiles.get(item.id);
    try {
      const source = content ? path.join(tempDir, fileName) : localPath;
      if (content) await fs.writeFile(source, content, { flag: 'wx' });
      await runAdb(["-s", serial, "push", source, `${QUEST_JSON_DIR}/${fileName}`]);
      pushed.push({ fileName, hash: item.localHash });
    } catch (error) {
      errors.push({ fileName, error: error.message });
    }
  }
  let verified = new Map();
  try { verified = new Map((await remoteQuestFiles(serial)).map((item) => [item.fileName, item.hash])); }
  catch (error) { for (const item of pushed) errors.push({ fileName: item.fileName, error: `Verifica non riuscita: ${error.message}` }); return { serial, remotePath: QUEST_JSON_DIR, copied: 0, errors }; }
  let copied = 0;
  for (const item of pushed) {
    if (verified.get(item.fileName) === item.hash) copied += 1;
    else errors.push({ fileName: item.fileName, error: "Hash sul Quest diverso o non disponibile dopo la copia" });
  }
  return { serial, remotePath: QUEST_JSON_DIR, copied, errors };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

function setupAutoUpdater() {
  if (!app.isPackaged) return;
  // Lazy require: non necessario in sviluppo.
  const { autoUpdater } = require("electron-updater");
  autoUpdaterRef = autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const sendStatus = (status, detail = "") => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("updater:status", { status, detail });
    }
  };

  autoUpdater.on("checking-for-update", () => sendStatus("checking"));
  autoUpdater.on("update-available", (info) => {
    sendStatus("available", info?.version || "");
    dialog.showMessageBox({
      type: "info",
      title: "Aggiornamento disponibile",
      message: `Nuova versione disponibile (${info?.version || "latest"}). Download automatico avviato.`,
    });
  });
  autoUpdater.on("update-not-available", () => sendStatus("not-available"));
  autoUpdater.on("download-progress", (progress) => sendStatus("downloading", `${Math.round(progress.percent || 0)}%`));
  autoUpdater.on("update-downloaded", () => {
    sendStatus("downloaded");
    dialog
      .showMessageBox({
        type: "question",
        buttons: ["Installa ora", "Dopo"],
        defaultId: 0,
        cancelId: 1,
        title: "Aggiornamento pronto",
        message: "Aggiornamento scaricato. Vuoi riavviare ora per installarlo?",
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
  });
  autoUpdater.on("error", (error) => sendStatus("error", error?.message || "update error"));

  // Primo check automatico.
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 1800);

  ipcMain.handle("updater:check", async () => {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  });
}

async function bootstrap() {
  try {
    await startBackend();
    buildMenu();
    createMainWindow();
    setupAutoUpdater();
  } catch (error) {
    dialog.showErrorBox("Avvio PianoVisual", error.message || "Avvio fallito");
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(bootstrap);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  quitting = true;
  stopBackend().catch(() => {});
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
