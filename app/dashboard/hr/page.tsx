import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { AccessDenied } from "@/components/access-denied"
import { can } from "@/lib/dal"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hr")
  return { title: t("title") }
}

// Módulo de ejemplo: solo entra quien tenga `hr:access` en su organización
// (rol owner/admin en el gate; member no). La UI real del módulo va aquí.
export default async function HrPage() {
  if (!(await can("hr:access"))) return <AccessDenied reason="permission" />

  const t = await getTranslations("hr")
  return (
    <div className="flex flex-1 flex-col gap-1 p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
    </div>
  )
}
