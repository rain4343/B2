import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Building2, Shield, Menu, LogOut, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const navItems = [
  { icon: LayoutDashboard, label: "داشبۆرد", href: "/" },
  { icon: Users, label: "بەڕێوەبردنی فەرمانبەران", href: "/staff" },
  { icon: Building2, label: "بەڕێوەبردنی هۆبەکان", href: "/departments" },
  { icon: Shield, label: "بەڕێوەبردنی ڕۆڵەکان", href: "/roles" },
  { icon: FileText, label: "بەڕێوەبردنی نوسراوەکان", href: "/documents" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const SidebarContent = () => (
    <div className="flex h-full flex-col py-6" dir="rtl">
      {/* Brand */}
      <div className="px-6 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
          ئی-ڕێکار
        </h2>
        <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
          پانێڵی بەڕێوەبردن
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
              style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 mt-4 pt-4 border-t border-slate-700">
        {user && (
          <div className="px-3 py-2 mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            <p className="text-xs text-slate-400">داخڵبووی</p>
            <p className="text-sm font-medium text-white truncate">{user.full_name || user.username}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          دەرچوون
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Desktop Sidebar */}
      <div
        className="hidden md:block md:w-64 shrink-0"
        style={{ background: "#1e293b", borderLeft: "1px solid #334155" }}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile Header */}
        <header
          className="flex h-14 items-center gap-4 px-4 md:hidden"
          style={{ background: "#1e293b", borderBottom: "1px solid #334155" }}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                <Menu className="h-5 w-5" />
                <span className="sr-only">مێنو</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0" style={{ background: "#1e293b", border: "none" }}>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-bold text-white" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            ئی-ڕێکار
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
