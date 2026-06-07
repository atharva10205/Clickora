
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { IDL } from "@/lib/idl";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { NextResponse } from "next/server";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { adIdToBytes } from "@/lib/solana";


export async function GET(req: Request) {
    const session = await auth();

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [publisher, user_accent] = await Promise.all([
        prisma.publisher.findFirst({
            where: { email: session.user.email },
            select: { wallet_address: true }
        }),
        prisma.user.findUnique({
            where: { email: session.user.email },
            select: { accent: true }
        })
    ]);

    const user = await prisma.publisher.findMany({
        where: { email: session.user.email },
        select: { id: true, website_url: true }
    });

    const websiteUrlMap = user
        .map(w => w.website_url)
        .filter((url): url is string => url !== null);

    if (websiteUrlMap.length === 0) {
        return NextResponse.json({ error: "No websites found" }, { status: 404 });
    }


    const data = await prisma.click.findMany({
        where: {
            publisher_url: { in: websiteUrlMap },
            claimed: false,
        },
        select: { ad_id: true, publisher_id: true }
    });

    const adIdMap = data.map(w => w.ad_id);

    const cpcList = await prisma.ad.findMany({
        where: { id: { in: adIdMap } },
        select: { id: true, cost_per_click: true, wallet_address: true }
    });

    const cpcMap1 = new Map(cpcList.map(c => [c.id, Number(c.cost_per_click)]));
    const advertiserWalletMap = new Map(cpcList.map(c => [c.id, c.wallet_address]));

    const publisherWallets = await prisma.publisher.findMany({
        where: { id: { in: user.map(u => u.id) } },
        select: { id: true, wallet_address: true }
    });
    const walletMap = new Map(publisherWallets.map(p => [p.id, p.wallet_address]));
    const groupedEarnings = new Map<string, {
        ad: string;
        publisher: string | null;
        advertiser: string | null;
        claimable_amount: number;
    }>();

    for (const click of data) {
        const cpc = cpcMap1.get(click.ad_id) ?? 0;
        const lamports = Math.round(cpc * 1_000_000_000);
        if (!groupedEarnings.has(click.ad_id)) {
            groupedEarnings.set(click.ad_id, {
                ad: click.ad_id,
                publisher: walletMap.get(click.publisher_id) ?? null,
                advertiser: advertiserWalletMap.get(click.ad_id) ?? null,
                claimable_amount: 0,
            });
        }
        groupedEarnings.get(click.ad_id)!.claimable_amount += lamports;
    }

    const earningsRecords = [...groupedEarnings.values()];

    const history = await prisma.click.findMany({
        where: {
            publisher_url: { in: websiteUrlMap },
            claimed: true
        },
        select: { ad_id: true, publisher_id: true, claimed_at: true },
        orderBy: { claimed_at: 'asc' }
    });

    const adIdList = history.map(i => i.ad_id);

    const cpc = await prisma.ad.findMany({
        where: { id: { in: adIdList } },
        select: { id: true, cost_per_click: true }
    });

    const cpcMap = Object.fromEntries(cpc.map(a => [a.id, Number(a.cost_per_click)]));

    const groupMap = new Map<string, {
        ad_id: string;
        publisher_id: string;
        click_count: number;
        earnings: number;
        timestamp: Date | null;
        lastTimestamp: number | null;
    }>();

    for (const click of history) {
        const clickTime = click.claimed_at?.getTime() ?? null;

        let matchedKey: string | null = null;

        for (const [key, group] of groupMap.entries()) {
            if (group.ad_id !== click.ad_id || group.publisher_id !== click.publisher_id) continue;

            if (clickTime === null && group.timestamp === null) {
                matchedKey = key;
                break;
            }

            if (clickTime !== null && group.lastTimestamp !== null) {
                const diff = Math.abs(clickTime - group.lastTimestamp);
                if (diff <= 120_000) {
                    matchedKey = key;
                    break;
                }
            }
        }

        if (!matchedKey) {
            matchedKey = `${click.ad_id}__${click.publisher_id}__${clickTime ?? 'null'}`;
            groupMap.set(matchedKey, {
                ad_id: click.ad_id,
                publisher_id: click.publisher_id,
                click_count: 0,
                earnings: 0,
                timestamp: click.claimed_at ?? null,
                lastTimestamp: clickTime,
            });
        }

        const group = groupMap.get(matchedKey)!;
        group.click_count += 1;
        group.earnings += cpcMap[click.ad_id] ?? 0;
        if (clickTime !== null) group.lastTimestamp = clickTime;
    }

    const transactionList = Array.from(groupMap.values())
        .sort((a, b) => {
            if (!a.timestamp && !b.timestamp) return 0;
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp.getTime() - a.timestamp.getTime();
        })
        .map(({ lastTimestamp, ...rest }) => rest);

    return NextResponse.json({
        publisher,
        earningsRecords,
        transactionList,
        accent: user_accent?.accent ?? '#0010FF'
    });
}


