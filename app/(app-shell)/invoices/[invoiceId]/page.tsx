// app/(app-shell)/invoices/[invoiceId]/page.tsx
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail';

export default async function InvoiceDetailPage(props: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await props.params;

  return <InvoiceDetail invoiceId={invoiceId} />;
}
