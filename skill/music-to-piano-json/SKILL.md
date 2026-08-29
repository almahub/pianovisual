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
- Treat channel 10 percussion and clearly identified drum/percussion tracks as supporting sources when pitched tracks are available; do not fold them into either piano hand.
- Keep `chords` distinct from `harmony`: chords describe harmonic identity; harmony notes encode a piano voicing generated from the stabilized chord sequence.
- Infer chord identity from accompaniment and bass after excluding the detected melody, so passing melody tones do not create false chord extensions.
- Split harmony and bass notes at chord boundaries when necessary and keep their pitch classes inside the active chord; melody may retain intentional non-chord tones.
- Produce logical `melody`, `harmony`, and `bass` tracks. In the default `piano_voice` mode melody/voice stays independent, harmony uses the right hand, and bass uses the left. In `piano_solo`, melody joins harmony in the right hand.
- Make every harmony note a member of the active chord. Make every bass note match the chord's declared bass pitch class; use a slash-chord symbol when that bass is not the root.
- Stabilize beat-level harmony so a single low-confidence passing event cannot create a fleeting chord change between equal neighbors.
- When the user selects only a melodic source, keep harmony and bass empty instead of duplicating the melody into missing hands. With a shared accompaniment source, separate middle-register harmony from low-register bass.
- Avoid harmony notes within three semitones below or one semitone above a simultaneous melody note. Keep accompaniment approximately C3-C5 and bass approximately C2-C4 by octave displacement.
- Preserve structured timing. If an input has no reliable beat grid, omit unsupported measure/beat fields instead of inventing them.
- Infer sections from repeated bar-level harmonic, melodic, rhythmic, bass, and density fingerprints. Use `family` for related repetitions. Use generic `section` when verse/chorus evidence is weak.
- Use confidence below 1.0 for inferred roles, chords, keys, or sections. Source-authored timing and metadata may use 1.0.
- Do not emit playable harmony or bass for a chord below the minimum confidence threshold; a deliberate gap is safer than invented notes.

## Output contract

Use these output modes:

- `--format auto` (default): when the input has `tracksV2`, `supportingTracks`, `original`, `measures`, and related program fields, preserve the container, rebuild `tracksV2.right` from detected melody plus reduced harmony, rebuild `tracksV2.left` from bass, and validate hand/measure alignment. For other inputs, emit normalized JSON.
- `--format program-compatible`: require the recognized program container; fail if required proprietary fields are absent. Repair only a UTF-8 BOM or the observed unambiguous `1{` prefix. Do not silently repair arbitrary malformed JSON.
- `--format normalized`: always emit `piano_reduction_v2` after musical analysis.

Choose the arrangement explicitly with `--arrangement-mode piano_voice` (default) or `--arrangement-mode piano_solo`. Prefer `piano_voice` for sung or lead-melody material because it prevents the melody and accompaniment from being hidden inside one right-hand stream.

Do not crop excerpts in program-compatible mode because doing so safely requires coordinated rewriting of measures, both hands, supporting tracks, maps, and the embedded original. Use normalized mode for `--start`/`--end`.

Validate normalized output against [references/piano_reduction.schema.json](references/piano_reduction.schema.json). Validate compatible output with `scripts/program_compatible.py`.

Use `--analysis-output <path>` when the caller needs the source-track indices assigned to melody, harmony, and bass. Keep this metadata in the sidecar or application database, never in the strict program-compatible container.

Read [references/tracksV2.md](references/tracksV2.md) before creating, debugging, or changing program-compatible output. It defines the exact hand, measure, note, timing, preservation, and validation rules.

Read [references/format.md](references/format.md) when modifying the schema, adding a parser, or interpreting confidence and section-family semantics.

## Failure behavior

Fail clearly on malformed input, unsupported extensions, missing notes, invalid MIDI chunks, or XML without readable parts. Do not emit a successful empty arrangement. Never overwrite the source file.
