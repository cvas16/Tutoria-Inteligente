"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  user?: {
    first_name: string;
    last_name: string;
    institutional_id: string;
    role: "STUDENT" | "TUTOR" | "ADMIN";
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      {/* Identidad Institucional */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
          ITS
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Universidad Privada del Norte
          </span>
          <h1 className="text-sm font-bold text-slate-900">
            Sistema de Tutoría Inteligente
          </h1>
        </div>
      </div>

      {/* Controles de Sesión y Perfil */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">
                {user.first_name} {user.last_name}
              </p>
              <p className="font-mono text-[10px] text-slate-400">
                {user.institutional_id} • {user.role}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                user.role === "TUTOR" || user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {user.role}
            </span>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          {loggingOut ? "Saliendo..." : "Cerrar Sesión"}
        </button>
      </div>
    </header>
  );
}