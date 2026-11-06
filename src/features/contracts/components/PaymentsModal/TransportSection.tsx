import React, { useEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import type { ContractTransportStatus } from "../../../../interfaces";

export const TRANSPORT_STATUS_LABELS: Record<ContractTransportStatus, string> =
  {
    included: "Incluido sin costo",
    pending_quote: "Por cotizar",
    quoted: "Cotizado",
  };

interface TransportSectionProps {
  status: ContractTransportStatus;
  amount: number | null;
  saving: boolean;
  onSave: (status: ContractTransportStatus, amount?: number) => Promise<boolean>;
}

export function TransportSection({
  status,
  amount,
  saving,
  onSave,
}: TransportSectionProps) {
  const [draftStatus, setDraftStatus] =
    useState<ContractTransportStatus>(status);
  const [draftAmount, setDraftAmount] = useState<string>(
    amount != null ? String(amount) : ""
  );

  useEffect(() => {
    setDraftStatus(status);
    setDraftAmount(amount != null ? String(amount) : "");
  }, [status, amount]);

  const isQuoted = draftStatus === "quoted";
  const parsedAmount = Number(draftAmount);
  const invalidAmount = isQuoted && !(parsedAmount > 0);
  const unchanged =
    draftStatus === status && (!isQuoted || parsedAmount === (amount ?? 0));

  return (
    <div>
      <h6 className="mb-3">Traslado</h6>
      <div className="d-flex flex-wrap gap-2 align-items-end">
        <Form.Group style={{ minWidth: 200 }}>
          <Form.Label>Estado</Form.Label>
          <Form.Select
            value={draftStatus}
            onChange={(e) =>
              setDraftStatus(e.target.value as ContractTransportStatus)
            }
          >
            {(
              Object.entries(TRANSPORT_STATUS_LABELS) as [
                ContractTransportStatus,
                string,
              ][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {isQuoted && (
          <Form.Group style={{ minWidth: 160 }}>
            <Form.Label>Monto (MXN)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={draftAmount}
              isInvalid={invalidAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
            />
          </Form.Group>
        )}

        <Button
          variant="primary"
          disabled={saving || invalidAmount || unchanged}
          onClick={() => onSave(draftStatus, isQuoted ? parsedAmount : undefined)}
        >
          {saving ? "Guardando..." : "Guardar traslado"}
        </Button>
      </div>
      {isQuoted && (
        <Alert variant="info" className="mt-3 mb-0">
          El monto se suma al saldo del cliente y se paga el día del evento.
        </Alert>
      )}
    </div>
  );
}
