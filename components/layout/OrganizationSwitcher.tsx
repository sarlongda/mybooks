'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';

interface Org {
  id: string;
  name: string;
  role: OrgRole;
}

interface OrgListResponse {
  activeOrganizationId: string | null;
  items: Org[];
}

export function OrganizationSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/organizations');
        if (!res.ok) return;
        const data: OrgListResponse = await res.json();
        setOrgs(data.items);
        setActiveOrgId(data.activeOrganizationId);
      } catch (e) {
        console.error('Failed to load organizations', e);
      }
    })();
  }, []);

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  async function handleSelect(orgId: string) {
    try {
      const res = await fetch('/api/organizations/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (!res.ok) return;
      setActiveOrgId(orgId);
      setOpen(false);
      // reload all data for the newly selected org
      window.location.reload();
    } catch (e) {
      console.error('Failed to switch org', e);
    }
  }

  // while loading, show a skeleton-ish header
  if (!activeOrg) {
    return (
      <div className="p-4 border-b border-blue-500">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-6 h-6 opacity-50" />
          <div>
            <div className="font-bold text-lg opacity-50">Loading...</div>
            <div className="text-xs text-blue-100 opacity-50">—</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* header button (replaces your static block) */}
      <div className="p-4 border-b border-blue-500">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 text-left text-white cursor-pointer"
        >
          <BookOpen className="w-6 h-6" />
          <div>
            <div className="font-bold text-lg truncate">{activeOrg.name}</div>
            <div className="text-xs text-blue-100">{activeOrg.role}</div>
          </div>
          <ChevronDown className="w-4 h-4 ml-auto" />
        </button>
      </div>

      {/* simple modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Choose a Business
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(org.id)}
                    className={`w-full text-left px-4 py-3 rounded-md border text-sm flex items-center justify-between ${
                      org.id === activeOrgId
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium truncate">{org.name}</div>
                      <div className="text-xs opacity-80">{org.role}</div>
                    </div>
                    {org.id === activeOrgId && (
                      <span className="text-xs font-semibold">Logged in</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-slate-200">
                <form
                  className="flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    const name = String(fd.get('name') || '').trim();
                    if (!name) return;
                    const res = await fetch('/api/organizations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name }),
                    });
                    if (!res.ok) return;
                    const created: Org = await res.json();
                    setOrgs((prev) => [...prev, created]);
                    setActiveOrgId(created.id);
                    form.reset();
                    window.location.reload();
                  }}
                >
                  <input
                    name="name"
                    placeholder="Create a new business"
                    className="flex-1 border border-slate-300 text-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
