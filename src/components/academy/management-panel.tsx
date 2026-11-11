import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminUser, CategoryDto, CategoryInput, UserUpdate } from "@codekita/shared";
import { managementApi } from "@/lib/management-api";
import { Button } from "@/components/ui/button";
import { DataState } from "./shared";
import { useAuth } from "@/hooks/useAuth";

const emptyCategory: CategoryInput = { name: "", slug: "", description: "", isActive: true };
export function ManagementPanel() {
  const { user } = useAuth();
  const admin = !!user?.roles.some(role => ["ADMIN", "SUPER_ADMIN"].includes(role));
  return admin ? <div className="mt-8 space-y-6"><Statistics /><Categories /><Users /></div> : null;
}
function Statistics() {
  const query = useQuery({ queryKey: ["admin-statistics"], queryFn: managementApi.statistics });
  if (query.isPending) return <p role="status" className="muted">Loading statistics…</p>;
  if (query.isError) return <DataState error title="Statistics unavailable" description={query.error.message} retry={() => void query.refetch()} />;
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Object.entries(query.data).map(([label, value]) => <div className="panel p-5" key={label}><p className="text-2xl">{value}</p><p className="muted mt-2">{label}</p></div>)}</div>;
}
function Categories() {
  const query = useQuery({ queryKey: ["admin-categories"], queryFn: managementApi.adminCategories });
  const client = useQueryClient();
  const [selected, setSelected] = useState<CategoryDto>();
  const [form, setForm] = useState<CategoryInput>(emptyCategory);
  const invalidate = () => Promise.all([client.invalidateQueries({ queryKey: ["admin-categories"] }), client.invalidateQueries({ queryKey: ["categories"] })]);
  const save = useMutation({ mutationFn: () => managementApi.category(form, selected?.id), onSuccess: async () => { await invalidate(); setSelected(undefined); setForm(emptyCategory); } });
  const archive = useMutation({ mutationFn: managementApi.archiveCategory, onSuccess: invalidate });
  return <section className="panel p-6"><h2 className="mb-5 text-xl">Categories</h2>
    {query.isPending ? <p role="status">Loading categories…</p> : query.isError ? <DataState error title="Categories unavailable" description={query.error.message} retry={() => void query.refetch()} /> : <ul className="mb-6 space-y-3">{query.data.map(category => <li key={category.id} className="flex flex-wrap items-center gap-3 border-b border-border pb-3"><span className="mr-auto text-sm">{category.name} · {category.isActive ? "Active" : "Archived"}</span><Button size="sm" variant="outline" onClick={() => { setSelected(category); setForm({ name: category.name, slug: category.slug, description: category.description, isActive: category.isActive }); }}>Edit</Button><Button size="sm" variant="ghost" disabled={archive.isPending || !category.isActive} onClick={() => archive.mutate(category.id)}>Archive</Button></li>)}</ul>}
    {query.data?.length === 0 && <p className="muted mb-4">No categories yet.</p>}
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
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
  const query = useQuery({ queryKey: ["admin-users", page], queryFn: () => managementApi.users(page) });
  return <section className="panel p-6"><h2 className="mb-5 text-xl">Users and access</h2>
    {query.isPending ? <p role="status">Loading users…</p> : query.isError ? <DataState error title="Users unavailable" description={query.error.message} retry={() => void query.refetch()} /> : <><div className="space-y-4">{query.data.users.map(user => <UserEditor key={user.id + user.roles.join() + user.isActive} user={user} />)}</div><div className="mt-5 flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm">Page {page} · {query.data.total} users</span><Button variant="outline" disabled={page * 25 >= query.data.total} onClick={() => setPage(page + 1)}>Next</Button></div></>}
  </section>;
}
function UserEditor({ user }: { user: AdminUser }) {
  const actor = useAuth().user;
  const protectedUser = actor?.userId === user.id || user.roles.includes("SUPER_ADMIN") || (!actor?.roles.includes("SUPER_ADMIN") && user.roles.includes("ADMIN"));
  const [form, setForm] = useState<UserUpdate>({ isActive: user.isActive, roles: user.roles.filter((role): role is UserUpdate["roles"][number] => ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) });
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: () => managementApi.user(user.id, form), onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ["admin-users"] }), client.invalidateQueries({ queryKey: ["admin-statistics"] })]) });
  return <form className="rounded-lg border border-border p-4" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}><p className="mb-4 break-all text-sm">{user.email}</p><fieldset disabled={protectedUser || mutation.isPending} className="flex flex-wrap items-center gap-4">{(["STUDENT", "INSTRUCTOR", "ADMIN"] as const).filter(role => role !== "ADMIN" || actor?.roles.includes("SUPER_ADMIN")).map(role => <label className="flex gap-2 text-xs" key={role}><input type="checkbox" checked={form.roles.includes(role)} onChange={event => setForm({ ...form, roles: event.target.checked ? [...form.roles, role] : form.roles.filter(item => item !== role) })} />{role}</label>)}<label className="flex gap-2 text-xs"><input type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />Active</label><Button size="sm" type="submit" disabled={!form.roles.length}>Save access</Button></fieldset>{mutation.isError && <p role="alert" className="mt-3 text-xs text-codekita-warning">{mutation.error.message}</p>}{mutation.isSuccess && <p role="status" className="mt-3 text-xs text-primary">Saved. Existing sessions revoked.</p>}</form>;
}