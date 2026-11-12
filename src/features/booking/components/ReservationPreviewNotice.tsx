import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";

interface ReservationPreviewNoticeProps {
  paidAmount: number;
}

/**
 * A contract with no payments is only a preview: the reservation page exists
 * so the client can review it (mainly the terms), but nothing is committed
 * until the first payment is registered. Disappears on its own after that.
 * Uses the same row/column/card shell as the receipt sections so it reads as
 * part of the page.
 */
export function ReservationPreviewNotice({
  paidAmount,
}: ReservationPreviewNoticeProps) {
  if (paidAmount > 0) return null;

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section
          role="status"
          className={`${styles.card} ${styles.previewNotice}`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Vista previa</h2>
          </div>
          <div className={styles.sectionBody}>
            <p className={styles.previewNoticeText}>
              Este contrato se encuentra en vista previa y tu fecha aún no está
              reservada. Tu reserva quedará activa una vez que recibamos y
              registremos tu primer pago.
            </p>
            <p>
              Los precios especiales, descuentos y obsequios incluidos en esta
              propuesta serán válidos únicamente si realizas tu apartado antes
              del 17 de noviembre de 2026. Después de esta fecha la propuesta
              caducará.
            </p>
          </div>
        </section>
      </Col>
    </Row>
  );
}
