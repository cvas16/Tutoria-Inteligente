import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("its_session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Debe iniciar sesión como tutor." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Reenvío al endpoint de FastAPI: POST /api/v1/interventions
    const backendRes = await fetch(`${BACKEND_URL}/interventions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al registrar la intervención pedagógica." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Fallo de conexión con el servicio de intervenciones." },
      { status: 500 }
    );
  }
}