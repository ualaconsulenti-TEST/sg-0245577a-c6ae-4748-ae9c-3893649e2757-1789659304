import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const cmsSupabase = supabase as SupabaseClient;
const availableModules = [{ key: "prodotti", label: "Prodotti" }];

interface SuperAdminTenant {
  id: string;
  name: string;
  enabled_modules: string[];
}

interface TenantUser {
  user_id: string;
  email: string;
  role: string;
}

type TenantUsersById = Record<string, TenantUser[]>;
type TenantUserFormById = Record<string, { email: string; role: string }>;

interface TenantRecord {
  id?: string | null;
  name?: string | null;
  enabled_modules?: unknown;
}

interface TenantUserRecord {
  user_id?: string | null;
  email?: string | null;
  role?: string | null;
}

function normalizeModules(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((moduleName): moduleName is string => typeof moduleName === "string");
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Operazione non riuscita.";
}

export function SuperAdminModule() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUsersById>({});
  const [tenantUserForms, setTenantUserForms] = useState<TenantUserFormById>({});
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantModules, setNewTenantModules] = useState<string[]>(["prodotti"]);
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTenantId, setActionTenantId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emptyState = useMemo(() => tenants.length === 0 && !isLoading, [isLoading, tenants.length]);

  const loadTenantUsers = useCallback(async (tenantId: string): Promise<TenantUser[]> => {
    const { data, error: usersError } = await cmsSupabase.rpc("admin_list_tenant_users", {
      target_tenant_id: tenantId,
    });

    if (usersError) {
      throw usersError;
    }

    return ((data || []) as TenantUserRecord[]).map((userRecord) => ({
      user_id: userRecord.user_id || "",
      email: userRecord.email || "Email non disponibile",
      role: userRecord.role || "admin",
    }));
  }, []);

  const loadSuperAdminData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: tenantsError } = await cmsSupabase
        .from("tenants")
        .select("id, name, enabled_modules")
        .order("name", { ascending: true });

      if (tenantsError) {
        throw tenantsError;
      }

      const normalizedTenants = ((data || []) as TenantRecord[])
        .filter((tenant): tenant is TenantRecord & { id: string } => typeof tenant.id === "string")
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name || "Cliente senza nome",
          enabled_modules: normalizeModules(tenant.enabled_modules),
        }));

      const usersByTenant: TenantUsersById = {};
      const formsByTenant: TenantUserFormById = {};

      for (const tenant of normalizedTenants) {
        usersByTenant[tenant.id] = await loadTenantUsers(tenant.id);
        formsByTenant[tenant.id] = { email: "", role: "admin" };
      }

      setTenants(normalizedTenants);
      setTenantUsers(usersByTenant);
      setTenantUserForms(formsByTenant);
    } catch (loadError) {
      setError(toMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [loadTenantUsers]);

  useEffect(() => {
    void loadSuperAdminData();
  }, [loadSuperAdminData]);

  async function updateTenantModules(tenantId: string, nextModules: string[]): Promise<void> {
    setActionTenantId(tenantId);
    setFeedback(null);
    setError(null);

    try {
      const { error: updateError } = await cmsSupabase.rpc("admin_update_tenant_modules", {
        target_tenant_id: tenantId,
        new_enabled_modules: nextModules,
      });

      if (updateError) {
        throw updateError;
      }

      setTenants((currentTenants) =>
        currentTenants.map((tenant) => (tenant.id === tenantId ? { ...tenant, enabled_modules: nextModules } : tenant)),
      );
      setFeedback("Moduli cliente aggiornati.");
    } catch (updateError) {
      setError(toMessage(updateError));
    } finally {
      setActionTenantId(null);
    }
  }

  function toggleNewTenantModule(moduleName: string): void {
    setNewTenantModules((currentModules) =>
      currentModules.includes(moduleName)
        ? currentModules.filter((currentModule) => currentModule !== moduleName)
        : [...currentModules, moduleName],
    );
  }

  async function createTenant(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setActionTenantId("new");
    setFeedback(null);
    setError(null);

    try {
      const { error: createError } = await cmsSupabase.rpc("admin_create_tenant", {
        tenant_name: newTenantName.trim(),
        initial_modules: newTenantModules,
      });

      if (createError) {
        throw createError;
      }

      setNewTenantName("");
      setNewTenantModules(["prodotti"]);
      setIsNewTenantOpen(false);
      setFeedback("Nuovo cliente creato.");
      await loadSuperAdminData();
    } catch (createError) {
      setError(toMessage(createError));
    } finally {
      setActionTenantId(null);
    }
  }

  async function assignUserToTenant(event: FormEvent<HTMLFormElement>, tenantId: string): Promise<void> {
    event.preventDefault();
    const form = tenantUserForms[tenantId] || { email: "", role: "admin" };

    setActionTenantId(tenantId);
    setFeedback(null);
    setError(null);

    try {
      const { error: assignError } = await cmsSupabase.rpc("admin_assign_user_to_tenant", {
        user_email: form.email.trim(),
        target_tenant_id: tenantId,
        user_role: form.role.trim() || "admin",
      });

      if (assignError) {
        throw assignError;
      }

      setTenantUserForms((currentForms) => ({
        ...currentForms,
        [tenantId]: { email: "", role: form.role || "admin" },
      }));
      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenantId]: [],
      }));
      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenantId]: currentUsers[tenantId],
      }));

      const updatedUsers = await loadTenantUsers(tenantId);
      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenantId]: updatedUsers,
      }));
      setFeedback("Utente collegato al cliente.");
    } catch (assignError) {
      setError(toMessage(assignError));
    } finally {
      setActionTenantId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-fuchsia-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">Super Admin</CardTitle>
            <CardDescription>Gestione tecnica clienti, moduli e utenti collegati.</CardDescription>
          </div>
          <Button type="button" className="bg-primary hover:bg-primary/90" onClick={() => setIsNewTenantOpen((isOpen) => !isOpen)}>
            Nuovo cliente
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback ? (
            <Alert className="border-fuchsia-200 bg-fuchsia-50 text-slate-800">
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isNewTenantOpen ? (
            <form className="space-y-4 rounded-2xl border border-fuchsia-100 bg-slate-50 p-4" onSubmit={createTenant}>
              <div className="space-y-2">
                <Label htmlFor="new-tenant-name">Nome cliente</Label>
                <Input id="new-tenant-name" value={newTenantName} onChange={(event) => setNewTenantName(event.target.value)} required />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Moduli iniziali</p>
                {availableModules.map((moduleItem) => (
                  <label key={moduleItem.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <Checkbox checked={newTenantModules.includes(moduleItem.key)} onCheckedChange={() => toggleNewTenantModule(moduleItem.key)} />
                    {moduleItem.label}
                  </label>
                ))}
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={actionTenantId === "new"}>
                {actionTenantId === "new" ? "Creazione..." : "Salva cliente"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? <p className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">Caricamento clienti...</p> : null}
      {emptyState ? <p className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">Nessun cliente trovato.</p> : null}

      <div className="space-y-5">
        {tenants.map((tenant) => {
          const users = tenantUsers[tenant.id] || [];
          const userForm = tenantUserForms[tenant.id] || { email: "", role: "admin" };

          return (
            <Card key={tenant.id} className="border-fuchsia-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{tenant.name}</CardTitle>
                    <CardDescription>ID cliente: {tenant.id}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tenant.enabled_modules.length > 0 ? (
                      tenant.enabled_modules.map((moduleName) => (
                        <Badge key={moduleName} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                          {moduleName}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Nessun modulo</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 xl:grid-cols-[320px_1fr]">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Moduli disponibili</p>
                  {availableModules.map((moduleItem) => {
                    const isChecked = tenant.enabled_modules.includes(moduleItem.key);
                    const nextModules = isChecked
                      ? tenant.enabled_modules.filter((moduleName) => moduleName !== moduleItem.key)
                      : [...tenant.enabled_modules, moduleItem.key];

                    return (
                      <label key={moduleItem.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <span>{moduleItem.label}</span>
                        <Checkbox
                          checked={isChecked}
                          disabled={actionTenantId === tenant.id}
                          onCheckedChange={() => void updateTenantModules(tenant.id, nextModules)}
                        />
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Utenti collegati</p>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Ruolo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {users.length > 0 ? (
                            users.map((user) => (
                              <tr key={`${tenant.id}-${user.user_id}`}>
                                <td className="px-4 py-3 text-slate-800">{user.email}</td>
                                <td className="px-4 py-3 text-slate-600">{user.role}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-4 py-3 text-slate-500" colSpan={2}>
                                Nessun utente collegato.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <form className="grid gap-3 rounded-2xl border border-fuchsia-100 bg-slate-50 p-4 md:grid-cols-[1fr_160px_auto]" onSubmit={(event) => void assignUserToTenant(event, tenant.id)}>
                    <div className="space-y-2">
                      <Label htmlFor={`tenant-user-email-${tenant.id}`}>Email utente registrato</Label>
                      <Input
                        id={`tenant-user-email-${tenant.id}`}
                        type="email"
                        value={userForm.email}
                        onChange={(event) =>
                          setTenantUserForms((currentForms) => ({
                            ...currentForms,
                            [tenant.id]: { ...userForm, email: event.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`tenant-user-role-${tenant.id}`}>Ruolo</Label>
                      <Input
                        id={`tenant-user-role-${tenant.id}`}
                        value={userForm.role}
                        onChange={(event) =>
                          setTenantUserForms((currentForms) => ({
                            ...currentForms,
                            [tenant.id]: { ...userForm, role: event.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={actionTenantId === tenant.id}>
                        Aggiungi
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}