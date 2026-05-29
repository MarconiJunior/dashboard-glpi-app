"use client";

import {
  ChevronLeft, Headphones, Inbox, LayoutDashboard, Sparkles, Star, Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/src/infrastructure/auth/session";

// ---------------------------------------------------------------------------
// Itens de navegação
// ---------------------------------------------------------------------------

const personalNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assigned", label: "Meus Chamados", icon: Inbox },
  { href: "/news", label: "Novos Chamados", icon: Sparkles },
  { href: "/satisfaction", label: "Satisfação", icon: Star },
];

const supervisorNav = [
  { href: "/management", label: "Gestão Geral", icon: Users },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: user } = useSWR<SessionUser>("/api/me", fetcher, { revalidateOnFocus: false });
  const isSupervisor = user?.role === "supervisor";

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          collapsed && "justify-center px-0",
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-svh shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Headphones className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">GLPI Desk</span>
              <span className="text-[10px] text-muted-foreground">
                {isSupervisor ? "Painel do Gestor" : "Painel do Técnico"}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {/* Visão pessoal — sempre visível */}
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Pessoal
            </p>
          )}
          {personalNav.map(renderNavItem)}

          {/* Gestão Geral — apenas supervisores */}
          {isSupervisor && (
            <>
              <div className={cn("my-2 border-t border-sidebar-border", collapsed && "mx-2")} />
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Gestão
                </p>
              )}
              {supervisorNav.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* Recolher */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((v) => !v)}
            className="mt-2 w-full justify-center text-muted-foreground"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-2 text-xs">Recolher</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
