const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");

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
