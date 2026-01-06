// app/(app-shell)/clients/[id]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { ClientDetailPage } from "@/components/clients/ClientDetailPage";

export default function ClientDetailRoutePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const clientId = params.id;

  const handleNavigate = (path: string) => {
    if (path === "clients") {
      router.push("/clients");
    } else if (path.startsWith("client-edit-")) {
      const id = path.replace("client-edit-", "");
      router.push(`/clients/${id}/edit`);
    } else if (path.startsWith("invoice-detail-")) {
      const invoiceId = path.replace("invoice-detail-", "");
      // later you'll have /invoices/[id]
      router.push(`/invoices/${invoiceId}`);
    } else {
      console.warn("Unknown navigate path:", path);
    }
  };

  return <ClientDetailPage clientId={clientId} onNavigate={handleNavigate} />;
}
