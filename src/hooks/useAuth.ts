import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import type { SessionPayload } from "@codekita/shared";
import { queryClient } from "@/lib/queryClient";
export function useAuth() {
    const { user, isLoading, setUser, setLoading } = useAuthStore();
    const login = async (email: string, password: string): Promise<{ ok: true; user: SessionPayload } | { ok: false; error: unknown }> => {
        setLoading(true);
        try {
            const { user: u } = (await api.auth.login(email, password)) as {
                user: SessionPayload;
            };
            await queryClient.cancelQueries();
            queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "session" });
            queryClient.setQueryData(["session"], u);
            setUser(u as SessionPayload);
            return { ok: true, user: u };
        }
        catch (error) {
            return { ok: false, error };
        }
        finally {
            setLoading(false);
        }
    };
    const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
        setLoading(true);
        try {
            const { user: u } = (await api.auth.register(email, password, firstName, lastName)) as {
                user: SessionPayload;
            };
            await queryClient.cancelQueries();
            queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "session" });
            queryClient.setQueryData(["session"], u);
            setUser(u as SessionPayload);
            return { ok: true };
        }
        catch (error) {
            return { ok: false, error };
        }
        finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        await api.auth.logout();
        await queryClient.cancelQueries();
        queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "session" });
        queryClient.setQueryData(["session"], null);
        setUser(null);
    };
    return { user, isLoading, login, register, logout };
}
