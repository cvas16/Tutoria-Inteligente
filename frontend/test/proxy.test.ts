import { describe, expect, it } from "vitest";

describe("Validación de Políticas de Acceso por Rol (RBAC)", () => {
  function resolveTargetRoute(token: string | null, role: string | null, requestedPath: string): string {
    if (!token) return "/login";
    if (requestedPath.startsWith("/tutor")) {
      if (role === "TUTOR" || role === "ADMIN") return requestedPath;
      return role === "STUDENT" ? "/student" : "/login";
    }
    if (requestedPath.startsWith("/student")) {
      if (role === "STUDENT") return requestedPath;
      return role === "TUTOR" || role === "ADMIN" ? "/tutor" : "/login";
    }
    return requestedPath;
  }

  it("debe redirigir al login si no existe token de sesión activo", () => {
    const route = resolveTargetRoute(null, null, "/tutor/alerts");
    expect(route).toBe("/login");
  });

  it("debe bloquear el acceso de un estudiante a la bandeja docente (/tutor)", () => {
    const route = resolveTargetRoute("jwt-token-valido", "STUDENT", "/tutor/alerts");
    expect(route).toBe("/student");
  });

  it("debe autorizar al tutor docente el acceso a las rutas analíticas", () => {
    const route = resolveTargetRoute("jwt-token-valido", "TUTOR", "/tutor/alerts");
    expect(route).toBe("/tutor/alerts");
  });

  it("debe redirigir a login cuando la sesión no tiene un rol válido", () => {
    expect(resolveTargetRoute("jwt-token-valido", null, "/tutor/alerts")).toBe("/login");
    expect(resolveTargetRoute("jwt-token-valido", "UNKNOWN", "/student")).toBe("/login");
  });
});