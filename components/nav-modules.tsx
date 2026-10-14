"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, House, Users, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Module = {
  key: "home" | "activities" | "hr";
  url: string;
  icon: LucideIcon;
  /** Permiso del gate para ver el módulo; sin él, se oculta. */
  permission?: string;
};

// Ocultar no protege: cada página vuelve a comprobar el permiso (lib/dal.ts)
const modules: Module[] = [
  { key: "home", url: "/dashboard", icon: House },
  { key: "activities", url: "/dashboard/activities", icon: CalendarDays, permission: "todo:read" },
  { key: "hr", url: "/dashboard/hr", icon: Users, permission: "hr:access" },
];

export function NavModules({ permissions }: { permissions: string[] }) {
  const t = useTranslations("nav.modules");
  const pathname = usePathname();
  const visible = modules.filter(
    (module) => !module.permission || permissions.includes(module.permission),
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("label")}</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((module) => (
          <SidebarMenuItem key={module.key}>
            <SidebarMenuButton
              isActive={pathname === module.url}
              tooltip={t(module.key)}
              render={
                <Link href={module.url}>
                  <module.icon />
                  <span>{t(module.key)}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
