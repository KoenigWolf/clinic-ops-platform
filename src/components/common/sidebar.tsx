"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { sidebar } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  FileText,
  Calendar,
  Video,
  Pill,
  Receipt,
  Settings,
  Home,
  LogOut,
  ChevronDown,
  Ear,
  ClipboardList,
  FileSignature,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: Home },
  { name: "患者管理", href: "/patients", icon: Users },
  { name: "診療記録", href: "/records", icon: FileText },
  { name: "Web問診", href: "/questionnaire", icon: ClipboardList },
  { name: "耳鼻科検査", href: "/ent/dashboard", icon: Ear },
  { name: "予約管理", href: "/appointments", icon: Calendar },
  { name: "オンライン診療", href: "/video", icon: Video },
  { name: "処方管理", href: "/prescriptions", icon: Pill },
  { name: "文書管理", href: "/documents", icon: FileSignature },
  { name: "請求管理", href: "/billing", icon: Receipt },
  { name: "経営分析", href: "/analytics", icon: BarChart3 },
  { name: "設定", href: "/settings", icon: Settings },
];

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(() => {
    // Initialize from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved === "true";
    }
    return false;
  });

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-screen flex-col text-white transition-all duration-300",
          sidebar.bg,
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("flex h-16 items-center justify-between border-b px-3", sidebar.border)}>
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 shadow-lg shadow-teal-500/25", sidebar.logo.bg, sidebar.logo.text)}>
              K
            </div>
            {!collapsed && <span className="text-xl font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">Karute</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0 transition-colors", sidebar.toggle)}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? sidebar.nav.active
                      : cn(sidebar.nav.inactive, sidebar.nav.hover),
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                  {!collapsed && item.name}
                </Link>
              );

              return (
                <li key={item.name}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Menu */}
        <div className={cn("border-t p-2", sidebar.border)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-white hover:bg-slate-800/60 p-2 transition-colors"
                    >
                      <Avatar className={cn("h-8 w-8", sidebar.avatar.ring)}>
                        <AvatarFallback className={cn("text-white text-sm font-medium", sidebar.avatar.bg)}>
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {session?.user?.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-white hover:bg-slate-800/60 px-2 transition-colors"
                >
                  <Avatar className={cn("h-8 w-8 shrink-0", sidebar.avatar.ring)}>
                    <AvatarFallback className={cn("text-white text-sm font-medium", sidebar.avatar.bg)}>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                    <p className={cn("text-xs truncate", sidebar.text.muted)}>{session?.user?.email}</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0", sidebar.text.muted)} />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
