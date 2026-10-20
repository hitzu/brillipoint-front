import { Col, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { Note } from "../../../interfaces";

export const ReservationNotesSection = ({ notes }: { notes: Note[] }) => {
  if (!notes?.length) return null;

  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Notas de la reserva</h2>
          <p className={styles.termsIntro}>
            Promociones, descuentos y notas importantes aplicados a tu reserva.
          </p>

          <ul className={styles.termsList}>
            {notes.map((t) => (
              <li key={t.id} className={styles.termsItem}>
                <div className={styles.termTitle}>{t.content}</div>
              </li>
            ))}
          </ul>
        </section>
      </Col>
    </Row>
  );
};
