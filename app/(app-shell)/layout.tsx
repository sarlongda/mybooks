import type { ReactNode } from "react";
import "../globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getCurrentUser } from "@/lib/auth";

// function Topbar() {
//   // simple placeholder for now, you can enhance later
//   return (
//     <header className="h-14 border-b border-slate-200 flex items-center px-6 bg-white">
//       <div className="font-semibold text-slate-700">MyBooks</div>
//     </header>
//   );
// }

export default async function AppShellLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar currentUser={currentUser ?? undefined} />
        <main className="flex-1 overflow-y-auto px-6 py-4">{children}</main>
      </div>
    </div>
  );
}