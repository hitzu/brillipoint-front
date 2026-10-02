import React, { ReactNode, useId } from "react";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import type { LocalizedText } from "../../../party/types/themeContract";
import styles from "./ThemeSocialCtaBlock.module.css";
import SocialNetworkRow from "./SocialNetworkRow";
import {
  SOCIAL_NETWORK_LABELS,
  SOCIAL_NETWORKS,
  SocialCtaFormErrors,
  SocialCtaFormState,
  SocialCtaLocale,
  SocialNetwork,
} from "../socialCtaForm";

const LOCALES: SocialCtaLocale[] = ["es", "en"];

type TextField = "headline" | "subtitle" | "followText";

const TEXT_FIELDS: { field: TextField; label: string; placeholder: string }[] = [
  { field: "headline", label: "Texto principal", placeholder: "¡Gracias por celebrar con {{honoreesName}}!" },
  { field: "subtitle", label: "Subtítulo", placeholder: "Revive la fiesta en nuestras redes" },
  { field: "followText", label: "Texto de \"síguenos\"", placeholder: "Síguenos" },
];

interface ThemeSocialCtaBlockProps {
  form: SocialCtaFormState;
  errors: SocialCtaFormErrors;
  /** Locale whose texts are being edited; the section owns it so a preview can follow it. */
  locale: SocialCtaLocale;
  onLocaleChange: (locale: SocialCtaLocale) => void;
  onChange: (form: SocialCtaFormState) => void;
  /** Values were prefilled from the resolved brand kit, not stored on the event. */
  inherited: boolean;
  /** Staff chose "Usar el heredado"; the override is removed on save. */
  cleared: boolean;
  /** The event has its own stored override that can be removed. */
  canUseInherited: boolean;
  onUseInherited: () => void;
  /** Live preview shown beside the form on desktop and below it on mobile. */
  preview?: ReactNode;
}

const withLocale = (text: LocalizedText, locale: SocialCtaLocale, value: string): LocalizedText => {
  const next = { ...text };
  if (value) next[locale] = value;
  else delete next[locale];
  return next;
};

/** Presentational editor for the event's own `socialCta` override. */
const ThemeSocialCtaBlock = ({
  form,
  errors,
  locale,
  onLocaleChange,
  onChange,
  inherited,
  cleared,
  canUseInherited,
  onUseInherited,
  preview,
}: ThemeSocialCtaBlockProps) => {
  const id = useId();
  const localeTag = locale.toUpperCase();
  const { channel } = form.primaryAction;
  const enabledNetworks = SOCIAL_NETWORKS.filter((network) => form.socials[network].enabled);

  const updateNetwork = (network: SocialNetwork, patch: Partial<SocialCtaFormState["socials"][SocialNetwork]>) => {
    const socials = { ...form.socials, [network]: { ...form.socials[network], ...patch } };
    const droppedChannel = patch.enabled === false && channel === network;
    onChange({
      ...form,
      socials,
      primaryAction: droppedChannel ? { ...form.primaryAction, channel: null } : form.primaryAction,
    });
  };

  const updateText = (field: TextField, value: string) =>
    onChange({ ...form, [field]: withLocale(form[field], locale, value) });

  const updateAction = (patch: Partial<SocialCtaFormState["primaryAction"]>) =>
    onChange({ ...form, primaryAction: { ...form.primaryAction, ...patch } });

  return (
    <fieldset className={`${styles.fieldset} mb-4`}>
      <legend className={styles.legend}>Redes sociales y CTA</legend>

      <div className={preview ? styles.layout : undefined}>
        <div className={styles.editor}>
          {inherited && !cleared && (
            <p className={styles.note}>
              Heredado del kit de marca; al guardar se volverá propio del evento.
            </p>
          )}
          {cleared && (
            <p className={styles.note}>
              Al guardar, el evento usará las redes y el botón del kit de marca.
            </p>
          )}
          {canUseInherited && !cleared && (
            <Button type="button" variant="outline-secondary" size="sm" className="mb-3" onClick={onUseInherited}>
              Usar el heredado
            </Button>
          )}

          <div className={styles.networks}>
            {SOCIAL_NETWORKS.map((network) => (
              <SocialNetworkRow
                key={network}
                network={network}
                field={form.socials[network]}
                error={errors.socials[network]}
                onToggle={(enabled) => updateNetwork(network, { enabled })}
                onValueChange={(value) => updateNetwork(network, { value })}
              />
            ))}
          </div>

          <div className={styles.textsHeader}>
            <span className={styles.subLegend}>Textos</span>
            <ButtonGroup size="sm" aria-label="Idioma de los textos">
              {LOCALES.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={option === locale ? "primary" : "outline-primary"}
                  aria-pressed={option === locale}
                  onClick={() => onLocaleChange(option)}
                >
                  {option.toUpperCase()}
                </Button>
              ))}
            </ButtonGroup>
          </div>
          <Form.Text className={`${styles.hint} d-block mb-2`}>
            Puedes usar {"{{honoreesName}}"} para mostrar el nombre de los festejados. Si falta el
            inglés, se mostrará el español.
          </Form.Text>

          {TEXT_FIELDS.map(({ field, label, placeholder }) => (
            <Form.Group key={field} className="mb-3" controlId={`${id}-${field}`}>
              <Form.Label>{`${label} (${localeTag})`}</Form.Label>
              <Form.Control
                type="text"
                placeholder={placeholder}
                value={form[field][locale] ?? ""}
                onChange={(event) => updateText(field, event.target.value)}
              />
            </Form.Group>
          ))}

          <Form.Group className="mb-3" controlId={`${id}-channel`}>
            <Form.Label>Botón principal</Form.Label>
            <Form.Select
              value={channel ?? ""}
              isInvalid={Boolean(errors.primaryChannel)}
              onChange={(event) =>
                updateAction({ channel: (event.target.value || null) as SocialNetwork | null })
              }
            >
              <option value="">Sin botón</option>
              {enabledNetworks.map((network) => (
                <option key={network} value={network}>
                  {SOCIAL_NETWORK_LABELS[network]}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.primaryChannel}</Form.Control.Feedback>
          </Form.Group>

          {channel && (
            <Form.Group className="mb-3" controlId={`${id}-label`}>
              <Form.Label>{`Texto del botón (${localeTag})`}</Form.Label>
              <Form.Control
                type="text"
                placeholder={channel === "whatsapp" ? "Escríbenos" : "Síguenos"}
                value={form.primaryAction.label[locale] ?? ""}
                isInvalid={Boolean(errors.primaryLabel)}
                onChange={(event) =>
                  updateAction({ label: withLocale(form.primaryAction.label, locale, event.target.value) })
                }
              />
              <Form.Control.Feedback type="invalid">{errors.primaryLabel}</Form.Control.Feedback>
            </Form.Group>
          )}

          {channel === "whatsapp" && (
            <Form.Group className="mb-3" controlId={`${id}-message`}>
              <Form.Label>{`Mensaje de WhatsApp (${localeTag})`}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Hola, vi las fotos de {{honoreesName}}"
                value={form.primaryAction.message[locale] ?? ""}
                onChange={(event) =>
                  updateAction({
                    message: withLocale(form.primaryAction.message, locale, event.target.value),
                  })
                }
              />
            </Form.Group>
          )}
        </div>

        {preview && <aside className={styles.previewColumn}>{preview}</aside>}
      </div>
    </fieldset>
  );
};

export default ThemeSocialCtaBlock;
