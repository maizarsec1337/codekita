import { Link } from "react-router-dom";
import { isStaticFrontend } from "@/lib/mode";

export function DemoBanner() {
  if (!isStaticFrontend) return null;
  return <div role="note" className="border-b border-codekita-warning/30 bg-codekita-warning/10 px-4 py-3 text-center text-xs leading-5 text-foreground">Static demo · Example data only. No account, authentication, admin privileges, or saved progress. <Link className="underline underline-offset-2" to="/dashboard">User preview</Link> · <Link className="underline underline-offset-2" to="/admin-dashboard">Admin preview</Link></div>;
}