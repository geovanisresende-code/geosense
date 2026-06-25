# GeoSense · Plataforma de Ensino

Plataforma de cursos + streaming da GeoSense, construída em **React + Vite + Tailwind CSS v4**,
pensada para ser integrada futuramente como aplicação externa dentro do Shopify (área de membros).

## Destaques

- **Meus Cursos** (dashboard) — cards de curso, progresso geral, estatísticas. Réplica fiel do design aprovado (dark + light).
- **Player de Curso** — vídeo, módulos em acordeão, materiais.
- **GeoSense Labs** 🧪 — laboratório virtual de geotecnologias. *Aprender fazendo, não assistindo.*
  - Botão de destaque na **sidebar**.
  - Experimentos práticos com **dados reais e imperfeitos**.
  - O usuário toma decisões técnicas e vê o **impacto imediato** (qualidade / custo / precisão).
  - Pontuação gamificada (XP, níveis, estrelas) e **comparação com a solução do especialista**.
  - Experimentos interativos já funcionais:
    1. **Planejar um Voo Fotogramétrico** — sliders de altura/sobreposição/velocidade → GSD, nº de fotos, tempo, baterias.
    2. **Detectar Falhas em Dados GNSS** — análise de PDOP/satélites/sigma, rejeição de pontos ruins.
    3. **Gerar um MDT a partir da Nuvem** — filtragem de solo, resolução de grid, interpolação → RMSE.
  - Experimentos bloqueados (escada de aprendizado): ortomosaico, volume de pilha, caso real GeoSense.
- **Tema Dark/Light** — botão no topo da página; preferência salva no `localStorage`.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção em /dist
```

## Estrutura

```
src/
├─ components/   Layout, Sidebar, Topbar, CourseCard, ProgressFooter, Logo
├─ pages/        Dashboard, CoursePlayer, Labs, LabExperiment, Placeholder
├─ context/      ThemeContext (dark/light)
├─ data/         courses.js, labs.js  (conteúdo + motor dos experimentos)
└─ index.css     tokens de tema (CSS vars) + Tailwind v4
```

## Integração com Shopify (próximo passo)

O app é um SPA React desacoplado. Para embutir como aplicação externa no tema Shopify,
basta montar o bundle gerado por `npm run build` em um container dentro de um arquivo `.liquid`
(ver padrão "mounting a React app in a Shopify theme"). O login e o pagamento ficam a cargo
do Shopify; a área de membros libera o acesso a esta plataforma.
