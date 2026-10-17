import { useState } from "react";
import type { Line } from "../../../types";
import { sparkVerdict } from "../../../utils/rules";
import { Spark } from "../../ui/Spark";
import { VerdictBox } from "../../ui/VerdictBox";
import ui from "../../ui/ui.module.css";
import styles from "./PiecesSection.module.css";

/** Fixed spots so the sparks land in the same place every time: [left %, top %, size px]. */
const SPARK_SPOTS: Array<[number, number, number]> = [
  [80, 12, 28],
  [16, 74, 16],
  [84, 62, 12],
  [26, 16, 10],
  [66, 86, 20],
  [8, 40, 12],
  [50, 8, 14],
  [90, 88, 10],
  [38, 60, 22],
  [72, 34, 10],
  [22, 90, 14],
  [56, 46, 12],
];

export function SparkCounter({ line }: { line: Line }) {
  const [count, setCount] = useState(4);
  const verdict = sparkVerdict(count);

  return (
    <div className={styles.sparks}>
      <div className={styles.sparkArt} data-testid="spark-art">
        <span>{line === "dark" ? "Brilla toda la noche" : "Momentos hoy, recuerdos siempre"}</span>
        {SPARK_SPOTS.slice(0, count).map(([left, top, size], index) => (
          <Spark key={index} style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }} />
        ))}
      </div>
      <div className={styles.sparkControls}>
        <div className={ui.range}>
          <label htmlFor="spark-count">
            Destellos en la pieza <output htmlFor="spark-count">{count}</output>
          </label>
          <input
            id="spark-count"
            type="range"
            min={1}
            max={SPARK_SPOTS.length}
            step={1}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </div>
        <VerdictBox kind={verdict.kind} testId="spark-verdict">
          {verdict.message}
        </VerdictBox>
        <p className={ui.note}>
          Cuatro arcos de cuarto de círculo, siempre en gold-500. En fondo oscuro pueden llevar el halo suave glow-gold.
        </p>
      </div>
    </div>
  );
}
