import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function setup({ remote = [], after = remote } = {}) {
  const source = await readFile(new URL("../electron/main.cjs", import.meta.url), "utf8");
  const handlers = {};
  const hash = "a".repeat(64);
  const files = new Map([
    ["json/song.json", { directoryName: "json", fileName: "song.json", localPath: "original" }],
    ["jsonselected/song.json", { directoryName: "jsonselected", fileName: "song.json", localPath: "selected" }],
  ]);
  let reads = 0;
  const commands = [];
  const register = new Function("ipcMain", "getQuestDevice", "localLibraryJsonFiles", "remoteQuestFiles", "sha256File", "runAdb", "QUEST_JSON_DIR", source.slice(source.indexOf('ipcMain.handle("quest:preview-push"'), source.indexOf("function setupAutoUpdater()")));
  register({ handle: (name, handler) => { handlers[name] = handler; } }, async () => "device", async () => files,
    async () => reads++ ? after : remote, async () => hash, async (args) => { commands.push(args); }, "/quest");
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
  await assert.rejects(handlers["quest:push-json"](null, [entry, { ...entry, id: "jsonselected/song.json" }]), /sola versione/);
  await assert.rejects(handlers["quest:push-json"](null, [{ ...entry, remoteHash: "" }]), /cambiato/);
  assert.equal(commands.length, 0);
});

test("Quest transfer only reports copies verified by remote hash", async () => {
  const mismatch = await setup({ after: [{ fileName: "song.json", hash: "b".repeat(64) }] });
  const result = await mismatch.handlers["quest:push-json"](null, [{ id: "json/song.json", localHash: mismatch.hash, remoteHash: "" }]);
  assert.equal(result.copied, 0);
  assert.match(result.errors[0].error, /Hash/);
  const ok = await setup({ after: [{ fileName: "song.json", hash: "a".repeat(64) }] });
  const verified = await ok.handlers["quest:push-json"](null, [{ id: "jsonselected/song.json", localHash: ok.hash, remoteHash: "" }]);
  assert.equal(verified.copied, 1);
  assert.equal(verified.errors.length, 0);
  assert.equal(ok.commands[1][3], "selected");
});
