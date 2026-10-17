import { useState } from "react";
import { TESTER_STYLES } from "../../../constants/typography";
import type { TypeStyleId } from "../../../types";
import { typeVerdict } from "../../../utils/rules";

export function useTypeTester() {
  const [styleId, setStyleId] = useState<TypeStyleId>(TESTER_STYLES[0].id);
  const [text, setText] = useState(TESTER_STYLES[0].sample);
  // Until the viewer types, each style shows its own sample phrase.
  const [edited, setEdited] = useState(false);

  const style = TESTER_STYLES.find((item) => item.id === styleId) ?? TESTER_STYLES[0];

  const selectStyle = (id: TypeStyleId) => {
    setStyleId(id);
    if (!edited) setText(TESTER_STYLES.find((item) => item.id === id)?.sample ?? "");
  };

  const changeText = (value: string) => {
    setEdited(true);
    setText(value);
  };

  return {
    style,
    text,
    preview: styleId === "eyebrow" ? text.toLocaleUpperCase("es-MX") : text,
    verdict: typeVerdict(styleId, text),
    selectStyle,
    changeText,
  };
}
