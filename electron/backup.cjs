const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { pipeline } = require("node:stream/promises");
const { Transform } = require("node:stream");
const yazl = require("yazl");
const yauzl = require("yauzl-promise");

const MAX_FILES = 20000;
const MAX_BYTES = 20 * 1024 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

function safeSettings(input = {}) {
  const theme = input.theme === "light" ? "light" : "dark";
  const colors = typeof input.visualizerColors === "string" && input.visualizerColors.length <= 2_000_000
    ? input.visualizerColors : "{}";
  let parsed;
  try { parsed = JSON.parse(colors); } catch { parsed = {}; }
  return { theme, visualizerColors: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? colors : "{}" };
}

async function listLibraryFiles(libraryDir) {
  const files = [];
  async function visit(dir) {
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Collegamento simbolico non supportato: ${entry.name}`);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) {
        const stat = await fsp.stat(absolute);
        files.push({ path: path.relative(libraryDir, absolute).split(path.sep).join("/"), bytes: stat.size, absolute });
        if (files.length > MAX_FILES) throw new Error("Troppi file nella libreria");
      }
    }
  }
  await visit(libraryDir);
  files.sort((a, b) => a.path.localeCompare(b.path));
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  if (total > MAX_BYTES) throw new Error("Libreria troppo grande per il backup");
  return files;
}

async function createBackupArchive({ libraryDir, targetPath, settings, appVersion }) {
  const files = await listLibraryFiles(libraryDir);
  const resolvedLibrary = path.resolve(libraryDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedLibrary, resolvedTarget);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error("Salva il backup fuori dalla libreria");
  }
  const manifest = {
    format: "pianovisual-complete-backup",
    formatVersion: 1,
    createdAt: new Date().toISOString(),
    appVersion: String(appVersion || ""),
    settings: safeSettings(settings),
    files: files.map(({ path: name, bytes }) => ({ path: name, bytes })),
  };
  const zip = new yazl.ZipFile();
  zip.addBuffer(Buffer.from(JSON.stringify(manifest, null, 2)), "manifest.json");
  for (const file of files) zip.addFile(file.absolute, `library/${file.path}`);
  zip.end();
  try {
    await pipeline(zip.outputStream, fs.createWriteStream(resolvedTarget, { flags: "wx" }));
    return { filePath: resolvedTarget, fileCount: files.length, bytes: (await fsp.stat(resolvedTarget)).size };
  } catch (error) {
    if (error.code !== "EEXIST") await fsp.rm(resolvedTarget, { force: true });
    throw error;
  }
}

function checkedEntryPath(filename) {
  if (filename === "manifest.json") return filename;
  if (!filename.startsWith("library/") || filename.includes("\\") || filename.includes("\0")) {
    throw new Error("Percorso non valido nell'archivio");
  }
  const parts = filename.split("/");
  if (parts.some((part, index) => index > 0 && (!part || part === "." || part === ".." ||
    /[<>:"|?*]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))) {
    throw new Error("Nome file non valido nell'archivio");
  }
  return filename;
}

async function validateExtracted(stageRoot, seen, totalBytes) {
  const manifestPath = path.join(stageRoot, "manifest.json");
  const stat = await fsp.stat(manifestPath);
  if (stat.size > MAX_MANIFEST_BYTES) throw new Error("Manifesto del backup troppo grande");
  const manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
  if (manifest.format !== "pianovisual-complete-backup" || manifest.formatVersion !== 1 ||
      !Array.isArray(manifest.files) || manifest.files.length !== seen.size - 1) {
    throw new Error("Backup PianoVisual non valido o incompleto");
  }
  let expectedTotal = 0;
  const expectedNames = new Set(["manifest.json"]);
  for (const file of manifest.files) {
    const name = checkedEntryPath(`library/${file.path}`);
    if (expectedNames.has(name.toLowerCase()) || !seen.has(name.toLowerCase()) ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 0) {
      throw new Error("Inventario del backup non valido");
    }
    expectedNames.add(name.toLowerCase());
    const actual = await fsp.stat(path.join(stageRoot, ...name.split("/")));
    if (!actual.isFile() || actual.size !== file.bytes) throw new Error(`File incompleto nel backup: ${file.path}`);
    expectedTotal += file.bytes;
  }
  if (expectedNames.size !== seen.size || [...seen].some((name) => !expectedNames.has(name))) {
    throw new Error("L'archivio contiene file non previsti");
  }
  if (expectedTotal !== totalBytes) throw new Error("Dimensione del backup incoerente");
  for (const dbName of ["db.json", "dbpiano.json"]) {
    const db = JSON.parse(await fsp.readFile(path.join(stageRoot, "library", dbName), "utf8"));
    if (!Array.isArray(db.songs) || !Array.isArray(db.collections)) throw new Error(`Database non valido: ${dbName}`);
  }
  return manifest;
}

async function restoreBackupArchive({ archivePath, libraryDir }) {
  const archive = await fsp.open(archivePath, "r");
  try {
    const signature = Buffer.alloc(4);
    const { bytesRead } = await archive.read(signature, 0, 4, 0);
    if (bytesRead !== 4 || signature.toString("hex") !== "504b0304") {
      throw new Error("Il file selezionato non e un archivio ZIP valido");
    }
  } finally {
    await archive.close();
  }
  const library = path.resolve(libraryDir);
  const parent = path.dirname(library);
  const stageRoot = await fsp.mkdtemp(path.join(parent, ".pianovisual-restore-"));
  const seen = new Set();
  let totalBytes = 0;
  let fileCount = 0;
  let zip;
  try {
    zip = await yauzl.open(archivePath, { strictFilenames: true });
    for await (const entry of zip) {
      const isDirectory = entry.filename.endsWith("/");
      const name = checkedEntryPath(isDirectory ? entry.filename.slice(0, -1) : entry.filename);
      if (isDirectory) continue;
      const unixType = (entry.externalFileAttributes >>> 16) & 0o170000;
      if (unixType === 0o120000) throw new Error("Collegamenti simbolici non ammessi nel backup");
      const lookup = name.toLowerCase();
      if (seen.has(lookup)) throw new Error("File duplicato nel backup");
      seen.add(lookup);
      fileCount += 1;
      if (fileCount > MAX_FILES + 1 || entry.uncompressedSize > MAX_BYTES ||
          (name === "manifest.json" && entry.uncompressedSize > MAX_MANIFEST_BYTES)) {
        throw new Error("Backup troppo grande");
      }
      const destination = path.join(stageRoot, ...name.split("/"));
      await fsp.mkdir(path.dirname(destination), { recursive: true });
      let entryBytes = 0;
      const counter = new Transform({
        transform(chunk, encoding, callback) {
          totalBytes += chunk.length;
          entryBytes += chunk.length;
          const tooLarge = totalBytes > MAX_BYTES || (name === "manifest.json" && entryBytes > MAX_MANIFEST_BYTES);
          callback(tooLarge ? new Error("Backup troppo grande") : null, chunk);
        },
      });
      await pipeline(await entry.openReadStream(), counter, fs.createWriteStream(destination, { flags: "wx" }));
    }
    await zip.close();
    zip = null;
    const manifest = await validateExtracted(stageRoot, seen, totalBytes - (await fsp.stat(path.join(stageRoot, "manifest.json"))).size);
    const previousDir = `${library}.before-restore-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(3).toString("hex")}`;
    let movedPrevious = false;
    try {
      await fsp.rename(library, previousDir);
      movedPrevious = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      await fsp.rename(path.join(stageRoot, "library"), library);
    } catch (error) {
      if (movedPrevious) {
        try { await fsp.rename(previousDir, library); }
        catch { throw new Error(`Ripristino non completato. La libreria originale e conservata in ${previousDir}`); }
      }
      throw error;
    }
    return { previousDir: movedPrevious ? previousDir : "", fileCount: manifest.files.length,
      appVersion: manifest.appVersion, settings: safeSettings(manifest.settings) };
  } finally {
    if (zip) await zip.close().catch(() => {});
    await fsp.rm(stageRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

module.exports = { createBackupArchive, restoreBackupArchive };
