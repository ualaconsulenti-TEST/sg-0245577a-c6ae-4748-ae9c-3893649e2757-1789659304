import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { ProductFormValues, ProductRow } from "@/types/uala-cms";

const cmsSupabase = supabase as SupabaseClient;

const emptyProductForm: ProductFormValues = {
  name: "",
  category: "",
  short_description: "",
  long_description: "",
  price: "",
  discount_price: "",
  delivery_type: "digitale",
  status: "bozza",
};

function formatCurrency(value: ProductRow["price"]): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(numericValue);
}

export function ProductsModule() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadProducts = useCallback(async (): Promise<void> => {
    setIsLoadingProducts(true);
    setListError(null);

    const { data, error } = await cmsSupabase
      .from("products")
      .select("name, category, price, discount_price, status");

    if (error) {
      setProducts([]);
      setListError(error.message);
      setIsLoadingProducts(false);
      return;
    }

    setProducts((data || []) as ProductRow[]);
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function updateField(field: keyof ProductFormValues, value: string): void {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    const price = Number(form.price);
    const discountPrice = form.discount_price.trim() === "" ? null : Number(form.discount_price);

    if (!form.name.trim() || !form.category.trim()) {
      setFormError("Nome e categoria sono obbligatori.");
      setIsSaving(false);
      return;
    }

    if (!Number.isFinite(price)) {
      setFormError("Inserisci un prezzo valido.");
      setIsSaving(false);
      return;
    }

    if (discountPrice !== null && !Number.isFinite(discountPrice)) {
      setFormError("Inserisci un prezzo scontato valido oppure lascia il campo vuoto.");
      setIsSaving(false);
      return;
    }

    const { error } = await cmsSupabase.from("products").insert({
      name: form.name.trim(),
      category: form.category.trim(),
      short_description: form.short_description.trim(),
      long_description: form.long_description.trim(),
      price,
      discount_price: discountPrice,
      delivery_type: form.delivery_type,
      status: form.status,
    });

    if (error) {
      setFormError(error.message);
      setIsSaving(false);
      return;
    }

    setForm(emptyProductForm);
    setSuccessMessage("Prodotto aggiunto correttamente.");
    setIsSaving(false);
    await loadProducts();
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Prodotti</CardTitle>
          <CardDescription>Elenco prodotti filtrato dalle regole del database per il tenant corrente.</CardDescription>
        </CardHeader>
        <CardContent>
          {listError ? (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Prezzo</th>
                    <th className="px-4 py-3 font-semibold">Prezzo scontato</th>
                    <th className="px-4 py-3 font-semibold">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoadingProducts ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Caricamento prodotti...
                      </td>
                    </tr>
                  ) : products.length > 0 ? (
                    products.map((product, index) => (
                      <tr key={`${product.name}-${product.category}-${index}`} className="text-slate-700">
                        <td className="px-4 py-4 font-medium text-slate-950">{product.name || "—"}</td>
                        <td className="px-4 py-4">{product.category || "—"}</td>
                        <td className="px-4 py-4">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-4">{formatCurrency(product.discount_price)}</td>
                        <td className="px-4 py-4">
                          <Badge variant={product.status === "pubblicato" ? "default" : "secondary"}>{product.status || "—"}</Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Nessun prodotto presente per questo tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Aggiungi prodotto</CardTitle>
          <CardDescription>Il tenant_id non viene richiesto: viene gestito automaticamente dalle regole già configurate nel database.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            {successMessage ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nome</Label>
                <Input id="product-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria</Label>
                <Input id="product-category" value={form.category} onChange={(event) => updateField("category", event.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">Descrizione breve</Label>
              <Input
                id="short-description"
                value={form.short_description}
                onChange={(event) => updateField("short_description", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-description">Descrizione lunga</Label>
              <Textarea
                id="long-description"
                rows={5}
                value={form.long_description}
                onChange={(event) => updateField("long_description", event.target.value)}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo</Label>
                <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={(event) => updateField("price", event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-price">Prezzo scontato</Label>
                <Input
                  id="discount-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_price}
                  onChange={(event) => updateField("discount_price", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery-type">Tipo consegna</Label>
                <select
                  id="delivery-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.delivery_type}
                  onChange={(event) => updateField("delivery_type", event.target.value)}
                >
                  <option value="digitale">digitale</option>
                  <option value="fisico">fisico</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  <option value="bozza">bozza</option>
                  <option value="pubblicato">pubblicato</option>
                </select>
              </div>
            </div>

            <div>
              <Button type="submit" className="bg-fuchsia-700 hover:bg-fuchsia-800" disabled={isSaving}>
                {isSaving ? "Salvataggio..." : "Salva prodotto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}