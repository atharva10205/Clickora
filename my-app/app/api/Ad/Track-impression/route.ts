import { prisma } from "@/app/lib/prisma";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS() {
    return new Response(null, { headers: corsHeaders() });
}

const impression_queue: Map<string, number> = new Map();
let isFlushScheduled = false;

async function flushImpressions() {
    if (impression_queue.size === 0) {
        isFlushScheduled = false;
        return;
    }


    const to_flush = new Map(impression_queue);
    impression_queue.clear();
    isFlushScheduled = false;

    const results = await Promise.allSettled(
        Array.from(to_flush.entries()).map(async ([key, count]) => {
            const [adId, publisher_url] = key.split('|');

            if (!adId || !publisher_url) {
                console.error(`[Impression Flush] Malformed queue key: "${key}" — skipping`);
                return;
            }


            const publisher = await prisma.publisher.findUnique({
                where: { website_url: publisher_url }
            });

            if (!publisher) {
                console.error(`[Impression Flush] Publisher NOT FOUND — url: "${publisher_url}" | adId: ${adId} | impressions LOST: ${count}`);
                return;
            }

            try {
                await prisma.impression.upsert({
                    where: {
                        ad_id_publisher_id_publisher_url: {
                            ad_id: adId,
                            publisher_id: publisher.id,
                            publisher_url: publisher_url
                        }
                    },
                    update: {
                        impression: { increment: count },
                    },
                    create: {
                        ad_id: adId,
                        publisher_id: publisher.id,
                        publisher_url: publisher_url,
                        impression: count,
                    },
                });

            } catch (dbError) {
                console.error(`[Impression Flush]  DB upsert FAILED — adId: ${adId}, publisher_url: ${publisher_url}, count: ${count}`, dbError);
            }
        })
    );

    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(`[Impression Flush] Unexpected rejection at index ${i}:`, result.reason);
        }
    });

}

function FlushSchedule(delay = 5000) {
    if (!isFlushScheduled) {
        isFlushScheduled = true;
        setTimeout(() => flushImpressions(), delay);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adId, publisher_url } = body;

        if (!adId || !publisher_url) {
            console.error(`[Track Impression] Missing fields — adId: ${adId}, publisher_url: ${publisher_url}`);
            return new Response(
                JSON.stringify({ success: false, error: "Missing adId or publisher_url" }),
                { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
            );
        }

        const key = `${adId}|${publisher_url}`;
        const prev = impression_queue.get(key) || 0;
        impression_queue.set(key, prev + 1);


        FlushSchedule();

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error('[Track Impression]  POST handler crashed — likely malformed JSON body:', error);
        return new Response(
            JSON.stringify({ success: false, error: String(error) }),
            { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
    }
}