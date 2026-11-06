import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Markdown, tableOfContents } from "./markdown";
import { ProgressBar } from "./shared";
import { LabsPage } from "@/pages/labs";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuthStore } from "@/stores/auth.store";
afterEach(cleanup);
describe("Accessible learning primitives", () => {
  it("clamps progress values and exposes an accessible meter", () => { render(<ProgressBar value={150} label="Path progress" />); expect(screen.getByRole("progressbar", { name: "Path progress" })).toHaveAttribute("aria-valuenow", "100"); });
  it("renders fenced code without executing HTML", () => { const { container } = render(<Markdown content={'## A section\n\n<script>alert(1)</script>\n\n```html\n<img src=x onerror=alert(1)>\n```'} />); expect(container.querySelector("script")).toBeNull(); expect(container.querySelector("img")).toBeNull(); expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument(); });
  it("gives repeated headings distinct anchors", () => { expect(tableOfContents("## Topic\n\n## Topic")).toEqual([{ title: "Topic", id: "topic-0" }, { title: "Topic", id: "topic-1" }]); });
  it("does not treat fenced comments as table-of-contents headings", () => { expect(tableOfContents("```python\n# code comment\n```\n\n## Real heading")).toHaveLength(1); });
  it("renders semantic markdown tables", () => { render(<Markdown content={"| Status | Meaning |\n| --- | --- |\n| 200 | OK |"} />); expect(screen.getByRole("table")).toBeInTheDocument(); expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument(); });
});
describe("Honest lab preview", () => {
  it("disables execution and submission while preserving an editable draft", () => {
    render(<MemoryRouter><LabsPage /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Run code" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Submit solution" })).toBeDisabled();
    const editor = screen.getByRole("textbox", { name: "Solution code" }); fireEvent.change(editor, { target: { value: "const answer = 42;" } }); expect(editor).toHaveValue("const answer = 42;");
    fireEvent.click(screen.getByRole("button", { name: "Reset draft to starter" })); expect(editor).not.toHaveValue("const answer = 42;");
  });
  it("switches to defensive artifacts without a live terminal", () => { render(<MemoryRouter><LabsPage /></MemoryRouter>); fireEvent.click(screen.getByRole("button", { name: "Cybersecurity" })); expect(screen.getByRole("textbox", { name: "Investigation notes" })).toBeInTheDocument(); expect(screen.getByText("Investigate an access log")).toBeInTheDocument(); });
});
describe("Authentication gates", () => {
  it("does not display protected content while session hydration is pending", () => { useAuthStore.setState({ user: null, isLoading: true }); render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProtectedRoute><p>Private lesson</p></ProtectedRoute></QueryClientProvider></MemoryRouter>); expect(screen.queryByText("Private lesson")).toBeNull(); });
  it("renders protected content only for an authenticated account", () => { useAuthStore.setState({ user: { userId: "test-user", email: "test@example.test", roles: ["STUDENT"] }, isLoading: false }); render(<MemoryRouter><ProtectedRoute><p>Private lesson</p></ProtectedRoute></MemoryRouter>); expect(screen.getByText("Private lesson")).toBeInTheDocument(); });
});