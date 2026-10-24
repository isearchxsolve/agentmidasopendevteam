"use client";

import React from "react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./types.js";
import { useI18n } from "./react.js";

const labels: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português"
};

export function LocaleSelector(): React.JSX.Element {
  const { locale, setLocale, isLoading, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-200">
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={locale}
        disabled={isLoading}
        onChange={(event) => void setLocale(event.target.value as SupportedLocale)}
        className="rounded-md border border-[#D4AF37]/70 bg-[#0A0A0A] px-3 py-2 text-zinc-100 outline-none transition focus:ring-2 focus:ring-[#D4AF37] disabled:cursor-wait disabled:opacity-60"
      >
        {SUPPORTED_LOCALES.map((value) => (
          <option key={value} value={value}>{labels[value]}</option>
        ))}
      </select>
      {isLoading && <span aria-live="polite">{t("language.loading")}</span>}
    </label>
  );
}
