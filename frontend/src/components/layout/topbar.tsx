"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, Sun, Moon, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, NotificationItem } from "@/hooks/use-notifications";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  vehicles: "Vehicles",
  drivers: "Drivers",
  trips: "Trips",
  maintenance: "Maintenance",
  "fuel-logs": "Fuel Logs",
  expenses: "Expenses",
  reports: "Reports",
};

function Breadcrumbs() {
  const pathname = usePathname();

  // Build breadcrumb segments from the pathname
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <span className="text-sm font-medium text-foreground">Dashboard</span>
    );
  }

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label =
      ROUTE_LABELS[segment] ??
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return { href, label };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm"
    >
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Dashboard
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const { notifications, totalCount, markAsRead, markAllAsRead } = useNotifications();

  const initials =
    user
      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
        user.username?.[0]?.toUpperCase() ||
        "U"
      : "U";

  const displayName = user
    ? user.first_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.username
    : "User";

  return (
    <header className="flex items-center h-16 px-4 md:px-6 border-b border-border bg-background shrink-0 gap-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {totalCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-bold"
                >
                  {totalCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto p-1">
            <div className="flex items-center justify-between p-2">
              <span className="font-semibold text-sm px-1">Notifications</span>
              {totalCount > 0 && (
                <Button
                  variant="ghost"
                  className="text-xs h-7 text-primary hover:text-primary/80 px-2"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs">
                No new notifications
              </div>
            ) : (
              notifications.map((notif: NotificationItem) => {
                const borderClass =
                  notif.severity === "critical"
                    ? "border-l-4 border-l-red-500"
                    : notif.severity === "warning"
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-blue-500";
                return (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`flex flex-col items-start gap-1 p-3 border-b border-border last:border-0 cursor-pointer focus:bg-muted/50 ${borderClass}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-center gap-2 w-full justify-between">
                      <span className="font-medium text-xs truncate max-w-[180px]">{notif.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal mt-0.5">
                      {notif.message}
                    </p>
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">{displayName}</span>
                {user?.email && (
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={logout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
