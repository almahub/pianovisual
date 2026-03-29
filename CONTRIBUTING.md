# Contributing

Grazie per il contributo.

## Setup rapido
```bash
npm install
npm start
npm test
```

## Regole base
- Mantieni modifiche piccole e focalizzate.
- Aggiungi test quando tocchi import/duplicati/persistenza.
- Non committare dati locali (`library/json`, backup db, export locali).

## Workflow consigliato
1. Crea branch feature/fix.
2. Implementa e testa (`npm test`).
3. Apri PR con descrizione chiara e passi di verifica.

## Convenzioni
- JavaScript ESM
- Nomi chiari, logica lato server validata
- UI: preferire miglioramenti incrementali senza rompere il flusso base
