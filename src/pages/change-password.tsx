import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/auth.store";

export function ChangePasswordPage() {
  const { t } = useTranslation("auth");
  const { user, isLoading, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (isLoading) return <p role="status" className="p-8">{t("Checking session")}</p>;
  if (!user) return <Navigate to="/login" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirm) { setError(t("Passwords do not match")); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[\s\S]{16,256}$/.test(newPassword)) { setError(t("Password policy")); return; }
    setPending(true); setError("");
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      await queryClient.cancelQueries();
      queryClient.clear();
      setUser(null);
      navigate("/login", { replace: true });
    } catch { setError(t("Password change failed")); }
    finally { setPending(false); }
  };
  return <div className="flex min-h-[60vh] items-center justify-center px-4 py-12"><Card className="w-full max-w-md"><CardHeader><CardTitle>{t("Change password")}</CardTitle><CardDescription>{t("Password change required")}</CardDescription></CardHeader><CardContent>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("Password policy")}</p>
      <div className="space-y-2"><Label htmlFor="current-password">{t("Current password")}</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrent(event.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="new-password">{t("New password")}</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={event => setNew(event.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">{t("Confirm new password")}</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} required /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{t("Save password")}</Button>
    </form>
  </CardContent></Card></div>;
}