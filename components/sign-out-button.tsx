"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("user");

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/auth";
  };

  return (
    <Button variant="outline" onClick={signOut}>
      <LogOut />
      {t("signOut")}
    </Button>
  );
}
