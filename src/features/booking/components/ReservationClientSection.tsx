import { useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { Contract } from "../../../interfaces";

export const ReservationClientSection = ({
  contract,
}: {
  contract: Contract;
}) => {
  return (
    <Row className={`mb-4 ${styles["center-information-content"]}`}>
      <Col xs={12} md={10}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Datos del cliente</h2>
            {contract?.token && (
              <div className={styles.folio}>
                <span className={styles.folioLabel}>Folio</span>
                <span className={styles.folioValue}>
                  {contract.token.slice(0, 4).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className={styles.sectionBody}>
            <Container fluid className={styles.noPad}>
              <Row className={styles.gutterMd}>
                <Col xs={12} md={4}>
                  <div className={styles.kv}>
                    <div className={styles.kvLabel}>Nombre</div>
                    <div className={styles.kvValue}>
                      {contract?.clientName ?? "—"}
                    </div>
                  </div>
                </Col>

                <Col xs={12} md={4}>
                  <div className={styles.kv}>
                    <div className={styles.kvLabel}>Email</div>
                    <div className={styles.kvValue}>
                      {contract?.clientEmail ?? "—"}
                    </div>
                  </div>
                </Col>

                <Col xs={12} md={4}>
                  <div className={styles.kv}>
                    <div className={styles.kvLabel}>Teléfono</div>
                    <div className={styles.kvValue}>
                      {contract?.clientPhone ?? "—"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Container>
          </div>
        </section>
      </Col>
    </Row>
  );
};
