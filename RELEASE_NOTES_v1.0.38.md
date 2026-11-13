# PianoVisual v1.0.38

- `Salva Piano` crea una versione fedele alle tracce scelte per le mani, senza modificare il MIDI originale. Una singola traccia puo essere divisa con una soglia MIDI regolabile.
- Il Visualizer mostra un riepilogo delle note delle mani. La conversione automatica resta disponibile con `Converti per Piano` ed e distinta dalla versione fedele.
- L'invio al Quest permette di scegliere i JSON e ne verifica gli hash dopo la copia. I file omonimi modificati richiedono conferma.
- Corretta la migrazione delle riduzioni che poteva spostare un JSON sorgente omonimo, e corretto un falso errore sulle note simultanee della mano sinistra.
- Il riepilogo distingue i MIDI e segnala i JSON mancanti; i vecchi record senza file non vengono cancellati.
- Migliorati il controllo compatibilita, la classificazione delle tracce gravi e la visualizzazione dei titoli con artista ripetuto.

La divisione per altezza puo non riflettere gli incroci delle mani. La qualita della riduzione automatica dipende dal MIDI. Le copertine personali su PianoVision restano non verificate.
