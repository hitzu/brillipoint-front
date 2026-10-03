import assert from "node:assert/strict";
import test from "node:test";
import { buildRewardPromoViewModel } from "../buildRewardPromoViewModel";
import { RewardPromo } from "../../types/themeContract";

test("returns null when rewardPromo is null", () => {
  assert.equal(buildRewardPromoViewModel(null, "es"), null);
});

test("returns null when rewardPromo is undefined", () => {
  assert.equal(buildRewardPromoViewModel(undefined, "es"), null);
});

test("passes the handle through unchanged", () => {
  const vm = buildRewardPromoViewModel({ handle: "@brillipoint" }, "es");
  assert.equal(vm?.handle, "@brillipoint");
});

test("absent title and disclaimer resolve to null", () => {
  const vm = buildRewardPromoViewModel({ handle: "@brillipoint" }, "en");
  assert.ok(vm);
  assert.equal(vm?.title, null);
  assert.equal(vm?.disclaimer, null);
});

test("title and disclaimer resolve in the requested locale", () => {
  const rewardPromo: RewardPromo = {
    handle: "@brillipoint",
    title: { text: { es: "Gana un regalo", en: "Win a gift" } },
    disclaimer: { text: { es: "Aplican restricciones", en: "Terms apply" } },
  };
  const vm = buildRewardPromoViewModel(rewardPromo, "en");
  assert.equal(vm?.title, "Win a gift");
  assert.equal(vm?.disclaimer, "Terms apply");
});

test("title and disclaimer fall back to the other locale when missing", () => {
  const rewardPromo: RewardPromo = {
    handle: "@brillipoint",
    title: { text: { es: "Gana un regalo" } },
    disclaimer: { text: { es: "Aplican restricciones" } },
  };
  const vm = buildRewardPromoViewModel(rewardPromo, "en");
  assert.equal(vm?.title, "Gana un regalo");
  assert.equal(vm?.disclaimer, "Aplican restricciones");
});

test("interpolates placeholders with the event params", () => {
  const rewardPromo: RewardPromo = {
    handle: "@brillipoint",
    title: { text: { es: "Regalo de {{honoreesName}}" } },
    disclaimer: { text: { es: "Solo en la fiesta de {{honoreesName}}" } },
  };
  const vm = buildRewardPromoViewModel(rewardPromo, "es", {
    honoreesName: "Ana",
  });
  assert.equal(vm?.title, "Regalo de Ana");
  assert.equal(vm?.disclaimer, "Solo en la fiesta de Ana");
});
