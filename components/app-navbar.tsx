"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/src/presentation/utils/ticket";
import type { SessionUser } from "@/src/infrastructure/auth/session";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AppNavbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data } = useSWR<SessionUser>("/api/me", fetcher, { revalidateOnFocus: false });
  const fullName = data?.fullName ?? "Técnico";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Tempo real
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-semibold">{fullName}</span>
            <span className="text-[10px] text-muted-foreground">{data?.email ?? ""}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sair"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
