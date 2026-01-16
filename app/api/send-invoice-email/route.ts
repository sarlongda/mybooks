// app/api/send-invoice-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveOrganizationId } from "@/lib/org";

type SendInvoiceEmailPayload = {
  invoiceId?: string;
  toEmail?: string;
  ccEmail?: string;
  subject?: string;
  message?: string;
  includePdf?: boolean;
  markAsSent?: boolean; // optional, defaults to true below
};

export async function POST(req: NextRequest) {
  try {
    // resolve active business
    let organizationId: string;
    try {
      organizationId = await getActiveOrganizationId();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as SendInvoiceEmailPayload;
    const { searchParams } = new URL(req.url);

    const invoiceId =
      body.invoiceId || searchParams.get("invoiceId") || undefined;
    let toEmail = body.toEmail;
    const markAsSent = body.markAsSent ?? true;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    //  always scope to active org
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
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
      invoice.client?.displayName || invoice.client?.company || "Your client";

    const subject =
      body.subject ||
      `Invoice ${invoice.number || invoice.id} from ${clientName}`;

    // Stub: log instead of actually sending email
    console.log("[send-invoice-email] Would send email:", {
      invoiceId: invoice.id,
      toEmail,
      subject,
      message: body.message,
      includePdf: body.includePdf,
      organizationId,
    });

    let newStatus = invoice.status;

    // Mark as SENT by default if it was DRAFT
    if (markAsSent && invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT" },
      });
      newStatus = "SENT";
    }

    return NextResponse.json({
      ok: true,
      invoiceId: invoice.id,
      status: newStatus,
    });
  } catch (err) {
    console.error("[send-invoice-email] error", err);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
