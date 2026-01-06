import type { ReactNode } from "react";
import "../globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
// import { Topbar } from "@/components/layout/Topbar";

function Topbar() {
  // simple placeholder for now, you can enhance later
  return (
    <header className="h-14 border-b border-slate-200 flex items-center px-6 bg-white">
      <div className="font-semibold text-slate-700">MyBooks</div>
    </header>
  );
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-4">{children}</main>
      </div>
    </div>
  );
}