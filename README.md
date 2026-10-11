# isc-tmr — app de referencia para integrarse con el ISC Auth Gate

`isc-tmr` es una **app de pruebas** que sirve como **referencia de integración**
con el **ISC Auth Gate** (proveedor OIDC construido con Better Auth
`@better-auth/oauth-provider`). Demuestra dos cosas:

1. **Login OIDC** contra el gate usando el plugin `genericOAuth` de Better Auth
   (Authorization Code + PKCE, cliente confidencial).
2. **Una API propia protegida** con los **access tokens JWT** que emite el gate
   para un *resource* (RFC 8707), verificados localmente contra su JWKS.

El login funciona de punta a punta (verificado el 2026-10-04 contra
`https://192.168.100.227:3000`).

## Stack

| Pieza | Detalle |
| --- | --- |
| Framework | Next.js 16 (App Router, `output: "standalone"`, React Compiler) |
| API | Elysia montado dentro de Next en `app/api/[[...slugs]]/route.ts` (prefijo `/api`) |
| Auth | Better Auth 1.7.1 **stateless, sin base de datos** + `genericOAuth` |
| Verificación de tokens | `@better-auth/oauth-provider/resource-client` 1.7.1 (`oauthProviderResourceClient`) |
| Cliente tipado | Eden Treaty (`lib/eden.ts` en el navegador, `lib/eden.server.ts` en el servidor) |
| Runtime / gestor | **bun** (`packageManager: bun@1.4.2`) |
| Puerto | **4200** |

```bash
bun install
bun run dev         # http://localhost:4200
bun run dev:https   # https://<host>:4200 con los certificados de desarrollo (ver §3)
```

---

## 1. Arquitectura

### Flujo de login

```
 Navegador                    isc-tmr (:4200)                           ISC Auth Gate (:3000)
 ─────────                    ───────────────                           ─────────────────────
 /auth  "Iniciar sesión"
   │ authClient.signIn.social({ provider: "isc-gate" })
   ├──────────────► POST /api/auth/sign-in/social
   │                  genera state + PKCE, devuelve la URL de authorize
   │◄──────────────┤
   ├──────────────────────────────────────────────────────────────► GET /api/auth/oauth2/authorize
   │                                                                  ?client_id&scope&resource=OIDC_RESOURCE…
   │                                       login (/auth/sign-in) + consentimiento (/auth/consent)
   │◄─────────────────────────────────────────────────────────────── 302 → BETTER_AUTH_URL/api/auth/callback/isc-gate?code
   ├──────────────► GET /api/auth/callback/isc-gate
   │                  │ POST /api/auth/oauth2/token   (Basic client_id:secret, code, code_verifier)
   │                  ├────────────────────────────────────────────────► access_token (JWT, aud=OIDC_RESOURCE),
   │                  │                                                    refresh_token, id_token
   │                  │ GET /api/auth/oauth2/userinfo (Bearer access_token)
   │                  ├────────────────────────────────────────────────► perfil (sub, email, name…)
   │                  │ (el id_token se valida contra /api/auth/jwks)
   │◄──────────────┤ Set-Cookie: isc-tmr.* → sesión (JWE) + account cookie (tokens del gate cifrados)
```

### API protegida

```
 Navegador (cookie de sesión)            Cliente externo (Authorization: Bearer <JWT>)
          │                                             │
          └───────────────► GET /api/todos ◄────────────┘
                              macro `auth` (server/plugins/auth.ts)
                              ├─ con header Authorization → verifyAccessTokenRequest
                              └─ sin header → getSession + getAccessToken(useAccountCookie)
                                               (refresca si hace falta) → verifyBearerToken
                              verificación LOCAL: firma EdDSA contra ${OIDC_ISSUER}/jwks,
                              iss = OIDC_ISSUER, aud ∋ OIDC_RESOURCE, scopes requeridos
                              → 200 / 401 / 403
```

El gate solo interviene en la verificación para servir el JWKS (y en los
refresh). No se usa introspección.

### Modo stateless

