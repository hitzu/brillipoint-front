type CacheQueryValue = string | string[] | undefined;

export const isFreshThemeCacheEnabled = (
  routerIsReady: boolean,
  cacheQuery: CacheQueryValue,
): boolean => routerIsReady && cacheQuery === "off";

export const getFreshThemeRequestOptions = (freshTheme: boolean) =>
  freshTheme ? { params: { cache: "off" as const } } : undefined;
