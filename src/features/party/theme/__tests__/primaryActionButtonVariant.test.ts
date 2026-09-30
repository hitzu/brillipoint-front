import assert from "node:assert/strict";
import { test } from "node:test";

import { getPrimaryActionChannelClassName } from "../primaryActionButtonVariant";

test("getPrimaryActionChannelClassName maps whatsapp to its own class", () => {
  assert.equal(getPrimaryActionChannelClassName("whatsapp"), "channelWhatsapp");
});

test("getPrimaryActionChannelClassName maps facebook to its own class", () => {
  assert.equal(getPrimaryActionChannelClassName("facebook"), "channelFacebook");
});

test("getPrimaryActionChannelClassName maps instagram to its own class", () => {
  assert.equal(getPrimaryActionChannelClassName("instagram"), "channelInstagram");
});

test("getPrimaryActionChannelClassName maps tiktok to its own class", () => {
  assert.equal(getPrimaryActionChannelClassName("tiktok"), "channelTiktok");
});

test("getPrimaryActionChannelClassName maps url to the theme-primary class", () => {
  assert.equal(getPrimaryActionChannelClassName("url"), "channelUrl");
});

test("getPrimaryActionChannelClassName returns a distinct class per channel", () => {
  const channels = ["whatsapp", "facebook", "instagram", "tiktok", "url"] as const;
  const classNames = channels.map(getPrimaryActionChannelClassName);
  assert.equal(new Set(classNames).size, channels.length);
});
