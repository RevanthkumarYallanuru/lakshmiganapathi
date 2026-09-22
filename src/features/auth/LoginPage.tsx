import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ApiError } from "@/api/client";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated) {
    const from =
      (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginForm) {
    setFormError(null);
    try {
      await login(values.username, values.password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : t("common.errorGeneric")
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-card border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {t("app.name")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("auth.loginTitle")}</p>
        <p className="text-sm text-slate-400">{t("auth.loginSubtitle")}</p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Input
            label={t("auth.username")}
            autoComplete="username"
            autoFocus
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label={t("auth.password")}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {formError && (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="mt-1">
            {t("auth.login")}
          </Button>
        </form>
      </div>
    </div>
  );
}
