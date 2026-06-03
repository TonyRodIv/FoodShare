# 🍕 FoodShare

Uma plataforma comunitária para compartilhamento de alimentos e gerenciamento de doações.

## 📋 Descrição

O FoodShare é uma aplicação web que conecta doadores e receptores de alimentos, facilitando a doação de alimentos excedentes e ajudando comunidades a reduzir o desperdício alimentar.

## 🚀 Recursos

- **Autenticação**: Sistema seguro com JWT
- **Gerenciamento de Doações**: Criar, editar e visualizar doações
- **Solicitações**: Sistema de pedidos de alimentos
- **Perfis de Usuário**: Gerenciamento de dados do usuário
- **Interface Responsiva**: Design moderno com EJS

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Frontend**: EJS (Template Engine)
- **Autenticação**: JWT (JSON Web Tokens)
- **Segurança**: Bcrypt para hash de senhas
- **Banco de Dados**: (Configurável)

## 📁 Estrutura do Projeto

```
foodshare/
├── config/          # Configurações
├── controllers/     # Lógica de negócio
├── middlewares/     # Middlewares customizados
├── models/          # Schemas de dados
├── routes/          # Definição de rotas
├── views/           # Templates EJS
├── public/          # Arquivos estáticos (CSS, JS, imagens)
├── app.js           # Configuração do Express
├── server.js        # Ponto de entrada
├── package.json     # Dependências
└── README.md        # Este arquivo
```

## ⚙️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/foodshare.git
cd foodshare
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```
PORT=3000
JWT_SECRET=sua_chave_secreta_aqui
DATABASE_URL=sua_url_de_banco_de_dados
```

4. Inicie o servidor:
```bash
npm start
```

Para modo desenvolvimento com hot-reload:
```bash
npm run dev
```

## 🌐 Endpoints

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login
- `POST /auth/logout` - Fazer logout

### Doações
- `GET /doacoes` - Listar todas as doações
- `POST /doacoes/nova` - Criar nova doação
- `GET /doacoes/:id/editar` - Editar doação
- `DELETE /doacoes/:id` - Deletar doação

### Solicitações
- `GET /solicitacoes/minhas` - Ver minhas solicitações
- `GET /solicitacoes/recebidas` - Ver solicitações recebidas

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. O token deve ser incluído no header:
```
Authorization: Bearer seu_token_aqui
```

## 📝 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

Made with ❤️ by FoodShare Team