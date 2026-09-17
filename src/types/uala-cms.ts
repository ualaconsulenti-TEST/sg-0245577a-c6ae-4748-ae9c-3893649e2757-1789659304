import type { User } from "@supabase/supabase-js";

export type TenantSessionStatus = "loading" | "unauthenticated" | "ready" | "error";

export type TenantStatus = "attivo" | "sospeso";

export type DeliveryType = "digitale" | "fisico";

export type ProductStatus = "bozza" | "pubblicato" | "in_pausa" | "archiviato";

export interface TenantRecord {
  id: string;
  name: string;
  enabled_modules: string[];
  status: TenantStatus;
}

export interface TenantSessionState {
  status: TenantSessionStatus;
  user: User | null;
  tenant: TenantRecord | null;
  enabledModules: string[];
  isSuperAdmin: boolean;
  error: string | null;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
  hasModule: (moduleName: string) => boolean;
}

export interface ProductImageRow {
  id: string;
  tenant_id?: string;
  product_id: string;
  image_url: string;
  position: number;
  alt_text: string | null;
  created_at?: string;
}

export interface ProductRelatedRow {
  id: string;
  tenant_id?: string;
  product_id: string;
  related_product_id: string;
  created_at?: string;
}

export interface ProductImageDraft {
  id?: string;
  image_url: string;
  position: number;
  alt_text: string;
}

export interface ProductRow {
  id: string;
  tenant_id?: string;
  name: string;
  category: string | null;
  codice_prodotto: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number | string | null;
  discount_price: number | string | null;
  delivery_type: DeliveryType;
  stock: number | null;
  tempo_consegna: string | null;
  peso_kg: number | string | null;
  status: ProductStatus;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  badge: string | null;
  promo_scade_il: string | null;
  publish_at: string | null;
  mostra_countdown: boolean;
  quantita_disponibile: number | null;
  in_evidenza: boolean;
  iva_inclusa: boolean;
  video_url: string | null;
  ordine_visualizzazione: number;
  note_interne: string | null;
  created_at?: string;
}

export interface ProductFormValues {
  name: string;
  category: string;
  codice_prodotto: string;
  badge: string;
  in_evidenza: boolean;
  iva_inclusa: boolean;
  price: string;
  discount_price: string;
  promo_scade_il: string;
  mostra_countdown: boolean;
  quantita_disponibile: string;
  short_description: string;
  long_description: string;
  images: ProductImageDraft[];
  related_product_ids: string[];
  slug: string;
  seo_title: string;
  seo_description: string;
  delivery_type: DeliveryType;
  stock: string;
  tempo_consegna: string;
  peso_kg: string;
  sold_out: boolean;
  video_url: string;
  ordine_visualizzazione: string;
  note_interne: string;
}