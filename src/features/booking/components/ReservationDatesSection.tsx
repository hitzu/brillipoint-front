import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import type { ReservationDateRow } from "../utils/reservationDates";
import { translateContractSlotPurpose } from "@common/translations";
import { formatLongSpanishDate, parseLocalDate } from "@common/dates";

// Bookings carry a plain YYYY-MM-DD (calendar day, no timezone); the creation
// date is an ISO timestamp and must be converted to the viewer's local time.
const toDisplayDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);

export const ReservationDatesSection = ({
  dates,
}: {
  dates: ReservationDateRow[];
}) => {
  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Fechas de los eventos</h2>
          <div className={styles.sectionBody}>
            {dates.map((row) => (
              <div key={row.key} className={styles.financeRow}>
                <span className={styles.financeValue}>
                  {translateContractSlotPurpose(row.purpose)}
                </span>
                <span>
                  {row.date
                    ? formatLongSpanishDate(toDisplayDate(row.date))
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Col>
    </Row>
  );
};
