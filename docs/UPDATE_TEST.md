# Verifica aggiornamenti desktop

Procedura riutilizzabile per controllare il passaggio da una release installata alla successiva. La guida storica `UPDATE_TEST_v1.0.1_to_v1.0.2.md` documenta solo quel test iniziale.

## Prima della release
1. Esegui `npm test` e uno smoke test desktop di importazione MIDI, apertura libreria, visualizer ed export JSON.
2. Verifica che `package.json` e `package-lock.json` riportino la stessa nuova versione.
3. Aggiorna `CHANGELOG.md` e crea le note dedicate alla nuova versione.
4. Crea il tag `vX.Y.Z` solo sul commit pronto: il workflow controlla che corrisponda alla versione in `package.json`.
5. Controlla che il workflow `Desktop Release` pubblichi installer Windows e metadati dell'aggiornamento.

## Test di aggiornamento
1. Installa una release precedente ancora disponibile su GitHub e aprila.
2. Importa uno o due JSON di prova e verifica che siano nella libreria.
3. Usa `Aggiornamenti -> Verifica aggiornamenti` e installa la nuova release.
4. Dopo il riavvio, controlla versione visualizzata, apertura della libreria, persistenza dei JSON e funzioni principali.

Il workflow conserva solo le ultime tre release desktop pubblicate; i tag Git restano disponibili, ma le release piu vecchie potrebbero non avere piu un installer scaricabile.
