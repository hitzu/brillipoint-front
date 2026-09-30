import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppLink } from "../buildWhatsAppLink";
import { SocialCtaWhatsappAction } from "../../types/themeContract";

test("encodes spaces, accents and punctuation in the message", () => {
  const action: SocialCtaWhatsappAction = {
    channel: "whatsapp",
    label: { text: { es: "Escríbenos" } },
    phone: "5215512345678",
    message: { text: { es: "¿Nos mandas tus fotos?" } },
  };

  const link = buildWhatsAppLink(action, "es");

  assert.equal(
    link,
    "https://wa.me/5215512345678?text=" + encodeURIComponent("¿Nos mandas tus fotos?"),
  );
  assert.ok(link.includes("%C2%BF") || link.includes(encodeURIComponent("¿")));
});

test("omits the text param when there is no message", () => {
  const action: SocialCtaWhatsappAction = {
    channel: "whatsapp",
    label: { text: { es: "Escríbenos" } },
    phone: "5215512345678",
  };

  assert.equal(buildWhatsAppLink(action, "es"), "https://wa.me/5215512345678");
});

test("omits the text param when the message resolves to null", () => {
  const action: SocialCtaWhatsappAction = {
    channel: "whatsapp",
    label: { text: { es: "Escríbenos" } },
    phone: "5215512345678",
    message: { text: {} },
  };

  assert.equal(buildWhatsAppLink(action, "es"), "https://wa.me/5215512345678");
});

test("interpolates params into the message before encoding", () => {
  const action: SocialCtaWhatsappAction = {
    channel: "whatsapp",
    label: { text: { es: "Escríbenos" } },
    phone: "5215512345678",
    message: { text: { es: "Hola, soy {{honoreesName}}" } },
  };

  const link = buildWhatsAppLink(action, "es", { honoreesName: "Sofía" });

  assert.equal(
    link,
    "https://wa.me/5215512345678?text=" + encodeURIComponent("Hola, soy Sofía"),
  );
});
