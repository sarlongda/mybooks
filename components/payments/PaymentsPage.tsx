'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Check, X, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  client_company: string;
  total: number;
  amount_paid: number;
  status: string;
}

interface PaymentListResponse {
  items: Payment[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Check',
  'Cash',
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Venmo',
  'Wire Transfer',
  'Other',
];

export function PaymentsPage() {
  const [data, setData] = useState<PaymentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1); // TODO: wire real pagination later
  const [activeTab, setActiveTab] = useState<'invoice' | 'checkout' | 'other'>(
    'invoice'
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    amount: 0,
    notes: '',
  });

  // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  useEffect(() => {
    if (showAddForm) {
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm, invoiceSearch]);

  async function fetchPayments() {
    // if (!baseUrl || !anonKey) {
    //   console.error('Missing Supabase env vars');
    //   setLoading(false);
    //   return;
    // }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '30',
      });
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(
        // `${baseUrl}/functions/v1/payments?${params}`,
        `/api/payments?${params}`,
        {
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvoices() {
    // if (!baseUrl || !anonKey) return;

    try {
      const params = new URLSearchParams({
        pageSize: '100',
      });
      if (invoiceSearch) {
        params.append('q', invoiceSearch);
      }

      const response = await fetch(
        // `${baseUrl}/functions/v1/invoices?${params}`,
        `api/invoices?${params}`,
        {
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();

      const invoiceList: Invoice[] = result.items.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoiceNumber,
        client_id: inv.clientId,
        client_name: inv.clientName,
        client_company: inv.clientCompany,
        total: inv.total,
        amount_paid: inv.amountPaid || 0,
        status: inv.status,
      }));

      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }

  async function handleSubmitPayment() {
    if (!formData.invoiceId || !formData.amount) {
      alert('Please select an invoice and enter an amount');
      return;
    }

    // if (!baseUrl || !anonKey) {
    //   alert('Server configuration error');
    //   return;
    // }

    try {
      // const response = await fetch(`${baseUrl}/functions/v1/payments`, {
      const response = await fetch(`api/payments`, {
        method: 'POST',
        headers: {
          // Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddForm(false);
        resetForm();
        fetchPayments();
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment');
    }
  }

  function resetForm() {
    setFormData({
      invoiceId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      amount: 0,
      notes: '',
    });
    setSelectedInvoice(null);
    setInvoiceSearch('');
  }

  function handleInvoiceSelect(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setFormData(current => ({
      ...current,
      invoiceId: invoice.id,
      amount: invoice.total - invoice.amount_paid,
    }));
    setInvoiceSearch('');
  }

  function handleCancelAdd() {
    setShowAddForm(false);
    resetForm();
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
      <div className="space-y-6 p-8 max-w-[1400px] mx-auto text-slate-700">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">Payments</h1>
          <button className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">
            More Actions
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invoice'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoice Payments
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'checkout'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Checkout Link Payments
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'other'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Other Income
          </button>
        </div>

        {/* Main content */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              All Invoice Payments
              <button
                onClick={() => setShowAddForm(true)}
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

          {data && data.items.length === 0 && !showAddForm ? (
            <div className="text-center py-12 text-slate-500 bg-white border border-slate-200 rounded-lg">
              No payments recorded.{' '}
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:underline"
              >
                Record your first payment
              </button>
            </div>
          ) : (
            data && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Client / Invoice Number
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Payment Method / Internal Notes
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-slate-600">
                        Amount / Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Inline add form row */}
                    {showAddForm && (
                      <tr className="border-b-4 border-green-500 bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="relative">
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                              Invoice
                            </label>
                            {selectedInvoice ? (
                              <div className="text-sm">
                                <div className="font-medium text-slate-900">
                                  {selectedInvoice.client_name ||
                                    selectedInvoice.client_company}
                                </div>
                                <div className="text-xs text-blue-600">
                                  {selectedInvoice.invoice_number}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedInvoice(null);
                                    setFormData(current => ({
                                      ...current,
                                      invoiceId: '',
                                    }));
                                  }}
                                  className="text-xs text-slate-500 hover:text-slate-700 mt-1"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="text"
                                  value={invoiceSearch}
                                  onChange={e =>
                                    setInvoiceSearch(e.target.value)
                                  }
                                  placeholder="Type to add an Invoice"
                                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {invoiceSearch && invoices.length > 0 && (
                                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {invoices.map(inv => (
                                      <button
                                        key={inv.id}
                                        type="button"
                                        onClick={() => handleInvoiceSelect(inv)}
                                        className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                                      >
                                        <div className="font-medium">
                                          {inv.client_name ||
                                            inv.client_company}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {inv.invoice_number} -{' '}
                                          {formatCurrency(
                                            inv.total - inv.amount_paid,
                                            'USD'
                                          )}{' '}
                                          due
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Payment Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={formData.paymentDate}
                              onChange={e =>
                                setFormData(current => ({
                                  ...current,
                                  paymentDate: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Payment Method
                          </label>
                          <select
                            value={formData.paymentMethod}
                            onChange={e =>
                              setFormData(current => ({
                                ...current,
                                paymentMethod: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {PAYMENT_METHODS.map(method => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={formData.notes}
                            onChange={e =>
                              setFormData(current => ({
                                ...current,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Notes (Optional)"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <label className="block text-xs font-medium text-slate-700 mb-1.5 text-right">
                            Amount (USD)
                          </label>
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={e =>
                              setFormData(current => ({
                                ...current,
                                amount:
                                  parseFloat(e.target.value || '0') || 0,
                              }))
                            }
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              type="button"
                              onClick={handleSubmitPayment}
                              className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelAdd}
                              className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Existing payments rows */}
                    {data.items.map(payment => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {payment.clientName || payment.clientCompany}
                          </div>
                          <div className="text-xs text-blue-600">
                            {payment.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {new Date(
                            payment.paymentDate
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {payment.paymentMethod}
                          </div>
                          {payment.notes && (
                            <div className="text-xs text-slate-500 mt-1">
                              {payment.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-slate-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            Paid
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.items.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                    <span className="text-sm text-slate-600">
                      {data.page * data.pageSize - data.pageSize + 1}–
                      {Math.min(
                        data.page * data.pageSize,
                        data.totalItems
                      )}{' '}
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
                )}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
