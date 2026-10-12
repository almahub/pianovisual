import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

test("repository keeps exactly the latest three release notes", async () => {
  const root = process.cwd();
  const version = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version;
  const notes = (await readdir(root)).filter((name) => /^RELEASE_NOTES_v\d+\.\d+\.\d+\.md$/.test(name));
  assert.equal(notes.length, 3);
  assert.ok(notes.includes(`RELEASE_NOTES_v${version}.md`));
  const versions = notes.map((name) => name.match(/v(\d+)\.(\d+)\.(\d+)/).slice(1).map(Number))
    .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2]);
  assert.deepEqual(versions[0], version.split(".").map(Number));
});
