import { describe, expect, it } from "vitest";
import { assertSequence, streaks } from "./progress";
describe("Server-side sequential progression", () => {
  it("allows the first lesson", () => { expect(() => assertSequence(["a", "b"], [], "a")).not.toThrow(); });
  it("allows the next lesson after its prerequisite", () => { expect(() => assertSequence(["a", "b"], ["a"], "b")).not.toThrow(); });
  it("rejects skipping ahead", () => { expect(() => assertSequence(["a", "b", "c"], ["a"], "c")).toThrow(); });
  it("rejects foreign lesson IDs", () => { expect(() => assertSequence(["a"], [], "foreign")).toThrow(); });
  it("does not confuse unrelated completions with prerequisites", () => { expect(() => assertSequence(["a", "b"], ["foreign"], "b")).toThrow(); });
});
describe("UTC learning streaks", () => {
  const now = new Date("2026-11-06T12:00:00Z");
  it("returns zero for no validated activity", () => { expect(streaks([], now)).toEqual({ daily: 0, weekly: 0 }); });
  it("counts unique dates rather than multiple events", () => { expect(streaks([new Date("2026-11-06T00:05:00Z"), new Date("2026-11-06T08:00:00Z"), new Date("2026-11-05T13:00:00Z")], now).daily).toBe(2); });
  it("keeps yesterday’s streak alive until today ends", () => { expect(streaks([new Date("2026-11-05T14:00:00Z")], now).daily).toBe(1); });
  it("breaks an old daily streak", () => { expect(streaks([new Date("2026-11-03T14:00:00Z")], now).daily).toBe(0); });
  it("counts consecutive active weeks", () => { expect(streaks([new Date("2026-11-06T00:00:00Z"), new Date("2026-10-30T00:00:00Z")], now).weekly).toBe(2); });
});