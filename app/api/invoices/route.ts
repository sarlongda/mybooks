// app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type InvoicePayload = {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  reference?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  currency?: string;
  status?: 'DRAFT' | 'SENT' | 'OVERDUE' | 'PAID' | 'VOID';
  notes?: string;
  terms?: string;
  lineItems: Array<{
    description: string;
    rate: number;
    quantity: number;
    lineTotal: number;
  }>;
};

// For now, read org id from header or env
async function getOrganizationId(req: NextRequest): Promise<string> {
  const fromHeader = req.headers.get('x-organization-id');
  if (fromHeader) return fromHeader;

  const fromEnv = process.env.DEV_ORG_ID;
  if (fromEnv) return fromEnv;

  // fallback: first org in DB (dev only)
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organizations found. Seed at least one Organization.');
  }
  return org.id;
}

// ---------- GET /api/invoices (list) ----------
export async function GET(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId(req);
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '30');
    const q = (searchParams.get('q') || '').trim();

    const where: any = {
      organizationId,
    };

    if (q) {
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { client: { displayName: { contains: q, mode: 'insensitive' } } },
        { client: { company: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [invoices, totalItems] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const items = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.number,
      clientId: inv.clientId,
      clientName: inv.client?.displayName || null,
      clientCompany: inv.client?.company || null,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      currency: inv.currency,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json({
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
    });
  } catch (err: any) {
    console.error('GET /api/invoices error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: err.message },
      { status: 500 },
    );
  }
}

// ---------- POST /api/invoices (create) ----------
export async function POST(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId(req);
    const body = (await req.json()) as InvoicePayload;

    if (!body.clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 },
      );
    }
    if (!body.invoiceNumber) {
      return NextResponse.json(
        { error: 'invoiceNumber is required' },
        { status: 400 },
      );
    }
    if (!body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400 },
      );
    }

    const issueDate = new Date(body.issueDate);
    const dueDate = new Date(body.dueDate);

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        clientId: body.clientId,
        number: body.invoiceNumber,
        status: body.status || 'DRAFT',
        issueDate,
        dueDate,
        currency: body.currency || 'USD',
        subtotal: body.subtotal,
        tax: body.tax,
        discount: body.discount,
        total: body.total,
        amountPaid: body.amountPaid,
        reference: body.reference,
        notes: body.notes,
        terms: body.terms,
        lineItems: {
          create: body.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.rate,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { client: true },
    });

    return NextResponse.json(
      {
        id: invoice.id,
        invoiceNumber: invoice.number,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('POST /api/invoices error:', err);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: err.message },
      { status: 500 },
    );
  }
}
