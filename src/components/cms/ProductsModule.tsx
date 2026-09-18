import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useTenantSession } from "@/hooks/use-tenant-session";
import type {
  ProductBenefitRow,
  ProductFaqRow,
  ProductFormValues,
  ProductHighlightRow,
  ProductImageRow,
  ProductRelatedRow,
  ProductRow,
  ProductStatus,
} from "@/types/uala-cms";
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
  codice_prodotto: string | null;
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
  tempo_consegna: string | null;
  peso_kg: number | null;
  status: ProductStatus;
  publish_at: string | null;
  video_url: string | null;
  ordine_visualizzazione: number;
  note_interne: string | null;
};

export function ProductsModule() {
  const tenantSession = useTenantSession();
  const tenantId = tenantSession.tenant?.id;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [relatedRows, setRelatedRows] = useState<ProductRelatedRow[]>([]);
  const [benefits, setBenefits] = useState<ProductBenefitRow[]>([]);
  const [highlights, setHighlights] = useState<ProductHighlightRow[]>([]);
  const [faqs, setFaqs] = useState<ProductFaqRow[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
  const [formMode, setFormMode] = useState<FormMode>("form");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<ProductRow | null>(null);
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

  const benefitsByProduct = useMemo(() => {
    return benefits.reduce<Record<string, ProductBenefitRow[]>>((groups, benefit) => {
      groups[benefit.product_id] = [...(groups[benefit.product_id] || []), benefit];
      return groups;
    }, {});
  }, [benefits]);

  const highlightsByProduct = useMemo(() => {
    return highlights.reduce<Record<string, ProductHighlightRow[]>>((groups, highlight) => {
      groups[highlight.product_id] = [...(groups[highlight.product_id] || []), highlight];
      return groups;
    }, {});
  }, [highlights]);

  const faqsByProduct = useMemo(() => {
    return faqs.reduce<Record<string, ProductFaqRow[]>>((groups, faq) => {
      groups[faq.product_id] = [...(groups[faq.product_id] || []), faq];
      return groups;
    }, {});
  }, [faqs]);

  const relatedProducts = useMemo(() => products.filter((product) => product.id !== editingProductId), [editingProductId, products]);

  function normalizeProductRow(row: Record<string, unknown>): ProductRow {
    return {
      id: String(row.id),
      tenant_id: row.tenant_id ? String(row.tenant_id) : undefined,
      name: String(row.name || ""),
      category: typeof row.category === "string" ? row.category : null,
      codice_prodotto: typeof row.codice_prodotto === "string" ? row.codice_prodotto : null,
      short_description: typeof row.short_description === "string" ? row.short_description : null,
      long_description: typeof row.long_description === "string" ? row.long_description : null,
      price: typeof row.price === "number" || typeof row.price === "string" ? row.price : null,
      discount_price: typeof row.discount_price === "number" || typeof row.discount_price === "string" ? row.discount_price : null,
      delivery_type: row.delivery_type === "fisico" ? "fisico" : "digitale",
      stock: typeof row.stock === "number" ? row.stock : null,
      tempo_consegna: typeof row.tempo_consegna === "string" ? row.tempo_consegna : null,
      peso_kg: typeof row.peso_kg === "number" || typeof row.peso_kg === "string" ? row.peso_kg : null,
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
      video_url: typeof row.video_url === "string" ? row.video_url : null,
      ordine_visualizzazione: Number.isFinite(Number(row.ordine_visualizzazione)) ? Number(row.ordine_visualizzazione) : 0,
      note_interne: typeof row.note_interne === "string" ? row.note_interne : null,
      created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    };
  }

  const loadProducts = useCallback(async (): Promise<void> => {
    setIsLoadingProducts(true);
    setListError(null);

    const { data: productRows, error: productsError } = await cmsSupabase
      .from("products")
      .select("id, tenant_id, name, category, codice_prodotto, short_description, long_description, price, discount_price, delivery_type, stock, tempo_consegna, peso_kg, status, slug, seo_title, seo_description, badge, promo_scade_il, publish_at, mostra_countdown, quantita_disponibile, in_evidenza, iva_inclusa, video_url, ordine_visualizzazione, note_interne, created_at")
      .order("ordine_visualizzazione", { ascending: true });

    if (productsError) {
      setProducts([]);
      setImages([]);
      setRelatedRows([]);
      setBenefits([]);
      setHighlights([]);
      setFaqs([]);
      setListError(productsError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: imageRows, error: imagesError } = await cmsSupabase.from("product_images").select("id, tenant_id, product_id, image_url, position, alt_text, created_at").order("position", { ascending: true });

    if (imagesError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages([]);
      setRelatedRows([]);
      setBenefits([]);
      setHighlights([]);
      setFaqs([]);
      setListError(imagesError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: relatedData, error: relatedError } = await cmsSupabase.from("product_related").select("id, tenant_id, product_id, related_product_id, created_at");

    if (relatedError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages((imageRows || []) as ProductImageRow[]);
      setRelatedRows([]);
      setBenefits([]);
      setHighlights([]);
      setFaqs([]);
      setListError(relatedError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: benefitData, error: benefitsError } = await cmsSupabase.from("product_benefits").select("id, tenant_id, product_id, text, position, created_at").order("position", { ascending: true });

    if (benefitsError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages((imageRows || []) as ProductImageRow[]);
      setRelatedRows((relatedData || []) as ProductRelatedRow[]);
      setBenefits([]);
      setHighlights([]);
      setFaqs([]);
      setListError(benefitsError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: highlightData, error: highlightsError } = await cmsSupabase.from("product_highlights").select("id, tenant_id, product_id, icon, title, description, position, created_at").order("position", { ascending: true });

    if (highlightsError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages((imageRows || []) as ProductImageRow[]);
      setRelatedRows((relatedData || []) as ProductRelatedRow[]);
      setBenefits((benefitData || []) as ProductBenefitRow[]);
      setHighlights([]);
      setFaqs([]);
      setListError(highlightsError.message);
      setIsLoadingProducts(false);
      return;
    }

    const { data: faqData, error: faqsError } = await cmsSupabase.from("product_faqs").select("id, tenant_id, product_id, question, answer, position, created_at").order("position", { ascending: true });

    if (faqsError) {
      setProducts((productRows || []).map(normalizeProductRow));
      setImages((imageRows || []) as ProductImageRow[]);
      setRelatedRows((relatedData || []) as ProductRelatedRow[]);
      setBenefits((benefitData || []) as ProductBenefitRow[]);
      setHighlights((highlightData || []) as ProductHighlightRow[]);
      setFaqs([]);
      setListError(faqsError.message);
      setIsLoadingProducts(false);
      return;
    }

    setProducts((productRows || []).map(normalizeProductRow));
    setImages((imageRows || []) as ProductImageRow[]);
    setRelatedRows((relatedData || []) as ProductRelatedRow[]);
    setBenefits((benefitData || []) as ProductBenefitRow[]);
    setHighlights((highlightData || []) as ProductHighlightRow[]);
    setFaqs((faqData || []) as ProductFaqRow[]);
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
    const weight = form.peso_kg.trim() === "" ? null : Number(form.peso_kg);
    const displayOrder = form.ordine_visualizzazione.trim() === "" ? 0 : Number(form.ordine_visualizzazione);

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

    if (!Number.isInteger(displayOrder)) {
      setFormError("Inserisci un ordine di visualizzazione valido.");
      return false;
    }

    if (form.delivery_type === "fisico" && weight !== null && (!Number.isFinite(weight) || weight < 0)) {
      setFormError("Inserisci un peso valido oppure lascia il campo vuoto.");
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
    const pesoKg = form.delivery_type === "fisico" && form.peso_kg.trim() !== "" ? Number(form.peso_kg) : null;

    return {
      name: form.name.trim(),
      category: form.category.trim() || null,
      codice_prodotto: form.codice_prodotto.trim() || null,
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
      tempo_consegna: form.tempo_consegna.trim() || null,
      peso_kg: pesoKg,
      status,
      publish_at: publishAt,
      video_url: form.video_url.trim() || null,
      ordine_visualizzazione: form.ordine_visualizzazione.trim() === "" ? 0 : Number(form.ordine_visualizzazione),
      note_interne: form.note_interne.trim() || null,
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

  async function syncProductContent(productId: string): Promise<void> {
    const deleteResults = await Promise.all([
      cmsSupabase.from("product_benefits").delete().eq("product_id", productId),
      cmsSupabase.from("product_highlights").delete().eq("product_id", productId),
      cmsSupabase.from("product_faqs").delete().eq("product_id", productId),
    ]);
    const deleteError = deleteResults.find((result) => result.error)?.error;

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (!tenantId) {
      return;
    }

    const benefitRows = form.benefits
      .map((benefit, index) => ({
        tenant_id: tenantId,
        product_id: productId,
        text: benefit.text.trim(),
        position: index,
      }))
      .filter((benefit) => benefit.text.length > 0);

    if (benefitRows.length > 0) {
      const { error } = await cmsSupabase.from("product_benefits").insert(benefitRows);

      if (error) {
        throw new Error(error.message);
      }
    }

    const highlightRows = form.highlights
      .map((highlight, index) => ({
        tenant_id: tenantId,
        product_id: productId,
        icon: highlight.icon.trim() || null,
        title: highlight.title.trim(),
        description: highlight.description.trim() || null,
        position: index,
      }))
      .filter((highlight) => highlight.title.length > 0);

    if (highlightRows.length > 0) {
      const { error } = await cmsSupabase.from("product_highlights").insert(highlightRows);

      if (error) {
        throw new Error(error.message);
      }
    }

    const faqRows = form.faqs
      .map((faq, index) => ({
        tenant_id: tenantId,
        product_id: productId,
        question: faq.question.trim(),
        answer: faq.answer.trim(),
        position: index,
      }))
      .filter((faq) => faq.question.length > 0 && faq.answer.length > 0);

    if (faqRows.length > 0) {
      const { error } = await cmsSupabase.from("product_faqs").insert(faqRows);

      if (error) {
        throw new Error(error.message);
      }
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
        const { data, error } = await cmsSupabase.from("products").insert({ ...payload, tenant_id: tenantId }).select("id").single();

        if (error) {
          throw new Error(error.message);
        }

        productId = String((data as { id: string }).id);
      }

      if (productId) {
        await syncImages(productId);
        await syncRelatedProducts(productId);
        await syncProductContent(productId);
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

  async function deleteProductPermanently(productId: string): Promise<void> {
    setListError(null);
    setSuccessMessage(null);
    const { error } = await cmsSupabase.from("products").delete().eq("id", productId);

    if (error) {
      setListError(error.message);
      return;
    }

    setSuccessMessage("Prodotto eliminato definitivamente.");
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
      codice_prodotto: product.codice_prodotto,
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
      tempo_consegna: product.tempo_consegna,
      peso_kg: product.peso_kg === null || product.peso_kg === undefined ? null : Number(product.peso_kg),
      status: "bozza",
      publish_at: product.publish_at,
      video_url: product.video_url,
      ordine_visualizzazione: product.ordine_visualizzazione,
      note_interne: product.note_interne,
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
    setForm(
      productToForm(
        product,
        imagesByProduct[product.id] || [],
        relatedIdsByProduct[product.id] || [],
        benefitsByProduct[product.id] || [],
        highlightsByProduct[product.id] || [],
        faqsByProduct[product.id] || [],
      ),
    );
    setFormMode("form");
    setFormError(null);
    setSuccessMessage(null);
  }

  const previewForm = previewProduct
    ? productToForm(
        previewProduct,
        imagesByProduct[previewProduct.id] || [],
        relatedIdsByProduct[previewProduct.id] || [],
        benefitsByProduct[previewProduct.id] || [],
        highlightsByProduct[previewProduct.id] || [],
        faqsByProduct[previewProduct.id] || [],
      )
    : null;

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
            onPreview={setPreviewProduct}
            onEdit={handleEdit}
            onDuplicate={(product) => void duplicateProduct(product)}
            onArchive={(productId) => void updateProductStatus(productId, "archiviato")}
            onPause={(productId) => void updateProductStatus(productId, "in_pausa")}
            onReactivate={(productId) => void updateProductStatus(productId, "pubblicato")}
            onPermanentDelete={(productId) => void deleteProductPermanently(productId)}
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

      {previewForm ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-4xl space-y-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" className="bg-white" onClick={() => setPreviewProduct(null)}>
                Chiudi
              </Button>
            </div>
            <ProductPreview form={previewForm} mode="readonly" />
          </div>
        </div>
      ) : null}
    </div>
  );
}