"use client";

import { useLogin } from "@/lib/mutations";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    try {
      await loginMutation.mutateAsync({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });

      router.push("/projects");
      router.refresh();
    } catch {
      // Ошибка отображается из loginMutation.error.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 font-bold text-slate-950">
            C
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Вход в Cascade
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Войдите в кабинет своей компании
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8"
        >
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Электронная почта
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
            className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400"
          />

          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Пароль
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Введите пароль"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-20 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-3 text-xs text-slate-400 hover:text-white"
            >
              {showPassword ? "Скрыть" : "Показать"}
            </button>
          </div>

          {loginMutation.error && (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {loginMutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-6 w-full rounded-lg bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {loginMutation.isPending ? "Входим…" : "Войти"}
          </button>
        </form>
      </section>
    </main>
  );
}
