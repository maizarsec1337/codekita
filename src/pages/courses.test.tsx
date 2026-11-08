import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { CoursesResponse } from "@codekita/shared";
import { api } from "@/lib/api";
import { demoCourses } from "@/data/static-demo";
import { CoursesPage } from "./courses";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const renderPage = () => render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CoursesPage /></MemoryRouter>);

describe("course catalog recovery", () => {
  it("handles repeated retry failures and recovers on a later attempt", async () => {
    const request = vi.spyOn(api, "courses")
      .mockRejectedValueOnce(new Error("First request failed"))
      .mockRejectedValueOnce(new Error("Retry failed"))
      .mockResolvedValueOnce(demoCourses());
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("First request failed");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Retry failed");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Web Development Fundamentals" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(request).toHaveBeenCalledTimes(3);
  });

  it("shows loading while changing pages and removes stale pagination on failure", async () => {
    let rejectPage!: (reason: Error) => void;
    const pending = new Promise<CoursesResponse>((_resolve, reject) => { rejectPage = reject; });
    vi.spyOn(api, "courses")
      .mockResolvedValueOnce({ ...demoCourses(), meta: { page: 1, limit: 6, total: 12, totalPages: 2 } })
      .mockReturnValueOnce(pending);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Next →" }));
    expect(screen.getByRole("status", { name: "Loading courses" })).toBeInTheDocument();
    await act(async () => { rejectPage(new Error("Page unavailable")); });
    expect(await screen.findByRole("alert")).toHaveTextContent("Page unavailable");
    expect(screen.queryByText("Page 2 of 2")).toBeNull();
  });
});