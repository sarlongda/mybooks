// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper: pick an organization to use (dev only)
async function getOrganizationId() {
  if (process.env.DEMO_ORG_ID) return process.env.DEMO_ORG_ID;

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return org?.id ?? null;
}

// GET /api/clients  (list)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "30");
    const q = searchParams.get("q") ?? "";

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        {
          items: [],
          page,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        },
        { status: 200 }
      );
    }

    const where: any = { organizationId };

    if (q) {
      where.OR = [
        { displayName: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [totalItems, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const clientIds = clients.map((c) => c.id);

    // � Per-client metrics: outstanding, overdue, draft
    const perClient: Record<
      string,
      { outstanding: number; overdue: number; draft: number }
    > = {};

    if (clientIds.length > 0) {
      const invoices = await prisma.invoice.findMany({
        where: {
          organizationId,
          clientId: { in: clientIds },
        },
        select: {
          id: true,
          clientId: true,
          status: true,
          total: true,
          amountPaid: true,
          dueDate: true,
        },
      });

      const today = new Date();

      for (const inv of invoices) {
        const cid = inv.clientId;
        if (!perClient[cid]) {
          perClient[cid] = { outstanding: 0, overdue: 0, draft: 0 };
        }

        const total = Number(inv.total ?? 0);
        const paid = Number(inv.amountPaid ?? 0);
        const remaining = Math.max(total - paid, 0);

        // Draft: full total
        if (inv.status === "DRAFT") {
          perClient[cid].draft += total;
          continue;
        }

        // Open invoices (SENT or OVERDUE)
        if (inv.status === "SENT" || inv.status === "OVERDUE") {
          perClient[cid].outstanding += remaining;

          const isOverdue =
            inv.status === "OVERDUE" ||
            (inv.status === "SENT" &&
              inv.dueDate &&
              inv.dueDate < today);

          if (isOverdue) {
            perClient[cid].overdue += remaining;
          }
        }
      }
    }

    const totalPages = Math.max(1, Math.ceil((totalItems || 1) / pageSize));

    return NextResponse.json(
      {
        items: clients.map((c) => {
          const metrics = perClient[c.id] ?? {
            outstanding: 0,
            overdue: 0,
            draft: 0,
          };

          return {
            id: c.id,
            name: c.displayName,
            company: c.company,
            companyName: c.company, // what your UI uses
            email: c.email,
            phone: c.phone,
            city: c.city,
            country: c.country,
            createdAt: c.createdAt,
            notes: c.notes,
            outstandingBalance: metrics.outstanding,
            overdueBalance: metrics.overdue,
            draftBalance: metrics.draft,
          };
        }),
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/clients] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clients  (create) – unchanged except for context
export async function POST(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found to attach client to" },
        { status: 400 }
      );
    }

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
      postal,
      country,
      notes,
    } = body;

    const name = (displayName || company || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        organizationId,
        displayName: name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postalCode: postal || null,
        country: country || null,
        notes: notes || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        id: client.id,
        name: client.displayName,
        company: client.company,
        email: client.email,
        phone: client.phone,
        city: client.city,
        country: client.country,
        createdAt: client.createdAt,
        notes: client.notes ?? "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/clients] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
