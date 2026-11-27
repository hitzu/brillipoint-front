import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";

interface ReservationPreviewNoticeProps {
  paidAmount: number;
  createdAt: string;
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
  createdAt,
}: ReservationPreviewNoticeProps) {
  if (paidAmount > 0) return null;

  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + 5);
  expiresAt.setHours(23, 59, 59, 999);
  const expired = Date.now() > expiresAt.getTime();
  const expiryDate = Number.isNaN(expiresAt.getTime())
    ? null
    : new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(expiresAt);

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section
          role="status"
          className={`${styles.card} ${styles.previewNotice}`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Cotización</h2>
          </div>
          <div className={styles.sectionBody}>
            {!expiryDate ? (
              <p className={styles.previewNoticeText}>
                No pudimos determinar la vigencia. Por favor solicita
                información al equipo de Brillipoint.
              </p>
            ) : expired ? (
              <p className={styles.previewNoticeText}>
                Esta cotizacion ha finalizado, por favor solicita otra con el
                equipo de brillipoint
              </p>
            ) : (
              <>
                <p className={styles.previewNoticeText}>
                  Cotización válida hasta el {expiryDate}.
                </p>
                <p>
                  Los precios, descuentos, beneficios y obsequios incluidos en
                  esta propuesta serán válidos únicamente durante el periodo de
                  vigencia indicado.
                </p>
                <p>
                  Esta cotización está sujeta a disponibilidad y no garantiza la
                  reserva de tu fecha. Tu reservación quedará confirmada una vez
                  que recibamos y registremos el pago de tu apartado.
                </p>
                <p>
                  Una vez finalizada la vigencia, los precios y beneficios
                  estarán sujetos a actualización.
                </p>
              </>
            )}
          </div>
        </section>
      </Col>
    </Row>
  );
}
