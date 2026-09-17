import type { User } from "@supabase/supabase-js";

export type TenantSessionStatus = "loading" | "unauthenticated" | "ready" | "error";

export type DeliveryType = "digitale" | "fisico";

export type ProductStatus = "bozza" | "pubblicato";

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

export interface ProductRow {
  name: string;
  category: string;
  price: number | string | null;
  discount_price: number | string | null;
  status: ProductStatus | string | null;
}

export interface ProductFormValues {
  name: string;
  category: string;
  short_description: string;
  long_description: string;
  price: string;
  discount_price: string;
  delivery_type: DeliveryType;
  status: ProductStatus;
}