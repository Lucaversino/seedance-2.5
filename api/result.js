import { headers, json, safeModel } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  try {
    const id = String(req.query.id || '');
    const model = safeModel(String(req.query.model || ''));
    if (!id) return json(res, 400, { error: 'ID da tarefa obrigatório.' });
    const response = await fetch(`https://queue.fal.run/${model}/requests/${encodeURIComponent(id)}`, { headers: headers() });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw || 'Resposta inválida do fal.ai' }; }
    if (!response.ok) return json(res, response.status, { error: data.detail || data.message || data.error || `HTTP ${response.status}` });
    return json(res, 200, data);
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
}
