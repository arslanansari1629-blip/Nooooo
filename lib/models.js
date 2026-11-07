export const AUTO_MODEL = {
  id: 'auto',
  name: 'Auto · Best available',
  provider: 'Nexora',
  description: 'Automatically selects an available free model',
  badge: 'SMART',
};

// Used when the live NVIDIA catalog is temporarily unavailable.
export const FALLBACK_MODELS = [
  'google/gemma-4-31b-it',
  'minimaxai/minimax-m3.1-flash',
  'stepfun-ai/step-5-preview',
];

// Confirmed with real inference calls: catalog entries can outlive deployment.
const UNAVAILABLE_MODELS = new Set([
  'google/gemma-3-4b-it',
  'google/gemma-3-12b-it',
  'moonshotai/kimi-k2.6',
  'mistralai/mistral-7b-instruct-v0.3',
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/nemotron-4-340b-instruct',
  'qwen/qwen3.5-397b-a17b',
]);

const NON_CHAT_MODEL = /(embed|rerank|retriev|whisper|speech|\btts\b|audio|\bclip\b|siglip|fuyu|paligemma|llava|vila|neva-|kosmos|deplot|pix2struct|paddleocr|segment-anything|stable-diffusion|image|video|mesh|nerf|openfold|diffdock|protein|molecule|esm-|biobert|magnify|riva|guard|reward|topic-control|calibration)/i;

const NAME_REPLACEMENTS = [
  [/^llama-/i, 'Llama '],
  [/^qwen/i, 'Qwen '],
  [/^mistral-/i, 'Mistral '],
  [/^mixtral-/i, 'Mixtral '],
  [/^gemma-/i, 'Gemma '],
  [/^phi-/i, 'Phi '],
  [/^deepseek-/i, 'DeepSeek '],
  [/^nemotron-/i, 'Nemotron '],
];

export function isChatModel(id) {
  return typeof id === 'string' && id.includes('/') && !NON_CHAT_MODEL.test(id) && !UNAVAILABLE_MODELS.has(id);
}

export function modelProvider(id) {
  const provider = id?.split('/')?.[0] || 'NVIDIA';
  const names = {
    meta: 'Meta', nvidia: 'NVIDIA', qwen: 'Qwen', mistralai: 'Mistral AI',
    google: 'Google', microsoft: 'Microsoft', 'deepseek-ai': 'DeepSeek',
    '01-ai': '01.AI', 'thudm': 'Zhipu AI', 'ibm': 'IBM', 'snowflake': 'Snowflake',
    'writer': 'Writer', 'aisingapore': 'AI Singapore', 'tii': 'TII', 'openai': 'OpenAI',
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function friendlyModelName(id) {
  if (id === 'auto') return AUTO_MODEL.name;
  const fallback = FALLBACK_MODELS.find((model) => model === id);
  if (fallback === 'meta/llama-3.3-70b-instruct') return 'Llama 3.3 70B';
  if (fallback === 'meta/llama-3.1-8b-instruct') return 'Llama 3.1 8B Swift';
  let name = id?.split('/')?.pop() || 'NVIDIA NIM';
  name = name
    .replace(/-instruct(-|$)/gi, ' ')
    .replace(/-chat(-|$)/gi, ' ')
    .replace(/-v\d+(\.\d+)*$/i, '')
    .replace(/[_]/g, ' ')
    .replace(/-/g, ' ')
    .trim();
  for (const [pattern, replacement] of NAME_REPLACEMENTS) name = name.replace(pattern, replacement);
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\s+/g, ' ').trim();
}

export function toModelInfo(id) {
  const parameterSize = id.match(/(?:^|[-_])(\d+(?:\.\d+)?)([bm])(?:[-_]|$)/i);
  return {
    id,
    name: friendlyModelName(id),
    provider: modelProvider(id),
    description: `${modelProvider(id)} · Free on NVIDIA NIM`,
    badge: parameterSize ? `${parameterSize[1]}${parameterSize[2].toUpperCase()}` : 'NIM',
  };
}