`server/lib/auth.ts` crea `betterAuth({...})` **sin `database`**
(`server/lib/auth.ts:12-15`). Así Better Auth funciona en modo stateless:

- **Cookie de sesión**: la sesión de isc-tmr viaja en una cookie cifrada (JWE)
  firmada con `BETTER_AUTH_SECRET`.
- **Account cookie**: los tokens del gate (access, refresh, id token,
  expiraciones y scopes) se guardan cifrados en otra cookie. El servidor los lee con
  `auth.api.getAccessToken({ body: { useAccountCookie: true } })`.

Consecuencias: no hay tabla de usuarios local. Si cambia `BETTER_AUTH_SECRET`,
todas las sesiones dejan de valer. Las cookies pueden ser grandes porque llevan
un JWT, un refresh token y un id token.

### `cookiePrefix: "isc-tmr"`

```ts
// server/lib/auth.ts:17-21
advanced: {
  cookiePrefix: "isc-tmr",
},
```

Las cookies **no se aíslan por puerto**. El gate (`:3000`) y esta app (`:4200`)
corren en el mismo host (`localhost` o `192.168.100.227`), así que comparten el
almacén de cookies del navegador. Con el prefijo por defecto (`better-auth.*`),
la app pisaría la sesión del gate y viceversa. Cualquier app Better Auth que
conviva con el gate en el mismo host necesita un prefijo propio.

---

## 2. Requisitos previos en el gate

Todo esto se hace **como administrador global** en el dashboard del gate
(`/dashboard/administration/oauth` → pestañas de "OAuth Apps"). Los resources
solo los puede gestionar un admin global. Un cliente lo puede crear un admin
global o el owner/admin de la organización activa.

### a) Scopes personalizados

En el entorno del **gate**:

```env
BETTER_AUTH_OAUTH_SCOPES=todo:read,todo:write
```

Esta lista se suma a los scopes integrados (`openid`, `profile`, `email`,
`offline_access`) y aparece en `scopes_supported` del discovery. **Hay que
reiniciar el gate** después de cambiarla. Si falta, al crear el cliente el gate
rechaza el scope con `cannot request scope todo:read`.

### b) Resource (la API de isc-tmr)

Pestaña de resources → crear:

| Campo | Valor |
| --- | --- |
| `identifier` | **exactamente** el valor de `OIDC_RESOURCE` (p. ej. `http://localhost:4200/api`). Es solo un identificador: no tiene que ser accesible y no hace falta cambiarlo al usar la IP de la LAN. |
| `name` | libre (p. ej. "ISC TMR API") |
| `allowedScopes` | **`openid profile email offline_access todo:read todo:write`** |

> **La trampa de la intersección.** Cuando el cliente envía `resource`, los
> scopes del token quedan en **solicitados ∩ `allowedScopes` del resource**. Si
> `allowedScopes` solo contiene `todo:read todo:write`, el token pierde
> `openid`. Entonces el gate no emite id_token, `/oauth2/userinfo` responde
> `400 invalid_scope: Missing required scope` y Better Auth redirige con
> **`?error=unable_to_get_user_info`**. Por eso `allowedScopes` debe incluir
> también `openid profile email offline_access`. El dashboard muestra un aviso
> y un botón para añadirlos con un clic. Con `allowedScopes` vacío no se
> restringe nada. Si la intersección queda vacía, el gate responde
> `invalid_scope` ("none of the requested scopes are allowed for resource X").

### c) Cliente confidencial

Pestaña de clientes → crear (formulario de 4 pasos):

| Paso | Campo | Valor |
| --- | --- | --- |
| 1 | Nombre | p. ej. "ISC TMR" |
| 2 | Redirect URI | `${BETTER_AUTH_URL}/api/auth/callback/isc-gate`, p. ej. `https://192.168.100.227:4200/api/auth/callback/isc-gate` (y/o `http://localhost:4200/api/auth/callback/isc-gate`) |
| 2 | Post-logout redirect URI | `${BETTER_AUTH_URL}/`. `postLogoutRedirectURI: "/"` se resuelve contra la URL de la app (`server/lib/auth.ts:53`) |
| 3 | `token_endpoint_auth_method` | **`client_secret_basic`**. Tiene que coincidir con `authentication: "basic"` (ver §4) |
| 3 | Grant types | `authorization_code` + `refresh_token` |
| 3 | Scopes | `openid profile email offline_access todo:read todo:write` |
| 3 | Resources | marcar el resource del paso (b) |
| 4 | Resumen | guardar y **copiar el `client_secret`: se muestra una sola vez** |

