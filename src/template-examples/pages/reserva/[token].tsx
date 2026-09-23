import NonLayout from "@layout/NonLayout";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Container, Row, Col, Nav, Offcanvas } from "react-bootstrap";
import logoWhite from "@assets/images/logo-white.png";
import styles from "@assets/css/contract-public.module.css";
import { getContractByToken } from "../../../api/services/contractService";
import { getPublicTerms } from "../../../api/services/termsService";
import {
  ContractSlot,
  GetContractByIdResponse,
  GetTermsResponse,
  Note,
} from "../../../interfaces";
import { getPublicNotes } from "../../../api/services/notesService";
import { SocialMediaPlugin } from "../../../views/Booking/SocialMediaPlugin";
import TermsAndConditions from "@views/Booking/TermsAndConditions";
import { ReservationClientSection } from "@views/Booking/ReservationClientSection";
import { ReservationDatesSection } from "@views/Booking/ReservationDatesSection";
import { ReservationServicesSection } from "@views/Booking/ReservationServicesSection";
import { ReservationFinanceSection } from "@views/Booking/ReservationFinanceSection";
import { ReservationNotesSection } from "@views/Booking/ReservationNotesSection";
import { parseLocalDate } from "@common/dates";

const ContractPublicPage = () => {
  const router = useRouter();
  const token = router.query.token as string | undefined;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetContractByIdResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<ContractSlot[]>([]);
  const [terms, setTerms] = useState<GetTermsResponse[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  type SectionId = "resume" | "terms";

  const [activeSectionId, setActiveSectionId] = useState<SectionId>("resume");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const halfwayDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
  };

  useEffect(() => {
    const loadContract = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await getContractByToken(token);
        setData(res);
        const firstSlot = res.contractSlots?.[0];
        const eventDateRaw =
          firstSlot?.slot?.eventDate ?? res.contract.createdAt;
        const eventDate =
          /^\d{4}-\d{2}-\d{2}$/.test(String(eventDateRaw ?? ""))
            ? parseLocalDate(eventDateRaw!)
            : new Date(eventDateRaw);

        const slotsToShow: ContractSlot[] = [
          {
            id: 0,
            purpose: "creation_date",
            slotId: -1,
            contractId: 0,
            slot: {
              contractId: 0,
              id: 0,
              eventDate: res.contract.createdAt,
              status: "reserved",
            },
          },
          {
            id: 0,
            purpose: "halfway_date",
            slotId: -2,
            contractId: 0,
            slot: {
              contractId: 0,
              id: 0,
              eventDate: halfwayDate(
                eventDate,
                new Date(res.contract.createdAt)
              ).toISOString(),
              status: "reserved",
            },
          },
          ...(res.contractSlots ?? []),
        ];
        setSlots(slotsToShow);
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
          const terms = await getPublicTerms({ scope: "global" });
          const notes = await getPublicNotes(data?.contract?.id, "contract");
          setNotes([...notes]);
          if (
            data?.packages &&
            data?.packages.length > 0 &&
            data?.packages[0].package.id
          ) {
            const promises = data?.packages.map((currentPackage) =>
              getPublicTerms({
                targetId: currentPackage.package.id,
                scope: "package",
              })
            );
            const packageTerms = await Promise.all(promises);
            setTerms([...terms, ...packageTerms.flat()]);
          } else {
            setTerms(terms);
          }
        } catch (error) {
          console.error("Error loading terms and notes:", error);
        }
      };
      loadTermsAndNotes();
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  }, [data?.contract]);

  const items = data?.packages ?? [];
  const packageTerms = useMemo((): GetTermsResponse[] => {
    const dedup = new Map<number, GetTermsResponse>();
    for (const it of items) {
      const terms = it?.package?.terms ?? [];
      for (const t of terms) {
        if (t?.id == null) continue;
        if (!dedup.has(t.id)) dedup.set(t.id, t);
      }
    }
    return Array.from(dedup.values());
  }, [items]);

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
                <ReservationDatesSection slots={slots} />
                <ReservationServicesSection items={items} />
                <ReservationFinanceSection
                  contract={data.contract}
                  payments={data.payments ?? []}
                  paidAmount={data.paidAmount ?? 0}
                />
                <ReservationNotesSection notes={notes} />
              </>
            );
          },
        },
        {
          id: "terms",
          label: "Términos",
          enabled: true,
          render: () => (
            <TermsAndConditions packageTerms={packageTerms} terms={terms} />
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
    setShowMobileMenu(false);
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
            {showNav ? (
              <button
                type="button"
                className={[styles.hamburgerBtn, "d-md-none"].join(" ")}
                onClick={() => setShowMobileMenu(true)}
                aria-label="Abrir menú"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}

            <div className={styles.logoWrap}>
              <Image
                src={logoWhite}
                alt="Brillipoint"
                width={104}
                height={104}
              />
            </div>

            <h1 className={styles.title}>Tu reserva Brillipoint ✨</h1>

            {showNav ? (
              <div className={[styles.tabsWrap, "d-none d-md-flex"].join(" ")}>
                <Nav
                  variant="tabs"
                  activeKey={safeActiveSectionId}
                  className={styles.tabsNav}
                >
                  {sections.map((s) => (
                    <Nav.Link
                      key={s.id}
                      eventKey={s.id}
                      href="#"
                      className={[
                        styles.tabLink,
                        safeActiveSectionId === s.id
                          ? styles.tabLinkActive
                          : "",
                      ].join(" ")}
                      onClick={(e) => {
                        e.preventDefault();
                        selectSection(s.id);
                      }}
                    >
                      {s.label}
                    </Nav.Link>
                  ))}
                </Nav>
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
          slot={
            slots.find(
              (s) => !["creation_date", "halfway_date"].includes(s.purpose)
            ) ?? (slots[0] as ContractSlot)
          }
        />
      ) : null}

      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="start"
        className={styles.mobileMenu}
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title>Secciones</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column" activeKey={safeActiveSectionId}>
            {sections.map((s) => (
              <Nav.Link
                key={s.id}
                eventKey={s.id}
                href="#"
                className={[
                  styles.mobileMenuLink,
                  safeActiveSectionId === s.id
                    ? styles.mobileMenuLinkActive
                    : "",
                ].join(" ")}
                onClick={(e) => {
                  e.preventDefault();
                  selectSection(s.id);
                }}
              >
                {s.label}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

ContractPublicPage.getLayout = (page: ReactElement) => (
  <NonLayout>{page}</NonLayout>
);
export default ContractPublicPage;
