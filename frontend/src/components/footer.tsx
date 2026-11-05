import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
              CK
            </div>
            <span className="font-semibold">CodeKita</span>
          </div>
          <div className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/courses" className="hover:text-foreground">
              Courses
            </Link>
          </div>
          <p className="text-xs">
            CodeKita is an educational technology platform. Course content is
            populated by the platform catalog.
          </p>
        </div>
      </div>
    </footer>
  );
}