import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useFormik } from "formik";
import * as yup from "yup";
import type { Payment, PaymentMethod } from "../../../../interfaces";
import {
  uploadPaymentReceipt,
  validatePaymentReceiptFile,
} from "../../../../api/services/paymentService";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentFormPayload,
  type PaymentFormValues,
} from "./types";

const validationSchema = yup.object().shape({
  amount: yup
    .number()
    .typeError("El monto debe ser un número")
    .positive("El monto debe ser mayor a 0")
    .required("El monto es requerido"),
  method: yup
    .string<PaymentMethod>()
    .oneOf(["cash", "transfer", "card"])
    .required("El método es requerido"),
  receivedAt: yup.string().required("La fecha es requerida"),
  note: yup.string(),
  reference: yup.string(),
});

function nowForDatetimeLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return nowForDatetimeLocal();
  }
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface PaymentFormProps {
  contractId: number;
  /** When set, the form edits this payment instead of creating one. */
  payment?: Payment | null;
  onSubmit: (payload: PaymentFormPayload) => Promise<boolean>;
  onCancel?: () => void;
}

export function PaymentForm({
  contractId,
  payment = null,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const isEdit = payment !== null;
  const [file, setFile] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const emptyValues = (): PaymentFormValues => ({
    amount: "",
    method: "cash",
    receivedAt: nowForDatetimeLocal(),
    note: "",
    reference: "",
  });

  const formik = useFormik<PaymentFormValues>({
    initialValues: payment
      ? {
          amount: String(payment.amount),
          method: payment.method,
          receivedAt: toDatetimeLocal(payment.receivedAt),
          note: payment.note ?? "",
          reference: payment.reference ?? "",
        }
      : emptyValues(),
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const carriesReceipt =
        values.method === "transfer" || values.method === "card";
      // Editing sends null to clear a field; creating just omits it.
      const empty = isEdit ? null : undefined;

      const reference = carriesReceipt ? values.reference.trim() : "";
      const note = values.note.trim();
      const payload: PaymentFormPayload = {
        amount: Number(values.amount),
        method: values.method,
        receivedAt: new Date(values.receivedAt).toISOString(),
        reference: reference || empty,
        note: note || empty,
      };

      if (carriesReceipt && file) {
        try {
          payload.receiptPath = await uploadPaymentReceipt(contractId, file);
        } catch (error) {
          console.error("Error uploading receipt:", error);
          setReceiptError("No se pudo subir el comprobante. Intenta de nuevo.");
          return;
        }
      } else if (isEdit && removeReceipt) {
        payload.receiptPath = null;
      }

      const success = await onSubmit(payload);
      if (success && !isEdit) {
        resetForm({ values: emptyValues() });
        setFile(null);
        setRemoveReceipt(false);
      }
    },
  });

  const showsReceipt =
    formik.values.method === "transfer" || formik.values.method === "card";
  const currentReceiptUrl =
    isEdit && !removeReceipt ? payment?.receiptUrl ?? null : null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setReceiptError(null);
      return;
    }
    const invalid = validatePaymentReceiptFile(selected);
    if (invalid) {
      setFile(null);
      setReceiptError(invalid);
      event.target.value = "";
      return;
    }
    setReceiptError(null);
    setFile(selected);
  };

  return (
    <Form onSubmit={formik.handleSubmit}>
      <div className="row g-3">
        <Form.Group className="col-sm-6">
          <Form.Label>Monto</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            name="amount"
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            isInvalid={formik.touched.amount && !!formik.errors.amount}
          />
          <Form.Control.Feedback type="invalid">
            {formik.errors.amount}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="col-sm-6">
          <Form.Label>Método</Form.Label>
          <Form.Select
            name="method"
            value={formik.values.method}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            isInvalid={formik.touched.method && !!formik.errors.method}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {formik.errors.method}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="col-sm-6">
          <Form.Label>Fecha de pago</Form.Label>
          <Form.Control
            type="datetime-local"
            name="receivedAt"
            value={formik.values.receivedAt}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            isInvalid={formik.touched.receivedAt && !!formik.errors.receivedAt}
          />
          <Form.Control.Feedback type="invalid">
            {formik.errors.receivedAt}
          </Form.Control.Feedback>
        </Form.Group>

        {showsReceipt && (
          <Form.Group className="col-sm-6">
            <Form.Label>Referencia (opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="bank-tx-123"
              name="reference"
              value={formik.values.reference}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.reference && !!formik.errors.reference}
            />
            <Form.Control.Feedback type="invalid">
              {formik.errors.reference}
            </Form.Control.Feedback>
          </Form.Group>
        )}

        {showsReceipt && (
          <Form.Group className="col-12">
            <Form.Label>Subir comprobante (PDF, opcional)</Form.Label>
            <Form.Control
              type="file"
              name="receipt"
              accept="application/pdf"
              onChange={handleFileChange}
              isInvalid={!!receiptError}
            />
            <Form.Control.Feedback type="invalid">
              {receiptError}
            </Form.Control.Feedback>
            {currentReceiptUrl && !file && (
              <div className="mt-1">
                <a
                  href={currentReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver comprobante actual
                </a>{" "}
                <Button
                  size="sm"
                  variant="link"
                  className="text-danger"
                  onClick={() => setRemoveReceipt(true)}
                >
                  Quitar comprobante
                </Button>
              </div>
            )}
            {isEdit && removeReceipt && (
              <div className="mt-1 text-muted">
                El comprobante se quitará al guardar.{" "}
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => setRemoveReceipt(false)}
                >
                  Deshacer
                </Button>
              </div>
            )}
          </Form.Group>
        )}

        <Form.Group className="col-12">
          <Form.Label>Nota (opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Nota del pago"
            name="note"
            value={formik.values.note}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </Form.Group>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        {onCancel && (
          <Button type="button" variant="light" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Registrar pago"}
        </Button>
      </div>
    </Form>
  );
}
