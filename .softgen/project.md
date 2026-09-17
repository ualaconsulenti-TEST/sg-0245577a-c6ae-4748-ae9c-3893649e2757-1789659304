## Vision
UALA CMS is a multi-tenant administration panel for client teams that need a serious, simple workspace to manage enabled modules per tenant.

## Design
--primary: 326 100% 45% (UALA magenta)
--background: 0 0% 100% (clean white)
--foreground: 222 47% 11% (deep slate)
--accent: 326 85% 96% (soft magenta wash)
--muted: 210 40% 96% (light workbench gray)
Heading font: Inter, sans-serif
Body font: Inter, sans-serif
Style direction: clean professional CMS, light surfaces, clear hierarchy, minimal decoration, accessible forms and tables.

## Features
Supabase Auth login with email and password.
Tenant lookup through tenant_users, then tenants.enabled_modules and tenant name.
Dashboard menu is generated only from tenant-enabled modules.
Products module lists and creates products through existing Supabase tables without client-side tenant_id entry.