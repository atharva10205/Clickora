import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const [site, user] = await Promise.all([
            prisma.publisher.findFirst({
                where: { email: session.user.email, website_url: id },
                select: {
                    id: true,
                    website_name: true,
                    website_url: true,
                    wallet_address: true,
                    Tags: true,
                    keywords: true,
                    status: true,
                    created_at: true,
                },
            }),
            prisma.user.findUnique({
                where: { email: session.user.email },
                select: { accent: true, name: true, image: true },
            }),
        ]);

        if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const [impressions, allClicks] = await Promise.all([
            prisma.impression.findMany({
                where: { publisher_id: site.id },
            }),
            prisma.click.findMany({
                where: { publisher_url: site.website_url ?? '' },
                select: {
                    ad_id: true,
                    publisher_url: true,
                    claimed: true,
                    processed: true,
                    created_at: true,
                },
            }),
        ]);

        const adIds = [...new Set(allClicks.map(c => c.ad_id))];
        const ads = await prisma.ad.findMany({
            where: { id: { in: adIds } },
            select: { id: true, cost_per_click: true },
        });
        const cpcMap = new Map(ads.map(a => [a.id, Number(a.cost_per_click ?? 0)]));

        const totalImpressions = impressions.reduce((s, i) => s + (i.impression || 0), 0);
        const totalClicks = allClicks.length;
        const claimedClicks = allClicks.filter(c => c.claimed).length;
        const unclaimedClicks = allClicks.filter(c => c.processed && !c.claimed).length;
        const totalEarnings = allClicks.reduce((s, c) => s + (cpcMap.get(c.ad_id) ?? 0), 0);
        const claimedEarnings = allClicks.filter(c => c.claimed).reduce((s, c) => s + (cpcMap.get(c.ad_id) ?? 0), 0);
        const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

        const buildDayMap = (): Record<string, number> => {
            const map: Record<string, number> = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                map[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
            }
            return map;
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const clicksByDay = buildDayMap();
        for (const click of allClicks) {
            if (click.created_at && click.created_at >= sevenDaysAgo) {
                const key = new Date(click.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (key in clicksByDay) clicksByDay[key]++;
            }
        }
        const clicksChart = Object.entries(clicksByDay).map(([date, count]) => ({ date, count }));

        const impressionsByDay = buildDayMap();
        for (const imp of impressions) {
            const ts = imp.created_at;
            if (ts && ts >= sevenDaysAgo) {
                const key = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (key in impressionsByDay) impressionsByDay[key] += imp.impression || 0;
            }
        }
        const impressionsChart = Object.entries(impressionsByDay).map(([date, count]) => ({ date, count }));

        return NextResponse.json({
            site,
            accent: user?.accent ?? '#ffffff',
            user: { name: user?.name ?? '', image: user?.image ?? '' },
            analytics: {
                totalImpressions,
                totalClicks,
                claimedClicks,
                unclaimedClicks,
                totalEarnings: parseFloat(totalEarnings.toFixed(6)),
                claimedEarnings: parseFloat(claimedEarnings.toFixed(6)),
                ctr,
            },
            clicksChart,
            impressionsChart,
        });
    } catch (err) {
        console.error("GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { websiteName, keywords, selectedNiches } = await req.json();

        await prisma.publisher.updateMany({
            where: { email: session.user.email, website_url: id },
            data: { website_name: websiteName, keywords, Tags: selectedNiches },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PATCH error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const site = await prisma.publisher.findFirst({
            where: { email: session.user.email, website_url: id },
            select: { id: true, website_url: true },
        });

        if (!site) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Delete all clicks and impressions tied to this site first
        await prisma.click.deleteMany({
            where: { publisher_url: site.website_url ?? '' },
        });

        await prisma.impression.deleteMany({
            where: { publisher_id: site.id },
        });

        await prisma.publisher.delete({
            where: { id: site.id },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}