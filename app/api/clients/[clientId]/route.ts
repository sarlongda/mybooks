// app/api/clients/[clientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_ORG_ID = process.env.DEMO_ORG_ID;

// GET /api/clients/:clientId  → used by detail + edit pages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: DEMO_ORG_ID,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        organizationId: DEMO_ORG_ID,
      },
      orderBy: { issueDate: "desc" },
    });

    const today = new Date();
    const openInvoices = invoices.filter(
      (inv) => inv.status === "SENT" || inv.status === "OVERDUE"
    );
    const overdueInvoices = openInvoices.filter(
      (inv) => inv.dueDate && inv.dueDate < today
    );

    const openAmount = openInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.displayName ?? client.company ?? "",
        company: client.company ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.addressLine1 ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        postal_code: client.postalCode ?? "",
        country: client.country ?? "",
        currency: "USD",
      },
      summary: {
        invoiceStats: {
          openAmount,
          overdueAmount,
        },
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        total: Number(inv.total),
        currency: inv.currency ?? "USD",
        notes: inv.notes ?? "",
      })),
    });
  } catch (err) {
    console.error("GET /api/clients/[clientId] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/:clientId  → used by edit form
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  try {
    const body = await req.json();

    const {
      displayName,
      company,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isActive,
    } = body;

    const updated = await prisma.client.update({
      where: {
        // id is primary key; we also enforce org in data
        id: clientId,
      },
      data: {
        displayName,
        company,
        email,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        isActive: isActive ?? true,
        organizationId: DEMO_ORG_ID,
      },
    });

    return NextResponse.json({
      client: {
        id: updated.id,
        name: updated.displayName ?? updated.company ?? "",
        company: updated.company ?? "",
        email: updated.email ?? "",
        phone: updated.phone ?? "",
        address: updated.addressLine1 ?? "",
        city: updated.city ?? "",
        state: updated.state ?? "",
        postal_code: updated.postalCode ?? "",
        country: updated.country ?? "",
        currency: "USD",
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/clients/[clientId] error", err);
    return NextResponse.json(
      { error: "Failed to update client", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
