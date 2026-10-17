import type { ReactNode } from "react";
import { Spark } from "./Spark";
import ui from "./ui.module.css";

/** A list whose bullets are the brand spark. */
export function SparkList({ items }: { items: ReactNode[] }) {
  return (
    <ul className={ui.dots}>
      {items.map((item, index) => (
        <li key={index}>
          <Spark />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
