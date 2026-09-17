---
title: Aggiornamenti IVA modulo Prodotti
status: in_progress
priority: high
type: feature
tags: [products, form, preview, list]
created_by: agent
created_at: 2026-09-17T17:34:55Z
position: 5
---

## Notes
Aggiornare solo il modulo Prodotti: form, anteprima, elenco. Non toccare login, dashboard, altri moduli. Non modificare file o tabelle non necessari. Prima verificare se il campo iva_inclusa è disponibile nello schema esistente; se manca o serve una decisione non specificata, fermarsi e chiedere all'utente.

## Checklist
- [ ] Verificare lo schema esistente per il campo iva_inclusa senza modificare tabelle
- [ ] Aggiungere nella sezione Prezzo il controllo "Prezzo + IVA" / "Prezzo IVA inclusa" salvato in iva_inclusa
- [ ] Mostrare nell'elenco prodotti la dicitura "+ IVA" o "IVA inclusa" vicino al prezzo
- [ ] Mostrare nell'anteprima prodotto la dicitura "+ IVA" o "IVA inclusa" vicino al prezzo
- [ ] Rinominare solo le etichette visibili: Badge e Slug
- [ ] Mostrare countdown live in anteprima quando mostra_countdown e promo_scade_il sono valorizzati
- [ ] Mostrare "Solo [numero] disponibili" in anteprima quando quantita_disponibile è valorizzato
- [ ] Aggiungere la didascalia richiesta sotto "Esaurito manualmente"

## Acceptance
Il modulo Prodotti include solo le modifiche richieste su form, anteprima ed elenco.
Nessun file di login, dashboard o altri moduli viene modificato.