"use client";

import { useState, useCallback, useEffect } from "react";
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Menu,
} from "lucide-react";

export const navigation = [
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
const SIDEBAR_WIDTH_KEY = "sidebar-width";

const COLLAPSED_WIDTH = 64;
const MIN_WIDTH = 200;
const DEFAULT_WIDTH = 256;
const MAX_WIDTH = 320;

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isResizing, setIsResizing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage初期化
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");

    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
      }
    }

    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setWidth(newWidth);
    } else if (newWidth < MIN_WIDTH) {
      setWidth(MIN_WIDTH);
    } else if (newWidth > MAX_WIDTH) {
      setWidth(MAX_WIDTH);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    }
  }, [isResizing, width]);

  const handleDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(DEFAULT_WIDTH));
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <TooltipProvider delayDuration={0}>
      <div
        style={{ width: currentWidth }}
        className={cn(
          "hidden md:flex h-screen flex-col text-white relative",
          mounted && !isResizing && "transition-[width] duration-200",
          sidebar.bg
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
                  {!collapsed && <span className="truncate">{item.name}</span>}
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

        {/* Resize Handle */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-teal-500/50 active:bg-teal-500/70 transition-colors group"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className={cn("md:hidden flex items-center justify-between h-14 px-4 border-b", sidebar.bg, sidebar.border)}>
      <Link href="/" className="flex items-center gap-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-teal-500/25", sidebar.logo.bg, sidebar.logo.text)}>
          K
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">Karute</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800/60">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className={cn("w-72 p-0", sidebar.bg)}>
          <nav className="flex flex-col h-full">
            <div className={cn("flex items-center gap-2 h-14 px-4 border-b", sidebar.border)}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-lg shadow-teal-500/25", sidebar.logo.bg, sidebar.logo.text)}>
                K
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">Karute</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? sidebar.nav.active
                            : cn(sidebar.nav.inactive, sidebar.nav.hover)
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={cn("border-t p-4", sidebar.border)}>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className={cn("h-10 w-10", sidebar.avatar.ring)}>
                  <AvatarFallback className={cn("text-white text-sm font-medium", sidebar.avatar.bg)}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                  <p className={cn("text-xs truncate", sidebar.text.muted)}>{session?.user?.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm", sidebar.nav.inactive, sidebar.nav.hover)}
                >
                  <Settings className="h-4 w-4" />
                  設定
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
