---
title: Tenant authentication shell
status: in_progress
priority: urgent
type: feature
tags: [auth, supabase, multi-tenant]
created_by: agent
created_at: 2026-09-17T14:53:43Z
position: 1
---

## Notes
Build UALA CMS as a clean professional multi-tenant admin panel. Use Supabase Auth for email/password login. After login, fetch tenant_users by logged-in user_id, then fetch the matching tenant from tenants and read name plus enabled_modules. Do not create or modify database schema. Product UI copy remains Italian because the original application brief was written in Italian.

## Checklist
- [ ] Create a serious lightweight design foundation for the CMS shell
- [ ] Add login screen using Supabase Auth email/password
- [ ] Load tenant context from tenant_users and tenants for the authenticated user
- [ ] Show tenant name and persistent Logout action in the top bar
- [ ] Render dashboard navigation only from enabled_modules

## Acceptance
The user can log in with Supabase Auth and sees only the enabled module links for their tenant.
The tenant name and Logout button are always visible after authentication.