import { SectionHeader } from "../../ui/SectionHeader";
import { SparkList } from "../../ui/SparkList";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./PiecesSection.module.css";
import { SparkCounter } from "./SparkCounter";

const PACKAGE_CARDS = {
  light: {
    line: "PHOTOBOOTH",
    name: "Instants",
    items: ["Set fotográfico estilo gala", "Fotos impresas personalizadas", "Galería digital personalizada"],
    chip: "1.5 hrs",
  },
  dark: {
    line: "GLITTER BAR",
    name: "Glitter Bar",
    items: ["Glitter cosmético", "Glitter tattoo", "Cristalería facial"],
    chip: "2 hrs · 1 maquillista",
  },
};

export function PiecesSection({ line }: SectionProps) {
  const card = PACKAGE_CARDS[line];

  return (
    <>
      <SectionHeader
        eyebrow="PIEZAS"
        title="Las piezas que se repiten"
        lead="Botones, chips, sello de precio, tarjeta de paquete y el destello. Cambian con la línea activa."
      />

      <div className={styles.pieces}>
        <div className={styles.column}>
          <span className={ui.label}>BOTONES</span>
          <div className={ui.row}>
            <span className={`${ui.btn} ${ui.btnPrimary}`}>Agenda tu fecha</span>
            <span className={`${ui.btn} ${ui.btnSecondary}`}>Ver paquetes</span>
          </div>
          <p className={ui.caption}>
            Un botón principal por pieza: dorado con texto on-gold. El secundario es un contorno ink.
          </p>

          <span className={ui.label}>CHIPS</span>
          <div className={ui.row}>
            <span className={ui.chip}>2 hrs</span>
            <span className={ui.chip}>1 staff</span>
            <span className={ui.chip}>Galería digital</span>
          </div>
          <p className={ui.caption}>Datos cortos en gold-100 con texto ink.</p>

          <span className={ui.label}>SELLO DE PRECIO</span>
          <div className={styles.seal}>
            <span>POR EVENTO</span>
            <b>$X,XXX</b>
          </div>
          <p className={ui.caption}>Un solo precio, sin tachados.</p>
        </div>

        <div className={styles.column}>
          <span className={ui.label}>TARJETA DE PAQUETE</span>
          <div className={styles.card}>
            <span className={ui.eyebrow}>{card.line}</span>
            <h4>{card.name}</h4>
            <SparkList items={card.items} />
            <div className={styles.cardFooter}>
              <span className={styles.cardPrice}>$X,XXX</span>
              <span className={ui.chip}>{card.chip}</span>
            </div>
          </div>
          <p className={ui.caption}>
            surface-200, radius-md y relleno space-6. Línea en eyebrow dorado, nombre en h2, viñetas con destello.
          </p>
        </div>
      </div>

      <div className={ui.block}>
        <h3 className={ui.blockTitle}>Destellos</h3>
        <SparkCounter line={line} />
      </div>
    </>
  );
}
