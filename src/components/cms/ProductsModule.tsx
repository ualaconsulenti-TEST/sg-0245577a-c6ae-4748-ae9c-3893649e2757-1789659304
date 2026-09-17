import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSession } from "@/hooks/use-tenant-session";
import type { ProductFormValues, ProductImageRow, ProductRelatedRow, ProductRow, ProductStatus } from "@/types/uala-cms";
import { ProductForm } from "./products/ProductForm";
import { ProductList } from "./products/ProductList";
import { ProductPreview } from "./products/ProductPreview";
import { emptyProductForm, normalizeStatus, productToForm, slugify } from "./products/productUtils";

const cmsSupabase = supabase as SupabaseClient;

type FormMode = "form" | "preview";

type ProductPayload = {
  tenant_id?: string;
  name: string;
  category: string | null;
  badge: string | null;
  in_evidenza: boolean;
  iva_inclusa: boolean;
  price: number;
  discount_price: number | null;
  promo_scade_il: string | null;
  mostra_countdown: boolean;
  quantita_disponibile: number | null;
  short_description: string | null;
  long_description: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  delivery_type: string;
  stock: number | null;
  status: ProductStatus;
  publish_at: string | null;
};

export function ProductsModule() {
  const tenantSession = useTenantSession();
  const tenantId = tenantSession.tenant?.id;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [relatedRows, setRelatedRows] = useState<ProductRelatedRow[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [formMode, setFormMode] = useState<FormMode>("form");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const imagesByProduct = useMemo(() => {
    return images.reduce<Record<string, ProductImageRow[]>>((groups, image) => {
      groups[image.product_id] = [...(groups[image.product_id] || []), image];
      return groups;
    }, {});
  }, [images]);

  const relatedIdsByProduct = useMemo(() => {
    return relatedRows.reduce<Record<string, string[]>>((groups, row) => {
      groups[row.product_id] = [...(groups[row.product_id] || []), row.related_product_id];
      return groups;
    }, {});
  }, [relatedRows]);

  const relatedProducts = useMemo(() => {
    return products.filter((product) => product.id !== editingProductId);
  }, [editingProductId, products]);

  function normalizeProductRow(row: Record<string, unknown>): ProductRow {
    return {
      id: String(row.id),
      tenant_id: row.tenant_id ? String(row.tenant_id) : undefined,
      name: String(row.name || ""),
      category: typeof row.category === "string" ? row.category : null,
      short_description: typeof row.short_description === "string" ? row.short_description : null,
      long_description: typeof row.long_description === "string" ? row.long_description : null,
      price: typeof row.price === "number" || typeof row.price === "string" ? row.price : null,
      discount_price: typeof row.discount_price === "number" || typeof row.discount_price === "string" ? row.discount_price : null,
      delivery_type: row.delivery_type === "fisico" ? "fisico" : "digitale",
      stock: typeof row.stock === "number" ? row.stock : null,
      status: normalizeStatus(typeof row.status === "string" ? row.status : null),
      slug: typeof row.slug === "string" ? row.slug : null,
      seo_title: typeof row.seo_title === "string" ? row.seo_title : null,
      seo_description: typeof row.seo_description === "string" ? row.seo_description : null,
      badge: typeof row.badge === "string" ? row.badge : null,
      promo_scade_il: typeof row.promo_scade_il === "string" ? row.promo_scade_il : null,
      publish_at: typeof row.publish_at === "string" ? row.publish_at : null,
      mostra_countdown: row.mostra_countdown === true,
      quantita_disponibile: typeof row.quantita_disponibile === "number" ? row.quantita_disponibile : null,
      in_evidenza: row.in_evidenza === true,
      iva_inclusa: row.iva_inclusa !== false,
      created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    };
  }

  const loadProducts = useCallback(async (): Promise<void> => {
    setIsLoadingProducts(true);
    setListError(null);

    const { data: productRows, error: productsError } = await cmsSupabase
      .from("products")
      .select("id, tenant_id, name, category, short_description, long_description, price, discount_price, delivery_type, stock, status, slug, seo_title, seo_description, badge, promo_scade_il, publish_at, mostra_countdown, quantita_disponibile, in_evidenza, iva_inclusa, created_at")
      .order("created_at", { ascending: false });

    if (productsError) {
      setProducts([]);
      setImages([]);
      setRelatedRows([]);
      setListError(productsError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: imageRows, error: imagesError } = await cmsSupabase
      .from("product_images")
      .select("id, tenant_id, product_id, image_url, position, alt_text, created_at")
      .order("position", { ascending: true });

    if (imagesError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages([]);
      setRelatedRows([]);
      setListError(imagesError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: relatedData, error: relatedError } = await cmsSupabase
      .from("product_related")
      .select("id, tenant_id, product_id, related_product_id, created_at");

    if (relatedError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages((imageRows || []) as ProductImageRow[]);
      setRelatedRows([]);
      setListError(relatedError.message);
      setIsLoadingProducts(false);
      return;
    }

    setProducts((productRows || []).map(normalizeProductRow));
    setImages((imageRows || []) as ProductImageRow[]);
    setRelatedRows((relatedData || []) as ProductRelatedRow[]);
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function resetForm(): void {
    setForm(emptyProductForm);
    setFormMode("form");
    setEditingProductId(null);
    setFormError(null);
  }

  function validateForm(): boolean {
    const price = Number(form.price);
    const discountPrice = form.discount_price.trim() === "" ? null : Number(form.discount_price);
    const stock = form.stock.trim() === "" ? null : Number(form.stock);
    const availableQuantity = form.quantita_disponibile.trim() === "" ? null : Number(form.quantita_disponibile);

    if (!form.name.trim()) {
      setFormError("Il nome prodotto è obbligatorio.");
      return false;
    }

    if (!Number.isFinite(price)) {
      setFormError("Inserisci un prezzo valido.");
      return false;
    }

    if (discountPrice !== null && !Number.isFinite(discountPrice)) {
      setFormError("Inserisci un prezzo scontato valido oppure lascia il campo vuoto.");
      return false;
    }

    if (availableQuantity !== null && (!Number.isInteger(availableQuantity) || availableQuantity < 0)) {
      setFormError("Inserisci una quantità disponibile valida oppure lascia il campo vuoto.");
      return false;
    }

    if (form.delivery_type === "fisico" && !form.sold_out && stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setFormError("Inserisci uno stock valido oppure lascia il campo vuoto.");
      return false;
    }

    setFormError(null);
    return true;
  }

  function handleContinue(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (validateForm()) {
      setSuccessMessage(null);
      setFormMode("preview");
    }
  }

  function buildPayload(status: ProductStatus, publishAt: string | null): ProductPayload {
    const stock = form.delivery_type === "fisico" ? (form.sold_out ? 0 : form.stock.trim() === "" ? null : Number(form.stock)) : null;

    return {
      name: form.name.trim(),
      category: form.category.trim() || null,
      badge: form.badge.trim() || null,
      in_evidenza: form.in_evidenza,
      iva_inclusa: form.iva_inclusa,
      price: Number(form.price),
      discount_price: form.discount_price.trim() === "" ? null : Number(form.discount_price),
      promo_scade_il: form.promo_scade_il ? new Date(form.promo_scade_il).toISOString() : null,
      mostra_countdown: form.mostra_countdown,
      quantita_disponibile: form.quantita_disponibile.trim() === "" ? null : Number(form.quantita_disponibile),
      short_description: form.short_description.trim() || null,
      long_description: form.long_description.trim() || null,
      slug: form.slug.trim() || slugify(form.name),
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      delivery_type: form.delivery_type,
      stock,
      status,
      publish_at: publishAt,
    };
  }

  async function syncImages(productId: string): Promise<void> {
    await cmsSupabase.from("product_images").delete().eq("product_id", productId);

    if (!tenantId || form.images.length === 0) {
      return;
    }

    const rows = form.images.map((image, index) => ({
      tenant_id: tenantId,
      product_id: productId,
      image_url: image.image_url,
      position: index,
      alt_text: image.alt_text.trim() || null,
    }));

    const { error } = await cmsSupabase.from("product_images").insert(rows);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function syncRelatedProducts(productId: string): Promise<void> {
    await cmsSupabase.from("product_related").delete().eq("product_id", productId);

    if (!tenantId || form.related_product_ids.length === 0) {
      return;
    }

    const rows = form.related_product_ids.map((relatedProductId) => ({
      tenant_id: tenantId,
      product_id: productId,
      related_product_id: relatedProductId,
    }));

    const { error } = await cmsSupabase.from("product_related").insert(rows);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function saveProduct(publishAt: string): Promise<void> {
    setIsSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    if (!tenantId) {
      setFormError("Cliente non disponibile. Ricarica la pagina e riprova.");
      setIsSaving(false);
      return;
    }

    try {
      const payload = buildPayload("pubblicato", publishAt);
      let productId = editingProductId;

      if (editingProductId) {
        const { error } = await cmsSupabase.from("products").update(payload).eq("id", editingProductId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { data, error } = await cmsSupabase
          .from("products")
          .insert({
            ...payload,
            tenant_id: tenantId,
          })
          .select("id")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        productId = String((data as { id: string }).id);
      }

      if (productId) {
        await syncImages(productId);
        await syncRelatedProducts(productId);
      }

      resetForm();
      setSuccessMessage("Prodotto salvato correttamente.");
      await loadProducts();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateProductStatus(productId: string, status: ProductStatus): Promise<void> {
    const { error } = await cmsSupabase.from("products").update({ status }).eq("id", productId);

    if (error) {
      setListError(error.message);
      return;
    }

    await loadProducts();
  }

  async function duplicateProduct(product: ProductRow): Promise<void> {
    if (!tenantId) {
      setListError("Cliente non disponibile. Ricarica la pagina e riprova.");
      return;
    }

    const payload: ProductPayload = {
      tenant_id: tenantId,
      name: product.name,
      category: product.category,
      badge: product.badge,
      in_evidenza: product.in_evidenza,
      iva_inclusa: product.iva_inclusa,
      price: Number(product.price || 0),
      discount_price: product.discount_price === null || product.discount_price === undefined ? null : Number(product.discount_price),
      promo_scade_il: product.promo_scade_il,
      mostra_countdown: product.mostra_countdown,
      quantita_disponibile: product.quantita_disponibile,
      short_description: product.short_description,
      long_description: product.long_description,
      slug: null,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
      delivery_type: product.delivery_type,
      stock: product.stock,
      status: "bozza",
      publish_at: product.publish_at,
    };

    const { error } = await cmsSupabase.from("products").insert(payload);

    if (error) {
      setListError(error.message);
      return;
    }

    setSuccessMessage("Prodotto duplicato in bozza.");
    await loadProducts();
  }

  function handleEdit(product: ProductRow): void {
    setEditingProductId(product.id);
    setForm(productToForm(product, imagesByProduct[product.id] || [], relatedIdsByProduct[product.id] || []));
    setFormMode("form");
    setFormError(null);
    setSuccessMessage(null);
  }

  return (
    <div className="space-y-6">
      <Card className="border-fuchsia-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Prodotti</CardTitle>
          <CardDescription>Gestisci catalogo, prezzi, disponibilità, immagini e pubblicazione.</CardDescription>
        </CardHeader>
        <CardContent>
          {listError ? (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-900">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}
          <ProductList
            products={products}
            isLoading={isLoadingProducts}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived((currentValue) => !currentValue)}
            onEdit={handleEdit}
            onDuplicate={(product) => void duplicateProduct(product)}
            onArchive={(productId) => void updateProductStatus(productId, "archiviato")}
            onPause={(productId) => void updateProductStatus(productId, "in_pausa")}
            onReactivate={(productId) => void updateProductStatus(productId, "pubblicato")}
          />
        </CardContent>
      </Card>

      {formMode === "preview" ? (
        <ProductPreview
          form={form}
          isSaving={isSaving}
          onBack={() => setFormMode("form")}
          onPublishNow={() => void saveProduct(new Date().toISOString())}
          onSchedule={(publishAt) => void saveProduct(new Date(publishAt).toISOString())}
        />
      ) : (
        <ProductForm
          form={form}
          formError={formError}
          isEditing={Boolean(editingProductId)}
          relatedProducts={relatedProducts}
          onChange={setForm}
          onContinue={handleContinue}
          onCancelEdit={resetForm}
        />
      )}
    </div>
  );
}