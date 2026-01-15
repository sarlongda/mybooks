// app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveOrganizationId } from '@/lib/org';

// function getOrgId() {
//   return process.env.DEFAULT_ORG_ID || "demo-org";
// }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);
    const q = searchParams.get("q")?.trim() || "";
    // const organizationId = getOrgId();
    const organizationId = await getActiveOrganizationId();

    const where: any = { organizationId };

    if (q) {
      where.OR = [
        { notes: { contains: q, mode: "insensitive" } },
        { method: { contains: q, mode: "insensitive" } },
        {
          invoice: {
            is: {
              number: { contains: q, mode: "insensitive" },
            },
          },
        },
        {
          invoice: {
            is: {
              client: {
                is: {
                  displayName: { contains: q, mode: "insensitive" },
                },
              },
            },
          },
        },
        {
          invoice: {
            is: {
              client: {
                is: {
                  company: { contains: q, mode: "insensitive" },
                },
              },
            },
          },
        },
      ];
    }

    const [totalItems, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            include: {
              client: true,
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      items: payments.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        invoiceNumber: p.invoice?.number ?? "",
        clientId: p.invoice?.clientId ?? undefined,
        clientName: p.invoice?.client?.displayName ?? "",
        clientCompany: p.invoice?.client?.company ?? "",
        amount: Number(p.amount),
        currency: p.currency,
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.method,             // � front-end field name
        notes: p.notes ?? undefined,
        createdAt: p.createdAt.toISOString(),
        // simple derived status if you want one:
        status:
          Number(p.amount) >= Number(p.invoice?.total ?? 0)
            ? "PAID"
            : "PARTIAL",
      })),
      page,
      pageSize,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/payments] error", error);
    return NextResponse.json(
      { error: "Failed to load payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, paymentDate, method, amount, notes } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "invoiceId and amount are required" },
        { status: 400 }
      );
    }

    // const organizationId = getOrgId();
    const organizationId = await getActiveOrganizationId();

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const amountNumber = Number(amount);
    const totalNumber = Number(invoice.total);
    const alreadyPaid = Number(invoice.amountPaid);
    const willBePaid = alreadyPaid + amountNumber;
    const newStatus = willBePaid >= totalNumber ? "PAID" : invoice.status;

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          organizationId,
          invoiceId,
          amount: amountNumber,
          currency: invoice.currency,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          method: method || "Bank Transfer",   // � uses Prisma field
          notes: notes || null,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: { increment: amountNumber },
          status: newStatus,
        },
      });

      return created;
    });

    return NextResponse.json(
      { id: payment.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/payments] error", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
