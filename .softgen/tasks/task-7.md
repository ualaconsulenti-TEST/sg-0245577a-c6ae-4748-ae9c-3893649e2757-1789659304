---
title: Area Super Admin
status: in_progress
priority: high
type: feature
tags: [super-admin, tenants, products]
created_by: agent
created_at: 2026-09-17T19:53:36Z
position: 7
---

## Notes
Eseguire solo quanto richiesto. Parte 1: nel componente ProductPreview.tsx mostrare tempo_consegna accanto al tag consegna, senza altre modifiche al modulo Prodotti. Parte 2: aggiungere area Super Admin usando solo tabelle/funzioni già esistenti: super_admins, is_super_admin(), admin_create_tenant, admin_update_tenant_modules, admin_assign_user_to_tenant. Non creare o modificare schema/tabelle. Non toccare login, dashboard clienti o modulo Prodotti oltre alla Parte 1.

## Checklist
- [ ] Verificare schema esistente per super_admins, tenants, tenant_users e funzioni admin senza modificarlo
- [ ] Confermare o applicare in ProductPreview.tsx la visualizzazione di tempo_consegna accanto al tag consegna
- [ ] Verificare dopo login se l'utente è super admin tramite super_admins
- [ ] Mostrare voce menu "Super Admin" solo ai super admin
- [ ] Creare pagina/area Super Admin con elenco tenant, enabled_modules e checkbox moduli disponibili
- [ ] Collegare aggiornamento moduli a admin_update_tenant_modules
- [ ] Aggiungere form "Nuovo cliente" collegato a admin_create_tenant
- [ ] Mostrare utenti tenant con email e form assegnazione collegato a admin_assign_user_to_tenant

## Acceptance
La voce "Super Admin" compare solo per utenti presenti in super_admins.
L'area Super Admin gestisce tenant, moduli e assegnazione utenti usando solo funzioni/tabelle esistenti.
La Parte 1 rimane limitata a ProductPreview.tsx.