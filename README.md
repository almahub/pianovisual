# PianoVisual Batch Converter

Tool desktop/web locale per convertire **piu file MIDI in JSON compatibile PianoVision** e gestire una libreria di studio.

## A cosa serve
- Conversione batch `MIDI -> JSON` (non uno alla volta)
- Report import dettagliato (importato/sovrascritto/scartato/errore) scaricabile
- Organizzazione libreria (playlist, tag, preferiti, metadata)
- Preview/visualizer e strumenti di studio
- Import/Export archivio JSON (anche ZIP) con gestione conflitti
- Import ricorsivo di intere cartelle JSON
- Sincronizzazione opzionale con Quest 3 via ADB (anteprima hash, nessuna cancellazione automatica)

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

## Avvio web (classico)
```bash
npm install
npm start
```
Apri `http://localhost:5173`.

## Avvio senza VS Code (quick win)
- Windows launcher: `scripts\start-pianovisual.bat`
- Opzionale shortcut desktop:
  1. apri PowerShell nella repo
  2. esegui: `powershell -ExecutionPolicy Bypass -File .\scripts\create-desktop-shortcut.ps1`
  3. usa l'icona `PianoVisual` sul desktop

## App desktop installabile (Electron)
### Avvio desktop locale
```bash
npm install
npm run desktop
```

### Build installer Windows (.exe)
```bash
npm run dist:win
```
Output in `dist/` (installer NSIS).

### Upgrade automatici nel tempo
- Il progetto usa `electron-updater` + GitHub Releases.
- Workflow `Desktop Release` builda e pubblica asset Windows su push tag `v*`.
- Nell'app installata: menu `Aggiornamenti -> Verifica aggiornamenti`.
- Per update senza token utente, la repository/release deve essere pubblica.
- Guida test end-to-end: [docs/UPDATE_TEST_v1.0.1_to_v1.0.2.md](docs/UPDATE_TEST_v1.0.1_to_v1.0.2.md)

## Flusso operativo completo (Quest 3)
1. Importa uno o piu MIDI nella sezione `Importa MIDI`.
2. Premi `Converti Anteprima`.
3. Premi `Importa e salva batch`.
4. Vai su `Export JSON folder` per scaricare lo ZIP.
5. Estrai i JSON e copiali su Quest 3 nel percorso:
   - `Questo PC\Quest 3\Memoria condivisa interna\Android\data\com.ZarApps.PianoVision\files`

### Sincronizzazione Quest 3 via ADB (desktop)
- Installa Android SDK Platform Tools e assicurati che `adb` sia disponibile nel `PATH`.
- Abilita la modalita sviluppatore/debug USB sul Quest e autorizza il computer nel visore.
- Usa `Rileva Quest 3`, quindi scegli `Importa JSON dal Quest` oppure `Invia JSON al Quest`.
- Prima dell'invio PianoVisual confronta gli hash e mostra nuovi, modificati e gia uguali.
- La sincronizzazione non elimina mai automaticamente file dal Quest.

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
- `npm run desktop`: avvio app desktop Electron
- `npm run dist:win`: build installer Windows
- `npm test`: test automatici

## Limitazioni note
- Compatibilita dipende dalla qualita del MIDI sorgente.
- Alcuni metadata (es. artista/compositore) potrebbero richiedere editing manuale.
- Non e un player Oculus: prepara file JSON da copiare in PianoVision.

## Sicurezza
Per segnalazioni, vedi [SECURITY.md](SECURITY.md).

## Contribuire
Vedi [CONTRIBUTING.md](CONTRIBUTING.md).
Checklist rilascio: [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

## Changelog
Vedi [CHANGELOG.md](CHANGELOG.md).
