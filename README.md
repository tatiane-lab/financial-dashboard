# Finanças - Dashboard Financeiro

> Angular 22 · Signals · Standalone · OnPush · Autenticação JWT · Gráficos SVG próprios · Tema claro/escuro

Dashboard financeiro de uma empresa fictícia (SaaS + serviços): KPIs com variação contra o período anterior, gráficos de linha, barras e rosca, e uma tabela de transações com busca, filtros, ordenação, paginação e exportação em CSV. Todo o back-end é simulado em memória, então o projeto roda 100% estático (ideal para GitHub Pages).

## Conta de demonstração

| Campo | Valor |
|---|---|
| E-mail | `demo@financeiro.com` |
| Senha | `Demo@2026` |

A tela de login exibe essas credenciais e tem o botão **Entrar com conta demo**.

## Funcionalidades

- **Visão geral**: receita, despesas, resultado líquido e margem de lucro, cada um com a variação em relação ao período imediatamente anterior (despesa subindo é sinalizada em vermelho). Seletor de período: 30 dias, 90 dias, 6 meses e 12 meses.
- **Gráficos** (SVG, sem biblioteca): saldo acumulado (linha com área), receitas x despesas (barras agrupadas) e despesas por categoria (rosca com legenda). Tooltips ao passar o mouse, responsivos via `ResizeObserver`.
- **Transações**: busca com debounce, filtros por categoria, tipo e período, ordenação por coluna, paginação com seletor de linhas, cartões-resumo do filtro aplicado e **exportação CSV** (separador `;`, decimal com vírgula e BOM, abre direto no Excel pt-BR).
- **Estados de interface**: carregando (skeletons), erro com "Tentar novamente", vazio (sem dados no período / sem resultados no filtro).
- **Autenticação**: JWT guardado em `localStorage`, restaurado ao abrir, validado por expiração; guards funcionais (`authGuard` e `guestGuard`) e interceptor que anexa o `Bearer` e trata 401.
- **Tema claro/escuro** com persistência e respeito a `prefers-color-scheme`.
- **pt-BR** em toda a interface: moeda (R$), datas (dd/mm/aaaa) e números via `Intl`.
- **Responsivo**: sidebar vira barra superior no mobile; tabela com rolagem horizontal.
- **Acessibilidade**: `aria-sort`, `aria-pressed`, `aria-current`, rótulos nos gráficos, foco visível e `prefers-reduced-motion`.

## Stack

| Item | Versão |
|---|---|
| Angular (`core`, `router`, `forms`) | ^22.3 |
| TypeScript | ~6.0 |
| RxJS | ~7.8 |
| Testes | Vitest + jsdom (via `ng test`) |

## Como rodar

```bash
npm install        # o .npmrc ativa legacy-peer-deps (peer deps do toolchain Angular 22)
npm start          # http://localhost:4200  (ou: npx ng serve --port 4217)
npm run build      # build de produção em dist/
npm test           # testes unitários
```

## Arquitetura

```
src/app/
├── core/
│   ├── auth/           # AuthService (signals), authGuard e guestGuard funcionais
│   ├── data/           # FinanceStore (signals), analytics puro, gerador de dados mock
│   ├── interceptors/   # jwtInterceptor e mockApiInterceptor (back-end simulado)
│   ├── theme/          # ThemeService (claro/escuro)
│   └── utils/          # formatadores pt-BR, CSV, datas
├── features/
│   ├── login/          # formulário tipado + conta demo
│   ├── dashboard/      # KPIs, gráficos e últimas movimentações
│   └── transactions/   # filtros, tabela, resumo e exportação
├── shared/
│   ├── charts/         # line / bar / donut em SVG
│   └── components/     # data-table genérica e controlada
└── app.*               # shell (sidebar + outlet)
```

### Decisões

- **Fonte única de dados**: `FinanceStore` carrega as transações uma vez (`GET /api/transactions`) e dashboard e tabela derivam tudo com `computed()`. Trocar o período ou um filtro não dispara nova requisição.
- **Regras de negócio puras**: `analytics.ts` (períodos, janela anterior, buckets, resumo, participação por categoria) são funções sem Angular, cobertas por testes unitários.
- **Back-end simulado como interceptor**: os serviços usam `HttpClient` como numa API real; para plugar um back-end verdadeiro basta remover o `mockApiInterceptor` de `app.config.ts`. Os dados são gerados por um PRNG determinístico (25 meses, crescimento e sazonalidade), então os números são os mesmos a cada execução.
- **Gráficos próprios em SVG** em vez de uma biblioteca: bundle inicial de ~80 kB gzip, tema via CSS variables e controle total de tooltip e acessibilidade.
- **Tabela "controlada"**: `DataTableComponent` recebe página, ordenação e linhas e apenas emite eventos; células customizadas por `<ng-template>`. Serve tanto para paginação no cliente quanto no servidor.
- **Angular moderno**: componentes standalone, `OnPush`, `input()`/`output()`, `computed()`, `toSignal`, `takeUntilDestroyed`, control flow (`@if`, `@for`, `@switch`), formulários reativos tipados e rotas com `loadComponent`.
- **Dinheiro e datas**: valores guardados como número positivo + `type` (`credit`/`debit`); datas como `yyyy-MM-dd` para evitar problemas de fuso.

## Pendências conhecidas

- Back-end real (hoje é simulado em memória).
- Testes de componente/E2E além dos unitários de regras de negócio.
