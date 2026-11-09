"use client";

import { useEffect, useState } from "react";
import { academyApi } from "@/lib/academy-api";
import type { PathSummary } from "@codekita/shared";
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from "@/components/ui";
import { Link } from "react-router-dom";
import { isStaticFrontend } from "@/lib/mode";
import { useTranslation } from "react-i18next";

export function CoursesPage() {
  const { t } = useTranslation("common");
  const [courses, setCourses] = useState<PathSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const limit = 6;
  const totalPages = Math.ceil(courses.length / limit);
  const visible = courses.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    academyApi
      .paths()
      .then((response) => {
        if (!cancelled) {
          setCourses(response);
          setPage(1);
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
  }, [attempt]);

  if (loading) {
    return (
      <div role="status" aria-label="Loading courses" className="px-4 sm:px-6 lg:px-8 py-8 flex gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('courseCatalogue')}</h1>
        {!error && (
          <p className="text-sm text-muted-foreground">
            {t('showingCourses', { count: visible.length, total: courses.length })}
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border p-6 text-center">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setAttempt((previous) => previous + 1)}
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
          {visible.map((course) => (
            <Card key={course.id} className="flex h-full flex-col">
              <CardHeader>
                <Badge variant="outline">
                  {isStaticFrontend ? t("previewCatalogue") : t("published")}
                </Badge>
                <CardTitle><Link className="hover:text-primary" to={`/paths/${course.slug}`}>{course.title}</Link></CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description ?? "No description available."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {course.slug}
                </p>
                <Link className="mt-4 inline-block text-sm text-primary underline" to={`/paths/${course.slug}`}>{t('viewCourse')}</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="disabled:opacity-50 disabled:pointer-events-none text-sm font-medium text-blue-600 hover:underline"
          >
            ← Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
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