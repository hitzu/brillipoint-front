import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { Contract, Payment } from "../../../interfaces";
import { translatePaymentMethod } from "../../../shared/constants/paymentMethods";
import { formatLongSpanishDate } from "@common/dates";
import { useMemo } from "react";

const formatMoney = (amount: number) => {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
};

const formatPaymentDate = (raw: string) => {
  const base = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const d = new Date(base);
  return Number.isNaN(d.getTime()) ? "—" : formatLongSpanishDate(d);
};

const toTime = (raw: string) => {
  const d = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};

export const ReservationFinanceSection = ({
  contract,
  payments,
  paidAmount,
  balanceDue,
}: {
  contract: Contract;
  payments: Payment[];
  paidAmount: number;
  /** Server-computed balance (total + quoted transport - payments). */
  balanceDue?: number;
}) => {
  const paymentsSorted = useMemo(
    () =>
      (payments ?? [])
        .slice()
        .sort((a, b) => toTime(a?.receivedAt ?? "") - toTime(b?.receivedAt ?? "")),
    [payments]
  );

  const paid = useMemo(() => {
    if (paymentsSorted.length === 0) return paidAmount ?? 0;
    return paymentsSorted.reduce((sum, p) => sum + (p?.amount ?? 0), 0);
  }, [paidAmount, paymentsSorted]);

  const transportStatus = contract.transportStatus ?? "pending_quote";
  const transportAmount =
    transportStatus === "quoted" ? Number(contract.transportAmount ?? 0) : 0;
  const balance =
    balanceDue ?? Math.max(0, contract.total + transportAmount - paid);
  const isSettled = balance <= 0;

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Tu pago y saldo</h2>
          <div
            className={styles.sectionBody}
            style={{ display: "grid", gap: "0.75rem" }}
          >
            {contract.discountTotal > 0 && (
              <>
                <div className={styles.financeRow}>
                  <span>Subtotal</span>
                  <span className={styles.financeValue}>
                    {formatMoney(contract.subtotal)}
                  </span>
                </div>
                <div className={styles.financeRow}>
                  <span>Descuentos</span>
                  <span className={styles.financeDiscount}>
                    –{formatMoney(contract.discountTotal)}
                  </span>
                </div>
              </>
            )}

            <div className={styles.financeRow}>
              <span>Total del contrato</span>
              <span className={styles.financeValue}>
                {formatMoney(contract.total)}
              </span>
            </div>

            <div className={styles.financeRow}>
              <span>Pagos recibidos</span>
              <span className={styles.financePaid}>–{formatMoney(paid)}</span>
            </div>

            {transportStatus === "quoted" && (
              <div className={styles.financeRow}>
                <span>Traslado</span>
                <span className={styles.financeValue}>
                  +{formatMoney(transportAmount)}
                </span>
              </div>
            )}

            <div className={styles.divider} />

            {isSettled ? (
              <div className={styles.financeRow}>
                <span>Estado</span>
                <span className={[styles.badge, styles.badgeSuccess].join(" ")}>
                  ✓ Pagado en su totalidad
                </span>
              </div>
            ) : (
              <div className={styles.totalRow}>
                <div className={styles.totalLabel}>
                  Saldo a pagar el día del evento
                </div>
                <div className={styles.balanceValue}>
                  {formatMoney(balance)}
                  {transportStatus === "pending_quote" && (
                    <span className={styles.moveValueText}>
                      {" "}
                      + traslado por confirmar
                    </span>
                  )}
                </div>
              </div>
            )}

            {transportStatus === "included" && (
              <div className={styles.emptySubText}>
                Traslado incluido sin costo adicional.
              </div>
            )}
            {transportStatus === "pending_quote" && (
              <div className={styles.emptySubText}>
                Te avisaremos el costo del traslado una vez validada la
                ubicación de tu evento.
              </div>
            )}

            {paymentsSorted.length > 0 && (
              <details className={styles.paymentsAccordion}>
                <summary>Ver histórico de pagos</summary>
                <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                  {paymentsSorted.map((p, idx) => (
                    <div key={p.id ?? idx}>
                      <div className={styles.financeRow}>
                        <span>
                          Pago {idx + 1} · {formatPaymentDate(p.receivedAt ?? "")}
                        </span>
                        <span className={styles.financeValue}>
                          {formatMoney(p.amount ?? 0)}
                        </span>
                      </div>
                      <div className={styles.paymentReference}>
                        {translatePaymentMethod(p.method)}
                        {p.reference ? ` · Referencia: ${p.reference}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      </Col>
    </Row>
  );
};
