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
              Este contrato será válido hasta que realices tu primer pago.
              Mientras tanto no existe ningún compromiso entre las partes. En
              cuanto registremos tu anticipo, tu reserva quedará activa.
            </p>
          </div>
        </section>
      </Col>
    </Row>
  );
}
