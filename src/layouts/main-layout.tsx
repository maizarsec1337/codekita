import { type ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { DemoBanner } from "@/components/demo-banner";

export function MainLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="sr-only z-50 rounded bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
      <Navbar />
      <DemoBanner />
      <main id="main-content" className="min-w-0 flex-1">{children ?? <Outlet />}</main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}