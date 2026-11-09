// Static hosting can use a separate API. Without one, only public content is available.
// Build-time constants let Vite remove backend-only branches from the static release.
export const isStaticFrontend = !__CODEKITA_BACKEND_ENABLED__;
export const apiBase = __CODEKITA_API_BASE__;