**Vincular el resource es obligatorio.** El gate corre con
`enforcePerClientResources` activo (es el default). Si el cliente no está
vinculado al resource, authorize y token fallan con **`invalid_target`**. Si el
cliente ya existía, entrar a su detalle y activar el resource en la tarjeta
**"Resources (RFC 8707)"** (un switch por resource).

---

## 3. Configuración local

Copiar `.env.example` a `.env.local` y completar las variables:

| Variable | Qué es | Debe coincidir en el gate con… |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Secreto de Better Auth de **esta** app; cifra las cookies de sesión y de account (`openssl rand -base64 32`). | Nada. Es local y distinto del secreto del gate. |
| `BETTER_AUTH_URL` | URL con la que el **navegador** llega a isc-tmr (p. ej. `https://192.168.100.227:4200`). Better Auth la usa para construir el callback. | El prefijo de la redirect URI registrada (`…/api/auth/callback/isc-gate`) y la post-logout redirect URI. |
| `OIDC_ISSUER` | Issuer del gate **incluido el basePath**: `https://192.168.100.227:3000/api/auth`. Se le quita la barra final (`server/lib/env.ts:9-15`). | **Exactamente** el `issuer` de `${OIDC_ISSUER}/.well-known/openid-configuration` (se valida como `iss` en el id_token y en los access tokens). |
| `OIDC_CLIENT_ID` | `client_id` del cliente confidencial. Obligatoria (`server/lib/env.ts:16`). | El cliente del paso 2(c). |
| `OIDC_CLIENT_SECRET` | `client_secret` (mostrado una sola vez). Obligatoria (`server/lib/env.ts:17`). | El mismo cliente. |
| `OIDC_RESOURCE` | Identifier del resource; viaja como `resource` y se exige como `aud`. Se le quita la barra final (`server/lib/env.ts:19-21`). | El `identifier` del resource del paso 2(b), carácter por carácter. |

> `OIDC_ISSUER` y `OIDC_RESOURCE` tienen valores por defecto
> (`http://localhost:3000/api/auth` y `http://localhost:4200/api`). Si faltan,
> la app arranca igual con esos valores en lugar de fallar.
> `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` no los valida `server/lib/env.ts`;
> los lee Better Auth directamente del entorno.

Endpoints que se derivan de `OIDC_ISSUER`: discovery
`${issuer}/.well-known/openid-configuration` (el `/.well-known/openid-configuration`
en la raíz del gate da 404), authorize `${issuer}/oauth2/authorize`, token
`${issuer}/oauth2/token`, userinfo `${issuer}/oauth2/userinfo`, end-session
`${issuer}/oauth2/end-session` y JWKS `${issuer}/jwks` (`/oauth2/jwks` da 404).
El gate firma con **EdDSA (Ed25519)**, no con RS256.

### HTTPS en la LAN

El gate (OAuth 2.1) exige HTTPS fuera de `localhost`. Para abrir la app desde
otra máquina de la LAN:

```bash
NODE_EXTRA_CA_CERTS=~/.local/share/isc-dev-certs/rootCA.pem bun run dev:https
```

- `dev:https` (`package.json:7`) levanta `next dev -p 4200 --experimental-https`
  con `dev-key.pem`, `dev.pem` y `rootCA.pem` de `~/.local/share/isc-dev-certs`.
- **`NODE_EXTRA_CA_CERTS` es obligatorio.** El servidor de isc-tmr hace
  llamadas *server-side* al gate (discovery, token, userinfo, JWKS, refresh).
  Sin la CA de desarrollo en la confianza de Node, esas llamadas fallan por TLS
  (certificado autofirmado). El **gate también debe arrancar con la misma
  variable**. Hay que exportarla al lanzar el proceso: Node la lee al arrancar,
  así que ponerla en `.env.local` no sirve.
