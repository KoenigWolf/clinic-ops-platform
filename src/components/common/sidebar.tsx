"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

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
          "flex h-screen flex-col bg-gray-900 text-white transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-3">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold shrink-0">
              K
            </div>
            {!collapsed && <span className="text-xl font-bold">Karute</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800 shrink-0"
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
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
        <div className="border-t border-gray-800 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-center text-white hover:bg-gray-800 p-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white text-sm">
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
                  className="w-full justify-start gap-3 text-white hover:bg-gray-800 px-2"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
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
