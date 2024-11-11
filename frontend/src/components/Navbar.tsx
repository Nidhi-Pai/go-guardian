"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Home,
  MapPin,
  User,
  Phone,
  Shield,
  Menu,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { title: "Home", path: "/", icon: Home },
  { title: "Safe Route", path: "/safe-route", icon: MapPin },
  { title: "Community", path: "/community", icon: Users },
  { title: "Profile", path: "/profile", icon: User },
  { title: "Emergency Contacts", path: "/emergency-contacts", icon: Phone },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b bg-gradient-to-b from-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 transition-transform hover:scale-105 pl-4"
          >
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl tracking-tight">Go Guardian</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg",
                    "transition-all duration-200 ease-in-out",
                    "relative",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-foreground/60 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 mr-2",
                    "transition-all duration-300",
                    "group-hover:scale-110",
                    isActive && [
                      "text-primary",
                      "animate-pulse-subtle",
                      "drop-shadow-[0_0_8px_rgba(var(--primary),.5)]",
                    ]
                  )} />
                  {item.title}
                  <span
                    className={cn(
                      "absolute inset-0 rounded-md -z-10",
                      "bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0",
                      "bg-[length:200%_100%]",
                      isActive
                        ? "opacity-100 animate-shimmer"
                        : "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-200"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[300px] bg-gradient-to-b from-background to-background/95"
          >
            <div className="flex items-center space-x-2 mb-8 mt-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Go Guardian</span>
            </div>
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 hover:bg-primary/10",
                      isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-foreground/60 hover:text-primary"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 mr-3", isActive && "text-primary")} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}