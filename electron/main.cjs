const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const net = require("node:net");
const http = require("node:http");
const { spawn } = require("node:child_process");

const isDev = !app.isPackaged;
const DEFAULT_PORT = 5173;
const HOST = "127.0.0.1";

let mainWindow = null;
let serverProc = null;
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

function canListen(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, HOST);
  });
}

async function findFreePort(base = DEFAULT_PORT, maxOffset = 40) {
  for (let port = base; port <= base + maxOffset; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error(`Nessuna porta libera trovata nel range ${base}-${base + maxOffset}`);
}

function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Timeout avvio backend"));
        return;
      }

      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }
        setTimeout(attempt, 250);
      });
      req.on("error", () => setTimeout(attempt, 250));
      req.setTimeout(2000, () => {
        req.destroy();
        setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

async function startBackend() {
  await ensureRuntimeLibrary();
  serverPort = await findFreePort();

  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    HOST,
    PORT: String(serverPort),
    PIANOVISUAL_LIBRARY_DIR: runtimeLibraryDir(),
  };

  serverProc = spawn(process.execPath, [serverEntryPath()], {
    cwd: projectRoot(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProc.stdout.on("data", (buf) => process.stdout.write(`[backend] ${buf}`));
  serverProc.stderr.on("data", (buf) => process.stderr.write(`[backend] ${buf}`));

  serverProc.once("exit", (code, signal) => {
    if (quitting) return;
    const msg = `Backend terminato inaspettatamente (code=${code ?? "null"}, signal=${signal ?? "null"})`;
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox("PianoVisual backend", msg);
      mainWindow.webContents.send("backend:crashed", { message: msg });
    } else {
      dialog.showErrorBox("PianoVisual backend", msg);
    }
  });

  await waitForServer(`http://${HOST}:${serverPort}/api/library`);
}

function stopBackend() {
  if (!serverProc || serverProc.killed) return;
  try {
    serverProc.kill("SIGTERM");
  } catch {
    // ignore
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
  stopBackend();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

