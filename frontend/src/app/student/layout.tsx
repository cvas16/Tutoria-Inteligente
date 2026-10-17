import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("its_session_token")?.value;
  const role = cookieStore.get("its_user_role")?.value;

  if (!token || role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra de Navegación Superior del Estudiante */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
              ITS
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Universidad Privada del Norte
              </p>
              <h1 className="text-sm font-bold text-slate-800">
                Portal de Acompañamiento Académico
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/student"
              className="rounded-lg px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Mi Progreso
            </Link>
            <Link
              href="/student/survey"
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700 transition hover:bg-blue-100"
            >
              Cuestionario de Evaluación 
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}