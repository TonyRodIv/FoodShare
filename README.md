# 🤝 FoodShare

Uma plataforma comunitária para compartilhamento de alimentos e gerenciamento de doações.

## 📋 Descrição

O FoodShare é uma aplicação web desenvolvida em Node.js com Express e EJS que conecta doadores e receptores de alimentos, facilitando a destinação de excedentes alimentares e ajudando comunidades a combater o desperdício.

---

## 🚀 Recursos

- **Autenticação Segura**: Implementada usando JSON Web Tokens (JWT) armazenados em cookies seguros do tipo `httpOnly` para mitigar ataques XSS.
- **Silent Refresh**: Mecanismo de renovação de sessão automático em background por meio de Refresh Tokens salvos no banco.
- **Controle de Acesso por Tipo de Usuário (Roles)**:
  - `doador`: Cadastra itens de doações.
  - `receptor`: Solicita itens disponíveis.
  - `admin`: Gerencia os recursos do sistema.
- **Gerenciamento de Doações**: Criar, editar, visualizar e gerenciar doações de alimentos.
- **Solicitações**: Pedidos de alimentos por receptores com gerenciamento de status.
- **Perfis de Usuário**: Gerenciamento de dados cadastrais dos usuários.
- **Row Level Security (RLS)**: Segurança ativa no nível de tabelas no PostgreSQL (Supabase).
- **Interface Dinâmica e Responsiva**: Design moderno com EJS e navbar adaptável ao estado de login do usuário.

---

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: EJS (Template Engine com parciais header/footer)
- **Validação**: Zod v4 (validação de schemas de inputs)
- **Banco de Dados**: PostgreSQL hospedado no Supabase (com RLS ativo)
- **ORM & Migrations**: Prisma 7 (com `@prisma/adapter-pg` e suporte a Supabase Pooler)
- **Autenticação**: JWT (JSON Web Tokens)
- **Segurança**: Bcrypt para hash de senhas e Cookies `httpOnly` seguros

---

## 📁 Estrutura do Projeto

```text
foodshare/
├── config/          # Configurações de banco de dados (Prisma client & adapter)
├── controllers/     # Controladores (regras e lógica de rotas)
├── middlewares/     # Middlewares de autenticação e autorização
├── models/          # Schemas de dados (antigos, a serem migrados)
├── prisma/          # Definições do banco de dados (schema.prisma e migrations)
├── public/          # Arquivos estáticos (CSS, imagens)
├── routes/          # Arquivos de definição de rotas
├── validators/      # Schemas de validação de input (Zod)
├── views/           # Templates EJS (Login, Registro, Home e Parciais)
├── app.js           # Inicialização e middleware global do Express
├── server.js        # Inicialização do servidor HTTP
└── package.json     # Gerenciador de dependências do projeto
```

---

## ⚙️ Instalação e Execução

### 1. Clonar o Repositório
```bash
git clone https://github.com/TonyRodIv/FoodShare.git
cd FoodShare
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e configure as chaves necessárias:
```env
PORT=3000

# Conexão transacional com o Supabase Pooler (porta 6543) - para runtime do app
DATABASE_URL="postgresql://postgres.[PROJETO]:[SENHA]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Conexão de sessão com o Supabase (porta 5432) - para migrations e CLI do Prisma
DIRECT_URL="postgresql://postgres.[PROJETO]:[SENHA]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

# Segredos criptográficos para geração de tokens
JWT_SECRET="sua_chave_acesso_secreta"
JWT_REFRESH_SECRET="sua_chave_refresh_secreta"
```

### 4. Rodar Migrações do Banco
Para subir as tabelas de `Usuario` e `RefreshToken` no Supabase:
```bash
npx prisma migrate dev
```

### 5. Iniciar o App
Para produção:
```bash
npm start
```
Para desenvolvimento (com hot-reload via nodemon):
```bash
npm run dev
```

---

## 🌐 Endpoints

### Autenticação (`/auth`)
- `GET /auth/register` - Tela de cadastro de usuários
- `POST /auth/register` - Realizar cadastro (validação com Zod, senha com Bcrypt)
- `GET /auth/login` - Tela de login de usuários
- `POST /auth/login` - Realizar autenticação (emite Access & Refresh cookies)
- `POST /auth/refresh` - Rota silenciosa para renovação do Access Token
- `POST /auth/logout` - Logout (limpa cookies e remove Refresh Token ativo do banco)

### Doações (`/doacoes`)
- `GET /doacoes` - Listar todas as doações (Público)
- `GET /doacoes/nova` - Formulário de nova doação (Protegido: `doador` ou `admin`)
- `POST /doacoes/nova` - Criar nova doação (Protegido: `doador` ou `admin`)
- `GET /doacoes/:id/editar` - Editar doação (Protegido: dono do recurso ou `admin`)
- `DELETE /doacoes/:id` - Deletar doação (Protegido: dono do recurso ou `admin`)

### Solicitações (`/solicitacoes`)
- `GET /solicitacoes` - Listar solicitações (Público)
- `GET /solicitacoes/nova` - Formulário de nova solicitação (Protegido: `receptor` ou `admin`)
- `POST /solicitacoes/nova` - Criar nova solicitação (Protegido: `receptor` ou `admin`)
- `GET /solicitacoes/minhas` - Ver minhas solicitações (Protegido: `receptor` ou `admin`)
- `GET /solicitacoes/recebidas` - Ver solicitações recebidas (Protegido: `doador` ou `admin`)

---

## 🔐 Segurança e Sessão

O sistema não armazena tokens no localStorage. O controle é feito via **Cookies httpOnly**:
- `token`: Access Token contendo os dados básicos do usuário (ID, Nome, E-mail, Role), expira em 15 minutos.
- `refreshToken`: Token de longa duração (7 dias) armazenado de forma segura no banco de dados e no navegador.

Caso o Access Token expire, o middleware `authenticate` verifica a existência do Refresh Token e faz a rota de renovação em background sem deslogar o usuário de forma abrupta.

*Nota para uso externo de API*: O sistema também está preparado para ler o token a partir do cabeçalho de autorização padrão caso seja integrado com aplicativos externos:
```http
Authorization: Bearer seu_token_aqui
```

## 📝 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

---

## 📝 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

---

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

Made with ❤️ by FoodShare Team