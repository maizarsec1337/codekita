import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { createInstance } from "i18next";
import i18n, { createLanguageDetector, i18nOptions } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

function Location() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("en"); });
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("Language selection", () => {
  it("switches instantly, persists the preference and preserves the route", async () => {
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={["/dashboard"]}><LanguageSwitcher /><Location /></MemoryRouter>);
    fireEvent.change(screen.getByRole("combobox", { name: "Language" }), { target: { value: "id" } });
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Bahasa" })).toHaveValue("id"));
    expect(document.documentElement.lang).toBe("id");
    expect(localStorage.getItem("codekita-language")).toBe("id");
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    fireEvent.change(screen.getByRole("combobox", { name: "Bahasa" }), { target: { value: "en" } });
    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
    expect(localStorage.getItem("codekita-language")).toBe("en");
  });

  it("uses the Indonesian fallback and a supplied default for missing keys", async () => {
    const instance = createInstance();
    await instance.init({ ...i18nOptions, lng: "en", resources: {
      id: { common: { fallback: "Cadangan", empty: "Tidak kosong" } },
      en: { common: { empty: "" } },
    } });
    expect(instance.t("fallback")).toBe("Cadangan");
    expect(instance.t("empty")).toBe("Tidak kosong");
    expect(instance.t("missing-test", { defaultValue: "Safe fallback" })).toBe("Safe fallback");
  });

  it("detects a saved preference before the browser language on a fresh instance", async () => {
    localStorage.setItem("codekita-language", "id");
    const instance = createInstance();
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["en-US"]);
    const detected = createLanguageDetector();
    await instance.use(detected).init(i18nOptions);
    expect(instance.resolvedLanguage).toBe("id");
    expect(instance.t("language")).toBe("Bahasa");
  });

  it.each([
    [null, ["en-US"], "en"],
    [null, ["id-ID"], "id"],
    [null, ["fr-FR"], "id"],
    ["fr", ["en-GB"], "en"],
  ] as const)("detects saved %s and browser %s as %s", async (saved, browser, expected) => {
    localStorage.clear();
    if (saved) localStorage.setItem("codekita-language", saved);
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue([...browser]);
    vi.spyOn(window.navigator, "language", "get").mockReturnValue(browser[0]);
    const instance = createInstance();
    await instance.use(createLanguageDetector()).init(i18nOptions);
    expect(instance.resolvedLanguage).toBe(expected);
  });

  it("still detects and switches languages when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled"); });
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["en-US"]);
    const instance = createInstance();
    await instance.use(createLanguageDetector()).init(i18nOptions);
    expect(instance.resolvedLanguage).toBe("en");
    await instance.changeLanguage("id");
    expect(instance.t("language")).toBe("Bahasa");
  });
});