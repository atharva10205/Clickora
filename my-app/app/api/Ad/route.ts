import { selectAdsForPublisher } from "@/app/lib/ad_matching";
import crypto from 'crypto';


const SECRET = process.env.TRACKING_SECRET!;


function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function createTrackingToken(adId: string, publisherUrl: string): string {
  const payload = { adId, publisherUrl, exp: Date.now() + 240 * 1000 };
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url');
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const publisher_website_url = searchParams.get("id");

  if (!publisher_website_url) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing id parameter" }),
      {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }

  try {

    const ads = await selectAdsForPublisher(publisher_website_url, true) as any[];

    if (!ads || ads.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No ads available" }),
        { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const randomAd = ads[Math.floor(Math.random() * ads.length)];

    const token = createTrackingToken(randomAd.id, publisher_website_url);

    const adData = JSON.stringify({
      adId: randomAd.id,
      publisher_url: publisher_website_url,
      targetUrl: randomAd.destinationUrl,
      trackingToken: token
    });


    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ad Template</title>
    <script>window.AD_DATA = ${adData};</script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .ad-container {
            max-width: 420px;
            width: 100%;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            text-decoration: none;
            display: block;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .ad-container:hover {
            border-color: #b0b0b0;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            transform: translateY(-2px);
        }
        
        .ad-image-wrapper {
            position: relative;
            width: 100%;
            padding-top: 56.25%; /* 16:9 aspect ratio */
            overflow: hidden;
        }
        
        .ad-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ad-container:hover .ad-image {
            transform: scale(1.05);
        }
        
        .ad-content {
            padding: 20px 24px 24px;
        }
        
        .business-name {
            font-size: 13px;
            font-weight: 500;
            color: #888;
            margin-bottom: 8px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }
        
        .ad-title {
            font-size: 22px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 12px;
            line-height: 1.3;
            letter-spacing: -0.3px;
        }
        
        .ad-description {
            font-size: 15px;
            color: #555;
            line-height: 1.6;
            letter-spacing: 0.1px;
        }
    </style>
</head>
<body>
    <a href="https://example.com/product" class="ad-container">
        <div class="ad-image-wrapper">
            <img 
                src="${randomAd.imageUrl}"
                alt="Premium Wireless Headphones" 
                class="ad-image"
            />
        </div>
        
        <div class="ad-content">
            <div class="business-name">${randomAd.businessName}</div>
            <h2 class="ad-title">${randomAd.title}</h2>
            <p class="ad-description">${randomAd.description}</p>
        </div>
    </a>
</body>
</html>`;

    return new Response(JSON.stringify({ success: true, html }), {
      status: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
}