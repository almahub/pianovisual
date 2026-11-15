import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function setup({ remote = [], after = remote, labeledFile = null } = {}) {
  const source = await readFile(new URL("../electron/main.cjs", import.meta.url), "utf8");
  const handlers = {};
  const hash = "a".repeat(64);
  const files = new Map([
    ["json/song.json", { directoryName: "json", fileName: "song.json", localPath: "original" }],
    ["jsonselected/song.json", { directoryName: "jsonselected", fileName: "song.json", localPath: "selected" }],
  ]);
  if (labeledFile) files.set('jsonselected/song.json', labeledFile);
  let reads = 0;
  const commands = [];
  const register = new Function("ipcMain", "getQuestDevice", "localQuestTransferFiles", "remoteQuestFiles", "sha256File", "runAdb", "QUEST_JSON_DIR", "fs", "os", "path", source.slice(source.indexOf('ipcMain.handle("quest:preview-push"'), source.indexOf("function setupAutoUpdater()")));
  register({ handle: (name, handler) => { handlers[name] = handler; } }, async () => "device", async () => files,
    async () => reads++ ? after : remote, async () => hash, async (args) => { commands.push(args); }, "/quest", fs, os, path);
  return { handlers, hash, commands };
}

test("Quest preview retains same-named files in different library sections", async () => {
  const { handlers } = await setup();
  const preview = await handlers["quest:preview-push"]();
  assert.equal(preview.files.length, 2);
  assert.notEqual(preview.files[0].id, preview.files[1].id);
});

test("Quest transfer blocks duplicate destination names and stale previews", async () => {
  const { handlers, hash, commands } = await setup({ remote: [{ fileName: "song.json", hash: "b".repeat(64) }] });
  const entry = { id: "json/song.json", localHash: hash, remoteHash: "b".repeat(64) };
  await assert.rejects(handlers["quest:push-json"](null, [entry, { ...entry, id: "jsonselected/song.json" }], "device"), /sola versione/);
  await assert.rejects(handlers["quest:push-json"](null, [{ ...entry, remoteHash: "" }], "device"), /cambiato/);
  await assert.rejects(handlers["quest:push-json"](null, [entry], "other-device"), /Quest e cambiato/);
  assert.equal(commands.length, 0);
});

test("Quest transfer only reports copies verified by remote hash", async () => {
  const mismatch = await setup({ after: [{ fileName: "song.json", hash: "b".repeat(64) }] });
  const result = await mismatch.handlers["quest:push-json"](null, [{ id: "json/song.json", localHash: mismatch.hash, remoteHash: "" }], "device");
  assert.equal(result.copied, 0);
  assert.match(result.errors[0].error, /Hash/);
  const ok = await setup({ after: [{ fileName: "song.json", hash: "a".repeat(64) }] });
  const verified = await ok.handlers["quest:push-json"](null, [{ id: "jsonselected/song.json", localHash: ok.hash, remoteHash: "" }], "device");
  assert.equal(verified.copied, 1);
  assert.equal(verified.errors.length, 0);
  assert.equal(ok.commands[1][3], "selected");
});

test("Quest transfer stages labeled content and checks its preview hash", async () => {
  const content = Buffer.from('{"name":"Example Song [ss]"}');
  const hash = 'c'.repeat(64);
  const entry = { directoryName: 'jsonselected', fileName: 'pv-version-test.json', localPath: 'original', content, hash, displayName: 'Example Song [ss]' };
  const previewCtx = await setup({ labeledFile: entry });
  const preview = await previewCtx.handlers['quest:preview-push'](null, true);
  const item = preview.files.find((file) => file.id === 'jsonselected/song.json');
  assert.equal(item.localHash, hash);
  assert.equal(item.displayName, 'Example Song [ss]');
  const ctx = await setup({ labeledFile: entry, after: [{ fileName: entry.fileName, hash }] });
  const result = await ctx.handlers['quest:push-json'](null, [item], 'device', true);
  assert.equal(result.copied, 1);
  assert.notEqual(ctx.commands[1][3], 'original');
  assert.match(ctx.commands[1][4], /pv-version-test\.json$/);
});
