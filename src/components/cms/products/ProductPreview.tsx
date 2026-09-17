import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "@/types/uala-cms";
import { formatCurrency, formatDate, isFutureDate } from "./productUtils";

interface ProductPreviewProps {
  form: ProductFormValues;
  isSaving?: boolean;
  mode?: "edit" | "readonly";
  onBack?: () => void;
  onPublishNow?: () => void;
  onSchedule?: (publishAt: string) => void;
}

type PreviewMediaItem =
  | {
      type: "image";
      imageUrl: string;
      altText: string;
    }
  | {
      type: "video";
      embedUrl: string;
    };

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

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days} giorni, ${hours} ore, ${minutes} minuti, ${seconds} secondi`;
}

function videoEmbedUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);
    const host = url.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function ProductPreview({ form, isSaving = false, mode = "edit", onBack, onPublishNow, onSchedule }: ProductPreviewProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const sortedImages = useMemo(() => form.images.slice().sort((first, second) => first.position - second.position), [form.images]);
  const embedUrl = videoEmbedUrl(form.video_url);
  const mediaItems = useMemo<PreviewMediaItem[]>(() => {
    const imageItems = sortedImages.map((image) => ({
      type: "image" as const,
      imageUrl: image.image_url,
      altText: image.alt_text || form.name || "Anteprima prodotto",
    }));

    return embedUrl ? [...imageItems, { type: "video" as const, embedUrl }] : imageItems;
  }, [embedUrl, form.name, sortedImages]);
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0];
  const vatLabel = form.iva_inclusa ? "IVA inclusa" : "+ IVA";
  const availableQuantity = form.quantita_disponibile.trim();
  const deliveryTime = form.tempo_consegna.trim();

  useEffect(() => {
    if (activeMediaIndex >= mediaItems.length) {
      setActiveMediaIndex(0);
    }
  }, [activeMediaIndex, mediaItems.length]);

  useEffect(() => {
    if (!form.mostra_countdown || !form.promo_scade_il) {
      setRemainingMs(null);
      return;
    }

    function updateCountdown(): void {
      setRemainingMs(new Date(form.promo_scade_il).getTime() - Date.now());
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [form.mostra_countdown, form.promo_scade_il]);

  function handleSchedule(): void {
    if (!onSchedule) {
      return;
    }

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

  function showPreviousMedia(): void {
    setActiveMediaIndex((currentIndex) => (currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1));
  }

  function showNextMedia(): void {
    setActiveMediaIndex((currentIndex) => (currentIndex + 1 >= mediaItems.length ? 0 : currentIndex + 1));
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
          {activeMedia ? (
            <div className="relative bg-slate-950">
              {activeMedia.type === "image" ? (
                <img src={activeMedia.imageUrl} alt={activeMedia.altText} className="h-72 w-full object-cover" />
              ) : (
                <iframe
                  title="Video prodotto"
                  src={activeMedia.embedUrl}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}

              {mediaItems.length > 1 ? (
                <>
                  <Button type="button" variant="outline" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90" onClick={showPreviousMedia}>
                    ‹
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90" onClick={showNextMedia}>
                    ›
                  </Button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {mediaItems.map((media, index) => (
                      <button
                        key={media.type === "image" ? `${media.imageUrl}-${index}` : `${media.embedUrl}-${index}`}
                        type="button"
                        aria-label={media.type === "image" ? `Mostra foto ${index + 1}` : "Mostra video prodotto"}
                        className={`h-2.5 w-2.5 rounded-full ${index === activeMediaIndex ? "bg-primary" : "bg-white/80"}`}
                        onClick={() => setActiveMediaIndex(index)}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center bg-fuchsia-50 text-sm text-slate-500">Nessuna foto caricata</div>
          )}

          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {form.badge.trim() ? <Badge className="bg-primary text-white">{form.badge.trim()}</Badge> : null}
                  {form.in_evidenza ? (
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                      In evidenza
                    </Badge>
                  ) : null}
                </div>
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
                <p className="mt-1 text-xs font-medium text-slate-500">{vatLabel}</p>
                {isFutureDate(form.promo_scade_il) ? <p className="mt-1 text-xs font-medium text-primary">Promo fino al {formatDate(form.promo_scade_il)}</p> : null}
              </div>
            </div>

            {remainingMs !== null && remainingMs > 0 ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                Countdown promozione: {formatCountdown(remainingMs)}
              </div>
            ) : null}
            {availableQuantity ? <p className="text-sm font-medium text-slate-700">Solo {availableQuantity} disponibili</p> : null}
            {form.short_description.trim() ? <p className="text-base leading-7 text-slate-700">{form.short_description.trim()}</p> : null}
            {form.long_description.trim() ? <FormattedDescription value={form.long_description.trim()} /> : null}

            <div className="rounded-2xl bg-fuchsia-50 px-4 py-3 text-sm text-slate-700">
              {form.delivery_type === "digitale" ? "Consegna digitale" : form.sold_out ? "Prodotto esaurito" : `Disponibilità fisica${form.stock ? `: ${form.stock} pezzi` : ""}`}
              {deliveryTime ? ` — ${deliveryTime}` : ""}
            </div>
          </div>
        </article>

        {mode === "edit" && showScheduler ? (
          <div className="space-y-2 rounded-2xl border border-fuchsia-100 p-4">
            <label htmlFor="publish-at" className="text-sm font-medium text-slate-700">
              Data e ora di pubblicazione
            </label>
            <Input id="publish-at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </div>
        ) : null}

        {mode === "edit" ? (
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
        ) : null}
      </CardContent>
    </Card>
  );
}