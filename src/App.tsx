import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "@/components/error-boundary";
import { router } from "@/app/router";

const ERROR_FALLBACK = (
  <div className="flex h-full flex-col items-center justify-center text-center px-6">
    <h1 className="text-2xl font-bold">Something went wrong</h1>
    <p className="mt-2 text-muted-foreground">
      An unexpected error occurred. Refreshing the page may resolve it.
    </p>
  </div>
);

export function App() {
  return (
    <ErrorBoundary fallback={ERROR_FALLBACK}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}