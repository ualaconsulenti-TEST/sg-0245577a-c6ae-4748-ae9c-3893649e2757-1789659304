import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSession } from "@/hooks/use-tenant-session";
import type { TenantRecord } from "@/types/uala-cms";

const cmsSupabase = supabase as SupabaseClient;

interface LoadingScreenProps {
  label?: string;
}

interface AdminShellProps {
  tenant: TenantRecord;
  enabledModules: string[];
  activeModule?: string;
  onLogout: () => Promise<void>;
  children: ReactNode;
}

interface DashboardHomeProps {
  enabledModules: string[];
}

export function UalaLoadingScreen({ label = "Caricamento UALA CMS..." }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 h-10 w-10 animate-pulse rounded-2xl bg-fuchsia-600" />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </main>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);

    const { error } = await cmsSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
    }

    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="space-y-6">
            <div>
              <div className="mb-5 space-y-3">
                <Image src="/uala-logo.jpg" alt="UALA Logo" width={144} height={144} className="rounded-xl" />
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-700">UALA CMS</p>
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Il pannello operativo per gestire ogni tenant con chiarezza.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Accedi con il tuo account. UALA CMS carica automaticamente il tenant associato e mostra solo i moduli abilitati.
              </p>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Multi-tenant", "Moduli su permesso", "Accesso sicuro"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950">Accesso amministratore</CardTitle>
              <CardDescription>Inserisci le tue credenziali per accedere.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {loginError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@azienda.it"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-fuchsia-700 hover:bg-fuchsia-800" disabled={isSubmitting}>
                  {isSubmitting ? "Accesso in corso..." : "Entra nel CMS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function TenantErrorScreen({
  error,
  onLogout,
}: {
  error: string | null;
  onLogout: () => Promise<void>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <Card className="w-full max-w-lg border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Tenant non disponibile</CardTitle>
          <CardDescription>Non è possibile completare il caricamento del contesto multi-tenant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert variant="destructive">
            <AlertDescription>{error || "Verifica l'associazione utente-tenant nel database."}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={() => void onLogout()}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export function AdminShell({ tenant, enabledModules, activeModule, onLogout, children }: AdminShellProps) {
  const canUseProducts = enabledModules.includes("prodotti");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image src="/uala-logo.jpg" alt="UALA Logo" width={40} height={40} className="rounded-lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-700">UALA CMS</p>
              <p className="mt-1 text-sm text-slate-600">
                Tenant: <span className="font-semibold text-slate-950">{tenant.name}</span>
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void onLogout()}>
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Moduli attivi</p>
          <nav className="mt-4 space-y-2">
            {canUseProducts ? (
              <Link
                href="/products"
                className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeModule === "prodotti"
                    ? "bg-fuchsia-700 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                Prodotti
              </Link>
            ) : (
              <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
                Nessun modulo disponibile per questo tenant.
              </p>
            )}
          </nav>
          <Separator className="my-4" />
          <p className="px-3 text-xs leading-5 text-slate-500">Le voci compaiono solo se abilitate nel campo enabled_modules del tenant.</p>
        </aside>

        <section>{children}</section>
      </div>
    </main>
  );
}

function DashboardHome({ enabledModules }: DashboardHomeProps) {
  const canUseProducts = enabledModules.includes("prodotti");

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>Seleziona un modulo abilitato per iniziare a lavorare.</CardDescription>
        </CardHeader>
      </Card>

      {canUseProducts ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Prodotti</CardTitle>
            <CardDescription>Gestisci catalogo, prezzi, stato e descrizioni dei prodotti del tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/products"
              className="inline-flex rounded-xl bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-800"
            >
              Apri modulo Prodotti
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Nessun modulo abilitato</CardTitle>
            <CardDescription>Questo tenant non ha moduli disponibili. La navigazione rimane vuota per rispettare i permessi configurati.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

export function UalaCmsApp() {
  const session = useTenantSession();

  if (session.status === "loading") {
    return <UalaLoadingScreen />;
  }

  if (session.status === "unauthenticated") {
    return <LoginScreen />;
  }

  if (session.status === "error" || !session.tenant) {
    return <TenantErrorScreen error={session.error} onLogout={session.signOut} />;
  }

  return (
    <AdminShell tenant={session.tenant} enabledModules={session.enabledModules} onLogout={session.signOut}>
      <DashboardHome enabledModules={session.enabledModules} />
    </AdminShell>
  );
}