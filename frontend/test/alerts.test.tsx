import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlertTable, AlertRow } from "@/components/alerts/alert-table";
import { AlertInbox } from "@/components/alerts/alert-inbox";

describe("Componente: AlertTable", () => {
  const mockAlerts: AlertRow[] = [
    {
      id: "alert-1",
      first_name: "Juan",
      last_name: "Pérez",
      institutional_id: "N00012345",
      course_code: "SIS-101",
      dropout_probability: 0.825,
      risk_level: "HIGH",
      status: "PENDING",
      recommendation_text: "Refuerzo prioritario por inactividad prolongada.",
    },
  ];

  it("debe pintar el código del alumno, curso y porcentaje semafórico", () => {
    render(<AlertTable alerts={mockAlerts} />);

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("N00012345")).toBeInTheDocument();
    expect(screen.getByText("82.5%")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("debe disparar el callback de intervención al hacer clic en 'Intervenir'", () => {
    const onInterveneMock = vi.fn();
    render(<AlertTable alerts={mockAlerts} onOpenIntervention={onInterveneMock} />);

    const button = screen.getByText("Intervenir");
    fireEvent.click(button);

    expect(onInterveneMock).toHaveBeenCalledTimes(1);
    expect(onInterveneMock).toHaveBeenCalledWith(mockAlerts[0]);
  });

  it("filtra por criticidad y permite derivar un caso a intervención", () => {
    const alerts: AlertRow[] = [
      ...mockAlerts,
      {
        ...mockAlerts[0],
        id: "alert-2",
        first_name: "Ana",
        risk_level: "MEDIUM",
        status: "NOTIFIED",
      },
    ];
    render(<AlertInbox alerts={alerts} />);

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "HIGH" } });
    expect(screen.getByText("Mostrando 1 de 2 casos. Registrar una intervención deriva el caso al tutor autenticado.")).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Pérez")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Intervenir" }));
    expect(screen.getByText("Registrar Intervención Tutoral")).toBeInTheDocument();
  });
});