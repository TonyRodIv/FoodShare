# Arquitetura

Este documento descreve como o código do FoodShare está organizado e como as peças se conectam.

## Fluxo de inicialização

```
server.js          Carrega variáveis de ambiente e inicia o servidor HTTP
    └── app.js     Configura Express, middlewares globais e rotas
            ├── routes/       Endpoints HTTP (com anotações Swagger)
            ├── controllers/  Renderização de páginas e orquestração
            ├── services/     Lógica com efeitos colaterais (ex.: notificações)
            ├── utils/        Funções puras (formatação, dados para modais)
            ├── validators/   Schemas Zod (autenticação; doações ainda inline)
            ├── middlewares/  Autenticação, autorização e dados do app
            ├── prisma/       Schema, migrations e seed
            └── views/        Templates EJS e partials do app shell
```

## Responsabilidade das pastas

| Pasta | Papel |
|-------|-------|
| `config/` | Cliente Prisma (`database.js`) |
| `controllers/` | Páginas principais: autenticação, home, histórico, notificações e configurações |
| `routes/` | Definição de rotas Express. Doações e solicitações concentram parte relevante da lógica de negócio |
| `services/` | Serviços reutilizáveis entre rotas (ex.: `notificacoesService.js`) |
| `utils/` | Helpers sem acesso direto a `req`/`res` (`formatTime`, `detailSerializers`, etc.) |
| `validators/` | Validação com Zod (`authValidator.js`) |
| `middlewares/` | `authenticate`, `authorize` e `attachAppData` |
| `prisma/` | **Fonte de verdade** do modelo de dados |
| `public/` | Assets estáticos: CSS (entrada em `style.css`), JavaScript e imagens |
| `views/` | Templates EJS por feature (`auth/`, `doacoes/`, `solicitacoes/`) e partials compartilhados |

## Dados e papéis de usuário

O banco é PostgreSQL (Supabase), acessado via **Prisma 7**. O schema fica em `prisma/schema.prisma` — não há pasta `models/`.

Papéis (`role`) válidos:

- `doador` — publica e gerencia doações
- `receptor` — solicita itens disponíveis
- `admin` — acesso ampliado às operações

> Em documentos antigos, o termo `beneficiario` foi substituído por **`receptor`**.

## Interface logada

A área autenticada usa um **app shell** compartilhado:

- **Sidebar** (desktop) e **barra inferior** (mobile) — navegação principal por papel
- **Cabeçalho** — busca, notificações e menu do perfil (histórico, preferências, sair)
- **Modais** — criação de doação, solicitação e visualização de detalhes, sem páginas de formulário dedicadas

O histórico de atividades fica acessível pelo menu do perfil, não pela navegação lateral.

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento com recarga automática (nodemon) |
| `npm start` | Execução em produção |
| `npm run seed` | Popula o banco com dados de demonstração |

A rota `/errortest` (páginas de erro para desenvolvimento) só é registrada quando `NODE_ENV` **não** é `production`.
