"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { CourseDto } from "@codekita/shared";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@/components/ui";
import { GraduationCap } from "lucide-react";

const CATEGORIES = [
  {
    name: "Web Development",
    description: "HTML, CSS, JavaScript, and modern frameworks",
  },
  {
    name: "Data & AI",
    description: "Data analysis, machine learning, and artificial intelligence",
  },
  {
    name: "Design",
    description: "Visual design, prototyping, and user experience",
  },
  {
    name: "DevOps",
    description: "Deployment, infrastructure, and cloud fundamentals",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .courses({ page: 1, limit: 6 })
      .then((response) => {
        if (!cancelled) setCourses(response.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load courses",
          );
          setCourses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Learn to build.{" "}
            <span className="text-blue-600">Start with CodeKita.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A free, open education platform for developers. Courses, modules,
            and lessons — organized so you can focus on building.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/courses")}
            >
              Browse courses
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/register")}>
              Create an account
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold mb-6">Explore categories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              to="/courses"
              className="flex flex-col gap-2 rounded-xl border p-6 hover:bg-accent transition-colors"
            >
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Course discovery */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Available courses</h2>
        </div>

        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border p-12 text-center">
            <p>{error ?? "No courses available yet."}</p>
            {!error && (
              <p className="mt-2 text-sm text-muted-foreground">
                Published courses appear here once added to the catalog.
              </p>
            )}
          </div>
        ) : (
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Platform intro */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 border-t">
        <h2 className="text-xl font-semibold mb-6">About CodeKita</h2>
        <p className="text-muted-foreground max-w-2xl">
          CodeKita is a developer education platform built with React, Vite,
          NestJS, Fastify, PostgreSQL, and Prisma. The frontend talks to a real
          REST API — no mock data, no fabricated records.
        </p>
      </section>
    </div>
  );
}