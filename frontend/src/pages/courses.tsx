"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CoursesResponse } from "@codekita/shared";
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from "@/components/ui";

export function CoursesPage() {
  const [courses, setCourses] = useState<CoursesResponse["data"]>([]);
  const [meta, setMeta] = useState<CoursesResponse["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 6;

  useEffect(() => {
    let cancelled = false;
    api
      .courses({ page, limit })
      .then((response) => {
        if (!cancelled) {
          setCourses(response.data);
          setMeta(response.meta);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load courses");
          setCourses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, limit]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Course catalog</h1>
        {meta && (
          <p className="text-sm text-muted-foreground">
            Showing {courses.length} of {meta.total} courses
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border p-6 text-center">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              api.courses({ page, limit }).then((r) => {
                setCourses(r.data);
                setMeta(r.meta);
              });
            }}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {courses.length === 0 && !error && (
        <div className="rounded-xl border p-12 text-center">
          <p>No courses available yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Published courses appear here once added to the catalog.
          </p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="flex h-full flex-col">
              <CardHeader>
                <Badge variant="outline">
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description ?? "No description available."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {course.slug}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="disabled:opacity-50 disabled:pointer-events-none text-sm font-medium text-blue-600 hover:underline"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
            className="disabled:opacity-50 disabled:pointer-events-none text-sm font-medium text-blue-600 hover:underline"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}