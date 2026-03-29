# PianoVisual Batch Converter

Tool desktop/web locale per convertire **piu file MIDI in JSON compatibile PianoVision** e gestire una libreria di studio.

## A cosa serve
- Conversione batch `MIDI -> JSON` (non uno alla volta)
- Report import dettagliato (importato/sovrascritto/scartato/errore) scaricabile
- Organizzazione libreria (playlist, tag, preferiti, metadata)
- Preview/visualizer e strumenti di studio
- Import/Export archivio JSON (anche ZIP) con gestione conflitti

## Per chi e pensato
- Studenti di pianoforte
- Insegnanti
- Creator/arrangiatori che preparano repertori per PianoVision

## Disclaimer legale
- Questo progetto **non e affiliato** a PianoVision o ZarApps.
- L'utente e responsabile dei diritti su MIDI/brani importati/esportati.
- Non caricare o distribuire contenuti protetti senza autorizzazione.

## Requisiti
- Node.js 20+
- Browser moderno

## Avvio
```bash
npm install
npm start
```
Apri `http://localhost:5173`.

## Flusso operativo completo (Quest 3)
1. Importa uno o piu MIDI nella sezione `Importa MIDI`.
2. Premi `Converti Anteprima`.
3. Premi `Importa e salva batch`.
4. Vai su `Export JSON folder` per scaricare lo ZIP.
5. Estrai i JSON e copiali su Quest 3 nel percorso:
   - `Questo PC\Quest 3\Memoria condivisa interna\Android\data\com.ZarApps.PianoVision\files`

## Struttura progetto
- `app.js`: logica frontend (import, UI, visualizer)
- `server.js`: API locale e persistenza
- `library/db.json`: database runtime locale (non versionato)
- `library/db.example.json`: template base versionato
- `library/json/`: JSON convertiti (dati locali, non versionati)
- `tests/`: test automatici flusso import
- `samples/json/`: esempi JSON "safe"

## Formato JSON atteso
Vedi [docs/JSON_FORMAT.md](docs/JSON_FORMAT.md).

## Esempi JSON safe
- [samples/json/example-c-major-scale.json](samples/json/example-c-major-scale.json)
- [samples/json/example-c-major-chords.json](samples/json/example-c-major-chords.json)

## Script
- `npm start`: avvio server locale
- `npm test`: test automatici

## Limitazioni note
- Compatibilita dipende dalla qualita del MIDI sorgente.
- Alcuni metadata (es. artista/compositore) potrebbero richiedere editing manuale.
- Non e un player Oculus: prepara file JSON da copiare in PianoVision.

## Sicurezza
Per segnalazioni, vedi [SECURITY.md](SECURITY.md).

## Contribuire
Vedi [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog
Vedi [CHANGELOG.md](CHANGELOG.md).
