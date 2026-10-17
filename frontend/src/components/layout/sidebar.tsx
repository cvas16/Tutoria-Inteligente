"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
}

const TUTOR_NAV_ITEMS: NavItem[] = [
  {
    label: "Monitoreo del Aula",
    href: "/tutor",
    icon: "📊",
    description: "Semáforo y KPIs de cohorte",
  },
  {
    label: "Bandeja de Alertas",
    href: "/tutor/alerts",
    icon: "🚨",
    description: "Casos activos y diagnóstico XAI",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
      <div className="mb-6 px-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navegación Docente
        </p>
        <p className="text-xs font-medium text-slate-600">Ciclo Académico 2026-1</p>
      </div>

      <nav className="space-y-1.5">
        {TUTOR_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/tutor"
              ? pathname === "/tutor"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-3 rounded-xl p-3 text-xs transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="font-bold">{item.label}</p>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-500">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Tarjeta de soporte metodológico UPN */}
      <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50 p-4 text-[11px]">
        <p className="font-bold text-slate-700">Validación Experimental</p>
        <p className="mt-1 leading-relaxed text-slate-500">
          Muestra evaluada de $n = 30$ alumnos bajo diseño cuasiexperimental.
        </p>
      </div>
    </aside>
  );
}