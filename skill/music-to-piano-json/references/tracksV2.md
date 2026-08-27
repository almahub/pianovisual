# `tracksV2` compatibility contract

Read this reference whenever compatible output is requested or the consumer expects `tracksV2.right` and `tracksV2.left`.

## Required source container

Compatibility mode requires all of these top-level fields:

`supportingTracks`, `start_time`, `song_length`, `resolution`, `tempos`, `keySignatures`, `timeSignatures`, `measures`, `tracksV2`, `original`, `accompanyingInstruments`, `accompanyingChannels`, `accompanyingTracks`, `name`, and `artist`.

`original` must contain `header` and `tracks`. `tracksV2` must contain arrays named `right` and `left`. The number of entries in each hand array must equal the number of entries in `measures`.

## Musical assignment

- Detect the melody by scoring source tracks for monophony, register, continuity, note count/density, interval motion, simultaneity, and instrument/name evidence. Penalize bass sources, guitar accompaniment, and very sparse ornamental parts.
- Detect bass using low register, monophony, overlap behavior, and bass name/instrument evidence.
- Detect harmony using simultaneity/polyphony and middle-register behavior.
- Build `tracksV2.right` from melody followed by the selected reduced harmony source.
- Build `tracksV2.left` from bass.
- Do not stack every source accompaniment track into the right hand.

## Register rules

- Move harmony upward by octaves while MIDI pitch is below 48.
- Move harmony downward by octaves while MIDI pitch is above 72.
- If a harmony note overlaps the melody and lies from three semitones below through one semitone above it, move the harmony note down one octave.
- Move bass upward by octaves while MIDI pitch is below 36.
- Move bass downward by octaves while MIDI pitch is above 60.

## Time conversion

Use `resolution` as PPQ. Build ordered tempo segments from top-level `tempos`. Convert seconds to ticks within the active segment:

`ticks = segmentStartTick + (seconds - segmentStartSeconds) * PPQ * BPM / 60`

Round the result to the nearest integer. Compute `durationTicks` as `endTick - startTick`, with a minimum of one tick.

Assign a note to the measure whose `ticksStart` is the greatest value not exceeding the note's `ticksStart`. Clamp only to the first or last measure when the computed tick lies outside the declared range.

## Hand measure object

Each entry of `tracksV2.right` or `tracksV2.left` contains:

- `direction`: `up` for right, `down` for left;
- `time` and `timeEnd` in seconds;
- `timeSignature` copied from the corresponding source measure;
- `notes`: notes whose onset belongs to the measure;
- `max` and `min`: MIDI extrema, or `0` and `200` when empty;
- `measureTicksStart` and `measureTicksEnd`;
- empty `rests` and `groups` arrays unless a future implementation reconstructs them deterministically.

## Note object

Every compatible note contains:

- `note`: MIDI pitch, integer 0–127;
- `durationTicks`: positive integer;
- `noteOffVelocity`: `0`;
- `ticksStart`: absolute onset tick;
- `velocity`: normalized 0–1;
- `measureBars`: `ticksStart / resolution`;
- `duration`, `start`, and `end` in seconds;
- `noteName`, `octave`, and `notePitch` derived from MIDI pitch;
- `noteLengthType`: closest value among whole, half, quarter, eighth, sixteenth, and thirty-second;
- `group`: `-1`;
- `measureInd`: zero-based measure index;
- `noteMeasureInd`: zero-based position within that measure;
- `id`: globally sequential `rN` or `lN` identifier for the hand.

## Preservation and repair

Preserve all compatible source fields and their order. Replace only `tracksV2.right` and `tracksV2.left`. Do not add normalized-only `chords` or `sections` at the top level because strict consumers may reject unknown fields.

Accept an optional UTF-8 BOM. Repair only the observed unambiguous leading `1{` defect by removing that single `1`. Reject all other malformed JSON.

Do not crop compatible output. Cropping requires coordinated rewriting of measures, both hands, supporting tracks, musical maps, duration fields, and `original`.
