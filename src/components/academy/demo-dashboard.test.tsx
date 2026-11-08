import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { demoLesson, demoPath, demoPaths } from "@/data/static-demo";
import { DemoDashboard } from "./demo-dashboard";
import i18n from "@/lib/i18n";

beforeEach(async () => { await i18n.changeLanguage("en"); });
afterEach(cleanup);

describe("Demo learning dashboard", () => {
  it("updates the dashboard and static course details when the language changes", async () => {
    render(<MemoryRouter><DemoDashboard /></MemoryRouter>);
    await act(async () => { await i18n.changeLanguage("id"); });
    expect(screen.getByRole("heading", { name: "Jalur yang Diikuti" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dasar-dasar Programming" })).toBeInTheDocument();
    expect(screen.getByText(/Pahami cara kerja web/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Lanjutkan Belajar" })).toHaveLength(3);
    await act(async () => { await i18n.changeLanguage("en"); });
    expect(screen.getByRole("heading", { name: "Enrolled learning paths" })).toBeInTheDocument();
  });
  it("labels the preview and uses existing paths and lessons for every action", () => {
    const { container } = render(<MemoryRouter><DemoDashboard /></MemoryRouter>);
    expect(screen.getByText(/all enrollments, progress and achievements below are examples/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Programming Fundamentals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cybersecurity Fundamentals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI Engineering Fundamentals" })).toBeInTheDocument();
    for (const path of demoPaths) {
      const card = screen.getByRole("heading", { name: path.academy === "programming" ? "Programming Fundamentals" : path.title }).closest("article")!;
      expect(within(card).getByRole("link", { name: /view full path/i })).toHaveAttribute("href", `/paths/${path.slug}`);
      const href = within(card).getByRole("link", { name: /continue learning/i }).getAttribute("href")!;
      const [, , module, lesson] = href.split("/");
      expect(demoLesson(module, lesson).path.slug).toBe(path.slug);
      const title = path.academy === "programming" ? "Programming Fundamentals" : path.title;
      expect(within(card).getByRole("progressbar", { name: `${title} progress` })).toHaveAttribute("aria-valuenow", String(Math.round((path.academy === "ai" ? 0 : 1) / path.lessonCount * 100)));
      expect(demoPath(path.slug).moduleCount).toBe(demoPath(path.slug).modules.length);
    }
    expect(container.querySelectorAll("a[href^='/learn/']").length).toBeGreaterThan(0);
  });

  it("switches tabs and expands and collapses module lists", () => {
    render(<MemoryRouter><DemoDashboard /></MemoryRouter>);
    const toggle = screen.getByRole("button", { name: /hide modules/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).not.toBeVisible();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.mouseDown(screen.getByRole("tab", { name: /modules in progress/i }), { button: 0 });
    expect(screen.getByRole("heading", { name: "Modules in progress" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /how the web works/i })).toHaveAttribute("href", "/learn/how-the-web-works/semantic-html");
    fireEvent.mouseDown(screen.getByRole("tab", { name: /enrolled learning paths/i }), { button: 0 });
    expect(screen.getByRole("heading", { name: "Enrolled learning paths" })).toBeInTheDocument();
  });
});