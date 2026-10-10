# PianoVisual v1.0.30

Aggiornamento desktop per Windows del 10 ottobre 2026.

## Correzioni
- I JSON esportati includono i metadati del catalogo (titolo, artista, compositore e genere), anche nei download multipli.
- Il Visualizer salva la selezione per traccia: due parti con lo stesso nome, per esempio due tracce Piano, possono essere filtrate separatamente. Le selezioni precedenti per nome sono mantenute.
- L'esportazione JSON filtrata conserva solo le tracce selezionate, da una a tutte, e riallinea anche le tracce di accompagnamento quando presenti.
- I nuovi MIDI usano il numero di strumento corretto in `supportingTracks`. Durante l'importazione, i vecchi JSON con mappatura a zero vengono riparati solo se le note coincidono con le tracce originali.

## Artisti
- Nella vista Artisti compaiono, quando disponibili, foto da Wikipedia. Le miniature richiedono Internet e non sono incluse nella libreria musicale o nei JSON.

## Aggiornamento
L'installer e i metadati per l'aggiornamento automatico sono pubblicati nella release GitHub. La libreria e i database personali restano nella cartella dati utente e non sono inclusi nell'installer.

I nomi degli artisti gia persi dai precedenti JSON esportati non possono essere ricostruiti automaticamente da questo aggiornamento. Per ripristinarli serve una copia precedente del database oppure una verifica manuale. La compatibilita musicale completa dei nuovi JSON filtrati richiede ancora una prova di riproduzione su Quest.
