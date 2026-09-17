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
const roleOptions = ["admin", "editor"];

type TenantStatus = "attivo" | "sospeso";
type TenantUsersById = Record<string, TenantUser[]>;
type TenantUserFormById = Record<string, { email: string; role: string }>;

interface SuperAdminTenant {
  id: string;
  name: string;
  enabled_modules: string[];
  status: TenantStatus;
}

interface TenantUser {
  user_id: string;
  email: string;
  role: string;
  confermato: boolean;
  last_login_at: string | null;
}

interface TenantRecord {
  id?: string | null;
  name?: string | null;
  enabled_modules?: unknown;
  status?: string | null;
}

interface TenantUserRecord {
  user_id?: string | null;
  email?: string | null;
  role?: string | null;
  confermato?: boolean | null;
  last_login_at?: string | null;
}

interface InviteTenantUserResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

interface ActivityLogRecord {
  id?: string | null;
  created_at?: string | null;
  actor_email?: string | null;
  tenant_name?: string | null;
  action?: string | null;
  details?: unknown;
}

function normalizeModules(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((moduleName): moduleName is string => typeof moduleName === "string") : [];
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Operazione non riuscita.";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Mai";
  }

  return new Date(value).toLocaleString("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function detailsToText(details: unknown): string {
  if (!details) {
    return "-";
  }

  if (typeof details === "string") {
    return details;
  }

  return JSON.stringify(details);
}

