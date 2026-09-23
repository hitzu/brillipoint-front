import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import logoDark from "@assets/images/logo-experience-black.png";
import styles from "@assets/css/contract-public.module.css";
import { getContractByToken } from "../../../api/services/contractService";
import {
  getPublicBrandTerms,
  getPublicTerms,
  getTerms,
} from "../../../api/services/termsService";
import {
  GetContractByIdResponse,
  GetTermsResponse,
  Note,
} from "../../../interfaces";
import { getPublicNotes } from "../../../api/services/notesService";
import { SocialMediaPlugin } from "../components/SocialMediaPlugin";
import TermsAndConditions from "../components/TermsAndConditions";
import { ReservationClientSection } from "../components/ReservationClientSection";
import { ReservationDatesSection } from "../components/ReservationDatesSection";
import { ReservationServicesSection } from "../components/ReservationServicesSection";
import { ReservationExtrasSection } from "../components/ReservationExtrasSection";
import { ReservationFinanceSection } from "../components/ReservationFinanceSection";
import { ReservationNotesSection } from "../components/ReservationNotesSection";
import { PreparationSection } from "../components/PreparationSection";
import { parseLocalDate } from "@common/dates";
import { brandIncludesTransportFee } from "@shared/constants/brands";
import {
  getEventDate,
  ReservationDateRow,
  toReservationDates,
} from "../utils/reservationDates";

type Props = {
  token?: string;
};

const MOCK_CONTRACT_FOR_PREP = {
  id: 77,
  packages: [
    { id: 1, name: "Paquete Brillipoint (mock)", brandId: 2 },
    { id: 2, name: "Otro paquete (mock)", brandId: 1 },
  ],
} as const;

