"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertFilters } from "./alert-filters";
import { AlertRow, AlertTable } from "./alert-table";
import { InterventionDialog } from "./intervention-dialog";

interface AlertInboxProps {
  alerts: AlertRow[];
}

export function AlertInbox({ alerts }: AlertInboxProps) {
  const router = useRouter();
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          (selectedRisk === "ALL" || alert.risk_level === selectedRisk) &&
          (selectedStatus === "ALL" || alert.status === selectedStatus)
      ),
    [alerts, selectedRisk, selectedStatus]
  );

  return (
    <div className="space-y-4">
      <AlertFilters
        selectedRisk={selectedRisk}
        selectedStatus={selectedStatus}
        onRiskChange={setSelectedRisk}
        onStatusChange={setSelectedStatus}
      />
      <p className="text-xs text-slate-500">
        Mostrando {filteredAlerts.length} de {alerts.length} casos. Registrar una intervención deriva el caso al tutor autenticado.
      </p>
      <AlertTable alerts={filteredAlerts} onOpenIntervention={setSelectedAlert} />
      <InterventionDialog
        alert={selectedAlert}
        isOpen={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
