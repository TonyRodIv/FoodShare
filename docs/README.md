# Documentação do FoodShare

Este diretório reúne a documentação técnica do projeto. Para instalação, visão geral e endpoints resumidos, consulte o [README na raiz](../README.md).

## Índice

| Documento | O que você encontra |
|-----------|---------------------|
| [architecture.md](./architecture.md) | Organização do código, fluxo da aplicação e convenções |
| [solicitacoes-routes.md](./solicitacoes-routes.md) | Rotas de solicitações para doadores e receptores |
| [demo-users.md](./demo-users.md) | Contas e cenários do seed para testes locais |
| [archive/auth-implementation-guide.md](./archive/auth-implementation-guide.md) | Registro histórico da implementação JWT (já concluída) |

## Design system

Identidade visual, tokens CSS e mapa Figma ↔ código: [`.rules/design.mdc`](../.rules/design.mdc).

## API interativa

Com o servidor em execução:

- **Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Especificação OpenAPI:** `GET /api-docs/swagger.json`