const ReservationPublicPage = ({ token }: Props) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetContractByIdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reservationDates, setReservationDates] = useState<
    ReservationDateRow[]
  >([]);
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [globalTerms, setGlobalTerms] = useState<GetTermsResponse[]>([]);
  const [brandTerms, setBrandTerms] = useState<GetTermsResponse[]>([]);
  const [fetchedPackageTerms, setFetchedPackageTerms] = useState<
    GetTermsResponse[]
  >([]);
  const [notes, setNotes] = useState<Note[]>([]);

  type SectionId = "resume" | "prep_bride" | "prep_social" | "terms";

  const [activeSectionId, setActiveSectionId] = useState<SectionId>("resume");

  // Brand of this reservation: the URL hint wins, otherwise it is derived from
  // the contracted packages. Single definition, used for terms and pricing copy.
  const reservationBrandId = useMemo(() => {
    const rawBrandId = router.query.brandId ?? router.query.brand;
    const queryBrandId = Number(
      Array.isArray(rawBrandId) ? rawBrandId[0] : rawBrandId,
    );
    return queryBrandId > 0
      ? queryBrandId
      : (data?.packages?.[0]?.package?.brandId ?? 0);
  }, [router.query.brand, router.query.brandId, data?.packages]);

  useEffect(() => {
    const loadContract = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getContractByToken(token);
        setData(res);

        // YMD (booking.eventDate) or ISO (contract.createdAt) fallback; kept as
        // the original string — parseLocalDate (used by the consuming
        // components) already discriminates the two formats, so re-parsing to
        // a Date here would only risk a UTC round-trip shifting the day.
        const eventDateRaw = getEventDate(res.bookings) ?? res.contract.createdAt;
        setEventDate(eventDateRaw ?? null);

        setReservationDates(
          toReservationDates(res.contract.createdAt, res.bookings),
        );
      } catch (_e: unknown) {
        setError("No se pudo cargar tu reserva. Intenta de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [token]);

  useEffect(() => {
    try {
      if (!data?.contract?.id) return;
      const loadTermsAndNotes = async () => {
        try {
          const notes = await getPublicNotes(data?.contract?.id, "contract");
          setNotes([...notes]);
          const packagePromises = data.packages.map((currentPackage) =>
            getPublicTerms({
              targetId: currentPackage.package.id,
              scope: "package",
            }),
          );
          const [globalResult, brandResult, packageResults] = await Promise.all([
            getTerms({ termScope: "global" }).catch(() => []),
            reservationBrandId
              ? getPublicBrandTerms(reservationBrandId)
              : Promise.resolve([]),
            Promise.all(packagePromises),
          ]);

          setGlobalTerms(globalResult);
          setBrandTerms(brandResult);
          setFetchedPackageTerms(packageResults.flat());
        } catch (error) {
          console.error("Error loading terms and notes:", error);
        }
      };
      loadTermsAndNotes();
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  }, [data?.contract, data?.packages, reservationBrandId]);

  const items = data?.packages ?? [];
  const extraItems = data?.extras ?? [];
  const packagesForPrep = useMemo(() => {
    const normalized = (data?.packages ?? []).map((p) => ({
      id: p.package?.id ?? p.packageId ?? p.id,
      name: p.package?.name ?? "Paquete",
      brandId: p.package?.brandId ?? 0,
    }));
    return data ? normalized : MOCK_CONTRACT_FOR_PREP.packages;
  }, [data]);

  const hasBrillipoint = useMemo(() => {
    return packagesForPrep.some((p) => p.brandId === 2);
  }, [packagesForPrep]);

  // Transport is quoted on top of the balance only when something in the
  // contract is delivered off-site. Derived from what was actually sold, not
  // from the URL hint, since this is a money statement.
  const showTransportNote = useMemo(() => {
    const contracted = data?.packages ?? [];
    if (contracted.length === 0) return true;
    return contracted.some((p) => brandIncludesTransportFee(p.package?.brandId));
  }, [data?.packages]);

  const packageTerms = useMemo((): GetTermsResponse[] => {
    const dedup = new Map<number, GetTermsResponse>();
    for (const term of fetchedPackageTerms) {
      if (term?.id == null) continue;
      dedup.set(term.id, term);
    }
    for (const it of items) {
      const terms = it?.package?.terms ?? [];
      for (const t of terms) {
        if (t?.id == null) continue;
        if (!dedup.has(t.id)) dedup.set(t.id, t);
      }
    }
    return Array.from(dedup.values());
  }, [fetchedPackageTerms, items]);

  const showNav = Boolean(!loading && !error && data);

  type Section = {
    id: SectionId;
    label: string;
    enabled: boolean;
    render: () => React.ReactNode;
  };

  const allSections: Section[] = data
    ? ([
        {
          id: "resume",
          label: "Resumen",
          enabled: true,
          render: () => {
            return (
              <>
                <ReservationClientSection contract={data.contract} />
                <ReservationDatesSection dates={reservationDates} />
                <ReservationServicesSection items={items} />
                <ReservationExtrasSection items={extraItems} />
                <ReservationFinanceSection
                  contract={data.contract}
                  payments={data.payments ?? []}
                  paidAmount={data.paidAmount ?? 0}
                  showTransportNote={showTransportNote}
                />
                <ReservationNotesSection notes={notes} />
              </>
            );
          },
        },
        {
          id: "prep_bride",
          label: "Preparación novia",
          enabled: hasBrillipoint,
          render: () => (
            <Row className={`mb-4 ${styles["center-information-content"]}`}>
              <Col xs={12} md={10}>
                <PreparationSection
                  contractToken={data?.contract?.token ?? token}
                  phone={data?.contract?.clientPhone ?? ""}
                  mode="public"
                  view="bride"
                />
              </Col>
            </Row>
          ),
        },
        {
          id: "prep_social",
          label: "Preparación social",
          enabled: hasBrillipoint,
          render: () => (
            <Row className={`mb-4 ${styles["center-information-content"]}`}>
              <Col xs={12} md={10}>
                <PreparationSection
                  contractToken={data?.contract?.token ?? token}
                  phone={data?.contract?.clientPhone ?? ""}
                  mode="public"
                  view="social"
                />
              </Col>
            </Row>
          ),
        },
        {
          id: "terms",
          label: "Términos",
          enabled: true,
          render: () => (
            <TermsAndConditions
              globalTerms={globalTerms}
              brandTerms={brandTerms}
              packageTerms={packageTerms}
            />
          ),
        },
      ] satisfies Section[])
    : [];

  const sections = allSections.filter((s) => s.enabled);

  const safeActiveSectionId =
    sections.find((s) => s.id === activeSectionId)?.id ??
    sections[0]?.id ??
    activeSectionId;

  useEffect(() => {
    if (sections.length === 0) return;
    if (safeActiveSectionId !== activeSectionId) {
      setActiveSectionId(safeActiveSectionId);
    }
  }, [activeSectionId, safeActiveSectionId, sections.length]);

  const selectSection = (id: SectionId) => {
    setActiveSectionId(id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const activeSection = sections.find((s) => s.id === safeActiveSectionId);

  const contentNode = loading ? (
    <div className={styles.contentMax}>
      <div style={{ display: "grid", gap: "1rem" }}>
        <section className={styles.card}>
          <div className={styles.skeletonLineMd} style={{ margin: 0 }} />
          <div className={styles.sectionBody}>
            <Container fluid className={styles.noPad}>
              <Row className={styles.gutterMd}>
                <Col xs={12} md={6}>
                  <div className={styles.skeletonBox} />
                </Col>
                <Col xs={12} md={6}>
                  <div className={styles.skeletonBox} />
                </Col>
                <Col xs={12} md={6}>
                  <div className={styles.skeletonBox} />
                </Col>
                <Col xs={12} md={6}>
                  <div className={styles.skeletonBox} />
                </Col>
              </Row>
            </Container>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.skeletonLineMd} style={{ margin: 0 }} />
          <div className={styles.sectionBody}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div className={styles.skeletonBox} />
              <div className={styles.skeletonBox} />
            </div>
          </div>
        </section>
      </div>
    </div>
  ) : error || !data ? (
    <div className={styles.contentMax}>
      <section className={`${styles.card} ${styles.errorCard}`}>
        <div className={styles.errorTitle}>No pudimos cargar tu reserva</div>
        <p className={styles.errorText}>
          {error ??
            "Ocurrió un problema al cargar la información del contrato."}
        </p>
        <button
          type="button"
          onClick={() => router.reload()}
          className={styles.btnRetry}
        >
          Reintentar
        </button>
      </section>
    </div>
  ) : (
    <>{activeSection?.render()}</>
  );

  return (
    <div className={styles.contractPublicContainer}>
      <div className={styles.stickyHeader}>
        <div className={styles.contentMax}>
          <header className={[styles.header, styles.headerSticky].join(" ")}>
            <div className={styles.headerTitleRow}>
              <Image
                src={logoDark}
                alt="Brillipoint"
                width={36}
                height={36}
                className={styles.headerLogo}
              />
              <h1 className={styles.title}>Tu reserva</h1>
            </div>

            {/* Desktop: underline tabs in header */}
            {showNav ? (
              <div className={styles.tabsWrap}>
                <div className={styles.tabPillsRow}>
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={[
                        styles.tabPill,
                        safeActiveSectionId === s.id ? styles.tabPillActive : "",
                      ].join(" ")}
                      onClick={() => selectSection(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </header>
        </div>
      </div>

      {contentNode}

      {/* SOCIAL MEDIA PLUGIN */}
      {showNav ? (
        <SocialMediaPlugin
          data={data as GetContractByIdResponse}
          eventDate={eventDate}
        />
      ) : null}

      {/* Mobile: fixed bottom nav */}
      {showNav ? (
        <nav className={styles.bottomNav} aria-label="Secciones">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={[
                styles.bottomNavPill,
                safeActiveSectionId === s.id ? styles.bottomNavPillActive : "",
              ].join(" ")}
              onClick={() => selectSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
};

export default ReservationPublicPage;
