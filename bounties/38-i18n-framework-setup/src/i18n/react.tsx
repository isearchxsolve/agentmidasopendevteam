"use client";

import {
  createBrowserLocaleStore,
  createI18n,
  loadLocale,
  normalizeLocale
} from "./core.js";
import en from "./catalogs/en.js";
import type {
  I18n,
  LocaleCatalogLoader,
  SupportedLocale
} from "./types.js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

interface I18nContextValue extends I18n {
  readonly isLoading: boolean;
  readonly error: Error | null;
  setLocale(locale: SupportedLocale): Promise<void>;
}

const fallbackI18n = createI18n("en", en);

const I18nContext = createContext<I18nContextValue>({
  ...fallbackI18n,
  isLoading: false,
  error: null,
  setLocale: async () => undefined
});

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
  loader?: LocaleCatalogLoader;
  storageKey?: string;
}

export function I18nProvider({
  children,
  initialLocale = "en",
  loader = loadLocale,
  storageKey
}: I18nProviderProps): React.JSX.Element {
  const store = useMemo(
    () => createBrowserLocaleStore(storageKey),
    [storageKey]
  );
  const [locale, setCurrentLocale] = useState<SupportedLocale>(() =>
    normalizeLocale(store.read() ?? initialLocale)
  );
  const [catalog, setCatalog] = useState(en);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  const setLocale = useCallback(async (requestedLocale: SupportedLocale) => {
    const nextLocale = normalizeLocale(requestedLocale);
    const currentRequest = ++requestId.current;

    if (nextLocale === "en") {
      setCurrentLocale("en");
      setCatalog(en);
      setError(null);
      store.write("en");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextCatalog = await loader(nextLocale);
      if (currentRequest !== requestId.current) return;

      setCurrentLocale(nextLocale);
      setCatalog(nextCatalog);
      store.write(nextLocale);
    } catch {
      if (currentRequest !== requestId.current) return;

      setCurrentLocale("en");
      setCatalog(en);
      setError(new Error("Locale loading failed."));
      store.write("en");
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, [loader, store]);

  useEffect(() => {
    void setLocale(locale);
    // Initial normalization must be applied exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    ...createI18n(locale, catalog),
    isLoading,
    error,
    setLocale
  }), [catalog, error, isLoading, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