- El navegador de cada máquina cliente debe confiar en `rootCA.pem`.
- `next.config.ts:7` declara `allowedDevOrigins: ['192.168.100.227']`, que es
  lo que `next dev` exige para servir a un origen distinto de `localhost`.
  Si cambia la IP, hay que actualizarla.
- `BETTER_AUTH_URL` y `OIDC_ISSUER` deben usar la IP y `https`, que es lo que ve
  el navegador. `OIDC_RESOURCE` puede seguir siendo `http://localhost:4200/api`.

---

## 4. Cómo funciona el login

Toda la configuración está en `server/lib/auth.ts:22-57`:

```ts
genericOAuth({
  config: [{
    providerId: GATE_PROVIDER_ID,                       // "isc-gate" → /api/auth/callback/isc-gate
    discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    accountIssuer: issuer,
    authorizationUrl: `${issuer}/oauth2/authorize`,
    tokenUrl: `${issuer}/oauth2/token`,
    userInfoUrl: `${issuer}/oauth2/userinfo`,
    endSessionEndpoint: `${issuer}/oauth2/end-session`,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET,
    authentication: "basic",
    scopes: ["openid", "profile", "email", "offline_access", "todo:read", "todo:write"],
    authorizationUrlParams: { resource: env.OIDC_RESOURCE },
    refreshTokenParams: { resource: env.OIDC_RESOURCE },
    postLogoutRedirectURI: "/",
  }],
})
```

Por qué cada opción:

- **`providerId: "isc-gate"`** define la ruta de callback
  (`/api/auth/callback/isc-gate`) y el `provider` que usa la UI.
- **`discoveryUrl` y endpoints explícitos.** El discovery se hace **una vez, al
  iniciar** el servidor. En Better Auth 1.7.1 los endpoints explícitos **tienen
  prioridad** sobre los del discovery: este solo rellena los que faltan y aporta
  el `issuer` y el `jwks_uri` para validar el id_token. Si el gate no responde
  al arrancar, `accountIssuer` evita que la inicialización aborte y el login
  sigue funcionando con los endpoints explícitos. En ese caso, sin embargo, el
  id_token no se verifica contra el JWKS hasta reiniciar el servidor.
- **`authentication: "basic"`**: el canje del code se autentica con
  `Authorization: Basic base64(client_id:client_secret)`. El default de Better
  Auth es enviar las credenciales en el body (`client_secret_post`). Si no
  coincide con el `token_endpoint_auth_method` del cliente en el gate, el token
  endpoint responde **`invalid_client`**.
- **`scopes`**: los integrados para obtener perfil e id_token
  (`openid profile email`), `offline_access` para recibir refresh token y los
  propios de la API (`todo:read todo:write`). Todos deben estar en los scopes
  del cliente y en `allowedScopes` del resource.
- **`authorizationUrlParams: { resource }`** (RFC 8707): con `resource`, el
  gate emite el access token como **JWT EdDSA** con
  `aud = [OIDC_RESOURCE, ${issuer}/oauth2/userinfo]`, `iss`, `sub`,
  `azp = client_id`, `scope` y `exp` (por defecto 3600 s). Sin `resource`, el
  token sería opaco y habría que verificarlo por introspección.
- **`refreshTokenParams: { resource }`**: el refresh debe repetir el mismo
  `resource`, si no el nuevo access token perdería el `aud` de la API.
- **`postLogoutRedirectURI: "/"`**: se resuelve a `${BETTER_AUTH_URL}/` y se
  envía como `post_logout_redirect_uri` al end-session del gate cuando Better
  Auth arma el logout iniciado por el RP.
- PKCE está activo por defecto en `genericOAuth` (`pkce` no se configura).

El resto de `server/lib/auth.ts` prepara la verificación de tokens (ver §5):
`resourceClient` (`:61-63`) y `accessTokenVerifyOptions` (`:65-71`).

