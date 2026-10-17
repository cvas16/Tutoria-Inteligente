import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("its_session_token")?.value;
  const role = cookieStore.get("its_user_role")?.value;

  if (!token || (role !== "TUTOR" && role !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Barra Lateral Institucional */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
            ITS
          </div>
          <span className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Universidad Privada del Norte
          </span>
          <h2 className="text-base font-bold text-slate-900">
            Panel del Tutor Docente
          </h2>
        </div>

        <nav className="space-y-1.5 text-xs font-semibold">
          <Link
            href="/tutor"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>📊</span> Monitoreo del Aula
          </Link>
          <Link
            href="/tutor/alerts"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>🚨</span> Bandeja de Alertas
          </Link>
        </nav>
      </aside>

      {/* Contenedor de Vistas */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}