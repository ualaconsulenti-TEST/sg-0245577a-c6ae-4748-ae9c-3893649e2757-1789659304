import { SEO } from "@/components/SEO";
import { UalaCmsApp } from "@/components/cms/UalaCmsApp";

export default function Home() {
  return (
    <>
      <SEO title="UALA CMS | Pannello amministrazione multi-tenant" description="Pannello UALA CMS con login Supabase, tenant context e moduli abilitati." />
      <UalaCmsApp />
    </>
  );
}