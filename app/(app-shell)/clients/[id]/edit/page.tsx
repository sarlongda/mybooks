// app/(app-shell)/clients/[id]/edit/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { ClientFormPage } from "@/components/clients/ClientFormPage";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const clientId = params.id;

  const handleNavigate = (path: string) => {
    if (path === "clients") {
      router.push("/clients");
    } else if (path.startsWith("client-detail-")) {
      const id = path.replace("client-detail-", "");
      router.push(`/clients/${id}`);
    } else {
      console.warn("Unknown navigate path:", path);
    }
  };

  return (
    <ClientFormPage
      mode="edit"
      clientId={clientId}
      onNavigate={handleNavigate}
    />
  );
}
