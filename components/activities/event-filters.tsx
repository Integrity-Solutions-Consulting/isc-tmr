"use client"

import { RiCloseLine, RiFilter3Line, RiSearchLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import type { EventColor, EventFilters } from "./lib"

type FilterKey = "colors" | "tags" | "categories"

interface FilterOptions {
  colors: EventColor[]
  tags: string[]
  categories: string[]
}

interface FiltersProps extends FilterOptions {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
}

function toggleValue(list: string[], value: string, checked: boolean) {
  return checked ? [...list, value] : list.filter((v) => v !== value)
}

export function EventSearch({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <RiSearchLine />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Buscar actividades…"
        aria-label="Buscar actividades"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Limpiar búsqueda"
            onClick={() => onChange("")}
          >
            <RiCloseLine />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

const sections: { key: FilterKey; label: string }[] = [
  { key: "categories", label: "Categoría" },
  { key: "tags", label: "Etiquetas" },
  { key: "colors", label: "Color" },
]

function optionsFor(key: FilterKey, options: FilterOptions) {
  if (key === "colors") {
    return options.colors.map((c) => ({ value: c.value, label: c.name, dot: c.bg }))
  }
  return options[key].map((v) => ({ value: v, label: v, dot: undefined }))
}

// Escritorio: un menú desplegable por tipo de filtro
export function FilterMenus({ filters, onFiltersChange, ...options }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sections.map(({ key, label }) => {
        const selected = filters[key]
        return (
          <DropdownMenu key={key}>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <RiFilter3Line data-icon="inline-start" />
              {label}
              {selected.length > 0 && (
                <Badge variant="secondary">{selected.length}</Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filtrar por {label.toLowerCase()}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {optionsFor(key, options).map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selected.includes(option.value)}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        [key]: toggleValue(selected, option.value, checked),
                      })
                    }
                  >
                    {option.dot && (
                      <span className={cn("size-2.5 rounded-full", option.dot)} />
                    )}
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>
  )
}

// Mobile: chips seleccionables agrupados, pensados para un Drawer
export function FilterChips({ filters, onFiltersChange, ...options }: FiltersProps) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map(({ key, label }) => (
        <FieldSet key={key}>
          <FieldLegend variant="label">{label}</FieldLegend>
          <ToggleGroup
            multiple
            variant="outline"
            className="flex-wrap"
            value={filters[key]}
            onValueChange={(value) => onFiltersChange({ ...filters, [key]: value })}
          >
            {optionsFor(key, options).map((option) => (
              <ToggleGroupItem key={option.value} value={option.value}>
                {option.dot && (
                  <span className={cn("size-2.5 rounded-full", option.dot)} />
                )}
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      ))}
    </div>
  )
}

export function ActiveFilters({
  filters,
  onFiltersChange,
  colors,
}: Pick<FiltersProps, "filters" | "onFiltersChange" | "colors">) {
  const chips = [
    ...filters.categories.map((v) => ({ key: "categories" as const, value: v, label: v, dot: undefined })),
    ...filters.tags.map((v) => ({ key: "tags" as const, value: v, label: v, dot: undefined })),
    ...filters.colors.map((v) => {
      const color = colors.find((c) => c.value === v)
      return { key: "colors" as const, value: v, label: color?.name ?? v, dot: color?.bg }
    }),
  ]

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={`${chip.key}-${chip.value}`} variant="secondary" className="h-6 pr-1">
          {chip.dot && <span className={cn("size-2 rounded-full", chip.dot)} />}
          {chip.label}
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-4 rounded-full"
            aria-label={`Quitar filtro ${chip.label}`}
            onClick={() =>
              onFiltersChange({
                ...filters,
                [chip.key]: filters[chip.key].filter((v) => v !== chip.value),
              })
            }
          >
            <RiCloseLine />
          </Button>
        </Badge>
      ))}
      <Button
        variant="link"
        size="xs"
        onClick={() =>
          onFiltersChange({ ...filters, colors: [], tags: [], categories: [] })
        }
      >
        Limpiar filtros
      </Button>
    </div>
  )
}
