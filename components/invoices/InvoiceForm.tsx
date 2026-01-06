'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Trash2, ChevronRight } from 'lucide-react';
import { InvoiceAttachments } from '@/components/InvoiceAttachments';
import { formatCurrency } from '@/lib/utils/formatters';

interface InvoiceFormProps {
  mode: 'create' | 'edit';
  invoiceId?: string;
}

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  lineTotal: number;
}

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  visibility_type: 'always_viewable' | 'locked_until_paid';
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal?: string;
}

export function InvoiceForm({ mode, invoiceId }: InvoiceFormProps) {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reference, setReference] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', rate: 0, quantity: 1, lineTotal: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, invoiceId]);

  async function init() {
    try {
      setInitialLoading(true);
      await fetchClients();

      if (mode === 'edit' && invoiceId) {
        await fetchInvoice();
      } else {
        generateInvoiceNumber();
      }
    } finally {
      setInitialLoading(false);
    }
  }

  async function fetchClients() {
    // if (!baseUrl || !anonKey) {
    //   console.error(
    //     'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    //   );
    //   return;
    // }

    try {
      // const response = await fetch(
      //   `${baseUrl}/functions/v1/clients?pageSize=100`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${anonKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      const response = await fetch(`/api/clients?pageSize=100`);
      const data = await response.json();
      setClients(data.items || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }

  async function fetchInvoice() {
    // if (!baseUrl || !anonKey || !invoiceId) return;

    try {
      // const response = await fetch(
      //   `${baseUrl}/functions/v1/invoices/${invoiceId}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${anonKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      const response = await fetch(`/api/invoices/${invoiceId}`)
      const data = await response.json();

      if (data.invoice) {
        setSelectedClientId(data.invoice.client_id);
        setInvoiceNumber(data.invoice.invoice_number);
        setIssueDate(data.invoice.issue_date);
        setDueDate(data.invoice.due_date);
        setReference(data.invoice.reference || '');
        setDiscount(data.invoice.discount || 0);
        setTax(data.invoice.tax || 0);
        setAmountPaid(data.invoice.amount_paid || 0);
        setNotes(data.invoice.notes || '');
        setTerms(data.invoice.terms || '');

        if (data.lineItems && data.lineItems.length > 0) {
          setLineItems(
            data.lineItems.map((item: any) => ({
              id: item.id,
              description: item.description,
              rate: item.rate,
              quantity: item.quantity,
              lineTotal: item.line_total,
            }))
          );
        }

        if (data.attachments) {
          setAttachments(data.attachments);
        }
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice');
    }
  }

  function generateInvoiceNumber() {
    const num = Math.floor(Math.random() * 900000) + 100000;
    setInvoiceNumber(`000${num}`);
  }

  function addLineItem() {
    const newId = (
      Math.max(...lineItems.map(item => parseInt(item.id, 10)), 0) + 1
    ).toString();

    setLineItems([
      ...lineItems,
      { id: newId, description: '', rate: 0, quantity: 1, lineTotal: 0 },
    ]);
  }

  function removeLineItem(id: string) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  }

  function updateLineItem(id: string, field: keyof LineItem, value: any) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated: LineItem = { ...item, [field]: value };
        if (field === 'rate' || field === 'quantity') {
          updated.lineTotal = updated.rate * updated.quantity;
        }
        return updated;
      })
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal - discount + tax;
  const amountDue = total - amountPaid;

  const selectedClient = clients.find(c => c.id === selectedClientId);

  async function handleSubmit() {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }

    // if (!baseUrl || !anonKey) {
    //   setError(
    //     'Server configuration error: missing Supabase environment variables.'
    //   );
    //   return;
    // }

    setLoading(true);
    setError('');

    try {
      const payload = {
        clientId: selectedClientId,
        invoiceNumber,
        issueDate,
        dueDate,
        reference,
        subtotal,
        tax,
        discount,
        total,
        amountPaid,
        currency: 'USD',
        status: 'DRAFT',
        notes,
        terms,
        lineItems: lineItems.map(item => ({
          description: item.description,
          rate: item.rate,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      };

      const url =
        mode === 'create'
          // ? `${baseUrl}/functions/v1/invoices`
          // : `${baseUrl}/functions/v1/invoices/${invoiceId}`;
          ? `/api/invoices`
          : `/api/invoices/${invoiceId}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: {
          // Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save invoice');
      }

      const result = await response.json();
      const newId = result.id || invoiceId;

      router.push(`/invoices/${newId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <section className="space-y-4 p-6">
        <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === 'create' ? 'New Invoice' : 'Edit Invoice'}
          </h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/invoices')}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Send To...
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              {/* Client selection */}
              <div className="mb-8">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  Billed To
                </div>
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}{' '}
                      {client.company ? `- ${client.company}` : ''}
                    </option>
                  ))}
                </select>
                {selectedClient && (
                  <div className="mt-2 text-sm text-slate-600">
                    {selectedClient.address_line1 && (
                      <div>{selectedClient.address_line1}</div>
                    )}
                    {(selectedClient.city || selectedClient.state) && (
                      <div>
                        {selectedClient.city && `${selectedClient.city}, `}
                        {selectedClient.state} {selectedClient.postal}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/clients/${selectedClientId}/edit`)
                      }
                      className="text-blue-600 hover:underline mt-1"
                    >
                      Edit Client
                    </button>
                  </div>
                )}
              </div>

              {/* Invoice meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Date of Issue
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Enter value (e.g. PO #)"
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="border-t border-slate-200 text-slate-700 pt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left font-medium text-slate-700 w-8" />
                      <th className="pb-3 text-left font-medium text-slate-700">
                        Description
                      </th>
                      <th className="pb-3 text-right font-medium text-slate-700 w-24">
                        Rate
                      </th>
                      <th className="pb-3 text-right font-medium text-slate-700 w-20">
                        Qty
                      </th>
                      <th className="pb-3 text-right font-medium text-slate-700 w-32">
                        Line Total
                      </th>
                      <th className="pb-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 text-slate-400">•</td>
                        <td className="py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={e =>
                              updateLineItem(
                                item.id,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Enter an Item Name"
                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={e =>
                              updateLineItem(
                                item.id,
                                'rate',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm text-right"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e =>
                              updateLineItem(
                                item.id,
                                'quantity',
                                parseFloat(e.target.value) || 1
                              )
                            }
                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm text-right"
                            step="1"
                          />
                        </td>
                        <td className="py-3 text-right font-medium">
                          {formatCurrency(item.lineTotal, 'USD')}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add a Line
                </button>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 mt-8 pt-6">
                <div className="flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(subtotal, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Add a Discount
                      </button>
                      <input
                        type="number"
                        value={discount}
                        onChange={e =>
                          setDiscount(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 border border-slate-300 text-slate-700 rounded px-2 py-1 text-right text-sm"
                        step="0.01"
                      />
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-slate-600">Tax</span>
                      <input
                        type="number"
                        value={tax}
                        onChange={e =>
                          setTax(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 border border-slate-300 text-slate-700 rounded px-2 py-1 text-right text-sm"
                        step="0.01"
                      />
                    </div>
                    <div className="flex justify-between text-base text-slate-700 font-semibold pt-3 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(total, 'USD')}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-slate-600">Amount Paid</span>
                      <input
                        type="number"
                        value={amountPaid}
                        onChange={e =>
                          setAmountPaid(parseFloat(e.target.value) || 0)
                        }
                        className="w-24 border border-slate-300 text-slate-700 rounded px-2 py-1 text-right text-sm"
                        step="0.01"
                      />
                    </div>
                    <div className="flex justify-between text-lg text-slate-700 font-bold pt-3 border-t-2 border-slate-300">
                      <span>Amount Due (USD)</span>
                      <span>{formatCurrency(amountDue, 'USD')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & terms */}
              <div className="border-t border-slate-200 mt-8 pt-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter notes (optional)"
                    rows={3}
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Terms
                  </label>
                  <textarea
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    placeholder="Enter payment terms"
                    rows={4}
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Attachments */}
              <InvoiceAttachments
                invoiceId={invoiceId}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          </div>

          {/* Right side settings panel */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  For This Invoice
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                <button
                  type="button"
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-900">
                      Customize Invoice Style
                    </div>
                    <div className="text-xs text-slate-500">
                      Change Template, Color, and Font
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                <button
                  type="button"
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-slate-900">
                      Make Recurring
                    </div>
                    <div className="text-xs text-slate-500">
                      Bill your clients automatically
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                {selectedClient && (
                  <>
                    <div className="px-6 py-3 bg-slate-50">
                      <div className="text-xs font-semibold text-slate-600">
                        For {selectedClient.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          Send Reminders
                          <span className="text-xs font-semibold text-slate-600">
                            NO
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          At Customizable Intervals
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          Charge Late Fees
                          <span className="text-xs font-semibold text-slate-600">
                            NO
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Percentage or Flat-Rate Fees
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-900">
                          Currency &amp; Language
                        </div>
                        <div className="text-xs text-slate-500">
                          USD, English (United States)
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          Invoice Attachments
                          <span className="text-xs font-semibold text-slate-600">
                            NO
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Attach PDF copy to emails
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
