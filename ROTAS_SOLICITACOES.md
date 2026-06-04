# Rotas de Solicitação — Pessoa 3

Arquivo principal: `routes/solicitacoes.js`

## GET /solicitacoes/nova
Exibe o formulário para o receptor criar uma nova solicitação de doação.
- Acesso: receptores e admins (autenticado)
- View: `views/solicitacoes/nova.ejs`

## POST /solicitacoes/nova
Salva a nova solicitação no banco de dados (PostgreSQL via Prisma).
- Acesso: receptores e admins (autenticado)
- Redireciona para: `/solicitacoes/minhas`

## GET /solicitacoes/minhas
Lista todas as solicitações feitas pelo usuário logado.
- Acesso: qualquer usuário autenticado
- View: `views/solicitacoes/minhas.ejs`

## GET /solicitacoes/recebidas
Lista todas as solicitações recebidas nas doações do usuário logado (doador).
- Acesso: doadores e admins (autenticado)
- View: `views/solicitacoes/recebidas.ejs`

## POST /solicitacoes/:id/aceitar
Atualiza o status da solicitação para `aprovado`.
- Acesso: doadores e admins (autenticado)
- Redireciona para: `/solicitacoes/recebidas`

## POST /solicitacoes/:id/recusar
Atualiza o status da solicitação para `recusado`.
- Acesso: doadores e admins (autenticado)
- Redireciona para: `/solicitacoes/recebidas`

## POST /solicitacoes/:id/cancelar
Permite que o receptor cancele sua própria solicitação (status: `cancelado`).
- Acesso: qualquer usuário autenticado
- Redireciona para: `/solicitacoes/minhas`