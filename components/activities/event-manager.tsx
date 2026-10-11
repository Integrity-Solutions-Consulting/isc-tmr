"use client"

import { useCallback, useMemo, useState } from "react"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiLayoutColumnLine,
  RiListUnordered,
  RiTimeLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { DayView, ListView, MonthView, WeekView } from "./calendar-views"
import { EventEditor } from "./event-editor"
import {
  ActiveFilters,
  EventSearch,
  FilterMenus,
} from "./event-filters"
import {
  LOCALE,
  addDays,
  capitalize,
  defaultColors,
  emptyFilters,
  filterEvents,
  newDraft,
  weekDays,
  type CalendarView,
  type Event,
  type EventColor,
  type EventDraft,
  type EventFilters,
} from "./lib"

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Event) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: EventColor[]
  defaultView?: CalendarView
  availableTags?: string[]
  className?: string
}

const views: { value: CalendarView; label: string; icon: typeof RiCalendarLine }[] = [
  { value: "month", label: "Mes", icon: RiCalendarLine },
  { value: "week", label: "Semana", icon: RiLayoutColumnLine },
  { value: "day", label: "Día", icon: RiTimeLine },
  { value: "list", label: "Lista", icon: RiListUnordered },
]

function periodLabel(view: CalendarView, date: Date) {
  if (view === "month") {
    return capitalize(date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }))
  }
  if (view === "week") {
    const days = weekDays(date)
    const first = days[0]
    const last = days[6]
    const sameMonth = first.getMonth() === last.getMonth()
    const start = first.toLocaleDateString(LOCALE, {
      day: "numeric",
      month: sameMonth ? undefined : "short",
    })
    const end = last.toLocaleDateString(LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${start} – ${end}`
  }
  if (view === "day") {
    return capitalize(date.toLocaleDateString(LOCALE, { dateStyle: "full" }))
  }
  return "Todas las actividades"
}

function shiftDate(view: CalendarView, date: Date, direction: 1 | -1) {
  if (view === "month") {
    return new Date(date.getFullYear(), date.getMonth() + direction, 1)
  }
  return addDays(date, (view === "week" ? 7 : 1) * direction)
}

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Reunión", "Tarea", "Recordatorio", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  availableTags = ["Importante", "Urgente", "Trabajo", "Personal", "Equipo", "Cliente"],
  className,
}: EventManagerProps) {
  const [events, setEvents] = useState(initialEvents)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [view, setView] = useState<CalendarView>(defaultView)
  const [filters, setFilters] = useState<EventFilters>(emptyFilters)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [draft, setDraft] = useState<EventDraft>(() =>
    newDraft(new Date(), colors[0].value, categories[0]),
  )

  const filteredEvents = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  )

  const getColor = useCallback(
    (value: string) => colors.find((c) => c.value === value) ?? colors[0],
    [colors],
  )

  const openCreate = useCallback(
    (day: Date = currentDate, hour?: number) => {
      setDraft(newDraft(day, colors[0].value, categories[0], hour))
      setEditorOpen(true)
    },
    [currentDate, colors, categories],
  )

  const openEdit = useCallback((event: Event) => {
    setDraft(event)
    setEditorOpen(true)
  }, [])

  const saveDraft = (next: EventDraft) => {
    if (next.id) {
      const updated = next as Event
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      onEventUpdate?.(updated.id, updated)
    } else {
      const created: Event = { ...next, id: crypto.randomUUID() }
      setEvents((prev) => [...prev, created])
      onEventCreate?.(created)
    }
    setEditorOpen(false)
  }

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    onEventDelete?.(id)
    setEditorOpen(false)
  }

  const moveEvent = (day: Date, hour?: number) => {
    if (!draggedEvent) return
    const duration =
      draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
    const start = new Date(day)
    if (hour !== undefined) start.setHours(hour, 0, 0, 0)
    else
      start.setHours(
        draggedEvent.startTime.getHours(),
        draggedEvent.startTime.getMinutes(),
        0,
        0,
      )
    const moved = {
      ...draggedEvent,
      startTime: start,
      endTime: new Date(start.getTime() + duration),
    }
    setEvents((prev) => prev.map((e) => (e.id === moved.id ? moved : e)))
    onEventUpdate?.(moved.id, moved)
    setDraggedEvent(null)
  }

  const viewProps = {
    currentDate,
    events: filteredEvents,
    getColor,
    onEventClick: openEdit,
    onCreate: openCreate,
    onDragStart: setDraggedEvent,
    onDragEnd: () => setDraggedEvent(null),
    onDrop: moveEvent,
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view !== "list" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoy
              </Button>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Anterior"
                  onClick={() => setCurrentDate((d) => shiftDate(view, d, -1))}
                >
                  <RiArrowLeftSLine />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Siguiente"
                  onClick={() => setCurrentDate((d) => shiftDate(view, d, 1))}
                >
                  <RiArrowRightSLine />
                </Button>
              </div>
            </>
          )}
          <h2 className="text-lg font-semibold tracking-tight">
            {periodLabel(view, currentDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[view]}
            onValueChange={(value) => {
              const next = value[0] as CalendarView | undefined
              if (next) setView(next)
            }}
          >
            {views.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem key={value} value={value} aria-label={label}>
                <Icon data-icon="inline-start" />
                <span className="hidden lg:inline">{label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button size="sm" onClick={() => openCreate()}>
            <RiAddLine data-icon="inline-start" />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <EventSearch
            className="w-full max-w-sm"
            value={filters.query}
            onChange={(query) => setFilters((f) => ({ ...f, query }))}
          />
          <FilterMenus
            filters={filters}
            onFiltersChange={setFilters}
            colors={colors}
            tags={availableTags}
            categories={categories}
          />
        </div>
        <ActiveFilters
          filters={filters}
          onFiltersChange={setFilters}
          colors={colors}
        />
      </div>

      {view === "month" && (
        <MonthView
          {...viewProps}
          onShowDay={(day) => {
            setCurrentDate(day)
            setView("day")
          }}
        />
      )}
      {view === "week" && <WeekView {...viewProps} />}
      {view === "day" && <DayView {...viewProps} />}
      {view === "list" && <ListView {...viewProps} />}

      <EventEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        draft={draft}
        isMobile={false}
        categories={categories}
        colors={colors}
        availableTags={availableTags}
        onSave={saveDraft}
        onDelete={deleteEvent}
      />
    </div>
  )
}
