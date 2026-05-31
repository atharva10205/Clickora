import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [Advertisers, user] = await Promise.all([
            prisma.ad.findMany({
                where: { user_email: session.user.email },
                select: {
                    id: true,
                    wallet_address:true,
                    destination_url: true,
                    business_name: true,
                    status: true,
                    cost_per_click: true,
                    impression: true,
                    Cost: true,
                    created_at: true,
                }
            }),
            prisma.user.findUnique({
                where: { email: session.user.email },
                select: {id:true , accent: true }
            })
        ]);

        const accent = user?.accent ?? '#FFFFFF';

        if (Advertisers.length === 0) {
            return NextResponse.json({ campaigns: [], accent });
        }

        const AdvertisersIds = Advertisers.map(p => p.id);

        const [impressionData, ClickData] = await Promise.all([
            prisma.impression.findMany({
                where: { ad_id: { in: AdvertisersIds } }
            }),
            prisma.click.findMany({
                where: { ad_id: { in: AdvertisersIds } }
            })
        ]);

        const impressionMap: Record<string, number> = {};
        for (const imp of impressionData) {
            impressionMap[imp.ad_id] = (impressionMap[imp.ad_id] ?? 0) + imp.impression;
        }

        const clickMap: Record<string, number> = {};
        for (const click of ClickData) {
            clickMap[click.ad_id] = (clickMap[click.ad_id] ?? 0) + 1;
        }

        const campaigns = Advertisers.map(ad => ({
            ...ad,
            impression: impressionMap[ad.id] ?? 0,
            clicks: clickMap[ad.id] ?? 0,
        }));

        return NextResponse.json({ campaigns, accent });

    } catch (error) {
        console.error("Error in GET /api/crud/Advertiser/Campaings:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, status } = await req.json();

        const ad = await prisma.ad.findFirst({
            where: { id, user_email: session.user.email }
        });

        if (!ad) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const updated = await prisma.ad.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, status: updated.status });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}