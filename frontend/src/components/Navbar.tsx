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
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Emergency Contacts", path: "/emergency-contacts", icon: Phone },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:flex mr-4">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span className="font-bold text-xl">Go Guardian</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 ml-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.path
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="flex flex-col space-y-4 mt-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center py-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.path
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
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