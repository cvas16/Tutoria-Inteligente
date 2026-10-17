import { describe, expect, it } from "vitest";
import { formatPercentage, formatDuration } from "@/lib/format";

describe("Pruebas Unitarias de Formato (lib/format.ts)", () => {
  it("debe transformar decimales a porcentajes legibles con un decimal", () => {
    expect(formatPercentage(0.8523)).toBe("85.2%");
    expect(formatPercentage(0.0)).toBe("0.0%");
    expect(formatPercentage(1.0)).toBe("100.0%");
  });

  it("debe tolerar valores ya expresados en escala de 0 a 100", () => {
    expect(formatPercentage(85.23)).toBe("85.2%");
  });

  it("debe convertir segundos a formatos de horas y minutos comprensibles", () => {
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(1800)).toBe("30 min");
    expect(formatDuration(45)).toBe("0 min");
  });
});