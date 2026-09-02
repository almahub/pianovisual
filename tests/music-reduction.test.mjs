import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const root = process.cwd();

test("piano harmony and bass stay aligned with the detected chords", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-music-test-"));
  const output = path.join(tempDir, "reduction.json");
  try {
    await execFileAsync("python3", [
      path.join(root, "skill/music-to-piano-json/scripts/convert.py"),
      path.join(root, "skill/music-to-piano-json/examples/example_input.json"),
      "-o",
      output,
      "--format",
      "normalized",
    ]);
    const reduction = JSON.parse(await fs.readFile(output, "utf8"));
    assert.deepEqual(reduction.chords.map((chord) => chord.symbol), ["C", "F"]);

    for (const role of ["harmony", "bass"]) {
      const track = reduction.tracks.find((item) => item.role === role);
      assert.ok(track?.notes.length > 0, `${role} must contain notes`);
      for (const note of track.notes) {
        const noteEnd = note.time + note.duration;
        const activeChords = reduction.chords.filter(
          (chord) => chord.time < noteEnd - 1e-6 && chord.time + chord.duration > note.time + 1e-6,
        );
        assert.ok(activeChords.length > 0, `${role} note must overlap a chord`);
        for (const chord of activeChords) {
          assert.ok(
            chord.pitchClasses.includes(note.midi % 12),
            `${role} note ${note.name} is outside chord ${chord.symbol}`,
          );
        }
      }
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("a melody-only selection is not duplicated into harmony or left hand", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-melody-test-"));
  const input = path.join(tempDir, "melody.json");
  const output = path.join(tempDir, "reduction.json");
  try {
    await fs.writeFile(input, JSON.stringify({
      title: "Solo melody",
      musicalInfo: { tempo: 120, meter: [4, 4], ppq: 480 },
      tracks: [{ name: "Lead", notes: [
        { midi: 72, time: 0, duration: 0.5 },
        { midi: 74, time: 0.5, duration: 0.5 },
      ] }],
    }), "utf8");
    await execFileAsync("python3", [
      path.join(root, "skill/music-to-piano-json/scripts/convert.py"),
      input,
      "-o",
      output,
      "--format",
      "normalized",
    ]);
    const reduction = JSON.parse(await fs.readFile(output, "utf8"));
    const tracks = Object.fromEntries(reduction.tracks.map((track) => [track.role, track.notes]));
    assert.equal(tracks.melody.length, 2);
    assert.equal(tracks.harmony.length, 0);
    assert.equal(tracks.bass.length, 0);
    assert.equal(reduction.chords.length, 0);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("piano plus voice maps melody right and an easy bass-guide dyad left", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pianovisual-inversion-test-"));
  const input = path.join(tempDir, "inversion.json");
  const output = path.join(tempDir, "reduction.json");
  try {
    await fs.writeFile(input, JSON.stringify({
      title: "C over E",
      musicalInfo: { tempo: 120, meter: [4, 4], ppq: 480 },
      tracks: [
        { name: "Lead Vocal", notes: [
          { midi: 72, time: 0, duration: 0.5 }, { midi: 74, time: 0.5, duration: 0.5 },
          { midi: 76, time: 1, duration: 0.5 }, { midi: 77, time: 1.5, duration: 0.5 },
        ] },
        { name: "Harmony", notes: [60, 64, 67].map((midi) => ({ midi, time: 0, duration: 2 })) },
        { name: "Bass", notes: [0, 0.5, 1, 1.5].map((time) => ({ midi: 40, time, duration: 0.5 })) },
      ],
    }), "utf8");
    await execFileAsync("python3", [
      path.join(root, "skill/music-to-piano-json/scripts/convert.py"), input, "-o", output,
      "--format", "normalized",
    ]);
    const reduction = JSON.parse(await fs.readFile(output, "utf8"));
    assert.equal(reduction.arrangementMode, "piano_voice");
    const melody = reduction.tracks.find((track) => track.role === "melody");
    const harmony = reduction.tracks.find((track) => track.role === "harmony");
    assert.equal(melody.hand, "right");
    assert.equal(melody.instrument, "voice");
    assert.equal(harmony.hand, "left");
    assert.equal(reduction.chords[0].symbol, "C/E");
    const bass = reduction.tracks.find((track) => track.role === "bass");
    assert.equal(harmony.notes.length, reduction.chords.length, "use only one guide tone per stable chord");
    assert.equal(bass.notes.length, reduction.chords.length, "do not copy a busy source-bass rhythm");
    for (const note of harmony.notes) {
      const chord = reduction.chords.find((item) => item.time < note.time + note.duration && item.time + item.duration > note.time);
      const pairedBass = bass.notes.find((item) => item.time === note.time && item.duration === note.duration);
      assert.ok(pairedBass, "every guide tone must have one paired bass note");
      assert.equal(note.midi > pairedBass.midi, true);
      assert.equal(note.midi - pairedBass.midi <= 12, true, "left-hand span must not exceed one octave");
      assert.notEqual(note.midi % 12, chord.bassPitchClass);
    }
    for (const note of bass.notes) {
      const chord = reduction.chords.find((item) => item.time < note.time + note.duration && item.time + item.duration > note.time);
      assert.equal(note.midi >= 40 && note.midi <= 51, true);
      assert.equal(note.midi % 12, chord.bassPitchClass);
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
