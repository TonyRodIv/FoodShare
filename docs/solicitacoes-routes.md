# Rotas de solicitações

Referência das rotas definidas em `routes/solicitacoes.js`. Todas exigem usuário autenticado, salvo indicação em contrário.

## Criar solicitação

### `GET /solicitacoes/nova`

Redireciona para o fluxo principal no painel do receptor (`/doacoes`).

| Quem acessa | `receptor`, `admin` |
| Com `?doacaoId=` | Redireciona para `/doacoes?solicitar={id}` e abre o modal de solicitação |
| Sem parâmetros | Redireciona para `/doacoes` |

### `POST /solicitacoes/nova`

Persiste uma nova solicitação. Usado pelo formulário legado ou por clientes API.

| Quem acessa | `receptor`, `admin` |
| Sucesso (HTML) | Redireciona para `/doacoes?solicitacao=ok` |
| Erro de validação | Renderiza `views/solicitacoes/nova.ejs` com mensagens |

---

## Listagens

### `GET /solicitacoes/minhas`

Exibe as solicitações feitas pelo usuário logado.

| Quem acessa | Qualquer usuário autenticado |
| View | `views/solicitacoes/minhas_solicita.ejs` |

### `GET /solicitacoes/recebidas`

Exibe solicitações recebidas nas doações do doador logado.

| Quem acessa | `doador`, `admin` |
| View | `views/solicitacoes/recebidas.ejs` |

---

## Alteração de status

Todas redirecionam após a ação (fluxo HTML).

| Rota | Efeito | Quem pode | Destino |
|------|--------|-----------|---------|
| `POST /solicitacoes/:id/aceitar` | Status → `aprovado` | `doador`, `admin` | `/solicitacoes/recebidas` |
| `POST /solicitacoes/:id/recusar` | Status → `recusado` | `doador`, `admin` | `/solicitacoes/recebidas` |
| `POST /solicitacoes/:id/cancelar` | Status → `cancelado` | Próprio receptor | `/solicitacoes/minhas` |
