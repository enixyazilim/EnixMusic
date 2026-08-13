import { tr } from "./tr";
import { en } from "./en";

export type Language = "tr" | "en";

export const locales = {
  tr,
  en
} as const;

export type TranslationSchema = typeof tr;

export function getLocale(language?: Language | string): TranslationSchema {
  if (language === "tr") {
    return tr;
  }
  return en;
}

export { tr, en };
