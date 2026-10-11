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
import { GalleryVerticalEnd } from "lucide-react";
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
import { toast } from "@/components/ui/toast";

export default function LoginPage() {
  const { trigger, isMutating } = useSignIn();

  const handleSignIn = async () => {
    const signInTrigger = trigger({
      provider: "isc-gate",
      callbackURL: "/auth",
    });
    
    await toast.promise(signInTrigger, {
      loading: "Conectando con el portal de autenticación...",
      success: "¡Autenticación exitosa! Redirigiendo...",
      error: "No se pudo iniciar sesión. Por favor, intenta de nuevo.",
    });
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
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">TMR</span>
            </Link>
            <h1 className="text-xl font-bold">Bienvenido a TMR</h1>
            <FieldDescription>
              Control de Tiempos y Actividades
            </FieldDescription>
          </div>
          <Field className="hidden">
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="correo@empresa.com"
              required
            />
          </Field>
          <Field>
            <Button type="button" disabled={isMutating} onClick={handleSignIn}>
              {isMutating ? <Spinner /> : "Ingresar con ISC"}
            </Button>
          </Field>
          <FieldSeparator>O</FieldSeparator>
          <Field className="hidden! grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                  fill="currentColor"
                />
              </svg>
              Continuar con Apple
            </Button>
            <Button variant="outline" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continuar con Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Al hacer clic en <b>Ingresar</b>, usted está aceptando los&nbsp;
        <Link href="#">Términos del Servicio</Link> y la&nbsp;
        <Link href="#">Política de Privacidad</Link>.
      </FieldDescription>
    </div>
  );
}