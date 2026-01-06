// components/ExpenseModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from "@/lib/supabase";

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    onSuccess?: () => void;
}

interface ProjectType {
    id: string;
    name: string;
    description: string | null;
}

export function ExpenseModal({
    isOpen,
    onClose,
    clientId,
    clientName,
    onSuccess
}: ExpenseModalProps) {
    const [loading, setLoading] = useState(false);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        vendor: '',
        description: '',
        amount: 0,
        notes: '',
        billable: true,
        markupPercent: 0,
        projectTypeId: '',
    });

    useEffect(() => {
        if (isOpen) {
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

    const categories = [
        'Office Supplies',
        'Travel',
        'Meals & Entertainment',
        'Professional Services',
        'Software & Subscriptions',
        'Equipment',
        'Marketing',
        'Utilities',
        'Insurance',
        'Other'
    ];

    const finalAmount = formData.billable
        ? formData.amount * (1 + formData.markupPercent / 100)
        : formData.amount;

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

            // const response = await fetch(`${baseUrl}/functions/v1/invoices`, {
            const response = await fetch(`/api/invoices`, {
                method: "POST",
                headers: {
                    // Authorization: `Bearer ${anonKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clientId,
                    date: formData.date,
                    category: formData.category,
                    vendor: formData.vendor,
                    description: formData.description,
                    amount: formData.amount,
                    notes: formData.notes,
                    billable: formData.billable,
                    markupPercent: formData.markupPercent,
                    finalAmount,
                    projectTypeId: formData.projectTypeId || null,
                }),
            });

            if (response.ok) {
                onSuccess?.();
                onClose();
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    category: 'Other',
                    vendor: '',
                    description: '',
                    amount: 0,
                    notes: '',
                    billable: true,
                    markupPercent: 0,
                    projectTypeId: '',
                });
            } else {
                alert('Failed to create expense');
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            alert('Error creating expense');
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-900">
                        Create Expense for {clientName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Project Type
                            </label>
                            <select
                                value={formData.projectTypeId}
                                onChange={(e) => setFormData({ ...formData, projectTypeId: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a project type (optional)</option>
                                {projectTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Vendor
                            </label>
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                placeholder="Vendor or supplier name"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What was this expense for?"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="billable"
                                    checked={formData.billable}
                                    onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="billable" className="text-sm font-medium text-slate-700">
                                    Billable to client
                                </label>
                            </div>

                            {formData.billable && (
                                <div className="ml-7 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Markup (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.markupPercent}
                                            onChange={(e) => setFormData({ ...formData, markupPercent: parseFloat(e.target.value) || 0 })}
                                            min="0"
                                            max="1000"
                                            step="0.01"
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Cost:</span>
                                            <span className="font-medium text-slate-900">${formData.amount.toFixed(2)}</span>
                                        </div>
                                        {formData.markupPercent > 0 && (
                                            <div className="flex justify-between text-sm mt-1">
                                                <span className="text-slate-600">Markup ({formData.markupPercent}%):</span>
                                                <span className="font-medium text-slate-900">
                                                    ${(formData.amount * formData.markupPercent / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-300">
                                            <span className="font-semibold text-slate-900">Bill Client:</span>
                                            <span className="font-bold text-blue-600">${finalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                placeholder="Additional notes or details"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
