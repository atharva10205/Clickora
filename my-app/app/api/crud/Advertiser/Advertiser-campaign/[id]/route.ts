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
                wallet_address: true,
                AmountNull: true,
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

    const totalBudgetSOL = ad.Cost ? Number(ad.Cost) : 0;
    const spentSOL = totalClicks * (ad.cost_per_click ? Number(ad.cost_per_click) : 0);
    const budgetUsed = totalBudgetSOL > 0
        ? ((spentSOL / totalBudgetSOL) * 100).toFixed(1)
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
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const ad = await prisma.ad.findFirst({
        where: { id },
        select: { wallet_address: true, imageUrl: true },
    });

    if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

    if (ad.imageUrl) {
        try {
            const url = new URL(ad.imageUrl);
            const key = url.pathname.slice(1);

            await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: key,
            }));
        } catch (err) {
            console.error("Failed to delete S3 image:", err);
        }
    }

    await prisma.ad.delete({ where: { id } });

    return NextResponse.json({ success: true });
}


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { tx_signature, publisher_wallet, total_amount } = await req.json();
    const totalClicks = await prisma.click.count({ where: { ad_id: id } });

    await prisma.ad.update({
        where: { id },
        data: {
            status: false,
            RemainingAmount: 0,
            AmountNull: true,
            Clicks: totalClicks,
            Cost: 0,
        }
    });

    await prisma.withdrawalRecord.create({
        data: {
            id: crypto.randomUUID(),
            publisher_wallet: publisher_wallet ?? "",
            tx_signature: tx_signature ?? null,
            total_amount: total_amount ?? 0,
            ad_ids: [id],
            status: "CONFIRMED",
            confirmed_at: new Date(),
        }
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

    const updated = await prisma.ad.update({
        where: { id },
        data: {
            Clicks: { increment: additionalClicks },
            Cost: { increment: additionalSOL },
            RemainingAmount: { increment: additionalLamports },
            status: true,
            AmountNull: false,
        },
    });

    return NextResponse.json({ success: true, updated });
}