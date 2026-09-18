import type { ProductBenefitRow, ProductFaqRow, ProductFormValues, ProductHighlightRow, ProductImageRow, ProductRow, ProductStatus } from "@/types/uala-cms";

export const emptyProductForm: ProductFormValues = {
  name: "",
  category: "",
  codice_prodotto: "",
  badge: "",
  in_evidenza: false,
  iva_inclusa: true,
  price: "",
  discount_price: "",
  promo_scade_il: "",
  mostra_countdown: false,
  quantita_disponibile: "",
  short_description: "",
  long_description: "",
  benefits: [],
  highlights: [],
  faqs: [],
  images: [],
  related_product_ids: [],
  slug: "",
  seo_title: "",
  seo_description: "",
  delivery_type: "digitale",
  stock: "",
  tempo_consegna: "",
  peso_kg: "",
  sold_out: false,
  video_url: "",
  ordine_visualizzazione: "0",
  note_interne: "",
};

export function formatCurrency(value: ProductRow["price"]): string {
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

export function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function isFutureDate(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() > Date.now();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productToForm(
  product: ProductRow,
  images: ProductImageRow[],
  relatedProductIds: string[] = [],
  benefits: ProductBenefitRow[] = [],
  highlights: ProductHighlightRow[] = [],
  faqs: ProductFaqRow[] = [],
): ProductFormValues {
  const stockValue = product.stock === null || product.stock === undefined ? "" : String(product.stock);

  return {
    name: product.name || "",
    category: product.category || "",
    codice_prodotto: product.codice_prodotto || "",
    badge: product.badge || "",
    in_evidenza: product.in_evidenza,
    iva_inclusa: product.iva_inclusa !== false,
    price: product.price === null || product.price === undefined ? "" : String(product.price),
    discount_price: product.discount_price === null || product.discount_price === undefined ? "" : String(product.discount_price),
    promo_scade_il: product.promo_scade_il ? product.promo_scade_il.slice(0, 10) : "",
    mostra_countdown: product.mostra_countdown,
    quantita_disponibile: product.quantita_disponibile === null || product.quantita_disponibile === undefined ? "" : String(product.quantita_disponibile),
    short_description: product.short_description || "",
    long_description: product.long_description || "",
    benefits: benefits
      .slice()
      .sort((first, second) => first.position - second.position)
      .map((benefit, index) => ({
        id: benefit.id,
        text: benefit.text || "",
        position: index,
      })),
    highlights: highlights
      .slice()
      .sort((first, second) => first.position - second.position)
      .map((highlight, index) => ({
        id: highlight.id,
        icon: highlight.icon || "",
        title: highlight.title || "",
        description: highlight.description || "",
        position: index,
      })),
    faqs: faqs
      .slice()
      .sort((first, second) => first.position - second.position)
      .map((faq, index) => ({
        id: faq.id,
        question: faq.question || "",
        answer: faq.answer || "",
        position: index,
      })),
    images: images
      .slice()
      .sort((first, second) => first.position - second.position)
      .map((image, index) => ({
        id: image.id,
        image_url: image.image_url,
        position: index,
        alt_text: image.alt_text || "",
      })),
    related_product_ids: relatedProductIds,
    slug: product.slug || "",
    seo_title: product.seo_title || "",
    seo_description: product.seo_description || "",
    delivery_type: product.delivery_type,
    stock: stockValue,
    tempo_consegna: product.tempo_consegna || "",
    peso_kg: product.peso_kg === null || product.peso_kg === undefined ? "" : String(product.peso_kg),
    sold_out: product.delivery_type === "fisico" && product.stock === 0,
    video_url: product.video_url || "",
    ordine_visualizzazione: String(product.ordine_visualizzazione || 0),
    note_interne: product.note_interne || "",
  };
}

export function normalizeStatus(value: string | null): ProductStatus {
  if (value === "pubblicato" || value === "in_pausa" || value === "archiviato") {
    return value;
  }

  return "bozza";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossibile leggere il file selezionato."));
    reader.readAsDataURL(file);
  });
}