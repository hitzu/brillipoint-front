import React from "react";
import styles from "@assets/css/fotobooth.module.css";
import { EffectName } from "../../../../types/session";
import { EffectOption } from "../types";
import { useT } from "../../../../i18n/LocaleProvider";

type EffectsRailProps = {
  activeEffect: EffectName;
  effectOptions: EffectOption[];
  onSelectEffect: (effect: EffectName) => void;
};

const EffectsRail = ({
  activeEffect,
  effectOptions,
  onSelectEffect,
}: EffectsRailProps) => {
  const { t } = useT();

  return (
    <div className={styles.effectsRail} aria-label={t("carousel.effectsLabel")}>
      {effectOptions.map((effect) => (
        <button
          key={effect.id}
          type="button"
          className={`${styles.effectChip} ${
            activeEffect === effect.id ? styles.effectChipActive : ""
          }`}
          onClick={() => onSelectEffect(effect.id)}
          aria-pressed={activeEffect === effect.id}
        >
          {t(effect.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default EffectsRail;
