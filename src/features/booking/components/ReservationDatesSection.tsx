import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import type { ReservationDateRow } from "../utils/reservationDates";
import { translateContractSlotPurpose } from "@common/translations";
import { formatLongSpanishDate, parseLocalDate } from "@common/dates";

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
                    ? formatLongSpanishDate(parseLocalDate(row.date))
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
