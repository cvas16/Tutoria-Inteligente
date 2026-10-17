import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { message: errorData.detail || "Error de autenticación" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const cookieStore = cookies();

    cookieStore.set("its_session_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

    cookieStore.set("its_user_role", data.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ success: true, role: data.role });
  } catch (err) {
    return NextResponse.json(
      { message: "Fallo de conexión con el backend." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete("its_session_token");
  cookieStore.delete("its_user_role");
  return NextResponse.json({ success: true });
}