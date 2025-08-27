# UBY App Cliente

Aplicativo cliente do Sistema UBY de Agendamentos.

## Descrição

Este é o aplicativo principal do sistema UBY, desenvolvido em Electron, que permite aos usuários gerenciar agendamentos, visualizar estatísticas e interagir com o sistema de forma intuitiva.

## Funcionalidades

- 📅 Gerenciamento de agendamentos
- 👥 Sistema de usuários
- 🔔 Notificações em tempo real
- 📊 Relatórios e estatísticas
- 🎵 Sistema de áudio e alertas
- 🌐 Integração com WhatsApp
- 🚗 Autocomplete para motoristas
- 🔍 Sistema de busca avançado

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar aplicativo
npm start

# Build para produção
npm run build

# Build para Windows
npm run build-win
```

## Configuração

O aplicativo se conecta automaticamente ao servidor WebSocket. Certifique-se de que o servidor esteja rodando antes de iniciar o cliente.

## Estrutura do Projeto

```
UBY-App-Cliente/
├── src/               # Código fonte principal
│   ├── assets/        # Recursos (ícones, imagens)
│   ├── scripts/       # Scripts JavaScript
│   ├── styles/        # Arquivos CSS
│   ├── utils/         # Utilitários
│   └── views/         # Páginas HTML
├── app/               # Configuração do Electron
├── assets/            # Assets principais
└── package.json       # Dependências do projeto
```

## Tecnologias

- Electron
- HTML5/CSS3/JavaScript
- Socket.IO Client
- Node.js
- WebRTC (para funcionalidades de áudio)