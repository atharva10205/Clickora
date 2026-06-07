import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import { getAdCPC, getPublisher } from "../api/Ad/Track-click/route";

const BATCH_SIZE = 100;
const MIN_INTERVAL = 60_000;
const MAX_BACKOFF = 10 * 60_000; 

async function processClickQueue(): Promise<void> {
  const pipeline = redis.pipeline();
  
  for (let i = 0; i < BATCH_SIZE; i++) {
    pipeline.lpop("click_queue");
  }

  const results = await pipeline.exec();

  const raw = results
    .map((r) => r as string | null)
    .filter(Boolean) as string[];

  if (raw.length === 0) return;

  const clicks = raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
  const clicksToCreate: any[] = [];
  const adUpdateMap = new Map<string, number>();
  const seen = new Set<string>();

  for (const e of clicks) {
    const { adId, publisher_url, clickId } = e;
    if (seen.has(clickId)) continue;
    seen.add(clickId);

    const publisher = await getPublisher(publisher_url);
    if (!publisher) continue;

    const cpc = await getAdCPC(adId);
    if (!cpc) continue;

    clicksToCreate.push({ ad_id: adId, publisher_id: publisher.id, publisher_url });
    adUpdateMap.set(adId, (adUpdateMap.get(adId) || 0) + cpc);
  }

  if (clicksToCreate.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.click.createMany({ data: clicksToCreate });
    for (const [adId, totalCost] of adUpdateMap.entries()) {
      await tx.ad.update({
        where: { id: adId },
        data: { RemainingAmount: { decrement: totalCost } },
      });
    }
  });
}

declare global {
  var __clickWorkerInterval: ReturnType<typeof setInterval> | undefined;
  var __clickWorkerRunning: boolean;
  var __clickWorkerBackoff: number;
}

export function startClickWorker() {
  if (global.__clickWorkerInterval) return;

  global.__clickWorkerRunning = false;
  global.__clickWorkerBackoff = MIN_INTERVAL;

  const schedule = () => {
    global.__clickWorkerInterval = setTimeout(async () => {
      if (global.__clickWorkerRunning) {
        schedule(); 
        return;
      }

      global.__clickWorkerRunning = true;
      try {
        await processClickQueue();
        global.__clickWorkerBackoff = MIN_INTERVAL;
      } catch (err: any) {
        const isNetworkError =
          err?.cause?.code === "ENOTFOUND" ||
          err?.cause?.code === "ECONNREFUSED" ||
          err?.message === "fetch failed";

        if (isNetworkError) {
          global.__clickWorkerBackoff = Math.min(
            global.__clickWorkerBackoff * 2,
            MAX_BACKOFF
          );
          console.warn(
            `[clickWorker] Redis unreachable. Retrying in ${global.__clickWorkerBackoff / 1000}s`
          );
        } else {
          console.error("[clickWorker] Unexpected error:", err);
        }
      } finally {
        global.__clickWorkerRunning = false;
        schedule(); 
      }
    }, global.__clickWorkerBackoff);
  };

  schedule();
}

export function stopClickWorker() {
  if (global.__clickWorkerInterval) {
    clearTimeout(global.__clickWorkerInterval);
    global.__clickWorkerInterval = undefined;
  }
}