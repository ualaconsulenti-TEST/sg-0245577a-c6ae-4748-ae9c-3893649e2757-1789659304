---
title: Pagina impostazione password invito
status: in_progress
priority: high
type: feature
tags: [super-admin, auth, invite]
created_by: agent
created_at: 2026-09-17T21:14:13Z
position: 8
---

## Notes
Creare una nuova pagina `/imposta-password` per completare l'invito Supabase impostando una nuova password con `supabase.auth.updateUser`. Aggiornare solo `SuperAdminModule.tsx` per passare `redirect_to` alla Edge Function `invite-tenant-user` con valore `window.location.origin + "/imposta-password"`.

## Checklist
- [ ] Creare `src/pages/imposta-password.tsx` con form "Nuova password" e "Conferma password"
- [ ] Validare che le due password coincidano prima di chiamare `supabase.auth.updateUser({ password })`
- [ ] Reindirizzare alla dashboard principale del CMS dopo successo
- [ ] Aggiungere `redirect_to` nel body della chiamata `invite-tenant-user` in `SuperAdminModule.tsx`

## Acceptance
La pagina `/imposta-password` permette a un invitato di impostare la password e accedere.
Gli inviti Super Admin passano alla Edge Function il redirect dinamico corretto.