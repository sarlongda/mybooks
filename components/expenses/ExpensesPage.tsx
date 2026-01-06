'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Check,
  X,
  Calendar,
  Wrench,
  Briefcase,
  Phone,
  Wifi,
  ShoppingBag,
  FileText,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

interface Expense {
  id: string;
  merchant: string;
  category?: string;
  amount: number;
  taxAmount: number;
  currency: string;
  expenseDate: string;
  clientId?: string;
  clientName?: string;
  clientCompany?: string;
  projectId?: string;
  projectName?: string;
  description?: string;
  isRecurring: boolean;
  status: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

interface ExpenseListResponse {
  items: Expense[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

const categoryIcons: Record<string, any> = {
  'IT Services': Wrench,
  'Stamp and Review': FileText,
  'Professional Services': Briefcase,
  Phone,
  Internet: Wifi,
  Default: ShoppingBag,
};

function getCategoryIcon(category?: string) {
  if (!category) return categoryIcons.Default;
  return categoryIcons[category] || categoryIcons.Default;
}

export function ExpensesPage() {
  const [data, setData] = useState<ExpenseListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(1); // TODO: wire pagination later
  const [activeTab, setActiveTab] = useState<'regular' | 'recurring'>('regular');
  const [showAddForm, setShowAddForm] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    merchant: '',
    category: '',
    amount: 0,
    taxAmount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    clientId: '',
    description: '',
    isRecurring: false,
  });

  // const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, activeTab]);

