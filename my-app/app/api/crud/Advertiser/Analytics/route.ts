import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ads = await prisma.ad.findMany({
        where: { user_email: email },
        select: { id: true, cost_per_click: true }
    });

    if (ads.length === 0) {
        const user = await prisma.user.findUnique({ where: { email }, select: { accent: true } });
        return NextResponse.json({
            summary: { totalImpressions: 0, totalClicks: 0, ctr: 0, totalSpend: 0 },
            chartData: [],
            topSites: [],
            accent: user?.accent ?? '#FFFFFF'
        });
    }

    const ad_ids = ads.map(a => a.id);
    const adCostMap = new Map(ads.map(a => [a.id, a.cost_per_click]));

    const [impressionRecords, clickRecords, user] = await Promise.all([
        prisma.impression.findMany({
            where: { ad_id: { in: ad_ids }, created_at: { gte: sevenDaysAgo } },
            select: { impression: true, created_at: true, publisher_id: true, ad_id: true }
        }),
        prisma.click.findMany({
            where: { ad_id: { in: ad_ids }, created_at: { gte: sevenDaysAgo } },
            select: { ad_id: true, created_at: true, publisher_id: true }
        }),
        prisma.user.findUnique({ where: { email }, select: { accent: true } })
    ]);

    const totalImpressions = impressionRecords.reduce((a, r) => a + r.impression, 0);
    const totalClicks = clickRecords.length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalSpend = clickRecords.reduce((total, click) => {
        return total + Number(adCostMap.get(click.ad_id) ?? 0);
    }, 0);

    const impressionsByDayMap = new Map<string, number>();
    for (const r of impressionRecords) {
        const day = r.created_at.toISOString().slice(0, 10);
        impressionsByDayMap.set(day, (impressionsByDayMap.get(day) ?? 0) + r.impression);
    }

    const clicksByDayMap = new Map<string, number>();
    for (const c of clickRecords) {
        const day = c.created_at.toISOString().slice(0, 10);
        clicksByDayMap.set(day, (clicksByDayMap.get(day) ?? 0) + 1);
    }

    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const day = d.toISOString().slice(0, 10);
        return {
            date: day,
            impressions: impressionsByDayMap.get(day) ?? 0,
            clicks: clicksByDayMap.get(day) ?? 0,
        };
    });

    const siteImpressionsMap = new Map<string, number>();
    for (const r of impressionRecords) {
        siteImpressionsMap.set(r.publisher_id, (siteImpressionsMap.get(r.publisher_id) ?? 0) + r.impression);
    }

    const siteClicksMap = new Map<string, number>();
    for (const c of clickRecords) {
        siteClicksMap.set(c.publisher_id, (siteClicksMap.get(c.publisher_id) ?? 0) + 1);
    }

    const publisherIds = [...new Set([
        ...impressionRecords.map(r => r.publisher_id),
        ...clickRecords.map(c => c.publisher_id)
    ])];

    const publisherRecords = await prisma.publisher.findMany({
        where: { id: { in: publisherIds } },
        select: { id: true, website_name: true, website_url: true }
    });

    const topSites = publisherRecords.map(p => {
        const impr = siteImpressionsMap.get(p.id) ?? 0;
        const clicks = siteClicksMap.get(p.id) ?? 0;
        const siteCtr = impr > 0 ? (clicks / impr) * 100 : 0;
        return {
            name: p.website_name ?? p.website_url ?? p.id,
            impressions: impr,
            clicks,
            ctr: Number(siteCtr.toFixed(2)),
        };
    }).sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
        summary: {
            totalImpressions,
            totalClicks,
            ctr: Number(ctr.toFixed(2)),
            totalSpend: Number(totalSpend.toFixed(4)),
        },
        chartData,
        topSites,
        accent: user?.accent ?? '#FFFFFF'
    });
}