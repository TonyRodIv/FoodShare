# 🔐 Guia de Implementação de Autenticação JWT - FoodShare

Este documento serve como um roteiro interativo para o agente de desenvolvimento guiar o usuário na implementação da estrutura de autenticação com JSON Web Token (JWT) no projeto **FoodShare**.

---

## 🤖 Instruções para o Agente de Desenvolvimento

### 1. Diretrizes Interativas e de Processo
*   **Seja Interativo**: Não implemente tudo de uma vez. Execute uma fase por vez e confirme com o usuário.
*   **Paradas para Commit (Crucial)**: A cada alteração significativa (ex: fim de uma fase ou implementação de um arquivo importante), **PARE** a execução e sugira uma mensagem de commit para o usuário no padrão de Commits Convencionais, no formato:
   `feat: mensagem-do-commit` ou `fix: mensagem-do-commit` (ex: `feat: implement user registration controller`). Aguarde a confirmação/commit do usuário antes de prosseguir.
*   **Use Padrões Robustos**: Siga a arquitetura MVC já iniciada no projeto (views em EJS, controllers em `controllers/`, rotas em `routes/`, modelos em `models/`).
*   **Otimização de Modelos & Transição de Contexto**: Siga as recomendações de modelos descritas na seção abaixo. Se a próxima tarefa exigir um modelo mais avançado (ex: Claude Opus), instrua o usuário a trocar o motor no IDE antes de continuar.

### 2. Diretrizes de Otimização de Consumo de Tokens (Economia de Contexto)
*   **Leitura Cirúrgica com Contexto (Targeted Reads)**: Para economizar tokens, prefira ler faixas de linhas específicas em arquivos muito grandes. **No entanto**, garanta que a primeira leitura de qualquer arquivo a ser editado seja ampla para entender sua estrutura inteira. As leituras direcionadas devem sempre capturar uma margem segura de linhas antes e depois do trecho a ser editado para evitar a perda de imports, variáveis globais ou conflitos lógicos com outras partes do código.
*   **Escrita Localizada (Surgical Edits)**: Nunca sobrescreva arquivos inteiros com `write_to_file` se puder realizar modificações focadas. Prefira usar `replace_file_content` (ou `multi_replace_file_content`) para trocar apenas os chunks que mudaram. Isso economiza tanto tokens de entrada quanto de geração (saída).
*   **Validação Determinística Local**: Antes de enviar erros complexos para reflexão da IA, execute comandos locais (como testadores e linters) para validar sintaxe. Deixe para a IA apenas a análise lógica e arquitetural.
*   **Respostas Concisas**: Responda de forma direta e estruturada, evitando explicações redundantes e polidez desnecessária. Fique focado em códigos funcionais e respostas diretas.

---

## 🧠 Estratégia de Alocação de Modelos (Economia de Tokens e Custos)

Para otimizar o consumo de tokens e obter os melhores resultados, cada fase de implementação foi rotulada com o tipo de motor (modelo LLM) recomendado. 

### Classificação dos Motores:
*   **🏷️ Motor Leve (Ex: Gemini 3.5 Flash, Claude 3.5 Haiku)**: Recomendado para tarefas repetitivas, configurações básicas de infraestrutura, instalações de dependências, templates HTML/CSS (EJS) e fluxos lineares simples. Muito econômico e rápido.
*   **🏷️ Motor Médio (Ex: Gemini 1.5 Pro, Claude 3.5 Sonnet)**: Recomendado para criação de schemas de banco, validações com Zod e implementação de controllers/rotas padrão. Excelente equilíbrio entre inteligência e consumo de tokens.
*   **🏷️ Motor Avançado (Ex: Claude 3 Opus, Gemini 3.5 Pro High, o1-pro)**: Reservado exclusivamente para lógicas críticas de segurança, algoritmos complexos, middlewares de segurança d## 📌 Definições Arquiteturais Pré-definidas e Escolhas do Usuário

O usuário já fez as seguintes escolhas arquiteturais que devem ser seguidas estritamente durante a implementação:

* **Banco de Dados & ORM**: **Prisma ORM com PostgreSQL (Supabase)**.
  * O banco de dados será hospedado na nuvem do Supabase utilizando PostgreSQL.
  * As dependências necessárias são `@prisma/client` (produção) e `prisma` (desenvolvimento).
* **Armazenamento de Tokens**: **Cookies Seguros (`httpOnly`)** (Opção A). 
  * O token JWT deve ser guardado em cookies `httpOnly` para que o navegador o envie automaticamente nas requisições SSR (EJS) sem manipulação de frontend complexa. Instale e configure o `cookie-parser`.
* **Fluxo de Tokens**: **Access Token + Refresh Token** (Opção B).
  * O Access Token deve ser curto (ex: 15 minutos).
  * O Refresh Token deve ser longo (ex: 7 dias) e armazenado no banco de dados para possibilitar revogação e renovação silenciosa de sessão na rota `/auth/refresh`.
