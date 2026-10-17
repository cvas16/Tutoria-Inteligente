import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("its_session_token")?.value;
  const userRole = request.cookies.get("its_user_role")?.value;
  const { pathname } = request.nextUrl;

  // Redireccionar a login si intenta ingresar sin token
  if (!token && (pathname.startsWith("/tutor") || pathname.startsWith("/student"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Control de acceso según el rol
  if (pathname.startsWith("/tutor") && userRole !== "TUTOR" && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  if (pathname.startsWith("/student") && userRole !== "STUDENT") {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tutor/:path*", "/student/:path*"],
};