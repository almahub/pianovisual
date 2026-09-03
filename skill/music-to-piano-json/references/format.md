# Piano reduction v2 notes

`piano_reduction_v2` separates observations from arrangement decisions.

- `source`: provenance and analysis mode.
- `musicalInfo`: duration, PPQ when meaningful, primary tempo/meter/key, and maps.
- `sections`: inferred or authored intervals; `family` groups repeated material.
- `chords`: abstract chord identities, pitch classes, and inversions.
- `tracks`: playable events. The canonical reduction maps melody/voice to the right hand and maps harmony plus bass to the left hand. `arrangementMode` is always `piano_voice`.

Pitch classes use C=0 through B=11. Velocity is normalized to 0-1. Time and duration use seconds. Measures and beats are one-based. Omit unsupported fields rather than guessing.

Confidence describes a particular inference, not overall file quality. Track-role, chord, section, and note confidence are independent.

Chord recognition uses velocity- and overlap-weighted pitch-class evidence over beat-aligned windows, continuity smoothing, and the detected bass source. The structured implementation recognizes major, minor, diminished, augmented, sus2, sus4, 6, minor6, 7, major7, minor7, 9, add9, and slash-bass spellings. The bass track must match each chord's declared root or inversion.

Section detection compares measure fingerprints containing chord roots/qualities, melodic contour, rhythmic onset pattern, bass movement, and density. Repetitions share a family. Generic `section` labels are safer than unjustified verse/chorus claims.

## Program-compatible container

The recognized program container is not interchangeable with `piano_reduction_v2`. It retains `supportingTracks`, `tracksV2.right`, `tracksV2.left`, `original.header`, `original.tracks`, `measures`, tempo/key/meter maps, and accompaniment metadata. Both hand arrays must contain exactly one entry per item in `measures`.

Compatibility mode preserves the complete source object and key order while reserializing valid JSON. It rebuilds only the existing `tracksV2` hand arrays: right contains melody/voice, while left normally contains a compact three-note chord made from bass and two characteristic tones. A guarded fourth note is reserved for comfortable, high-confidence seventh chords. It does not add normalized-only analysis fields because unknown top-level fields may break strict consumers.