export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.AUTHORITY_PRIVATE_KEY!));
    const wallet = new NodeWallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {});
    const program = new Program(IDL as any, provider);

    const user = await prisma.publisher.findMany({
        where: { email: session.user.email },
        select: { id: true, website_url: true },
    });

    const websiteUrlMap = user
        .map((w) => w.website_url)
        .filter((url): url is string => url !== null);

    if (websiteUrlMap.length === 0)
        return NextResponse.json({ error: "No websites found" }, { status: 404 });

    const data = await prisma.click.findMany({
        where: {
            publisher_url: { in: websiteUrlMap },
            claimed: false,
            processed: false
        },
        select: { id: true, ad_id: true, publisher_id: true },
    });

    if (data.length === 0) return NextResponse.json({ results: [] });

    const clickIds = data.map((d) => d.id);

    await prisma.click.updateMany({
        where: { id: { in: clickIds } },
        data: { processed: true },
    });

    const adIdMap = data.map((w) => w.ad_id);

    const cpcList = await prisma.ad.findMany({
        where: { id: { in: adIdMap } },
        select: { id: true, cost_per_click: true, wallet_address: true },
    });
    const cpcMap = new Map(cpcList.map((c) => [c.id, Number(c.cost_per_click)]));
    const advertiserWalletMap = new Map(cpcList.map((c) => [c.id, c.wallet_address]));

    const publisherWallets = await prisma.publisher.findMany({
        where: { id: { in: user.map((u) => u.id) } },
        select: { id: true, wallet_address: true },
    });
    const publisherWalletsMap = new Map(publisherWallets.map((p) => [p.id, p.wallet_address]));

    const results: {
        ad: string;
        publisher: string | null;
        advertiser?: string;
        tx?: string;
        success: boolean;
        error?: string;
        count?: number;
        claimable_amount?: number;
        failedClickIds?: number[];
    }[] = [];

    const grouped = new Map<string, {
        ad_id: string;
        publisher_id: string;
        count: number;
        clickIds: number[];
    }>();

    for (const click of data) {
        const key = `${click.ad_id}__${click.publisher_id}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                ad_id: click.ad_id,
                publisher_id: click.publisher_id,
                count: 0,
                clickIds: []
            });
        }
        const g = grouped.get(key)!;
        g.count += 1;
        g.clickIds.push(click.id);
    }

    await Promise.all(Array.from(grouped.values()).map(async ({ ad_id, publisher_id, count, clickIds: groupClickIds }) => {
        const publisher = publisherWalletsMap.get(publisher_id) ?? null;
        if (!publisher) {
            results.push({
                ad: ad_id,
                publisher,
                success: false,
                error: "No publisher wallet found",
                failedClickIds: groupClickIds
            });
            return;
        }

        const cpc = cpcMap.get(ad_id) ?? 0;
        const claimable_amount = Math.round(cpc * 1_000_000_000) * count;

        const advertiserWallet = advertiserWalletMap.get(ad_id);
        if (!advertiserWallet) {
            results.push({
                ad: ad_id,
                publisher,
                success: false,
                error: "No advertiser wallet found",
                failedClickIds: groupClickIds
            });
            return;
        }

        try {
            const adIdBytes = adIdToBytes(ad_id);
            const authorityPubkey = keypair.publicKey;
            const publisherPubkey = new PublicKey(publisher);
            const advertiserPubkey = new PublicKey(advertiserWallet);

            const [adPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("ad"), advertiserPubkey.toBuffer(), adIdBytes],
                program.programId
            );
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), advertiserPubkey.toBuffer(), adIdBytes],
                program.programId
            );
            const [earningsPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("earnings"), adPda.toBuffer(), publisherPubkey.toBuffer()],
                program.programId
            );

            const tx = await program.methods
                .recordImpression(new BN(claimable_amount))
                .accounts({
                    ad: adPda,
                    vault: vaultPda,
                    earnings: earningsPda,
                    signer: authorityPubkey,
                    advertiser: advertiserPubkey,
                    publisher: publisherPubkey,
                    systemProgram: SystemProgram.programId
                }).rpc();

            results.push({
                ad: ad_id,
                publisher,
                advertiser: advertiserWallet,
                tx,
                success: true,
                count,
                claimable_amount
            });

        } catch (error: any) {
            console.error("error logs:", error?.logs);
            results.push({
                ad: ad_id,
                publisher,
                success: false,
                error: error?.message,
                failedClickIds: groupClickIds
            });
        }
    }));

    const failedClickIds = results
        .filter(r => !r.success)
        .flatMap(r => r.failedClickIds ?? []);

    if (failedClickIds.length > 0) {
        await prisma.click.updateMany({
            where: { id: { in: failedClickIds } },
            data: { processed: false },
        });
    }

    return NextResponse.json({
        results: results.filter(r => r.success)
    });
}


export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { adIds, publisherWallet } = await req.json();

    if (!adIds || !Array.isArray(adIds) || adIds.length === 0) {
        return NextResponse.json({ error: "No adIds provided" }, { status: 400 });
    }

    const publisherRecords = await prisma.publisher.findMany({
        where: {
            email: session.user.email,
            ...(publisherWallet ? { wallet_address: publisherWallet } : {})
        },
        select: { website_url: true }
    });

    const publisherWebsiteUrls = publisherRecords
        .map(p => p.website_url)
        .filter((url): url is string => url !== null);

    if (publisherWebsiteUrls.length === 0) {
        return NextResponse.json({ error: "No matching publisher found" }, { status: 404 });
    }
    await prisma.click.updateMany({
        where: {
            ad_id: { in: adIds },
            publisher_url: { in: publisherWebsiteUrls },
            claimed: false,
        },
        data: { claimed: true, claimed_at: new Date(), processed: false }
    });

    return NextResponse.json({ success: true });
}