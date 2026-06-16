import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [publishers, user] = await Promise.all([
            prisma.publisher.findMany({
                where: { email: session.user.email },
                select: {
                    id: true,
                    website_url: true,
                    website_name: true,
                    status: true
                }
            }),
            prisma.user.findUnique({
                where: { email: session.user.email },
                select: { accent: true }
            })
        ]);

        const accent = user?.accent ?? "#ffffff";

        if (publishers.length === 0) {
            return NextResponse.json({ sites: [], accent });
        }

        const publisherIds = publishers.map(p => p.id);

        const [impressionData, clickData] = await Promise.all([
            prisma.impression.groupBy({
                by: ['publisher_id', 'publisher_url'],
                _sum: { impression: true },
                where: {
                    publisher_id: { in: publisherIds }
                }
            }),
            prisma.click.groupBy({
                by: ['publisher_id', 'publisher_url'],
                _count: { _all: true },
                where: {
                    publisher_id: { in: publisherIds }
                }
            })
        ]);

        const allClicks = await prisma.click.findMany({
            where: {
                publisher_id: { in: publisherIds }
            },
            select: {
                ad_id: true,
                publisher_id: true,
                publisher_url: true
            }
        });

        const adIds = [...new Set(allClicks.map(c => c.ad_id))];

        const ads = await prisma.ad.findMany({
            where: {
                id: { in: adIds }
            },
            select: {
                id: true,
                cost_per_click: true
            }
        });

        const cpcMap = new Map(
            ads.map(ad => [ad.id, Number(ad.cost_per_click ?? 0)])
        );

        const earningsMap = new Map<string, number>();

        allClicks.forEach(click => {
            const key = `${click.publisher_id}|${click.publisher_url}`;
            const cpc = cpcMap.get(click.ad_id) ?? 0;
            const currentEarnings = earningsMap.get(key) ?? 0;
            earningsMap.set(key, currentEarnings + cpc);
        });

        const statusMap = new Map(
            publishers.map(p => [
                `${p.id}|${p.website_url}`,
                p.status ?? "UNKNOWN"
            ])
        );

        const impressionMap = new Map(
            impressionData.map(i => [
                `${i.publisher_id}|${i.publisher_url}`,
                i._sum.impression ?? 0
            ])
        );

        const clickMap = new Map(
            clickData.map(c => [
                `${c.publisher_id}|${c.publisher_url}`,
                c._count._all
            ])
        );

        const sites = publishers.map(p => {
            const key = `${p.id}|${p.website_url}`;
            return {
                publisher_id: p.id,
                publisher_url: p.website_url,
                website_name: p.website_name,
                impressions: impressionMap.get(key) ?? 0,
                clicks: clickMap.get(key) ?? 0,
                earnings: earningsMap.get(key) ?? 0,
                status: statusMap.get(key) ?? "UNKNOWN"
            };
        });

        return NextResponse.json({ sites, accent });

    } catch (error) {
        console.error("Error in GET /api/publisher/stats:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}