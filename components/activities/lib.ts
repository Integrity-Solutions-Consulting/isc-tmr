export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
}

export type EventDraft = Omit<Event, "id"> & { id?: string }

export type CalendarView = "month" | "week" | "day" | "list"

export interface EventColor {
  name: string
  value: string
  bg: string
  text: string
}

export interface EventFilters {
  query: string
  colors: string[]
  tags: string[]
  categories: string[]
}

export const emptyFilters: EventFilters = {
  query: "",
  colors: [],
  tags: [],
  categories: [],
}

// Colores categóricos de los eventos: son datos, no tokens de la interfaz
export const defaultColors: EventColor[] = [
  { name: "Azul", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Verde", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Morado", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Naranja", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Rosa", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Rojo", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

export const LOCALE = "es-EC"
export const WEEK_STARTS_ON = 1 // lunes

export function hasActiveFilters(filters: EventFilters) {
  return (
    filters.colors.length > 0 ||
    filters.tags.length > 0 ||
    filters.categories.length > 0
  )
}

export function filterEvents(events: Event[], filters: EventFilters) {
  const query = filters.query.trim().toLowerCase()
  return events.filter((event) => {
    if (
      query &&
      ![event.title, event.description, event.category, ...(event.tags ?? [])]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(query))
    ) {
      return false
    }
    if (filters.colors.length > 0 && !filters.colors.includes(event.color)) {
      return false
    }
    if (
      filters.tags.length > 0 &&
      !event.tags?.some((tag) => filters.tags.includes(tag))
    ) {
      return false
    }
    if (
      filters.categories.length > 0 &&
      (!event.category || !filters.categories.includes(event.category))
    ) {
      return false
    }
    return true
  })
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date) {
  const start = new Date(date)
  const diff = (start.getDay() - WEEK_STARTS_ON + 7) % 7
  start.setDate(start.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  return start
}

export function weekDays(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function eventsOnDay(events: Event[], day: Date) {
  return events
    .filter((event) => isSameDay(event.startTime, day))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
}

export function formatDuration(event: Event) {
  const minutes = Math.round(
    (event.endTime.getTime() - event.startTime.getTime()) / 60000,
  )
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Valor para <input type="datetime-local"> en la zona horaria local
export function toInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function fromInputValue(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Borrador para un evento nuevo: el día indicado a la próxima hora en punto
export function newDraft(
  day: Date,
  color: string,
  category?: string,
  hour?: number,
): EventDraft {
  const start = new Date(day)
  const now = new Date()
  start.setHours(
    hour ?? (isSameDay(day, now) ? Math.min(now.getHours() + 1, 23) : 9),
    0,
    0,
    0,
  )
  return {
    title: "",
    description: "",
    startTime: start,
    endTime: new Date(start.getTime() + 60 * 60000),
    color,
    category,
    tags: [],
  }
}
