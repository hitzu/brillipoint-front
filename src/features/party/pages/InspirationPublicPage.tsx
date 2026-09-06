import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "@assets/css/inspiration-v2.module.css";
import logoExperienceWhite from "@assets/images/logo-experience-white.png";
import { AnalyticsAction, EventPhraseResponse } from "../../../interfaces";
import { trackEvent } from "../../../api/services/eventAnalyticsService";
import {
  getPublicEventByToken,
  getEventPhrases,
  getEventTheme,
} from "../../../api/services/partyPublicService";
import { SocialMediaCTA } from "../components/SocialMediaCTA";
import { readSourceFromRouter } from "../utils/sourceTracking";
import { tokensToEventPageTheme } from "../utils/tokensToEventPageTheme";
import { buildThemeVars } from "../utils/themeVars";
import { EventPageTheme } from "../types/eventPageTheme";

// ─── Constants ────────────────────────────────────────────────────────────────

type PoseGroup = "1" | "2_1" | "2" | "3";

const POSES: Record<PoseGroup, string[]> = {
  "1": [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/inspiracion/1/pose_1_${n}.png`),
  "2_1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
    (n) => `/inspiracion/2_1/pose_2_1_${n}.png`,
  ),
  "2": [1, 2, 3, 4, 15, 16, 17, 18].map(
    (n) => `/inspiracion/2/pose_2_${n}.png`,
  ),
  "3": [1, 2, 3, 4].map((n) => `/inspiracion/3/pose_3_${n}.png`),
};

const TUTORIAL_STEPS = [
  {
    icon: "🎭",
    shortLabel: "Accesorios",
    title: "Elige los accesorios",
    desc: "Sombreros, lentes, letreros y más. Toma lo que te haga sentir bien.",
  },
  {
    icon: "📸",
    shortLabel: "Posa",
    title: "Posa para tu foto",
    desc: "Nuestro equipo te guía con la pose. Solo disfruta y brilla.",
  },
  {
    icon: "🔄",
    shortLabel: "Cambia",
    title: "Cambia de accesorios",
    desc: "Atrévete con otra vibra. La cabina es tuya, no hay prisa.",
  },
  {
    icon: "✨",
    shortLabel: "Posa",
    title: "Posa de nuevo",
    desc: "Otra ronda, otra energía. Tantas como necesites para tu foto perfecta.",
  },
  {
    icon: "🖼️",
    shortLabel: "Recoge",
    title: "Pasa por tu foto impresa",
    desc: "Recibes 2 copias al instante. Una es tuya, la otra para el libro.",
  },
  {
    icon: "✍️",
    shortLabel: "Firma",
    title: "Firma con una dedicatoria",
    desc: "Pega tu foto en el libro y déjales unas palabras especiales.",
  },
  {
    icon: "📲",
    shortLabel: "Descarga",
    title: "Escanea y comparte",
    desc: "En tu QR tienes todas tus fotos digitales para compartir donde quieras.",
  },
];

const PERSON_FILTERS: {
  key: PoseGroup;
  silhouettes: number;
  emoji?: string;
}[] = [
  { key: "1", silhouettes: 1 },
  { key: "2_1", silhouettes: 2, emoji: "❤️" },
  { key: "2", silhouettes: 2 },
  { key: "3", silhouettes: 3 },
];

const DEDICATION_TIPS = [
  "Copia una frase y agrega algo personal al final.",
  'Firma con un detalle: "Ej. tu prima Caro de Puebla".',
  "Si te equivocas, no te preocupes. Lo hecho a mano siempre es más bonito.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getQueryValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const isRoutePlaceholder = (value: string) =>
  value.startsWith("[") && value.endsWith("]");

const getTokenFromPath = (asPath: string) => {
  const [pathname = ""] = asPath.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const idx = segments.findIndex(
    (s) => s === "inspiracion" || s === "inspiration",
  );
  if (idx === -1) return undefined;
  const token = segments[idx + 1];
  if (!token || isRoutePlaceholder(token)) return undefined;
  return decodeURIComponent(token);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkles() {
  const sparks = useMemo(() => {
    let s = 9301;
    const r = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: 14 }, () => ({
      top: r() * 95 + 2,
      left: r() * 95 + 2,
      size: 6 + r() * 8,
      delay: r() * 4,
      dur: 2 + r() * 3,
      rose: r() > 0.5,
    }));
  }, []);

  return (
    <div className={styles.sparklesWrap} aria-hidden="true">
      {sparks.map((sp, i) => (
        <span
          key={i}
          className={styles.sparkle}
          style={{
            top: `${sp.top}%`,
            left: `${sp.left}%`,
            fontSize: sp.size,
            color: sp.rose
              ? "var(--ep-primary-btn-bg, #ec4899)"
              : "var(--ep-secondary-btn-bg, #a855f7)",
            animationDelay: `${sp.delay}s`,
            animationDuration: `${sp.dur}s`,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function PersonSilhouette({ n, selected }: { n: number; selected: boolean }) {
  const color = selected
    ? "var(--ep-primary-btn-text, #fff)"
    : "var(--ep-accent, #be185d)";
  const opacity = selected ? 1 : 0.55;
  const W = n === 1 ? 14 : n === 2 ? 22 : n === 3 ? 28 : 34;
  const positions: { x: number }[] =
    n === 1
      ? [{ x: 7 }]
      : n === 2
        ? [{ x: 5 }, { x: 11 }]
        : n === 3
          ? [{ x: 4 }, { x: 10 }, { x: 16 }]
          : [{ x: 3 }, { x: 9 }, { x: 15 }, { x: 21 }];

  return (
    <svg
      width={W}
      height={14}
      viewBox={`0 0 ${W} 14`}
      fill="none"
      aria-hidden="true"
    >
      {positions.map((p, i) => (
        <g key={i} fill={color} opacity={opacity}>
          <circle cx={p.x + 3} cy={3} r={2.2} />
          <path
            d={`M${p.x} 14 Q${p.x} 7 ${p.x + 3} 7 Q${p.x + 6} 7 ${p.x + 6} 14 Z`}
          />
        </g>
      ))}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type InspirationPublicPageProps = {
  eventToken?: string;
};

const InspirationPublicPage = ({ eventToken }: InspirationPublicPageProps) => {
  const router = useRouter();
  const [tab, setTab] = useState<"poses" | "frases">("poses");
  const [poseGroup, setPoseGroup] = useState<PoseGroup>("2_1");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [focusedStep, setFocusedStep] = useState(0);
  const [eventName, setEventName] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<EventPhraseResponse[]>([]);
  const [resolvedTheme, setResolvedTheme] = useState<EventPageTheme | null>(
    null,
  );
  const hasTracked = useRef(false);
  const stepsScrollRef = useRef<HTMLDivElement>(null);
  const stepElRefs = useRef<(HTMLDivElement | null)[]>([]);
  const source = readSourceFromRouter(router);

  const resolvedToken =
    eventToken ||
    getQueryValue(router.query.token) ||
    getQueryValue(router.query.eventToken) ||
    getTokenFromPath(router.asPath);

  useEffect(() => {
    if (!resolvedToken || isRoutePlaceholder(resolvedToken)) return;
    const controller = new AbortController();

    Promise.all([
      getPublicEventByToken(resolvedToken),
      getEventPhrases(resolvedToken, controller.signal),
    ])
      .then(([event, eventPhrases]) => {
        setEventName(event.name ?? null);
        setPhrases(eventPhrases);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [resolvedToken]);

  // Theme travels in its own request, separate from event/phrases data.
  useEffect(() => {
    if (!resolvedToken || isRoutePlaceholder(resolvedToken)) return;

    getEventTheme(resolvedToken)
      .then(({ eventTheme }) => {
        setResolvedTheme(
          tokensToEventPageTheme(eventTheme.tokens, eventTheme.images),
        );
      })
      .catch(() => {
        setResolvedTheme(null);
      });
  }, [resolvedToken]);

  useEffect(() => {
    if (
      !router.isReady ||
      !resolvedToken ||
      isRoutePlaceholder(resolvedToken) ||
      hasTracked.current
    )
      return;
    hasTracked.current = true;
    trackEvent(AnalyticsAction.GALLERY_VIEW, resolvedToken, {
      metadata: { source, surface: "inspiration_page_v2" },
    });
  }, [resolvedToken, router.isReady, source]);

  const scrollToStep = (i: number) => {
    const el = stepElRefs.current[i];
    if (el && stepsScrollRef.current) {
      stepsScrollRef.current.scrollTo({
        left: el.offsetLeft - 14,
        behavior: "smooth",
      });
    }
  };

  const handleStepsScroll = () => {
    const scrollEl = stepsScrollRef.current;
    if (!scrollEl) return;

    const viewportCenter = scrollEl.scrollLeft + scrollEl.clientWidth / 2;
    const nextFocusedStep = stepElRefs.current.reduce((closest, el, i) => {
      if (!el) return closest;
      const stepCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(stepCenter - viewportCenter);
      return distance < closest.distance ? { index: i, distance } : closest;
    }, { index: focusedStep, distance: Number.POSITIVE_INFINITY }).index;

    if (nextFocusedStep !== focusedStep) {
      setFocusedStep(nextFocusedStep);
    }
  };

  const handleCompactStepClick = (i: number) => {
    setFocusedStep(i);
    if (!tutorialOpen) {
      setTutorialOpen(true);
      setTimeout(() => scrollToStep(i), 360);
    } else {
      scrollToStep(i);
    }
  };

  const visiblePoses = POSES[poseGroup];

  return (
    <div
      className={styles.pageRoot}
      style={resolvedTheme ? buildThemeVars(resolvedTheme) : undefined}
    >
      <Head>
        <title>Inspiración{eventName ? ` - ${eventName}` : ""}</title>
      </Head>
      <Sparkles />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logoPill}>
          <Image
            src={logoExperienceWhite}
            alt="Brillipoint Beauty & Glitter Bar"
            className={styles.logoImg}
            priority
          />
        </div>
        {eventName && <p className={styles.eventName}>{eventName}</p>}
      </header>

      {/* ── Tutorial accordion ───────────────────────────────────────────── */}
      <section className={styles.tutorialWrap}>
        <div className={styles.tutorialCard}>
          <button
            type="button"
            className={styles.tutorialHeader}
            onClick={() => setTutorialOpen((v) => !v)}
            aria-expanded={tutorialOpen}
          >
            <span className={styles.tutorialTitle}>
              📸 ¿Cómo funciona tu sesión?
            </span>
            <span
              className={`${styles.chevron} ${tutorialOpen ? styles.chevronOpen : ""}`}
              aria-hidden="true"
            >
              ⌄
            </span>
          </button>

          <div
            className={styles.tutorialBody}
            style={{ maxHeight: tutorialOpen ? 520 : 120 }}
          >
            {tutorialOpen ? (
              <>
                <div className={styles.tutorialProgressRow}>
                  <span className={styles.tutorialProgressLabel}>
                    Paso {focusedStep + 1}/{TUTORIAL_STEPS.length}
                  </span>
                  <div className={styles.tutorialDots}>
                    {TUTORIAL_STEPS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Ir al paso ${i + 1}`}
                        className={`${styles.tutorialDot} ${focusedStep === i ? styles.tutorialDotActive : ""}`}
                        onClick={() => {
                          setFocusedStep(i);
                          scrollToStep(i);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={styles.tutorialSteps}
                  ref={stepsScrollRef}
                  onScroll={handleStepsScroll}
                >
                  {TUTORIAL_STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`${styles.tutorialStep} ${focusedStep === i ? styles.tutorialStepFocused : ""}`}
                      ref={(el) => {
                        stepElRefs.current[i] = el;
                      }}
                    >
                      <div className={styles.tutorialStepIcon}>{s.icon}</div>
                      <div className={styles.tutorialStepContent}>
                        <div className={styles.tutorialStepLabel}>
                          PASO {i + 1}
                        </div>
                        <div className={styles.tutorialStepTitle}>
                          {s.title}
                        </div>
                        <div className={styles.tutorialStepDesc}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.tutorialCompact}>
                {TUTORIAL_STEPS.map((s, i) => (
                  <React.Fragment key={i}>
                    <button
                      type="button"
                      className={styles.tutorialCompactStep}
                      aria-label={`Ver paso ${i + 1}: ${s.title}`}
                      onClick={() => handleCompactStepClick(i)}
                    >
                      <div className={styles.tutorialCompactIcon}>{s.icon}</div>
                      <div className={styles.tutorialCompactLabel}>
                        {s.shortLabel}
                      </div>
                    </button>
                    {i < TUTORIAL_STEPS.length - 1 && (
                      <div
                        className={styles.tutorialCompactDash}
                        aria-hidden="true"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className={styles.ctaWrap}>
        <SocialMediaCTA
          context="sessionPresence"
          variant="compact"
          nombreFestejado={eventName ?? ""}
        />
      </section>

      {/* ── Sticky tabs ──────────────────────────────────────────────────── */}
      <div className={styles.stickyTabs} role="tablist">
        {(["poses", "frases"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "poses" ? "📸 Poses" : "💌 Frases"}
            {tab === t && (
              <span className={styles.tabIndicator} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {tab === "poses" ? (
        <section className={styles.tabContent}>
          <div className={styles.posesIntro}>
            <p className={styles.posesTitle}>¿No sabes qué pose hacer?</p>
          </div>

          <div className={styles.personFilterWrap}>
            <div className={styles.personFilter}>
              {PERSON_FILTERS.map(({ key, silhouettes, emoji }) => {
                const sel = poseGroup === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.personBtn} ${sel ? styles.personBtnActive : ""}`}
                    onClick={() => setPoseGroup(key)}
                  >
                    {emoji ? (
                      <span
                        className={styles.personBtnEmoji}
                        aria-hidden="true"
                      >
                        {emoji}
                      </span>
                    ) : (
                      <PersonSilhouette n={silhouettes} selected={sel} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.posesGrid} key={poseGroup}>
            {visiblePoses.map((url, i) => (
              <div key={i} className={styles.poseCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Pose ${i + 1}`}
                  className={styles.poseImg}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.tabContent}>
          <div className={styles.frasesIntro}>
            <p className={styles.frasesTitle}>Frases para tu dedicatoria</p>
            {eventName && (
              <p className={styles.frasesSubtitle}>
                Inspírate con estas frases para el libro de{" "}
                <strong>{eventName}</strong>.
              </p>
            )}
          </div>

          {phrases.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Estamos preparando las frases para este evento ✨</p>
              <p className={styles.emptyStateSub}>Vuelve en unos minutos.</p>
            </div>
          ) : (
            <div className={styles.phrasesList}>
              {phrases.map((f) => (
                <div key={f.id} className={styles.phraseCard}>
                  <div className={styles.phraseCardLeft} aria-hidden="true" />
                  <p className={styles.phraseText}>{f.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.tipBoxPurple}>
            <p className={styles.tipBoxTitle}>💡 Tips para tu dedicatoria</p>
            <ul className={styles.tipList}>
              {DEDICATION_TIPS.map((tip, i) => (
                <li key={i} className={styles.tipItem}>
                  <span className={styles.tipDot} aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className={styles.bottomSpacer} />
    </div>
  );
};

export default InspirationPublicPage;
