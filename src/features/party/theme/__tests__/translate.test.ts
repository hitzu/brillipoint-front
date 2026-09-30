import assert from "node:assert/strict";
import test from "node:test";
import { translate } from "../translate";

test("interpolates a placeholder with surrounding spaces", () => {
  assert.equal(translate("Hi {{ name }}!", { name: "Ana" }), "Hi Ana!");
});

test("renders a missing param as an empty string", () => {
  assert.equal(translate("Hi {{name}}!", {}), "Hi !");
});

test("renders a null param as an empty string", () => {
  assert.equal(translate("Hi {{name}}!", { name: null }), "Hi !");
});

test("stringifies a number param", () => {
  assert.equal(translate("You have {{count}} photos", { count: 3 }), "You have 3 photos");
});

test("replaces multiple distinct placeholders", () => {
  assert.equal(
    translate("{{greeting}} {{name}}!", { greeting: "Hola", name: "Luis" }),
    "Hola Luis!",
  );
});
