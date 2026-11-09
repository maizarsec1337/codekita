"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { isStaticFrontend } from "@/lib/mode";
import { Logo } from "@/components/academy/shared";
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
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: LoginForm) => {
    if (isStaticFrontend) { setServerError(t("backendUnavailable")); return; }
    setServerError("");
    const result = await login(data.identifier, data.password);
    if (result.ok) {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith("/") && !from.startsWith("//") ? from : "/dashboard", { replace: true });
    } else {
      const err = result.error as ApiError;
      setServerError(
        (err.body as { message?: string })?.message ?? err.message ?? t("Login failed. Please try again."),
      );
      toast({
        title: t("Login failed"),
        description: (err.body as { message?: string })?.message ?? err.message ?? t("Please try again."),
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center"><Logo /></div>
          <CardTitle className="text-2xl">{t("Sign in")}</CardTitle>
          <CardDescription>
            {isStaticFrontend ? t("backendUnavailable") : t("Enter your CodeKita account credentials")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div role="status" className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700 border border-red-100">
              {isStaticFrontend ? t(serverError) : serverError}
            </div>
          )}
          {isStaticFrontend && <Button asChild className="mb-4 w-full"><Link to="/paths">{t("browseCurriculum")}</Link></Button>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset className="space-y-4" disabled={isStaticFrontend || isLoading}>
            <div className="space-y-2">
              <Label htmlFor="identifier">{t("Identifier")}</Label>
              <Input
                id="identifier"
                placeholder={t("name@example.com or username")}
                autoComplete={isStaticFrontend ? "off" : "username"}
                {...register("identifier")}
                disabled={isLoading}
              />
              {errors.identifier && (
                <p className="text-xs text-red-600">{t(errors.identifier.message ?? "")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isStaticFrontend ? "off" : "current-password"}
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{t(errors.password.message ?? "")}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isStaticFrontend ? t("serviceUnavailable") : t("Sign in")}
            </Button>
            </fieldset>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <p className="text-sm text-center text-muted-foreground">
            {t("Don't have an account?")}{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:underline">
              {t("Create one")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}