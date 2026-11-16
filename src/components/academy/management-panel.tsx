import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminUser, CategoryDto, CategoryInput, UserUpdate } from "@codekita/shared";
import { managementApi, type AdminActivity, type AdminCertificate } from "@/lib/management-api";
import { Button } from "@/components/ui/button";
import { DataState } from "./shared";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

const emptyCategory: CategoryInput = { name: "", slug: "", description: "", isActive: true };
export function ManagementPanel() {
  const { user } = useAuth();
  const admin = !!user?.roles.some(role => ["ADMIN", "SUPER_ADMIN"].includes(role));
  return admin ? <div className="mt-8 space-y-6"><section id="admin-overview"><ServiceHealth /><Statistics /></section><div id="admin-categories"><Categories /></div><div id="admin-users"><Users /></div><AdminRecords /><PlatformSettings /></div> : null;
}
function ServiceHealth() {
  const { t } = useTranslation("dashboard");
  const health = useQuery({ queryKey: ["admin-health"], queryFn: api.health, refetchInterval: false });
  return <section className="panel p-6"><h2 className="mb-3 text-lg">{t("serviceHealth")}</h2>{health.isPending ? <p role="status">{t("healthLoading")}</p> : health.isError ? <p role="alert">{t("healthUnavailable")} <button className="underline" onClick={() => void health.refetch()}>{t("healthRetry")}</button></p> : <p className="text-sm">{t("healthApplication")}: {health.data.services.application} · {t("healthDatabase")}: {health.data.services.database}</p>}</section>;
}
function Statistics() {
  const query = useQuery({ queryKey: ["admin-statistics"], queryFn: managementApi.statistics });
  if (query.isPending) return <p role="status" className="muted">Loading statistics…</p>;
  if (query.isError) return <DataState error title="Statistics unavailable" description={query.error.message} retry={() => void query.refetch()} />;
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Object.entries(query.data).map(([label, value]) => <div className="panel p-5" key={label}><p className="text-2xl">{value}</p><p className="muted mt-2">{label}</p></div>)}</div>;
}
function Categories() {
  const { t } = useTranslation("dashboard");
  const query = useQuery({ queryKey: ["admin-categories"], queryFn: managementApi.adminCategories });
  const client = useQueryClient();
  const [selected, setSelected] = useState<CategoryDto>();
  const [form, setForm] = useState<CategoryInput>(emptyCategory);
  const invalidate = () => Promise.all([client.invalidateQueries({ queryKey: ["admin-categories"] }), client.invalidateQueries({ queryKey: ["categories"] })]);
  const save = useMutation({ mutationFn: () => managementApi.category(form, selected?.id), onSuccess: async () => { await invalidate(); setSelected(undefined); setForm(emptyCategory); } });
  const archive = useMutation({ mutationFn: managementApi.archiveCategory, onSuccess: invalidate });
  return <section className="panel p-6"><h2 className="mb-5 text-xl">Categories</h2>
    {query.isPending ? <p role="status">Loading categories…</p> : query.isError ? <DataState error title="Categories unavailable" description={query.error.message} retry={() => void query.refetch()} /> : <ul className="mb-6 space-y-3">{query.data.map(category => <li key={category.id} className="flex flex-wrap items-center gap-3 border-b border-border pb-3"><span className="mr-auto text-sm">{category.name} · {category.isActive ? "Active" : "Archived"}</span><Button size="sm" variant="outline" onClick={() => { setSelected(category); setForm({ name: category.name, slug: category.slug, description: category.description, isActive: category.isActive }); }}>Edit</Button><Button size="sm" variant="ghost" disabled={archive.isPending || !category.isActive} onClick={() => { if (window.confirm(t("confirmArchiveCategory"))) archive.mutate(category.id); }}>Archive</Button></li>)}</ul>}
    {query.data?.length === 0 && <p className="muted mb-4">No categories yet.</p>}
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (!selected || window.confirm(t("confirmCategory"))) save.mutate(); }}>
      <label className="block text-sm">Name<input className="field mt-2" required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label className="block text-sm">Slug<input className="field mt-2" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value })} /></label>
      <label className="block text-sm">Description<textarea className="field mt-2" maxLength={3000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
      <label className="flex gap-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />Active</label>
      <Button disabled={save.isPending} type="submit">{save.isPending ? "Saving…" : selected ? "Update category" : "Create category"}</Button>
      {selected && <Button className="ml-3" variant="ghost" type="button" onClick={() => { setSelected(undefined); setForm(emptyCategory); }}>Cancel</Button>}
      {(save.error || archive.error) && <p role="alert" className="text-sm text-codekita-warning">{save.error?.message ?? archive.error?.message}</p>}
    </form>
  </section>;
}
function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(""), [status, setStatus] = useState("all");
  const { t } = useTranslation("dashboard");
  const query = useQuery({ queryKey: ["admin-users", page, search, status], queryFn: () => managementApi.users(page, search, status) });
  return <section className="panel p-6"><h2 className="mb-5 text-xl">Users and access</h2>
    <div className="mb-4 flex flex-wrap gap-3"><input className="field max-w-xs" aria-label={t("search")} placeholder={t("search")} maxLength={100} value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} /><select className="field max-w-xs" aria-label={t("status")} value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="all">{t("all")}</option><option value="active">{t("active")}</option><option value="inactive">{t("inactive")}</option></select></div>
    {query.isPending ? <p role="status">Loading users…</p> : query.isError ? <DataState error title="Users unavailable" description={query.error.message} retry={() => void query.refetch()} /> : <><div className="space-y-4">{query.data.users.map(user => <UserEditor key={user.id + user.roles.join() + user.isActive} user={user} />)}</div><div className="mt-5 flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm">Page {page} · {query.data.total} users</span><Button variant="outline" disabled={page * 25 >= query.data.total} onClick={() => setPage(page + 1)}>Next</Button></div></>}
  </section>;
}
function UserEditor({ user }: { user: AdminUser }) {
  const { t } = useTranslation("dashboard");
  const actor = useAuth().user;
  const protectedUser = actor?.userId === user.id || user.roles.includes("SUPER_ADMIN") || (!actor?.roles.includes("SUPER_ADMIN") && user.roles.includes("ADMIN"));
  const [form, setForm] = useState<UserUpdate>({ isActive: user.isActive, roles: user.roles.filter((role): role is UserUpdate["roles"][number] => ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) });
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: () => managementApi.user(user.id, form), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ["admin-users"] }), client.invalidateQueries({ queryKey: ["admin-statistics"] })]) });
  return <form className="rounded-lg border border-border p-4" onSubmit={event => { event.preventDefault(); if (window.confirm(t("confirmAccess"))) mutation.mutate(); }}><p className="mb-4 break-all text-sm">{user.email}</p><fieldset disabled={protectedUser || mutation.isPending} className="flex flex-wrap items-center gap-4">{(["STUDENT", "INSTRUCTOR", "ADMIN"] as const).filter(role => role !== "ADMIN" || actor?.roles.includes("SUPER_ADMIN")).map(role => <label className="flex gap-2 text-xs" key={role}><input type="checkbox" checked={form.roles.includes(role)} onChange={event => setForm({ ...form, roles: event.target.checked ? [...form.roles, role] : form.roles.filter(item => item !== role) })} />{role}</label>)}<label className="flex gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />Active</label><Button size="sm" type="submit" disabled={!form.roles.length}>Save access</Button></fieldset>{mutation.isError && <p role="alert" className="mt-3 text-xs text-codekita-warning">{mutation.error.message}</p>}{mutation.isSuccess && <p role="status" className="mt-3 text-xs text-primary">Saved. Existing sessions revoked.</p>}</form>;
}

