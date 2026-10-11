import type { Metadata } from "next"

import { ActivitiesCalendar } from "@/components/activities/activities-calendar"

export const metadata: Metadata = {
  title: "Actividades",
}

export default function ActivitiesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="hidden flex-col gap-1 md:flex">
        <h1 className="text-2xl font-semibold tracking-tight">Actividades</h1>
        <p className="text-sm text-muted-foreground">
          Planifica y organiza las reuniones, tareas y recordatorios del equipo.
        </p>
      </div>
      <ActivitiesCalendar />
    </div>
  )
}
