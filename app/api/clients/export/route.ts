// app/api/clients/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveOrganizationId } from '@/lib/org';

function escapeCsv(value: string | null | undefined): string {
  const v = value ?? "";
  if (v.includes('"') || v.includes(",") || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET() {
  try {
    const organizationId = await getActiveOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const clients = await prisma.client.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });

    const headers = [
      "Organization",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Address Line 1",
      "Address Line 2",
      "City",
      "Province/State",
      "Country",
      "Postal Code",
      "Notes",
    ];

    const lines: string[] = [];
    lines.push(headers.join(","));

    for (const c of clients) {
      const displayName = c.displayName || "";
      const nameParts = displayName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      const row = [
        c.company ?? "",
        firstName,
        lastName,
        c.email ?? "",
        c.phone ? `'${c.phone}'` : "",
        c.addressLine1 ?? "",
        c.addressLine2 ?? "",
        c.city ?? "",
        c.state ?? "",
        c.country ?? "",
        c.postalCode ?? "",
        // make sure you've added `notes` column to Client model
        (c as any).notes ?? "",
      ].map(escapeCsv);

      lines.push(row.join(","));
    }

    const csv = lines.join("\r\n");

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": 'text/csv; charset="utf-8"',
        "Content-Disposition": `attachment; filename="clients-export-${today}.csv"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/clients/export] error", err);
    return NextResponse.json(
      { error: "Failed to export clients" },
      { status: 500 }
    );
  }
}
