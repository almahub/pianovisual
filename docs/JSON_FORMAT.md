# JSON Format (PianoVision-compatible)

Il converter genera un JSON con i blocchi principali:

- `supportingTracks`: tracce con note essenziali (`midi`, `time`, `duration`, `velocity`)
- `song_length`, `resolution`, `tempos`, `keySignatures`, `timeSignatures`
- `tracksV2`: struttura per rendering/analisi per mano destra/sinistra
- `original`: estrazione tracce originali MIDI
- metadata come `name`, `artist`

## Campi minimi utili

```json
{
  "supportingTracks": [
    {
      "notes": [
        { "midi": 60, "time": 0, "velocity": 0.8, "duration": 0.5 }
      ]
    }
  ],
  "song_length": 1,
  "resolution": 480,
  "tempos": [{ "bpm": 120, "ticks": 0, "time": 0 }],
  "timeSignatures": [{ "ticks": 0, "timeSignature": [4, 4], "measures": 0 }],
  "name": "example",
  "artist": ""
}
```

## Note
- `midi` e numero nota MIDI (es. 60 = C4)
- `time` e `duration` in secondi
- `velocity` normalizzata tra 0 e 1
- Il server richiede almeno una traccia riconosciuta, un tempo e una indicazione di tempo. Questo esempio e minimale: la struttura completa generata include anche misure, mani, tracce originali e strumenti.
- `Controllo compatibilita JSON` nei dettagli del brano segnala possibili problemi ma non garantisce il comportamento nel visore.
- Un URL copertina inserito nei metadati dell'app e conservato nel database locale; non viene aggiunto automaticamente ai JSON esportati. La visualizzazione di copertine personali in PianoVision non e verificata.

Per esempi pratici, consulta `samples/json`.