  useEffect(() => {
    if (showAddForm) {
      fetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm, clientSearch]);

  async function fetchExpenses() {
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
        recurring: activeTab === 'recurring' ? 'true' : 'false',
      });
      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(
        // `${baseUrl}/functions/v1/expenses?${params.toString()}`,
        `/api/expenses?${params.toString()}`,
        {
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    // if (!baseUrl || !anonKey) return;

    try {
      const params = new URLSearchParams({ pageSize: '100' });
      if (clientSearch) {
        params.append('q', clientSearch);
      }

      const response = await fetch(
        // `${baseUrl}/functions/v1/clients?${params.toString()}`,
        `/api/clients?${params.toString()}`,
        {
          headers: {
            // Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const result = await response.json();
      setClients(result.items || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }

  async function handleSubmitExpense() {
    if (!formData.merchant || !formData.amount) {
      alert('Please enter merchant and amount');
      return;
    }

    // if (!baseUrl || !anonKey) {
    //   alert('Server configuration error');
    //   return;
    // }

    try {
      // const response = await fetch(`${baseUrl}/functions/v1/expenses`, {
      const response = await fetch(`api/expenses`, {
        method: 'POST',
        headers: {
          // Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        handleCancelAdd();
        fetchExpenses();
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Error creating expense');
    }
  }

  function handleCancelAdd() {
    setShowAddForm(false);
    setFormData({
      merchant: '',
      category: '',
      amount: 0,
      taxAmount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      clientId: '',
      description: '',
      isRecurring: false,
    });
    setSelectedClient(null);
    setClientSearch('');
    setShowClientDropdown(false);
  }

  function handleClientSelect(client: Client) {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setClientSearch('');
    setShowClientDropdown(false);
  }

  const recentExpenses = data?.items.slice(0, 6) || [];

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
          <h1 className="text-3xl font-semibold text-slate-900">Expenses</h1>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2">
              More Actions
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              New Expense
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Recently Updated */}
        {data && data.items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Recently Updated</h3>
              <button className="text-sm text-slate-500 hover:text-slate-700">
                Remove ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {recentExpenses.map(expense => {
                const Icon = getCategoryIcon(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <Icon className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-slate-500">
                        {expense.category || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-slate-900 text-sm truncate">
                        {expense.merchant}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <div className="text-lg font-semibold text-slate-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('regular')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'regular'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recurring'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Recurring Expenses
          </button>
        </div>

        {/* Table & add form */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">All Expenses</h3>
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
              No expenses found.{' '}
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:underline"
              >
                Add your first expense
              </button>
            </div>
          ) : (
            data && (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="w-8 px-4 py-3">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Merchant / Category
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Date / Source
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-slate-600">
                        Client / Project / Description
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-slate-600">
                        Amount / Tax / Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Inline add form row */}
                    {showAddForm && (
                      <tr className="border-b-4 border-green-500 bg-yellow-50">
                        <td className="px-4 py-4" />
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-700">
                              Merchant
                            </label>
                            <input
                              type="text"
                              value={formData.merchant}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  merchant: e.target.value,
                                }))
                              }
                              placeholder="Add merchant"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <label className="block text-xs font-medium text-slate-700 mt-2">
                              Category
                            </label>
                            <input
                              type="text"
                              value={formData.category}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  category: e.target.value,
                                }))
                              }
                              placeholder="Add category"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="text-xs text-slate-500 mt-1">
                              {selectedClient?.name ||
                                selectedClient?.company ||
                                'Ryan Hoover'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              type="date"
                              value={formData.expenseDate}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  expenseDate: e.target.value,
                                }))
                              }
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2 relative">
                            {/* Client selector */}
                            <input
                              type="text"
                              value={clientSearch}
                              onChange={e => {
                                setClientSearch(e.target.value);
                                setShowClientDropdown(true);
                              }}
                              onFocus={() => setShowClientDropdown(true)}
                              placeholder="Assign to client/project"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showClientDropdown &&
                              clientSearch &&
                              clients.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                  {clients.map(client => (
                                    <button
                                      key={client.id}
                                      type="button"
                                      onClick={() => handleClientSelect(client)}
                                      className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                                    >
                                      {client.name || client.company}
                                    </button>
                                  ))}
                                </div>
                              )}

                            {/* Description */}
                            <input
                              type="text"
                              value={formData.description}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Add description"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Attach / advanced */}
                            <div className="flex items-center gap-3 text-xs">
                              <button className="text-blue-600 hover:underline flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                attach receipt
                              </button>
                              <button className="text-blue-600 hover:underline flex items-center gap-1">
                                advanced expense settings
                                <span className="text-slate-400">›</span>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-700 text-right">
                              Tax Amount
                            </label>
                            <input
                              type="number"
                              value={formData.taxAmount}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  taxAmount:
                                    parseFloat(e.target.value || '0') || 0,
                                }))
                              }
                              placeholder="$0.00"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                            />
                            <label className="block text-xs font-medium text-slate-700 text-right">
                              Grand Total (USD)
                            </label>
                            <input
                              type="number"
                              value={formData.amount}
                              onChange={e =>
                                setFormData(prev => ({
                                  ...prev,
                                  amount:
                                    parseFloat(e.target.value || '0') || 0,
                                }))
                              }
                              placeholder="$0.00"
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                type="button"
                                onClick={handleSubmitExpense}
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
                          </div>
                        </td>
                      </tr>
                    )}

                    {!showAddForm && (
                      <tr className="border-b border-slate-100">
                        <td colSpan={5} className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            New Expense
                          </button>
                        </td>
                      </tr>
                    )}

                    {/* Existing expenses */}
                    {data.items.map(expense => {
                      const Icon = getCategoryIcon(expense.category);
                      return (
                        <tr
                          key={expense.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {expense.merchant}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                              <Icon className="w-3 h-3" />
                              {expense.category || 'Uncategorized'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-900">
                              {new Date(
                                expense.expenseDate,
                              ).toLocaleDateString()}
                            </div>
                            {expense.isRecurring && (
                              <div className="text-xs text-blue-600 mt-1">
                                Recurring
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {expense.clientName || expense.clientCompany ? (
                              <div className="font-medium text-slate-900">
                                {expense.clientName || expense.clientCompany}
                              </div>
                            ) : null}
                            {expense.projectName && (
                              <div className="text-xs text-slate-600 mt-0.5">
                                {expense.projectName}
                              </div>
                            )}
                            {expense.description && (
                              <div className="text-xs text-slate-500 mt-1">
                                {expense.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-medium text-slate-900">
                              {formatCurrency(expense.amount, expense.currency)}
                            </div>
                            {expense.taxAmount > 0 && (
                              <div className="text-xs text-slate-500 mt-1">
                                Tax:{' '}
                                {formatCurrency(
                                  expense.taxAmount,
                                  expense.currency,
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {data.items.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                    <span className="text-sm text-slate-600">
                      {data.page * data.pageSize - data.pageSize + 1}–
                      {Math.min(data.page * data.pageSize, data.totalItems)} of{' '}
                      {data.totalItems}
                    </span>
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
