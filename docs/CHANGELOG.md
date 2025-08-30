# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.1] - 2025-01-30

### 🗺️ Sistema de Conversão de Coordenadas
- **Extração de Coordenadas**: Sistema avançado para extrair coordenadas de URLs do Google Maps
  - Suporte a múltiplos formatos de URL (maps.google.com, goo.gl, etc.)
  - Detecção automática de coordenadas em texto (lat, lng)
  - Processamento de URLs encurtadas e parâmetros complexos
- **Modal de Mapa Aprimorado**: Integração completa com sistema de mapas nativo
  - Abertura automática de coordenadas extraídas no modal
  - Suporte a endereços e coordenadas simultâneos
  - Geocodificação inteligente com fallback para API Nominatim
- **Logs de Debug**: Sistema detalhado de logging para rastreamento
  - Logs de extração de coordenadas
  - Logs de geocodificação via API
  - Monitoramento de processamento de URLs

### 🔔 Sistema de Notificações Aprimorado
- **Notificações Personalizadas**: Inclusão de informações detalhadas sobre atendentes
  - Nome do atendente logado nas notificações de atraso
  - Nome do criador do agendamento
  - Diferenciação inteligente entre atendente logado e criador
- **Mensagens de Voz Inteligentes**: Sistema de voz aprimorado
  - Mensagens personalizadas baseadas no contexto
  - Identificação quando o atendente logado criou o agendamento
  - Suporte para versões específicas (Aquidauana e padrão)
- **Notificações Nativas**: Melhorias nas notificações do Windows
  - Informações completas sobre responsáveis pelo agendamento
  - Formatação clara e informativa
  - Integração com sistema de preferências do usuário

### 🔧 Melhorias Técnicas
- **Função extractCoordinatesFromUrl**: Nova função para processamento de URLs
- **Função isCoordinates**: Aprimorada para detectar coordenadas em URLs
- **Geocodificação Avançada**: Priorização de coordenadas extraídas sobre geocodificação
- **Compatibilidade**: Suporte mantido para todas as funcionalidades existentes

## [1.0.6] - 2025-01-28

