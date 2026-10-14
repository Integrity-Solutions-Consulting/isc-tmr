import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AccessDenied } from "@/components/access-denied";
import { getPrincipal, verifySession } from "@/lib/dal";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usuario y permisos para el sidebar. No sustituye el chequeo por página:
  // los layouts no se vuelven a renderizar al navegar entre rutas hijas.
  const { user } = await verifySession();
  const { org } = await getPrincipal();

  // Sin organización vinculada a TMR en el token: no puede usar la app
  if (!org) {
    return (
      <main className="flex min-h-svh flex-col">
        <AccessDenied reason="organization" />
      </main>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{ name: user.name, email: user.email, avatar: user.image ?? "" }}
        permissions={org.permissions}
      />
      <SidebarInset>
        <SiteHeader />
        {/* <div className="flex flex-1 flex-col"></div> */}

        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
