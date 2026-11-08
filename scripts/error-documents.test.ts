import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

describe("standalone server error documents", () => {
  it("is generated from current CodeKita tokens and translation resources", () => {
    execFileSync(process.execPath, ["scripts/generate-error-documents.mjs", "--check"]);
  });

  it.each([403, 404, 500, 503])("renders %s without React, external assets, scripts or APIs", (code) => {
    const html = readFileSync(`public/status/${code}.html`, "utf8");
    const dom = new JSDOM(html);
    const document = dom.window.document;
    expect(document.querySelector("h1")?.textContent).toBeTruthy();
    expect(document.querySelector("noscript")?.textContent).toContain("Back to home");
    expect(document.querySelectorAll("script[src], link[rel=stylesheet], img[src]" )).toHaveLength(0);
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    expect(html).not.toContain("fetch(");
    expect(html).not.toContain("/assets/");
    expect(document.querySelector("a.ck-static-logo")?.getAttribute("href")).toBe("/");
    dom.window.close();
  });

  it("shares the existing language preference and switches without reloading", () => {
    const html = readFileSync("public/status/404.html", "utf8");
    const dom = new JSDOM(html, {
      url: "https://codekita.example/missing.png", runScripts: "dangerously",
      beforeParse(window) { window.localStorage.setItem("codekita-language", "en"); },
    });
    const { document } = dom.window;
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toContain("Page not found");
    const select = document.querySelector("select")!;
    select.value = "id";
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    expect(document.documentElement.lang).toBe("id");
    expect(dom.window.localStorage.getItem("codekita-language")).toBe("id");
    expect(document.title).toContain("Halaman tidak ditemukan");
    expect(dom.window.location.pathname).toBe("/missing.png");
    dom.window.close();
  });

  it("remains usable when storage is blocked", () => {
    const dom = new JSDOM(readFileSync("public/status/500.html", "utf8"), {
      url: "https://codekita.example/failure", runScripts: "dangerously",
      beforeParse(window) { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); },
    });
    const select = dom.window.document.querySelector("select")!;
    select.value = "id";
    select.dispatchEvent(new dom.window.Event("change"));
    expect(dom.window.document.documentElement.lang).toBe("id");
    expect(dom.window.document.querySelector<HTMLButtonElement>("#error-retry")?.hidden).toBe(false);
    dom.window.close();
  });

  it("does not offer a meaningless retry on direct static document previews", () => {
    const dom = new JSDOM(readFileSync("public/status/500.html", "utf8"), { url: "https://codekita.example/status/500.html", runScripts: "dangerously" });
    expect(dom.window.document.querySelector<HTMLButtonElement>("#error-retry")?.hidden).toBe(true);
    dom.window.close();
  });

  it("configures local status-preserving documents and conservative SPA fallback", () => {
    const rules = readFileSync("public/.htaccess", "utf8");
    for (const code of [403, 404, 500, 503]) expect(rules).toContain(`ErrorDocument ${code} /status/${code}.html`);
    expect(rules).toContain("%{REQUEST_FILENAME} -f");
    expect(rules).toContain("%{REQUEST_FILENAME} -d");
    expect(rules).toContain("^(?:api|assets|status)(?:/|$)");
    expect(rules).toContain("RewriteRule \\.[^/]+$ - [L]");
    expect(rules).toContain("%{REQUEST_METHOD} ^(?:GET|HEAD)$");
    expect(rules).toContain("%{HTTP_ACCEPT} text/html");
    expect(rules).not.toContain("[R");
  });
});