---
title: Controlli avanzati Super Admin
status: done
priority: high
type: feature
tags: [super-admin, tenant-status, activity-log]
created_by: agent
created_at: 2026-09-17T21:34:00Z
position: 9
---

## Notes
Implementare solo quanto richiesto: pagina Super Admin con sospensione/riattivazione tenant, eliminazione cliente con conferma digitando il nome, gestione utenti collegati con stato conferma, ultimo accesso, rimozione e cambio ruolo, ricerca clienti lato client e registro attività. Aggiornare solo il caricamento tenant dell'app normale per bloccare tenant sospesi e chiamare touch_my_last_login una sola volta per tenant attivi. Non modificare login, dashboard clienti, modulo Prodotti, imposta-password o database.

## Checklist
- [x] Verificare firme delle funzioni database già esistenti indicate dall'utente
- [x] Aggiornare i tipi usati da Super Admin per status tenant, confermato, last_login_at e registro attività
- [x] Aggiornare SuperAdminModule con ricerca clienti, sospensione/riattivazione, eliminazione, gestione utenti e registro attività
- [x] Aggiornare il caricamento tenant normale per bloccare tenant sospesi e chiamare touch_my_last_login una sola volta
- [x] Validare con controllo errori

## Acceptance
La pagina Super Admin espone solo i nuovi controlli richiesti.
Gli utenti normali con tenant sospeso vedono il messaggio di blocco.
Gli utenti normali con tenant attivo registrano l'ultimo accesso dopo il caricamento tenant.