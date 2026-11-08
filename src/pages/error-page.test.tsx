import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { transferableAbortController } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, matchRoutes, MemoryRouter, RouterProvider } from "react-router-dom";
import { ErrorPage, type ErrorCode } from "./error-page";
import { ErrorBoundary } from "@/components/error-boundary";
import { routeErrorCode, RouteErrorBoundary } from "@/components/route-error-boundary";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/api";
import i18n from "@/lib/i18n";
import { appRoutes } from "@/app/routes";
import { AdminProtectedRoute } from "@/components/admin-protected-route";
import { ProtectedRoute } from "@/components/protected-route";

beforeEach(async () => {
  // Node's native Request needs a native signal, rather than jsdom's DOM signal.
  vi.stubGlobal("AbortController", class { constructor() { return transferableAbortController(); } });
  await i18n.changeLanguage("en");
  useAuthStore.setState({ user: null, isLoading: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); useAuthStore.setState({ user: null, isLoading: false }); });

describe("CodeKita error screens", () => {
  it.each([403, 404, 500, 503] as ErrorCode[])("renders localized, accessible recovery for %s", async (code) => {
    render(<MemoryRouter><ErrorPage code={code} /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: i18n.t(`${code}.title`, { ns: "errors" }) })).toHaveFocus();
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", "error-heading");
    expect(screen.getByRole("img")).toHaveAccessibleName(i18n.t(`${code}.illustration`, { ns: "errors" }));
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Back to dashboard" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(document.title).toContain(String(code));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    const selector = screen.getByRole("combobox", { name: "Language" });
    selector.focus();
    fireEvent.change(selector, { target: { value: "id" } });
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(i18n.t(`${code}.title`, { ns: "errors", lng: "id" })));
    expect(selector).toHaveFocus();
    expect(document.documentElement.lang).toBe("id");
    expect(localStorage.getItem("codekita-language")).toBe("id");
    expect(screen.getByRole("link", { name: "Beranda CodeKita" })).toHaveAttribute("href", "/");
  });

  it("shows a dashboard recovery only for a resolved signed-in session", () => {
    useAuthStore.setState({ user: { userId: "test", email: "learner@example.test", roles: ["STUDENT"] }, isLoading: true });
    render(<ErrorPage code={404} />);
    expect(screen.queryByRole("link", { name: "Back to dashboard" })).toBeNull();
    act(() => { useAuthStore.setState({ isLoading: false }); });
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/dashboard");
  });

  it("restores document metadata when leaving the error screen", () => {
    document.title = "Original page";
    const robots = document.createElement("meta");
    robots.name = "robots"; robots.content = "index, follow"; document.head.append(robots);
    const { unmount } = render(<ErrorPage code={404} />);
    unmount();
    expect(document.title).toBe("Original page");
    expect(robots.content).toBe("index, follow");
    robots.remove();
  });

  it("handles retry failures privately, blocks duplicate retries, and allows recovery", async () => {
    let rejectRetry: (reason: Error) => void = () => {};
    const retry = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectRetry = reject; }));
    render(<ErrorPage code={503} onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("button", { name: "Trying again…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Trying again…" }));
    expect(retry).toHaveBeenCalledTimes(1);
    await act(async () => { rejectRetry(new Error("secret-database-host")); });
    expect(screen.getByRole("status")).toHaveTextContent("The page is still unavailable");
    expect(screen.queryByText(/secret-database-host/)).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  });

  it.each([403, 404] as ErrorCode[])("does not offer retry for %s even if supplied", (code) => {
    render(<ErrorPage code={code} onRetry={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});

describe("route and render error boundaries", () => {
  it("uses route Response statuses, not backend statusCode properties or raw messages", () => {
    for (const code of [403, 404, 503]) expect(routeErrorCode({ status: code, statusText: "", internal: false, data: "private" })).toBe(code);
    expect(routeErrorCode(new ApiError(404, { secret: "payload" }))).toBe(500);
    expect(routeErrorCode({ statusCode: 403 })).toBe(500);
    expect(routeErrorCode(new Error("private detail"))).toBe(500);
  });

  it.each([403, 404, 500, 503] as ErrorCode[])("handles an intentional %s route response", async (code) => {
    const router = createMemoryRouter([{ path: "/", element: <p>Loading</p>, loader: () => { throw new Response("private-details", { status: code }); }, ErrorBoundary: RouteErrorBoundary }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(i18n.t(`${code}.title`, { ns: "errors" }));
    expect(screen.queryByText(/private-details/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" }) !== null).toBe(code >= 500);
    router.dispose();
  });

  function BrokenComponent(): never { throw new Error("private-render-details"); }
  it("catches unexpected route renders rather than exposing the router default error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createMemoryRouter([{ path: "/", Component: BrokenComponent, ErrorBoundary: RouteErrorBoundary }]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "Something went wrong." })).toBeInTheDocument();
    expect(screen.queryByText(/private-render-details/)).toBeNull();
    router.dispose();
  });

  it("renders the application fallback outside any router or query provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary fallback={<ErrorPage code={500} reloadDocument />}><BrokenComponent /></ErrorBoundary>);
    expect(screen.getByRole("heading", { name: "Something went wrong." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CodeKita home" })).toHaveAttribute("href", "/");
  });

  it.each(["/unknown-page", "/dashboard/unknown", "/missing/deep/route"])("uses a standalone 404 at %s", async (path) => {
    const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "A little off the learning path." })).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    router.dispose();
  });

  it("preserves public, course, dashboard and authentication route matching", () => {
    for (const path of ["/", "/courses", "/paths/example", "/login", "/register", "/dashboard", "/dashboard/modules", "/learn/module/section", "/admin-dashboard"]) {
      expect(matchRoutes(appRoutes, path)?.at(-1)?.route.path).not.toBe("*");
      expect(matchRoutes(appRoutes, path)).not.toBeNull();
    }
  });

  it("preserves unauthenticated login redirects and admin authorization redirects", async () => {
    const router = createMemoryRouter([
      { path: "/private", element: <ProtectedRoute><p>Private content</p></ProtectedRoute> },
      { path: "/admin", element: <AdminProtectedRoute><p>Admin content</p></AdminProtectedRoute> },
      { path: "/login", element: <h1>Login destination</h1> },
      { path: "/dashboard", element: <h1>Dashboard destination</h1> },
    ], { initialEntries: ["/private"] });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("heading", { name: "Login destination" })).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: "/private" });
    act(() => { useAuthStore.setState({ user: { userId: "test", email: "student@example.test", roles: ["STUDENT"] }, isLoading: false }); });
    await act(async () => { await router.navigate("/admin"); });
    expect(await screen.findByRole("heading", { name: "Dashboard destination" })).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).toBeNull();
    router.dispose();
  });
});