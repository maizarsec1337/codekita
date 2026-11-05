"use client";

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-tight"
          aria-label="CodeKita home"
        >
          <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
            CK
          </div>
          <span className="text-xl">CodeKita</span>
        </Link>

        <nav className="hidden md:flex md:gap-1 md:items-center">
          <Link
            to="/"
            className={cn("text-sm font-medium transition-colors", isActive("/") ? "text-blue-600" : "text-muted-foreground hover:text-foreground")}
          >
            Home
          </Link>
          <Link
            to="/courses"
            className={cn("text-sm font-medium transition-colors", isActive("/courses") ? "text-blue-600" : "text-muted-foreground hover:text-foreground")}
          >
            Courses
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ApiStatusIndicator />
          {isLoading ? (
            <span className="text-xs text-muted-foreground">loading…</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
              {isAdmin ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin-dashboard")}
                    className="h-8 px-2"
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="h-8 px-2"
                  >
                    User Dashboard
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 px-2"
                >
                  <LogOut className="h-4 w-4 mr-1" /> Sign out
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-pressed"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Open menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <div className="px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={cn("block text-sm font-medium transition-colors", isActive("/") ? "text-blue-600" : "text-muted-foreground hover:text-foreground")}
            >
              Home
            </Link>
            <Link
              to="/courses"
              onClick={() => setMenuOpen(false)}
              className={cn("block text-sm font-medium transition-colors", isActive("/courses") ? "text-blue-600" : "text-muted-foreground hover:text-foreground")}
            >
              Courses
            </Link>
            {user ? (
              <>
                <p className="px-3 text-xs text-muted-foreground">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-sm font-medium text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}