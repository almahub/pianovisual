# Roadmap

Questa roadmap definisce le priorita evolutive del progetto dopo la release `v1.0.0`.

## Principi
- Affidabilita prima delle feature.
- Migliorare flusso reale utente: `MIDI -> JSON -> Quest 3`.
- Mantenere il tool semplice da usare e da contribuire.

## v1.1 (Stabilizzazione)
Obiettivo: rendere il prodotto robusto nell'uso quotidiano.

### Priorita alta
- [ ] Chiudere bug critici import batch (dedup, skip/overwrite, conteggi finali).
- [ ] Report import finale dettagliato (importati/saltati/duplicati + motivi).
- [ ] Migliorare messaggi d'errore lato UI (chiari e azionabili).
- [ ] Hardening I/O: gestione edge case file mancanti/corrotti.

### Priorita media
- [ ] Test aggiuntivi su casi reali di import multiplo.
- [ ] Riepilogo post-export con conferma file scaricati.
- [ ] Piccoli miglioramenti UX nel pannello dettagli/metadata.

### Criteri di uscita v1.1
- Zero bug bloccanti aperti su import/export.
- Test automatici verdi + nuovi test su regressioni note.
- Almeno 1 ciclo di uso reale con feedback positivo.

## v1.2 (Operativita e manutenzione)
Obiettivo: facilitare backup, migrazione e manutenzione nel tempo.

### Priorita alta
- [ ] `schemaVersion` in `db.json` + migrazioni automatiche.
- [ ] Backup completo e ripristino completo (`db + json`) con validazione.
- [ ] Strumento di riallineamento DB/JSON integrato in UI (non solo script manuale).

### Priorita media
- [ ] Logging strutturato locale (import, export, errori).
- [ ] Wizard onboarding iniziale (guida rapida flusso Quest 3).
- [ ] Pulizia/normalizzazione metadata opzionale assistita.

### Criteri di uscita v1.2
- Ripristino riuscito da backup su installazione pulita.
- Migrazione schema verificata su DB di versioni precedenti.
- Riduzione segnalazioni su incoerenza libreria.

## v2.0 (Distribuzione e scala)
Obiettivo: rendere il progetto più accessibile a utenti non tecnici e contributor.

### Priorita alta
- [ ] Pacchetto distribuzione semplice (desktop app o installer dedicato).
- [ ] Migliore separazione moduli (UI, import engine, storage, visualizer).
- [ ] Test end-to-end principali sul flusso completo.

### Priorita media
- [ ] Telemetria opt-in anonima per errori operativi.
- [ ] Preset workflow utente (studio, organizzazione, export rapido).
- [ ] Miglior supporto grandi librerie (performance, ricerca avanzata).

### Criteri di uscita v2.0
- Setup in pochi minuti senza conoscenze Node.
- Flusso principale coperto da test E2E.
- Documentazione completa per utenti e contributor.

## Backlog continuo
- [ ] Migliorie visualizer (leggibilita, modalità alternative).
- [ ] Filtri smart aggiuntivi (strumento, periodo, livello studio).
- [ ] Export JSON filtrato avanzato (scelte per traccia/mano).
- [ ] UX accessibilita e internationalization.

## Come contribuire alla roadmap
- Apri issue con etichetta `roadmap`.
- Collega PR alla milestone (`v1.1`, `v1.2`, `v2.0`).
- Mantieni scope piccolo e verificabile per ogni PR.
