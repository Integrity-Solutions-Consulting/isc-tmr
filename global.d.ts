import type messages from "./messages/es.json";
import type { Locale } from "./i18n/config";

// Claves y locales tipados: t("auth.welcome") se valida en compilación
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