* **Roles (Papéis) e Controle de Acesso**: **Doador, Beneficiário e Administrador**.
  * O sistema terá controle de permissões baseado nessas 3 roles.
  * O cadastro deve aceitar a role do usuário (padrão `"doador"` ou `"beneficiario"`).
  * Apenas `doador` e `admin` podem criar doações. Apenas `beneficiario` e `admin` podem criar solicitações.
* **Dados Adicionais**: O cadastro deve coletar e persistir o número de **Telefone/WhatsApp** do usuário, facilitando o contato para entrega dos alimentos.
* **Validação de Entrada de Dados**: Uso da biblioteca **Zod** para validação robusta de inputs no backend.

---

## 🚀 Fases da Implementação

Siga este roteiro passo a passo para a implementação:

### Fase 1: Configuração do Prisma ORM, PostgreSQL e Zod `[🏷️ Motor Leve / Médio]`
*   *Instrução de Transição*: Esta fase é puramente infraestrutural. Pode ser feita usando **Gemini 3.5 Flash** para economizar tokens.
1. Instalar as dependências do Prisma, Zod e Cookie Parser:
   ```bash
   npm install @prisma/client zod cookie-parser
   npm install -D prisma
   ```
2. Inicializar o Prisma configurado com o PostgreSQL:
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
3. Editar o arquivo `prisma/schema.prisma` para definir os modelos de banco de dados. Atenção: Para compatibilidade com o **Prisma 7**, o campo `url` no bloco `datasource` **não** é mais suportado dentro do `schema.prisma`. A URL deve ir exclusivamente no `.env` e ser mapeada no `prisma.config.ts`.
   ```prisma
   datasource db {
     provider = "postgresql"
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id            String         @id @default(uuid())
     nome          String
     email         String         @unique
     senha         String
     telefone      String         // Campo de contato (WhatsApp)
     role          String         @default("doador") // Opções: doador, beneficiario, admin
     createdAt     DateTime       @default(now())
     updatedAt     DateTime       @updatedAt
     refreshTokens RefreshToken[]
   }

   model RefreshToken {
     id        String   @id @default(uuid())
     token     String   @unique
     userId    String
     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     expiresAt DateTime
     createdAt DateTime @default(now())
   }
   ```
4. Configurar a string de conexão no `.env` com a URL do PostgreSQL fornecida pelo Supabase:
   ```env
   DATABASE_URL="postgresql://postgres:[SUA_SENHA_AQUI]@db.[REF_DO_PROJETO].supabase.co:5432/postgres?connection_limit=5"
   ```
5. Executar a primeira migration para sincronizar o banco e gerar o Prisma Client:
   ```bash
   npx prisma migrate dev --name init_auth
   ```
