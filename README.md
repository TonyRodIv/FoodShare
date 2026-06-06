# FoodShare

> Doe o que sobra. Alimente quem precisa.

O **FoodShare** conecta quem tem excedente de alimentos a famílias e instituições que precisam. Doadores publicam itens disponíveis; receptores solicitam o que precisam; o doador aceita ou recusa cada pedido — reduzindo desperdício e fortalecendo redes locais de solidariedade.

Projeto acadêmico do curso de Engenharia de Software da UMJ (Centro Universitário Mário Pontes Jucá). Stack: Node.js, Express, EJS e PostgreSQL.

---

## Como funciona

1. **Doadores** cadastram alimentos com quantidade, categoria e validade.
2. **Receptores** exploram o catálogo e enviam solicitações.
3. O doador **aceita ou recusa** cada pedido na plataforma.
4. A doação evolui de `disponível` → `reservado` → `entregue`.

---

## Principais recursos

- Autenticação JWT em cookies `httpOnly`
- Renovação silenciosa de sessão (refresh token persistido no banco)
- Controle de acesso por papel: `doador`, `receptor`, `admin`
- Interface responsiva com sidebar, barra inferior e modais
- Documentação de API em `/api-docs` (Swagger)

---

## Tecnologias

| Camada | Stack |
|--------|-------|
| Backend | Node.js, Express |
| Views | EJS (app shell com partials) |
| Validação | Zod |
| Banco | PostgreSQL (Supabase) + Prisma 7 |
| Autenticação | JWT + bcrypt |

---

## Estrutura do repositório

```text
foodshare/
├── config/          Cliente Prisma
├── controllers/     Lógica de páginas (auth, home, histórico…)
├── docs/            Documentação detalhada
├── middlewares/     Autenticação e dados globais das views
├── prisma/          Schema, migrations e seed
├── public/          CSS, JavaScript e imagens
├── routes/          Rotas HTTP (+ anotações Swagger)
├── services/        Serviços compartilhados
├── utils/           Funções auxiliares
├── validators/      Schemas Zod
├── views/           Templates EJS
├── app.js           Aplicação Express
└── server.js        Entrada do servidor
```

Mais detalhes: **[docs/README.md](./docs/README.md)**  
Design system: **[.rules/design.mdc](./.rules/design.mdc)**

---

## Instalação

### 1. Clonar e instalar

```bash
git clone https://github.com/TonyRodIv/FoodShare.git
cd FoodShare
npm install
```

### 2. Configurar ambiente

Copie `.env.example` para `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://..."      # pooler (6543) — uso em runtime
DIRECT_URL="postgresql://..."        # sessão (5432) — migrations do Prisma
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
```

### 3. Banco de dados

```bash
npx prisma migrate dev
npm run seed          # opcional — dados de demo (ver docs/demo-users.md)
```

### 4. Executar

```bash
npm run dev    # desenvolvimento
npm start      # produção
```

---

## Endpoints

Todas as rotas abaixo de doações e solicitações exigem autenticação.

### Autenticação — `/auth`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/login`, `/auth/register` | Telas de login e cadastro |
| POST | `/auth/login`, `/auth/register` | Autenticar ou registrar |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Encerrar sessão |

### Páginas — raiz da aplicação

| Rota | Descrição |
|------|-----------|
| `/` | Home (conteúdo varia por papel) |
| `/historico` | Histórico de atividades (menu do perfil) |
| `/notificacoes` | Central de notificações |
| `/configuracoes` | Preferências da conta |

### Doações — `/doacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/doacoes` | Painel do doador ou catálogo do receptor |
| GET | `/doacoes/nova` | Redireciona para `/doacoes?nova=1` (modal) |
| POST | `/doacoes/nova` | Criar doação (`doador`, `admin`) |
| GET, POST | `/doacoes/:id/editar` | Editar doação existente |

### Solicitações — `/solicitacoes`

Referência completa: [docs/solicitacoes-routes.md](./docs/solicitacoes-routes.md).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/solicitacoes/nova` | Redireciona para `/doacoes` (modal de solicitação) |
| POST | `/solicitacoes/nova` | Criar solicitação |
| GET | `/solicitacoes/minhas` | Solicitações do receptor logado |
| GET | `/solicitacoes/recebidas` | Pedidos recebidos pelo doador |
| POST | `/solicitacoes/:id/aceitar` | Aprovar solicitação |
| POST | `/solicitacoes/:id/recusar` | Recusar solicitação |
| POST | `/solicitacoes/:id/cancelar` | Cancelar solicitação (receptor) |

### Notificações — `/notificacoes`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/notificacoes/:id/lida` | Marcar notificação como lida |
| POST | `/notificacoes/marcar-todas` | Marcar todas como lidas |

Clientes API podem receber JSON com o header `Accept: application/json` ou o parâmetro `?format=json`, quando a rota suportar.

---

## Segurança e sessão

Os tokens ficam em cookies `httpOnly` (`token` e `refreshToken`). Quando o access token expira, o middleware `authenticate` tenta renovar a sessão via refresh token.

Integrações externas também podem enviar `Authorization: Bearer <token>`.

---

## Contribuindo

Issues, sugestões e pull requests são bem-vindos no repositório GitHub.

---

## Licença

MIT — conforme `package.json`.
