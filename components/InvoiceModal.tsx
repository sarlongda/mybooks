// components/InvoiceModal.tsx
import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { InvoiceAttachments } from "@/components/InvoiceAttachments";
import { supabase } from "@/lib/supabase";

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    clientEmail?: string;
    clientAddress?: string;
    clientCity?: string;
    clientState?: string;
    clientPostalCode?: string;
    clientCountry?: string;
    onSuccess?: () => void;
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

interface ProjectType {
    id: string;
    name: string;
    description: string | null;
}

export function InvoiceModal({
    isOpen,
    onClose,
    clientId,
    clientName,
    clientEmail,
    clientAddress,
    clientCity,
    clientState,
    clientPostalCode,
    clientCountry,
    onSuccess
}: InvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [projectTypeId, setProjectTypeId] = useState('');
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');
    const [discount, setDiscount] = useState(0);
    const [tax, setTax] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', description: '', rate: 0, quantity: 1, lineTotal: 0 }
    ]);

    useEffect(() => {
        if (isOpen) {
            generateInvoiceNumber();
            fetchProjectTypes();
        }
    }, [isOpen]);

    async function fetchProjectTypes() {
        const { data, error } = await supabase
            .from('project_types')
            .select('id, name, description')
            .order('name');

        if (!error && data) {
            setProjectTypes(data);
        }
    }

    async function generateInvoiceNumber() {
        const num = Math.floor(Math.random() * 900000) + 100000;
        setInvoiceNumber(`000${num}`);
    }

    function addLineItem() {
        const newId = (Math.max(...lineItems.map(item => parseInt(item.id)), 0) + 1).toString();
        setLineItems([...lineItems, { id: newId, description: '', rate: 0, quantity: 1, lineTotal: 0 }]);
    }

    function removeLineItem(id: string) {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    }

    function updateLineItem(id: string, field: keyof LineItem, value: any) {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'rate' || field === 'quantity') {
                    updated.lineTotal = updated.rate * updated.quantity;
                }
                return updated;
            }
            return item;
        }));
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal - discount + tax;
    const amountDue = total - amountPaid;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // if (!baseUrl || !anonKey) {
            //     console.error("Supabase env vars are missing");
            //     alert("Server configuration error");
            //     setLoading(false);
            //     return;
            // }

            // const response = await fetch(`${baseUrl}/functions/invoices`, {
            const response = await fetch(`/api/invoices`, {
                method: "POST",
                headers: {
                    // Authorization: `Bearer ${anonKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        clientId,
                        invoiceNumber,
                        issueDate,
                        dueDate,
                        reference,
                        projectTypeId: projectTypeId || null,
                        subtotal,
                        discount,
                        tax,
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
                    }),
                }),
            });

            if (response.ok) {
                onSuccess?.();
                onClose();
                setInvoiceNumber('');
                setIssueDate(new Date().toISOString().split('T')[0]);
                setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                setReference('');
                setProjectTypeId('');
                setNotes('');
                setTerms('');
                setDiscount(0);
                setTax(0);
                setAmountPaid(0);
                setAttachments([]);
                setLineItems([{ id: '1', description: '', rate: 0, quantity: 1, lineTotal: 0 }]);
            } else {
                alert('Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Error creating invoice');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto">
            <div className="min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">New Invoice</h1>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
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
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                Send To...
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-8">
                                <div className="mb-8 flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-700 mb-2">Billed To</div>
                                        <div className="text-slate-900 font-semibold mb-1">{clientName}</div>
                                        {clientAddress && <div className="text-sm text-slate-600">{clientAddress}</div>}
                                        {(clientCity || clientState || clientPostalCode) && (
                                            <div className="text-sm text-slate-600">
                                                {clientCity && `${clientCity}, `}
                                                {clientState} {clientPostalCode}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-medium text-slate-700 mb-2">Amount Due (USD)</div>
                                        <div className="text-3xl font-bold text-slate-900">${amountDue.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Date of Issue
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={issueDate}
                                                onChange={(e) => setIssueDate(e.target.value)}
                                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Enter value (e.g. PO #)"
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Project Type
                                        </label>
                                        <select
                                            value={projectTypeId}
                                            onChange={(e) => setProjectTypeId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select a project type (optional)</option>
                                            {projectTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="pb-3 text-left font-medium text-slate-700">Description</th>
                                                <th className="pb-3 text-right font-medium text-slate-700 w-24">Rate</th>
                                                <th className="pb-3 text-right font-medium text-slate-700 w-20">Qty</th>
                                                <th className="pb-3 text-right font-medium text-slate-700 w-32">Line Total</th>
                                                <th className="pb-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lineItems.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-100">
                                                    <td className="py-3">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                            placeholder="Enter an Item Name"
                                                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm text-right"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="py-3">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                                            className="w-full border-0 focus:outline-none focus:ring-0 px-2 py-1 text-sm text-right"
                                                            step="1"
                                                        />
                                                    </td>
                                                    <td className="py-3 text-right font-medium">
                                                        ${item.lineTotal.toFixed(2)}
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

                                <div className="border-t border-slate-200 mt-8 pt-6">
                                    <div className="flex justify-end">
                                        <div className="w-80 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Subtotal</span>
                                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm items-center">
                                                <button type="button" className="text-blue-600 hover:underline text-sm">
                                                    Add a Discount
                                                </button>
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                    className="w-24 border border-slate-300 rounded px-2 py-1 text-right text-sm"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-slate-600">Tax</span>
                                                <input
                                                    type="number"
                                                    value={tax}
                                                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                                                    className="w-24 border border-slate-300 rounded px-2 py-1 text-right text-sm"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="flex justify-between text-base font-semibold pt-3 border-t">
                                                <span>Total</span>
                                                <span>${total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-slate-600">Amount Paid</span>
                                                <input
                                                    type="number"
                                                    value={amountPaid}
                                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                                    className="w-24 border border-slate-300 rounded px-2 py-1 text-right text-sm"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-slate-300">
                                                <span>Amount Due (USD)</span>
                                                <span>${amountDue.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 mt-8 pt-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Enter notes (optional)"
                                            rows={3}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                                            Terms
                                        </label>
                                        <textarea
                                            value={terms}
                                            onChange={(e) => setTerms(e.target.value)}
                                            placeholder="Enter payment terms"
                                            rows={4}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <InvoiceAttachments
                                    invoiceId={undefined}
                                    attachments={attachments}
                                    onAttachmentsChange={setAttachments}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
                                    <p className="text-xs text-slate-500 mt-1">For This Invoice</p>
                                </div>

                                <div className="divide-y divide-slate-200">
                                    <button type="button" className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900">Customize Invoice Style</div>
                                            <div className="text-xs text-slate-500">Change Template, Color, and Font</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>

                                    <div className="px-6 py-3 bg-slate-50">
                                        <div className="text-xs font-semibold text-slate-600">
                                            For {clientName}
                                        </div>
                                    </div>

                                    <button type="button" className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                Send Reminders
                                                <span className="text-xs font-semibold text-slate-600">NO</span>
                                            </div>
                                            <div className="text-xs text-slate-500">At Customizable Intervals</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>

                                    <button type="button" className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                Charge Late Fees
                                                <span className="text-xs font-semibold text-slate-600">NO</span>
                                            </div>
                                            <div className="text-xs text-slate-500">Percentage or Flat-Rate Fees</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>

                                    <button type="button" className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900">Currency & Language</div>
                                            <div className="text-xs text-slate-500">USD, English (United States)</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>

                                    <button type="button" className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                Invoice Attachments
                                                <span className="text-xs font-semibold text-slate-600">NO</span>
                                            </div>
                                            <div className="text-xs text-slate-500">Attach PDF copy to emails</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
