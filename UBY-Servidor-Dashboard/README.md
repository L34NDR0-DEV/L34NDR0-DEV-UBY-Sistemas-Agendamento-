# UBY Servidor Dashboard

Servidor WebSocket e Dashboard de Monitoramento para o Sistema UBY de Agendamentos.

## Descrição

Este projeto contém o servidor WebSocket que gerencia as comunicações em tempo real e o dashboard web para monitoramento do sistema UBY.

## Funcionalidades

- 🚀 Servidor WebSocket para comunicação em tempo real
- 📊 Dashboard web para monitoramento
- 🔒 Sistema de autenticação e segurança
- 📈 Estatísticas em tempo real
- 🛡️ Rate limiting e proteção contra ataques
- 📱 Interface responsiva

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Modo desenvolvimento
npm run dev
```

## Configuração

O servidor roda por padrão na porta 3000. Acesse:
- Dashboard: http://localhost:3000
- Status: http://localhost:3000/status

## Estrutura do Projeto

```
UBY-Servidor-Dashboard/
├── Servidor/           # Arquivos do servidor Electron
├── security/           # Configurações de segurança
├── ssl/               # Certificados SSL
├── websocket-server-unified.js  # Servidor principal
├── serve-static.js    # Servidor de arquivos estáticos
└── package.json       # Dependências do projeto
```

## Tecnologias

- Node.js
- Express.js
- Socket.IO
- HTML5/CSS3/JavaScript
- Electron (para interface desktop)