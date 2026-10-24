export const SUPPORTED_LOCALES = ["en", "es", "fr", "pt"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export type MessageCatalog = Readonly<Record<string, string>>;
export type TranslationValue = string | number | boolean | bigint | null | undefined;
export type TranslationValues = Readonly<Record<string, TranslationValue>>;

export interface I18n {
  readonly locale: SupportedLocale;
  readonly fallbackLocale: SupportedLocale;
  t(key: string, values?: TranslationValues): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
}

export type LocaleCatalogLoader = (
  locale: SupportedLocale
) => Promise<MessageCatalog>;
