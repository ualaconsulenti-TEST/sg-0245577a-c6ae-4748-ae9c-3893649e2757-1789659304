---
title: Products module
status: done
priority: high
type: feature
tags: [products, supabase, module-gating]
created_by: agent
created_at: 2026-09-17T14:53:43Z
position: 2
---

## Notes
Build only the "prodotti" module for now. The module must be visible and reachable only when the logged-in tenant has "prodotti" inside tenants.enabled_modules. Use the existing products table through the standard Supabase client. Never ask the user for tenant_id in the form; database rules handle tenant assignment.

## Checklist
- [x] Add a protected products page that redirects away when "prodotti" is not enabled
- [x] List products for the tenant with name, category, price, discount_price, status
- [x] Add product creation form with name, category, short_description, long_description, price, discount_price, delivery_type, status
- [x] Insert new products without tenant_id and refresh the list after save

## Acceptance
The products menu and page are unavailable when the tenant lacks the "prodotti" module.
A permitted tenant can view products and add a product without entering tenant_id.