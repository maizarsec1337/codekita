import { ReactNode, useEffect } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/auth.store";
import { api, ApiError } from "@/lib/api";
import type { SessionPayload } from "@codekita/shared";
import { ToastProvider } from "@/components/ui/use-toast";
export function Providers({ children }: {
    children: ReactNode;
}) {
    return <QueryClientProvider client={queryClient}><ToastProvider><SessionBootstrap />{children}</ToastProvider></QueryClientProvider>;
}
function SessionBootstrap() {
    const setUser = useAuthStore((state) => state.setUser);
    const setLoading = useAuthStore((state) => state.setLoading);
    const setSessionError = useAuthStore((state) => state.setSessionError);
    const session = useQuery({ queryKey: ["session"], queryFn: async () => {
      try { return (await api.auth.me() as { user: SessionPayload }).user; }
      catch (error) { if (error instanceof ApiError && error.statusCode === 401) return null; throw error; }
    }, retry: false, refetchOnWindowFocus: true });
    useEffect(() => {
        try {
            document.documentElement.dataset.reducedMotion = localStorage.getItem("ck-reduced-motion") ?? "false";
        }
        catch { /* Storage may be unavailable. */ }
    }, []);
    useEffect(() => {
      setLoading(session.isPending);
      setSessionError(session.isError ? session.error.message : null);
      if (session.isSuccess) setUser(session.data);
    }, [session.isPending, session.isError, session.isSuccess, session.error, session.data, setUser, setLoading, setSessionError]);
    return session.isError ? <div role="alert" className="border-b border-codekita-warning/30 bg-codekita-warning/10 px-4 py-3 text-center text-xs">Session service unavailable. {session.error.message} <button className="underline" onClick={() => void session.refetch()}>Retry</button></div> : null;
}
