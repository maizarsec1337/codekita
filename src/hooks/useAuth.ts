import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import type { SessionPayload } from "@codekita/shared";
import { queryClient } from "@/lib/queryClient";
import { isStaticFrontend } from "@/lib/mode";

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const login = async (email: string, password: string) => {
    if (isStaticFrontend) return { ok: false, error: new Error("Authentication requires a configured CodeKita backend.") };
    setLoading(true);
    try {
      const { user: u } = (await api.auth.login(email, password)) as { user: SessionPayload };
      queryClient.clear();
      setUser(u as SessionPayload);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    if (isStaticFrontend) return { ok: false, error: new Error("Registration requires a configured CodeKita backend.") };
    setLoading(true);
    try {
      const { user: u } = (await api.auth.register(email, password, firstName, lastName)) as { user: SessionPayload };
      queryClient.clear();
      setUser(u as SessionPayload);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isStaticFrontend) return;
    await api.auth.logout();
    queryClient.clear();
    setUser(null);
  };

  return { user, isLoading, login, register, logout };
}