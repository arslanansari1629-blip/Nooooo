import { FALLBACK_MODELS, isChatModel } from './models';

let catalogCache = null;
let catalogExpires = 0;

export async function getNvidiaCatalog() {
  if (catalogCache && Date.now() < catalogExpires) return catalogCache;
  if (!process.env.NVIDIA_API_KEY) return FALLBACK_MODELS;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`Catalog returned ${response.status}`);
    const payload = await response.json();
    const ids = payload.data?.map((model) => model.id).filter(isChatModel) || [];
    const prioritized = FALLBACK_MODELS.filter((id) => ids.includes(id));
    const remaining = ids.filter((id) => !prioritized.includes(id)).sort();
    catalogCache = [...new Set([...prioritized, ...remaining])];
    if (!catalogCache.length) catalogCache = FALLBACK_MODELS;
    catalogExpires = Date.now() + 5 * 60 * 1000;
    return catalogCache;
  } catch (error) {
    console.error('Could not load NVIDIA model catalog:', error.message);
    return FALLBACK_MODELS;
  }
}