export function SuperAdminModule() {
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUsersById>({});
  const [tenantUserForms, setTenantUserForms] = useState<TenantUserFormById>({});
  const [activityLog, setActivityLog] = useState<ActivityLogRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantModules, setNewTenantModules] = useState<string[]>(["prodotti"]);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTenantId, setActionTenantId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return tenants;
    }

    return tenants.filter((tenant) => tenant.name.toLowerCase().includes(query));
  }, [searchQuery, tenants]);

  const emptyState = useMemo(() => filteredTenants.length === 0 && !isLoading, [filteredTenants.length, isLoading]);

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
      confermato: Boolean(userRecord.confermato),
      last_login_at: userRecord.last_login_at || null,
    }));
  }, []);

  const loadActivityLog = useCallback(async (): Promise<void> => {
    const { data, error: logError } = await cmsSupabase.rpc("admin_list_activity_log", {
      limit_rows: 100,
    });

    if (logError) {
      throw logError;
    }

    const rows = ((data || []) as ActivityLogRecord[]).sort((first, second) => {
      const firstDate = first.created_at ? new Date(first.created_at).getTime() : 0;
      const secondDate = second.created_at ? new Date(second.created_at).getTime() : 0;
      return secondDate - firstDate;
    });

    setActivityLog(rows);
  }, []);

  const loadSuperAdminData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: tenantsError } = await cmsSupabase
        .from("tenants")
        .select("id, name, enabled_modules, status")
        .order("name", { ascending: true });

      if (tenantsError) {
        throw tenantsError;
      }

      const normalizedTenants: SuperAdminTenant[] = ((data || []) as TenantRecord[])
        .filter((tenant): tenant is TenantRecord & { id: string } => typeof tenant.id === "string")
        .map((tenant) => ({
          id: tenant.id,
          name: tenant.name || "Cliente senza nome",
          enabled_modules: normalizeModules(tenant.enabled_modules),
          status: tenant.status === "sospeso" ? "sospeso" : "attivo",
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
      await loadActivityLog();
    } catch (loadError) {
      setError(toMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [loadActivityLog, loadTenantUsers]);

  useEffect(() => {
    void loadSuperAdminData();
  }, [loadSuperAdminData]);

  async function updateTenantModules(tenant: SuperAdminTenant, moduleLabel: string, isActivating: boolean, nextModules: string[]): Promise<void> {
    const actionLabel = isActivating ? "attivando" : "disattivando";

    if (!window.confirm(`Stai ${actionLabel} il modulo ${moduleLabel} per il cliente ${tenant.name}. Confermi?`)) {
      return;
    }

    setActionTenantId(tenant.id);
    setFeedback(null);
    setError(null);

    try {
      const { error: updateError } = await cmsSupabase.rpc("admin_update_tenant_modules", {
        target_tenant_id: tenant.id,
        modules: nextModules,
      });

      if (updateError) {
        throw updateError;
      }

      setTenants((currentTenants) =>
        currentTenants.map((currentTenant) => (currentTenant.id === tenant.id ? { ...currentTenant, enabled_modules: nextModules } : currentTenant)),
      );
      setFeedback("Moduli cliente aggiornati.");
      await loadActivityLog();
    } catch (updateError) {
      setError(toMessage(updateError));
    } finally {
      setActionTenantId(null);
    }
  }

  async function setTenantStatus(tenant: SuperAdminTenant): Promise<void> {
    const nextStatus: TenantStatus = tenant.status === "sospeso" ? "attivo" : "sospeso";
    const actionLabel = nextStatus === "sospeso" ? "sospendere" : "riattivare";

    if (!window.confirm(`Confermi di ${actionLabel} il cliente ${tenant.name}?`)) {
      return;
    }

    setActionTenantId(tenant.id);
    setFeedback(null);
    setError(null);

    try {
      const { error: statusError } = await cmsSupabase.rpc("admin_set_tenant_status", {
        target_tenant_id: tenant.id,
        new_status: nextStatus,
      });

      if (statusError) {
        throw statusError;
      }

      setTenants((currentTenants) =>
        currentTenants.map((currentTenant) => (currentTenant.id === tenant.id ? { ...currentTenant, status: nextStatus } : currentTenant)),
      );
      setFeedback(nextStatus === "sospeso" ? "Cliente sospeso." : "Cliente riattivato.");
      await loadActivityLog();
    } catch (statusError) {
      setError(toMessage(statusError));
    } finally {
      setActionTenantId(null);
    }
  }

  async function deleteTenant(tenant: SuperAdminTenant): Promise<void> {
    setActionTenantId(tenant.id);
    setFeedback(null);
    setError(null);

    try {
      const { error: deleteError } = await cmsSupabase.rpc("admin_delete_tenant", {
        target_tenant_id: tenant.id,
      });

      if (deleteError) {
        throw deleteError;
      }

      setDeleteTenantId(null);
      setDeleteConfirmText("");
      setFeedback("Cliente eliminato.");
      await loadSuperAdminData();
    } catch (deleteError) {
      setError(toMessage(deleteError));
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
        modules: newTenantModules,
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

  async function inviteUserToTenant(event: FormEvent<HTMLFormElement>, tenantId: string): Promise<void> {
    event.preventDefault();
    const form = tenantUserForms[tenantId] || { email: "", role: "admin" };
    const email = form.email.trim();
    const role = form.role.trim() || "admin";

    setActionTenantId(tenantId);
    setFeedback(null);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await cmsSupabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Sessione utente non disponibile.");
      }

      const { data, error: inviteError } = await cmsSupabase.functions.invoke("invite-tenant-user", {
        body: {
          email,
          tenant_id: tenantId,
          role,
          redirect_to: `${window.location.origin}/imposta-password`,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (inviteError) {
        throw inviteError;
      }

      const inviteResponse = data as InviteTenantUserResponse | null;

      if (!inviteResponse?.success) {
        throw new Error(inviteResponse?.error || inviteResponse?.message || "Invito non riuscito.");
      }

      setTenantUserForms((currentForms) => ({
        ...currentForms,
        [tenantId]: { email: "", role },
      }));

      const updatedUsers = await loadTenantUsers(tenantId);
      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenantId]: updatedUsers,
      }));
      setFeedback(`Invito inviato a ${email}. Riceverà un'email per impostare la password.`);
      await loadActivityLog();
    } catch (inviteError) {
      setError(toMessage(inviteError));
    } finally {
      setActionTenantId(null);
    }
  }

  async function removeUserFromTenant(tenant: SuperAdminTenant, user: TenantUser): Promise<void> {
    if (!window.confirm(`Confermi di rimuovere ${user.email} dal cliente ${tenant.name}?`)) {
      return;
    }

    setActionTenantId(tenant.id);
    setFeedback(null);
    setError(null);

    try {
      const { error: removeError } = await cmsSupabase.rpc("admin_remove_user_from_tenant", {
        target_user_id: user.user_id,
        target_tenant_id: tenant.id,
      });

      if (removeError) {
        throw removeError;
      }

      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenant.id]: (currentUsers[tenant.id] || []).filter((currentUser) => currentUser.user_id !== user.user_id),
      }));
      setFeedback("Utente rimosso dal cliente.");
      await loadActivityLog();
    } catch (removeError) {
      setError(toMessage(removeError));
    } finally {
      setActionTenantId(null);
    }
  }

  async function updateUserRole(tenant: SuperAdminTenant, user: TenantUser, nextRole: string): Promise<void> {
    if (user.role === nextRole) {
      return;
    }

    setActionTenantId(tenant.id);
    setFeedback(null);
    setError(null);

    try {
      const { error: roleError } = await cmsSupabase.rpc("admin_update_user_role", {
        target_user_id: user.user_id,
        target_tenant_id: tenant.id,
        new_role: nextRole,
      });

      if (roleError) {
        throw roleError;
      }

      setTenantUsers((currentUsers) => ({
        ...currentUsers,
        [tenant.id]: (currentUsers[tenant.id] || []).map((currentUser) =>
          currentUser.user_id === user.user_id ? { ...currentUser, role: nextRole } : currentUser,
        ),
      }));
      setFeedback("Ruolo utente aggiornato.");
      await loadActivityLog();
    } catch (roleError) {
      setError(toMessage(roleError));
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

          <div className="space-y-2">
            <Label htmlFor="tenant-search">Cerca cliente</Label>
            <Input id="tenant-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cerca per nome cliente" />
          </div>

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
        {filteredTenants.map((tenant) => {
          const users = tenantUsers[tenant.id] || [];
          const userForm = tenantUserForms[tenant.id] || { email: "", role: "admin" };
          const deleteEnabled = deleteTenantId === tenant.id && deleteConfirmText === tenant.name;

          return (
            <Card key={tenant.id} className="border-fuchsia-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{tenant.name}</CardTitle>
                      <Badge variant={tenant.status === "sospeso" ? "destructive" : "outline"}>{tenant.status}</Badge>
                    </div>
                    <CardDescription>ID cliente: {tenant.id}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={actionTenantId === tenant.id} onClick={() => void setTenantStatus(tenant)}>
                      {tenant.status === "sospeso" ? "Riattiva" : "Sospendi"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setDeleteTenantId(tenant.id);
                        setDeleteConfirmText("");
                      }}
                    >
                      Elimina cliente
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 xl:grid-cols-[320px_1fr]">
                <div className="space-y-4">
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
                            onCheckedChange={() => void updateTenantModules(tenant, moduleItem.label, !isChecked, nextModules)}
                          />
                        </label>
                      );
                    })}
                  </div>

                  {deleteTenantId === tenant.id ? (
                    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-800">Scrivi esattamente “{tenant.name}” per confermare.</p>
                      <Input value={deleteConfirmText} onChange={(event) => setDeleteConfirmText(event.target.value)} />
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" disabled={!deleteEnabled || actionTenantId === tenant.id} onClick={() => void deleteTenant(tenant)}>
                          Conferma eliminazione
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDeleteTenantId(null);
                            setDeleteConfirmText("");
                          }}
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Utenti collegati</p>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Stato</th>
                            <th className="px-4 py-3 font-semibold">Ultimo accesso</th>
                            <th className="px-4 py-3 font-semibold">Ruolo</th>
                            <th className="px-4 py-3 font-semibold">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {users.length > 0 ? (
                            users.map((user) => (
                              <tr key={`${tenant.id}-${user.user_id}`}>
                                <td className="px-4 py-3 text-slate-800">{user.email}</td>
                                <td className="px-4 py-3">
                                  <Badge variant={user.confermato ? "outline" : "secondary"}>{user.confermato ? "Attivo" : "In attesa"}</Badge>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{formatDate(user.last_login_at)}</td>
                                <td className="px-4 py-3">
                                  <select
                                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                                    value={user.role}
                                    disabled={actionTenantId === tenant.id}
                                    onChange={(event) => void updateUserRole(tenant, user, event.target.value)}
                                  >
                                    {roleOptions.map((roleOption) => (
                                      <option key={roleOption} value={roleOption}>
                                        {roleOption}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <Button type="button" variant="outline" size="sm" disabled={actionTenantId === tenant.id} onClick={() => void removeUserFromTenant(tenant, user)}>
                                    Rimuovi
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-4 py-3 text-slate-500" colSpan={5}>
                                Nessun utente collegato.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <form className="grid gap-3 rounded-2xl border border-fuchsia-100 bg-slate-50 p-4 md:grid-cols-[1fr_160px_auto]" onSubmit={(event) => void inviteUserToTenant(event, tenant.id)}>
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
                        Invita cliente
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-fuchsia-200 shadow-sm">
        <CardHeader>
          <CardTitle>Registro attività</CardTitle>
          <CardDescription>Ultime 100 attività amministrative.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Data/ora</th>
                  <th className="px-4 py-3 font-semibold">Chi</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Azione</th>
                  <th className="px-4 py-3 font-semibold">Dettagli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {activityLog.length > 0 ? (
                  activityLog.map((row, index) => (
                    <tr key={row.id || `${row.created_at}-${index}`}>
                      <td className="px-4 py-3 text-slate-700">{formatDate(row.created_at || null)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.actor_email || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.tenant_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.action || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{detailsToText(row.details)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-500" colSpan={5}>
                      Nessuna attività trovata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}