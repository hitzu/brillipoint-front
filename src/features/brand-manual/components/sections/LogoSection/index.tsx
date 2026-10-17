import type { CSSProperties } from "react";
import type { StaticImageData } from "next/image";
import logoBlack from "@assets/images/logo-experience-black.png";
import logoNeon from "@assets/images/logo-experience-white.png";
import signatureBlack from "@assets/images/logo-signature-black.png";
import signatureWhite from "@assets/images/logo-signature-white.png";
import { LOGO_BACKGROUNDS, LOGO_SIZE, LOGO_VERSIONS } from "../../../constants/logo";
import { tokenValue } from "../../../constants/tokens";
import type { LogoBackgroundId, LogoVersionId } from "../../../types";
import { assetUrl } from "../../../utils/assetUrl";
import { SectionHeader } from "../../ui/SectionHeader";
import { SparkList } from "../../ui/SparkList";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import type { SectionProps } from "../types";
import styles from "./LogoSection.module.css";
import { useLogoPicker } from "./useLogoPicker";

const LOGO_IMAGES: Record<LogoVersionId, StaticImageData> = {
  neon: logoNeon,
  black: logoBlack,
  signatureBlack,
  signatureWhite,
};

const RULES = [
  "No se redibuja, deforma, estira ni rota la B, ni se cambia la tipografía del arco.",
  "El glow vive solo en pantalla, sobre fondo oscuro y en grande. En impresión, bordado, llaveros y tamaños chicos va la versión plana a una tinta.",
  "Solo en negro, blanco o foil dorado. Nunca con los colores del evento.",
  "Sobre fondo liso o un área tranquila de la foto, con aire de al menos el alto de la B ÷ 2 por lado.",
  "Photobooth y Glitter Bar no tienen logo propio: se nombran con la etiqueta en mayúsculas espaciadas.",
];

export function LogoSection(_props: SectionProps) {
  const picker = useLogoPicker();
  const logo = LOGO_VERSIONS[picker.version];

  return (
    <>
      <SectionHeader
        eyebrow="LOGOTIPO"
        title="La B no se toca"
        lead="Elige versión, fondo y tamaño. La guía te dice si esa combinación se puede usar y por qué."
      />

      <div className={styles.picker}>
        <div className={styles.canvas} style={{ background: picker.canvasColor }}>
          <div
            className={styles.guardBox}
            data-guard={picker.showGuard ? "on" : "off"}
            style={{ padding: Math.round(picker.size * 0.2), "--guard": picker.guardColor } as CSSProperties}
          >
            <em>AIRE MÍNIMO · ALTO DE LA B ÷ 2</em>
            <img
              src={assetUrl(LOGO_IMAGES[picker.version])}
              alt={`Logo Brillipoint Experience, versión ${logo.name.toLowerCase()}`}
              style={{ width: picker.size }}
            />
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.group}>
            <span className={ui.label}>VERSIÓN</span>
            <div className={styles.options} role="radiogroup" aria-label="Versión del logo">
              {(Object.keys(LOGO_VERSIONS) as LogoVersionId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  className={styles.option}
                  aria-checked={picker.version === id}
                  onClick={() => picker.setVersion(id)}
                >
                  <b>{LOGO_VERSIONS[id].name}</b>
                  <span>{LOGO_VERSIONS[id].description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <span className={ui.label} id="logo-bg-label">
              FONDO · {picker.backgroundName.toUpperCase()}
            </span>
            <div className={styles.backgrounds} role="radiogroup" aria-labelledby="logo-bg-label">
              {(Object.keys(LOGO_BACKGROUNDS) as LogoBackgroundId[]).map((id) => {
                const bg = LOGO_BACKGROUNDS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    className={styles.swatchButton}
                    aria-checked={picker.background === id}
                    aria-label={bg.name}
                    title={bg.name}
                    style={{ background: tokenValue(bg.token, bg.line) }}
                    onClick={() => picker.setBackground(id)}
                  />
                );
              })}
            </div>
          </div>

          <div className={ui.range}>
            <label htmlFor="logo-size">
              Tamaño en pantalla <output htmlFor="logo-size">{picker.size} px</output>
            </label>
            <input
              id="logo-size"
              type="range"
              min={LOGO_SIZE.min}
              max={LOGO_SIZE.max}
              step={LOGO_SIZE.step}
              value={picker.size}
              onChange={(event) => picker.setSize(Number(event.target.value))}
            />
          </div>

          <label className={styles.switch} htmlFor="logo-guard">
            <input
              id="logo-guard"
              type="checkbox"
              checked={picker.showGuard}
              onChange={(event) => picker.setShowGuard(event.target.checked)}
            />
            Área de protección
          </label>
        </div>
      </div>

      <VerdictBox kind={picker.verdict.kind} testId="logo-verdict">
        {picker.verdict.message}
      </VerdictBox>

      <div className={ui.block}>
        <span className={ui.label}>REGLAS</span>
        <SparkList items={RULES} />
        <p className={ui.note}>
          Falta la versión plana sin glow ni sombra, el logo en SVG y la B suelta en archivo. Hasta tenerlos, ninguno
          de estos PNG va a imprenta.
        </p>
      </div>
    </>
  );
}
