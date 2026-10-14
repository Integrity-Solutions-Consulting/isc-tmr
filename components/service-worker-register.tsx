"use client";

import { useEffect } from "react";

/**
 * Registra /sw.js. En dev se pasa ?dev=1 para que el SW no cachee
 * /_next/static (en dev esos chunks no llevan hash y quedarían viejos con HMR).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const url = process.env.NODE_ENV === "production" ? "/sw.js" : "/sw.js?dev=1";
    navigator.serviceWorker
      .register(url, { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Error registrando el service worker:", error));
  }, []);

  return null;
}
