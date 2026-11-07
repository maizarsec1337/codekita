"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { isStaticFrontend } from "@/lib/mode";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from "@/components/ui";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register: authRegister, isLoading } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: RegisterForm) => {
    if (isStaticFrontend) { reset(); setServerError("Demo only: input validated, but no account was created and nothing was saved."); return; }
    setServerError("");
    const result = await authRegister(
      data.email,
      data.password,
      data.firstName || undefined,
      data.lastName || undefined,
    );
    if (result.ok) {
      navigate("/dashboard");
    } else {
      const err = result.error as ApiError;
      setServerError(
        (err.body as { message?: string })?.message ?? err.message ?? "Registration failed. Please try again.",
      );
      toast({
        title: "Registration failed",
        description: (err.body as { message?: string })?.message ?? err.message ?? "Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            {isStaticFrontend ? "Demo only — use fictional inputs. No account is created." : "Join CodeKita to track your learning progress"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div role="status" className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700 border border-red-100">
              {serverError}
            </div>
          )}
          {isStaticFrontend && <Button asChild className="mb-4 w-full"><Link to="/dashboard">Explore demo dashboard</Link></Button>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete={isStaticFrontend ? "off" : "email"}
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isStaticFrontend ? "off" : "new-password"}
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name (optional)</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  {...register("firstName")}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name (optional)</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  {...register("lastName")}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isStaticFrontend ? "Validate demo form" : "Create account"}
            </Button>
            </fieldset>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}