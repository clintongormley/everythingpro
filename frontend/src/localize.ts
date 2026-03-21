import { IntlMessageFormat } from "intl-messageformat";
import en from "./translations/en.json";

const LANGUAGES: Record<string, Record<string, unknown>> = { en };

type Params = Record<string, string | number>;

function resolve(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function setupLocalize(
  hass?: { locale?: { language?: string }; language?: string },
): (key: string, params?: Params) => string {
  const lang = hass?.locale?.language ?? hass?.language ?? "en";
  const strings = LANGUAGES[lang] ?? LANGUAGES.en;
  const fallback = LANGUAGES.en;

  const formatCache = new Map<string, IntlMessageFormat>();

  return (key: string, params?: Params): string => {
    const raw =
      resolve(strings as Record<string, unknown>, key) ??
      resolve(fallback as Record<string, unknown>, key) ??
      key;

    if (!params) return raw;

    let fmt = formatCache.get(raw);
    if (!fmt) {
      fmt = new IntlMessageFormat(raw, lang);
      formatCache.set(raw, fmt);
    }
    return fmt.format(params) as string;
  };
}
