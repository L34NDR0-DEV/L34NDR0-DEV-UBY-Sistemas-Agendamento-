# UBY - Sistema de Agendamento

**Versão 1.0.5** - Sistema completo de agendamento com arquitetura distribuída cliente-servidor, sincronização em tempo real, proteção DDoS avançada, funcionalidades de segurança empresarial e otimizações de performance.

## 📋 Descrição

O UBY é um sistema de agendamento empresarial desenvolvido em Electron que oferece uma solução completa para gerenciamento de agendamentos com arquitetura cliente-servidor. O sistema utiliza WebSocket para sincronização em tempo real, possui interface moderna e intuitiva, e oferece funcionalidades avançadas como notificações por voz, integração com WhatsApp e sistema de backup automático.

### 🏗️ Arquitetura do Sistema

O UBY utiliza uma arquitetura híbrida que combina:

- **Cliente Electron**: Interface desktop nativa com performance otimizada
- **Servidor WebSocket**: Sincronização em tempo real entre múltiplos clientes
- **Electron Store**: Persistência local de dados com backup automático
- **Monitor de Dados UBY**: Sistema de monitoramento contínuo de mudanças
- **Sistema de Cache Inteligente**: Cache offline para funcionamento sem conexão

### 🔄 Sincronização de Dados

O sistema implementa sincronização automática e em tempo real:

1. **Persistência Local**: Dados salvos no Electron Store (`%APPDATA%/uby-agendamentos/config.json`)
2. **Monitoramento Contínuo**: `UBYDataMonitor` detecta mudanças em tempo real
3. **WebSocket Broadcasting**: Mudanças são transmitidas para todos os clientes conectados
4. **Atualização Automática**: Interface atualizada sem necessidade de refresh
5. **Resolução de Conflitos**: Sistema automático para resolver conflitos de dados

## ✨ Funcionalidades

### 🎯 Principais
- **Interface Post-it**: Visualização em cards coloridos por status com grid responsivo de 4 colunas
- **Sistema de Login Multi-usuário**: Autenticação segura com diferentes perfis e permissões
- **Busca Avançada**: Sistema de filtros inteligentes por data, status, atendente, cidade e cliente
- **Notificações em Tempo Real**: Sistema completo com notificações nativas do Windows, sons e voz
- **Modo Escuro/Claro**: Interface adaptável com tema automático baseado no sistema
- **Integração WhatsApp**: Envio direto de mensagens com templates personalizados
- **Localização Inteligente**: Integração com Google Maps e autocomplete de endereços
- **Sistema de Voz Dual**: Notificações por voz com sistema especializado para Aquidauana
- **Modal de Som Moderno**: Interface avançada para configuração de som, voz e lembretes
- **Gerenciamento de Fuso Horário**: Sistema inteligente para múltiplos fusos horários
- **Sincronização Multi-cliente**: Atualizações em tempo real entre todos os usuários conectados
- **Sistema de Backup**: Backup automático e manual com versionamento
- **Autocomplete de Motoristas**: Sistema inteligente de sugestões por cidade
- **Lembretes Automáticos**: Alertas programados para agendamentos próximos e atrasados
- **Histórico de Edições**: Rastreamento completo de mudanças com auditoria
- **Sistema de Transferência**: Compartilhamento de agendamentos entre usuários
- **Cache Offline**: Funcionamento completo sem conexão com internet

## 🚀 Funcionalidades Principais

### 📅 Sistema de Agendamentos Avançado
- **Interface Post-it Colorida**: Visualização intuitiva com sistema de cores personalizáveis por categoria
- **Gestão Completa CRUD**: Criar, editar, visualizar e excluir agendamentos com validações inteligentes
- **Status Dinâmicos**: Pendente, Confirmado, Cancelado, Concluído com transições automáticas
- **Filtros Inteligentes**: Por data, cliente, status, tipo de serviço e profissional responsável
- **Busca Avançada**: Localização rápida por múltiplos critérios com auto-complete
- **Calendário Interativo**: Visualização mensal, semanal e diária com drag-and-drop
- **Recorrência de Agendamentos**: Criação de eventos repetitivos com padrões personalizados
- **Bloqueio de Horários**: Sistema para marcar indisponibilidades e feriados

### 🔔 Sistema de Notificações Inteligentes
- **Alertas Visuais Personalizados**: Pop-ups com diferentes níveis de prioridade e cores
- **Notificações Sonoras**: Biblioteca extensiva de sons configuráveis por tipo de evento
- **Sistema de Voz Dual**: Text-to-Speech com múltiplas vozes, incluindo voz especializada para Aquidauana
- **Lembretes Automáticos**: Configuração de múltiplos intervalos (15min, 1h, 1 dia antes)
- **Notificações Persistentes**: Sistema que mantém alertas ativos até confirmação manual
- **Escalação de Alertas**: Intensificação automática para agendamentos críticos
- **Notificações por Email**: Envio automático de confirmações e lembretes

