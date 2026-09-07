import { json } from './_shared.js';

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!process.env.FAL_KEY) return json(res, 400, { error: 'FAL_KEY não configurada. Adicione a variável no Vercel e faça um novo deploy.' });
  return json(res, 200, { ok: true, message: 'FAL_KEY encontrada no servidor. O Seedance 2.5 está pronto para uso.' });
}
