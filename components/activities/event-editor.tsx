"use client"

import { useState } from "react"
import { RiDeleteBinLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import {
  fromInputValue,
  toInputValue,
  type EventColor,
  type EventDraft,
} from "./lib"

interface EventEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: EventDraft
  isMobile: boolean
  categories: string[]
  colors: EventColor[]
  availableTags: string[]
  onSave: (draft: EventDraft) => void
  onDelete: (id: string) => void
}

export function EventEditor({
  open,
  onOpenChange,
  draft,
  isMobile,
  ...formProps
}: EventEditorProps) {
  const isEditing = Boolean(draft.id)
  const title = isEditing ? "Editar evento" : "Nuevo evento"
  const description = isEditing
    ? "Modifica los detalles de la actividad."
    : "Agrega una actividad al calendario."
  // El formulario se remonta con cada borrador para reiniciar su estado
  const formKey = `${draft.id ?? "new"}-${draft.startTime.getTime()}`

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <EventForm
            key={formKey}
            draft={draft}
            onCancel={() => onOpenChange(false)}
            className="overflow-y-auto px-4"
            footer={(actions) => <DrawerFooter>{actions}</DrawerFooter>}
            {...formProps}
          />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <EventForm
          key={formKey}
          draft={draft}
          onCancel={() => onOpenChange(false)}
          footer={(actions) => <DialogFooter>{actions}</DialogFooter>}
          {...formProps}
        />
      </DialogContent>
    </Dialog>
  )
}

function EventForm({
  draft: initialDraft,
  categories,
  colors,
  availableTags,
  onSave,
  onDelete,
  onCancel,
  footer,
  className,
}: Omit<EventEditorProps, "open" | "onOpenChange" | "isMobile"> & {
  onCancel: () => void
  footer: (actions: React.ReactNode) => React.ReactNode
  className?: string
}) {
  const [draft, setDraft] = useState(initialDraft)
  const update = (patch: Partial<EventDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }))

  const rangeInvalid = draft.endTime <= draft.startTime
  const canSave = draft.title.trim().length > 0 && !rangeInvalid

  const colorItems = colors.map((c) => ({ label: c.name, value: c.value }))
  const categoryItems = categories.map((c) => ({ label: c, value: c }))

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave({ ...draft, title: draft.title.trim() })
      }}
    >
      <FieldGroup className={cn("gap-5", className)}>
        <Field>
          <FieldLabel htmlFor="event-title">Título</FieldLabel>
          <Input
            id="event-title"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Ej. Reunión de seguimiento"
            autoFocus
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="event-description">Descripción</FieldLabel>
          <Textarea
            id="event-description"
            value={draft.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Detalles opcionales"
            rows={3}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="event-start">Inicio</FieldLabel>
            <Input
              id="event-start"
              type="datetime-local"
              value={toInputValue(draft.startTime)}
              onChange={(e) => {
                const start = fromInputValue(e.target.value)
                if (!start) return
                // Mantiene la duración al mover el inicio
                const duration =
                  draft.endTime.getTime() - draft.startTime.getTime()
                update({
                  startTime: start,
                  endTime: new Date(start.getTime() + Math.max(duration, 0)),
                })
              }}
            />
          </Field>
          <Field data-invalid={rangeInvalid || undefined}>
            <FieldLabel htmlFor="event-end">Fin</FieldLabel>
            <Input
              id="event-end"
              type="datetime-local"
              value={toInputValue(draft.endTime)}
              aria-invalid={rangeInvalid || undefined}
              onChange={(e) => {
                const end = fromInputValue(e.target.value)
                if (end) update({ endTime: end })
              }}
            />
            {rangeInvalid && (
              <FieldError>El fin debe ser posterior al inicio.</FieldError>
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="event-category">Categoría</FieldLabel>
            <Select
              items={categoryItems}
              value={draft.category ?? null}
              onValueChange={(value) => update({ category: value ?? undefined })}
            >
              <SelectTrigger id="event-category" className="w-full">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="event-color">Color</FieldLabel>
            <Select
              items={colorItems}
              value={draft.color}
              onValueChange={(value) => value && update({ color: value })}
            >
              <SelectTrigger id="event-color" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <span className={cn("size-3 rounded-full", color.bg)} />
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel>Etiquetas</FieldLabel>
          <ToggleGroup
            multiple
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={draft.tags ?? []}
            onValueChange={(tags) => update({ tags })}
          >
            {availableTags.map((tag) => (
              <ToggleGroupItem key={tag} value={tag}>
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>

      {footer(
        <>
          {draft.id && (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              onClick={() => onDelete(draft.id!)}
            >
              <RiDeleteBinLine data-icon="inline-start" />
              Eliminar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSave}>
            {draft.id ? "Guardar" : "Crear evento"}
          </Button>
        </>,
      )}
    </form>
  )
}
