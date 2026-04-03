# PianoVisual v1.0.1

## Highlights
- Import batch più stabile con report dettagliato per ogni file.
- Import archivio JSON/ZIP con validazione schema e policy conflitti (`skip`/`overwrite`).
- Visualizer ottimizzato su brani lunghi (render window + throttling).
- Pannello Dettagli brano ripulito e più uniforme.
- Nuovo launcher Windows e versione desktop installabile (Electron + NSIS).

## Technical
- Endpoint `/api/library/import-batch` e `/api/library/import-json-archive` ora restituiscono `report` completo.
- Nuovi test su import archivio e controlli UI essenziali.
- Base auto-update con `electron-updater` e workflow release su tag `v*`.
