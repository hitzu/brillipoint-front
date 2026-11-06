import React, { useEffect } from "react";
import { Modal, Toast } from "react-bootstrap";
import { usePayments } from "./usePayments";
import { PaymentsList } from "./PaymentsList";
import { PaymentForm } from "./PaymentForm";
import { TransportSection } from "./TransportSection";

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
    transport,
    savingTransport,
    fetchTransport,
    saveTransport,
  } = usePayments();

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
          <PaymentsList payments={payments} loading={loading} />

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

          <h6 className="mb-3">Agregar pago</h6>
          <PaymentForm contractId={contractId} onSubmit={addPayment} />
        </Modal.Body>
      </Modal>
    </>
  );
}
