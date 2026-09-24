import type { AgendaEntry, YMD } from "../types";
import type { CreateOption, CreateOptionsPolicy } from "../utils/createOptions";
import {
  TIMELINE_TICKS,
  TIMELINE_WINDOW_MINUTES,
  timelineSegments,
  type TimelineSegment,
} from "../utils/dayTimeline";
import { entryLabel } from "../utils/agendaPresentation";
import {
  BOOKING_BLOCKS,
  type BookingBlock,
} from "../../../shared/scheduling/bookingBlocks";
import styles from "./DayTimeline.module.css";

interface Props {
  date: YMD;
  entries: Record<YMD, AgendaEntry[]>;
  getCreateOptions?: CreateOptionsPolicy;
  onCreateRequest?: (option: CreateOption) => void;
  density?: "compact" | "full";
  /** "blocks" swaps hour labels for the sellable Mañana/Tarde/Noche scale. */
  scale?: TimelineScale;
}

export type TimelineScale = "hours" | "blocks";

/** Ticks always shown in compact density: 04:00, 12:00, 20:00. */
const COMPACT_TICK_OFFSETS = new Set([0, 480, 960]);

/** Window offset of a block: its civil start measured from 04:00. */
const blockOffset = (block: BookingBlock): number => {
  const [hours, minutes] = block.startsAt.split(":").map(Number);
  return (
    (hours * 60 + minutes - 4 * 60 + TIMELINE_WINDOW_MINUTES) %
    TIMELINE_WINDOW_MINUTES
  );
};

const BLOCK_SCALE = BOOKING_BLOCKS.map((block, index) => {
  const start = blockOffset(block);
  const next = BOOKING_BLOCKS[index + 1];
  const end = next ? blockOffset(next) : TIMELINE_WINDOW_MINUTES;
  return { ...block, start, end };
});

const pct = (minutes: number): string =>
  `${(minutes / TIMELINE_WINDOW_MINUTES) * 100}%`;

const dedupeEntries = (entries?: AgendaEntry[]): AgendaEntry[] => {
  if (!entries?.length) return [];
  const byKey = new Map<string, AgendaEntry>();
  entries.forEach((entry) => byKey.set(entry.key, entry));
  return Array.from(byKey.values());
};

const segmentTimeLabel = (segment: TimelineSegment): string =>
  `${segment.kind === "occupied" ? "Ocupado" : "Libre"} ${segment.startsAt}–${segment.endsAt}`;

export const DayTimeline = ({
  date,
  entries,
  getCreateOptions,
  onCreateRequest,
  density = "full",
  scale = "hours",
}: Props) => {
  const showSegmentText = density === "full" && scale === "hours";
  const segments = timelineSegments(date, entries);
  // Block-scale actions are the only create affordance DayTimeline still
  // renders: the hours-scale summary/"Apartar Libre" actions were removed
  // (T4) to reduce agenda noise, keeping only the timeline bar, hour
  // labels and event cards.
  const options =
    getCreateOptions && onCreateRequest ? getCreateOptions(date, entries) : [];

  return (
    <div
      className={`${styles.timeline} ${density === "compact" ? styles.compact : ""}`}
      data-density={density}
    >
      <div
        className={styles.bar}
        role="list"
        aria-label={`Disponibilidad ${date}`}
      >
        {segments.map((segment) => {
          const dedupedEntries = dedupeEntries(segment.entries);
          const timeLabel = segmentTimeLabel(segment);
          const accessibleName = dedupedEntries.length
            ? `${timeLabel}: ${dedupedEntries.map(entryLabel).join(", ")}`
            : timeLabel;

          return (
            <div
              key={`${segment.kind}-${segment.start}-${segment.end}`}
              role="listitem"
              className={`${styles.segment} ${segment.kind === "occupied" ? styles.occupied : styles.free}`}
              style={{
                left: pct(segment.start),
                width: pct(segment.end - segment.start),
              }}
              title={accessibleName}
              aria-label={accessibleName}
            >
              {showSegmentText ? (
                <>
                  <span className={styles.segmentTime}>{timeLabel}</span>
                  {dedupedEntries.length ? (
                    <span className={styles.segmentEntries}>
                      {dedupedEntries.map(entryLabel).join(", ")}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      {scale === "blocks" ? (
        <div className={styles.blockScale}>
          {BLOCK_SCALE.map((block) => {
            const option = options.find(
              (candidate) => candidate.blockId === block.id
            );
            return (
              <button
                key={block.id}
                type="button"
                className={styles.blockButton}
                style={{ flex: `${block.end - block.start} 1 0` }}
                aria-label={`Apartar ${block.label} ${block.startsAt}–${block.endsAt}`}
                disabled={!option}
                onClick={() => option && onCreateRequest?.(option)}
              >
                {block.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`${styles.ticks} day-timeline-ticks`}
          aria-hidden="true"
        >
          {TIMELINE_TICKS.map((tick) => (
            <span
              key={tick.offset}
              className={styles.tick}
              style={{ left: pct(tick.offset) }}
            >
              {density === "full" || COMPACT_TICK_OFFSETS.has(tick.offset)
                ? tick.label
                : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
