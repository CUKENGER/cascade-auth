export type User = {
  id: string;
  email: string;
  role: "USER" | "PLATFORM_ADMIN";
};

export type LoginResponse = {
  user: User;
};

export type CreateProjectResponse = {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
};

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "Ошибка запроса");
  } catch {
    return "Ошибка запроса";
  }
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function createProject(
  name: string,
): Promise<CreateProjectResponse> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
