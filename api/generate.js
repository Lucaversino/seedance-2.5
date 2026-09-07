import { headers, json, safeModel } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const {
      mode = 'text', prompt, imageUrl, model,
      duration = '5', resolution = '720p', aspectRatio = '16:9', generateAudio = true
    } = req.body || {};

    if (!prompt?.trim()) return json(res, 400, { error: 'Prompt obrigatório.' });
    if (mode === 'image' && !imageUrl?.trim()) return json(res, 400, { error: 'URL da imagem obrigatória.' });

    const selectedModel = safeModel(model);
    const input = {
      prompt: prompt.trim(),
      duration: String(duration),
      resolution,
      aspect_ratio: aspectRatio,
      generate_audio: Boolean(generateAudio)
    };
    if (mode === 'image') input.image_url = imageUrl.trim();

    const response = await fetch(`https://queue.fal.run/${selectedModel}`, {
      method: 'POST', headers: headers(), body: JSON.stringify(input)
    });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw || 'Resposta inválida do fal.ai' }; }
    if (!response.ok) return json(res, response.status, {
      error: data.detail || data.message || data.error || `fal.ai respondeu HTTP ${response.status}`,
      details: data
    });

    return json(res, 200, {
      requestId: data.request_id,
      statusUrl: data.status_url,
      responseUrl: data.response_url
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
}
