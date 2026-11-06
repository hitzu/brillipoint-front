import { Button, Modal } from "react-bootstrap";

interface NoDepositConfirmModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * Shown when the seller submits a contract with no deposit: the reservation
 * page is created and the date is held, but the contract only becomes active
 * once the first payment is registered.
 */
export function NoDepositConfirmModal({
  show,
  onConfirm,
  onCancel,
  disabled = false,
}: NoDepositConfirmModalProps) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Contrato sin anticipo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-2">
          Se va a crear la página de recibo y se apartará la fecha en la
          agenda, pero el contrato no estará activo hasta registrar un pago.
        </p>
        <p className="mb-0 text-muted">
          El cliente verá el recibo como vista previa, sin compromiso.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onCancel} disabled={disabled}>
          Volver
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={disabled}>
          Crear sin anticipo
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
