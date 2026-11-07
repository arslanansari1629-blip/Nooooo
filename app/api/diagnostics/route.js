import { getNvidiaCatalog } from '@/lib/nvidia-catalog';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const catalog = await getNvidiaCatalog();
  const preferred = [
    'nvidia/nemotron-3-super-120b-a12b',
    'google/gemma-4-31b-it',
    'deepseek-ai/deepseek-v4.1-flash',
    'moonshotai/kimi-k2.6',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'mistralai/mistral-7b-instruct-v0.3',
  ];
  const candidates = [...new Set([...preferred.filter((id) => catalog.includes(id)), ...catalog])].slice(0, 12);
  const results = [];

  for (const model of candidates) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply OK' }],
          max_tokens: 8,
          stream: false,
        }),
        signal: AbortSignal.timeout(12000),
      });
      const text = await response.text();
      results.push({ model, status: response.status, response: text.slice(0, 700) });
      if (response.ok) break;
    } catch (error) {
      results.push({ model, status: 'network_error', response: error.message });
    }
  }
  return Response.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
}
