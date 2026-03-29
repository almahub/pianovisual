# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-29
### Added
- Report import dettagliato per file (importato/sovrascritto/scartato/errore) con download JSON dal pannello Import.
- Opzioni import archivio JSON/ZIP: policy conflitti (`skip`/`overwrite`) e dedup interno (`keep_first`/`keep_last`).
- Legenda colori strumenti nel visualizer con stato attivo/inattivo.
- Test aggiuntivi per import archivio (skip/overwrite) e test UI minimo sui controlli critici.

### Changed
- Import MIDI batch ora inviato al server in unica richiesta con gestione server-side più robusta del dedup interno.
- Validazione schema base PianoVision durante import (`supportingTracks/original/tracksV2`, `tempos`, `timeSignatures`, `song_length`).
- Rifinitura UI pannello Dettagli (spaziature e uniformità pulsanti).
- Visualizer ottimizzato con render window note + throttling frame (migliore performance su brani lunghi).

## [1.0.0] - 2026-03-29
### Added
- Batch import MIDI -> JSON compatibile PianoVision.
- Libreria con filtri, ordinamenti, playlist/tag/preferiti.
- Visualizer verticale con mini tastiera e toggle strumenti attivi.
- Export JSON in ZIP lato browser.
- Import archivio JSON/ZIP.
- Test automatici flusso import/duplicati.

### Changed
- Naming import orientato al filename sorgente (senza auto parsing invasivo).
- Rimozione copy export su `library/exports` durante export utente.

### Notes
- Prima release pubblica consigliata.
