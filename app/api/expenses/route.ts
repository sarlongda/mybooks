// app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveOrganizationId } from '@/lib/org';

// function getOrgId() {
//   return process.env.DEMO_ORG_ID || "demo-org";
// }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "30", 10);
    const q = searchParams.get("q")?.trim() || "";
    const recurringParam = searchParams.get("recurring");
    // const organizationId = getOrgId();
    const organizationId = await getActiveOrganizationId();

    const where: any = { organizationId };

    if (recurringParam === "true") where.isRecurring = true;
    if (recurringParam === "false") where.isRecurring = false;

    if (q) {
      where.OR = [
        { merchant: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        {
          client: {
            is: {
              displayName: { contains: q, mode: "insensitive" },
            },
          },
        },
        {
          client: {
            is: {
              company: { contains: q, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [totalItems, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: {
          client: true,
        },
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      items: expenses.map((e) => ({
        id: e.id,
        merchant: e.merchant,
        category: e.category ?? undefined,
        amount: Number(e.amount),
        taxAmount: Number(e.taxAmount ?? 0),
        currency: e.currency,
        expenseDate: e.expenseDate.toISOString(),
        clientId: e.clientId ?? undefined,
        clientName: e.client?.displayName ?? undefined,
        clientCompany: e.client?.company ?? undefined,
        description: e.description ?? undefined,
        isRecurring: e.isRecurring,
        status: e.billable && !e.billed ? "UNBILLED" : "RECORDED", // � fake status for UI
        createdAt: e.createdAt.toISOString(),
      })),
      page,
      pageSize,
      totalItems,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/expenses] error", error);
    return NextResponse.json(
      { error: "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchant,
      category,
      amount,
      taxAmount,
      expenseDate,
      clientId,
      description,
      isRecurring,
    } = body;

    if (!merchant || !amount) {
      return NextResponse.json(
        { error: "merchant and amount are required" },
        { status: 400 }
      );
    }

    // const organizationId = getOrgId();
    const organizationId = await getActiveOrganizationId();

    const expense = await prisma.expense.create({
      data: {
        organizationId,
        merchant,
        category: category || null,
        amount: Number(amount),
        taxAmount: Number(taxAmount || 0),
        currency: "USD", // later: derive from Organization
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        clientId: clientId || null,
        description: description || null,
        isRecurring: !!isRecurring,
        // billable/billed can be wired later when you do unbilled metrics
      },
    });

    return NextResponse.json(
      { id: expense.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/expenses] error", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
