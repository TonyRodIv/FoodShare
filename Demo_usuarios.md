# Contas demonstrativas — FoodShare

> **Atenção:** estas contas são apenas para demonstração e testes locais.  
> Todas usam o domínio `@foodshare.local` e compartilham a mesma senha.

## Senha padrão

```
demo123
```

Para recriar os dados no banco:

```bash
npm run seed
```

---

## Doador (todas as doações)

| Nome | E-mail | Telefone | Papel |
|------|--------|----------|-------|
| Mercado Solidário Demo | `doador.demo@foodshare.local` | (11) 3000-1000 | doador |

### Doações cadastradas (10)

| Status | Itens principais | Solicitações |
|--------|------------------|--------------|
| disponível | Arroz, feijão, aveia | 2 pendentes |
| disponível | Banana, tomate, alface | 1 pendente, 1 recusada |
| disponível | Sardinha, extrato, biscoito | 1 pendente, 1 cancelada |
| disponível | Açúcar, óleo, sal | 1 pendente |
| reservado | Leite, iogurte, queijo | 1 aprovada |
| reservado | Frango, ovos | 1 aprovada, 1 recusada |
| reservado | Macarrão, molho de tomate | 1 aprovada |
| entregue | Pão francês, bolo de cenoura | 1 aprovada |
| entregue | Arroz, feijão, farinha | 1 aprovada |
| entregue | Sopa, caldo de galinha | 2 aprovadas |

---

## Receptores

| Nome | E-mail | Telefone |
|------|--------|----------|
| Família Santos | `familia.santos@foodshare.local` | (11) 91234-5678 |
| ONG Alimenta | `ong.alimenta@foodshare.local` | (11) 99876-5432 |
| Comunidade Vila Nova | `vila.nova@foodshare.local` | (11) 97654-3210 |
| Centro Comunitário Esperança | `centro.esperanca@foodshare.local` | (11) 93456-7890 |
| Lar das Crianças | `lar.criancas@foodshare.local` | (11) 94567-8901 |
| Grupo Mãos que Ajudam | `maos.ajudam@foodshare.local` | (11) 95678-9012 |
| Associação Bairro Novo | `bairro.novo@foodshare.local` | (11) 96789-0123 |
| Projeto Refeição Solidária | `refeicao.solidaria@foodshare.local` | (11) 97890-1234 |

### Solicitações por receptor

| Receptor | Status das solicitações |
|----------|-------------------------|
| Família Santos | pendente, aprovada (entregue), recusada |
| ONG Alimenta | aprovada (reservado) |
| Comunidade Vila Nova | pendente, aprovada (entregue) |
| Centro Comunitário Esperança | recusada, aprovada (reservado) |
| Lar das Crianças | cancelada, aprovada (reservado) |
| Grupo Mãos que Ajudam | pendente |
| Associação Bairro Novo | pendente, aprovada (entregue) |
| Projeto Refeição Solidária | pendente, aprovada (entregue) |

---

## Login rápido

1. Acesse `/auth/login`
2. Use qualquer e-mail da tabela acima
3. Senha: `demo123`

**Sugestão para demonstração:**
- Entre como **doador** (`doador.demo@foodshare.local`) para ver todas as doações e solicitações recebidas
- Entre como **receptor** (`familia.santos@foodshare.local` ou `ong.alimenta@foodshare.local`) para ver pedidos e itens disponíveis