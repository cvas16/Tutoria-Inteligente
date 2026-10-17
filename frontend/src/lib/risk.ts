export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export function getRiskLevelFromProbability(prob: number): RiskLevel {
  if (prob >= 0.65) return "HIGH";
  if (prob >= 0.35) return "MEDIUM";
  return "LOW";
}

export function getRiskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "bg-red-100 text-red-700 border-red-200";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "LOW":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}