"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Etiquetas legibles para cada segmento de ruta; si falta, se capitaliza el segmento
const segmentLabels: Record<string, string> = {
  dashboard: "Inicio",
  activities: "Actividades",
}

function labelFor(segment: string) {
  return (
    segmentLabels[segment] ??
    decodeURIComponent(segment).replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = segments.map((segment, index) => ({
    href: "/" + segments.slice(0, index + 1).join("/"),
    label: labelFor(segment),
  }))

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 md:rounded-t-xl">
      <div className="flex min-w-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1
              return (
                <Fragment key={crumb.href}>
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                  <BreadcrumbItem
                    className={isLast ? "min-w-0" : "hidden md:inline-flex"}
                  >
                    {isLast ? (
                      <BreadcrumbPage className="truncate">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
