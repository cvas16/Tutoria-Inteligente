import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShapBarChart } from "@/components/charts/shap-bar-chart";

describe("Componente Explicable: ShapBarChart", () => {
  const mockShapData = {
    inactivity_days: 0.4521,
    avg_score_evaluations: 0.312,
    late_submissions_count: 0.185,
  };

  it("debe renderizar las etiquetas pedagógicas traducidas y los valores cuantitativos", () => {
    render(<ShapBarChart shapSummary={mockShapData} maxDisplay={3} />);

    // Verifica que se traduzcan las variables del modelo a lenguaje docente
    expect(
      screen.getByText("Días de inactividad continuos en plataforma")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rezago en notas de evaluaciones formativas")
    ).toBeInTheDocument();

    // Comprueba el valor numérico exacto de SHAP
    expect(screen.getByText("+0.4521")).toBeInTheDocument();
  });

  it("debe mostrar el mensaje de contingencia si no se reciben factores de riesgo", () => {
    render(<ShapBarChart shapSummary={{}} />);
    expect(
      screen.getByText(
        "No se registran factores críticos de incremento de riesgo para este estudiante."
      )
    ).toBeInTheDocument();
  });
});