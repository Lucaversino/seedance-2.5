import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({limit:'2mb'}));

const MODELS = {
  text:'bytedance/seedance-2.5/text-to-video',
  image:'bytedance/seedance-2.5/image-to-video',
  reference:'bytedance/seedance-2.5/reference-to-video'
};
const safeModel = m => Object.values(MODELS).includes(m) ? m : (()=>{throw new Error('Modelo Seedance 2.5 inválido.');})();
const headers = () => {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY não configurada no arquivo .env.');
  return {Authorization:`Key ${process.env.FAL_KEY}`,'Content-Type':'application/json'};
};

app.get('/api/config', (_req,res)=>res.json({provider:'fal',textModel:MODELS.text,imageModel:MODELS.image,referenceModel:MODELS.reference,hasApiKey:Boolean(process.env.FAL_KEY)}));
app.post('/api/check', (_req,res)=>process.env.FAL_KEY?res.json({ok:true,message:'FAL_KEY encontrada no servidor. O Seedance 2.5 está pronto para uso.'}):res.status(400).json({error:'FAL_KEY não configurada. Crie o arquivo .env com base no .env.example.'}));
app.post('/api/generate', async (req,res)=>{
  try {
    const {mode='text',prompt,imageUrl,model,duration='5',resolution='720p',aspectRatio='16:9',generateAudio=true}=req.body||{};
    if(!prompt?.trim()) return res.status(400).json({error:'Prompt obrigatório.'});
    if(mode==='image'&&!imageUrl?.trim()) return res.status(400).json({error:'URL da imagem obrigatória.'});
    const selected=safeModel(model);
    const input={prompt:prompt.trim(),duration:String(duration),resolution,aspect_ratio:aspectRatio,generate_audio:Boolean(generateAudio)};
    if(mode==='image') input.image_url=imageUrl.trim();
    const r=await fetch(`https://queue.fal.run/${selected}`,{method:'POST',headers:headers(),body:JSON.stringify(input)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) return res.status(r.status).json({error:data.detail||data.message||data.error||`HTTP ${r.status}`});
    res.json({requestId:data.request_id,statusUrl:data.status_url,responseUrl:data.response_url});
  } catch(e){res.status(500).json({error:e.message});}
});
app.get('/api/status', async (req,res)=>{
  try { const model=safeModel(String(req.query.model||'')); const id=String(req.query.id||''); const r=await fetch(`https://queue.fal.run/${model}/requests/${encodeURIComponent(id)}/status`,{headers:headers()}); const data=await r.json().catch(()=>({})); if(!r.ok)return res.status(r.status).json({error:data.detail||data.message||data.error||`HTTP ${r.status}`}); res.json(data);} catch(e){res.status(500).json({error:e.message});}
});
app.get('/api/result', async (req,res)=>{
  try { const model=safeModel(String(req.query.model||'')); const id=String(req.query.id||''); const r=await fetch(`https://queue.fal.run/${model}/requests/${encodeURIComponent(id)}`,{headers:headers()}); const data=await r.json().catch(()=>({})); if(!r.ok)return res.status(r.status).json({error:data.detail||data.message||data.error||`HTTP ${r.status}`}); res.json(data);} catch(e){res.status(500).json({error:e.message});}
});

if(process.env.NODE_ENV==='production'){
  app.use(express.static(path.join(__dirname,'dist')));
  app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'dist','index.html')));
}else{
  const {createServer}=await import('vite');
  const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
  app.use(vite.middlewares);
}
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`Seedance 2.5 BR: http://localhost:${port}`));
