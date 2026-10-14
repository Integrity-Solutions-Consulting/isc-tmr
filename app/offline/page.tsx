import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WifiOff } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offline");
  return { title: t("title") };
}

/**
 * Fallback que el service worker precachea y sirve cuando
 * una navegación falla por falta de red.
 */
export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOff />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
