import { NextResponse, type NextRequest } from "next/server";


export function middleware(request: NextRequest) {
  const token = request.cookies.get("its_session_token")?.value;
  const role = request.cookies.get("its_user_role")?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas de acceso
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Redirigir a login si no hay token de sesión
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protección de rutas por Rol (RBAC)
  if (pathname.startsWith("/tutor")) {
    if (role === "TUTOR" || role === "ADMIN") {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL(role === "STUDENT" ? "/student" : "/login", request.url)
    );
  }

  if (pathname.startsWith("/student")) {
    if (role === "STUDENT") {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      new URL(role === "TUTOR" || role === "ADMIN" ? "/tutor" : "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tutor/:path*", "/student/:path*", "/login"],
};