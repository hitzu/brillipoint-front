import styles from "@assets/css/expo-bebe.module.css";
import { IconPlus } from "../../Icons";
import { SectionHead } from "../../SectionHead";
import type { ContractFormVM } from "../hooks/useContractForm";
import { QuantityStepper } from "./QuantityStepper";

export function ExtrasSection({ vm }: { vm: ContractFormVM }) {
  const {
    items,
    extrasCatalog,
    selectedExtraId,
    setSelectedExtraId,
    selectedExtraPackageClientRef,
    setSelectedExtraPackageClientRef,
    extraItems,
    getTierDiscount,
    isLocked,
    handleAgregarExtra,
    setExtraItemQuantity,
    removeExtraItem,
    setExtraItemGift,
  } = vm;

  // Position (0-indexed) the next extra would take within its target package's tier sequence.
  // Gifts take no tier slot, matching how the API assigns tiers.
  const nextPositionForTarget = extraItems.filter(
    (it) => !it.isGift && it.packageClientRef === selectedExtraPackageClientRef,
  ).length;
  const nextDiscount = selectedExtraPackageClientRef
    ? getTierDiscount(selectedExtraPackageClientRef, nextPositionForTarget)
    : 0;

  // Running position counter per package, to resolve the tier each already-added extra got.
  const seenByPackage: Record<string, number> = {};

  return (
    <section className={styles.panel}>
      <SectionHead n="03b" text="extras /" accent="adicionales" />

      {items.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <label className={styles.cfLabel}>Paquete al que pertenece</label>
          <select
            className={styles.cfSelect}
            value={selectedExtraPackageClientRef}
            onChange={(e) => setSelectedExtraPackageClientRef(e.target.value)}
            disabled={isLocked}
          >
            <option value="">Sin vincular</option>
            {items.map((it) => (
              <option key={it.clientRef} value={it.clientRef}>
                {it.pkg.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <label className={styles.cfLabel}>Extra</label>
        <select
          className={styles.cfSelect}
          value={selectedExtraId}
          onChange={(e) =>
            setSelectedExtraId(e.target.value ? Number(e.target.value) : "")
          }
          disabled={isLocked}
        >
          <option value="">Selecciona…</option>
          {extrasCatalog.map((extra) => (
            <option key={extra.id} value={extra.id}>
              {extra.name} — ${extra.price.toLocaleString("es-MX")}
            </option>
          ))}
        </select>
        {nextDiscount > 0 && (
          <div style={{ marginTop: 6, fontWeight: 600, color: "#1a7f37" }}>
            {nextDiscount >= 100
              ? "Este extra sale GRATIS"
              : `Este extra sale con ${nextDiscount}% de descuento`}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.cfAddBtn}
        onClick={handleAgregarExtra}
        disabled={!selectedExtraId || isLocked}
      >
        <IconPlus /> Agregar al contrato
      </button>

      {extraItems.length === 0 ? (
        <div className={styles.cfEmptyState}>Aún no has agregado extras</div>
      ) : (
        <div className={styles.cfProductList}>
          {extraItems.map((it, i) => {
            let discount = 0;
            if (!it.isGift) {
              const key = it.packageClientRef ?? "";
              const positionIndex = seenByPackage[key] ?? 0;
              seenByPackage[key] = positionIndex + 1;
              discount = getTierDiscount(it.packageClientRef, positionIndex);
            }

            return (
              <div key={it.extra.id} className={styles.cfProductItem}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className={styles.cfProductNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className={styles.cfProductName}>{it.extra.name}</div>
                  <div className={styles.cfProductPrice}>
                    {it.isGift ? (
                      <span style={{ fontWeight: 600, color: "#1a7f37" }}>
                        Regalo · $0
                      </span>
                    ) : (
                      `$${(it.extra.price * it.quantity).toLocaleString("es-MX")}`
                    )}
                    {it.quantity > 1 && (
                      <span style={{ fontWeight: 400, opacity: 0.7 }}>
                        {" "}
                        ({it.quantity}×)
                      </span>
                    )}
                    {discount > 0 && (
                      <span style={{ fontWeight: 600, color: "#1a7f37" }}>
                        {" "}
                        ({discount}% off)
                      </span>
                    )}
                  </div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                      fontSize: 12,
                      cursor: isLocked ? "default" : "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Regalo: ${it.extra.name}`}
                      checked={!!it.isGift}
                      onChange={(e) =>
                        setExtraItemGift(it.extra.id, e.target.checked)
                      }
                      disabled={isLocked}
                    />
                    Regalo
                  </label>
                </div>
              </div>
              {!isLocked && (
                <QuantityStepper
                  value={it.quantity}
                  itemName={it.extra.name}
                  onChange={(quantity) =>
                    setExtraItemQuantity(it.extra.id, quantity)
                  }
                  onRemove={() => removeExtraItem(it.extra.id)}
                />
              )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
