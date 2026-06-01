import { NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email;

    // Fetch accent from User model
    const user = await prisma.user.findUnique({
      where: { email },
      select: { accent: true },
    });

    // Get ALL ads belonging to this advertiser
    const ads = await prisma.ad.findMany({
      where: { user_email: email },
      select: {
        id: true,
        title: true,
        business_name: true,
        wallet_address: true,
        cost_per_click: true,
        Clicks: true,
        Cost: true,
        created_at: true,
        updated_at: true,
        status: true,
        RemainingAmount: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    if (!ads.length) {
      return NextResponse.json({ error: 'No ads found for this advertiser' }, { status: 404 });
    }

    const walletAddress = ads[0].wallet_address ?? null;

    // Build transactions: one entry per ad, amount = Clicks * CPC
    const transactions = ads.map((ad) => {
      const cpc = ad.cost_per_click ? Number(ad.cost_per_click) : 0;
      const clicks = ad.Clicks ?? 0;
      const amount = clicks * cpc;

      return {
        id: ad.id,
        type: 'spend',
        adTitle: ad.title ?? ad.business_name ?? 'Untitled Ad',
        clicks,
        cpc: cpc.toFixed(6),
        amount: amount.toFixed(6),
        rawAmount: amount,
        date: ad.updated_at,
        status: ad.status ? 'Active' : 'Inactive',
      };
    });const totalSpent = ads.reduce((sum, ad) => {
    const budget = ad.Cost ? Number(ad.Cost) : 0;                          
    const remaining = ad.RemainingAmount ? Number(ad.RemainingAmount) / 1e9 : 0; 
    return sum + (budget - remaining);
}, 0);

const totalClicks = transactions.reduce((sum, t) => sum + t.clicks, 0);
const availableBalance = ads.reduce((sum, ad) => sum + (ad.RemainingAmount ? Number(ad.RemainingAmount) : 0), 0); 

    return NextResponse.json({
      walletAddress,
      availableBalance: parseFloat(availableBalance.toFixed(6)),
      totalSpent: parseFloat(totalSpent.toFixed(6)),
      totalClicks,
      transactions,
      accent: user?.accent ?? '#ffffff',  // ← from User model
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}