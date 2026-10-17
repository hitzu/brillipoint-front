import type { ReactNode } from "react";
import ui from "./ui.module.css";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  lead: ReactNode;
}

export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <header className={ui.header}>
      <span className={ui.eyebrow}>{eyebrow}</span>
      <h2 className={ui.title}>{title}</h2>
      <p className={ui.lead}>{lead}</p>
    </header>
  );
}
