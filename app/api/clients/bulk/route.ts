// app/api/clients/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// same helper pattern as /api/clients
async function getOrganizationId() {
  if (process.env.DEMO_ORG_ID) return process.env.DEMO_ORG_ID;

  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return org?.id ?? null;
}

// POST /api/clients/bulk  { action: "archive" | "delete", ids: string[] }
export async function POST(req: NextRequest) {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { action, ids } = body as {
      action: "archive" | "delete";
      ids: string[];
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No client ids provided" },
        { status: 400 }
      );
    }

    if (action === "archive") {
      await prisma.client.updateMany({
        where: {
          id: { in: ids },
          organizationId,
        },
        data: {
          isActive: false,
        },
      });
    } else if (action === "delete") {
      await prisma.client.deleteMany({
        where: {
          id: { in: ids },
          organizationId,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/clients/bulk] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
