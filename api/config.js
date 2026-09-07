import { MODELS, json } from './_shared.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  return json(res, 200, {
    provider: 'fal',
    textModel: MODELS.text,
    imageModel: MODELS.image,
    referenceModel: MODELS.reference,
    hasApiKey: Boolean(process.env.FAL_KEY)
  });
}
