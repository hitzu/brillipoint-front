import type { ComponentType } from "react";
import logoNeon from "@assets/images/logo-experience-white.png";
import { ApplicationsSection } from "../../components/sections/ApplicationsSection";
import { BrandSection } from "../../components/sections/BrandSection";
import { ColorSection } from "../../components/sections/ColorSection";
import { LogoSection } from "../../components/sections/LogoSection";
import { PiecesSection } from "../../components/sections/PiecesSection";
import { PrintSection } from "../../components/sections/PrintSection";
import { RulesSection } from "../../components/sections/RulesSection";
import { TypeSection } from "../../components/sections/TypeSection";
import { VoiceSection } from "../../components/sections/VoiceSection";
import type { SectionProps } from "../../components/sections/types";
import { Spark } from "../../components/ui/Spark";
import { SECTIONS } from "../../constants/sections";
import { themeVars } from "../../constants/tokens";
import type { SectionId } from "../../types";
import { assetUrl } from "../../utils/assetUrl";
import styles from "./BrandManualPage.module.css";
import { useBrandManualPage } from "./hooks/useBrandManualPage";
import { useBrandManualPageEffects } from "./hooks/useBrandManualPageEffects";
import { LineToggle } from "./ui/LineToggle";

const SECTION_COMPONENTS: Record<SectionId, ComponentType<SectionProps>> = {
  marca: BrandSection,
  logo: LogoSection,
  color: ColorSection,
  tipo: TypeSection,
  piezas: PiecesSection,
  apps: ApplicationsSection,
  voz: VoiceSection,
  no: RulesSection,
  print: PrintSection,
};

/**
 * Interactive Brillipoint Experience brand manual. The outer wall is always
 * night, like the neon sign on its wall; the stage takes the active line's light.
 */
export function BrandManualPage() {
  const page = useBrandManualPage();
  useBrandManualPageEffects({ restoreSection: page.restoreSection, toastTimer: page.toastTimer });
  const Section = SECTION_COMPONENTS[page.section];

  return (
    <div className={styles.app} style={themeVars("dark")}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <img src={assetUrl(logoNeon)} alt="Brillipoint Experience" width={168} height={168} />
          <span>MANUAL DE MARCA</span>
        </div>
        <nav className={styles.nav} aria-label="Secciones del manual">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={item.id === page.section ? "page" : undefined}
              onClick={() => page.selectSection(item.id)}
            >
              <Spark />
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <span className={styles.version}>BORRADOR 0.1 · OCTUBRE 2026</span>
        </div>
      </aside>

      <main
        className={[styles.stage, page.animate ? styles.animated : ""].filter(Boolean).join(" ")}
        data-theme={page.line}
        style={themeVars(page.line)}
      >
        <header className={styles.bar}>
          <span className={styles.crumb}>
            MANUAL DE MARCA · <b>{page.activeLabel.toUpperCase()}</b>
          </span>
          <LineToggle line={page.line} onChange={page.setLine} />
        </header>
        <div className={styles.scroll} ref={page.scrollRef}>
          <section key={page.section} className={styles.section} aria-label={page.activeLabel}>
            <Section line={page.line} onLineChange={page.setLine} notify={page.notify} />
          </section>
        </div>
      </main>

      <div
        className={[styles.toast, page.toast.visible ? styles.toastVisible : ""].filter(Boolean).join(" ")}
        role="status"
        aria-live="polite"
      >
        {page.toast.message}
      </div>
    </div>
  );
}
