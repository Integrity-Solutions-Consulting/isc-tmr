import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Primer idioma soportado de Accept-Language, por calidad (mismo criterio que el gate). */
function fromAcceptLanguage(header: string | null): Locale | undefined {
  return header
    ?.split(",")
    .map((part) => {
      const [tag = "", q = "q=1"] = part.trim().split(";");
      return { locale: tag.trim().split("-")[0], q: Number.parseFloat(q.replace("q=", "")) };
    })
    .sort((a, b) => b.q - a.q)
    .map(({ locale }) => locale)
    .find(isLocale);
}

// Sin rutas por idioma (/es/…): el idioma sale de la cookie o del navegador,
// igual que en el gate, así sus mensajes y los de la app coinciden.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : (fromAcceptLanguage((await headers()).get("accept-language")) ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
