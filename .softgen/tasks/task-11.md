---
title: Collegamento dati dettaglio prodotto
status: in_progress
priority: high
type: feature
tags: [prodotti, dettaglio]
created_by: agent
created_at: 2026-09-18T09:29:02Z
position: 11
---

## Notes
Applicare solo le modifiche richieste alla pagina dettaglio prodotto /prodotti/[slug]. Usare tabelle già esistenti product_benefits, product_highlights, product_faqs senza creare o modificare schema. Sostituire solo i contenuti statici delle sezioni indicate con dati reali filtrati per product_id e ordinati per position.

## Checklist
- [ ] Individuare la pagina dettaglio prodotto /prodotti/[slug]
- [ ] Collegare la sezione Per chi è a long_description rispettando grassetto/corsivo
- [ ] Collegare Cosa ricevi a product_benefits e nascondere la sezione se vuota
- [ ] Collegare Perché farlo a product_highlights e nascondere la sezione se vuota
- [ ] Collegare FAQ a product_faqs e nascondere la sezione se vuota

## Acceptance
La pagina dettaglio prodotto mostra le sezioni richieste usando dati reali del prodotto.
Le sezioni benefits, highlights e FAQ non compaiono quando non hanno righe.