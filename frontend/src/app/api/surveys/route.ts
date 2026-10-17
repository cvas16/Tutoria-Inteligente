import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("its_session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para enviar la evaluación." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validación preliminar en el BFF: verificar que los 12 ítems existan y estén en escala 1-5
    const requiredKeys = [
      "q01", "q02", "q03", "q04", "q05", "q06",
      "q07", "q08", "q09", "q10", "q11", "q12",
    ];

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "El cuerpo de la encuesta debe ser un objeto." }, { status: 422 });
    }

    for (const key of requiredKeys) {
      const val = body[key];
      if (typeof val !== "number" || !Number.isInteger(val) || val < 1 || val > 5) {
        return NextResponse.json(
          { error: `El ítem ${key.toUpperCase()} debe contener una valoración entre 1 y 5.` },
          { status: 422 }
        );
      }
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar la clave interna de la API." },
        { status: 500 }
      );
    }

    // Reenvío al endpoint de FastAPI: POST /api/v1/surveys
    const backendRes = await fetch(`${BACKEND_URL}/surveys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al registrar el cuestionario Likert." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Fallo de conexión con el servicio de encuestas." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("its_session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar la clave interna de la API." },
        { status: 500 }
      );
    }

    // Consulta de métricas consolidadas: GET /api/v1/surveys/summary
    const backendRes = await fetch(`${BACKEND_URL}/surveys/summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.detail || "Error al obtener métricas consolidadas." },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error de comunicación con el servicio de métricas psicométricas." },
      { status: 500 }
    );
  }
}