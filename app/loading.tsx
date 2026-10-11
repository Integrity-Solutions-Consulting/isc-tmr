import { Spinner } from "@/components/ui/spinner";

/**
 * Loading de pantalla completa (neutral).
 * No expone la estructura del dashboard (KPIs, tablas, charts) durante la carga.
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <Spinner className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Cargando panel...</p>
    </div>
  );
}
