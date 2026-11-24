import { useEffect, useRef } from "react";
import { Row, Col } from "react-bootstrap";
import styles from "@assets/css/contract-public.module.css";
import { GetTermsResponse } from "../../../interfaces";
import {
  countWords,
  reportTermsProgress,
} from "../tracking/reservationTracker";

const TermsAndConditions = ({
  globalTerms,
  brandTerms,
  packageTerms,
}: {
  globalTerms: GetTermsResponse[];
  brandTerms: GetTermsResponse[];
  packageTerms: GetTermsResponse[];
}) => {
  const allTerms = [
    ...globalTerms.map((term) => ({ ...term, group: "global" })),
    ...brandTerms.map((term) => ({ ...term, group: "brand" })),
    ...packageTerms.map((term) => ({ ...term, group: "package" })),
  ];

  const listRef = useRef<HTMLUListElement>(null);
  const wordCount = allTerms.reduce(
    (sum, t) => sum + countWords(`${t.title ?? ""} ${t.content ?? ""}`),
    0,
  );

  // Exposure, not reading: how far down the list the viewport has reached.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let maxScrollPct = 0;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const pct =
        rect.height > 0
          ? ((window.innerHeight - rect.top) / rect.height) * 100
          : 100;
      maxScrollPct = Math.max(maxScrollPct, Math.min(100, Math.max(0, pct)));
      reportTermsProgress({
        maxScrollPct: Math.round(maxScrollPct),
        reachedEnd: maxScrollPct >= 100,
        wordCount,
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [wordCount]);

  return (
    <div>
      <Row className={`mb-4 ${styles["center-information-content"]}`}>
        <Col xs={12} md={10}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Consideraciones importantes</h2>
            {allTerms.length === 0 ? (
              <p className={styles.termsIntro}>
                No hay términos y condiciones vinculados a los servicios de este
                contrato.
              </p>
            ) : (
              <>
                <p className={styles.termsIntro}>
                  Estos son los términos y condiciones de los servicios
                  contratados.
                </p>

                <ul ref={listRef} className={styles.termsList}>
                  {allTerms.map((t) => (
                    <li key={`${t.group}-${t.id}`} className={styles.termsItem}>
                      <div className={styles.termTitle}>{t.title}</div>
                      <div
                        className={styles.termContent}
                        dangerouslySetInnerHTML={{ __html: t.content }}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </Col>
      </Row>
    </div>
  );
};

export default TermsAndConditions;
