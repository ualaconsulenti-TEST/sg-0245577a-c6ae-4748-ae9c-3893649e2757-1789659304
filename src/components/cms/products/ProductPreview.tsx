import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "@/types/uala-cms";
import { formatCurrency, formatDate, isFutureDate } from "./productUtils";

interface ProductPreviewProps {
  form: ProductFormValues;
  isSaving: boolean;
  onBack: () => void;
  onPublishNow: () => void;
  onSchedule: (publishAt: string) => void;
}

function FormattedDescription({ value }: { value: string }) {
  const parts = value.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);

  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
        }

        if (part.startsWith("_") && part.endsWith("_")) {
          return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </p>
  );
}

export function ProductPreview({ form, isSaving, onBack, onPublishNow, onSchedule }: ProductPreviewProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const coverImage = form.images[0]?.image_url;

  function handleSchedule(): void {
    if (!showScheduler) {
      setShowScheduler(true);
      return;
    }

    if (!scheduledAt) {
      setScheduleError("Seleziona data e ora di pubblicazione.");
      return;
    }

    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setScheduleError("Scegli una data futura per programmare la pubblicazione.");
      return;
    }

    setScheduleError(null);
    onSchedule(scheduledAt);
  }

  return (
    <Card className="border-fuchsia-200 shadow-sm">
      <CardHeader>
        <CardTitle>Anteprima prodotto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scheduleError ? (
          <Alert variant="destructive">
            <AlertDescription>{scheduleError}</AlertDescription>
          </Alert>
        ) : null}

        <article className="overflow-hidden rounded-3xl border border-fuchsia-100 bg-white">
          {coverImage ? (
            <img src={coverImage} alt={form.name || "Anteprima prodotto"} className="h-72 w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center bg-fuchsia-50 text-sm text-slate-500">Nessuna foto caricata</div>
          )}

          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {form.badge.trim() ? <Badge className="mb-3 bg-primary text-white">{form.badge.trim()}</Badge> : null}
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{form.name || "Nome prodotto"}</h2>
                <p className="mt-2 text-sm text-slate-500">{form.category || "Categoria"}</p>
              </div>
              <div className="text-right">
                {form.discount_price.trim() ? (
                  <>
                    <p className="text-sm text-slate-400 line-through">{formatCurrency(form.price)}</p>
                    <p className="text-2xl font-semibold text-primary">{formatCurrency(form.discount_price)}</p>
                  </>
                ) : (
                  <p className="text-2xl font-semibold text-slate-950">{formatCurrency(form.price)}</p>
                )}
                {isFutureDate(form.promo_scade_il) ? (
                  <p className="mt-1 text-xs font-medium text-primary">Promo fino al {formatDate(form.promo_scade_il)}</p>
                ) : null}
              </div>
            </div>

            {form.short_description.trim() ? <p className="text-base leading-7 text-slate-700">{form.short_description.trim()}</p> : null}
            {form.long_description.trim() ? <FormattedDescription value={form.long_description.trim()} /> : null}

            <div className="rounded-2xl bg-fuchsia-50 px-4 py-3 text-sm text-slate-700">
              {form.delivery_type === "digitale" ? "Consegna digitale" : form.sold_out ? "Prodotto esaurito" : `Disponibilità fisica${form.stock ? `: ${form.stock} pezzi` : ""}`}
            </div>
          </div>
        </article>

        {showScheduler ? (
          <div className="space-y-2 rounded-2xl border border-fuchsia-100 p-4">
            <label htmlFor="publish-at" className="text-sm font-medium text-slate-700">
              Data e ora di pubblicazione
            </label>
            <Input id="publish-at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            Modifica
          </Button>
          <Button type="button" className="bg-primary hover:bg-primary/90" onClick={onPublishNow} disabled={isSaving}>
            {isSaving ? "Salvataggio..." : "Pubblica ora"}
          </Button>
          <Button type="button" variant="outline" onClick={handleSchedule} disabled={isSaving}>
            Programma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}