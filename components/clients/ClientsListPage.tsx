import { useState, useEffect } from "react";
import { ClientListResponse } from "@/lib/types/clients";
import { formatCurrency } from "@/lib/utils/formatters";
import { Search, Mail, Phone } from "lucide-react";

interface ClientsListPageProps {
  onNavigate: (path: string) => void;
}

export function ClientsListPage({ onNavigate }: ClientsListPageProps) {
  const [data, setData] = useState<ClientListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"clients" | "sent">("clients");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

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

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!baseUrl || !anonKey) {
        console.error("Supabase env vars are missing");
        return;
      }

      const response = await fetch(
        // `${baseUrl}/functions/v1/clients?${params.toString()}`,
        `/api/clients?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            "Content-Type": "application/json",
          },
        }
      );
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

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (!data?.items) return;
    if (selectedClients.length === data.items.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(data.items.map((c) => c.id));
    }
  };

  const totalOverdue =
    data?.items.reduce((sum, client) => sum + client.outstandingBalance, 0) ||
    0;
  const totalOutstanding = totalOverdue;
  const totalDraft = 0;

  const recentlyActive = data?.items.slice(0, 4) || [];

  function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
      <div className="space-y-6 p-8 max-w-[1400px] mx-auto">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Clients</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              More Actions
            </button>
            <button
              onClick={() => onNavigate("clients-new")}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              New Client
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border-t-4 border-slate-400 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalOverdue, "USD")}
            </div>
            <div className="text-sm text-slate-600 mt-1">overdue</div>
          </div>
          <div className="bg-white border-t-4 border-blue-500 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalOutstanding, "USD")}
            </div>
            <div className="text-sm text-slate-600 mt-1">total outstanding</div>
          </div>
          <div className="bg-white border-t-4 border-slate-300 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalDraft, "USD")}
            </div>
            <div className="text-sm text-slate-600 mt-1">in draft</div>
          </div>
        </div>

        {recentlyActive.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Recently Active
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyActive.map((client) => (
                <div
                  key={client.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigate(`client-detail-${client.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
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
                      {client.email && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
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
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                All Clients
              </h3>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {data && data.items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No clients found.{" "}
                <button
                  onClick={() => onNavigate("clients-new")}
                  className="text-blue-600 hover:underline"
                >
                  Create your first client
                </button>
              </div>
            ) : (
              data && (
                <>
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="pb-3 text-left font-medium text-slate-600 w-10">
                          <input
                            type="checkbox"
                            checked={
                              !!data.items.length &&
                              selectedClients.length === data.items.length
                            }
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
                          Total Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map((client) => (
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
                            {client.outstandingBalance > 0
                              ? `${formatCurrency(
                                client.outstandingBalance,
                                "USD"
                              )} USD`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-600">
                      {data.page * data.pageSize - data.pageSize + 1}–
                      {Math.min(
                        data.page * data.pageSize,
                        data.totalItems
                      )}{" "}
                      of {data.totalItems}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">
                        Items per page:
                      </span>
                      <select className="border border-slate-300 rounded-md px-2 py-1 text-sm">
                        <option value="30">30</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
