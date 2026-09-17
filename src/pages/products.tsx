import { useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { AdminShell, UalaLoadingScreen } from "@/components/cms/UalaCmsApp";
import { ProductsModule } from "@/components/cms/ProductsModule";
import { useTenantSession } from "@/hooks/use-tenant-session";

export default function ProductsPage() {
  const router = useRouter();
  const session = useTenantSession();
  const canAccessProducts = session.hasModule("prodotti");

  useEffect(() => {
    if (session.status === "unauthenticated") {
      void router.replace("/");
      return;
    }

    if (session.status === "ready" && !canAccessProducts) {
      void router.replace("/");
    }
  }, [canAccessProducts, router, session.status]);

  if (session.status === "loading" || session.status === "unauthenticated" || (session.status === "ready" && !canAccessProducts)) {
    return (
      <>
        <SEO title="Prodotti | UALA CMS" description="Modulo prodotti UALA CMS" />
        <UalaLoadingScreen label="Verifico i permessi del modulo..." />
      </>
    );
  }

  if (session.status === "error" || !session.tenant) {
    return (
      <>
        <SEO title="Prodotti | UALA CMS" description="Modulo prodotti UALA CMS" />
        <UalaLoadingScreen label={session.error || "Tenant non disponibile."} />
      </>
    );
  }

  return (
    <>
      <SEO title="Prodotti | UALA CMS" description="Gestione prodotti del tenant in UALA CMS" />
      <AdminShell tenant={session.tenant} enabledModules={session.enabledModules} activeModule="prodotti" onLogout={session.signOut}>
        <ProductsModule />
      </AdminShell>
    </>
  );
}