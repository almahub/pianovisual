# Release Checklist (Light)

Questa checklist mantiene stabile la linea `main` e riduce regressioni prima di una nuova release.

## Branching
- I tag delle release recenti sono sul branch `main`: crea un nuovo tag solo da un commit verificato su `main`.
- Un branch di sviluppo separato e facoltativo; integra le modifiche in `main` prima dei controlli finali.

## Prima di aprire una release
1. Allinea il branch:
   - `git fetch --tags origin`
   - `git status --short --branch`
   - controlla che il commit da rilasciare sia quello previsto su `main`.
2. Esegui test locali:
   - `npm test`
3. Smoke test rapido:
   - avvio app web (`npm start`)
   - import MIDI batch
   - export JSON zip
   - apertura dettagli brano / visualizer
4. Se desktop:
   - build installer (`npm run dist:win`)
   - avvio installer su macchina pulita (o VM)
5. Aggiorna documentazione release:
   - `CHANGELOG.md`
   - eventuali note release

## Promozione verso stabile
1. Integra eventuali branch di sviluppo in `main`.
2. Controlla CI verde su `main`.
3. Verifica versione in `package.json` e `package-lock.json`.
4. Crea tag release (`vX.Y.Z`) solo dopo check finali.

## Post-release
1. Controlla asset su GitHub Releases.
2. Verifica installazione reale da asset pubblicato.
3. Se tutto ok, marca release come baseline stabile.

