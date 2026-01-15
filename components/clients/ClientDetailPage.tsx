// components/clients/ClientDetailPage.tsx
import { useState, useEffect } from "react";
import { ClientDetailResponse } from "@/lib/types/clients";
import { formatCurrency } from "@/lib/utils/formatters";
import { InvoiceModal } from "@/components/InvoiceModal";
import { ExpenseModal } from "@/components/ExpenseModal";
import {
  ChevronLeft,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Edit,
  FileText,
  Archive,
  Trash2,
  Receipt,
  Wallet,
  Lightbulb,
  Plus,
  Filter,
  Clock,
} from "lucide-react";

interface ClientDetailPageProps {
  clientId: string;
  onNavigate: (path: string) => void;
}

type MainTabType = "overview" | "relationship";
type SubTabType =
  | "invoices"
  | "recurring"
  | "contacts"
  | "retainer"
  | "credits"
  | "checkout"
  | "expenses"
  | "estimates";

export function ClientDetailPage({ clientId, onNavigate }: ClientDetailPageProps) {
  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTabType>("overview");
  const [subTab, setSubTab] = useState<SubTabType>("invoices");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOverdueTooltip, setShowOverdueTooltip] = useState(false);

  // relationship state
  const [relationshipDraft, setRelationshipDraft] = useState("");
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [savingRelationship, setSavingRelationship] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function fetchClient() {
    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!baseUrl || !anonKey) {
        console.error("Supabase env vars are missing");
        return;
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }

      const result: ClientDetailResponse = await response.json();
      setData(result);

      // initialise relationship notes from API
      const apiNotes = (result.client as any)?.notes ?? "";
      setRelationshipDraft(apiNotes || "");
      setRelationshipError("");
      setIsEditingRelationship(false);
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function handleMoreAction(action: string) {
    setShowMoreActions(false);
    switch (action) {
      case "edit":
        onNavigate(`client-edit-${clientId}`);
        break;
      case "statement":
        alert("Generate Statement functionality coming soon");
        break;
      case "archive":
        alert("Archive client functionality coming soon");
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this client?")) {
          alert("Delete client functionality coming soon");
        }
        break;
      default:
        break;
    }
  }

  function handleCreateNew(type: string) {
    setShowCreateNew(false);
    switch (type) {
      case "invoice":
        setShowInvoiceModal(true);
        break;
      case "expense":
        setShowExpenseModal(true);
        break;
      case "proposal":
        alert("Create Proposal functionality coming soon");
        break;
      default:
        break;
    }
  }

  function handleModalSuccess() {
    fetchClient();
  }


  // save relationship notes → PATCH /api/clients/:id with { notes }
  async function handleSaveRelationship() {
    if (!data) return;
    try {
      setSavingRelationship(true);
      setRelationshipError("");

      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: relationshipDraft }),
      });

      if (!res.ok) {
        throw new Error("Failed to save relationship notes");
      }

      const result = await res.json();

      // keep local client in sync
      setData((prev) =>
        prev
          ? ({
            ...prev,
            client: {
              ...(prev.client as any),
              ...(result.client || {}),
            },
          } as any)
          : prev
      );

      setIsEditingRelationship(false);
    } catch (err: any) {
      console.error("Save relationship error", err);
      setRelationshipError(
        err?.message || "Failed to save relationship notes"
      );
    } finally {
      setSavingRelationship(false);
    }
  }

  if (loading || !data) {
    return (
      <section className="space-y-4 p-6">
        <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
      </section>
    );
  }

  // ----- SAFE NORMALIZATION LAYER -----
  const { client, summary } = data;

  // Support both Bolt-style summary and new Prisma-style invoiceStats
  const invoiceStats = (summary as any)?.invoiceStats ?? {};
  const outstandingRevenue =
    (summary as any)?.outstandingBalance ??
    invoiceStats.openAmount ??
    0;
  const overdueBalance =
    (summary as any)?.overdueBalance ??
    invoiceStats.overdueAmount ??
    0;

  const maxValue = Math.max(outstandingRevenue || 0, 100);
  const overduePercentage =
    maxValue > 0 ? (overdueBalance / maxValue) * 100 : 0;

  // Support both `data.invoices` (Bolt) and `data.recentInvoices` (our API)
  const invoices =
    (data as any).invoices ??
    (data as any).recentInvoices ??
    [];

  // Normalize client address fields (Bolt vs new API)
  const clientAddressLine1 =
    (client as any).addressLine1 ??
    "";
  const clientAddressLine2 =
    (client as any).addressLine2 ??
    "";
  const clientCity = (client as any).city ?? "";
  const clientState = (client as any).state ?? "";
  const clientPostalCode =
    (client as any).postalCode ??
    "";
  const clientCountry = (client as any).country ?? "";
  const clientCurrency = (client as any).currency ?? "USD";

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="space-y-4 p-8 max-w-[1132px] mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("clients")}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Clients
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900">
              {client.name}
            </h1>
            <button className="p-1.5 hover:bg-slate-100 rounded">
              <Filter className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
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
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => handleMoreAction("edit")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Client
                    </button>
                    <button
                      onClick={() => handleMoreAction("statement")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Statement
                    </button>
                    <button
                      onClick={() => handleMoreAction("archive")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <button
                      onClick={() => handleMoreAction("delete")}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCreateNew(!showCreateNew)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                Create New ...
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCreateNew && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCreateNew(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => handleCreateNew("invoice")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Receipt className="w-4 h-4" />
                      Invoice
                    </button>
                    <button
                      onClick={() => handleCreateNew("expense")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Wallet className="w-4 h-4" />
                      Expense
                    </button>
                    <button
                      onClick={() => handleCreateNew("proposal")}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Proposal
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setMainTab("overview")}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${mainTab === "overview"
              ? "text-white bg-blue-600"
              : "text-slate-700 bg-white hover:bg-slate-100"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setMainTab("relationship")}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${mainTab === "relationship"
              ? "text-white bg-blue-600"
              : "text-slate-700 bg-white hover:bg-slate-100"
              }`}
          >
            Relationship
          </button>
        </div>

        {mainTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-4 border-indigo-100">
                      {getInitials(client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 mb-3">
                        {client.name}
                      </h2>
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.mobilePhone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>Mobile: {client.mobilePhone}</span>
                        </div>
                      )}
                      {client.businessPhone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>Business: {client.businessPhone}</span>
                        </div>
                      )}
                      {(clientAddressLine1 || clientAddressLine2 || clientCity || clientPostalCode) && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            {clientAddressLine1 && <div>{clientAddressLine1}</div>}
                            {clientAddressLine2 && <div>{clientAddressLine2}</div>}
                            <div>
                              {clientCity && `${clientCity}, `}
                              {clientState} {clientPostalCode}
                            </div>
                            {clientCountry && <div>{clientCountry}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      Payment Options
                    </h3>
                    <button className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-sm text-white flex items-center justify-center transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div> */}
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">
                    Outstanding Revenue
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(outstandingRevenue, clientCurrency)}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>0</span>
                    <span>500</span>
                    <span>1k</span>
                    <span>1.5k</span>
                  </div>
                  <div className="relative h-8 bg-gradient-to-r from-pink-200 to-pink-300 rounded overflow-hidden">
                    {overdueBalance > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-pink-400 to-red-400 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          width: `${Math.min(overduePercentage, 100)}%`,
                        }}
                        onMouseEnter={() => setShowOverdueTooltip(true)}
                        onMouseLeave={() => setShowOverdueTooltip(false)}
                      >
                        {showOverdueTooltip && overdueBalance > 0 && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-24 bg-slate-900 text-white p-4 rounded-lg shadow-xl z-30 min-w-[200px]">
                            <div className="text-xs font-semibold mb-2">
                              {
                                (invoices ?? []).filter(
                                  (inv: any) => inv.status === "OVERDUE"
                                ).length
                              }{" "}
                              Overdue Invoice
                            </div>
                            <div className="text-lg font-bold mb-1">
                              {formatCurrency(overdueBalance, clientCurrency)}
                            </div>
                            <button
                              onClick={() => setSubTab("invoices")}
                              className="text-xs text-blue-300 hover:text-blue-200 underline"
                            >
                              View Invoices
                            </button>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-400 to-red-400 rounded-sm" />
                  <span className="text-sm text-slate-600">
                    Overdue{" "}
                    <span className="font-semibold">
                      {formatCurrency(overdueBalance, clientCurrency)}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <Receipt className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(0, clientCurrency)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">in draft</div>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-slate-900">
                      0h 00m
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      unbilled time
                    </div>
                  </div>
                  <div className="text-center">
                    <Wallet className="w-6 h-6 text-slate-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(0, clientCurrency)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      unbilled expenses
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex gap-1 px-4 overflow-x-auto">
                  {(
                    [
                      { id: "invoices", label: "Invoices" },
                      { id: "recurring", label: "Recurring Templates" },
                      { id: "contacts", label: "Contacts" },
                      { id: "retainer", label: "Retainer" },
                      { id: "credits", label: "Credits" },
                      { id: "checkout", label: "Checkout Links" },
                      { id: "expenses", label: "Expenses" },
                      { id: "estimates", label: "Estimates" },
                    ] as Array<{ id: SubTabType; label: string }>
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSubTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${subTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {subTab === "invoices" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        Invoices for {client.name}
                        <button
                          onClick={() => handleCreateNew("invoice")}
                          className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-sm text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </h3>
                    </div>

                    {(invoices as any[]).length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        No invoices yet for this client.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="border-b border-slate-200">
                            <tr>
                              <th className="pb-3 pr-3 text-left font-medium text-slate-600">
                                <input
                                  type="checkbox"
                                  className="rounded border-slate-300"
                                />
                              </th>
                              <th className="pb-3 px-3 text-left font-medium text-slate-600">
                                Client / Invoice Number
                              </th>
                              <th className="pb-3 px-3 text-left font-medium text-slate-600">
                                Description
                              </th>
                              <th className="pb-3 px-3 text-left font-medium text-slate-600">
                                Issued Date / Due Date
                              </th>
                              <th className="pb-3 pl-3 text-right font-medium text-slate-600">
                                Amount / Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(invoices as any[]).map((invoice: any) => (
                              <tr key={invoice.id} className="hover:bg-slate-50">
                                <td className="py-4 pr-3">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300"
                                  />
                                </td>
                                <td className="py-4 px-3">
                                  <button
                                    onClick={() =>
                                      onNavigate(`invoice-detail-${invoice.id}`)
                                    }
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {client.name}
                                  </button>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {invoice.number}
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-slate-600">
                                  {invoice.notes || "—"}
                                </td>
                                <td className="py-4 px-3">
                                  <div className="text-slate-900 font-medium">
                                    {invoice.issueDate
                                      ? new Date(
                                        invoice.issueDate
                                      ).toLocaleDateString()
                                      : "—"}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {invoice.dueDate
                                      ? `Due ${new Date(
                                        invoice.dueDate
                                      ).toLocaleDateString()}`
                                      : "No due date"}
                                  </div>
                                </td>
                                <td className="py-4 pl-3 text-right">
                                  <div className="font-bold text-slate-900 mb-1">
                                    {formatCurrency(
                                      Number(invoice.total ?? 0),
                                      invoice.currency || clientCurrency
                                    )}
                                  </div>
                                  <div>
                                    <span
                                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded ${invoice.status === "PAID"
                                        ? "bg-green-100 text-green-700"
                                        : invoice.status === "OVERDUE"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                      {invoice.status === "SENT"
                                        ? "Viewed"
                                        : invoice.status}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                          <span className="text-sm text-slate-600">
                            1–{(invoices as any[]).length} of{" "}
                            {(invoices as any[]).length}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                              Items per page:
                            </span>
                            <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="30">30</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {subTab === "expenses" && (
                  <div className="text-center py-12 text-slate-500">
                    No expenses yet for this client.{" "}
                    <button
                      onClick={() => handleCreateNew("expense")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Create first expense
                    </button>
                  </div>
                )}

                {!["invoices", "expenses"].includes(subTab) && (
                  <div className="text-center py-12 text-slate-500">
                    {subTab.charAt(0).toUpperCase() + subTab.slice(1)} section
                    coming soon
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RELATIONSHIP TAB */}
        {mainTab === "relationship" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Relationship
            </h2>

            {relationshipError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {relationshipError}
              </div>
            )}

            {!isEditingRelationship ? (
              <button
                type="button"
                onClick={() => setIsEditingRelationship(true)}
                className="w-full text-left border border-dashed border-slate-300 rounded-md px-3 py-2 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {relationshipDraft ? (
                  <div className="flex items-center gap-2 text-slate-800">
                    <span>{relationshipDraft}</span>
                    <Edit className="w-4 h-4 text-slate-400" />
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm">
                    Add notes here (they will not be visible to your client).
                  </span>
                )}
              </button>
            ) : (
              <div>
                <textarea
                  value={relationshipDraft}
                  onChange={(e) => setRelationshipDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes here (they will not be visible to your client)."
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveRelationship}
                    disabled={savingRelationship}
                    className="px-4 py-1.5 text-sm font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingRelationship ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // reset to last saved value from data
                      const currentNotes =
                        ((data.client as any)?.notes as string) ?? "";
                      setRelationshipDraft(currentNotes);
                      setIsEditingRelationship(false);
                    }}
                    disabled={savingRelationship}
                    className="px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        clientId={clientId}
        clientName={client.name}
        clientEmail={client.email}
        clientAddress={clientAddressLine1}
        clientCity={clientCity}
        clientState={clientState}
        clientPostalCode={clientPostalCode}
        clientCountry={clientCountry}
        onSuccess={handleModalSuccess}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        clientId={clientId}
        clientName={client.name}
        onSuccess={handleModalSuccess}
      />
    </section>
  );
}
