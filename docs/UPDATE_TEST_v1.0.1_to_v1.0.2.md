# Test aggiornamento desktop (v1.0.1 -> v1.0.2)

Questa guida serve per validare il flusso update della build Electron Windows.

## Prerequisiti
- Repository su GitHub con workflow release desktop attivo.
- Release/tag `v1.0.1` con asset Windows già pubblicati.
- Repository pubblica (consigliato per update senza token utente).
- Permessi Actions attivi (`contents: write` già nel workflow).

## 1) Installa la baseline (v1.0.1)
1. Apri la release `v1.0.1` su GitHub.
2. Scarica l'installer Windows (`.exe`) prodotto da electron-builder.
3. Installa e avvia PianoVisual.
4. Verifica che la UI funzioni normalmente.

## 2) Prepara `v1.0.2`
Fai una modifica minima visibile (es. testo in README o micro-fix UI), poi:

```bash
npm version 1.0.2 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): bump version to 1.0.2"
git tag -a v1.0.2 -m "v1.0.2"
git push origin main
git push origin v1.0.2
```

## 3) Build/publish automatico
1. Vai su GitHub Actions -> workflow `Desktop Release`.
2. Controlla run del tag `v1.0.2`.
3. A fine job, verifica che in release `v1.0.2` siano presenti asset Windows (installer + metadata update).

## 4) Verifica update in app
1. Apri l'app installata con `v1.0.1`.
2. Menu `Aggiornamenti` -> `Verifica aggiornamenti`.
3. Attendi notifica update disponibile e download completato.
4. Conferma `Installa ora`.
5. L'app si riavvia e passa a `v1.0.2`.

## 5) Smoke test post-update
- Apertura app regolare.
- Libreria persistente ancora presente.
- Import MIDI batch funzionante.
- Export ZIP funzionante.
- Nessun crash backend.

## Troubleshooting rapido
- Nessun update trovato:
  - controlla che la release `v1.0.2` abbia asset desktop corretti.
  - verifica che il workflow sia andato `success`.
- Download update fallisce:
  - verifica connettività e accesso release GitHub.
- Prompt SmartScreen su Windows:
  - normale se build non firmata con certificato commerciale.

## Nota su firma codice
Le build attuali sono valide per test interno. Per distribuzione pubblica stabile:
- usa certificato Code Signing (EV consigliato),
- configura signing in CI tramite secret (`CSC_LINK`, `CSC_KEY_PASSWORD`).

