import type { ReactNode } from "react";
import { themeVars } from "../../../constants/tokens";
import { SectionHeader } from "../../ui/SectionHeader";
import type { SectionProps } from "../types";
import styles from "./ApplicationsSection.module.css";

interface Application {
  name: string;
  measure: string;
  description: string;
  mockup: ReactNode;
}

/** Striped boxes stand for real event photos; dotted ones for the logo or the B. */
export function ApplicationsSection({ line }: SectionProps) {
  const lineTag = line === "dark" ? "GLITTER BAR" : "PHOTOBOOTH";
  const headline = line === "dark" ? "Brilla toda la noche" : "Momentos hoy, recuerdos siempre";

  const applications: Application[] = [
    {
      name: "Post de Instagram",
      measure: "1080 × 1350 px",
      description:
        "Una foto grande y un título de 2 líneas como máximo. Logo pequeño abajo, centrado. Si hay precio, va en el sello dorado.",
      mockup: (
        <div className={`${styles.frame} ${styles.post}`}>
          <span className={styles.tag}>{lineTag}</span>
          <span className={styles.headline}>{headline}</span>
          <span className={styles.photo} />
          <span className={styles.logo}>LOGO</span>
        </div>
      ),
    },
    {
      name: "Story",
      measure: "1080 × 1920 px",
      description:
        "Deja libres 250 px arriba y abajo, donde Instagram pone su interfaz. Título arriba, foto al centro y el botón o sticker abajo.",
      mockup: (
        <div className={`${styles.frame} ${styles.story}`}>
          <span className={`${styles.safe} ${styles.safeTop}`}>250 PX</span>
          <div className={styles.storyInner}>
            <span className={styles.headline}>Agenda tu fecha</span>
            <span className={styles.photo} />
            <span className={styles.link}>ENLACE</span>
          </div>
          <span className={`${styles.safe} ${styles.safeBottom}`}>250 PX</span>
        </div>
      ),
    },
    {
      name: "Foto impresa",
      measure: "Isotipo B de 8 a 10 mm",
      description:
        "La plantilla toma los colores y nombres del evento. La B en una esquina, a una tinta, es lo único de Brillipoint que aparece siempre.",
      mockup: (
        <div className={`${styles.frame} ${styles.printedPhoto}`} style={themeVars("light")}>
          <span className={styles.photo} />
          <span className={styles.logo}>PLANTILLA DEL EVENTO</span>
          <span className={styles.bMark}>B</span>
        </div>
      ),
    },
    {
      name: "Llavero",
      measure: "3 cm",
      description: "Foto a sangre. Si hay marca, solo la B plana a una tinta: a 3 cm el texto en arco no se lee.",
      mockup: (
        <div className={`${styles.frame} ${styles.keychain}`}>
          <span className={styles.photo} />
          <span className={`${styles.bMark} ${styles.bMarkLarge}`}>B</span>
        </div>
      ),
    },
    {
      name: "Tarjeta de presentación",
      measure: "9 × 5 cm",
      description:
        "Frente: logo centrado en negro o blanco, con foil dorado opcional. Reverso: nombre en h3, puesto en eyebrow y datos en body.",
      mockup: (
        <div className={`${styles.frame} ${styles.businessCard}`}>
          <span className={styles.logo}>LOGO PLANO</span>
        </div>
      ),
    },
    {
      name: "Señalética y letrero",
      measure: "Se lee a 5 m",
      description:
        "Fondo negro, logo con glow si es pantalla o neón real, y la etiqueta de la línea debajo. Nada menor a 1/30 de la altura del letrero.",
      mockup: (
        <div className={`${styles.frame} ${styles.sign}`} style={themeVars("dark")}>
          <span className={styles.logo}>LOGO NEÓN</span>
          <span className={`${styles.tag} ${styles.signTag}`}>{lineTag}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="APLICACIONES"
        title="De la pantalla al llavero"
        lead="Cómo va la marca en cada formato. Los recuadros rayados son fotos reales del evento; los punteados, el logo o la B."
      />
      <div className={styles.grid}>
        {applications.map((app) => (
          <figure key={app.name} className={styles.figure}>
            <div className={styles.wall} aria-hidden="true">
              {app.mockup}
            </div>
            <figcaption>
              <b>{app.name}</b>
              <i>{app.measure}</i>
              <p>{app.description}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
