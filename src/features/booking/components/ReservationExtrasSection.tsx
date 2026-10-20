import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { ContractExtra } from "../../../interfaces";

export const ReservationExtrasSection = ({
  items,
}: {
  items: ContractExtra[];
}) => {
  const formatMoney = (amount: number) => {
    const n = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(n);
  };

  if (items.length === 0) return null;

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Extras contratados</h2>
          <div className={styles.sectionBody}>
            <ul className={styles.list}>
              {items.map((it) => {
                const qty = it.quantity ?? 1;
                const isGift = !!it.isGift;
                const hasDiscount =
                  !isGift && (it.discountPercentageSnapshot ?? 0) > 0;
                const deliverables = it.deliverables ?? [];
                // Snapshots store the unit price but the final price is already
                // the line total, so the struck-through price must be scaled too.
                const baseLineTotal = (it.basePriceSnapshot ?? 0) * qty;

                return (
                  <li key={it.id} className={styles.listItem}>
                    <div className={styles.itemRow}>
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.itemName}>
                          {it.nameSnapshot ?? it.extra?.name ?? "Extra"}
                          {qty > 1 ? (
                            <span className={styles.itemQty}>×{qty}</span>
                          ) : null}
                        </div>
                        {hasDiscount && (
                          <div className={styles.itemName}>
                            {it.discountPercentageSnapshot}% off
                          </div>
                        )}
                        {isGift && <div className={styles.itemName}>Regalo</div>}
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        {hasDiscount && (
                          <div
                            className={styles.itemPrice}
                            style={{ textDecoration: "line-through", opacity: 0.6 }}
                          >
                            {formatMoney(baseLineTotal)}
                          </div>
                        )}
                        <div className={styles.itemPrice}>
                          {formatMoney(it.finalPriceSnapshot ?? 0)}
                        </div>
                      </div>
                    </div>

                    {deliverables.length > 0 ? (
                      <div className={styles.detailsBlock}>
                        <ul className={styles.detailsList}>
                          {deliverables.map((item) => (
                            <li key={`${it.id}-${item.productId}`}>
                              {item.name}
                              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </Col>
    </Row>
  );
};
