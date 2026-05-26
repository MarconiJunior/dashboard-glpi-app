"use client"

import { ChevronLeft, Headphones, Inbox, LayoutDashboard, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assigned", label: "Meus Chamados", icon: Inbox },
  { href: "/news", label: "Novos Chamados", icon: Sparkles },
  { href: "/satisfaction", label: "Satisfação", icon: Star },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "sticky top-0 h-svh shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Headphones className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">GLPI Desk</span>
              <span className="text-[10px] text-muted-foreground">Painel do Técnico</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
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
            )
          })}
        </nav>

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
  )
}
