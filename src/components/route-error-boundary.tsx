import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorPage, type ErrorCode } from "@/pages/error-page";

/** Only deliberate router Responses carry route status. API errors remain with
 * their existing query/form handlers; an unhandled render failure is a 500. */
export function routeErrorCode(error: unknown): ErrorCode {
  if (isRouteErrorResponse(error)) {
    if (error.status === 403 || error.status === 404 || error.status === 503) return error.status;
  }
  return 500;
}

export function RouteErrorBoundary() {
  const code = routeErrorCode(useRouteError());
  return <ErrorPage code={code} reloadDocument onRetry={code >= 500 ? () => window.location.reload() : undefined} />;
}