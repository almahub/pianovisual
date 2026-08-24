const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pianovisualDesktop", {
  checkUpdates: () => ipcRenderer.invoke("updater:check"),
  openLibraryFolder: () => ipcRenderer.invoke("library:open-folder"),
  saveJsonExport: (bytes, suggestedName) => ipcRenderer.invoke("library:save-json-export", bytes, suggestedName),
  selectJsonFolder: () => ipcRenderer.invoke("json:select-folder"),
  questStatus: () => ipcRenderer.invoke("quest:status"),
  questPullJson: () => ipcRenderer.invoke("quest:pull-json"),
  questPreviewPush: () => ipcRenderer.invoke("quest:preview-push"),
  questPushJson: (fileNames) => ipcRenderer.invoke("quest:push-json", fileNames),
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
