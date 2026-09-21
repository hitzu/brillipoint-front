import type { AgendaEntry, YMD } from "../types";
import { entryPresentation } from "../utils/agendaPresentation";

export const AgendaEntryContent = ({
  entry,
  date,
}: {
  entry: AgendaEntry;
  date: YMD;
}) => {
  const info = entryPresentation(entry, date);

  return (
    <>
      <strong>{info.title}</strong>
      <span>{info.time}</span>
    </>
  );
};

export const AgendaEntryCard = ({
  entry,
  date,
  onSelect,
}: {
  entry: AgendaEntry;
  date: YMD;
  onSelect?: () => void;
}) =>
  onSelect ? (
    <button type="button" className="agenda-entry-card" onClick={onSelect}>
      <AgendaEntryContent entry={entry} date={date} />
    </button>
  ) : (
    <div className="agenda-entry-card">
      <AgendaEntryContent entry={entry} date={date} />
    </div>
  );
