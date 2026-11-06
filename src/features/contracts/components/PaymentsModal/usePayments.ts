import { useCallback, useState } from "react";
import type {
  ContractTransportStatus,
  CreatePaymentPayload,
  Payment,
} from "../../../../interfaces";
import {
  getContractById,
  updateContractTransport,
} from "../../../../api/services/contractService";
import {
  createPayment,
  getPayments,
} from "../../../../api/services/paymentService";

type ToastVariant = "success" | "danger";

interface ToastState {
  show: boolean;
  message: string;
  variant: ToastVariant;
}

const initialToast: ToastState = {
  show: false,
  message: "",
  variant: "success",
};

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [transport, setTransport] = useState<{
    status: ContractTransportStatus;
    amount: number | null;
    balanceDue: number | null;
  }>({ status: "pending_quote", amount: null, balanceDue: null });
  const [savingTransport, setSavingTransport] = useState(false);
  const [toast, setToast] = useState<ToastState>(initialToast);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast({ show: true, message, variant });
  }, []);

  const fetchPayments = useCallback(
    async (contractId: number) => {
      setLoading(true);
      try {
        const response = await getPayments(contractId);
        setPayments(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error fetching payments:", error);
        setPayments([]);
        showToast("Error al cargar los pagos", "danger");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const applyDetail = useCallback(
    (detail: Awaited<ReturnType<typeof getContractById>>) => {
      setTransport({
        status: detail.contract.transportStatus ?? "pending_quote",
        amount: detail.contract.transportAmount ?? null,
        balanceDue: detail.balanceDue ?? null,
      });
    },
    []
  );

  const fetchTransport = useCallback(
    async (contractId: number) => {
      try {
        applyDetail(await getContractById(contractId));
      } catch (error) {
        console.error("Error fetching contract transport:", error);
      }
    },
    [applyDetail]
  );

  const saveTransport = useCallback(
    async (
      contractId: number,
      status: ContractTransportStatus,
      amount?: number
    ): Promise<boolean> => {
      setSavingTransport(true);
      try {
        applyDetail(await updateContractTransport(contractId, { status, amount }));
        showToast("Traslado actualizado", "success");
        return true;
      } catch (error) {
        console.error("Error updating transport:", error);
        showToast("Error al actualizar el traslado", "danger");
        return false;
      } finally {
        setSavingTransport(false);
      }
    },
    [applyDetail, showToast]
  );

  const addPayment = useCallback(
    async (payload: CreatePaymentPayload): Promise<boolean> => {
      try {
        await createPayment(payload);
        await Promise.all([
          fetchPayments(payload.contractId),
          fetchTransport(payload.contractId),
        ]);
        showToast("Pago registrado exitosamente", "success");
        return true;
      } catch (error) {
        console.error("Error creating payment:", error);
        showToast("Error al registrar el pago", "danger");
        return false;
      }
    },
    [fetchPayments, fetchTransport, showToast]
  );

  return {
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
  };
}
