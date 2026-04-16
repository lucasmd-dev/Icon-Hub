# IconHub

Aplicacao web para pesquisar, visualizar e exportar icones de colecoes open source usando a API do Iconify. A proposta e concentrar em uma unica interface o fluxo de busca, personalizacao e download em SVG ou PNG.

## Visao geral

O projeto foi estruturado como uma aplicacao front-end leve, com foco em desempenho e clareza de uso. A navegacao por colecoes, a busca por termos em portugues e a visualizacao detalhada do icone foram pensadas para reduzir atrito em tarefas comuns de interface.

## Principais funcionalidades

- busca por termos em portugues, com traducao automatica quando isso melhora o resultado
- navegacao por colecoes com contagem total de icones
- grade virtualizada para lidar com grandes volumes sem travar a interface
- visualizacao detalhada do icone com ajuste de cor e tamanho
- exportacao direta em SVG e PNG
- restauracao de scroll ao trocar entre buscas e colecoes

## Stack

- React 18
- TypeScript
- Vite 8
- Tailwind CSS 3
- Lucide React
- Iconify API
- react-window
- react-virtualized-auto-sizer

## Organizacao do codigo

- `components/`: interface e interacoes principais
- `hooks/`: busca, paginação e persistencia de scroll
- `services/`: integracoes com APIs externas
- `utils/` e `constants.ts`: utilitarios e constantes compartilhadas

## Decisoes tecnicas

- A busca aceita portugues para reduzir friccao de uso, mas traduz a consulta quando necessario para ampliar os resultados retornados pela API.
- O modo de exploracao em "todas as colecoes" distribui a coleta em lotes, evitando concentrar resultados apenas nas primeiras bibliotecas.
- A grade usa virtualizacao para manter a navegacao fluida mesmo com centenas de itens renderizaveis.
- O modal de detalhes concentra preview, customizacao e download para diminuir cliques e deixar o fluxo mais objetivo.

## Como rodar localmente

### Requisitos

- Node 20.19 ou superior
- npm 10 ou superior

O repositório inclui um arquivo `.nvmrc` com a versao usada na validacao do projeto.

### Instalacao

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

Aplicacao disponivel em `http://localhost:5173`.

### Validacoes disponiveis

```bash
npm run typecheck
npm run build
```

## Publicacao

- Demo: [iconhub-app.vercel.app](https://iconhub-app.vercel.app/)

## Evolucoes previstas

- adicionar testes automatizados para hooks e fluxos criticos
- evoluir filtros por licenca, estilo ou preenchimento
- implementar cache local para reduzir chamadas repetidas a API