6. Configurar e exportar o cliente do Prisma no arquivo [config/database.js](file:///c:/Projetos/FoodShare/config/database.js):
   ```javascript
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   module.exports = prisma;
   ```
7. Ativar o middleware `cookie-parser` no [app.js](file:///c:/Projetos/FoodShare/app.js).

---

### Fase 2: Registro de Usuários (`Register`) e Validação com Zod `[🏷️ Motor Médio]`
*   *Instrução de Transição*: Exige criar schemas Zod e lógica de hash com bcrypt. Recomendado usar **Gemini 1.5 Pro** ou **Claude 3.5 Sonnet**.
1. Criar o arquivo `validators/authValidator.js` para schemas de validação com **Zod**:
   * Definir o schema de registro:
     - `nome`: String, mínimo de 3 caracteres.
     - `email`: Formato de e-mail válido.
     - `senha`: String, mínimo de 6 caracteres.
     - `telefone`: String com formato básico de telefone/WhatsApp.
     - `role`: String, aceitando apenas `'doador'`, `'beneficiario'` ou `'admin'`.
2. No [controllers/authController.js](file:///c:/Projetos/FoodShare/controllers/authController.js), criar a função `register`:
   * Validar o `req.body` com o schema do Zod (`safeParse`). Se houver erros, retorná-los com status `400`.
   * Verificar se o e-mail já está cadastrado no banco através do Prisma.
   * Utilizar a biblioteca `bcrypt` para aplicar hash na senha (`bcrypt.hash`) antes de salvar no banco.
   * Salvar o usuário com todos os dados (nome, email, senha criptografada, telefone, role).
3. Definir a rota correspondente em [routes/auth.js](file:///c:/Projetos/FoodShare/routes/auth.js):
   * `POST /auth/register`
4. Atualizar a view em [views/auth/register.ejs](file:///views/auth/register.ejs) para conter os novos campos (telefone, seleção de role - doador/beneficiário). *(Este item específico de UI EJS pode ser feito com Motor Leve)*.

---

### Fase 3: Login, Geração de Tokens JWT e Rota de Refresh `[🏷️ Motor Avançado - Ex: Claude Opus / Gemini Pro High]`
*   *Instrução de Transição (IMPORTANTE)*: Esta fase lida com a expiração de tokens e persistência/rotação segura de Refresh Tokens no SQLite. **Solicite ao usuário para mudar para o Claude Opus (ou Gemini 3.5 Pro High)** para garantir o máximo de robustez e segurança algorítmica.
1. Criar o schema do Zod para validação de login em `validators/authValidator.js` (validando formato do email e presença da senha).
2. No [controllers/authController.js](file:///c:/Projetos/FoodShare/controllers/authController.js), criar a função `login`:
   * Validar inputs com o Zod.
   * Buscar o usuário pelo e-mail usando o Prisma.
   * Verificar a senha usando `bcrypt.compare`.
   * Se válidos, gerar o token JWT (Access Token) usando `jsonwebtoken` (expiração sugerida de 15 minutos).
   * Gerar o Refresh Token (expiração sugerida de 7 dias), salvá-lo no banco de dados associado ao usuário.
   * Enviar ambos os tokens em cookies httpOnly separados (ex: cookie `token` e cookie `refreshToken`).
3. Criar a rota de Refresh:
   * Ler o cookie `refreshToken`.
   * Validar a existência do token no banco de dados e se não expirou.
   * Se válido, gerar um novo Access Token curto e retornar no cookie de acesso.
4. Definir as rotas correspondentes em [routes/auth.js](file:///c:/Projetos/FoodShare/routes/auth.js):
   * `POST /auth/login`
   * `POST /auth/refresh`
5. Atualizar a view em [views/auth/login.ejs](file:///views/auth/login.ejs) com o formulário de login. *(Este item de UI EJS pode ser delegado para Motor Leve)*.

---

### Fase 4: Middlewares de Autenticação (`authenticate`) e Autorização por Roles (`authorize`) `[🏷️ Motor Avançado - Ex: Claude Opus / Gemini Pro High]`
*   *Instrução de Transição*: Esta é a espinha dorsal de segurança do projeto. O middleware de autenticação deve capturar tokens, validar expiração, e se necessário, ler o refresh token para renovar silenciosamente a sessão antes de permitir a requisição. **Use o Claude Opus (ou Gemini 3.5 Pro High)**.
1. Criar o arquivo `middlewares/authMiddleware.js`:
   * **Middleware `authenticate`**:
     * Ler o Access Token do cookie `token`.
     * Validar o token usando `jwt.verify` com `process.env.JWT_SECRET`.
     * Se expirado ou inválido, tentar verificar o `refreshToken`. Se o refresh token for válido, renovar silenciosamente o Access Token ou redirecionar o usuário para `/auth/login`.
     * Anexar as informações do usuário logado (incluindo `id`, `nome`, `email`, `role`, `telefone`) a `req.user`.
   * **Middleware `authorize(allowedRoles)`**:
     * Função que recebe um array de roles permitidas (ex: `['admin', 'doador']`).
     * Verificar se `req.user.role` está incluído no array. Se não estiver, retornar `403 Forbidden` (ou redirecionar para uma página de erro/acesso negado).

---

### Fase 5: Proteção de Rotas e Telas Privadas `[🏷️ Motor Médio]`
*   *Instrução de Transição*: Integração e amarração de rotas do Express. Pode ser feito com **Gemini 1.5 Pro** ou **Claude 3.5 Sonnet**.
1. Proteger rotas em [routes/doacoes.js](file:///c:/Projetos/FoodShare/routes/doacoes.js) e [routes/solicitacoes.js](file:///c:/Projetos/FoodShare/routes/solicitacoes.js):
   * Exemplo: Rotas de criação de doações exigem `authenticate` e `authorize(['doador', 'admin'])`.
   * Exemplo: Rotas de criação de solicitações exigem `authenticate` e `authorize(['beneficiario', 'admin'])`.
2. Tornar o `req.user` acessível em todas as páginas renderizadas pelo EJS (pode ser feito através de um middleware global `res.locals.user = req.user`). Isso ajudará a customizar a navbar com o nome do usuário e botões corretos de acordo com a Role.

---

### Fase 6: Fluxo de Logout `[🏷️ Motor Leve]`
*   *Instrução de Transição*: Limpeza simples de cookies. Pode ser feito usando **Gemini 3.5 Flash**.
1. No [controllers/authController.js](file:///c:/Projetos/FoodShare/controllers/authController.js), criar a função `logout`:
   * Limpar os cookies `token` e `refreshToken`.
   * (Opcional) Deletar o Refresh Token correspondente no banco de dados para segurança extra.
   * Redirecionar para a página inicial `/` ou `/auth/login`.
2. Definir a rota correspondente em [routes/auth.js](file:///c:/Projetos/FoodShare/routes/auth.js):
   * `POST /auth/logout` ou `GET /auth/logout`

---

## 🔒 Diretrizes de Segurança
* **JWT Secret**: Sempre utilizar `process.env.JWT_SECRET` e nunca deixar chaves de segurança hardcoded no código.
* **Configuração dos Cookies**:
  * `httpOnly: true` (impede acesso a tokens via scripts frontend).
  * `secure: process.env.NODE_ENV === 'production'` (só envia em HTTPS em produção).
  * `sameSite: 'strict'` ou `'lax'` para mitigar ataques CSRF.
* **Hash de Senhas**: Utilizar `bcrypt` com fator de custo `10` ou `12` para hashing seguro.
