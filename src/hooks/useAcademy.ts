import { useQuery } from "@tanstack/react-query";
import { academyApi } from "@/lib/academy-api";
import { useAuth } from "./useAuth";
export function useLearning() {
    const { user } = useAuth();
    return useQuery({ queryKey: ["learning", user?.userId], queryFn: academyApi.dashboard, enabled: !!user });
}
