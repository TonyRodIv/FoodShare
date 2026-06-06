# Autenticação JWT — registro histórico

> **Documento arquivado.** A autenticação descrita aqui já está implementada no projeto.  
> Para referência atual, consulte [architecture.md](../architecture.md) e o código em `controllers/authController.js` e `middlewares/authMiddleware.js`.

---

## Decisões de arquitetura (em vigor)

| Aspecto | Escolha |
|---------|---------|
| Banco de dados | PostgreSQL (Supabase) via Prisma 7 |
| Schema | `prisma/schema.prisma` (não há pasta `models/`) |
| Tokens | Cookies `httpOnly` (`token`, `refreshToken`) |
| Duração | Access token ~15 min; refresh token ~7 dias |
| Renovação | `POST /auth/refresh` |
| Papéis | `doador`, `receptor`, `admin` |
| Validação de entrada | Zod em `validators/authValidator.js` |
| Senhas | Hash com bcrypt |

> Em versões anteriores deste guia, o papel `beneficiario` correspondia ao **`receptor`** atual.

---

## Fases de implementação

As etapas abaixo foram concluídas:

1. Configuração do Prisma, PostgreSQL e Zod
2. Registro de usuários
3. Login, geração de tokens e rota de refresh
4. Middlewares `authenticate` e `authorize`
5. Proteção de rotas e variáveis nas views
6. Logout e revogação de sessão

Detalhes de implementação: código-fonte e Swagger em `/api-docs`.

---

## Boas práticas de segurança

- Segredos em variáveis de ambiente (`JWT_SECRET`, `JWT_REFRESH_SECRET`) — nunca no código
- Cookies com `httpOnly: true`, `secure` em produção e `sameSite: 'lax'`
- Senhas com bcrypt (cost 10–12)