### 👥 Gestão Completa de Clientes
- **CRUD Avançado**: Cadastro completo com validações e campos personalizáveis
- **Histórico Detalhado**: Rastreamento completo de todos os agendamentos por cliente
- **Perfil do Cliente**: Informações detalhadas, preferências, observações e fotos
- **Integração WhatsApp**: Envio direto de mensagens personalizadas com templates
- **Sistema de Fidelidade**: Controle de pontos e benefícios por cliente
- **Aniversários e Datas**: Lembretes automáticos de datas importantes
- **Relatórios de Cliente**: Análises de frequência, gastos e preferências

### 🔒 Segurança e Autenticação Empresarial
- **Sistema Multi-usuário**: Suporte a diferentes perfis de acesso (Admin, Operador, Visualizador)
- **Proteção DDoS Avançada**: Rate limiting inteligente e proteção contra ataques distribuídos
- **Logs de Segurança**: Monitoramento detalhado de todas as atividades do sistema
- **Backup Automático**: Sistema de backup incremental com redundância
- **Criptografia de Dados**: Proteção end-to-end de informações sensíveis
- **Sessões Seguras**: Controle de timeout e invalidação automática
- **Auditoria Completa**: Rastreamento de todas as alterações com timestamp

### 🌐 Conectividade e Sincronização
- **WebSocket em Tempo Real**: Sincronização instantânea entre múltiplos clientes
- **Modo Offline Completo**: Funcionamento total sem conexão com queue de sincronização
- **Sincronização Inteligente**: Resolução automática de conflitos quando a conexão é restaurada
- **API RESTful**: Integração completa com sistemas externos e terceiros
- **Cache Inteligente**: Sistema de cache multinível para performance otimizada
- **Replicação de Dados**: Sincronização automática entre diferentes dispositivos

### 📊 Relatórios e Analytics
- **Dashboard Executivo**: Visão geral com KPIs e métricas importantes
- **Relatórios Personalizados**: Geração de relatórios por período, cliente ou serviço
- **Análise de Performance**: Métricas de ocupação, receita e eficiência
- **Exportação Avançada**: PDF, Excel, CSV com formatação profissional
- **Gráficos Interativos**: Visualizações dinâmicas de dados e tendências
- **Previsões**: Sistema de análise preditiva para otimização de agenda

### 🎨 Interface e Experiência do Usuário
- **Design Responsivo**: Adaptação automática para desktop, tablet e mobile
- **Temas Personalizáveis**: Modo claro, escuro e temas customizados
- **Acessibilidade**: Suporte completo a leitores de tela e navegação por teclado
- **Atalhos de Teclado**: Navegação rápida com shortcuts personalizáveis
- **Drag and Drop**: Interface intuitiva para reorganização de agendamentos
- **Zoom e Acessibilidade**: Controles de zoom e contraste para diferentes necessidades

### 🔧 Configurações e Personalização
- **Configurações Granulares**: Controle detalhado de todos os aspectos do sistema
- **Perfis de Configuração**: Diferentes configurações por usuário ou departamento
- **Importação/Exportação**: Backup e restauração de configurações
- **Integração com Calendários**: Sincronização com Google Calendar, Outlook
- **Webhooks**: Notificações automáticas para sistemas externos
- **Plugins**: Sistema extensível para funcionalidades adicionais

### 🛡️ Segurança e Proteção DDoS (v1.0.7)
- **Rate Limiting HTTP**: Sistema avançado de controle de requisições
  - Limite geral: 100 requisições por 15 minutos por IP
  - Limite crítico: 10 requisições por 15 minutos para APIs sensíveis (`/api/uby/users`, `/api/uby/reload`)
  - Headers informativos sobre limites e tempo restante
- **Proteção WebSocket**: Defesa robusta contra ataques em tempo real
  - Máximo de 5 conexões simultâneas por IP
  - Controle de tentativas de conexão (10 por hora por IP)
  - Verificação automática de IPs bloqueados
  - Desconexão imediata de conexões suspeitas
- **Rate Limiting de Mensagens**: Controle inteligente de spam
  - Limite de 30 mensagens por minuto por usuário
  - Isenção automática para eventos de sistema (ping, heartbeat, disconnect)
  - Bloqueio temporário para usuários que excedem limites
