import styles from "@assets/css/expo-bebe.module.css";
import type { TabKey } from "../types";
import { IconCalendar, IconCamera, IconDoc } from "./Icons";

export function Tabs({
  value,
  onChange,
  hideIcons = false,
  hidePhotos = false,
}: {
  hideIcons?: boolean;
  hidePhotos?: boolean;
  value: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className={styles.menuShell}>
      {!hideIcons && (
        <div className={styles.menuStickerGroup} aria-hidden="true">
          <img
            src="/assets/expo-bebe/sticker-elephant.png"
            alt=""
            className={`${styles.menuSticker} ${styles.menuStickerElephant}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <img
            src="/assets/expo-bebe/sticker-bear-blue.png"
            alt=""
            className={`${styles.menuSticker} ${styles.menuStickerBearBlue}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className={styles.tabs} role="tablist" aria-label="Expo">
        <button
          className={`${styles.tab} ${value === "cal" ? styles.tabActive : ""}`}
          onClick={() => onChange("cal")}
          role="tab"
          aria-selected={value === "cal"}
          type="button"
        >
          <IconCalendar /> Disponibilidad
        </button>
        {!hidePhotos && (
          <>
            <button
              className={`${styles.tab} ${value === "srv" ? styles.tabActive : ""}`}
              onClick={() => onChange("srv")}
              role="tab"
              aria-selected={value === "srv"}
              type="button"
            >
              <IconCamera /> Servicios
            </button>
            <button
              className={`${styles.tab} ${value === "ext" ? styles.tabActive : ""}`}
              onClick={() => onChange("ext")}
              role="tab"
              aria-selected={value === "ext"}
              type="button"
            >
              <IconCamera /> Extras
            </button>
          </>
        )}
        <button
          className={`${styles.tab} ${value === "ctr" ? styles.tabActive : ""}`}
          onClick={() => onChange("ctr")}
          role="tab"
          aria-selected={value === "ctr"}
          type="button"
        >
          <IconDoc /> Contrato
        </button>
      </div>

      {!hideIcons && (
        <div className={styles.menuStickerGroup} aria-hidden="true">
          <img
            src="/assets/expo-bebe/sticker-bear-pink.png"
            alt=""
            className={`${styles.menuSticker} ${styles.menuStickerBearPink}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <img
            src="/assets/expo-bebe/sticker-duck.png"
            alt=""
            className={`${styles.menuSticker} ${styles.menuStickerDuck}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
