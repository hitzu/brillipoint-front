import { Row, Col } from "react-bootstrap";
import styles from "@assets/css/social-media-plugin.module.css";
import { useMemo } from "react";
import { GetContractByIdResponse } from "../../../interfaces";
import { formatLongSpanishDate, parseLocalDate } from "@common/dates";

type SocialWhatsAppCta = {
  label: string;
  message: string;
  variant?: "primary" | "secondary";
};

type SocialMediaPluginCopy = {
  title?: string;
  subtitle?: string;
  followLabel?: string;
  thanksText?: string;
  whatsappLabel?: string;
  whatsappMessage?: string;
  ctas?: SocialWhatsAppCta[];
};

export const SocialMediaPlugin = ({
  data,
  eventDate,
  copy,
}: {
  data?: Partial<GetContractByIdResponse>;
  eventDate?: string | null;
  copy?: SocialMediaPluginCopy;
}) => {
  const normalizeWhatsAppPhone = (raw: string) => raw.replace(/[^\d]/g, "");

  const phone = useMemo(() => {
    const phoneRaw = (
      process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5212215775211"
    ).trim();
    return normalizeWhatsAppPhone(phoneRaw);
  }, []);

  const defaultWhatsappMessage = useMemo(() => {
    const clientName = data?.contract?.clientName;
    const humanDate = eventDate
      ? formatLongSpanishDate(parseLocalDate(eventDate))
      : undefined;
    return `Hola, tengo duda sobre mi reserva Brillipoint${
      clientName ? `, esta a nombre de ${clientName}` : ""
    }${humanDate ? ` y es el ${humanDate}` : ""}.`;
  }, [data?.contract?.clientName, eventDate]);

  const toWhatsappHref = (message: string) => {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  const customCtas = useMemo<SocialWhatsAppCta[]>(() => {
    return (copy?.ctas || []).filter(
      (cta) => Boolean(cta?.label && cta?.message),
    );
  }, [copy?.ctas]);

  const title = copy?.title || "¿Tienes dudas sobre tu reserva?";
  const subtitle =
    copy?.subtitle || "Estamos listos para ayudarte por WhatsApp";
  const whatsappLabel = copy?.whatsappLabel || "Escríbenos por WhatsApp";
  const followLabel = copy?.followLabel || "Síguenos en redes";
  const thanksText =
    copy?.thanksText || "✨ Gracias por vivir la experiencia Brillipoint ✨";

  const ctasToRender =
    customCtas.length > 0
      ? customCtas
      : [
          {
            label: whatsappLabel,
            message: copy?.whatsappMessage || defaultWhatsappMessage,
            variant: "primary" as const,
          },
        ];

  return (
    <div>
      <Row className="mb-4">
        <Col xs={12}>
          <div className={styles.socialCtaWrap}>
            <div className={styles.socialCtaCard}>
              <div style={{ display: "grid", gap: "0.25rem" }}>
                <div className={styles.socialCtaTitle}>{title}</div>
                <div className={styles.socialCtaSubtitle}>{subtitle}</div>
              </div>

              <div className={styles.ctaButtonsWrap}>
                {ctasToRender.map((cta, index) => (
                  <a
                    key={`${cta.label}-${index}`}
                    href={toWhatsappHref(cta.message)}
                    target="_blank"
                    rel="noreferrer"
                    className={
                      cta.variant === "secondary"
                        ? styles.secondaryCtaBtn
                        : styles.whatsappBtn
                    }
                  >
                    <span className={styles.btnIcon} aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16 2.667C8.643 2.667 2.667 8.643 2.667 16c0 2.373.62 4.691 1.799 6.73L2.667 29.333l6.843-1.769A13.27 13.27 0 0 0 16 29.333c7.357 0 13.333-5.976 13.333-13.333S23.357 2.667 16 2.667Zm0 24A10.6 10.6 0 0 1 10.4 25.07l-.4-.235-4.06 1.05 1.085-3.956-.26-.41A10.61 10.61 0 1 1 16 26.667Z"
                          fill="currentColor"
                          opacity="0.9"
                        />
                        <path
                          d="M22.24 18.645c-.33-.165-1.957-.965-2.26-1.076-.303-.11-.524-.165-.744.165-.22.33-.855 1.076-1.05 1.296-.193.22-.386.247-.716.082-.33-.165-1.395-.514-2.658-1.64-.982-.876-1.645-1.958-1.84-2.288-.193-.33-.021-.509.144-.674.149-.148.33-.386.495-.579.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.579-.082-.165-.744-1.797-1.02-2.46-.268-.642-.54-.555-.744-.565l-.634-.012c-.22 0-.578.082-.88.413-.303.33-1.156 1.13-1.156 2.756 0 1.626 1.185 3.198 1.35 3.418.165.22 2.333 3.56 5.65 4.99.79.34 1.405.543 1.885.695.792.252 1.512.217 2.08.132.635-.095 1.957-.8 2.233-1.57.275-.772.275-1.434.193-1.57-.082-.138-.303-.22-.634-.386Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    {cta.label}
                  </a>
                ))}
              </div>

              <div className={styles.socialFollow}>
                <div className={styles.socialFollowLabel}>{followLabel}</div>

                <div className={styles.socialButtons}>
                  <a
                    href="https://www.instagram.com/brillipoint/"
                    target="_blank"
                    rel="noreferrer"
                    className={[
                      styles.socialBtn,
                      styles.socialBtnInstagram,
                    ].join(" ")}
                  >
                    <span className={styles.btnIcon} aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Z"
                          fill="currentColor"
                          opacity="0.95"
                        />
                        <path
                          d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                          fill="currentColor"
                        />
                        <path
                          d="M17.6 6.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    Instagram
                  </a>

                  <a
                    href="https://www.facebook.com/profile.php?id=61579380963496"
                    target="_blank"
                    rel="noreferrer"
                    className={[
                      styles.socialBtn,
                      styles.socialBtnFacebook,
                    ].join(" ")}
                  >
                    <span className={styles.btnIcon} aria-hidden="true">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.5 21v-7h2.4l.4-3H13.5V9.2c0-.87.24-1.46 1.5-1.46h1.6V5.06c-.28-.04-1.24-.12-2.36-.12-2.33 0-3.94 1.42-3.94 4.03V11H8v3h2.8v7h2.7Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    Facebook
                  </a>
                </div>
              </div>

              <div className={styles.socialThanks}>{thanksText}</div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};
