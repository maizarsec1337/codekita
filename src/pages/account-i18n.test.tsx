import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";

vi.mock("@/lib/mode", () => ({ isStaticFrontend: true }));
import { ProfilePage, SettingsPage } from "./account";

beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("en"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); delete document.documentElement.dataset.reducedMotion; });

describe("account translations", () => {
  it("updates profile text without translating the example identity", async () => {
    render(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    await act(async () => { await i18n.changeLanguage("id"); });
    expect(screen.getByRole("heading", { name: "Profil" })).toBeInTheDocument();
    expect(screen.getByText("demo@example.test")).toBeInTheDocument();
    expect(screen.getByText("Email akun")).toBeInTheDocument();
  });

  it("updates settings and retains the selected preference", async () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    const preference = screen.getByRole("checkbox");
    fireEvent.click(preference);
    const selected = (preference as HTMLInputElement).checked;
    await act(async () => { await i18n.changeLanguage("id"); });
    expect(screen.getByRole("heading", { name: "Pengaturan" })).toBeInTheDocument();
    expect(screen.getByText("Kurangi gerakan antarmuka")).toBeInTheDocument();
    expect(preference).toHaveProperty("checked", selected);
    expect(localStorage.getItem("ck-reduced-motion")).toBe(String(selected));
    expect(document.documentElement.dataset.reducedMotion).toBe(String(selected));
  });

  it("keeps storage failures readable when switching language", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    render(<SettingsPage />);
    expect(screen.getByRole("status")).toHaveTextContent("This browser does not allow saving preferences.");
    await act(async () => { await i18n.changeLanguage("id"); });
    expect(screen.getByRole("status")).toHaveTextContent("Browser ini tidak mengizinkan penyimpanan preferensi.");
  });
});