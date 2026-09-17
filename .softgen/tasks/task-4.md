---
title: Estensioni modulo Prodotti
status: in_progress
priority: high
type: feature
tags: [products, supabase, catalog]
created_by: agent
created_at: 2026-09-17T17:20:51Z
position: 4
---

## Notes
Aggiornare solo il modulo Prodotti: form, anteprima, elenco. Non toccare login, dashboard generale o altri moduli. Usare solo le tabelle esistenti products, product_images e product_related come sono strutturate ora. Se mancano campi o tabelle richiesti, fermarsi e chiedere all'utente.

## Checklist
- [ ] Verificare schema esistente per products, product_images e product_related senza modificarlo
- [ ] Aggiungere nel form "Prodotto in evidenza" salvato in evidenza
- [ ] Aggiungere sezione "Urgenza e disponibilità" con mostra_countdown e quantita_disponibile
- [ ] Aggiungere alt_text per ogni foto nella sezione Foto
- [ ] Aggiungere sezione "Prodotti correlati" con selezione multipla e salvataggio in product_related
- [ ] Aggiungere contatori caratteri SEO per seo_title e seo_description
- [ ] Aggiungere pulsante Duplica nell'elenco prodotti con slug vuoto e status bozza
- [ ] Mostrare etichetta "In evidenza" nell'elenco quando in_evidenza è vero

## Acceptance
Il modulo Prodotti salva e mostra solo i nuovi dati richiesti usando le tabelle esistenti.
L'elenco include Duplica e l'etichetta In evidenza senza modificare login, dashboard o altri moduli.