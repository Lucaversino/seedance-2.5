import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, CircleDollarSign, Clapperboard, Copy, Film,
  Image as ImageIcon, KeyRound, Loader2, Play, Save, Settings2,
  ShieldCheck, Sparkles, Terminal, Volume2, WandSparkles, XCircle
} from 'lucide-react';

type Config = {
  provider: 'fal';
  textModel: string;
  imageModel: string;
  referenceModel: string;
  resolution: '480p' | '720p';
  aspectRatio: string;
  duration: string;
  generateAudio: boolean;
  hasApiKey?: boolean;
};

const DEFAULT_CONFIG: Config = {
  provider: 'fal',
  textModel: 'bytedance/seedance-2.5/text-to-video',
  imageModel: 'bytedance/seedance-2.5/image-to-video',
  referenceModel: 'bytedance/seedance-2.5/reference-to-video',
  resolution: '720p',
  aspectRatio: '16:9',
  duration: '5',
  generateAudio: true,
};

const STORAGE_KEY = 'seedance-2.5-config-ptbr';

export default function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{type:'ok'|'error'; text:string} | null>(null);
  const [mode, setMode] = useState<'text'|'image'>('text');
  const [prompt, setPrompt] = useState('Um barco de pesca navegando no oceano ao pôr do sol, câmera cinematográfica, ondas realistas, movimento suave.');
  const [imageUrl, setImageUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    let localCfg: Partial<Config> = {};
    try { localCfg = local ? JSON.parse(local) : {}; } catch {}

    fetch('/api/config')
      .then(r => r.json())
      .then(server => setConfig({...DEFAULT_CONFIG, ...localCfg, ...server, resolution: localCfg.resolution || DEFAULT_CONFIG.resolution, aspectRatio: localCfg.aspectRatio || DEFAULT_CONFIG.aspectRatio, duration: localCfg.duration || DEFAULT_CONFIG.duration, generateAudio: localCfg.generateAudio ?? DEFAULT_CONFIG.generateAudio}))
      .catch(() => setConfig({...DEFAULT_CONFIG, ...localCfg}))
      .finally(() => setLoading(false));
  }, []);

  const modelInUse = mode === 'text' ? config.textModel : config.imageModel;
  const estimated = useMemo(() => {
    const seconds = Number(config.duration || 5);
    const rate = config.resolution === '480p' ? 0.2205 : 0.473;
    return (seconds * rate).toFixed(2);
  }, [config.duration, config.resolution]);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      resolution: config.resolution,
      aspectRatio: config.aspectRatio,
      duration: config.duration,
      generateAudio: config.generateAudio
    }));
    setNotice({type:'ok', text:'Padrões de geração salvos neste navegador.'});
  };

  const testConfig = async () => {
    setNotice(null);
    try {
      const res = await fetch('/api/check', {method:'POST'});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Configuração inválida.');
      setConfig(prev => ({...prev, hasApiKey:true}));
      setNotice({type:'ok', text:data.message});
    } catch (e:any) { setNotice({type:'error', text:e.message}); }
  };

  const runGeneration = async () => {
    if (!prompt.trim()) return setNotice({type:'error', text:'Digite um prompt antes de gerar.'});
    if (mode === 'image' && !imageUrl.trim()) return setNotice({type:'error', text:'Informe a URL da imagem.'});
    setRunning(true); setVideoUrl(''); setJobStatus('Enviando para a fila do fal.ai…'); setNotice(null);
    try {
      const res = await fetch('/api/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({mode, prompt, imageUrl, model:modelInUse, duration:config.duration, resolution:config.resolution, aspectRatio:config.aspectRatio, generateAudio:config.generateAudio})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar tarefa.');
      if (!data.requestId) throw new Error('A API não retornou o ID da tarefa.');
      setJobStatus(`Na fila • ${data.requestId.slice(0, 8)}…`);

      for (let i=0; i<120; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/status?id=${encodeURIComponent(data.requestId)}&model=${encodeURIComponent(modelInUse)}`);
        const statusData = await statusRes.json();
        if (!statusRes.ok) throw new Error(statusData.error || 'Erro consultando tarefa.');
        const status = statusData.status;
        setJobStatus(status === 'IN_PROGRESS' ? 'Gerando vídeo…' : status === 'IN_QUEUE' ? 'Aguardando na fila…' : status || 'Processando…');
        if (status === 'COMPLETED') {
          const resultRes = await fetch(`/api/result?id=${encodeURIComponent(data.requestId)}&model=${encodeURIComponent(modelInUse)}`);
          const result = await resultRes.json();
          if (!resultRes.ok) throw new Error(result.error || 'Erro buscando resultado.');
          const url = result.video?.url || result.data?.video?.url;
          if (!url) throw new Error('A geração terminou, mas não retornou URL do vídeo.');
          setVideoUrl(url); setJobStatus('Concluído'); setNotice({type:'ok', text:'Vídeo gerado com sucesso.'});
          return;
        }
        if (status === 'FAILED') throw new Error(statusData.error || 'A geração falhou no provedor.');
      }
      throw new Error('Tempo limite do painel atingido. Consulte a tarefa novamente no provedor.');
    } catch (e:any) {
      setJobStatus('Falhou'); setNotice({type:'error', text:e.message});
    } finally { setRunning(false); }
  };

  const field = 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';
  const label = 'mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400';

  if (loading) return <div className="min-h-screen bg-[#070811] grid place-items-center text-slate-300"><Loader2 className="h-8 w-8 animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#070811] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#090a14]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500"><Clapperboard className="h-6 w-6"/></div><div><div className="font-bold">Seedance 2.5 BR</div><div className="text-xs text-slate-500">Painel em português • GitHub + Vercel</div></div></div>
          <div className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${config.hasApiKey?'border-emerald-500/20 bg-emerald-500/10 text-emerald-300':'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}><ShieldCheck className="h-4 w-4"/>{config.hasApiKey?'API configurada':'Configurar FAL_KEY'}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7">
        <section className="mb-7 rounded-3xl border border-white/7 bg-gradient-to-br from-violet-500/15 via-slate-900/80 to-fuchsia-500/10 p-6 md:p-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-300"><Sparkles className="h-4 w-4"/> BYTE DANCE • VIDEO AI</div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Seedance 2.5 em português, pronto para Vercel.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">A chave da API fica somente no backend. No Vercel, adicione <b>FAL_KEY</b> em Settings → Environment Variables e faça um novo deploy.</p>
        </section>

        {notice && <div className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.type==='ok'?'border-emerald-500/25 bg-emerald-500/10 text-emerald-200':'border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>{notice.type==='ok'?<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0"/>:<XCircle className="mt-0.5 h-5 w-5 shrink-0"/>}<span>{notice.text}</span></div>}

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/7 bg-[#0d0f1b] p-5 md:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><KeyRound className="h-5 w-5 text-violet-400"/>Conexão com fal.ai</h2>
              <div className={`rounded-2xl border p-4 ${config.hasApiKey?'border-emerald-500/20 bg-emerald-500/5':'border-amber-500/20 bg-amber-500/5'}`}>
                <div className="font-semibold">{config.hasApiKey?'FAL_KEY detectada':'FAL_KEY ainda não detectada'}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">A chave não é digitada neste navegador. Isso evita expor sua credencial no código público do GitHub.</p>
              </div>
              <button onClick={testConfig} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold hover:border-slate-600"><Activity className="h-4 w-4"/>Verificar API</button>
            </div>

            <div className="rounded-3xl border border-white/7 bg-[#0d0f1b] p-5 md:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><Settings2 className="h-5 w-5 text-violet-400"/>Padrões de geração</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={label}>Resolução</label><select className={field} value={config.resolution} onChange={e=>setConfig({...config,resolution:e.target.value as Config['resolution']})}><option>480p</option><option>720p</option></select></div>
                <div><label className={label}>Formato</label><select className={field} value={config.aspectRatio} onChange={e=>setConfig({...config,aspectRatio:e.target.value})}><option>16:9</option><option>21:9</option><option>9:16</option><option>1:1</option><option>4:3</option><option>3:4</option></select></div>
                <div><label className={label}>Duração</label><select className={field} value={config.duration} onChange={e=>setConfig({...config,duration:e.target.value})}>{Array.from({length:27},(_,i)=>i+4).map(n=><option key={n} value={String(n)}>{n} segundos</option>)}</select></div>
                <div><label className={label}>Áudio nativo</label><button onClick={()=>setConfig({...config,generateAudio:!config.generateAudio})} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm ${config.generateAudio?'border-violet-500/30 bg-violet-500/10 text-violet-200':'border-slate-700 bg-slate-950 text-slate-400'}`}><span className="flex items-center gap-2"><Volume2 className="h-4 w-4"/>{config.generateAudio?'Ativado':'Desativado'}</span><span className={`h-5 w-9 rounded-full p-0.5 ${config.generateAudio?'bg-violet-500':'bg-slate-700'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${config.generateAudio?'translate-x-4':'translate-x-0'}`}/></span></button></div>
              </div>
              <button onClick={saveConfig} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold hover:bg-violet-500"><Save className="h-4 w-4"/>Salvar padrões</button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/7 bg-[#0d0f1b] p-5 md:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><WandSparkles className="h-5 w-5 text-fuchsia-400"/>Gerador de vídeo</h2>
              <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-950 p-1"><button onClick={()=>setMode('text')} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${mode==='text'?'bg-violet-600 text-white':'text-slate-500'}`}><Terminal className="h-4 w-4"/>Texto → Vídeo</button><button onClick={()=>setMode('image')} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold ${mode==='image'?'bg-violet-600 text-white':'text-slate-500'}`}><ImageIcon className="h-4 w-4"/>Imagem → Vídeo</button></div>
              <div className="space-y-4">
                {mode==='image' && <div><label className={label}>URL da imagem</label><input className={field} value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://.../imagem.jpg"/></div>}
                <div><label className={label}>Prompt</label><textarea className={`${field} min-h-40 resize-y`} value={prompt} onChange={e=>setPrompt(e.target.value)} /></div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Modelo</span><span className="truncate font-mono text-violet-300">{modelInUse}</span></div>
                  <div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-500">Saída</span><span>{config.resolution} • {config.aspectRatio} • {config.duration}s</span></div>
                  <div className="mt-3 flex items-center justify-between text-xs"><span className="flex items-center gap-1 text-slate-500"><CircleDollarSign className="h-3.5 w-3.5"/>Estimativa*</span><span>≈ US$ {estimated}</span></div>
                </div>
                <button onClick={runGeneration} disabled={running || !config.hasApiKey} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 text-sm font-black hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{running?<Loader2 className="h-5 w-5 animate-spin"/>:<Play className="h-5 w-5 fill-current"/>}{running?'GERANDO…':config.hasApiKey?'GERAR VÍDEO':'CONFIGURE A FAL_KEY NO VERCEL'}</button>
                {jobStatus && <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-3 text-xs text-slate-400">{running?<Loader2 className="h-4 w-4 animate-spin text-violet-400"/>:<CheckCircle2 className="h-4 w-4 text-emerald-400"/>}{jobStatus}</div>}
              </div>
            </div>

            {videoUrl && <div className="overflow-hidden rounded-3xl border border-white/7 bg-[#0d0f1b] p-4"><video src={videoUrl} controls className="aspect-video w-full rounded-2xl bg-black object-contain"/><div className="mt-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><Film className="h-4 w-4 text-violet-400"/>Resultado</div><button onClick={()=>navigator.clipboard.writeText(videoUrl)} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"><Copy className="h-3.5 w-3.5"/>Copiar URL</button></div></div>}
          </section>
        </div>
        <p className="mt-7 text-center text-xs text-slate-700">* Estimativa informativa. Confirme o preço atual no fal.ai antes de gerar em volume.</p>
      </main>
    </div>
  );
}
