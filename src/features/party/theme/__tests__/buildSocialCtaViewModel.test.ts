import assert from "node:assert/strict";
import test from "node:test";
import { buildSocialCtaViewModel } from "../buildSocialCtaViewModel";
import { SocialCta } from "../../types/themeContract";

test("returns null when socialCta is null", () => {
  assert.equal(buildSocialCtaViewModel(null, "es"), null);
});

test("returns null when socialCta is undefined", () => {
  assert.equal(buildSocialCtaViewModel(undefined, "es"), null);
});

test("headline/subtitle/followText resolve to null when missing", () => {
  const socialCta: SocialCta = {};
  const vm = buildSocialCtaViewModel(socialCta, "es");
  assert.ok(vm);
  assert.equal(vm?.headline, null);
  assert.equal(vm?.subtitle, null);
  assert.equal(vm?.followText, null);
});

test("resolves headline with es->en fallback", () => {
  const socialCta: SocialCta = {
    headline: { text: { en: "Hello there" } },
  };
  const vm = buildSocialCtaViewModel(socialCta, "es");
  assert.equal(vm?.headline, "Hello there");
});

test("interpolates {{honoreesName}} and {{brandName}} params into headline", () => {
  const socialCta: SocialCta = {
    headline: { text: { es: "¡{{honoreesName}} ama a {{brandName}}!" } },
  };
  const vm = buildSocialCtaViewModel(socialCta, "es", {
    honoreesName: "Ana",
    brandName: "Acme",
  });
  assert.equal(vm?.headline, "¡Ana ama a Acme!");
});

test("builds an encoded whatsapp href from the primary action", () => {
  const socialCta: SocialCta = {
    primaryAction: {
      channel: "whatsapp",
      label: { text: { es: "Escríbenos" } },
      phone: "5215500000000",
      message: { text: { es: "Hola {{honoreesName}}" } },
    },
  };
  const vm = buildSocialCtaViewModel(socialCta, "es", { honoreesName: "Ana" });
  assert.equal(vm?.primaryAction?.channel, "whatsapp");
  assert.equal(vm?.primaryAction?.label, "Escríbenos");
  assert.equal(
    vm?.primaryAction?.href,
    "https://wa.me/5215500000000?text=Hola%20Ana",
  );
});

test("uses the action's url as-is for link channels", () => {
  for (const channel of ["instagram", "tiktok", "facebook", "url"] as const) {
    const socialCta: SocialCta = {
      primaryAction: {
        channel,
        label: { text: { es: "Síguenos" } },
        url: `https://example.com/${channel}`,
      },
    };
    const vm = buildSocialCtaViewModel(socialCta, "es");
    assert.equal(vm?.primaryAction?.channel, channel);
    assert.equal(vm?.primaryAction?.href, `https://example.com/${channel}`);
  }
});

test("hides the primary action when its label resolves to null", () => {
  const socialCta: SocialCta = {
    primaryAction: {
      channel: "url",
      label: { text: {} },
      url: "https://example.com",
    },
  };
  const vm = buildSocialCtaViewModel(socialCta, "es");
  assert.equal(vm?.primaryAction, null);
});

test("primaryAction is null when absent", () => {
  const vm = buildSocialCtaViewModel({}, "es");
  assert.equal(vm?.primaryAction, null);
});

test("socials only carries the present keys", () => {
  const socialCta: SocialCta = {
    socials: { instagram: "https://instagram.com/acme" },
  };
  const vm = buildSocialCtaViewModel(socialCta, "es");
  assert.deepEqual(vm?.socials, { instagram: "https://instagram.com/acme" });
});

test("socials is an empty object when absent", () => {
  const vm = buildSocialCtaViewModel({}, "es");
  assert.deepEqual(vm?.socials, {});
});
