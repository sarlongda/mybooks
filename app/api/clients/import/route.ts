// app/api/clients/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Same helper as in app/api/clients/route.ts
async function getOrganizationId() {
    if (process.env.DEMO_ORG_ID) return process.env.DEMO_ORG_ID;

    const org = await prisma.organization.findFirst({
        orderBy: { createdAt: "asc" },
    });

    return org?.id ?? null;
}

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return [];

    const headerLine = lines[0];
    const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));

    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // simple CSV split; fine for FreshBooks-style export where fields
        // typically don't contain commas. If they do, you can replace this
        // with a more robust CSV parser later.
        const rawCols = line.split(",");
        const cols = rawCols.map((c) => c.trim().replace(/^"|"$/g, ""));

        const row: CsvRow = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] ?? "";
        });
        rows.push(row);
    }

    return rows;
}

function normalizePhone(raw: string): string {
    let value = (raw ?? "").trim();
    if (!value) return "";

    // 1) If it starts with an apostrophe from export, remove it
    if (value.startsWith("'")) {
        value = value.slice(1);
    }

    // 2) If it contains non-digits (like +, spaces, dashes), just keep it as text
    //    This preserves formats like "+1 202 555 0185"
    if (/[^0-9]/.test(value)) {
        return value;
    }

    // 3) If it looks like scientific notation from Excel, try to convert once
    // const sciRegex = /^[+-]?\d+(\.\d+)?e[+-]?\d+$/i;
    // if (sciRegex.test(value)) {
    //     const num = Number(value);
    //     if (Number.isFinite(num)) {
    //         return Math.round(num).toString();
    //     }
    //     // If it somehow isn't finite, just fall through and return original
    // }

    // Otherwise it's already a normal integer-like string
    return value;
}

export async function POST(req: NextRequest) {
    try {
        const organizationId = await getOrganizationId();
        if (!organizationId) {
            return NextResponse.json(
                { error: "No organization found to attach client to" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "CSV file is required (field name: file)" },
                { status: 400 }
            );
        }

        const text = await file.text();
        const rows = parseCsv(text);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "CSV appears to be empty or invalid" },
                { status: 400 }
            );
        }

        const data = rows.map((row) => {
            const firstName = row["First Name"] || "";
            const lastName = row["Last Name"] || "";
            const displayName = `${firstName} ${lastName}`.trim();
            const organization = row["Organization"] || "";

            const nameToUse = displayName || organization || "Imported Client";

            return {
                organizationId,
                displayName: nameToUse,
                company: organization || null,
                email: row["Email"] || null,
                phone: normalizePhone(row["Phone"] || ""),
                addressLine1: row["Address Line 1"] || null,
                addressLine2: row["Address Line 2"] || null,
                city: row["City"] || null,
                state: row["Province/State"] || null,
                country: row["Country"] || null,
                postalCode: row["Postal Code"] || null,
                // make sure `notes` exists on Client model
                notes: row["Notes"] || null,
                isActive: true,
            };
        });

        // Filter out completely empty rows (no name/company/email/phone)
        const filtered = data.filter((d) => {
            return (
                d.displayName ||
                d.company ||
                d.email ||
                d.phone ||
                d.addressLine1 ||
                d.addressLine2
            );
        });

        if (filtered.length === 0) {
            return NextResponse.json(
                { error: "No valid rows found to import" },
                { status: 400 }
            );
        }

        const result = await prisma.client.createMany({
            data: filtered,
            skipDuplicates: false,
        });

        return NextResponse.json({ imported: result.count }, { status: 200 });
    } catch (err) {
        console.error("[POST /api/clients/import] error", err);
        return NextResponse.json(
            { error: "Failed to import clients" },
            { status: 500 }
        );
    }
}
