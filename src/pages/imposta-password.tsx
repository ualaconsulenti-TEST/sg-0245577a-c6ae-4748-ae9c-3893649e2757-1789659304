import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SEO } from "@/components/SEO";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const cmsSupabase = supabase as SupabaseClient;

export default function ImpostaPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await cmsSupabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setFeedback("Password impostata correttamente. Accesso in corso...");
    void router.replace("/");
  }

  return (
    <>
      <SEO title="Imposta password | UALA CMS" description="Imposta la password per accedere a UALA CMS" />
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
        <Card className="w-full max-w-md border-fuchsia-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Imposta password</CardTitle>
            <CardDescription>Inserisci una nuova password per completare l'accesso al CMS.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {feedback ? (
                <Alert className="border-fuchsia-200 bg-fuchsia-50 text-slate-800">
                  <AlertDescription>{feedback}</AlertDescription>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                {isSubmitting ? "Impostazione in corso..." : "Imposta password e accedi"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}