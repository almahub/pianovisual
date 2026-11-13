# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
## [1.0.39] - 2026-11-13
### Changed
- Dashboard Studio con conteggi e collegamenti separati per MIDI, riduzioni pianistiche e strumenti selezionati.
- I record senza MIDI e senza JSON non compaiono nelle viste dei brani disponibili; rimangono conservati finche non vengono gestiti esplicitamente.
- Regole aggiuntive escludono i file audio e MIDI personali da Git e dal pacchetto desktop.

## [1.0.38] - 2026-11-13
### Added
- Piano fedele alle tracce scelte, assegnazione manuale delle mani e divisione di una traccia per nota MIDI.
- Scelta dei JSON da inviare al Quest e verifica hash dopo la copia.

### Fixed
- Protezione dei JSON sorgente durante la migrazione delle riduzioni con lo stesso nome.
- Corretto un falso errore di polifonia della mano sinistra causato dagli arrotondamenti.
- Riepilogo MIDI e segnalazione dei JSON mancanti senza eliminazione automatica dei record.
- Migliorata la classificazione automatica delle tracce molto gravi e la visualizzazione di titoli con artista ripetuto.

### Changed
- Comandi del Visualizer semplificati; il workflow non elimina le release precedenti.

## [1.0.37] - 2026-11-10
### Added
- Controllo indicativo del JSON e copertina per brano mediante URL HTTPS, conservata nei metadati locali.

### Fixed
- Fine delle misure coerente con la mappa dei tempi, anche quando il BPM cambia.
- Metrica 4/4 iniziale quando manca nel MIDI e durata delle note conservata al di sotto del secondo.

## [1.0.36] - 2026-11-10
### Changed
- Artisti, Generi, Preferiti e Playlist sono raccolti in un sottomenu richiudibile della libreria.
- L'archivio JSON precedente e accessibile da File e backup, lasciando in primo piano MIDI e Piano Lab.

## [1.0.35] - 2026-11-10
### Fixed
- Ricollegando un MIDI a un vecchio brano sono conservati metadati, playlist, tag e progressi di studio.
- Il controllo dei MIDI duplicati esclude le versioni derivate di Piano Lab.

## [1.0.34] - 2026-11-10
### Added
- Conservazione dei MIDI originali e download dalla libreria, con versioni indipendenti per strumenti selezionati in Piano Lab.
- Conservazione delle versioni derivate quando la sorgente viene eliminata e indicazione dell'originale mancante.

### Changed
- I JSON precedenti senza MIDI conservato restano disponibili in Brani JSON; il backup completo include MIDI e versioni.

## [1.0.33] - 2026-10-13
### Fixed
- Colori del Visualizer distinti e persistenti per singola traccia, anche quando piu parti hanno lo stesso nome di strumento. Le vecchie preferenze sono migrate.

### Changed
- Rimosso il riquadro Piano Lab ridondante dai dettagli del brano; la conversione dei selezionati resta disponibile.

## [1.0.32] - 2026-10-12
### Added
- Backup completo e ripristino della libreria desktop con database, JSON, export e preferenze; la libreria precedente resta disponibile come copia di sicurezza.

### Changed
- Solo le ultime tre `RELEASE_NOTES` restano nella repo; il changelog conserva la cronologia estesa.

## [1.0.31] - 2026-10-12
### Fixed
- Recupero prudente dell'artista per i brani privi di metadati, usando nomi espliciti e titoli riconoscibili. I valori esistenti non vengono sovrascritti.
- La sincronizzazione da JSON conserva un artista modificato manualmente quando il JSON non ne contiene uno.

## [1.0.30] - 2026-10-10
### Fixed
- Esportazione JSON singola, multipla e da Visualizer: autore, compositore e genere ora seguono i metadati salvati nel catalogo e sono recuperabili alla reimportazione.
- Selezione ed esportazione per singola traccia: parti con lo stesso nome di strumento si possono attivare e filtrare separatamente; le vecchie selezioni per nome restano leggibili.
- Conversione MIDI e import JSON: `supportingTracks[].theirInstrument` usa lo strumento originale quando la corrispondenza delle note e verificabile.

### Added
- Miniature degli artisti nella vista Artisti, recuperate online da Wikipedia con fallback locale e senza scaricare immagini nella libreria.
- Test di importazione isolati dalla libreria musicale reale.

## [1.0.29] - 2026-10-10
### Added
- Esportazione multipla dei JSON filtrati secondo gli strumenti attivi salvati per ogni brano, senza cambiare il titolo dei file.
- Gestione playlist dalla vista dedicata, con creazione, rinomina ed eliminazione confermata.
- Scelta del colore e delle tracce attive del Visualizer salvata per brano.

