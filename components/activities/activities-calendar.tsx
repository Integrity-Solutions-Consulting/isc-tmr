"use client"

import { useMemo, useSyncExternalStore } from "react"

import { Skeleton } from "@/components/ui/skeleton"

import { createDemoEvents } from "./demo-events"
import { EventManager } from "./event-manager"

const subscribe = () => () => {}

// El calendario depende de la fecha y zona horaria del navegador: se renderiza
// solo en el cliente para evitar diferencias de hidratación con el servidor
export function ActivitiesCalendar() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const events = useMemo(() => (mounted ? createDemoEvents(new Date()) : []), [mounted])

  if (!mounted) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <EventManager
      events={events}
      onEventCreate={(event) => console.log("Creado:", event)}
      onEventUpdate={(id, event) => console.log("Actualizado:", id, event)}
      onEventDelete={(id) => console.log("Eliminado:", id)}
    />
  )
}
