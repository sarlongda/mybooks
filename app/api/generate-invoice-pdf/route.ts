// app/api/generate-invoice-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { getActiveOrganizationId } from "@/lib/org";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // � get the active business (organization) for the logged-in user
    let organizationId: string;
    try {
      organizationId = await getActiveOrganizationId();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId, // scoped to active business
      },
      include: {
        client: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // --- Build a very simple PDF ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;
    const fontSize = 12;

    const draw = (text: string, x = 50) => {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
      });
      y -= fontSize + 4;
    };

    const clientName =
      invoice.client?.displayName ||
      invoice.client?.company ||
      "Unknown Client";

    draw(`Invoice ${invoice.number || invoice.id}`);
    draw(`Client: ${clientName}`);
    draw(
      `Issue Date: ${
        invoice.issueDate
          ? invoice.issueDate.toISOString().slice(0, 10)
          : "-"
      }`
    );
    draw(
      `Due Date: ${
        invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "-"
      }`
    );

    y -= 10;
    draw("Line Items:");

    for (const li of invoice.lineItems) {
      const qty = li.quantity;
      const rate = Number(li.unitPrice || 0).toFixed(2);
      const total = Number(li.lineTotal || 0).toFixed(2);

      draw(`- ${li.description || ""}  x${qty} @ ${rate} = ${total}`, 60);
    }

    y -= 10;
    const total = Number(invoice.total || 0).toFixed(2);
    draw(`Total: ${total} ${invoice.currency || "USD"}`);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${
          invoice.number || invoice.id
        }.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[generate-invoice-pdf] error", err);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF" },
      { status: 500 }
    );
  }
}
