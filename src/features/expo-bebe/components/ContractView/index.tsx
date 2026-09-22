import styles from "@assets/css/expo-bebe.module.css";
import type { ExpoBebeBrandKey } from "../../types";
import type { ContractPeriod } from "../../utils/calendar";
import { IconDoc } from "../Icons";
import { useContractForm } from "./hooks/useContractForm";
import { ClientSection } from "./ui/ClientSection";
import { DateSlotSection } from "./ui/DateSlotSection";
import { ExtrasSection } from "./ui/ExtrasSection";
import { NotesSection } from "./ui/NotesSection";
import { PaymentSection } from "./ui/PaymentSection";
import { ProductsSection } from "./ui/ProductsSection";
import { SuccessState } from "./ui/SuccessState";

interface ContractViewProps {
  brand: ExpoBebeBrandKey;
  brandId: number;
  brandName?: string | null;
  minAmountHoldSlot?: number | null;
  initialFecha?: string;
  initialPeriod?: ContractPeriod;
}

export function ContractView({
  brand,
  brandId,
  brandName,
  minAmountHoldSlot,
  initialFecha,
  initialPeriod,
}: ContractViewProps) {
  const vm = useContractForm({
    brandKey: brand,
    lockedBrandId: brandId,
    lockedBrandName: brandName ?? "",
    minAmountHoldSlot,
      initialFecha,
    initialPeriod,
  });

  if (vm.contract) {
    return <SuccessState vm={vm} />;
  }

  return (
    <div className={styles.cfForm}>
      <DateSlotSection vm={vm} />
      <ClientSection vm={vm} />
      <ProductsSection vm={vm} />
      <ExtrasSection vm={vm} />
      <PaymentSection vm={vm} />
      <NotesSection vm={vm} />

      {vm.errorMsg && <div className={styles.cfError}>{vm.errorMsg}</div>}

      <button
        type="button"
        className={styles.cfCta}
        onClick={vm.handleSubmit}
        disabled={vm.submitting || vm.items.length === 0}
      >
        {vm.submitting ? (
          "Generando…"
        ) : (
          <>
            <IconDoc /> Crear contrato
          </>
        )}
      </button>
    </div>
  );
}
