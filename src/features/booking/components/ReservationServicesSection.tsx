import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { ContractPackages } from "../../../interfaces";

export const ReservationServicesSection = ({
  items,
}: {
  items: ContractPackages[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatMoney = (amount: number) => {
    const n = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(n);
  };

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Servicios contratados</h2>{" "}
          <button
            type="button"
            className={styles.detailToggle}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Ocultar detalles" : "Ver detalles"}
          </button>
          <div className={styles.sectionBody}>
            {items.length === 0 ? (
              <div className={styles.emptySubText}>
                Aún no hay servicios vinculados a este contrato.
              </div>
            ) : (
              <ul className={styles.list}>
                {items.map((it) => {
                  // Deliverables are frozen at contracting time; the catalog is
                  // only a fallback for contracts created before that existed.
                  const products = it.deliverables?.length
                    ? it.deliverables.map((item) => item.name)
                    : (it.package?.packageProducts
                        ?.map((pp) => pp.product?.name)
                        .filter(Boolean) ?? []);
                  const pkg = it.package;
                  const qty = it.quantity ?? 1;

                  const hasDiscount = (it.discountPercentageSnapshot ?? 0) > 0;
                  // Snapshots store the unit price but the final price is already
                  // the line total, so the struck-through price must be scaled too.
                  const baseLineTotal = (it.basePriceSnapshot ?? 0) * qty;

                  return (
                    <li key={it.id} className={styles.listItem}>
                      <div className={styles.itemRow}>
                        <div style={{ minWidth: 0 }}>
                          <div className={styles.itemName}>
                            {it.nameSnapshot ?? pkg?.name ?? "Paquete"}
                            {qty > 1 ? (
                              <span className={styles.itemQty}>×{qty}</span>
                            ) : null}
                          </div>
                          {hasDiscount && (
                            <div className={styles.itemName}>
                              {it.discountPercentageSnapshot}% off
                            </div>
                          )}
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

                      {isExpanded ? (
                        <div className={styles.detailsBlock}>
                          {products.length > 0 ? (
                            <ul className={styles.detailsList}>
                              {products.map((name, idx) => (
                                <li key={`${it.packageId}-${idx}`}>{name}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </Col>
    </Row>
  );
};
