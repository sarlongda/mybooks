// components/invoices/InvoiceDetail.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Mail, Download, FileText, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { supabase } from '@/lib/supabase';

interface InvoiceDetailProps {
  invoiceId: string;
}

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  line_total: number;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  visibility_type: 'always_viewable' | 'locked_until_paid';
  uploaded_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  currency: string;
  notes?: string;
  terms?: string;
  reference?: string;
  client?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    postal?: string;
  };
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function fetchInvoice() {
    try {
      setLoading(true);
      setError('');

      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   throw new Error(
      //     'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      //   );
      // }

      const response = await fetch(
        // `${baseUrl}/functions/v1/invoices/${invoiceId}`,
        `/api/invoices/${invoiceId}`,
        {
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);
      setLineItems(data.lineItems || []);
      setAttachments(data.attachments || []);
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      setError(err.message || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   alert('Server configuration error.');
      //   return;
      // }

      const response = await fetch(
        // `${baseUrl}/functions/v1/invoices/${invoiceId}`,
        `/api/invoices/${invoiceId}`,
        {
          method: 'DELETE',
          // headers: {
          //   Authorization: `Bearer ${anonKey}`,
          // },
        }
      );

      if (response.ok) {
        router.push('/invoices');
      } else {
        const body = await response.json().catch(() => ({}));
        alert(
          `Failed to delete invoice: ${body.error || 'Unknown server error'}`
        );
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice. Please try again.');
    }
  }

  function getStatusColor(status: string): string {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'OVERDUE') return 'bg-red-100 text-red-800';
    if (status === 'SENT') return 'bg-yellow-100 text-yellow-800';
    return 'bg-slate-100 text-slate-800';
  }

  async function handleSendEmail() {
    if (!invoice?.client?.email) {
      alert('Client email is missing. Please add an email address to the client.');
      return;
    }

    try {
      setSendingEmail(true);

      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   alert('Server configuration error.');
      //   return;
      // }

      const response = await fetch(
        // `${baseUrl}/functions/v1/send-invoice-email`,
        `/api/send-invoice-email`,
        {
          method: 'POST',
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoiceId }),
        }
      );

      if (response.ok) {
        alert('Invoice sent successfully!');
        router.push(`/invoices`);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to send invoice: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setDownloadingPdf(true);

      // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // if (!baseUrl || !anonKey) {
      //   alert('Server configuration error.');
      //   return;
      // }

      // const response = await fetch(
      //   // `${baseUrl}/functions/v1/generate-invoice-pdf`,
      //   `/api/generate-invoice-pdf`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       // Authorization: `Bearer ${anonKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({ invoiceId }),
      //   }
      // );

      const response = await fetch(
        `/api/generate-invoice-pdf?invoiceId=${invoiceId}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice?.invoice_number || invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`Failed to generate PDF: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function downloadAttachment(attachment: Attachment) {
    const isLocked =
      attachment.visibility_type === 'locked_until_paid' &&
      invoice?.status !== 'PAID';

    if (isLocked) {
      alert('This file is locked until the invoice is paid.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('invoice-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      alert('Failed to download attachment.');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <section className="space-y-4 p-6">
        <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
      </section>
    );
  }

  if (error || !invoice) {
    return (
      <section className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Invoice not found'}</p>
        </div>
        <button
          onClick={() => router.push('/invoices')}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Invoices
        </button>
      </section>
    );
  }

  const amountDue = invoice.total - invoice.amount_paid;

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/invoices')}
              className="text-blue-600 hover:underline text-sm mb-2"
            >
              ← Back to Invoices
            </button>
            <h1 className="text-3xl font-bold text-slate-900">
              Invoice {invoice.invoice_number}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/invoices/${invoiceId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              {sendingEmail ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Generating...' : 'Download Full Invoice'}
            </button>
          </div>
        </div>

        {/* Invoice card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          {/* Header row */}
          <div className="flex justify-between mb-8">
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                Invoice
              </div>
              <div className="text-slate-600">#{invoice.invoice_number}</div>
              {invoice.reference && (
                <div className="text-sm text-slate-500 mt-1">
                  Ref: {invoice.reference}
                </div>
              )}
            </div>
            <div
              className={`inline-block px-4 py-2 rounded-lg font-semibold ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </div>
          </div>

          {/* Bill to & dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Bill To:
              </div>
              <div className="text-slate-700">
                <div className="font-medium">
                  {invoice.client?.name || '—'}
                </div>
                {invoice.client?.company && (
                  <div>{invoice.client.company}</div>
                )}
                {invoice.client?.email && (
                  <div className="text-sm">{invoice.client.email}</div>
                )}
                {invoice.client?.address_line1 && (
                  <div className="text-sm mt-2">
                    <div>{invoice.client.address_line1}</div>
                    {(invoice.client.city || invoice.client.state) && (
                      <div>
                        {invoice.client.city && `${invoice.client.city}, `}
                        {invoice.client.state} {invoice.client.postal}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-600">Issue Date: </span>
                  <span className="font-medium">
                    {new Date(invoice.issue_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Due Date: </span>
                  <span className="font-medium">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-3 text-left font-semibold text-slate-700">
                    Description
                  </th>
                  <th className="pb-3 text-right font-semibold text-slate-700 w-24">
                    Rate
                  </th>
                  <th className="pb-3 text-right font-semibold text-slate-700 w-20">
                    Qty
                  </th>
                  <th className="pb-3 text-right font-semibold text-slate-700 w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="py-4 text-slate-900">
                      {item.description || '—'}
                    </td>
                    <td className="py-4 text-right text-slate-700">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="py-4 text-right text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right font-medium text-slate-900">
                      {formatCurrency(item.line_total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(invoice.discount, invoice.currency)}
                  </span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.tax, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-3 border-t">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Paid</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(invoice.amount_paid, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-slate-300">
                <span>Amount Due</span>
                <span>{formatCurrency(amountDue, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes, terms, attachments */}
          {(invoice.notes || invoice.terms || attachments.length > 0) && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              {invoice.notes && (
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-2">
                    Notes
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">
                    {invoice.notes}
                  </div>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-2">
                    Terms
                  </div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">
                    {invoice.terms}
                  </div>
                </div>
              )}
              {attachments.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-3">
                    Attachments
                  </div>
                  <div className="space-y-2">
                    {attachments.map(attachment => {
                      const isLocked =
                        attachment.visibility_type ===
                        'locked_until_paid' && invoice.status !== 'PAID';
                      return (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => downloadAttachment(attachment)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isLocked ? (
                              <Lock className="w-5 h-5 text-slate-400" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-600" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {attachment.file_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatFileSize(attachment.file_size)}
                                {isLocked && ' • Locked until paid'}
                              </div>
                            </div>
                          </div>
                          {!isLocked && (
                            <Download className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Note: Click &quot;Download Full Invoice&quot; above to
                    download a PDF with attachment previews.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
