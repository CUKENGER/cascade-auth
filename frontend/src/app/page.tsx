import LoginForm from "@/components/login-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const token = (await cookies()).get("accessToken")?.value;
  const apiUrl = process.env.API_URL;

  if (token && apiUrl) {
    const response = await fetch(`${apiUrl}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);

    if (response?.ok) {
      redirect("/projects");
    }
  }

  return <LoginForm />;
}
