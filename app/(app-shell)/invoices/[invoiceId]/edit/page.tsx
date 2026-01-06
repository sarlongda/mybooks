// app/(app-shell)/invoices/[invoiceId]/edit/page.tsx
import { InvoiceForm } from '@/components/invoices/InvoiceForm';

export default async function EditInvoicePage(props: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await props.params;

  return <InvoiceForm mode="edit" invoiceId={invoiceId} />;
}
