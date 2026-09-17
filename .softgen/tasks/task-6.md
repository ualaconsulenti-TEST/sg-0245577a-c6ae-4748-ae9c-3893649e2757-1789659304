---
title: Campi catalogo modulo Prodotti
status: in_progress
priority: high
type: feature
tags: [products, form, preview, list]
created_by: agent
created_at: 2026-09-17T17:46:48Z
position: 6
---

## Notes
Aggiornare solo il modulo Prodotti: form, anteprima, elenco. Non toccare login, dashboard, altri moduli. Non modificare tabelle database. Prima verificare che nello schema esistente siano disponibili i campi codice_prodotto, tempo_consegna, peso_kg, video_url, ordine_visualizzazione, note_interne e le tabelle/campi product_images.position già richiesti. Se manca qualcosa o serve una decisione non specificata, fermarsi e chiedere all'utente.

## Checklist
- [ ] Verificare schema esistente per products e product_images senza modificare tabelle
- [ ] Aggiungere nel form codice_prodotto e ordine_visualizzazione in Informazioni base
- [ ] Aggiungere tempo_consegna e peso_kg condizionale in Disponibilità
- [ ] Aggiungere video_url nella sezione Foto e video incorporato in anteprima
- [ ] Aggiungere note_interne in sezione separata senza mostrarle in anteprima
- [ ] Ordinare elenco prodotti per ordine_visualizzazione crescente
- [ ] Mostrare tutte le immagini in anteprima con galleria/carosello ordinata per position
- [ ] Aggiungere pulsante occhio nell'elenco con anteprima modale in sola visualizzazione

## Acceptance
Il form salva i nuovi campi richiesti usando solo lo schema esistente.
L'anteprima mostra video e galleria immagini senza mostrare note interne.
L'elenco è ordinato per ordine_visualizzazione e include l'anteprima modale con icona occhio.