### 🚀 Migração para Arquitetura Distribuída
- **Repositório Servidor**: Criado repositório dedicado para o servidor ([UBY-Servidor](https://github.com/L34NDR0-DEV/UBY-Servidor))
- **Repositório Cliente**: Migrado para novo repositório ([L34NDR0-DEV-UBY-Sistemas-Agendamento-](https://github.com/L34NDR0-DEV/L34NDR0-DEV-UBY-Sistemas-Agendamento-))
- **Separação de Responsabilidades**: Cliente e servidor agora em repositórios independentes
- **Tag v1.0.1**: Criada e sincronizada em ambos os repositórios

### 🔐 Expansão de Permissões de Usuário
- **Novos Usuários**: Adicionados usuários Jhonny e Mauri com role "Suporte"
- **Permissões Expandidas**: Usuários com role "Suporte" agora têm acesso ao gerenciador de usuários
- **Correção de Carregamento**: Implementada sincronização forçada do arquivo users.json do userData

### 🛠️ Melhorias Técnicas
- **Build Otimizado**: Desabilitada recompilação nativa para resolver problemas de dependências
- **Limpeza de Código**: Removido sistema de chat e dependências não utilizadas
- **Logs de Debug**: Adicionados logs para rastreamento de carregamento de usuários
- **Sistema de Atualizações**: Configurado para novos repositórios GitHub

### 🗂️ Estrutura do Projeto
- **Remoção de Arquivos**: Removido diretório UBY-Servidor-Dashboard completo
- **Configuração Atualizada**: Ajustes na configuração do electron-builder
- **Versioning**: Atualizada versão para v1.0.1 em todos os arquivos relevantes
- **Referências de Repositório**: Atualizadas todas as referências para novos repositórios

### 📦 Deploy e Distribuição
- **CI/CD**: Configuração de workflows para ambos os repositórios
- **Releases**: Sistema de releases independente para cliente e servidor
- **Documentação**: README e CHANGELOG atualizados com nova arquitetura

## [1.0.2] - 2025-01-17

### 🔄 Sistema de Atualização Modernizado
- **Interface Moderna**: Nova interface visual para o sistema de atualizações
  - Design responsivo com ícones profissionais SVG
  - Modal moderno com informações detalhadas de versão
  - Barra de progresso animada para downloads
- **Verificação Automática**: Sistema de verificação automática via GitHub
  - Verificação a cada 30 minutos em segundo plano
  - Comparação inteligente de versões (semver)
  - Notificações nativas do Windows para novas versões
- **Configuração Flexível**: Sistema de configuração avançado
  - Configuração de repositório GitHub personalizável
  - Modo de desenvolvimento com simulação de atualizações
  - Controle de intervalos de verificação

### 🎨 Melhorias na Interface
- **Ícones Profissionais**: Conjunto completo de ícones SVG para o sistema
  - Ícones para atualização, download, instalação, verificação
  - Suporte a cores e tamanhos personalizáveis
  - Otimização para diferentes temas (claro/escuro)
- **Botão de Acesso Rápido**: Botão flutuante para acesso rápido às atualizações
- **Notas de Lançamento**: Exibição formatada das novidades de cada versão

### 🔧 Melhorias Técnicas
- **Integração GitHub**: Conexão direta com GitHub Releases API
- **Logs Detalhados**: Sistema de logging aprimorado para debugging
- **Compatibilidade**: Suporte completo para Windows 10 e 11
- **Performance**: Otimizações de carregamento e responsividade

### 🛠️ Correções
- **Estabilidade**: Correções de bugs menores no sistema de inicialização
- **Responsividade**: Melhorias na adaptação a diferentes resoluções
- **Logs**: Aprimoramento do sistema de logs para melhor diagnóstico

## [1.0.2] - 2025-01-15

### 🔐 Sistema de Controle de Acesso de Usuários
- **Campo de Status**: Implementação de campo `status` para todos os usuários
  - Estados disponíveis: `ativo`, `pausado`, `excluido`
  - Migração automática de usuários existentes para status `ativo`
- **Validação de Login**: Sistema robusto de verificação de status antes do login
  - Bloqueio automático de usuários pausados e excluídos
  - Mensagens de erro específicas para cada tipo de bloqueio
- **Exclusão Segura**: Usuários "excluídos" são marcados como tal ao invés de removidos
  - Preservação de dados históricos
  - Ocultação automática da interface de gerenciamento
- **Sistema de Pausa**: Funcionalidade para pausar/reativar usuários
  - Toggle simples entre estados `ativo` e `pausado`
  - Controle granular de acesso por administradores

### 🎨 Melhorias na Interface
- **Indicadores Visuais**: Status dos usuários claramente identificados na tabela
- **Formulários Atualizados**: Campo de status integrado ao formulário de usuários
- **Filtragem Inteligente**: Usuários excluídos não aparecem na lista de gerenciamento

### 🔧 Melhorias Técnicas
- **Validação Robusta**: Verificação de status em múltiplas camadas
- **Compatibilidade**: Suporte completo a valores em português
- **Integridade de Dados**: Preservação de histórico mesmo com exclusões

## [1.0.1] - 2025-01-15

### 🛡️ Segurança e Proteção DDoS
- **Rate Limiting HTTP**: Implementação de limites de requisições para APIs críticas
  - Limite geral: 100 requisições por 15 minutos
  - Limite crítico: 10 requisições por 15 minutos para `/api/uby/users` e `/api/uby/reload`
- **Proteção WebSocket**: Sistema avançado de proteção contra ataques
  - Limite de 5 conexões simultâneas por IP
  - Controle de tentativas de conexão (máximo 10 por hora)
  - Verificação de IPs bloqueados
- **Rate Limiting de Mensagens**: Controle de spam de mensagens
  - Limite de 30 mensagens por minuto por usuário
  - Isenção para eventos de sistema (ping, heartbeat, disconnect)
- **Sistema de Bloqueio Inteligente**: Bloqueio temporário de IPs suspeitos
  - Bloqueio automático por 1 hora para IPs que excedem limites
  - Logs detalhados de tentativas de ataque
- **Gerenciamento de Memória**: Limpeza automática de dados de rate limiting
  - Prevenção de vazamentos de memória
  - Otimização de performance

### 🔧 Melhorias Técnicas
- **Logs de Segurança**: Sistema detalhado de logging para monitoramento
- **Middleware Avançado**: Interceptação inteligente de eventos WebSocket
- **Configuração Flexível**: Limites configuráveis para diferentes cenários

## [1.0.0] - 2024-12-22

### 🎉 Release Inicial
- **Sistema Completo de Agendamentos**: Plataforma profissional para gestão de agendamentos
- **Interface Post-it**: Design inovador com cards estilo post-it coloridos
- **Compatibilidade Windows**: Suporte completo para Windows 10 e 11
- **Sistema de Usuários**: Controle de acesso com diferentes níveis de permissão

### 🔔 Sistema de Notificações
- **Notificações Nativas**: Integração completa com sistema de notificações do Windows
- **Lembretes Inteligentes**: Sistema automático de lembretes para agendamentos
- **Som e Voz**: Notificações sonoras e por voz configuráveis
- **Compatibilidade Windows 11**: Otimizações específicas para Windows 11

### 📋 Gestão de Agendamentos
- **CRUD Completo**: Criar, visualizar, editar e excluir agendamentos
- **Histórico de Edições**: Rastreamento completo de modificações por usuário
- **Status Dinâmicos**: Controle de status (pendente, concluído, cancelado)
- **Busca Avançada**: Sistema de busca inteligente com filtros

### 🎨 Interface e UX
- **Design Responsivo**: Interface adaptável e moderna
- **Temas**: Suporte a modo claro e escuro
- **Post-its Coloridos**: Sistema de cores para organização visual
- **Tooltips Informativos**: Informações detalhadas em hover

### 🔧 Recursos Técnicos
- **Electron Framework**: Aplicação desktop nativa
- **WebSocket**: Comunicação em tempo real
- **Backup Automático**: Sistema de backup e recuperação
- **Segurança**: Criptografia e controle de acesso
- **Performance**: Otimizações para alta performance

### 🛠️ Ferramentas Administrativas
- **Painel de Controle**: Interface administrativa completa
- **Logs Detalhados**: Sistema de logging para debugging
- **Configurações Avançadas**: Personalização completa do sistema
- **Atualizações Automáticas**: Sistema de atualização integrado


- Sistema de notificações em tempo real
- Suporte para transferência de agendamentos
- Sistema de WebSocket para comunicação em tempo real
- Compatibilidade com Windows 10 e 11