// components/invoices/InvoicesList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  currency: string;
  createdAt: string;
}

interface InvoiceListResponse {
  items: Invoice[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function InvoicesList() {
  const router = useRouter();

  const [data, setData] = useState<InvoiceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'from-me' | 'to-me'>('from-me');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  async function fetchInvoices() {
    try {
      setLoading(true);

      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      //   setLoading(false);
      //   return;
      // }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '30',
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      // const response = await fetch(
      //   `${baseUrl}/functions/v1/invoices?${params.toString()}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${anonKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      const response = await fetch(`/api/invoices?${params.toString()}`);

      if (!response.ok) {
        console.error('Failed to fetch invoices', await response.text());
        setData(null);
        return;
      }

      const result = (await response.json()) as InvoiceListResponse;
      setData(result);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const toggleInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleAllInvoices = () => {
    if (!data) return;
    if (selectedInvoices.length === data.items.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(data.items.map(i => i.id));
    }
  };

  const overdueInvoices =
    data?.items.filter(
      inv =>
        inv.status === 'OVERDUE' ||
        (inv.status === 'SENT' && new Date(inv.dueDate) < new Date())
    ) || [];
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + (inv.total - inv.amountPaid),
    0
  );

  const outstandingInvoices =
    data?.items.filter(
      inv => inv.status === 'SENT' || inv.status === 'OVERDUE'
    ) || [];
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.total - inv.amountPaid),
    0
  );

  const draftInvoices =
    data?.items.filter(inv => inv.status === 'DRAFT') || [];
  const totalDraft = draftInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const recentlyUpdated = data?.items.slice(0, 6) || [];

  function getStatusColor(invoice: Invoice): string {
    if (invoice.status === 'PAID') return 'bg-green-100 text-green-800';
    if (
      invoice.status === 'OVERDUE' ||
      new Date(invoice.dueDate) < new Date()
    )
      return 'bg-red-100 text-red-800';
    if (invoice.status === 'SENT') return 'bg-yellow-100 text-yellow-800';
    return 'bg-slate-100 text-slate-800';
  }

  function getStatusText(invoice: Invoice): string {
    if (invoice.status === 'PAID') return 'Paid';
    if (
      invoice.status === 'OVERDUE' ||
      (invoice.status === 'SENT' && new Date(invoice.dueDate) < new Date())
    )
      return 'Overdue';
    if (invoice.status === 'SENT') return 'Sent';
    return 'Draft';
  }

  function getDaysOverdue(dueDate: string): string {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due 1 day ago';
    if (diffDays > 1) return `Due ${diffDays} days ago`;
    if (diffDays === -1) return 'Due in 1 day';
    return `Due in ${Math.abs(diffDays)} days`;
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
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Invoices</h1>
          <button
            onClick={() => router.push('/invoices/new')}
            className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            New Invoice
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('from-me')}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'from-me'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            From Me
          </button>
          <button
            onClick={() => setActiveTab('to-me')}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'to-me'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            To Me
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-t-4 border-slate-400 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalOverdue, 'USD')}
            </div>
            <div className="text-sm text-slate-600 mt-1">overdue</div>
          </div>
          <div className="bg-white border-t-4 border-blue-500 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalOutstanding, 'USD')}
            </div>
            <div className="text-sm text-slate-600 mt-1">total outstanding</div>
          </div>
          <div className="bg-white border-t-4 border-slate-300 shadow-sm p-6">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(totalDraft, 'USD')}
            </div>
            <div className="text-sm text-slate-600 mt-1">in draft</div>
          </div>
        </div>

        {/* Recently updated */}
        {recentlyUpdated.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Recently Updated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {recentlyUpdated.map(invoice => (
                <div
                  key={invoice.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <div className="text-sm text-slate-500 mb-1">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="font-semibold text-slate-900 mb-1 truncate">
                    {invoice.clientName || invoice.clientCompany}
                  </div>
                  <div className="text-xs text-slate-500 mb-3">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mb-2">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                  <div
                    className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                      invoice
                    )}`}
                  >
                    {getStatusText(invoice)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All invoices table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                All Invoices
                <button
                  onClick={() => router.push('/invoices/new')}
                  className="w-7 h-7 flex items-center justify-center bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </h3>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {data && data.items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No invoices found.{' '}
                <button
                  onClick={() => router.push('/invoices/new')}
                  className="text-blue-600 hover:underline"
                >
                  Create your first invoice
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
                              data.items.length > 0 &&
                              selectedInvoices.length === data.items.length
                            }
                            onChange={toggleAllInvoices}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="pb-3 text-left font-medium text-slate-600">
                          Client / Invoice Number
                        </th>
                        <th className="pb-3 text-left font-medium text-slate-600">
                          Description
                        </th>
                        <th className="pb-3 text-left font-medium text-slate-600">
                          Issued Date / Due Date
                        </th>
                        <th className="pb-3 text-right font-medium text-slate-600">
                          Amount / Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.items.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-slate-50">
                          <td className="py-4">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => toggleInvoice(invoice.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-4">
                            <button
                              onClick={() =>
                                router.push(`/invoices/${invoice.id}`)
                              }
                              className="text-left"
                            >
                              <div className="font-medium text-slate-900 hover:text-blue-600">
                                {invoice.clientName || invoice.clientCompany}
                              </div>
                              <div className="text-xs text-slate-500">
                                {invoice.invoiceNumber}
                              </div>
                            </button>
                          </td>
                          <td className="py-4 text-slate-600">—</td>
                          <td className="py-4">
                            <div className="text-slate-900">
                              {new Date(
                                invoice.issueDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {getDaysOverdue(invoice.dueDate)}
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <div className="font-medium text-slate-900">
                              {formatCurrency(
                                invoice.total,
                                invoice.currency
                              )}
                            </div>
                            <div
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                invoice
                              )}`}
                            >
                              {getStatusText(invoice)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-600">
                      {data.page * data.pageSize - data.pageSize + 1}–
                      {Math.min(data.page * data.pageSize, data.totalItems)} of{' '}
                      {data.totalItems}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-600">
                        Items per page:
                      </span>
                      <select
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                        defaultValue="30"
                      >
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