### Rutas de Better Auth

`server/plugins/auth.ts:21-25` monta `auth.handler` en `/api/auth/*` dentro de
Elysia (`parse: "none"` para que Elysia no consuma el body; oculto en
OpenAPI). Ahí viven `/api/auth/sign-in/social`, `/api/auth/callback/isc-gate`,
`/api/auth/get-session`, `/api/auth/sign-out`, `/api/auth/get-access-token`,
etc. `app/api/[[...slugs]]/route.ts` exporta `app.fetch` para
GET/POST/PUT/PATCH/DELETE/HEAD.

### UI

`lib/auth-client.ts` crea `createAuthClient()` sin `baseURL`, así que usa el
mismo origen (`/api/auth` de isc-tmr). En `app/auth/page.tsx`:

```ts
authClient.signIn.social({ provider: "isc-gate", callbackURL: "/auth" }); // :51-54
authClient.signOut();                                                     // :43
authClient.useSession();                                                  // :11
```

---

## 5. Cómo se protege la API

### El macro `auth`

`server/plugins/auth.ts:37-104` define un macro de Elysia:

- `{ auth: true }`: exige identidad válida, sin scopes concretos.
- `{ auth: ["todo:read"] }`: además exige esos scopes en el access token.

Tiene dos caminos, y los dos terminan validando **el mismo tipo de token** (JWT
del gate con `aud = OIDC_RESOURCE`):

1. **Bearer** (`:47-61`): si la petición trae cabecera `Authorization`, se
   llama a `resourceClient.verifyAccessTokenRequest(request, verifyOptions)`.
   Acepta `Bearer` y también `DPoP`. Si la cabecera está presente, la cookie se
   ignora.
2. **Sesión** (`:63-91`): sin cabecera, se usa la sesión de Better Auth:
   - `auth.api.getSession` → `401` si no hay sesión.
   - `auth.api.getAccessToken({ body: { useAccountCookie: true }, returnHeaders: true })`
     lee el access token del gate desde la account cookie. Si faltan menos de
     5 s para que expire, lo **refresca** con el refresh token (enviando
     `resource`) y reescribe la account cookie.
   - Las `Set-Cookie` resultantes se **reenvían** en la respuesta (`:74-76`),
     si no el navegador se quedaría con los tokens viejos.
   - `resourceClient.verifyBearerToken(response.accessToken, verifyOptions)`.

Opciones de verificación (`server/lib/auth.ts:65-71` y `server/plugins/auth.ts:41-44`):

```ts
{
  jwksUrl: `${issuer}/jwks`,                      // claves públicas del gate (EdDSA)
  verifyOptions: { issuer, audience: env.OIDC_RESOURCE },
  requiredScopes: requiredScopes === true ? undefined : requiredScopes,
}
```

La `audience` es el **identifier del resource**, no la URL de la app ni la del
gate.

### Scopes por ruta

| Método y ruta | Requisito | Archivo |
| --- | --- | --- |
| `GET /api` | público (health check) | `server/index.ts:11-13` |
| `GET /api/me` | `auth: true` (devuelve el `principal`) | `server/index.ts:14-17` |
| `GET /api/todos` | `todo:read` | `server/modules/todo/index.ts:11-15` |
| `GET /api/todos/:id` | `todo:read` | `server/modules/todo/index.ts:16-21` |
| `POST /api/todos` | `todo:write` | `server/modules/todo/index.ts:22-27` |
| `PUT /api/todos/:id` | `todo:write` | `server/modules/todo/index.ts:28-34` |
| `PATCH /api/todos/:id` | `todo:write` | `server/modules/todo/index.ts:35-41` |
| `DELETE /api/todos/:id` | `todo:write` | `server/modules/todo/index.ts:42-47` |

### Errores

En `server/plugins/auth.ts:92-101`, los `APIError` de Better Auth se traducen
así:

- **`403`**: el token es válido pero le faltan scopes. Se propaga la cabecera
  `WWW-Authenticate: Bearer error="insufficient_scope" …`.
