"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const displayName = name || email || "Account";
  const initials =
    (name || email || "U")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      router.push("/auth/login");
      router.refresh();
    }
  }

  function handleAccountProfile() {
    // adjust this route to wherever your account page will live
    router.push("/settings/account");
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-semibold text-slate-900">
          {initials}
        </span>
        <span className="hidden sm:block max-w-[160px] truncate">{displayName}</span>
      </button>

      {open && (
        <>
          {/* click-outside overlay */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400 text-sm font-semibold text-slate-900">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </div>
                {email && (
                  <div className="truncate text-xs text-slate-500">{email}</div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAccountProfile}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:text-blue-500 hover:bg-blue-100"
            >
              <UserIcon className="h-4 w-4" />
              <span>Account Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:text-blue-500 hover:bg-blue-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
