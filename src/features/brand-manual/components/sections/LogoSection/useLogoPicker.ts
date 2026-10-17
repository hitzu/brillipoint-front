import { useState } from "react";
import { LOGO_BACKGROUNDS, LOGO_SIZE } from "../../../constants/logo";
import { tokenValue } from "../../../constants/tokens";
import type { LogoBackgroundId, LogoVersionId } from "../../../types";
import { logoVerdict } from "../../../utils/rules";

export function useLogoPicker() {
  const [version, setVersion] = useState<LogoVersionId>("neon");
  const [background, setBackground] = useState<LogoBackgroundId>("black");
  const [size, setSize] = useState(LOGO_SIZE.initial);
  const [showGuard, setShowGuard] = useState(false);

  const bg = LOGO_BACKGROUNDS[background];

  return {
    version,
    setVersion,
    background,
    setBackground,
    size,
    setSize,
    showGuard,
    setShowGuard,
    backgroundName: bg.name,
    canvasColor: tokenValue(bg.token, bg.line),
    // The guide line takes the gold that reads on that background.
    guardColor: bg.dark ? tokenValue("gold-500", "dark") : tokenValue("gold-700", "light"),
    verdict: logoVerdict({ version, background, size }),
  };
}