- **Sistema de Bloqueio Inteligente**: Proteção adaptativa
  - Bloqueio automático de IPs suspeitos por 1 hora
  - Logs detalhados de tentativas de ataque
  - Limpeza automática de dados expirados
- **Monitoramento de Segurança**: Observabilidade completa
  - Logs detalhados de todas as tentativas de acesso
  - Métricas de performance e segurança
  - Alertas para atividades suspeitas
- **Gerenciamento de Memória**: Otimização de recursos
  - Limpeza automática de dados de rate limiting na desconexão
  - Prevenção de vazamentos de memória
  - Otimização contínua de performance

### 🎨 Interface
- **Post-its Coloridos**: Diferentes cores por status (amarelo, rosa, azul, verde, laranja, roxo)
- **Grid Otimizado**: Layout de 4 colunas com responsividade adaptativa:
  - 4 colunas em telas grandes (>1000px)
  - 3 colunas em telas médias (600-1000px)
  - 2 colunas em telas pequenas (600-900px)
  - 1 coluna em dispositivos móveis (<600px)
- **Interface Limpa**: Remoção do campo telefone dos post-its e WhatsApp
- **Truncagem Inteligente**: Observações longas são truncadas com tooltip
- **Responsivo**: Interface adaptável a diferentes tamanhos de tela
- **Animações**: Transições suaves e feedback visual
- **Modal Moderno**: Interface de configuração de som e voz com tema adaptável

### 🔧 Componentes Técnicos

#### 🌐 Sistema de Comunicação
- **WebSocket Client**: Cliente WebSocket com reconexão automática e heartbeat
- **WebSocket Server**: Servidor dedicado para sincronização em tempo real
- **WebSocket Secure**: Versão segura com criptografia SSL/TLS
- **Broadcasting**: Sistema de transmissão para múltiplos clientes simultaneamente
- **Rate Limiting Avançado**: Sistema completo de proteção DDoS
  - Rate limiting HTTP com limites diferenciados
  - Proteção WebSocket contra conexões maliciosas
  - Controle de spam de mensagens por usuário
  - Bloqueio inteligente de IPs suspeitos

#### 💾 Gerenciamento de Dados
- **Electron Store**: Persistência local com backup automático
- **UBY Data Monitor**: Monitoramento contínuo de mudanças nos dados
- **UBY Integration**: Integração com sistema UBY existente
- **Smart Cache**: Cache inteligente com TTL e invalidação automática
- **Offline Cache**: Cache para funcionamento sem conexão
- **Database Utils**: Utilitários para operações de banco de dados
- **Conflict Resolver**: Resolução automática de conflitos de dados

#### 🔊 Sistema de Áudio e Notificações
- **Sound Manager**: Gerenciamento centralizado de sons e efeitos
- **Voice Manager**: Sistema de voz padrão com múltiplas vozes Google
- **Voice Manager Aquidauana**: Sistema especializado para Aquidauana
- **Reminder System**: Sistema de lembretes automáticos e programados
- **Notification System**: Notificações nativas do Windows

#### ⚡ Otimização e Performance
- **Performance Detector**: Detecção automática da capacidade do sistema
- **Performance Optimizer**: Otimização adaptativa baseada no hardware
- **Adaptive Debouncer**: Debouncing adaptativo para eventos
- **Adaptive Throttler**: Throttling inteligente para performance
- **Lazy Loader**: Carregamento sob demanda de componentes
- **Dynamic Paginator**: Paginação dinâmica para grandes datasets

#### 🛡️ Segurança e Utilidades
- **Security Utils**: Utilitários de segurança e validação
- **Firewall Config**: Configuração de firewall para conexões
- **SSL Certificates**: Certificados SSL para conexões seguras
- **User Preferences**: Gerenciamento de preferências do usuário
- **Timezone Manager**: Gerenciamento inteligente de fusos horários

#### 🔍 Busca e Filtros
- **Search System**: Sistema avançado de busca e filtros
- **Motorista Autocomplete**: Autocomplete inteligente de motoristas por cidade
- **Data Cleaner**: Limpeza e sanitização de dados
- **Global Preloader**: Pré-carregamento global de recursos

## 🚀 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos

