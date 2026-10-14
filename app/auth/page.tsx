"use client";

// import { useState } from "react";

// type Result = { label: string; status: number; body: unknown };

// // Página de prueba del flujo OIDC contra el ISC Auth Gate
// export default function AuthTestPage() {
//   const { data: session, isPending } = authClient.useSession();
//   const [result, setResult] = useState<Result | null>(null);

//   const call = async (label: string, path: string, init?: RequestInit) => {
//     const response = await fetch(path, init);
//     const text = await response.text();
//     let body: unknown = text;
//     try {
//       body = JSON.parse(text);
//     } catch {}
//     setResult({ label, status: response.status, body });
//   };

//   return (
//     <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 font-sans">
//       <h1 className="text-2xl font-semibold">Prueba de autenticación</h1>

//       <section className="flex flex-col gap-2">
//         <h2 className="font-medium">Sesión</h2>
//         {isPending ? (
//           <p>Cargando…</p>
//         ) : session ? (
//           <pre className="overflow-auto rounded bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
//             {JSON.stringify(session.user, null, 2)}
//           </pre>
//         ) : (
//           <p>Sin sesión</p>
//         )}
//         <div className="flex flex-wrap gap-2">
//           {session ? (
//             <button
//               className="rounded bg-zinc-800 px-4 py-2 text-white"
//               onClick={() => authClient.signOut()}
//             >
//               Cerrar sesión
//             </button>
//           ) : (
//             <button
//               className="rounded bg-blue-600 px-4 py-2 text-white"
//               onClick={() =>
//                 authClient.signIn.social({
//                   provider: "isc-gate",
//                   callbackURL: "/auth",
//                 })
//               }
//             >
//               Iniciar sesión con ISC
//             </button>
//           )}
//         </div>
//       </section>

//       <section className="flex flex-col gap-2">
//         <h2 className="font-medium">API</h2>
//         <div className="flex flex-wrap gap-2">
//           <button
//             className="rounded border px-4 py-2"
//             onClick={() => call("GET /api/me", "/api/me")}
//           >
//             GET /api/me
//           </button>
//           <button
//             className="rounded border px-4 py-2"
//             onClick={() => call("GET /api/todos", "/api/todos")}
//           >
//             GET /api/todos
//           </button>
//           <button
//             className="rounded border px-4 py-2"
//             onClick={() =>
//               call("POST /api/todos", "/api/todos", {
//                 method: "POST",
//                 headers: { "content-type": "application/json" },
//                 body: JSON.stringify({
//                   title: `Tarea ${new Date().toLocaleTimeString()}`,
//                 }),
//               })
//             }
//           >
//             POST /api/todos
//           </button>
//         </div>
//         {result && (
//           <pre className="overflow-auto rounded bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
//             {`${result.label} → ${result.status}\n\n${JSON.stringify(result.body, null, 2)}`}
//           </pre>
//         )}
//       </section>
//     </main>
//   );
// }

import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSignIn } from "@/hooks/use-sing-in";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { CircleAlertIcon } from "lucide-react";

/** Solo rutas internas: evita open redirects con `callbackURL=//evil.com`. */
function safeCallback(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

type LoginError = { title: string; description: string };

export default function LoginPage() {
  const t = useTranslations("auth");
  const { trigger, isMutating } = useSignIn();
  const [error, setError] = useState<LoginError | null>(null);

  // Errores que genera el Better Auth de esta app (state, callback OAuth) llegan
  // como `?error=<código>` SIN descripción: su texto vive en messages/*.json
  // (auth.errors.codes). Los del gate (access_denied, invalid_scope…) traen
  // `error_description` ya traducido por el gate según Accept-Language.
  const toLoginError = (
    code: string,
    description: string | null,
  ): LoginError => {
    const key = `errors.codes.${code}` as Parameters<typeof t>[0];
    return {
      title: t("errors.title"),
      description: t.has(key)
        ? t(key)
        : (description ?? t("errors.unknown", { code })),
    };
  };

  // Si el gate rechaza el login, Better Auth vuelve a /auth?error=<código>.
  // Se quita de la URL para que no reaparezca al recargar.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("error");
    if (!code) return;
    setError(toLoginError(code, url.searchParams.get("error_description")));
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState(null, "", url);
  }, []);

  const handleSignIn = async () => {
    setError(null);
    const params = new URLSearchParams(window.location.search);
    try {
      await trigger({
        provider: "isc-gate",
        // A la ruta que se intentaba abrir (la pone el proxy) o al dashboard
        callbackURL: safeCallback(params.get("callbackURL")),
        errorCallbackURL: "/auth",
      });
    } catch {
      setError({
        title: t("errors.title"),
        description: t("errors.connection"),
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <Image
                src="/icons/logo.png"
                alt=""
                width={48}
                height={48}
                priority
              />
              <span className="sr-only">TMR</span>
            </Link>
            <h1 className="text-xl font-bold">{t("welcome")}</h1>
            <FieldDescription>{t("tagline")}</FieldDescription>
          </div>

          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>{error.title}</AlertTitle>
              <AlertDescription>{error.description}</AlertDescription>
            </Alert>
          )}
          <Field className="hidden">
            <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
            />
          </Field>
          <Field>
            <Button type="button" disabled={isMutating} onClick={handleSignIn}>
              {isMutating ? <Spinner /> : t("signIn")}
            </Button>
          </Field>
          <FieldSeparator className="hidden">{t("or")}</FieldSeparator>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        {t.rich("terms", {
          b: (chunks) => <b>{chunks}</b>,
          terms: (chunks) => <Link href="#">{chunks}</Link>,
          privacy: (chunks) => <Link href="#">{chunks}</Link>,
        })}
      </FieldDescription>
    </div>
  );
}
