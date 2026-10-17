import * as React from "react";

export type BadgeVariant =
  | "default"
  | "risk-high"
  | "risk-medium"
  | "risk-low"
  | "outline"
  | "secondary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    "risk-high": "bg-red-100 text-red-700 border-red-200",
    "risk-medium": "bg-amber-100 text-amber-700 border-amber-200",
    "risk-low": "bg-emerald-100 text-emerald-700 border-emerald-200",
    secondary: "bg-slate-100 text-slate-700 border-slate-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}