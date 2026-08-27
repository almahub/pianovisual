---
name: music-to-piano-json
description: Analyze structured musical sources (MIDI-like JSON, MIDI/MID, or MusicXML) by musical role, create a playable piano reduction, and export normalized JSON with melody, harmony, bass, chords, sections, timing, and confidence. Use when the user asks to understand, reduce, arrange, or convert a structured song source into piano JSON. Audio transcription is deliberately deferred.
---

# Music to Piano JSON

Transform a structured musical source into either normalized `piano_reduction_v2` JSON or the recognized `tracksV2` program-compatible container. Perform musical analysis rather than merely renaming or flattening source tracks.

## Workflow

1. Run `python3 scripts/convert.py INPUT -o OUTPUT`. The default `--format auto` preserves a recognized program-compatible JSON container; otherwise it emits normalized JSON.
2. For a requested excerpt, add `--start SECONDS --end SECONDS`.
3. Inspect the generated summary and validation result. Never present uncertain inference as source-authored data.
4. Return the JSON file and concise counts for melody notes, chords, bass notes, structure, tempo, and key.

The scripts use only Python's standard library. They accept `.json`, `.mid`, `.midi`, `.xml`, `.musicxml`, and uncompressed `.mxl`. Extract compressed MXL before conversion.

## Input routing

- MIDI-like JSON: preserve reliable note timing and source metadata. Accept direct `tracks`/`parts`/`notes` and nested Tone.js-style `original.header` plus `original.tracks`; accept notes using `midi` or `pitch`, and `time`/`start` plus `duration` or `end`.
- MIDI: parse tempo, meter, key, program, track, and note events. Preserve PPQ timing; do not quantize.
- MusicXML: read parts, measures, voices, chords, rests, ties, divisions, tempo, meter, and key where present.
- MP3, WAV, FLAC, M4A, MP4: stop with an explicit unsupported-audio message. Never fabricate transcription. Audio mode is planned for a later version.

## Musical invariants

- Score source tracks/parts using monophony, register, continuity, density, interval motion, simultaneity, name/instrument hints, and low-register behavior.
- Never assume an instrument name alone determines its role.
- Keep `chords` distinct from `harmony`: chords describe harmonic identity; harmony notes encode a piano voicing.
- Produce logical `melody`, `harmony`, and `bass` tracks. Melody and harmony normally use the right hand; bass uses the left.
- Avoid harmony notes within three semitones below or one semitone above a simultaneous melody note. Keep accompaniment approximately C3-C5 and bass approximately C2-C4 by octave displacement.
- Preserve structured timing. If an input has no reliable beat grid, omit unsupported measure/beat fields instead of inventing them.
- Infer sections from repeated bar-level harmonic, melodic, rhythmic, bass, and density fingerprints. Use `family` for related repetitions. Use generic `section` when verse/chorus evidence is weak.
- Use confidence below 1.0 for inferred roles, chords, keys, or sections. Source-authored timing and metadata may use 1.0.

## Output contract

Use these output modes:

- `--format auto` (default): when the input has `tracksV2`, `supportingTracks`, `original`, `measures`, and related program fields, preserve the container, rebuild `tracksV2.right` from detected melody plus reduced harmony, rebuild `tracksV2.left` from bass, and validate hand/measure alignment. For other inputs, emit normalized JSON.
- `--format program-compatible`: require the recognized program container; fail if required proprietary fields are absent. Repair only a UTF-8 BOM or the observed unambiguous `1{` prefix. Do not silently repair arbitrary malformed JSON.
- `--format normalized`: always emit `piano_reduction_v2` after musical analysis.

Do not crop excerpts in program-compatible mode because doing so safely requires coordinated rewriting of measures, both hands, supporting tracks, maps, and the embedded original. Use normalized mode for `--start`/`--end`.

Validate normalized output against [references/piano_reduction.schema.json](references/piano_reduction.schema.json). Validate compatible output with `scripts/program_compatible.py`.

Read [references/tracksV2.md](references/tracksV2.md) before creating, debugging, or changing program-compatible output. It defines the exact hand, measure, note, timing, preservation, and validation rules.

Read [references/format.md](references/format.md) when modifying the schema, adding a parser, or interpreting confidence and section-family semantics.

## Failure behavior

Fail clearly on malformed input, unsupported extensions, missing notes, invalid MIDI chunks, or XML without readable parts. Do not emit a successful empty arrangement. Never overwrite the source file.
