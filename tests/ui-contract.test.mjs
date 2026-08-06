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
    "remoteCatalogPanel",
    "remoteCatalogSearch",
    "remoteConvertBtn",
    "remoteImportBtn",
    "importJsonFolderBtn",
    "importJsonFolderPanelBtn",
    "questStatusBtn",
    "questPullBtn",
    "questPushBtn",
    "detailInstrumentsBadges",
    "downloadImportReportBtn",
    "archiveConflictPolicySelect",
    "archiveDedupPolicySelect",
    "visualizerLegend",
  ];
  for (const id of requiredIds) {
    assert.equal(html.includes(`id=\"${id}\"`), true, `missing #${id}`);
  }
});

test("desktop bridge exposes folder import and safe Quest sync actions", async () => {
  const preload = await fs.readFile(path.join(root, "electron", "preload.cjs"), "utf8");
  for (const method of ["selectJsonFolder", "questStatus", "questPullJson", "questPreviewPush", "questPushJson"]) {
    assert.equal(preload.includes(`${method}:`), true, `missing desktop bridge method ${method}`);
  }
});
