# Changelog

All notable changes to this project will be documented in this file.

## [1.0.17] - 2026-08-24
### Fixed
- Il contatore dell’export usa gli strumenti realmente caricati dal JSON invece dei soli metadati della libreria.
- Attivare o disattivare uno strumento ricostruisce immediatamente l’audio e riprende dalla posizione corrente.
- Le note già programmate dello strumento disattivato vengono interrotte e non restano udibili.

## [1.0.16] - 2026-08-24
### Fixed
- L’export dal Visualizer filtra coerentemente `supportingTracks`, tracce originali, strumenti, canali e durata.
- `tracksV2` viene rigenerato usando soltanto gli strumenti selezionati, evitando note residue in PianoVision.
- Il pulsante di export mostra il numero di strumenti che verranno inclusi.

## [1.0.15] - 2026-08-24
### Fixed
- Il ritorno di un JSON dal Quest o da una cartella riconosce il contenuto già presente anche quando manca l’artista.
- Il riallineamento da disco conserva separatamente l’hash MIDI e l’hash JSON, evitando duplicati alle importazioni successive.

## [1.0.14] - 2026-08-24
### Fixed
- L’esportazione completa crea un unico archivio ZIP tramite una finestra di salvataggio desktop.
- Bloccato il salvataggio dell’export dentro la cartella sorgente `library/json`, evitando copie e duplicati nella libreria.

## [1.0.13] - 2026-08-24
### Fixed
- La colonna laterale ora scorre verticalmente e rende raggiungibili Tema e tutte le sezioni sotto Quest 3 anche su schermi bassi.

## [1.0.12] - 2026-08-07
### Changed
- Schermata Importa MIDI riorganizzata per distinguere conversione MIDI, import JSON, URL e opzioni avanzate.
- Home ridisegnata con riepilogo libreria, azioni rapide e ultimi brani importati.
- Migliorata la leggibilità dei nuovi pannelli nei temi chiaro e scuro e nelle finestre strette.

## [1.0.11] - 2026-08-07
### Changed
- Controlli strumento compatti e cliccabili direttamente sotto il visualizer.
- Riproduzione, grafico ed export JSON filtrato condividono la stessa selezione di strumenti.

## [1.0.10] - 2026-08-06
### Added
- Import ricorsivo di cartelle JSON con le policy di deduplicazione e conflitto esistenti.
- Sincronizzazione desktop Quest 3 via ADB: rilevamento dispositivo, import dal visore e invio differenziale basato su hash.
- Anteprima prima dell'invio al Quest e garanzia di nessuna cancellazione automatica.

## [1.0.9] - 2026-08-06
### Added
- Catalogo remoto Kara per Tutti con elenco artisti, apertura cartelle e ricerca globale per artista o titolo.
- Selezione fino a 20 brani remoti con conversione JSON o importazione diretta nella libreria.
- Download MIDI differito fino all'azione esplicita dell'utente e validazione server-side di percorsi e contenuti.

## [1.0.8] - 2026-07-25
### Added
- Eliminazione multipla dei brani selezionati dalla libreria, con conferma unica e conteggio degli elementi.

### Changed
- Gli eventuali brani non eliminati durante un’operazione multipla restano selezionati per consentire un nuovo tentativo.

## [1.0.1] - 2026-03-29
### Added
- Report import dettagliato per file (importato/sovrascritto/scartato/errore) con download JSON dal pannello Import.
- Opzioni import archivio JSON/ZIP: policy conflitti (`skip`/`overwrite`) e dedup interno (`keep_first`/`keep_last`).
- Legenda colori strumenti nel visualizer con stato attivo/inattivo.
- Test aggiuntivi per import archivio (skip/overwrite) e test UI minimo sui controlli critici.
- Launcher Windows (`scripts/start-pianovisual.bat`) e script shortcut desktop.
- Packaging desktop con Electron + installer NSIS (`npm run dist:win`).
- Base aggiornamenti automatici via `electron-updater` + workflow release desktop su tag.

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