### Changed
- Il Visualizer carica le tracce direttamente dai JSON e il pannello dettagli resta visibile durante lo scorrimento della libreria.
- Le nuove riduzioni Piano Lab mantengono titolo e nome file del brano originale; i vecchi file non vengono rinominati.
- L'import JSON conserva arrangiamenti diversi dello stesso brano e rende distinguibili i file sorgente con titoli uguali.
- La rilevazione Quest distingue MTP e autorizzazione ADB.
- `npm test` usa `node --test` per funzionare anche su Windows.
- La libreria musicale e i database locali restano fuori dal repository e dall'installer.

## [1.0.28] - 2026-09-03
### Changed
- La mano sinistra delle riduzioni usa accordi compatti con basso e piu note armoniche; sugli accordi di settima affidabili puo usare fino a quattro note.
- La validazione controlla la distanza tra note adiacenti e l'estensione della mano sinistra.

## [1.0.27] - 2026-09-02
### Fixed
- La mano sinistra delle riduzioni e stata semplificata con basso e nota guida entro un'ottava, evitando estensioni e sovrapposizioni difficili da suonare.

## [1.0.26] - 2026-08-31
### Changed
- Le riduzioni adottano due mani: melodia a destra, armonia e basso a sinistra; rimossa la scelta tra modalita piano solo e piano con voce.

## [1.0.25] - 2026-08-29
### Added
- Arrangiamento delle riduzioni guidato dagli accordi, con note di accompagnamento e basso associate all'armonia rilevata.

## [1.0.24] - 2026-08-29
### Added
- Le tracce originali non usate nella riduzione sono disponibili separatamente come accompagnamento nel visualizer.
- L'analisi della riduzione conserva gli indici delle tracce sorgente per distinguere mani e accompagnamento.

## [1.0.23] - 2026-08-29
### Added
- Pulsante `Esporta su Piano` sotto l’export del Visualizer per creare una riduzione usando soltanto le tracce attive.
- Sostituzione confermata della riduzione esistente quando si esporta nuovamente lo stesso brano verso Piano Lab.

### Changed
- Una selezione contenente soltanto la melodia lascia vuote armonia e mano sinistra invece di duplicare note inesistenti.
- I BPM nella tabella dei brani sono visualizzati con due cifre decimali.

## [1.0.22] - 2026-08-29
### Added
- Avviso prima della conversione multipla quando la selezione contiene copie dello stesso brano.
- Protezione server che impedisce di creare più riduzioni dalla stessa sorgente musicale equivalente.

### Fixed
- Il riconoscimento degli accordi esclude la melodia, evitando che le note di passaggio producano accordi falsi.
- Armonia e basso vengono allineati alle note dell’accordo attivo, conservando timing, durata e velocity della sorgente.
- Le note sostenute vengono divise correttamente quando attraversano un cambio di accordo.

## [1.0.21] - 2026-08-28
### Added
- Conversione multipla in Piano Lab dei brani selezionati nella libreria completa.
- Avanzamento della coda e report finale con riduzioni create, brani già presenti ed eventuali errori.

### Changed
- Le conversioni multiple vengono elaborate una alla volta per mantenere stabile il computer e lasciare invariati i brani originali.

## [1.0.20] - 2026-08-28
### Added
- Libreria fisica dedicata ai brani piano in `library/jsonpiano`, indicizzata separatamente da `library/dbpiano.json`.
- Migrazione automatica e non distruttiva delle riduzioni create dalle versioni precedenti.

### Changed
- Le riduzioni sono nominate con il formato “Nome brano piano”, senza la dicitura “Riduzione piano”.
- Importazione JSON, riallineamento da disco, backup ZIP e sincronizzazione Quest rispettano entrambe le librerie.

## [1.0.19] - 2026-08-27
### Added
- Nuova area visivamente separata “Piano Lab” con libreria dedicata alle riduzioni pianistiche.
- Integrazione locale della skill `music-to-piano-json` per analizzare melodia, armonia e basso e ricostruire `tracksV2`.
- Creazione non distruttiva di una riduzione collegata al brano completo originale.
- Riproduzione delle riduzioni tramite tracce distinte “Piano mano destra” e “Piano mano sinistra”.
- Motore autonomo incluso nel setup Windows, senza necessità di installare Python nell’app distribuita.

### Changed
- La libreria standard mostra soltanto i brani completi; le riduzioni sono conteggiate e consultate esclusivamente in Piano Lab.

## [1.0.18] - 2026-08-27
### Changed
- Barra laterale alleggerita con gruppi richiudibili per Studio, File e backup, Quest 3 e Aspetto.
- Le azioni della Libreria sono mostrate solo nella vista Libreria e quelle secondarie sono raccolte in un menu.
- Nel dettaglio brano restano in primo piano Visualizer e selezione strumenti; metadati e altre azioni sono richiudibili.
- Stili coerenti nei temi chiaro e scuro per i nuovi gruppi e menu.

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
