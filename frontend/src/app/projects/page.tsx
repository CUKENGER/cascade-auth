import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.API_URL;

type Project = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export default async function ProjectsPage() {
  if (!API_URL) {
    throw new Error("API_URL is not configured");
  }

  const token = (await cookies()).get("accessToken")?.value;

  if (!token) {
    redirect("/");
  }

  const response = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/");
  }

  if (!response.ok) {
    throw new Error("Не удалось загрузить проекты");
  }

  const projects: Project[] = await response.json();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-semibold">Компании</h1>

        {projects.length === 0 ? (
          <p className="text-slate-400">У вас пока нет доступных компаний.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-cyan-400"
                >
                  <h2 className="font-medium">{project.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Роль: {project.role}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
