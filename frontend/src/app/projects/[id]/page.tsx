import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

const API_URL = process.env.API_URL;

type Project = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!API_URL) {
    throw new Error("API_URL is not configured");
  }

  const { id } = await params;
  const token = (await cookies()).get("accessToken")?.value;

  if (!token) {
    redirect("/");
  }

  const response = await fetch(
    `${API_URL}/projects/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    redirect("/");
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Не удалось загрузить компанию");
  }

  const project: Project = await response.json();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/projects"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Все компании
        </Link>

        <header className="mt-8">
          <p className="text-sm text-slate-400">Компания</p>
          <h1 className="mt-2 text-3xl font-semibold">{project.name}</h1>
        </header>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-medium">Настройки компании</h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-400">ID</dt>
              <dd className="mt-1 break-all">{project.id}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Ваша роль</dt>
              <dd className="mt-1">{project.role}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-medium">Лестница авторизации</h2>
          <p className="mt-2 text-sm text-slate-400">
            Здесь появится редактор каскада после подключения соответствующего
            API.
          </p>
        </section>
      </div>
    </main>
  );
}
