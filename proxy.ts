import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/server/lib/auth";
import { ACCESS_TOKEN_HEADER } from "@/server/lib/principal";

const LOGIN = "/auth";
const HOME = "/dashboard";

/** Solo rutas internas: evita open redirects con `callbackURL=//evil.com`. */
function safeCallback(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : HOME;
}

// Filtro de navegación. Verifica la sesión completa (no solo que exista la
// cookie): es un JWE que se descifra localmente, sin BD ni llamada al gate, y
// así una cookie caducada no provoca un bucle /dashboard ⇄ /auth.
// La autorización de datos vive en lib/dal.ts y en el authPlugin de la API.
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const { response: session, headers } = await auth.api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });

  // Nunca se acepta la cabecera interna del cliente: solo la pone este proxy
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(ACCESS_TOKEN_HEADER);
  const setCookies = headers.getSetCookie();

  // Access token del gate para las páginas (permisos y organización). Se
  // obtiene aquí porque si está caducado se refresca y la cookie de la cuenta
  // cambia: el proxy puede guardarla, un Server Component no. Si falla, la
  // DAL lo vuelve a intentar y, sin token, trata al usuario como sin acceso.
  if (session && pathname.startsWith(HOME)) {
    try {
      const { response: token, headers: tokenHeaders } = await auth.api.getAccessToken({
        body: { useAccountCookie: true },
        headers: request.headers,
        returnHeaders: true,
      });
      requestHeaders.set(ACCESS_TOKEN_HEADER, token.accessToken);
      setCookies.push(...tokenHeaders.getSetCookie());
    } catch (error) {
      console.error("No se pudo obtener el access token del gate:", error);
    }
  }

  let response: NextResponse;
  if (pathname === "/") {
    response = NextResponse.redirect(new URL(session ? HOME : LOGIN, request.url));
  } else if (pathname === LOGIN) {
    // Con ?error se muestra aunque haya sesión local (p. ej. token del gate
    // inválido): redirigir al dashboard rebotaría otra vez aquí
    response =
      session && !searchParams.has("error")
        ? NextResponse.redirect(
            new URL(safeCallback(searchParams.get("callbackURL")), request.url),
          )
        : NextResponse.next();
  } else if (!session) {
    const login = new URL(LOGIN, request.url);
    login.searchParams.set("callbackURL", pathname + search);
    response = NextResponse.redirect(login);
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Cookies renovadas (sesión y, si hubo refresh, la cuenta) al navegador
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

// Rutas explícitas: /api se protege con el authPlugin, y sw.js, manifest,
// íconos y /offline deben seguir accesibles sin sesión para la PWA.
export const config = {
  matcher: ["/", "/auth", "/dashboard/:path*"],
};
