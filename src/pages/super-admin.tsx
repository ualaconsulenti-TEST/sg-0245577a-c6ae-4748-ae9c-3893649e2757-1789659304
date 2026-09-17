import { useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { SuperAdminModule } from "@/components/cms/SuperAdminModule";
import { AdminShell, UalaLoadingScreen } from "@/components/cms/UalaCmsApp";
import { useTenantSession } from "@/hooks/use-tenant-session";

export default function SuperAdminPage() {
  const router = useRouter();
  const session = useTenantSession();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      void router.replace("/");
      return;
    }

    if (session.status === "ready" && !session.isSuperAdmin) {
      void router.replace("/");
    }
  }, [router, session.isSuperAdmin, session.status]);

  if (session.status === "loading" || session.status === "unauthenticated" || (session.status === "ready" && !session.isSuperAdmin)) {
    return (
      <>
        <SEO title="Super Admin | UALA CMS" description="Area Super Admin UALA CMS" />
        <UalaLoadingScreen label="Verifico i permessi Super Admin..." />
      </>
    );
  }

  if (session.status === "error" || (!session.tenant && !session.isSuperAdmin)) {
    return (
      <>
        <SEO title="Super Admin | UALA CMS" description="Area Super Admin UALA CMS" />
        <UalaLoadingScreen label={session.error || "Tenant non disponibile."} />
      </>
    );
  }

  return (
    <>
      <SEO title="Super Admin | UALA CMS" description="Gestione clienti, moduli e utenti UALA CMS" />
      <AdminShell
        tenant={session.tenant}
        enabledModules={session.enabledModules}
        isSuperAdmin={session.isSuperAdmin}
        activeModule="super-admin"
        onLogout={session.signOut}
      >
        <SuperAdminModule />
      </AdminShell>
    </>
  );
}