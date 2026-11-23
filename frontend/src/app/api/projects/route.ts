import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL is not configured" },
      { status: 500 },
    );
  }

  const token = (await cookies()).get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Необходима авторизация" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const backendResponse = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await backendResponse.json();

  return NextResponse.json(data, { status: backendResponse.status });
}
