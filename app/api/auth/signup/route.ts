import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAuthToken } from "@/lib/auth";

const AUTH_COOKIE_NAME = "auth_token";

function slugifyCompanyName(name: string) {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "business";

  return base;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, companyName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Company / business name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ---- Create Organization + User + Membership in a single transaction ----
    const { user } = await prisma.$transaction(async (tx) => {
      // 1) Create organization with unique slug
      const orgName = companyName.trim();
      const slugBase = slugifyCompanyName(orgName);
      let slug = slugBase;
      let suffix = 1;

      // ensure slug is unique
      while (
        await tx.organization.findUnique({
          where: { slug },
          select: { id: true },
        })
      ) {
        slug = `${slugBase}-${suffix++}`;
      }

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          // baseCurrency will use default "USD" from your schema
        },
      });

      // 2) Create user tied to this organization
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          organizationId: organization.id,
          // if your User model has a role field, you can set it:
          // role: "OWNER",
        },
      });

      // 3) Create membership (OWNER) for this user & org
      await tx.membership.create({
        data: {
          userId: newUser.id,
          organizationId: organization.id,
          role: "OWNER", // OrganizationRole enum
        },
      });

      return { user: newUser, organization };
    });

    // ---- Issue auth token & cookie (same as before) ----
    const token = await createAuthToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
    });

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[POST /api/auth/signup] error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
