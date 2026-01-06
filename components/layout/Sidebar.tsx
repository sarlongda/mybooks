"use client";

import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  BookOpen,
  BarChart3,
  ChevronDown,
  Settings,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  hasSubmenu?: boolean;
  isExpanded?: boolean;
}

function MenuItem({
  icon,
  label,
  href,
  active,
  hasSubmenu,
  isExpanded,
}: MenuItemProps) {
  const content = (
    <div
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
        active
          ? "bg-blue-700 text-white"
          : "text-blue-100 hover:bg-blue-700 hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-5 h-5">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {hasSubmenu && (
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return <button className="w-full text-left">{content}</button>;
}

export function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {}
  );

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path: string | ((p: string) => boolean)) => {
    if (typeof path === "string") {
      return pathname === path;
    }
    return path(pathname);
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 min-h-screen flex flex-col">
      {/* Business selector – static for now, later we’ll hook it to real business switching */}
      <div className="p-4 border-b border-blue-500">
        <div className="flex items-center gap-2 text-white cursor-pointer">
          <BookOpen className="w-6 h-6" />
          <div>
            <div className="font-bold text-lg">Ceed Civil Engineering</div>
            <div className="text-xs text-blue-100">Owner</div>
          </div>
          <ChevronDown className="w-4 h-4 ml-auto" />
        </div>
      </div>

      <nav className="flex-1 py-2">
        <MenuItem
          icon={<LayoutDashboard />}
          label="Dashboard"
          href="/dashboard"
          active={isActive("/dashboard")}
        />
        <MenuItem
          icon={<Users />}
          label="Clients"
          href="/clients"
          active={isActive((p) => p.startsWith("/clients"))}
        />
        <MenuItem
          icon={<Receipt />}
          label="Invoices"
          href="/invoices"
          active={isActive((p) => p.startsWith("/invoices"))}
        />
        <MenuItem
          icon={<CreditCard />}
          label="Payments"
          href="/payments"
          active={isActive("/payments")}
        />
        <MenuItem
          icon={<Wallet />}
          label="Expenses"
          href="/expenses"
          active={isActive("/expenses")}
        />
        <MenuItem
          icon={<BookOpen />}
          label="Accounting"
          href="/accounting"
          active={isActive("/accounting")}
        />
        <MenuItem
          icon={<BarChart3 />}
          label="Reports"
          href="/reports"
          active={isActive("/reports")}
        />
      </nav>

      <div className="border-t border-blue-500 py-2">
        <div className="px-4 py-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
          More
        </div>
        <MenuItem icon={<LinkIcon />} label="Apps" />
        <MenuItem icon={<Users />} label="Team Members" />
        <MenuItem icon={<FileText />} label="Items and Services" />
        <MenuItem icon={<LinkIcon />} label="Bank Connections" />
        <MenuItem
          icon={<Settings />}
          label="Settings"
          href="/settings"
          active={isActive("/settings")}
        />
      </div>
    </aside>
  );
}
