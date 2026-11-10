import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inspectPianoVisionJson } from "../compatibility.js";

test("compatibility check reports missing musical data without rejecting valid partial files", () => {
  const report = inspectPianoVisionJson({ tempos: [{ bpm: 0 }], timeSignatures: [], supportingTracks: [], tracksV2: { right: [], left: [] }, measures: [], song_length: 0 });
  assert.ok(report.issues.some((issue) => issue.includes("Tempi")));
  assert.ok(report.issues.some((issue) => issue.includes("Nessuna nota")));
  assert.ok(report.issues.some((issue) => issue.includes("misura")));
  assert.doesNotThrow(() => inspectPianoVisionJson({ original: { tracks: {} }, tracksV2: { right: {}, left: [] } }));
});

test("measure end uses the tempo map including changes within a measure", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const source = app.slice(app.indexOf("function ticksToSeconds("), app.indexOf("function mapControlChanges("));
  const build = new Function("round", "midiToName", "clamp01", "durationType", "normalizeTempos", `${source}\nreturn { buildTracksV2 };`);
  const { buildTracksV2 } = build((value) => value, () => ({}), (value) => value, () => "quarter", () => []);
  const measures = [{ time: 0, timeSignature: [4, 4], ticksStart: 0, totalTicks: 1920 }];
  const output = buildTracksV2([], measures, 480, [{ ticks: 0, bpm: 60 }, { ticks: 960, bpm: 120 }]);
  assert.equal(output.right[0].timeEnd, 3);
  assert.equal(output.left[0].timeEnd, 3);
});
