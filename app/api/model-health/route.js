import { getNvidiaCatalog } from '@/lib/nvidia-catalog';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testModel(model) {
  const started = Date.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with OK only.' }],
          max_tokens: 8,
          temperature: 0,
          stream: false,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const text = await response.text();
      let detail = '';
      if (!response.ok) {
        try {
          const parsed = JSON.parse(text);
          detail = parsed.detail || parsed.title || parsed.error?.message || text.slice(0, 180);
        } catch { detail = text.slice(0, 180); }
      }
      if (response.status === 429 && attempt === 0) {
        await sleep(6000);
        continue;
      }
      return {
        model,
        working: response.ok,
        status: response.status,
        ms: Date.now() - started,
        ...(response.ok ? {} : { error: String(detail).slice(0, 220) }),
      };
    } catch (error) {
      if (attempt === 0) { await sleep(1500); continue; }
      return { model, working: false, status: 'timeout/network', ms: Date.now() - started, error: error.message };
    }
  }
}

export async function GET(request) {
  const allModels = await getNvidiaCatalog();
  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit')) || 8));
  const models = allModels.slice(offset, offset + limit);
  const results = new Array(models.length);
  let cursor = 0;

  async function worker() {
    while (cursor < models.length) {
      const index = cursor++;
      results[index] = await testModel(models[index]);
      // Keep request volume moderate on the free API tier.
      await sleep(1400);
    }
  }
  await Promise.all([worker(), worker()]);

  const summary = {
    catalogTotal: allModels.length,
    tested: results.length,
    working: results.filter((item) => item.working).length,
    unavailable: results.filter((item) => item.status === 404).length,
    rateLimited: results.filter((item) => item.status === 429).length,
    otherErrors: results.filter((item) => !item.working && ![404, 429].includes(item.status)).length,
  };
  const nextOffset = offset + limit < allModels.length ? offset + limit : null;
  return Response.json({ summary, offset, nextOffset, results }, { headers: { 'Cache-Control': 'no-store' } });
}
