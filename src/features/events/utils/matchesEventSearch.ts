interface SearchableEvent {
  honoreesNames?: string | null;
  key?: string | null;
}

/** Case-insensitive match of a search term against the event's honorees or key. */
export const matchesEventSearch = (event: SearchableEvent, term: string): boolean => {
  const needle = term.trim().toLowerCase();
  return [event.honoreesNames, event.key].some((value) => value?.toLowerCase().includes(needle));
};
