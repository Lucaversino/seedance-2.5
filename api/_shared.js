const MODELS = {
  text: 'bytedance/seedance-2.5/text-to-video',
  image: 'bytedance/seedance-2.5/image-to-video',
  reference: 'bytedance/seedance-2.5/reference-to-video'
};

export function json(res, status, body) {
  res.status(status).json(body);
}

export function requireKey() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY não configurada no servidor/Vercel.');
  return key;
}

export function safeModel(model) {
  const allowed = Object.values(MODELS);
  if (!allowed.includes(model)) throw new Error('Modelo Seedance 2.5 inválido.');
  return model;
}

export function headers() {
  return {
    Authorization: `Key ${requireKey()}`,
    'Content-Type': 'application/json'
  };
}

export { MODELS };
