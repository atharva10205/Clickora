import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [ad, user] = await Promise.all([
        prisma.ad.findFirst({
            where: { id: id },
            select: {
                id: true,
                business_name: true,
                title: true,
                Description: true,
                Tags: true,
                keywords: true,
                imageUrl: true,
                cost_per_click: true,
                Clicks: true,
                Cost: true,
                RemainingAmount: true,
                impression: true,
                status: true,
                created_at: true,
                wallet_address: true
            }
        }),
        prisma.user.findUnique({
            where: { email: session.user.email },
            select: { accent: true },
        }),
    ]);

    if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

    const totalClicks = await prisma.click.count({ where: { ad_id: id } });

    const impressionAgg = await prisma.impression.aggregate({
        where: { ad_id: id },
        _sum: { impression: true },
    });
    const totalImpressions = impressionAgg._sum.impression ?? 0;

    const ctr = totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : "0.00";

    const costLamports = ad.Cost ? Number(ad.Cost) * 1_000_000_000 : 0;
    const budgetUsed = costLamports > 0 && ad.RemainingAmount != null
        ? (((costLamports - ad.RemainingAmount) / costLamports) * 100).toFixed(1)
        : "0.0";
    const unclaimedClicks = await prisma.click.count({
        where: { ad_id: id, claimed: false }
    });
    return NextResponse.json({
        ad,
        analytics: {
            totalClicks,
            totalImpressions: totalImpressions,
            ctr,
            budgetUsed,
            unclaimedClicks,
        },
        accent: user?.accent ?? '#ffffff',
    });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { title, Description, Tags, keywords, business_name, imageUrl } = await req.json();

    const updated = await prisma.ad.update({
        where: { id },
        data: { title, Description, Tags, keywords, business_name, imageUrl }
    });

    return NextResponse.json({ success: true, updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const ad = await prisma.ad.findFirst({
        where: { id },
        select: { wallet_address: true },
    });

    if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

    await prisma.ad.delete({ where: { id } });

    return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await prisma.ad.update({
        where: { id },
        data: { status: false, RemainingAmount: 0,Clicks: 0 }
    });

    return NextResponse.json({ success: true });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { additionalClicks, additionalSOL, additionalLamports } = await req.json();

    if (
        typeof additionalClicks !== "number" || additionalClicks <= 0 ||
        typeof additionalSOL !== "number" || additionalSOL <= 0 ||
        typeof additionalLamports !== "number" || additionalLamports <= 0
    ) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const current = await prisma.ad.findUnique({
        where: { id },
        select: {
            Clicks: true,
            Cost: true,
            RemainingAmount: true,
        },
    });

    if (!current) {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    const newClicks = (current.Clicks ?? 0) + additionalClicks;
    const newCost = (parseFloat(current.Cost ?? "0") + additionalSOL).toString();
    const newRemaining = (current.RemainingAmount ?? 0) + additionalLamports;

    const updated = await prisma.ad.update({
        where: { id },
        data: {
            Clicks: newClicks,
            Cost: newCost,
            RemainingAmount: newRemaining,
            status: true,
        },
    });

    return NextResponse.json({ success: true, updated });
}