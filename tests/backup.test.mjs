import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const { createBackupArchive, restoreBackupArchive } = require("../electron/backup.cjs");

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-backup-test-"));
  const libraryDir = path.join(root, "library");
  await fs.mkdir(path.join(libraryDir, "json"), { recursive: true });
  await fs.mkdir(path.join(libraryDir, "jsonpiano"), { recursive: true });
  await fs.mkdir(path.join(libraryDir, "exports"), { recursive: true });
  const db = { songs: [{ id: "song-1", title: "Agnese", artist: "Ivan Graziani" }], collections: [{ id: "list-1" }] };
  await fs.writeFile(path.join(libraryDir, "db.json"), JSON.stringify(db));
  await fs.writeFile(path.join(libraryDir, "dbpiano.json"), JSON.stringify({ songs: [], collections: [] }));
  await fs.writeFile(path.join(libraryDir, "json", "Agnese.json"), JSON.stringify({ notes: [60, 64, 67] }));
  await fs.writeFile(path.join(libraryDir, "jsonpiano", "Agnese-piano.json"), JSON.stringify({ notes: [60] }));
  await fs.writeFile(path.join(libraryDir, "exports", "example.json"), "exported");
  return { root, libraryDir, archivePath: path.join(root, "backup.zip") };
}

test("complete backup restores files, metadata, settings and keeps the previous library", async () => {
  const { root, libraryDir, archivePath } = await fixture();
  try {
    const created = await createBackupArchive({ libraryDir, targetPath: archivePath,
      settings: { theme: "light", visualizerColors: '{"song-1":{"Piano":"#ff0000"}}' }, appVersion: "1.0.32" });
    assert.equal(created.fileCount, 5);
    await fs.writeFile(path.join(libraryDir, "db.json"), JSON.stringify({ songs: [], collections: [] }));
    await fs.writeFile(path.join(libraryDir, "json", "new.json"), "keep previous");
    const result = await restoreBackupArchive({ archivePath, libraryDir });
    assert.equal(result.fileCount, 5);
    assert.equal(result.appVersion, "1.0.32");
    assert.equal(result.settings.theme, "light");
    assert.equal(JSON.parse(result.settings.visualizerColors)["song-1"].Piano, "#ff0000");
    assert.equal(JSON.parse(await fs.readFile(path.join(libraryDir, "db.json"))).songs[0].artist, "Ivan Graziani");
    assert.equal(await fs.readFile(path.join(libraryDir, "exports", "example.json"), "utf8"), "exported");
    assert.equal(await fs.readFile(path.join(result.previousDir, "json", "new.json"), "utf8"), "keep previous");
  } finally {
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

test("invalid archive leaves the current library untouched", async () => {
  const { root, libraryDir, archivePath } = await fixture();
  try {
    await fs.writeFile(archivePath, "not a zip");
    await assert.rejects(restoreBackupArchive({ archivePath, libraryDir }));
    assert.equal(JSON.parse(await fs.readFile(path.join(libraryDir, "db.json"))).songs.length, 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

test("backup refuses a destination inside the library or an existing archive", async () => {
  const { root, libraryDir, archivePath } = await fixture();
  try {
    await assert.rejects(createBackupArchive({ libraryDir, targetPath: path.join(libraryDir, "backup.zip") }));
    await fs.writeFile(archivePath, "existing backup");
    await assert.rejects(createBackupArchive({ libraryDir, targetPath: archivePath }));
    assert.equal(await fs.readFile(archivePath, "utf8"), "existing backup");
  } finally {
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});
