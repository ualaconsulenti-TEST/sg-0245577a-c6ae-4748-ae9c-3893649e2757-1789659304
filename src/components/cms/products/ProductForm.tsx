import { ChangeEvent, FormEvent, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryType, ProductFormValues } from "@/types/uala-cms";
import { fileToDataUrl } from "./productUtils";

interface ProductFormProps {
  form: ProductFormValues;
  formError: string | null;
  isEditing: boolean;
  onChange: (form: ProductFormValues) => void;
  onContinue: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}

export function ProductForm({ form, formError, isEditing, onChange, onContinue, onCancelEdit }: ProductFormProps) {
  const longDescriptionRef = useRef<HTMLTextAreaElement | null>(null);

  function updateField<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]): void {
    onChange({
      ...form,
      [field]: value,
    });
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const imageUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
    const newImages = imageUrls.map((imageUrl, index) => ({
      image_url: imageUrl,
      position: form.images.length + index,
    }));

    updateField("images", [...form.images, ...newImages]);
    event.target.value = "";
  }

  function moveImage(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= form.images.length) {
      return;
    }

    const nextImages = [...form.images];
    const currentImage = nextImages[index];
    nextImages[index] = nextImages[nextIndex];
    nextImages[nextIndex] = currentImage;

    updateField(
      "images",
      nextImages.map((image, imageIndex) => ({
        ...image,
        position: imageIndex,
      })),
    );
  }

  function removeImage(index: number): void {
    updateField(
      "images",
      form.images
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
          ...image,
          position: imageIndex,
        })),
    );
  }

  function applyMarker(marker: "**" | "_"): void {
    const textarea = longDescriptionRef.current;
    const value = form.long_description;

    if (!textarea) {
      updateField("long_description", `${value}${marker}testo${marker}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end) || "testo";
    const nextValue = `${value.slice(0, start)}${marker}${selectedText}${marker}${value.slice(end)}`;
    updateField("long_description", nextValue);
  }

  return (
    <Card className="border-fuchsia-200 shadow-sm">
      <CardHeader>
        <CardTitle>{isEditing ? "Modifica prodotto" : "Nuovo prodotto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onContinue}>
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Informazioni base</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nome</Label>
                <Input id="product-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria</Label>
                <Input id="product-category" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-badge">Badge</Label>
                <Input id="product-badge" placeholder="Novità, Ultimi posti..." value={form.badge} onChange={(event) => updateField("badge", event.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Prezzo</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-price">Prezzo</Label>
                <Input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-discount">Prezzo scontato</Label>
                <Input id="product-discount" type="number" min="0" step="0.01" value={form.discount_price} onChange={(event) => updateField("discount_price", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-promo">Promo fino al</Label>
                <Input id="product-promo" type="date" value={form.promo_scade_il} onChange={(event) => updateField("promo_scade_il", event.target.value)} />
                <p className="text-xs leading-5 text-slate-500">Il prezzo scontato torna al prezzo pieno dopo questa data.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Descrizioni</h3>
            <div className="space-y-2">
              <Label htmlFor="short-description">Descrizione breve</Label>
              <Input id="short-description" value={form.short_description} onChange={(event) => updateField("short_description", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-description">Descrizione lunga</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => applyMarker("**")}>
                  Grassetto
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyMarker("_")}>
                  Corsivo
                </Button>
              </div>
              <Textarea ref={longDescriptionRef} id="long-description" rows={5} value={form.long_description} onChange={(event) => updateField("long_description", event.target.value)} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Foto</h3>
            <Input type="file" accept="image/*" multiple onChange={(event) => void handleFiles(event)} />
            {form.images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={`${image.image_url}-${index}`} className="rounded-2xl border border-fuchsia-100 p-3">
                    <img src={image.image_url} alt={`Foto prodotto ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        Su
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1}>
                        Giù
                      </Button>
                      <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => removeImage(index)}>
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">SEO</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="slug" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
              <Input placeholder="seo title" value={form.seo_title} onChange={(event) => updateField("seo_title", event.target.value)} />
              <Input placeholder="seo description" value={form.seo_description} onChange={(event) => updateField("seo_description", event.target.value)} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Disponibilità</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.delivery_type} onChange={(event) => updateField("delivery_type", event.target.value as DeliveryType)}>
                <option value="digitale">digitale</option>
                <option value="fisico">fisico</option>
              </select>
              {form.delivery_type === "fisico" ? (
                <Input type="number" min="0" placeholder="stock" value={form.stock} onChange={(event) => updateField("stock", event.target.value)} disabled={form.sold_out} />
              ) : null}
              <div className="flex items-center gap-3 rounded-xl border border-fuchsia-100 px-3 py-2">
                <Switch checked={form.sold_out} onCheckedChange={(checked) => updateField("sold_out", checked)} />
                <span className="text-sm text-slate-700">Esaurito manualmente</span>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="bg-primary hover:bg-primary/90">Continua</Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Annulla modifica
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}