import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { TenantRecord, TenantSessionState, TenantSessionStatus } from "@/types/uala-cms";

const cmsSupabase = supabase as SupabaseClient;

interface TenantUserRecord {
  tenant_id?: string | null;
}

interface TenantQueryRecord {
  id?: string | null;
  name?: string | null;
  enabled_modules?: unknown;
}

interface SuperAdminRecord {
  user_id?: string | null;
}

function normalizeModules(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((moduleName): moduleName is string => typeof moduleName === "string")
    .map((moduleName) => moduleName.trim())
    .filter(Boolean);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Si è verificato un errore durante il caricamento del tenant.";
}

export function useTenantSession(): TenantSessionState {
  const [status, setStatus] = useState<TenantSessionStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTenantContext = useCallback(async (currentUser: User | null): Promise<void> => {
    if (!currentUser) {
      setStatus("unauthenticated");
      setUser(null);
      setTenant(null);
      setEnabledModules([]);
      setIsSuperAdmin(false);
      setError(null);
      return;
    }

    try {
      setStatus("loading");
      setUser(currentUser);
      setError(null);

      const { data: superAdminData, error: superAdminError } = await cmsSupabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (superAdminError) {
        throw superAdminError;
      }

      const superAdminRecord = superAdminData as SuperAdminRecord | null;
      const currentUserIsSuperAdmin = superAdminRecord?.user_id === currentUser.id;
      setIsSuperAdmin(currentUserIsSuperAdmin);

      const { data: tenantUserData, error: tenantUserError } = await cmsSupabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (tenantUserError) {
        throw tenantUserError;
      }

      const tenantUser = tenantUserData as TenantUserRecord | null;

      if (!tenantUser?.tenant_id) {
        setStatus("error");
        setTenant(null);
        setEnabledModules([]);
        setError("Nessun tenant associato a questo utente.");
        return;
      }

      const { data: tenantData, error: tenantError } = await cmsSupabase
        .from("tenants")
        .select("id, name, enabled_modules")
        .eq("id", tenantUser.tenant_id)
        .maybeSingle();

      if (tenantError) {
        throw tenantError;
      }

      const tenantRecord = tenantData as TenantQueryRecord | null;

      if (!tenantRecord?.id) {
        setStatus("error");
        setTenant(null);
        setEnabledModules([]);
        setError("Tenant non trovato o non accessibile.");
        return;
      }

      const modules = normalizeModules(tenantRecord.enabled_modules);
      const normalizedTenant: TenantRecord = {
        id: tenantRecord.id,
        name: tenantRecord.name || "Tenant senza nome",
        enabled_modules: modules,
      };

      setTenant(normalizedTenant);
      setEnabledModules(modules);
      setStatus("ready");
      setError(null);
    } catch (contextError) {
      setStatus("error");
      setTenant(null);
      setEnabledModules([]);
      setIsSuperAdmin(false);
      setError(toErrorMessage(contextError));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession(): Promise<void> {
      const { data, error: userError } = await cmsSupabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        setStatus("unauthenticated");
        setUser(null);
        setTenant(null);
        setEnabledModules([]);
        setIsSuperAdmin(false);
        setError(null);
        return;
      }

      await loadTenantContext(data.user);
    }

    void bootstrapSession();

    const { data: authSubscription } = cmsSupabase.auth.onAuthStateChange((_event, session) => {
      void loadTenantContext(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [loadTenantContext]);

  const signOut = useCallback(async (): Promise<void> => {
    await cmsSupabase.auth.signOut();
    setStatus("unauthenticated");
    setUser(null);
    setTenant(null);
    setEnabledModules([]);
    setIsSuperAdmin(false);
    setError(null);
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    await loadTenantContext(user);
  }, [loadTenantContext, user]);

  const hasModule = useCallback(
    (moduleName: string): boolean => enabledModules.includes(moduleName),
    [enabledModules],
  );

  return useMemo(
    () => ({
      status,
      user,
      tenant,
      enabledModules,
      isSuperAdmin,
      error,
      reload,
      signOut,
      hasModule,
    }),
    [status, user, tenant, enabledModules, isSuperAdmin, error, reload, signOut, hasModule],
  );
}