import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ads = await prisma.ad.findMany({
    where: { user_email: session.user.email },
    select: {
        id: true,
        business_name: true,
        cost_per_click: true,
        status: true,
    }
});

const campaignIds = ads.map(a => a.id);

const [TotalClicks, clickData] = await Promise.all([
    prisma.click.count({
        where: { ad_id: { in: campaignIds } }
    }),
    prisma.click.findMany({
        where: { ad_id: { in: campaignIds } },
        select: { ad_id: true }
    })
]);

const clickMap: Record<string, number> = {};
for (const click of clickData) {
    clickMap[click.ad_id] = (clickMap[click.ad_id] ?? 0) + 1;
}

const rawCampaigns = ads.map(ad => {
    const clicks = clickMap[ad.id] ?? 0;
    const cpc = Number(ad.cost_per_click ?? 0);
    const spend = clicks * cpc;
    return {
        name: ad.business_name ?? 'Unnamed Campaign',
        clicks,
        cpc: cpc.toFixed(9),
        status: (ad.status ? 'Active' : 'Paused') as 'Active' | 'Paused',
        spend: Number(spend.toFixed(4)),
    };
});

const userTotalClicks = rawCampaigns.reduce((sum, c) => sum + c.clicks, 0);

const campaigns = rawCampaigns.map(c => ({
    ...c,
    performance: userTotalClicks > 0 ? Math.round((c.clicks / userTotalClicks) * 100) : 0,
}));
    const TotalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
    const ActiveCampaigns = ads.filter(a => a.status).length;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { accent: true }
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentClicks = await prisma.click.findMany({
        where: {
            ad_id: { in: campaignIds },
            created_at: { gte: sevenDaysAgo },
        },
        select: { ad_id: true, created_at: true }
    });

    const cpcMap = Object.fromEntries(ads.map(a => [a.id, Number(a.cost_per_click ?? 0)]));

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySpendMap: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        dailySpendMap[key] = 0;
    }

    for (const click of recentClicks) {
        const d = new Date(click.created_at);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        if (key in dailySpendMap) {
            dailySpendMap[key] += cpcMap[click.ad_id] ?? 0;
        }
    }

    const dailySpend = Object.entries(dailySpendMap).map(([date, spend]) => {
        const [m, day] = date.split('/').map(Number);
        const d = new Date(now.getFullYear(), m - 1, day);
        return {
            day: dayLabels[d.getDay()],
            spend: Number(spend.toFixed(6)),
        };
    });

    return NextResponse.json({
        activeCampaigns: ActiveCampaigns,
        totalClicks: TotalClicks,
        totalSpend: Number(TotalSpend.toFixed(4)),
        accent: user?.accent ?? '#FFFFFF',
        campaigns,
        dailySpend,
    });
}