import { getNvidiaCatalog } from '@/lib/nvidia-catalog';
import { toModelInfo } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.NVIDIA_API_KEY) {
    return Response.json({ error: 'The AI service is not configured.' }, { status: 503 });
  }
  const catalog = await getNvidiaCatalog();
  return Response.json(
    { models: catalog.map(toModelInfo), count: catalog.length },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
