import React, { useId } from "react";
import { Form } from "react-bootstrap";
import styles from "./ThemeSocialCtaBlock.module.css";
import {
  normalizeSocialValue,
  SOCIAL_NETWORK_LABELS,
  SocialNetwork,
  SocialNetworkField,
} from "../socialCtaForm";

const PLACEHOLDERS: Record<SocialNetwork, string> = {
  whatsapp: "+52 55 1234 5678",
  instagram: "@usuario",
  tiktok: "@usuario",
  facebook: "@usuario",
  url: "tusitio.com",
};

const inputLabel = (network: SocialNetwork): string => {
  const name = SOCIAL_NETWORK_LABELS[network];
  if (network === "whatsapp") return `Número de ${name}`;
  if (network === "url") return `Enlace de ${name}`;
  return `Usuario o enlace de ${name}`;
};

interface SocialNetworkRowProps {
  network: SocialNetwork;
  field: SocialNetworkField;
  error?: string;
  onToggle: (enabled: boolean) => void;
  onValueChange: (value: string) => void;
}

/** One network: an on/off switch plus its value input (only while on). */
const SocialNetworkRow = ({
  network,
  field,
  error,
  onToggle,
  onValueChange,
}: SocialNetworkRowProps) => {
  const id = useId();
  const href = field.enabled ? normalizeSocialValue(network, field.value) : null;

  return (
    <div className={`${styles.networkRow} ${field.enabled ? styles.networkRowOn : ""}`}>
      <Form.Check
        type="switch"
        role="switch"
        id={`${id}-switch`}
        label={SOCIAL_NETWORK_LABELS[network]}
        checked={field.enabled}
        onChange={(event) => onToggle(event.target.checked)}
        className={styles.networkSwitch}
      />
      {field.enabled && (
        <div className={styles.networkInput}>
          <Form.Label htmlFor={`${id}-value`} className="visually-hidden">
            {inputLabel(network)}
          </Form.Label>
          <Form.Control
            id={`${id}-value`}
            type={network === "whatsapp" ? "tel" : "text"}
            inputMode={network === "whatsapp" ? "tel" : network === "url" ? "url" : "text"}
            autoComplete="off"
            placeholder={PLACEHOLDERS[network]}
            value={field.value}
            isInvalid={Boolean(error)}
            aria-describedby={`${id}-hint`}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error ? (
            <Form.Control.Feedback type="invalid" id={`${id}-hint`}>
              {error}
            </Form.Control.Feedback>
          ) : (
            <Form.Text id={`${id}-hint`} className={styles.hint}>
              {href ?? " "}
            </Form.Text>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialNetworkRow;
