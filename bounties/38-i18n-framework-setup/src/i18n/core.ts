import en from "./catalogs/en.js";
import type {
  I18n,
  LocaleCatalogLoader,
  MessageCatalog,
  SupportedLocale,
  TranslationValue,
  TranslationValues
} from "./types.js";
import { SUPPORTED_LOCALES } from "./types.js";

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/;
const TOKEN_PATTERN = /\{([a-zA-Z][a-zA-Z0-9_-]{0,63})\}/g;

const catalogLoaders: Record<SupportedLocale, () => Promise<MessageCatalog>> = {
  en: async () => en,
  es: async () => (await import("./catalogs/es.js")).default,
  fr: async () => (await import("./catalogs/fr.js")).default,
  pt: async () => (await import("./catalogs/pt.js")).default
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(
  value: unknown,
  fallback: SupportedLocale = "en"
): SupportedLocale {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (isSupportedLocale(normalized)) return normalized;

  const language = normalized.split("-", 1)[0];
  return isSupportedLocale(language) ? language : fallback;
}

export function detectLocale(
  candidates: readonly string[] | undefined,
  fallback: SupportedLocale = "en"
): SupportedLocale {
  if (!candidates) return fallback;

  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate, fallback);
    if (locale !== fallback || normalizeLocale(candidate, "__invalid__" as SupportedLocale) === fallback) {
      return locale;
    }
  }

  return fallback;
}

function ownMessage(catalog: MessageCatalog, key: string): string | undefined {
  if (!KEY_PATTERN.test(key)) return undefined;
  return Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : undefined;
}

function stringifyValue(value: TranslationValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  return String(value);
}

export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;

  return template.replace(TOKEN_PATTERN, (token, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return token;
    return stringifyValue(values[name]);
  });
}

export function createI18n(
  locale: SupportedLocale,
  catalog: MessageCatalog,
  fallbackCatalog: MessageCatalog = en,
  fallbackLocale: SupportedLocale = "en"
): I18n {
  return Object.freeze({
    locale,
    fallbackLocale,

    t(key: string, values?: TranslationValues): string {
      const message = ownMessage(catalog, key) ?? ownMessage(fallbackCatalog, key) ?? key;
      return interpolate(message, values);
    },

    formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
      if (!Number.isFinite(value)) return "";
      return new Intl.NumberFormat(locale, options).format(value);
    },

    formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(locale, options).format(date);
    }
  });
}

export const loadLocale: LocaleCatalogLoader = async (locale) => {
  const safeLocale = normalizeLocale(locale);
  return catalogLoaders[safeLocale]();
};

export function createBrowserLocaleStore(key = "agent-midas.locale") {
  return {
    read(): SupportedLocale | null {
      if (typeof window === "undefined") return null;

      try {
        const value = window.localStorage.getItem(key);
        return isSupportedLocale(value) ? value : null;
      } catch {
        return null;
      }
    },

    write(locale: SupportedLocale): void {
      if (typeof window === "undefined" || !isSupportedLocale(locale)) return;

      try {
        window.localStorage.setItem(key, locale);
      } catch {
        // Storage denial must never prevent localization.
      }
    }
  };
}
