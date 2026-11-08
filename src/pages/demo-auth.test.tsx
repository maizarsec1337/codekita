import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/auth.store";
import i18n from "@/lib/i18n";

vi.mock("@/lib/mode", () => ({ isStaticFrontend: true }));
import { LoginPage } from "./login";
import { RegisterPage } from "./register";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
beforeEach(async () => { await i18n.changeLanguage("en"); });

describe("Static demo forms", () => {
  it("shows Indonesian validation messages without changing the validation rules", async () => {
    await i18n.changeLanguage("id");
    useAuthStore.setState({ user: null, isLoading: false });
    render(<MemoryRouter><ToastProvider><LoginPage /></ToastProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Validasi formulir demo" }));
    expect(await screen.findByText("Kata sandi harus terdiri dari minimal 8 karakter")).toBeInTheDocument();
  });
  it.each([
    { name: "login", Page: LoginPage, identifier: "Identifier", confirmation: "no login occurred" },
    { name: "register", Page: RegisterPage, identifier: "Email address", confirmation: "no account was created" },
  ])("validates $name locally, clears input and creates no session", async ({ Page, identifier, confirmation }) => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    useAuthStore.setState({ user: null, isLoading: false });
    render(<MemoryRouter><ToastProvider><Page /></ToastProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Validate demo form" }));
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(identifier), { target: { value: "sample@example.test" } });
    const password = screen.getByLabelText("Password");
    fireEvent.change(password, { target: { value: "fictional-demo-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate demo form" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(confirmation));
    expect(password).toHaveValue("");
    expect(useAuthStore.getState().user).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});