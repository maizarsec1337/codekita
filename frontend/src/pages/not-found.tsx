"use client";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        We couldn&rsquo;t find that page.
      </p>
      <div className="mt-8">
        <Button onClick={() => navigate("/")}>Go home</Button>
      </div>
    </div>
  );
}