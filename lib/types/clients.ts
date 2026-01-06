// lib/utils/clients.ts
export interface ClientListItem {
  id: string;
  name: string;
  email?: string;
  companyName?: string;
  phone?: string;
  city?: string;
  country?: string;
  outstandingBalance: number;
  lastInvoiceDate?: string;
  createdAt: string;
}

export interface ClientListResponse {
  items: ClientListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  contact_name?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSummary {
  outstandingBalance: number;
  overdueBalance: number;
  totalInvoiced: number;
  lastInvoiceDate?: string;
  lastActivity?: string;
}

export interface ClientInvoice {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  currency: string;
  notes: string
}

export interface ClientProject {
  id: string;
  name: string;
  status: string;
  totalHours: number;
  unbilledTimeValue: number;
}

export interface ClientDetailResponse {
  client: Client;
  summary: ClientSummary;
  invoices: ClientInvoice[];
  projects: ClientProject[];
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  contactName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  currency?: string;
  notes?: string;
}
