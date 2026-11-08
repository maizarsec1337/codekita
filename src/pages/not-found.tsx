import { ErrorPage } from "@/pages/error-page";

export function NotFoundPage() {
  return <ErrorPage code={404} />;
}