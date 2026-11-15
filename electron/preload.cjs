const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pianovisualDesktop", {
  checkUpdates: () => ipcRenderer.invoke("updater:check"),
  openLibraryFolder: () => ipcRenderer.invoke("library:open-folder"),
  createFullBackup: (settings) => ipcRenderer.invoke("backup:create", settings),
  restoreFullBackup: () => ipcRenderer.invoke("backup:restore"),
  saveJsonExport: (bytes, suggestedName) => ipcRenderer.invoke("library:save-json-export", bytes, suggestedName),
  selectJsonFolder: () => ipcRenderer.invoke("json:select-folder"),
  questStatus: () => ipcRenderer.invoke("quest:status"),
  questPullJson: () => ipcRenderer.invoke("quest:pull-json"),
  questCompareCollections: () => ipcRenderer.invoke("quest:compare-collections"),
  questApplyFavoriteSync: (request) => ipcRenderer.invoke("quest:apply-favorite-sync", request),
  questApplyPlaylistSync: (request) => ipcRenderer.invoke("quest:apply-playlist-sync", request),
  questPreviewOutgoingPlaylist: (request) => ipcRenderer.invoke("quest:preview-outgoing-playlist", request),
  questSendOutgoingPlaylist: (request) => ipcRenderer.invoke("quest:send-outgoing-playlist", request),
  questPreviewPush: (labeled) => ipcRenderer.invoke("quest:preview-push", labeled),
  questPushJson: (files, serial, labeled) => ipcRenderer.invoke("quest:push-json", files, serial, labeled),
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
