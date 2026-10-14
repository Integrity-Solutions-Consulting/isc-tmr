"use client"

import { Fragment, useEffect, useRef } from "react"
import { RiAddLine, RiCalendarEventLine, RiTimeLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  LOCALE,
  addDays,
  capitalize,
  eventsOnDay,
  formatDuration,
  formatTime,
  isSameDay,
  startOfWeek,
  weekDays,
  type Event,
  type EventColor,
} from "./lib"

export interface ViewProps {
  currentDate: Date
  events: Event[]
  getColor: (value: string) => EventColor
  onEventClick: (event: Event) => void
  onCreate: (day: Date, hour?: number) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (day: Date, hour?: number) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const FIRST_VISIBLE_HOUR = 7
const HOUR_ROW = "h-16"

function hourLabel(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`
}

function dropTarget(onDrop: () => void) {
  return {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      onDrop()
    },
  }
}

// Bloque de evento: arrastrable, abre el editor al hacer clic y muestra el detalle al pasar el cursor
function EventChip({
  event,
  color,
  onClick,
  onDragStart,
  onDragEnd,
  detailed = false,
}: {
  event: Event
  color: EventColor
  onClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  detailed?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            draggable
            onDragStart={() => onDragStart(event)}
            onDragEnd={onDragEnd}
            onClick={(e) => {
              e.stopPropagation()
              onClick(event)
            }}
            className={cn(
              "flex w-full min-w-0 flex-col rounded-md px-1.5 py-0.5 text-left text-xs font-medium text-white transition-[filter,box-shadow] outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/50",
              color.bg,
              detailed && "gap-0.5 rounded-lg p-2",
            )}
          />
        }
      >
        <span className="truncate">
          {!detailed && (
            <span className="mr-1 opacity-80 tabular-nums">
              {formatTime(event.startTime)}
            </span>
          )}
          {event.title}
        </span>
        {detailed && (
          <span className="truncate font-normal opacity-90 tabular-nums">
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        <div className="flex flex-col gap-1 py-0.5">
          <span className="font-semibold">{event.title}</span>
          <span className="tabular-nums opacity-80">
            {formatTime(event.startTime)} – {formatTime(event.endTime)} ·{" "}
            {formatDuration(event)}
          </span>
          {event.description && (
            <span className="line-clamp-3 opacity-80">{event.description}</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function MonthView({
  currentDate,
  events,
  getColor,
  onEventClick,
  onCreate,
  onDragStart,
  onDragEnd,
  onDrop,
  onShowDay,
}: ViewProps & { onShowDay: (day: Date) => void }) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth)
  const lastOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  // Solo las semanas que el mes necesita (4-6): sin filas enteras del mes siguiente
  const weeks = Math.ceil(
    (Math.round((lastOfMonth.getTime() - gridStart.getTime()) / 86_400_000) + 1) / 7,
  )
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i))
  const today = new Date()

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {weekDays(gridStart).map((day) => (
          <div
            key={day.getDay()}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {capitalize(day.toLocaleDateString(LOCALE, { weekday: "short" }))}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day)
          const inMonth = day.getMonth() === currentDate.getMonth()
          const isToday = isSameDay(day, today)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group/day flex min-h-28 flex-col gap-1 border-r border-b p-1.5 transition-colors nth-[7n]:border-r-0 nth-last-[-n+7]:border-b-0 hover:bg-muted/40",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
              {...dropTarget(() => onDrop(day))}
            >
              <div className="flex items-center justify-between">
                <Button
                  variant={isToday ? "default" : "ghost"}
                  size="icon-xs"
                  className="rounded-full tabular-nums"
                  aria-label={day.toLocaleDateString(LOCALE, { dateStyle: "full" })}
                  onClick={() => onShowDay(day)}
                >
                  {day.getDate()}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 group-hover/day:opacity-100 focus-visible:opacity-100"
                  aria-label="Crear evento este día"
                  onClick={() => onCreate(day)}
                >
                  <RiAddLine />
                </Button>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    color={getColor(event.color)}
                    onClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="justify-start text-muted-foreground"
                    onClick={() => onShowDay(day)}
                  >
                    +{dayEvents.length - 3} más
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Desplaza la grilla horaria hasta el inicio de la jornada al montar
function useScrollToMorning() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = ref.current?.querySelector<HTMLElement>(
      `[data-hour="${FIRST_VISIBLE_HOUR}"]`,
    )
    if (ref.current && row) ref.current.scrollTop = row.offsetTop - 48
  }, [])
  return ref
}

export function WeekView({
  currentDate,
  events,
  getColor,
  onEventClick,
  onCreate,
  onDragStart,
  onDragEnd,
  onDrop,
}: ViewProps) {
  const days = weekDays(currentDate)
  const today = new Date()
  const scrollRef = useScrollToMorning()

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0">
      <div ref={scrollRef} className="max-h-[calc(100dvh-16rem)] overflow-auto">
        <div className="grid min-w-3xl grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          <div className="sticky top-0 z-10 border-b bg-card" />
          {days.map((day) => {
            const isToday = isSameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className="sticky top-0 z-10 flex flex-col items-center gap-0.5 border-b border-l bg-card py-2"
              >
                <span className="text-xs text-muted-foreground">
                  {capitalize(day.toLocaleDateString(LOCALE, { weekday: "short" }))}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            )
          })}

          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div
                data-hour={hour}
                className={cn(
                  "border-b pr-2 pt-1 text-right text-xs text-muted-foreground tabular-nums",
                  HOUR_ROW,
                )}
              >
                {hourLabel(hour)}
              </div>
              {days.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className={cn(
                    "flex min-w-0 cursor-pointer flex-col gap-0.5 border-b border-l p-0.5 transition-colors hover:bg-muted/40",
                    HOUR_ROW,
                  )}
                  onClick={() => onCreate(day, hour)}
                  {...dropTarget(() => onDrop(day, hour))}
                >
                  {eventsOnDay(events, day)
                    .filter((event) => event.startTime.getHours() === hour)
                    .map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        color={getColor(event.color)}
                        onClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ))}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function DayView({
  currentDate,
  events,
  getColor,
  onEventClick,
  onCreate,
  onDragStart,
  onDragEnd,
  onDrop,
}: ViewProps) {
  const dayEvents = eventsOnDay(events, currentDate)
  const scrollRef = useScrollToMorning()

  return (
    <Card className="gap-0 overflow-hidden rounded-xl p-0">
      <div ref={scrollRef} className="max-h-[calc(100dvh-16rem)] overflow-auto">
        {HOURS.map((hour) => (
          <div
            key={hour}
            data-hour={hour}
            className="flex border-b last:border-b-0"
            {...dropTarget(() => onDrop(currentDate, hour))}
          >
            <div className="w-16 shrink-0 pr-2 pt-1 text-right text-xs text-muted-foreground tabular-nums">
              {hourLabel(hour)}
            </div>
            <div
              className="flex min-h-16 min-w-0 flex-1 cursor-pointer flex-col gap-1 border-l p-1 transition-colors hover:bg-muted/40"
              onClick={() => onCreate(currentDate, hour)}
            >
              {dayEvents
                .filter((event) => event.startTime.getHours() === hour)
                .map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    color={getColor(event.color)}
                    onClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    detailed
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function EventListItem({
  event,
  color,
  onClick,
}: {
  event: Event
  color: EventColor
  onClick: (event: Event) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className="group/item flex w-full items-stretch gap-3 rounded-2xl border bg-card p-3 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className={cn("w-1 shrink-0 rounded-full", color.bg)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-medium">{event.title}</span>
          {event.category && <Badge variant="secondary">{event.category}</Badge>}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <RiTimeLine className="size-3.5" />
          {formatTime(event.startTime)} – {formatTime(event.endTime)}
          <span aria-hidden>·</span>
          {formatDuration(event)}
        </span>
        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

export function NoEvents({
  title = "Sin actividades",
  description = "No hay actividades que coincidan con los filtros actuales.",
  children,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiCalendarEventLine />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  )
}

export function groupByDay(events: Event[]) {
  const sorted = [...events].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  )
  const groups: { day: Date; events: Event[] }[] = []
  for (const event of sorted) {
    const last = groups.at(-1)
    if (last && isSameDay(last.day, event.startTime)) last.events.push(event)
    else groups.push({ day: event.startTime, events: [event] })
  }
  return groups
}

export function ListView({
  events,
  getColor,
  onEventClick,
}: Pick<ViewProps, "events" | "getColor" | "onEventClick">) {
  const groups = groupByDay(events)

  if (groups.length === 0) return <NoEvents />

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ day, events: dayEvents }) => (
        <section key={day.toDateString()} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {capitalize(day.toLocaleDateString(LOCALE, { dateStyle: "full" }))}
          </h3>
          <div className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                color={getColor(event.color)}
                onClick={onEventClick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
