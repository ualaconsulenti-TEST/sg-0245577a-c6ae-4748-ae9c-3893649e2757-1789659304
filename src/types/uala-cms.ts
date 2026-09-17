import type { User } from "@supabase/supabase-js";

export type TenantSessionStatus = "loading" | "unauthenticated" | "ready" | "error";

export type DeliveryType = "digitale" | "fisico";

export type ProductStatus = "bozza" | "pubblicato" | "in_pausa" | "archiviato";

export interface TenantRecord {
  id: string;
  name: string;
  enabled_modules: string[];
}

export interface TenantSessionState {
  status: TenantSessionStatus;
  user: User | null;
  tenant: TenantRecord | null;
  enabledModules: string[];
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
  created_at?: string;
}

export interface ProductImageDraft {
  id?: string;
  image_url: string;
  position: number;
}

export interface ProductRow {
  id: string;
  tenant_id?: string;
  name: string;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number | string | null;
  discount_price: number | string | null;
  delivery_type: DeliveryType;
  stock: number | null;
  status: ProductStatus;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  badge: string | null;
  promo_scade_il: string | null;
  publish_at: string | null;
  created_at?: string;
}

export interface ProductFormValues {
  name: string;
  category: string;
  badge: string;
  price: string;
  discount_price: string;
  promo_scade_il: string;
  short_description: string;
  long_description: string;
  images: ProductImageDraft[];
  slug: string;
  seo_title: string;
  seo_description: string;
  delivery_type: DeliveryType;
  stock: string;
  sold_out: boolean;
}