import React, { useEffect, useState } from "react";
import { Button, Modal, Toast } from "react-bootstrap";
import type { Payment } from "../../../../interfaces";
import { usePayments } from "./usePayments";
import { PaymentsList } from "./PaymentsList";
import { PaymentForm } from "./PaymentForm";
import { TransportSection } from "./TransportSection";
import type { PaymentFormPayload } from "./types";

interface PaymentsModalProps {
  show: boolean;
  handleClose: () => void;
  contractId: number;
}

const toastStyles = {
  position: "fixed" as const,
  top: "20px",
  right: "20px",
  zIndex: 9999,
};

export function PaymentsModal({
  show,
  handleClose,
  contractId,
}: PaymentsModalProps) {
  const {
    payments,
    loading,
    toast,
    hideToast,
    fetchPayments,
    addPayment,
    editPayment,
    removePayment,
    transport,
    savingTransport,
    fetchTransport,
    saveTransport,
  } = usePayments();

  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);

  const handleSubmit = async (payload: PaymentFormPayload): Promise<boolean> => {
    if (editing) {
      const ok = await editPayment(contractId, editing.id, payload);
      if (ok) setEditing(null);
      return ok;
    }
    return addPayment({
      contractId,
      ...payload,
      note: payload.note ?? undefined,
      reference: payload.reference ?? undefined,
    });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    await removePayment(contractId, target.id);
  };

  useEffect(() => {
    setEditing(null);
    setDeleting(null);
  }, [show, contractId]);

  useEffect(() => {
    if (show && contractId) {
      fetchPayments(contractId);
      fetchTransport(contractId);
    }
  }, [show, contractId, fetchPayments, fetchTransport]);

  return (
    <>
      <div style={toastStyles}>
        <Toast
          onClose={hideToast}
          show={toast.show}
          delay={4000}
          autohide
          bg={toast.variant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === "success" ? "Éxito" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </div>

      <Modal
        show={show}
        onHide={handleClose}
        size="lg"
        dialogClassName="modal-dialog-centered"
      >
        <Modal.Header closeButton>
          <Modal.Title as="h5">Pagos del contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6 className="mb-3">Pagos registrados</h6>
          <PaymentsList
            payments={payments}
            loading={loading}
            onEdit={setEditing}
            onDelete={setDeleting}
          />

          <hr className="my-4" />

          <TransportSection
            status={transport.status}
            amount={transport.amount}
            saving={savingTransport}
            onSave={(status, amount) =>
              saveTransport(contractId, status, amount)
            }
          />
          {transport.balanceDue != null && (
            <p className="mt-3 mb-0">
              Saldo a pagar el día del evento:{" "}
              <strong>
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  maximumFractionDigits: 0,
                }).format(transport.balanceDue)}
              </strong>
            </p>
          )}

          <hr className="my-4" />

          <h6 className="mb-3">{editing ? "Editar pago" : "Agregar pago"}</h6>
          <PaymentForm
            key={editing?.id ?? "new"}
            contractId={contractId}
            payment={editing}
            onSubmit={handleSubmit}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </Modal.Body>
      </Modal>

      <Modal
        show={deleting !== null}
        onHide={() => setDeleting(null)}
        dialogClassName="modal-dialog-centered"
      >
        <Modal.Header closeButton>
          <Modal.Title as="h5">Eliminar pago</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Seguro que quieres eliminar este pago? El saldo del contrato se
          recalculará.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
