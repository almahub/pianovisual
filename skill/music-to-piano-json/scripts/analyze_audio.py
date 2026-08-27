"""Reserved audio-transcription boundary for a future skill version."""

def analyze_audio(*_args, **_kwargs):
    raise NotImplementedError(
        "Audio transcription is intentionally deferred. Provide MIDI, MusicXML, or MIDI-like JSON."
    )
