"use client"

import { useRef, useState } from "react"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { NoEvents, groupByDay } from "./calendar-views"
import { ActiveFilters, EventSearch, FilterChips } from "./event-filters"
import {
  LOCALE,
  addDays,
  capitalize,
  emptyFilters,
  eventsOnDay,
  formatDuration,
  formatTime,
  isSameDay,
  weekDays,
  type Event,
  type EventColor,
  type EventFilters,
} from "./lib"

type AgendaMode = "day" | "upcoming"

interface MobileAgendaProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  events: Event[]
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  colors: EventColor[]
  categories: string[]
  availableTags: string[]
  getColor: (value: string) => EventColor
  onEventClick: (event: Event) => void
  onCreate: (day: Date) => void
}

const SWIPE_THRESHOLD = 50

export function MobileAgenda({
  selectedDate,
  onSelectDate,
  events,
  filters,
  onFiltersChange,
  colors,
  categories,
  availableTags,
  getColor,
  onEventClick,
  onCreate,
}: MobileAgendaProps) {
  const [mode, setMode] = useState<AgendaMode>("day")
  const today = new Date()
  const filterCount =
    filters.colors.length + filters.tags.length + filters.categories.length

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {capitalize(
            selectedDate.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }),
          )}
        </h2>
        <div className="flex items-center gap-2">
          {!isSameDay(selectedDate, today) && (
            <Button variant="outline" size="sm" onClick={() => onSelectDate(today)}>
              Hoy
            </Button>
          )}
          <Drawer>
            <DrawerTrigger
              render={
                <Button
                  variant={filterCount > 0 || filters.query ? "secondary" : "outline"}
                  size="sm"
                />
              }
            >
              <RiFilter3Line data-icon="inline-start" />
              Filtros
              {filterCount > 0 && <Badge>{filterCount}</Badge>}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Buscar y filtrar</DrawerTitle>
                <DrawerDescription>
                  {events.length} actividad{events.length === 1 ? "" : "es"} coinciden
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-6 overflow-y-auto px-4">
                <EventSearch
                  value={filters.query}
                  onChange={(query) => onFiltersChange({ ...filters, query })}
                />
                <FilterChips
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  colors={colors}
                  tags={availableTags}
                  categories={categories}
                />
              </div>
              <DrawerFooter className="flex-row">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onFiltersChange(emptyFilters)}
                >
                  Limpiar
                </Button>
                <DrawerClose render={<Button className="flex-1" />}>
                  Ver resultados
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          onSelectDate(date)
          setMode("day")
        }}
        events={events}
      />

      <ToggleGroup
        variant="outline"
        spacing={0}
        className="w-full"
        value={[mode]}
        onValueChange={(value) => {
          const next = value[0] as AgendaMode | undefined
          if (next) setMode(next)
        }}
      >
        <ToggleGroupItem value="day" className="flex-1">
          Día
        </ToggleGroupItem>
        <ToggleGroupItem value="upcoming" className="flex-1">
          Próximas
        </ToggleGroupItem>
      </ToggleGroup>

      {filters.query && (
        <p className="text-sm text-muted-foreground">
          Resultados para «{filters.query}»
        </p>
      )}
      <ActiveFilters filters={filters} onFiltersChange={onFiltersChange} colors={colors} />

      {mode === "day" ? (
        <DayAgenda
          day={selectedDate}
          events={eventsOnDay(events, selectedDate)}
          getColor={getColor}
          onEventClick={onEventClick}
          onCreate={onCreate}
        />
      ) : (
        <UpcomingAgenda
          events={events}
          getColor={getColor}
          onEventClick={onEventClick}
        />
      )}

      <Button
        size="icon-lg"
        aria-label="Nuevo evento"
        className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 size-14 shadow-lg"
        onClick={() => onCreate(selectedDate)}
      >
        <RiAddLine className="size-6" />
      </Button>
    </div>
  )
}

