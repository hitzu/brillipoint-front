import styles from "@assets/css/expo-bebe.module.css";
import { blockById } from "../../../../../shared/scheduling/bookingBlocks";
import { SectionHead } from "../../SectionHead";
import type { ContractFormVM } from "../hooks/useContractForm";

export function DateSlotSection({ vm }: { vm: ContractFormVM }) {
  const {
    fecha,
    setFecha,
    isLocked,
    period,
    setPeriod,
    availabilityByPeriod,
    monthHasReservedDate,
    selectedUserId,
    setSelectedUserId,
    users,
    selectedBrandName,
  } = vm;

  // Labels and hours come from the shared block definition: expo sells the
  // same blocks the agenda books, so the range shown here is the range the
  // booking is written with.
  const range = (id: "am_block" | "pm_block") => {
    const block = blockById(id);
    return `${block.startsAt} – ${block.endsAt}`;
  };

  const slots = [
    {
      id: "am_block" as const,
      label: blockById("am_block").label,
      sub:
        availabilityByPeriod.matutine === false
          ? "No disponible"
          : range("am_block"),
    },
    {
      id: "pm_block" as const,
      label: blockById("pm_block").label,
      sub:
        availabilityByPeriod.vespertine === false
          ? "No disponible"
          : range("pm_block"),
    },
  ];

  return (
    <section className={styles.panel}>
      <SectionHead
        n="01"
        text="fecha de la reserva"
        accent=""
        accentSuffix={
          selectedBrandName ? `para ${selectedBrandName}` : undefined
        }
      />

      <div>
        <div className={styles.cfLabelRow}>
          <label className={styles.cfLabel}>
            Selecciona la fecha <span className={styles.cfRequired}>✦</span>
          </label>
          {monthHasReservedDate && (
            <span
              className={styles.riskDot}
              aria-label="Requiere validación"
              title="Requiere validación"
            />
          )}
        </div>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={`${styles.cfInput} ${styles.cfDateInput}`}
          disabled={isLocked}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <label className={styles.cfLabel}>Slot horario</label>
        <div className={styles.cfSlotRow}>
          {slots.map((s) => {
            const unavailable =
              (s.id === "am_block" &&
                availabilityByPeriod.matutine === false) ||
              (s.id === "pm_block" &&
                availabilityByPeriod.vespertine === false);
            return (
              <button
                key={s.id}
                type="button"
                className={`${styles.cfSlotBtn} ${period === s.id ? styles.cfSlotBtnActive : ""}`}
                onClick={() => !unavailable && setPeriod(s.id)}
                disabled={isLocked || unavailable}
                style={
                  unavailable
                    ? { opacity: 0.45, cursor: "not-allowed" }
                    : undefined
                }
              >
                <div
                  className={`${styles.cfSlotBtnTitle} ${period === s.id ? styles.cfSlotBtnTitleActive : ""}`}
                >
                  {s.label}
                </div>
                <div
                  className={`${styles.cfSlotBtnSub} ${period === s.id ? styles.cfSlotBtnSubActive : ""}`}
                >
                  {s.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className={styles.cfLabel}>
          Vendedor <span className={styles.cfRequired}>✦</span>
        </label>
        <select
          className={styles.cfSelect}
          value={selectedUserId}
          onChange={(e) =>
            setSelectedUserId(e.target.value ? Number(e.target.value) : "")
          }
          disabled={isLocked}
        >
          <option value="">Selecciona un vendedor</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? [u.firstName, u.lastName].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
