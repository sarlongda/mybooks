// app/(app-shell)/clients/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { ClientsListPage } from "@/components/clients/ClientsListPage";

export default function ClientsPage() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    if (path === "clients") {
      router.push("/clients");
    } else if (path === "clients-new") {
      router.push("/clients/new");
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

  return <ClientsListPage onNavigate={handleNavigate} />;
}
