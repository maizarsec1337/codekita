// Explicit Vite mode keeps the existing full-stack development/build paths intact.
export const isStaticFrontend = import.meta.env.MODE === "static";