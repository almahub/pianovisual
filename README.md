# PianoVisual Batch Converter

Tool desktop/web locale per convertire **piu file MIDI in JSON compatibile PianoVision** e gestire una libreria di studio. I brani senza artista vengono completati quando il titolo o il nome file ne permette un riconoscimento attendibile; i casi ambigui restano da verificare manualmente.

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

## Verificare la sincronizzazione con GitHub
Da una working copy pulita sul branch `main`, aggiorna prima i riferimenti remoti e controlla lo stato:
```bash
git fetch --tags origin
git status --short --branch
```
La riga di stato indica se il branch locale e `origin/main` sono avanti o indietro. Se il branch locale e indietro e non ci sono modifiche locali da conservare, riallinealo con:
```bash
git pull --ff-only origin main
```
`--ff-only` interrompe l'operazione se serve un merge. Se hai modifiche locali o il branch e avanti, controlla prima `git status` e i commit con `git log --oneline --decorate -10`.
Il repository contiene il template `library/db.example.json` e i due file dimostrativi in `samples/json/`. I dati della libreria personale, incluse le riduzioni in `library/jsonpiano/`, restano locali e non vengono inviati a GitHub.

## Avvio senza VS Code (quick win)
- Windows launcher: `scripts\start-pianovisual.bat`
- Opzionale shortcut desktop:
  1. apri PowerShell nella repo
  2. esegui: `powershell -ExecutionPolicy Bypass -File .\scripts\create-desktop-shortcut.ps1`
  3. usa l'icona `PianoVisual` sul desktop

## App desktop installabile (Electron)
Versione rilasciata piu recente nel repository: **v1.0.33**. Vedi [note di rilascio v1.0.33](RELEASE_NOTES_v1.0.33.md) e [changelog completo](CHANGELOG.md). Nel repository restano solo le ultime tre note di rilascio.

### Backup e ripristino
Nell'app desktop, apri `File e backup` e usa `Backup completo` per salvare in uno ZIP tutta la cartella dati della libreria (database, JSON, riduzioni, export e altri file) insieme a tema e colori del Visualizer. Conserva lo ZIP fuori dalla libreria, preferibilmente anche su un altro disco: non e cifrato e contiene i tuoi dati personali. Per ripristinare, installa PianoVisual, scegli `Ripristina backup` e conferma. L'app verifica lo ZIP e conserva la libreria precedente in una cartella `library.before-restore-*` accanto alla libreria corrente. Lo ZIP non contiene l'eseguibile: la versione originale e indicata nel manifesto e si reinstalla dalla relativa release GitHub.

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
- Guida test end-to-end aggiornata: [docs/UPDATE_TEST.md](docs/UPDATE_TEST.md). La guida `v1.0.1 -> v1.0.2` resta nell'archivio storico.

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
- Vedere `Quest 3` in Esplora file indica solo il collegamento MTP: per i pulsanti di sincronizzazione serve anche che `adb devices` mostri il dispositivo come `device` (non `unauthorized` o `offline`).
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
