interface SearchableEvent {
  honoreesNames?: string | null;
  key?: string | null;
  token?: string | null;
}

/** Case-insensitive match of a search term against the event's honorees, key or token. */
export const matchesEventSearch = (event: SearchableEvent, term: string): boolean => {
  const needle = term.trim().toLowerCase();
  return [event.honoreesNames, event.key, event.token].some((value) => value?.toLowerCase().includes(needle));
};
