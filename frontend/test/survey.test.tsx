import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LikertForm } from "@/components/survey/likert-form";

// Mock de la llamada fetch nativa
global.fetch = vi.fn();

describe("Instrumento Psicométrico: LikertForm (Anexo 3)", () => {
  it("debe renderizar los bloques correspondientes a las 3 dimensiones del estudio", () => {
    render(<LikertForm studentId="student-uuid-test" />);

    expect(
      screen.getByText("Dimensión 1: Detección oportuna del riesgo académico")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dimensión 2: Reducción de barreras de monitoreo continuo")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Dimensión 3: Efectividad de alertas tempranas y tutoría adaptativa"
      )
    ).toBeInTheDocument();
  });

  it("debe transmitir los 12 ítems completados al hacer submit", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, id: "survey-rec-1" }),
    });

    render(<LikertForm studentId="student-uuid-test" />);

    expect(screen.getByRole("button", { name: "Responda los 12 ítems" })).toBeDisabled();
    screen.getAllByRole("button", { name: /^1 Totalmente$/ }).forEach((button) => {
      fireEvent.click(button);
    });

    const submitBtn = screen.getByRole("button", { name: "Finalizar y Registrar Evaluación" });
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/surveys",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    const bodySent = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(bodySent.student_id).toBe("student-uuid-test");
    const answerKeys = Object.keys(bodySent).filter((key) => key.startsWith("q")).sort();
    expect(answerKeys).toEqual([
      "q01", "q02", "q03", "q04", "q05", "q06",
      "q07", "q08", "q09", "q10", "q11", "q12",
    ]);
    answerKeys.forEach((key) => {
      expect(bodySent[key]).toBeGreaterThanOrEqual(1);
      expect(bodySent[key]).toBeLessThanOrEqual(5);
    });
  });
});