- **`401`**: cualquier otro caso: sin sesión, token ausente, inválido o
  expirado, `iss`/`aud` incorrectos, o fallo al obtener o refrescar el token
  (`FAILED_TO_GET_ACCESS_TOKEN`). Si hay challenge `WWW-Authenticate`, también
  se reenvía.
- El cuerpo es `{ "message": "…" }`.
- Los errores que no son `APIError` (p. ej. un fallo de red o TLS al bajar el
  JWKS) se relanzan y terminan en **500**.

### `principal`

Las rutas protegidas reciben en el contexto:

```ts
type Principal = {
  via: "session" | "bearer";
  sub: string;                       // id del usuario en el gate
  scopes: string[];                  // claim `scope` separado por espacios
  claims: Record<string, unknown>;   // payload completo del JWT (iss, aud, azp, exp…)
};
// camino de sesión: además `user` (session.user de Better Auth)
```

### Llamar a la API con un bearer token

Con la sesión iniciada en `/auth`, el access token del gate se obtiene desde la
consola del navegador (mismo origen) con el endpoint estándar de Better Auth:

```js
const { accessToken } = await fetch("/api/auth/get-access-token", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ useAccountCookie: true }),
}).then((r) => r.json());
```

Luego, desde cualquier cliente:

```bash
TOKEN=eyJ...   # accessToken
curl --cacert ~/.local/share/isc-dev-certs/rootCA.pem \
  -H "Authorization: Bearer $TOKEN" https://192.168.100.227:4200/api/me

curl --cacert ~/.local/share/isc-dev-certs/rootCA.pem \
  -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"title":"desde curl"}' https://192.168.100.227:4200/api/todos
```

Un cliente externo real (otra app o un servicio) obtiene su propio token
pidiendo autorización al gate con `resource=OIDC_RESOURCE`. Para que la API lo
acepte debe tener `aud` = este resource y los scopes necesarios.

Para verificar estos tokens con otro stack (sin Better Auth), basta con
`jose`:

```ts
const jwks = createRemoteJWKSet(new URL(`${issuer}/jwks`));
const { payload } = await jwtVerify(token, jwks, {
  issuer, audience: OIDC_RESOURCE, algorithms: ["EdDSA"],
});
// y comprobar payload.scope (separado por espacios)
```

### OpenAPI

`server/plugins/openapi.ts` expone la UI en **`/api/openapi`** y el spec en
**`/api/openapi/json`**. Las rutas con `auth` declaran el esquema de seguridad
`bearerAuth` (JWT). Las rutas `/api/auth/*` están ocultas.

---

## 6. Página de pruebas `/auth`

`app/auth/page.tsx`:

| Elemento | Qué hace |
| --- | --- |
| Sección "Sesión" | `authClient.useSession()` muestra el `session.user` en JSON, o "Sin sesión". |
| **Iniciar sesión con ISC** | `authClient.signIn.social({ provider: "isc-gate", callbackURL: "/auth" })`: inicia el flujo OIDC y vuelve a `/auth`. |
| **Cerrar sesión** | `authClient.signOut()`: borra las cookies de sesión de isc-tmr. Better Auth puede devolver además la URL de end-session del gate (con `post_logout_redirect_uri`); el cierre de la sesión **en el gate** no está verificado en esta app. |
| **GET /api/me** | Llama `fetch("/api/me")` con la cookie y muestra el `principal` (`via: "session"`, `sub`, `scopes`, `claims`). |
| **GET /api/todos** | Lista tareas (requiere `todo:read`). |
| **POST /api/todos** | Crea una tarea `Tarea <hora>` (requiere `todo:write`). |

Debajo se muestra `método ruta → status` y el cuerpo de la respuesta.

---

## 7. Solución de problemas