// Tira semanal: toca un día para verlo, desliza para cambiar de semana
function WeekStrip({
  selectedDate,
  onSelectDate,
  events,
}: {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  events: Event[]
}) {
  const touchStartX = useRef<number | null>(null)
  const days = weekDays(selectedDate)
  const today = new Date()

  const shiftWeek = (direction: 1 | -1) =>
    onSelectDate(addDays(selectedDate, 7 * direction))

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Semana anterior"
        onClick={() => shiftWeek(-1)}
      >
        <RiArrowLeftSLine />
      </Button>
      <div
        className="grid flex-1 touch-pan-y grid-cols-7 gap-1"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const delta = e.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(delta) > SWIPE_THRESHOLD) shiftWeek(delta < 0 ? 1 : -1)
        }}
      >
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)
          const count = eventsOnDay(events, day).length
          return (
            <button
              key={day.toISOString()}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${day.toLocaleDateString(LOCALE, { dateStyle: "full" })}, ${count} actividades`}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                !isSelected && isToday && "text-primary",
              )}
            >
              <span className={cn(!isSelected && "text-muted-foreground", !isSelected && isToday && "text-primary")}>
                {day.toLocaleDateString(LOCALE, { weekday: "narrow" }).toUpperCase()}
              </span>
              <span className="text-base font-semibold tabular-nums">
                {day.getDate()}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  count === 0 && "invisible",
                  isSelected ? "bg-primary-foreground" : "bg-primary",
                )}
              />
            </button>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Semana siguiente"
        onClick={() => shiftWeek(1)}
      >
        <RiArrowRightSLine />
      </Button>
    </div>
  )
}

function AgendaRow({
  event,
  color,
  onClick,
}: {
  event: Event
  color: EventColor
  onClick: (event: Event) => void
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-12 shrink-0 flex-col items-end pt-3 text-xs tabular-nums">
        <span className="font-medium">{formatTime(event.startTime)}</span>
        <span className="text-muted-foreground">{formatTime(event.endTime)}</span>
      </div>
      <button
        type="button"
        onClick={() => onClick(event)}
        className="flex min-w-0 flex-1 items-stretch gap-3 rounded-2xl border bg-card p-3 text-left transition-colors outline-none active:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className={cn("w-1 shrink-0 rounded-full", color.bg)} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-medium">{event.title}</span>
          {event.description && (
            <span className="line-clamp-1 text-sm text-muted-foreground">
              {event.description}
            </span>
          )}
          <span className="flex flex-wrap items-center gap-1 pt-0.5">
            {event.category && <Badge variant="secondary">{event.category}</Badge>}
            <Badge variant="outline">{formatDuration(event)}</Badge>
          </span>
        </span>
      </button>
    </div>
  )
}

function DayAgenda({
  day,
  events,
  getColor,
  onEventClick,
  onCreate,
}: {
  day: Date
  events: Event[]
  getColor: (value: string) => EventColor
  onEventClick: (event: Event) => void
  onCreate: (day: Date) => void
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        {capitalize(day.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" }))}
      </h3>
      {events.length === 0 ? (
        <NoEvents
          title="Día libre"
          description="No hay actividades para este día."
        >
          <Button variant="outline" size="sm" onClick={() => onCreate(day)}>
            <RiAddLine data-icon="inline-start" />
            Crear actividad
          </Button>
        </NoEvents>
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <AgendaRow
              key={event.id}
              event={event}
              color={getColor(event.color)}
              onClick={onEventClick}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function UpcomingAgenda({
  events,
  getColor,
  onEventClick,
}: {
  events: Event[]
  getColor: (value: string) => EventColor
  onEventClick: (event: Event) => void
}) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const groups = groupByDay(events.filter((e) => e.endTime >= startOfToday))

  if (groups.length === 0) {
    return (
      <NoEvents
        title="Nada pendiente"
        description="No hay actividades próximas con los filtros actuales."
      />
    )
  }

  const today = new Date()
  const tomorrow = addDays(today, 1)

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ day, events: dayEvents }) => (
        <section key={day.toDateString()} className="flex flex-col gap-2">
          <h3 className="sticky top-14 z-10 -mx-4 bg-background/90 px-4 py-1 text-sm font-medium text-muted-foreground backdrop-blur">
            {isSameDay(day, today)
              ? "Hoy"
              : isSameDay(day, tomorrow)
                ? "Mañana"
                : capitalize(day.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" }))}
          </h3>
          {dayEvents.map((event) => (
            <AgendaRow
              key={event.id}
              event={event}
              color={getColor(event.color)}
              onClick={onEventClick}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
