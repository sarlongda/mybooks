import { UserMenu } from "@/components/layout/UserMenu";

interface TopbarProps {
  currentUser?: {
    name?: string | null;
    email?: string | null;
  };
}

export function Topbar({ currentUser }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      {/* left side: logo, search, etc. */}
      <div className="font-semibold text-slate-700">MyBooks</div>

      {/* right side: notifications, user menu */}
      <div className="flex items-center gap-4">
        {/* any existing icons */}
        <UserMenu name={currentUser?.name} email={currentUser?.email} />
      </div>
    </header>
  );
}
