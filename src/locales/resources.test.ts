import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const directory = resolve(process.cwd(), "src/locales");
const files = (language: string) => readdirSync(resolve(directory, language)).filter((file) => file.endsWith(".json")).sort();
const read = (language: string, file: string) => JSON.parse(readFileSync(resolve(directory, language, file), "utf8")) as Record<string, string>;
const placeholders = (text: string) => [...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map((match) => match[1]).sort();

describe("bundled translation resources", () => {
  it("has matching namespaces in both languages", () => {
    expect(files("id")).toEqual(files("en"));
  });

  it.each(files("en"))("has complete, nonempty, interpolation-compatible keys in %s", (file) => {
    const english = read("en", file);
    const indonesian = read("id", file);
    expect(Object.keys(indonesian).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      for (const resource of [english, indonesian]) {
        expect(typeof resource[key], key).toBe("string");
        expect(resource[key].trim(), key).not.toBe("");
        expect(resource[key], key).not.toContain("\uFFFD");
      }
      expect(placeholders(indonesian[key]), key).toEqual(placeholders(english[key]));
    }
  });
});