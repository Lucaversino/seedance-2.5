# Seedance 2.5 BR — Painel em Português

Painel web para gerar vídeos com **Seedance 2.5** usando o **fal.ai**, preparado para publicar no **GitHub** e implantar no **Vercel** sem expor sua chave privada no navegador.

## Recursos

- Interface 100% em português do Brasil
- Texto → Vídeo
- Imagem → Vídeo por URL
- Seedance 2.5 via fal.ai
- Resolução 480p e 720p
- Formatos 21:9, 16:9, 4:3, 1:1, 3:4 e 9:16
- Duração de 4 a 30 segundos
- Áudio nativo liga/desliga
- Fila, status e resultado da geração
- Player para assistir ao vídeo
- Compatível com GitHub + Vercel
- `FAL_KEY` protegida no backend

## Endpoints do Seedance 2.5

- Texto → Vídeo: `bytedance/seedance-2.5/text-to-video`
- Imagem → Vídeo: `bytedance/seedance-2.5/image-to-video`
- Referência → Vídeo: `bytedance/seedance-2.5/reference-to-video`

## 1. Colocar no GitHub

Crie um repositório vazio, por exemplo:

```text
seedance-2.5-ptbr
```

Envie **todos os arquivos desta pasta** para o repositório. Não envie o arquivo `.env`.

Pelo Git:

```bash
git init
git add .
git commit -m "Seedance 2.5 BR"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/seedance-2.5-ptbr.git
git push -u origin main
```

## 2. Publicar no Vercel

1. Entre no Vercel.
2. Clique em **Add New → Project**.
3. Importe o repositório `seedance-2.5-ptbr` do GitHub.
4. O Vercel detectará o Vite automaticamente.
5. Antes ou depois do primeiro deploy, abra **Settings → Environment Variables**.
6. Crie a variável:

```text
FAL_KEY = sua_chave_do_fal.ai
```

7. Marque Production, Preview e Development se quiser usar em todos os ambientes.
8. Salve e faça **Redeploy**.

> Importante: use `FAL_KEY`. Não use `VITE_FAL_KEY`, pois variáveis iniciadas por `VITE_` podem ser incorporadas ao JavaScript público do navegador.

## 3. Rodar no computador

```bash
npm install
```

Copie `.env.example` para `.env` e informe sua chave:

```env
FAL_KEY=sua_chave_aqui
PORT=3000
```

Depois:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Segurança

O navegador conversa apenas com as rotas `/api/*`. A `FAL_KEY` fica no ambiente do servidor/Vercel e não é enviada ao front-end.

## Estrutura

```text
api/
  _shared.js
  check.js
  config.js
  generate.js
  result.js
  status.js
src/
  App.tsx
  index.css
  main.tsx
.env.example
.gitignore
index.html
package.json
server.mjs
vercel.json
vite.config.ts
```

## Observação de custo

A geração no fal.ai utiliza créditos da sua conta. Faça testes curtos antes de gerar vídeos longos em quantidade.
