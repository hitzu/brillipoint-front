/**
 * True when this browser holds a Brillipoint staff session (`authToken` in
 * localStorage, written only by the staff login). Read at call time so it also
 * covers events fired while the page loads. Analytics skip these browsers.
 */
export const hasBrillipointSession = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem("authToken"));
  } catch {
    return false;
  }
};
