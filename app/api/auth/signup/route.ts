// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAuthToken } from "@/lib/auth";

const AUTH_COOKIE_NAME = "auth_token";

export async function POST(req: NextRequest) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
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

        // For now: create a single default org for the first user, or
        // you can assume you already have an Organization row and use that id.
        let organization = await prisma.organization.findFirst();
        if (!organization) {
            const orgName = "My First Business";

            // quick slug helper
            const slug = orgName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");

            organization = await prisma.organization.create({
                data: {
                    name: orgName,
                    slug,              // � required
                    // baseCurrency will use default "USD"
                },
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                organizationId: organization.id,
            },
        });

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