function AdminRecords() {
  const { t } = useTranslation("dashboard");
  return <><RecordList kind="activity" title={t("activityMonitoring")} /><RecordList kind="certificates" title={t("certificateManagement")} /></>;
}
function RecordList({ kind, title }: { kind: "activity" | "certificates"; title: string }) {
  const { t, i18n } = useTranslation("dashboard");
  const { user } = useAuth();
  const [page, setPage] = useState(1), [search, setSearch] = useState(""), [status, setStatus] = useState("all");
  const client = useQueryClient();
  const query = useQuery<{ items: (AdminActivity | AdminCertificate)[]; total: number }>({ queryKey: ["admin", kind, page, search, status], queryFn: async () => kind === "activity" ? await managementApi.activity(page, search, status) : await managementApi.certificates(page, search, status) });
  const update = useMutation({ mutationFn: ({ id, revoked }: { id: string; revoked: boolean }) => managementApi.certificate(id, revoked), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ["admin"] }), client.invalidateQueries({ queryKey: ["learning"] })]) });
  return <section id={kind === "activity" ? "admin-activity" : "admin-certificates"} className="panel p-6"><h2 className="mb-4 text-xl">{title}</h2><div className="mb-5 flex flex-wrap gap-3">
    <input className="field max-w-xs" aria-label={t("search")} placeholder={t("search")} maxLength={100} value={search} onChange={e => { setPage(1); setSearch(e.target.value); }}/>
    <select className="field max-w-xs" aria-label={t("status")} value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="all">{t("all")}</option>{kind === "activity" ? <><option value="started">{t("inProgress")}</option><option value="completed">{t("completed")}</option></> : <><option value="active">{t("active")}</option><option value="revoked">{t("revoked")}</option></>}</select>
  </div>{query.isPending ? <p role="status">{t("loading")}</p> : query.isError ? <DataState error title={t("unavailable")} description={query.error.message} retry={() => void query.refetch()} /> : <>
    {!query.data.items.length && <p className="muted">{t("noResults")}</p>}
    <ul className="space-y-3">{query.data.items.map(item => <li key={item.id} className="rounded-lg border border-border p-4 text-sm">{"enrollment" in item ? <><p>{item.title} · {item.enrollment.user.email}</p><p className="muted mt-2">{new Date(item.issuedAt).toLocaleDateString(i18n.language)} · {item.revokedAt ? t("revoked") : t("active")}</p>{user?.roles.includes("SUPER_ADMIN") && <Button className="mt-3" variant="outline" size="sm" disabled={update.isPending} onClick={() => { if (window.confirm(t(item.revokedAt ? "confirmRestore" : "confirmRevoke"))) update.mutate({ id: item.id, revoked: !item.revokedAt }); }}>{t(item.revokedAt ? "restore" : "revoke")}</Button>}</> : <><p>{item.user.email} · {item.course.title}</p><p className="muted mt-2">{t("progressCount", { completed: item.completedLessons, total: item.totalLessons })} · {new Date(item.enrolledAt).toLocaleDateString(i18n.language)}</p></>}</li>)}</ul>
    <div className="mt-5 flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>{t("previous")}</Button><span className="text-sm">{t("pageCount", { page, total: query.data.total })}</span><Button variant="outline" disabled={page * 25 >= query.data.total} onClick={() => setPage(page + 1)}>{t("next")}</Button></div>
  </>}{update.isError && <p role="alert" className="mt-3 text-codekita-warning">{t("updateFailed")}</p>}</section>;
}
function PlatformSettings() {
  const { t } = useTranslation("dashboard"), { user } = useAuth();
  const client = useQueryClient();
  const enabled = !!user?.roles.includes("SUPER_ADMIN");
  const query = useQuery({ queryKey: ["admin-settings"], queryFn: managementApi.settings, enabled });
  const update = useMutation({ mutationFn: managementApi.updateSettings, onSuccess: () => client.invalidateQueries({ queryKey: ["admin-settings"] }) });
  if (!enabled) return null;
  return <section id="admin-settings" className="panel p-6"><h2 className="mb-4 text-xl">{t("platformSettings")}</h2>{query.isPending ? <p role="status">{t("loading")}</p> : query.isError ? <DataState error title={t("unavailable")} description={query.error.message} retry={() => void query.refetch()} /> : <div className="flex flex-wrap items-center gap-4"><p>{t("registration")}: {t(query.data.registrationEnabled ? "active" : "inactive")}</p><Button variant="outline" disabled={update.isPending} onClick={() => { if (window.confirm(t("confirmRegistration"))) update.mutate(!query.data.registrationEnabled); }}>{t("changeRegistration")}</Button></div>}{update.isError && <p role="alert">{t("updateFailed")}</p>}</section>;
}