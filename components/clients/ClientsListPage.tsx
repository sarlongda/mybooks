// components/clients/ClientsListPage.tsx
import { useState, useEffect, useRef } from "react";
import { ClientListResponse } from "@/lib/types/clients";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Search,
  Mail,
  Phone,
  ChevronDown,
  Edit,
  Archive,
  Trash2,
  Plus,
  Download,
  Upload,
} from "lucide-react";

interface ClientsListPageProps {
  onNavigate: (path: string) => void;
}

type MetricFilter = "all" | "overdue" | "outstanding" | "draft";

export function ClientsListPage({ onNavigate }: ClientsListPageProps) {
  const [data, setData] = useState<ClientListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"clients" | "sent">("clients");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("all");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [recentlyActiveColors, setRecentlyActiveColors] = useState<number[]>([]);

  // hidden input for CSV import
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  async function fetchClients() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "30",
      });
      if (searchQuery) {
        params.append("q", searchQuery);
      }

      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   console.error("Supabase env vars are missing");
      //   return;
      // }

      const response = await fetch(`/api/clients?${params.toString()}`, {
        headers: {
          // Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const result: ClientListResponse = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = selectedClients.length;
  const canBulkEdit = selectedCount === 1;

  const items = data?.items ?? [];

  const totalOverdue =
    items.reduce(
      (sum, client) => sum + (client.overdueBalance || 0),
      0
    ) || 0;

  const totalOutstanding =
    items.reduce(
      (sum, client) => sum + (client.outstandingBalance || 0),
      0
    ) || 0;

  const totalDraft =
    items.reduce(
      (sum, client) => sum + (client.draftBalance || 0),
      0
    ) || 0;

  const recentlyActive = items.slice(0, 3);

  // Generate stable random colors for recently active cards
  useEffect(() => {
    if (recentlyActive.length > 0) {
      // Generate unique random indices for each card
      const indices: number[] = [];
      const availableColors = Array.from({ length: avatarColors.length }, (_, i) => i);
      
      for (let i = 0; i < Math.min(recentlyActive.length, avatarColors.length); i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        indices.push(availableColors[randomIndex]);
        availableColors.splice(randomIndex, 1);
      }
      
      setRecentlyActiveColors(indices);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyActive.length]);

  function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const avatarColors = [
    { border: "border-orange-300", cardBorder: "border-t-orange-300" },
    { border: "border-purple-300", cardBorder: "border-t-purple-300" },
    { border: "border-blue-300", cardBorder: "border-t-blue-300" },
    { border: "border-cyan-300", cardBorder: "border-t-cyan-300" },
    { border: "border-teal-300", cardBorder: "border-t-teal-300" },
    { border: "border-green-300", cardBorder: "border-t-green-300" },
    { border: "border-pink-300", cardBorder: "border-t-pink-300" },
    { border: "border-yellow-300", cardBorder: "border-t-yellow-300" },
  ];

  function getAvatarBorderColor(index: number): string {
    return avatarColors[index % avatarColors.length].border;
  }

  function getBorderColor(index: number): string {
    return avatarColors[index % avatarColors.length].cardBorder;
  }

  // Filtered items based on metricFilter
  const filteredItems = (() => {
    if (!items.length) return [];
    if (metricFilter === "all") return items;

    if (metricFilter === "overdue") {
      return items.filter((c) => (c.overdueBalance || 0) > 0);
    }
    if (metricFilter === "outstanding") {
      return items.filter((c) => (c.outstandingBalance || 0) > 0);
    }
    if (metricFilter === "draft") {
      return items.filter((c) => (c.draftBalance || 0) > 0);
    }
    return items;
  })();

  // selection helpers (respecting filtered list)
  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((c) => selectedClients.includes(c.id));

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (!filteredItems.length) return;

    if (allFilteredSelected) {
      // unselect only the currently filtered ones
      setSelectedClients((prev) =>
        prev.filter((id) => !filteredItems.some((c) => c.id === id))
      );
    } else {
      // add all filtered items to selection
      setSelectedClients((prev) => {
        const idsToAdd = filteredItems
          .map((c) => c.id)
          .filter((id) => !prev.includes(id));
        return [...prev, ...idsToAdd];
      });
    }
  };

  async function handleBulkAction(action: "edit" | "archive" | "delete") {
    if (selectedClients.length === 0) return;

    if (action === "edit") {
      if (selectedClients.length !== 1) {
        alert("Please select exactly one client to edit.");
        return;
      }
      const id = selectedClients[0];
      setShowBulkMenu(false);
      onNavigate(`client-edit-${id}`);
      return;
    }

    if (action === "delete") {
      const confirmed = window.confirm(
        `Delete ${selectedClients.length} selected client(s)? This cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedClients,
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk action failed");
      }

      setShowBulkMenu(false);
      setSelectedClients([]);
      await fetchClients();
    } catch (err) {
      console.error("Bulk action error:", err);
      alert("Failed to apply bulk action. Please try again.");
    }
  }


  // ---------- IMPORT / EXPORT HANDLERS ----------

  const handleImportClick = () => {
    setShowMoreActions(false);
    importInputRef.current?.click();
  };

  const handleImportFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error || "Failed to import clients");
        return;
      }

      const result = await res.json();
      alert(`Imported ${result.imported ?? 0} client(s).`);

      // reset input so selecting the same file again still triggers change
      e.target.value = "";
      await fetchClients();
    } catch (err) {
      console.error("Import clients failed", err);
      alert("Failed to import clients. Please try again.");
    }
  };

  const handleExportClients = async () => {
    try {
      setShowMoreActions(false);

      const res = await fetch("/api/clients/export", {
        method: "GET",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("Export failed", body);
        alert("Failed to export clients.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `clients-export-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export clients failed", err);
      alert("Failed to export clients. Please try again.");
    }
  };

  // metric click helper – click again to clear filter
  function handleMetricClick(metric: MetricFilter) {
    setMetricFilter((prev) => (prev === metric ? "all" : metric));
    setSelectedClients([]);
  }

  if (loading && !data) {
    return (
      <section className="space-y-4 p-6">
        <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      <div className="space-y-6 p-8 max-w-[1132px] mx-auto">
        <header className="flex items-center justify-between mb-10 pb-4 border-b border-slate-300">
          <h1 className="text-3xl font-semibold text-slate-900">Clients</h1>
          <div className="flex gap-3">
            {/* Hidden input for CSV import */}
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFileSelected}
            />

            {/* More Actions dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreActions((v) => !v)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                More Actions
                <ChevronDown className="w-4 h-4" />
              </button>
              {showMoreActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMoreActions(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-md shadow-md z-20">
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      </div>
                      Import Clients
                    </button>
                    <button
                      type="button"
                      onClick={handleExportClients}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Download className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      </div>
                      Export Clients
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => onNavigate("clients-new")}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              New Client
            </button>
          </div>
        </header>

        {/* top summary cards – clickable filters */}
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleMetricClick("overdue")}
            className={`flex flex-col items-center justify-center text-center bg-white p-6 transition-all ${metricFilter === "overdue"
              ? "border-t-4 border-blue-800 bg-slate-50 text-blue-500 hover:text-blue-800"
              : "border-t-4 border-transparent hover:border-blue-800  text-blue-500 hover:text-blue-800"
              }`}
          >
            <div className="text-4xl font-bold">
              {formatCurrency(totalOverdue, "USD")}
            </div>
            <div className="text-md text-slate-600 mt-1">overdue</div>
          </button>

          <button
            type="button"
            onClick={() => handleMetricClick("outstanding")}
            className={`flex flex-col items-center justify-center text-center bg-white p-6 transition-all ${metricFilter === "outstanding"
              ? "border-t-4 border-blue-800 bg-slate-50 text-blue-500 hover:text-blue-800"
              : "border-t-4 border-transparent hover:border-blue-800 text-blue-500 hover:text-blue-800"
              }`}
          >
            <div className="text-4xl font-bold">
              {formatCurrency(totalOutstanding, "USD")}
            </div>
            <div className="text-md text-slate-600 mt-1">
              total outstanding
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleMetricClick("draft")}
            className={`flex flex-col items-center justify-center text-center bg-white p-6 transition-all ${metricFilter === "draft"
              ? "border-t-4 border-blue-800 bg-slate-50 text-blue-500 hover:text-blue-800"
              : "border-t-4 border-transparent hover:border-blue-800 text-blue-500 hover:text-blue-800"
              }`}
          >
            <div className="text-4xl font-bold">
              {formatCurrency(totalDraft, "USD")}
            </div>
            <div className="text-md text-slate-600 mt-1">in draft</div>
          </button>
        </div>

        {/* Recently Active – hide when a metric filter is active */}
        {metricFilter === "all" && recentlyActive.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Recently Active
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Client card */}
              <button
                type="button"
                onClick={() => onNavigate("clients-new")}
                className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/40 hover:bg-blue-50 transition-colors min-h-[140px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-green-500" strokeWidth={2.5} />
                  </div>
                  <div className="text-md font-medium text-slate-700">
                    New Client
                  </div>
                </div>
              </button>
              {recentlyActive.map((client, index) => (
                <div
                  key={client.id}
                  className={`bg-white border border-slate-200 border-t-4 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer ${
                    recentlyActiveColors[index] !== undefined 
                      ? getBorderColor(recentlyActiveColors[index])
                      : getBorderColor(index)
                  }`}
                  onClick={() => onNavigate(`client-detail-${client.id}`)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-12 h-12 rounded-full border-2 ${
                          recentlyActiveColors[index] !== undefined
                            ? getAvatarBorderColor(recentlyActiveColors[index])
                            : getAvatarBorderColor(index)
                        } bg-white flex items-center justify-center font-semibold text-sm text-slate-900`}
                      >
                        {getInitials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {client.name}
                        </div>
                        {client.companyName && (
                          <div className="text-sm text-slate-500 truncate">
                            {client.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex gap-6 px-6">
              <button
                onClick={() => setActiveTab("clients")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "clients"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
              >
                Clients
              </button>
              <button
                onClick={() => setActiveTab("sent")}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "sent"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
              >
                Sent Emails
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Header row with All Clients / Selected + Bulk Actions + Search */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedCount > 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Clients{" "}
                      <span className="text-slate-400">&gt;</span>{" "}
                      <span className="text-slate-900">
                        Selected {selectedCount}
                      </span>
                    </h3>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowBulkMenu((v) => !v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50"
                      >
                        Bulk Actions
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {showBulkMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowBulkMenu(false)}
                          />
                          <div className="absolute z-20 mt-2 w-40 bg-white border border-slate-200 rounded-md shadow-md">
                            <button
                              type="button"
                              disabled={!canBulkEdit}
                              onClick={() => {
                                if (canBulkEdit) {
                                  handleBulkAction("edit");
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${canBulkEdit
                                ? "text-slate-700 hover:bg-slate-50"
                                : "text-slate-300 cursor-not-allowed"
                                }`}
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkAction("archive")}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Archive className="w-4 h-4" />
                              Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkAction("delete")}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <h3 className="text-lg font-semibold text-slate-900">
                    {metricFilter === "all" ? (
                      "All Clients"
                    ) : (
                      <>
                        <button
                          onClick={() => setMetricFilter("all")}
                          className="text-blue-600 hover:underline"
                        >
                          All Clients
                        </button>
                        <span className="mx-2 text-slate-400">&gt;</span>
                        <span className="text-slate-900">
                          {metricFilter === "overdue" && "Clients with Overdue Invoices"}
                          {metricFilter === "outstanding" && "Clients with Outstanding Invoices"}
                          {metricFilter === "draft" && "Clients with Invoices in Draft"}
                        </span>
                      </>
                    )}
                  </h3>
                )}
              </div>

              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table / empty state */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No clients found.{" "}
                {metricFilter !== "all" ? (
                  <button
                    onClick={() => setMetricFilter("all")}
                    className="text-blue-600 hover:underline"
                  >
                    Clear filter
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate("clients-new")}
                    className="text-blue-600 hover:underline"
                  >
                    Create your first client
                  </button>
                )}
              </div>
            ) : (
              <>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="pb-3 text-left font-medium text-slate-600 w-10">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleAllClients}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="pb-3 text-left font-medium text-slate-600">
                        Client Name / Primary Contact
                      </th>
                      <th className="pb-3 text-left font-medium text-slate-600">
                        Internal Note
                      </th>
                      <th className="pb-3 text-left font-medium text-slate-600">
                        Credit
                      </th>
                      <th className="pb-3 text-right font-medium text-slate-600">
                        {metricFilter === "overdue"
                          ? "Total Overdue"
                          : metricFilter === "draft"
                            ? "Total In Draft"
                            : "Total Outstanding"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((client) => {
                      const amount =
                        metricFilter === "overdue"
                          ? client.overdueBalance || 0
                          : metricFilter === "draft"
                            ? client.draftBalance || 0
                            : client.outstandingBalance || 0;

                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() =>
                            onNavigate(`client-detail-${client.id}`)
                          }
                        >
                          <td
                            className="py-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => toggleClient(client.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-4">
                            <div>
                              <div className="font-medium text-slate-900">
                                {client.name}
                              </div>
                              {client.companyName && (
                                <div className="text-xs text-slate-500">
                                  {client.companyName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-slate-600">
                            {client.email || "—"}
                          </td>
                          <td className="py-4 text-slate-600">—</td>
                          <td className="py-4 text-right font-medium text-slate-900">
                            {amount > 0
                              ? `${formatCurrency(amount, "USD")} USD`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total row when filter is active */}
                {metricFilter !== "all" && (
                  <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-end">
                    <div className="text-sm font-semibold text-slate-900">
                      {metricFilter === "overdue" && `Total Overdue: ${formatCurrency(totalOverdue, "USD")}`}
                      {metricFilter === "outstanding" && `Total Outstanding: ${formatCurrency(totalOutstanding, "USD")}`}
                      {metricFilter === "draft" && `Total In Draft: ${formatCurrency(totalDraft, "USD")}`}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                  <span className="text-sm text-slate-900">
                    {data &&
                      `${data.page * data.pageSize - data.pageSize + 1}–${Math.min(
                        data.page * data.pageSize,
                        data.totalItems
                      )} of ${data.totalItems}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      Items per page:
                    </span>
                    <select className="border border-slate-300 text-slate-600 rounded-md px-2 py-1 text-sm">
                      <option value="30">30</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}