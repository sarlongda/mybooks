import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID;

type SendInvoiceEmailPayload = {
  invoiceId?: string;
  toEmail?: string;
  ccEmail?: string;
  subject?: string;
  message?: string;
  includePdf?: boolean;
  markAsSent?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SendInvoiceEmailPayload;
    const { searchParams } = new URL(req.url);

    const invoiceId = body.invoiceId || searchParams.get("invoiceId") || undefined;
    let toEmail = body.toEmail;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: DEFAULT_ORG_ID },
      include: { client: true, lineItems: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // If toEmail not provided, try using client email
    if (!toEmail) {
      toEmail = invoice.client?.email || undefined;
    }

    if (!toEmail) {
      return NextResponse.json(
        {
          error:
            "toEmail is required and could not be inferred from the client. Please pass toEmail in the request body.",
        },
        { status: 400 }
      );
    }

    const clientName =
      invoice.client?.displayName ||
      invoice.client?.company ||
      "Your client";

    const subject =
      body.subject ||
      `Invoice ${invoice.number || invoice.id} from ${clientName}`;

    console.log("[send-invoice-email] Would send email:", {
      invoiceId: invoice.id,
      toEmail,
      subject,
      message: body.message,
      includePdf: body.includePdf,
    });

    if (body.markAsSent && invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-invoice-email] error", err);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
