# GeoSense · Plataforma de Ensino

Plataforma de cursos + streaming da GeoSense, construída em **React + Vite + Tailwind CSS v4**,
pensada para ser integrada futuramente como aplicação externa dentro do Shopify (área de membros).

## Acesso

A plataforma abre em uma **tela de login**. Só se entra no dashboard através dela.

- **Administrador (protótipo):** usuário `admin` · senha `123` → abre o **Painel de Controle**.
- **Qualquer outro usuário + senha** → entra como **aluno** (dashboard).

> Autenticação de protótipo (client-side). Na integração com o Shopify, login e pagamento
> passam a ser responsabilidade do Shopify (área de membros).

## Painel de Controle (admin)

Onde o cliente cadastra **todo o conteúdo** — sem dados fictícios no código:

- **Visão Geral** — contadores + checklist "Informações a coletar com o cliente".
- **Cursos** — cadastra cada curso e, dentro dele, os **módulos** e as **aulas** (com link de vídeo opcional).
- **Calendário** — eventos (turmas presenciais, lives, prazos): data, horário, modalidade, local.
- **Biblioteca** — materiais (e-book, PDF, vídeo, artigo, link) com categoria e URL.
- **Categorias** — gerencia as áreas exibidas na barra lateral.
- **Configurações** — nome/assinatura da plataforma + **exportar / importar / limpar** dados (JSON).

Os dados ficam salvos no navegador (`localStorage`) e podem ser exportados em JSON para backup
ou para migrar ao servidor/Shopify.

## Demais telas

- **Meus Cursos** (dashboard) — cursos cadastrados; estados vazios quando não há conteúdo.
- **Player de Curso** — vídeo (YouTube/Vimeo/mp4) + módulos e aulas em acordeão.
- **Calendário** e **Biblioteca** — leem o conteúdo cadastrado no painel.
- **GeoSense Labs** 🧪 — laboratório virtual de geotecnologias (*aprender fazendo*): experimentos
  interativos e gamificados com comparação à solução de um especialista
  (Planejar Voo Fotogramétrico, Detectar Falhas GNSS, Gerar MDT + trilha bloqueada).
- **Tema Dark/Light** — botão presente no login, no topo da plataforma e no painel.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção em /dist
```

## Estrutura

```
src/
├─ components/   Layout, Sidebar, Topbar, CourseCard, CatalogSummary, EmptyState, Logo, ThemeToggle
├─ pages/        Login, Dashboard, CoursePlayer, CalendarPage, LibraryPage, Labs, LabExperiment
│  └─ admin/     Admin (shell) + Overview, Courses, Calendar, Library, Categories, Settings
├─ context/      ThemeContext, AuthContext (login/roles), DataContext (conteúdo + localStorage)
├─ data/         icons.js (constantes), labs.js (motor dos experimentos)
└─ index.css     tokens de tema (CSS vars) + Tailwind v4
```

## Integração com Shopify (próximo passo)

O app é um SPA React desacoplado. Para embutir como aplicação externa no tema Shopify,
monta-se o bundle gerado por `npm run build` em um container dentro de um arquivo `.liquid`
(padrão "mounting a React app in a Shopify theme"). O login e o pagamento ficam a cargo
do Shopify; a área de membros libera o acesso, e o `DataContext` pode ser apontado para
uma API/servidor no lugar do `localStorage`.
