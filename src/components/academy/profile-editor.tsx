import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfileInput } from "@codekita/shared";
import { managementApi } from "@/lib/management-api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DataState } from "./shared";
export function ProfileEditor() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ["profile", user?.userId], queryFn: managementApi.profile, enabled: !!user });
  if (query.isPending) return <p role="status" className="muted mt-6">Loading profile…</p>;
  if (query.isError) return <DataState error title="Profile unavailable" description={query.error.message} retry={() => void query.refetch()} />;
  return <ProfileForm key={query.dataUpdatedAt} initial={query.data} />;
}
function ProfileForm({ initial }: { initial: ProfileInput }) {
  const [form, setForm] = useState<ProfileInput>({ firstName: initial.firstName, lastName: initial.lastName, displayName: initial.displayName, bio: initial.bio });
  const client = useQueryClient();
  const save = useMutation({ mutationFn: () => managementApi.saveProfile(form), onSuccess: () => client.invalidateQueries({ queryKey: ["profile"] }) });
  return <form className="panel mt-6 max-w-2xl space-y-5 p-7" onSubmit={event => { event.preventDefault(); save.mutate(); }}><h2 className="text-xl">Edit profile</h2>{([['firstName', 'First name'], ['lastName', 'Last name'], ['displayName', 'Display name']] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<input className="field mt-2" maxLength={100} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} /></label>)}<label className="block text-sm">Bio<textarea className="field mt-2" maxLength={2000} value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} /></label><Button disabled={save.isPending} type="submit">{save.isPending ? "Saving…" : "Save profile"}</Button>{save.isError && <p role="alert" className="text-sm text-codekita-warning">{save.error.message}</p>}<p className="muted">Profile changes are saved to your account.</p></form>;
}