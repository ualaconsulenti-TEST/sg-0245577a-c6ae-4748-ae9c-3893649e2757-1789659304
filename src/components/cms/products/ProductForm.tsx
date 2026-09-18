import { ChangeEvent, FormEvent, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryType, ProductFormValues, ProductRow } from "@/types/uala-cms";
import { ProductContentSections } from "./ProductContentSections";
import { fileToDataUrl } from "./productUtils";

interface ProductFormProps {
  form: ProductFormValues;
  formError: string | null;
  isEditing: boolean;
  relatedProducts: ProductRow[];
  onChange: (form: ProductFormValues) => void;
  onContinue: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}

export function ProductForm({ form, formError, isEditing, relatedProducts, onChange, onContinue, onCancelEdit }: ProductFormProps) {
  const longDescriptionRef = useRef<HTMLTextAreaElement | null>(null);

  function updateField<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]): void {
    onChange({ ...form, [field]: value });
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const imageUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
    const newImages = imageUrls.map((imageUrl, index) => ({ image_url: imageUrl, position: form.images.length + index, alt_text: "" }));
    updateField("images", [...form.images, ...newImages]);
    event.target.value = "";
  }

  function moveImage(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.images.length) return;
    const nextImages = [...form.images];
    const currentImage = nextImages[index];
    nextImages[index] = nextImages[nextIndex];
    nextImages[nextIndex] = currentImage;
    updateField("images", nextImages.map((image, imageIndex) => ({ ...image, position: imageIndex })));
  }

  function removeImage(index: number): void {
    updateField("images", form.images.filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, position: imageIndex })));
  }

  function updateImageAltText(index: number, value: string): void {
    updateField("images", form.images.map((image, imageIndex) => (imageIndex === index ? { ...image, alt_text: value } : image)));
  }

  function toggleRelatedProduct(productId: string, checked: boolean): void {
    updateField("related_product_ids", checked ? [...form.related_product_ids, productId] : form.related_product_ids.filter((currentId) => currentId !== productId));
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
    updateField("long_description", `${value.slice(0, start)}${marker}${selectedText}${marker}${value.slice(end)}`);
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
                <p className="text-xs leading-5 text-slate-500">Esempio: Analisi personale</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-code">Codice prodotto (SKU)</Label>
                <Input id="product-code" value={form.codice_prodotto} onChange={(event) => updateField("codice_prodotto", event.target.value)} />
                <p className="text-xs leading-5 text-slate-500">Codice interno per uso tuo, es. TN-001 — non obbligatorio, non visibile ai clienti</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-badge">Etichetta promozionale (es. Novità, Ultimi posti)</Label>
                <Input id="product-badge" placeholder="Novità, Ultimi posti..." value={form.badge} onChange={(event) => updateField("badge", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-order">Ordine di visualizzazione nel catalogo</Label>
                <Input id="display-order" type="number" step="1" value={form.ordine_visualizzazione} onChange={(event) => updateField("ordine_visualizzazione", event.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-fuchsia-100 px-3 py-2">
              <Switch checked={form.in_evidenza} onCheckedChange={(checked) => updateField("in_evidenza", checked)} />
              <span className="text-sm text-slate-700">Prodotto in evidenza</span>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Prezzo</h3>
            <div className="grid gap-4 md:grid-cols-4">
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
              <div className="flex items-center justify-between gap-3 rounded-xl border border-fuchsia-100 px-3 py-2">
                <span className="text-sm text-slate-700">Prezzo + IVA</span>
                <Switch checked={form.iva_inclusa} onCheckedChange={(checked) => updateField("iva_inclusa", checked)} />
                <span className="text-sm text-slate-700">Prezzo IVA inclusa</span>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Urgenza e disponibilità</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-fuchsia-100 px-3 py-2">
                <Switch checked={form.mostra_countdown} onCheckedChange={(checked) => updateField("mostra_countdown", checked)} />
                <span className="text-sm text-slate-700">Mostra countdown promozione</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="available-quantity">Quantità disponibile</Label>
                <Input id="available-quantity" type="number" min="0" placeholder="Lascia vuoto se non rilevante" value={form.quantita_disponibile} onChange={(event) => updateField("quantita_disponibile", event.target.value)} />
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
              <Label htmlFor="long-description">Descrizione / Per chi è questo prodotto</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => applyMarker("**")}>Grassetto</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyMarker("_")}>Corsivo</Button>
              </div>
              <Textarea ref={longDescriptionRef} id="long-description" rows={5} value={form.long_description} onChange={(event) => updateField("long_description", event.target.value)} />
            </div>
          </section>

          <ProductContentSections form={form} onChange={onChange} />

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Foto</h3>
            <Input type="file" accept="image/*" multiple onChange={(event) => void handleFiles(event)} />
            <div className="space-y-2">
              <Label htmlFor="product-video">Link video (YouTube o Vimeo, opzionale)</Label>
              <Input id="product-video" value={form.video_url} onChange={(event) => updateField("video_url", event.target.value)} />
            </div>
            {form.images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={`${image.id || image.image_url}-${index}`} className="space-y-3 rounded-2xl border border-fuchsia-100 p-3">
                    <img src={image.image_url} alt={image.alt_text || `Foto prodotto ${index + 1}`} className="h-28 w-full rounded-xl object-cover" />
                    <div className="space-y-2">
                      <Label htmlFor={`image-alt-${index}`}>Descrizione immagine (per la ricerca Google)</Label>
                      <Input id={`image-alt-${index}`} value={image.alt_text} onChange={(event) => updateImageAltText(index, event.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => moveImage(index, -1)} disabled={index === 0}>Su</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => moveImage(index, 1)} disabled={index === form.images.length - 1}>Giù</Button>
                      <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => removeImage(index)}>Elimina</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Prodotti correlati</h3>
            {relatedProducts.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedProducts.map((product) => (
                  <label key={product.id} className="flex items-center gap-3 rounded-xl border border-fuchsia-100 px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={form.related_product_ids.includes(product.id)} onChange={(event) => toggleRelatedProduct(product.id, event.target.checked)} />
                    <span>{product.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nessun altro prodotto disponibile.</p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">SEO</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="product-slug">Indirizzo pagina web (es. tema-natale)</Label>
                <Input id="product-slug" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
                <p className="text-xs leading-5 text-slate-500">Solo l'ultima parte, senza barre, es. tema-natale — obbligatorio, altrimenti la pagina del prodotto non funziona</p>
              </div>
              <div className="space-y-2">
                <Input placeholder="seo title" value={form.seo_title} onChange={(event) => updateField("seo_title", event.target.value)} />
                <p className="text-xs text-slate-500">{form.seo_title.length}/60 caratteri (ideale 50-60)</p>
              </div>
              <div className="space-y-2">
                <Input placeholder="seo description" value={form.seo_description} onChange={(event) => updateField("seo_description", event.target.value)} />
                <p className="text-xs text-slate-500">{form.seo_description.length}/160 caratteri (ideale 150-160)</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Disponibilità</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo consegna</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.delivery_type} onChange={(event) => updateField("delivery_type", event.target.value as DeliveryType)}>
                  <option value="digitale">digitale</option>
                  <option value="fisico">fisico</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-time">Tempo di consegna (es. Entro 3 giorni lavorativi)</Label>
                <Input id="delivery-time" value={form.tempo_consegna} onChange={(event) => updateField("tempo_consegna", event.target.value)} />
              </div>
              {form.delivery_type === "fisico" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="product-stock">Stock</Label>
                    <Input id="product-stock" type="number" min="0" value={form.stock} onChange={(event) => updateField("stock", event.target.value)} disabled={form.sold_out} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-weight">Peso (kg)</Label>
                    <Input id="product-weight" type="number" min="0" step="0.01" value={form.peso_kg} onChange={(event) => updateField("peso_kg", event.target.value)} />
                  </div>
                </>
              ) : null}
              <div className="space-y-2 rounded-xl border border-fuchsia-100 px-3 py-2">
                <div className="flex items-center gap-3">
                  <Switch checked={form.sold_out} onCheckedChange={(checked) => updateField("sold_out", checked)} />
                  <span className="text-sm text-slate-700">Esaurito manualmente</span>
                </div>
                <p className="text-xs leading-5 text-slate-500">Nascondi temporaneamente questo prodotto dagli acquisti senza eliminarlo o cambiarne lo stato.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
            <h3 className="font-semibold text-slate-950">Note interne (visibili solo a te, mai ai clienti)</h3>
            <Textarea rows={4} value={form.note_interne} onChange={(event) => updateField("note_interne", event.target.value)} />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="bg-primary hover:bg-primary/90">Continua</Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={onCancelEdit}>Annulla modifica</Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}