1. **Clone o repositório do cliente**:
   ```bash
   git clone https://github.com/L34NDR0-DEV/L34NDR0-DEV-UBY-Sistemas-Agendamento-.git
   cd L34NDR0-DEV-UBY-Sistemas-Agendamento-
   ```

   **Para o servidor**:
   ```bash
   git clone https://github.com/L34NDR0-DEV/UBY-Servidor.git
   cd UBY-Servidor
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute o aplicativo**:
   ```bash
   npm start
   ```

## 📖 Como Usar

### Login
1. Execute o aplicativo
2. Faça login com suas credenciais
3. Acesse o painel principal

### Gerenciamento de Agendamentos
- **Visualizar**: Os agendamentos aparecem como post-its coloridos
- **Filtrar**: Use a barra de busca para filtrar por critérios específicos
- **Editar**: Clique no botão "EDITAR" em qualquer post-it
- **Status**: Acompanhe o status através das cores dos post-its

### Cores dos Post-its
- 🟡 **Amarelo**: Agendado
- 🩷 **Rosa**: Em andamento
- 🔵 **Azul**: Concluído
- 🟢 **Verde**: Confirmado
- 🟠 **Laranja**: Pendente
- 🟣 **Roxo**: Cancelado

### 🔊 Sistema de Som e Voz

#### Funcionalidades de Som
- **Modal de Configuração**: Interface moderna para ajustar som e voz
- **Controle de Volume**: Ajuste independente para som e voz
- **Notificações Sonoras**: Alertas sonoros para diferentes eventos
- **Integração com Sistema**: Sons nativos do Windows

#### Sistema de Voz Dual
- **Voz Padrão**: Para todas as cidades com vozes Google prioritárias
- **Voz Especializada Aquidauana**: Sistema dedicado com:
  - Voz feminina Google exclusiva
  - Volume otimizado (90% vs 70% padrão)
  - Mensagens personalizadas com identificação da cidade
  - Prioridade máxima na fila de processamento

#### Lembretes Automáticos
- **Agendamentos Próximos**: Alertas em 30, 15, 10, 5, 2 e 1 minutos
- **Agendamentos Atrasados**: Notificações para atrasos superiores a 5 minutos
- **Notificações Críticas**: Alertas nativos do Windows para atrasos
- **Prevenção de Duplicatas**: Sistema inteligente anti-spam

### 🌍 Sistema de Fuso Horário

#### Funcionalidades de Fuso Horário
- **Conversão Automática**: Sistema inteligente de conversão entre fusos horários
- **Suporte a Aquidauana**: Tratamento especial para o fuso horário de Aquidauana (UTC-4)
- **Detecção de Atrasos**: Lógica corrigida para comparação de horários
- **Anúncios de Voz**: Horários anunciados no fuso local correto

#### Como Funciona
- **Armazenamento**: Agendamentos salvos no fuso horário local da cidade
- **Comparação**: Conversão para horário de Brasília (UTC-3) para detecção de atrasos
- **Exibição**: Horários mostrados no fuso local da cidade
- **Voz**: Anúncios com horário local correto para cada cidade

## 🛠️ Estrutura do Projeto

### 📁 Repositório Cliente
```
L34NDR0-DEV-UBY-Sistemas-Agendamento-/
├── UBY-App-Cliente/       # Aplicação Electron principal
│   ├── app/               # Configuração do Electron
│   ├── src/
│   │   ├── assets/        # Recursos estáticos
│   │   ├── data/          # Dados da aplicação
│   │   ├── scripts/       # Scripts JavaScript
│   │   │   ├── voice-manager.js           # Sistema de voz padrão
│   │   │   ├── voice-manager-aquidauana.js # Sistema de voz especializado
│   │   │   ├── sound-manager.js           # Gerenciamento de sons
│   │   │   ├── sound-modal.js             # Modal de configuração
│   │   │   ├── reminder-system.js         # Sistema de lembretes
│   │   │   └── ...
│   │   ├── styles/        # Arquivos CSS
│   │   │   ├── sound-modal.css            # Estilos do modal de som
│   │   │   └── ...
│   │   ├── utils/         # Utilitários e otimizações
│   │   │   ├── core-utils.js              # Utilitários essenciais
│   │   │   ├── performance-cache.js       # Sistema de cache
│   │   │   └── system-helpers.js          # Utilitários de sistema
│   │   └── views/         # Páginas HTML
│   ├── assets/            # Assets principais
│   └── package.json       # Configurações do cliente
├── .github/workflows/     # CI/CD e automação
├── server-package.json    # Configurações do servidor
└── package.json           # Configurações gerais
```

### 🖥️ Repositório Servidor
```
UBY-Servidor/
├── src/                   # Código fonte do servidor
│   ├── server/            # Servidor WebSocket
│   ├── api/               # APIs REST
│   ├── middleware/        # Middleware de segurança
│   ├── utils/             # Utilitários do servidor
│   └── config/            # Configurações
├── ssl/                   # Certificados SSL
├── logs/                  # Logs do servidor
└── package.json           # Dependências do servidor
```

## 🔧 Scripts Disponíveis

- `npm start` - Inicia a aplicação
- `npm run build` - Gera build de produção
- `npm test` - Executa testes
- `npm run dev` - Modo desenvolvimento

## 🌐 Tecnologias Utilizadas

- **Electron** - Framework para aplicações desktop
- **JavaScript** - Linguagem principal
- **HTML5/CSS3** - Interface e estilos
- **WebSocket** - Comunicação em tempo real
- **Node.js** - Runtime JavaScript

## 📱 Integrações

- **WhatsApp Web** - Envio de mensagens
- **Google Maps** - Localização e rotas
- **WebSocket** - Atualizações em tempo real
- **Sistema de Arquivos** - Backup e cache local

## 🔒 Segurança

- Autenticação de usuários
- Validação de dados
- Sanitização de entradas
- Backup automático de dados

## 📋 Changelog

### Versão 1.0.5 - Otimizações e Correções (Atual)
- **🔧 Correções de Assinatura Digital**: Desabilitação completa da assinatura de código para resolver problemas de build
- **🎨 Atualização de Interface**: Versão atualizada na tela de login (V1.0.5)
- **🏷️ Organização de Tags Git**: Reorganização completa das tags de versionamento (v1.0.1 a v1.0.5)
- **📦 Otimização de Build**: Configurações aprimoradas do electron-builder para builds mais estáveis
- **🔒 Configurações de Segurança**: Ajustes nas configurações de certificado e assinatura
- **📝 Documentação Atualizada**: README expandido com todas as funcionalidades e melhorias
- **🚀 Performance**: Otimizações gerais de performance e estabilidade

### Versão 1.0.4 - Melhorias de Estabilidade
- **🛠️ Correções de Bugs**: Resolução de problemas críticos de estabilidade
- **📊 Melhorias de Performance**: Otimizações no sistema de cache e sincronização
- **🔄 Atualizações de Dependências**: Atualização de bibliotecas para versões mais seguras

### Versão 1.0.3 - Funcionalidades Avançadas
- **🌐 Sistema WebSocket Aprimorado**: Melhorias na sincronização em tempo real
- **🔊 Sistema de Voz Dual**: Implementação do sistema especializado para Aquidauana
- **📱 Interface Responsiva**: Otimizações para diferentes tamanhos de tela

### Versão 1.0.2 - Segurança e Proteção
- **🛡️ Proteção DDoS Avançada**: Sistema completo de rate limiting e proteção
- **🔐 Autenticação Melhorada**: Sistema de login multi-usuário aprimorado
- **📊 Monitoramento de Segurança**: Logs detalhados e métricas de segurança

### Versão 1.0.1 - Funcionalidades Essenciais
- **📋 Sistema de Agendamentos**: Gestão completa com interface post-it colorida
- **🔔 Notificações Inteligentes**: Sistema de alertas e lembretes automáticos
- **🎯 Filtros Avançados**: Busca inteligente por múltiplos critérios
- **💬 Integração WhatsApp**: Envio direto de mensagens personalizadas

### Versão 1.0.0 - Release Inicial
- **🚀 Lançamento**: Primeira versão estável do sistema
- **🏗️ Arquitetura Base**: Implementação da arquitetura cliente-servidor
- **💾 Persistência de Dados**: Sistema de armazenamento local com Electron Store
- **🎨 Interface Moderna**: Design inicial com tema claro/escuro

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Principal**: Leandro
- **Versão**: 1.0.0
- **Status**: Em desenvolvimento ativo

## 📦 Repositórios

- **Cliente**: [L34NDR0-DEV-UBY-Sistemas-Agendamento-](https://github.com/L34NDR0-DEV/L34NDR0-DEV-UBY-Sistemas-Agendamento-)
- **Servidor**: [UBY-Servidor](https://github.com/L34NDR0-DEV/UBY-Servidor)

## 🚀 Deploy

### Cliente
1. Clone o repositório cliente
2. Instale as dependências: `npm install`
3. Configure o servidor de destino
4. Execute: `npm start`

### Servidor
1. Clone o repositório servidor
2. Instale as dependências: `npm install`
3. Configure certificados SSL
4. Execute: `npm run server`

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no repositório correspondente
- Cliente: [Issues do Cliente](https://github.com/L34NDR0-DEV/L34NDR0-DEV-UBY-Sistemas-Agendamento-/issues)
- Servidor: [Issues do Servidor](https://github.com/L34NDR0-DEV/UBY-Servidor/issues)

---

**UBY - Sistema de Agendamento** © 2025
