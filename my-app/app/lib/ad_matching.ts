import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";

const MATCH_CONFIG = {
    weight: {
        tag_match: 40,
        keyword_match: 40,
        cost_per_click: 20
    },
    minMatchScore: 10,
    maxMatchscore: 100,
    Max_Ads_For_publisher: 6,
}

function normalise_cpc(cpc) {
    const min_CPC = 0.0008;
    const max_CPC = 1;

    const normailzation = (cpc - min_CPC) / (max_CPC - min_CPC);
    return Math.max(0, Math.min(1, normailzation));
}

function calculate_array_simmilarity(arr1, arr2) {
    const set1 = new Set(arr1.map(v => v.toLowerCase().trim()));
    const set2 = new Set(arr2.map(v => v.toLowerCase().trim()));

    const intersected_arr = [...set1].filter(v => set2.has(v));
    const union_arr = new Set([...set1, ...set2]);

    if (union_arr.size === 0) return 0;

    return intersected_arr.length / union_arr.size
}

function calculateMatchScore(publisher, ad) {

    let score = 0;

    const Tag_score = calculate_array_simmilarity(publisher.Tags || [], ad.Tags || []);
    const Keywords_score = calculate_array_simmilarity(publisher.keywords || [], ad.keywords || []);

    const cpc_score = normalise_cpc(Number(ad.cost_per_click || 0));

    score = score + (Tag_score * MATCH_CONFIG.weight.tag_match);
    score = score + (Keywords_score * MATCH_CONFIG.weight.keyword_match);
    score = score + (cpc_score * MATCH_CONFIG.weight.cost_per_click);


    return score;
}


async function GetEligebleAd() {
    const whereCondition = {
        title: { not: null },
        destination_url: { not: null },
        cost_per_click: { not: null },
        RemainingAmount: { not: null },
        status: true
    };

    const allAds = await prisma.ad.findMany({
        where: whereCondition,
        select: { id: true, RemainingAmount: true, cost_per_click: true, Clicks: true }
    });


    const eligible = allAds.filter(ad =>
        ad.RemainingAmount! > Number(ad.cost_per_click!) * (ad.Clicks ?? 0)
    );

    if (eligible.length <= 100) {
        return prisma.ad.findMany({
            where: {
                id: { in: eligible.map(a => a.id) }
            }
        });
    }


    const randomIds = eligible
        .sort(() => Math.random() - 0.5)
        .slice(0, 100)
        .map(a => a.id);

    return prisma.ad.findMany({
        where: {
            id: { in: randomIds }
        }
    });
}

async function logAdImpression(ad_id, website_id, match_score) {
    console.log(
        `Ad ${ad_id} shown on Website ${website_id} (Score: ${match_score})`
    );
}


async function selectAdsForPublisher(website_url, logImpression = false) {

    const cacheKey = `ads:publisher:${website_url}`;
    const CACHE_TTL = 300;

    try {
        const cached = await redis.get(cacheKey)
        if (cached) {

            const parsedCache = typeof cached === 'string' ? JSON.parse(cached) : cached;
            if (logImpression) {
                const cachedAds = parsedCache as any[];
                Promise.all(cachedAds.map(ad => logAdImpression(ad.id, website_url, parseFloat(ad.matchScore)))
                ).catch(err => console.error('Error logging impressions:', err));
            }
            return parsedCache;
        }
        console.log(`Cache MISS for publisher: ${website_url}`);
    } catch (error) {
        console.error('Redis GET error:', error);
    }


    const count = MATCH_CONFIG.Max_Ads_For_publisher;

    const publisher = await prisma.publisher.findUnique({
        where: { website_url: website_url }
    })

    if (!publisher) return [];

    const ads = await GetEligebleAd();

    const adsWithScore = ads.map(ad => ({
        ...ad,
        matchScore: calculateMatchScore(publisher, ad),
    }));


    const filteredAds = adsWithScore.filter(ad => ad.matchScore >= MATCH_CONFIG.minMatchScore);
    const sortedAds = filteredAds.sort((a, b) => b.matchScore - a.matchScore);
    const scoredAds = sortedAds.slice(0, count);


    if (scoredAds.length === 0) {
        if (publisher.status !== "INACTIVE") {
            await prisma.publisher.update({
                where: { id: publisher.id },
                data: { status: "INACTIVE" }
            });
        }
        return [];
    }

    if (publisher.status !== "ACTIVE") {
        await prisma.publisher.update({
            where: { id: publisher.id },
            data: { status: "ACTIVE" }
        });
    }


    if (logImpression) {
        for (const ad of scoredAds) {
            await logAdImpression(ad.id, website_url, ad.matchScore);
        }
    }


    const result = scoredAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.Description,
        imageUrl: ad.imageUrl,
        destinationUrl: ad.destination_url,
        businessName: ad.business_name,
        matchScore: ad.matchScore.toFixed(2),
    }));



    try {

        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

    } catch (error) {
        console.error("error", error)
    }


    return result;
}

async function Endpoint(req, res) {

    const { website_id, website_url } = req.body;

    let publisher = null;

    if (website_id) {
        publisher = await prisma.publisher.findUnique({
            where: { id: website_id },
        });
    } else if (website_url) {
        publisher = await prisma.publisher.findUnique({
            where: { website_url },
        });
    }

    if (!publisher) {
        return res.status(404).json({ success: false });
    }

    const ads = await selectAdsForPublisher(publisher.website_url, true);

    if (!ads.length) {
        return res.json({ success: false });
    }

    res.json({ success: true, ads });
}


async function previewMatches(websiteId) {

    const publisher = await prisma.publisher.findUnique({
        where: { id: websiteId },
    });

    const ads = await GetEligebleAd();

    return ads
        .map(ad => {
            const score = calculateMatchScore(publisher, ad);
            return {
                adId: ad.id,
                businessName: ad.business_name,
                totalScore: score.toFixed(2),
                tagMatch:
                    (calculate_array_simmilarity(publisher.Tags, ad.Tags) * 100).toFixed(1) +
                    '%',
                keywordMatch:
                    (calculate_array_simmilarity(publisher.keywords, ad.keywords) * 100).toFixed(1) +
                    '%',
                cpc: ad.cost_per_click?.toString(),
            };
        })
        .sort((a, b) => b.totalScore - a.totalScore);
}
export {
    selectAdsForPublisher,
    Endpoint,
    previewMatches,
};


