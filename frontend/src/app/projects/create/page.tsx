"use client";

import { useCreateProject } from "@/lib/mutations";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

export default function CreateProjectPage() {
  const router = useRouter();
  const createMutation = useCreateProject();
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const project = await createMutation.mutateAsync(name.trim());
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      // Ошибка отображается через createMutation.error ниже.
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6"
      >
        <h1 className="mb-6 text-2xl font-semibold">Создание проекта</h1>

        <label htmlFor="project-name" className="mb-2 block text-sm">
          Название проекта
        </label>
        <input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например, Cascade Demo"
          maxLength={100}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
        />

        {createMutation.error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {createMutation.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="mt-6 w-full rounded-lg bg-cyan-400 px-4 py-3 font-medium text-slate-950 disabled:opacity-60"
        >
          {createMutation.isPending ? "Создаём…" : "Создать проект"}
        </button>
      </form>
    </main>
  );
}
