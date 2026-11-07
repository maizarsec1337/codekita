import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import type { SessionPayload } from "@codekita/shared";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const login = async (email: string, password: string) => {
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
    try {
      await api.auth.logout();
    } catch (error) { throw error; }
    queryClient.clear();
    setUser(null);
  };

  return { user, isLoading, login, register, logout };
}