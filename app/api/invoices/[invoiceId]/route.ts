// app/api/invoices/[invoiceId]/route.ts
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
    id?: string;
    description: string;
    rate: number;
    quantity: number;
    lineTotal: number;
  }>;
};

async function getOrganizationId(req: NextRequest): Promise<string> {
  const fromHeader = req.headers.get('x-organization-id');
  if (fromHeader) return fromHeader;

  const fromEnv = process.env.DEV_ORG_ID;
  if (fromEnv) return fromEnv;

  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organizations found. Seed at least one Organization.');
  return org.id;
}

// ---------- GET /api/invoices/:invoiceId ----------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const organizationId = await getOrganizationId(req);
    const { invoiceId } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // fetch relations separately (simpler typings)
    const [client, lineItems] = await Promise.all([
      prisma.client.findUnique({ where: { id: invoice.clientId } }),
      prisma.invoiceLineItem.findMany({ where: { invoiceId: invoice.id } }),
    ]);

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.number,
        client_id: invoice.clientId,
        status: invoice.status,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        subtotal: Number(invoice.subtotal),
        tax: Number(invoice.tax),
        discount: Number(invoice.discount),
        total: Number(invoice.total),
        amount_paid: Number(invoice.amountPaid),
        currency: invoice.currency,
        notes: invoice.notes,
        terms: invoice.terms,
        reference: invoice.reference,
        client: client
          ? {
              id: client.id,
              name: client.displayName,
              company: client.company,
              email: client.email,
              address_line1: client.addressLine1,
              city: client.city,
              state: client.state,
              postal: client.postalCode,
            }
          : null,
      },
      lineItems: lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        rate: Number(li.unitPrice),
        quantity: li.quantity,
        line_total: Number(li.lineTotal),
      })),
      // no invoice attachments implemented yet – return empty array for now
      attachments: [],
    });
  } catch (err: any) {
    console.error('GET /api/invoices/[invoiceId] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: err.message },
      { status: 500 }
    );
  }
}

// ---------- PATCH /api/invoices/:invoiceId ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const organizationId = await getOrganizationId(req);
    const { invoiceId } = await params;
    const body = (await req.json()) as InvoicePayload;

    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const issueDate = new Date(body.issueDate);
    const dueDate = new Date(body.dueDate);

    // Simple strategy: delete existing line items and recreate
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId },
    });

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
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
    });

    return NextResponse.json({
      id: updated.id,
      invoiceNumber: updated.number,
    });
  } catch (err: any) {
    console.error('PATCH /api/invoices/[invoiceId] error:', err);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: err.message },
      { status: 500 }
    );
  }
}

// ---------- DELETE /api/invoices/:invoiceId ----------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const organizationId = await getOrganizationId(req);
    const { invoiceId } = await params;

    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId },
    });
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/invoices/[invoiceId] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: err.message },
      { status: 500 }
    );
  }
}
