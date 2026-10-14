import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * - `organization`: el token no trae organización vinculada a TMR (la org no
 *   tiene la app o el usuario no es miembro): no puede usar la app.
 * - `permission`: tiene acceso a TMR pero no al módulo (403).
 */
export async function AccessDenied({ reason }: { reason: "organization" | "permission" }) {
  const t = await getTranslations("access");
  const isOrganization = reason === "organization";
  const key = isOrganization ? "noOrganization" : "forbidden";

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{isOrganization ? <Building2 /> : <ShieldX />}</EmptyMedia>
          <EmptyTitle>{t(`${key}.title`)}</EmptyTitle>
          <EmptyDescription>{t(`${key}.description`)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {isOrganization ? (
            <SignOutButton />
          ) : (
            <Button variant="outline" render={<Link href="/dashboard" />}>
              {t("forbidden.back")}
            </Button>
          )}
        </EmptyContent>
      </Empty>
    </div>
  );
}