| Síntoma | Causa | Solución |
| --- | --- | --- |
| Vuelve a la app con `?error=unable_to_get_user_info` | `allowedScopes` del resource no incluye `openid`. Por la intersección, el token se queda sin `openid` y `/oauth2/userinfo` responde 400 `invalid_scope`. | Añadir `openid profile email offline_access` a `allowedScopes` del resource (botón del dashboard). |
| `invalid_target` en authorize o token | El resource no existe, está deshabilitado, su `identifier` ≠ `OIDC_RESOURCE`, o el cliente no está vinculado (`enforcePerClientResources`). | Revisar el resource y activarlo en la tarjeta "Resources (RFC 8707)" del cliente. |
| `invalid_client` en el callback (canje del code) | `token_endpoint_auth_method` ≠ `client_secret_basic` (la app usa `authentication: "basic"`), o el secret es incorrecto. | Alinear el método o regenerar y copiar el secret. |
| `invalid_scope` en authorize | Se pide un scope que no está en los scopes del cliente, o la intersección con `allowedScopes` del resource queda vacía. | Añadir el scope al cliente o al resource. |
| "cannot request scope todo:read" al crear el cliente | El scope no está en `BETTER_AUTH_OAUTH_SCOPES` del gate. | Añadirlo y reiniciar el gate. |
| `fetch failed` / `self-signed certificate` / `UNABLE_TO_VERIFY_LEAF_SIGNATURE` en el servidor; 500 en `/api/*` al verificar | Node no confía en la CA de desarrollo (discovery, token, userinfo o JWKS). | Arrancar **isc-tmr y el gate** con `NODE_EXTRA_CA_CERTS=~/.local/share/isc-dev-certs/rootCA.pem`. |
| `Discovery fetch failed for "isc-gate"` al arrancar | El gate no estaba disponible o hubo un error TLS al iniciar. | El login sigue funcionando con los endpoints explícitos; reiniciar la app con el gate arriba para recuperar la validación del id_token. |
| `redirect_uri` rechazada | La redirect URI registrada no coincide con `${BETTER_AUTH_URL}/api/auth/callback/isc-gate` (http/https, IP/localhost, puerto). | Registrar la URI exacta. |
| `401` con `iss`/`aud` inválidos en `/api/*` | `OIDC_ISSUER` no coincide exactamente con el `issuer` del discovery (barra final, IP, `/api/auth`), o `OIDC_RESOURCE` ≠ identifier. | Copiar el `issuer` del discovery y el identifier tal cual. |
| Al iniciar sesión en una app se cierra la otra, o hay sesiones que "saltan" | Cookies con el mismo prefijo en el mismo host (no se aíslan por puerto). | Mantener `cookiePrefix: "isc-tmr"` (o uno único por app). |
| En el gate, el login vuelve a `/dashboard/login` en localhost | `BETTER_AUTH_SERVER_DOMAIN` del gate apunta a un dominio ajeno (cookies cross-subdomain). | Dejarla vacía en local. |
| `next dev` bloquea recursos al entrar por la IP | Falta la IP en `allowedDevOrigins`. | Añadirla en `next.config.ts`. |

---

## 8. Pendiente y próximos pasos

- **Roles y permisos del gate aún no llegan a los tokens.** El gate modela roles
  globales (admin/moderator/user) y roles de organización (incluidos roles
  personalizados), pero hoy no emite ninguno en el access token ni en el
  id_token. La forma de emitirlos está **en diseño**: no hay nombres de claims
  definidos todavía.
  - **Dónde se conectaría en isc-tmr**: en el macro `auth`
    (`server/plugins/auth.ts`), justo después de `verifyAccessTokenRequest` /
    `verifyBearerToken`, leyendo los nuevos claims desde `principal.claims`.
    Por ejemplo, ampliando el macro para aceptar roles o permisos además de
    scopes y respondiendo 403 si no se cumplen.
- **El almacén de tareas está en memoria y es compartido**
  (`server/modules/todo/service.ts:5-6`). Se pierde con cada reinicio o recarga
  del servidor y **no está separado por usuario**: todos los usuarios ven y
  editan las mismas tareas. Para hacerlo por usuario habría que filtrar por
  `principal.sub`.
- **Sin CORS**: `OPTIONS` lo responde Next (`app/api/[[...slugs]]/route.ts:10`).
  Si la API se va a consumir desde otro origen en el navegador, hay que añadir
  CORS.
