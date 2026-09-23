import { useState } from "react";
import QRCode from "react-qr-code";
import { Alert, Button, Card } from "react-bootstrap";

export interface SuccessSectionProps {
  clientName: string;
  contractLink: string;
  bookingWarning: string | null;
  onReset: () => void;
  onGoToContracts: () => void;
}

const COPY_FEEDBACK_MS = 1500;

export function SuccessSection({
  clientName,
  contractLink,
  bookingWarning,
  onReset,
  onGoToContracts,
}: SuccessSectionProps) {
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractLink);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), COPY_FEEDBACK_MS);
    } catch {
      // Clipboard access can be denied or unavailable; the link is still
      // shown as plain text above, so the seller can select and copy it.
    }
  };

  return (
    <Card className="mb-3">
      <Card.Body className="text-center">
        <Card.Title as="h4">Contrato generado</Card.Title>
        <p>
          El contrato para <strong>{clientName || "el cliente"}</strong> fue
          creado exitosamente.
        </p>

        {bookingWarning ? (
          <Alert variant="warning" role="alert" className="text-start">
            {bookingWarning}
          </Alert>
        ) : null}

        {contractLink ? (
          <>
            <div className="d-flex justify-content-center my-3">
              <QRCode value={contractLink} size={200} />
            </div>
            <p className="text-break">{contractLink}</p>
          </>
        ) : null}

        <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
          {contractLink ? (
            <Button type="button" variant="outline-primary" onClick={handleCopy}>
              {hasCopiedLink ? "✓ Copiado" : "Copiar link"}
            </Button>
          ) : null}
          <Button type="button" variant="primary" onClick={onReset}>
            Nuevo contrato
          </Button>
          <Button type="button" variant="light" onClick={onGoToContracts}>
            Ir a contratos
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
