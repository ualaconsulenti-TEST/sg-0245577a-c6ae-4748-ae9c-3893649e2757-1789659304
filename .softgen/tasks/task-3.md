---
title: Modulo Prodotti avanzato
status: in_progress
priority: high
type: feature
tags: [products, supabase, catalog]
created_by: agent
created_at: 2026-09-17T16:24:39Z
position: 3
---

## Notes
Aggiornare solo il modulo Prodotti esistente. Non toccare login, dashboard generale, database schema o altri moduli. Usare solo letture/scritture Supabase su products e product_images come già strutturate. Il modulo deve gestire lista, form creazione/modifica, immagini, anteprima prima del salvataggio, pubblicazione immediata e programmazione.

## Checklist
- [ ] Ispezionare schema Supabase esistente per products e product_images senza modificarlo
- [ ] Aggiornare elenco prodotti con badge, stati colorati, promo futura, filtro archiviati e azioni Modifica/Elimina/Pausa/Riattiva
- [ ] Ricostruire form prodotto in sezioni: informazioni base, prezzo, descrizioni, foto, SEO, disponibilità
- [ ] Aggiungere gestione immagini multiple con miniature, riordino e cancellazione tramite product_images
- [ ] Aggiungere anteprima prima del salvataggio con Modifica, Pubblica ora e Programma
- [ ] Salvare creazione/modifica prodotti e immagini usando Supabase senza chiedere tenant_id

## Acceptance
Il modulo Prodotti permette di creare, modificare, pubblicare, programmare, mettere in pausa, riattivare, archiviare/eliminare e filtrare prodotti senza modificare altri moduli.
L'anteprima appare prima del salvataggio e mantiene i dati quando si torna al form.
Le immagini prodotto vengono mostrate in miniatura, riordinate e cancellate tramite la tabella product_images.