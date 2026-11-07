export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request) {
  const model = new URL(request.url).searchParams.get('model');
  if (!process.env.NVIDIA_API_KEY || !model || !/^[a-zA-Z0-9_.:/-]{2,180}$/.test(model)) {
    return Response.json({ error: 'A valid model is required.' }, { status: 400 });
  }
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with exactly OK.' }],
        max_tokens: 16,
        temperature: 0,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    return Response.json({
      model,
      status: response.status,
      working: response.ok && Boolean(data.choices?.[0]?.message?.content),
      reply: data.choices?.[0]?.message?.content?.slice(0, 80) || null,
      finishReason: data.choices?.[0]?.finish_reason || null,
      error: data.detail || data.message || data.error || null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ model, working: false, error: error.message }, { status: 502 });
  }
}
