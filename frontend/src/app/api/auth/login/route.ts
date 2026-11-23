import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL is not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();

  const backendResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json({ user: data.user });

  response.cookies.set("accessToken", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
