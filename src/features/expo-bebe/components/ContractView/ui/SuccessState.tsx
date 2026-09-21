import QRCode from "react-qr-code";
import styles from "@assets/css/expo-bebe.module.css";
import type { ContractFormVM } from "../hooks/useContractForm";

export function SuccessState({ vm }: { vm: ContractFormVM }) {
  const {
    nombre,
    contractLink,
    hasCopiedLink,
    setHasCopiedLink,
    resetForm,
    bookingWarning,
  } = vm;

  return (
    <div className={styles.cfSuccess}>
      <div className={styles.cfSuccessIcon}>✓</div>
      <div className={styles.cfSuccessTitle}>contrato generado</div>
      <p className={styles.cfSuccessText}>
        El contrato para <strong>{nombre || "el cliente"}</strong> fue creado
        exitosamente.
      </p>
      {bookingWarning && (
        <p role="alert" className={styles.cfSuccessText}>
          ⚠️ {bookingWarning}
        </p>
      )}
      {contractLink && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "20px 0",
          }}
        >
          <QRCode value={contractLink} size={200} />
        </div>
      )}
      <div className={styles.cfSuccessActions}>
        {contractLink && (
          <button
            type="button"
            className={styles.cfSuccessBtn}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(contractLink);
                setHasCopiedLink(true);
                setTimeout(() => setHasCopiedLink(false), 1500);
              } catch {}
            }}
          >
            {hasCopiedLink ? "✓ Copiado" : "Copiar link"}
          </button>
        )}
        <button className={styles.cfCta} onClick={resetForm} type="button">
          Nuevo contrato
        </button>
      </div>
    </div>
  );
}
