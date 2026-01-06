// app/(app-shell)/clients/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ClientFormPage } from "@/components/clients/ClientFormPage";

export default function NewClientPage() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    if (path === "clients") {
      router.push("/clients");
    } else if (path.startsWith("client-detail-")) {
      const id = path.replace("client-detail-", "");
      router.push(`/clients/${id}`);
    } else if (path.startsWith("client-edit-")) {
      const id = path.replace("client-edit-", "");
      router.push(`/clients/${id}/edit`);
    } else {
      console.warn("Unknown navigate path:", path);
    }
  };

  return <ClientFormPage mode="create" onNavigate={handleNavigate} />;
}
