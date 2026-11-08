import { createBrowserRouter } from "react-router-dom";
import { appRoutes } from "@/app/routes";

// Keep the single browser-router instance separate from the testable route tree.
export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(appRoutes);