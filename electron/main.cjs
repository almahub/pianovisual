const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { pathToFileURL } = require("node:url");

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
  const exportsDir = path.join(base, "exports");
  const dbPath = path.join(base, "db.json");

  await fs.mkdir(base, { recursive: true });
  await fs.mkdir(jsonDir, { recursive: true });
  await fs.mkdir(exportsDir, { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    const seed = await fs.readFile(dbExamplePath(), "utf8");
    await fs.writeFile(dbPath, seed, "utf8");
  }
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
  const { stdout } = await runAdb(["devices"]);
  const rows = stdout.split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean);
  const authorized = rows.filter((line) => /\tdevice$/.test(line)).map((line) => line.split(/\s+/)[0]);
  if (authorized.length === 0) {
    const unauthorized = rows.some((line) => /\tunauthorized$/.test(line));
    throw new Error(unauthorized ? "Quest collegato ma non autorizzato: conferma il debug USB nel visore." : "Nessun Quest autorizzato rilevato via ADB.");
  }
  if (authorized.length > 1) throw new Error("Sono collegati più dispositivi ADB. Lascia collegato solo il Quest da sincronizzare.");
  return authorized[0];
}

async function remoteQuestFiles(serial) {
  const command = `mkdir -p '${QUEST_JSON_DIR}' && sha256sum '${QUEST_JSON_DIR}'/*.json 2>/dev/null || true`;
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
  const relativeToLibrary = path.relative(libraryJsonDir, targetPath);
  if (relativeToLibrary === "" || (!relativeToLibrary.startsWith("..") && !path.isAbsolute(relativeToLibrary))) {
    throw new Error("Scegli una destinazione diversa dalla cartella library\\json: contiene i file originali della libreria.");
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
  const serial = await getQuestDevice();
  const files = await remoteQuestFiles(serial);
  return { ok: true, serial, remotePath: QUEST_JSON_DIR, jsonCount: files.length };
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

ipcMain.handle("quest:preview-push", async () => {
  const serial = await getQuestDevice();
  const localDir = path.join(runtimeLibraryDir(), "json");
  const localNames = (await fs.readdir(localDir)).filter((name) => name.toLowerCase().endsWith(".json") && path.basename(name) === name);
  const remoteMap = new Map((await remoteQuestFiles(serial)).map((item) => [item.fileName, item.hash]));
  const files = [];
  for (const fileName of localNames) {
    const hash = await sha256File(path.join(localDir, fileName));
    const remoteHash = remoteMap.get(fileName) || "";
    files.push({ fileName, status: !remoteHash ? "new" : remoteHash === hash ? "same" : "changed" });
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

ipcMain.handle("quest:push-json", async (_, requestedNames) => {
  const serial = await getQuestDevice();
  const names = Array.isArray(requestedNames) ? [...new Set(requestedNames)] : [];
  if (names.length === 0 || names.length > 5000) throw new Error("Selezione file non valida");
  const localDir = path.join(runtimeLibraryDir(), "json");
  await runAdb(["-s", serial, "shell", "mkdir", "-p", QUEST_JSON_DIR]);
  let copied = 0;
  const errors = [];
  for (const fileName of names) {
    if (path.basename(fileName) !== fileName || !fileName.toLowerCase().endsWith(".json")) {
      errors.push({ fileName, error: "Nome file non valido" });
      continue;
    }
    try {
      const localPath = path.join(localDir, fileName);
      await fs.access(localPath);
      await runAdb(["-s", serial, "push", localPath, `${QUEST_JSON_DIR}/${fileName}`]);
      copied += 1;
    } catch (error) {
      errors.push({ fileName, error: error.message });
    }
  }
  return { serial, remotePath: QUEST_JSON_DIR, copied, errors };
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
