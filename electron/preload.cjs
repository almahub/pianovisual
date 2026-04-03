const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pianovisualDesktop", {
  checkUpdates: () => ipcRenderer.invoke("updater:check"),
  onUpdateStatus: (handler) => {
    if (typeof handler !== "function") return () => {};
    const listener = (_, payload) => handler(payload);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.removeListener("updater:status", listener);
  },
  onBackendCrash: (handler) => {
    if (typeof handler !== "function") return () => {};
    const listener = (_, payload) => handler(payload);
    ipcRenderer.on("backend:crashed", listener);
    return () => ipcRenderer.removeListener("backend:crashed", listener);
  },
});

