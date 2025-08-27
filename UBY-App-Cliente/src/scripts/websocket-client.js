/**
 * Cliente WebSocket para comunicação em tempo real
 * Gerencia conexão com servidor, eventos e sincronização
 */

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.userId = null;
        this.userName = null;
        this.displayName = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pingInterval = null;
        this.eventHandlers = new Map();
        this.onAuthenticated = null;
        this.jwtToken = null;
        this.serverUrl = null;
    }

    /**
     * Conectar ao servidor WebSocket
     */
    async connect(serverUrl = null) {
        try {
            // Verificar se Socket.IO está disponível
            if (typeof io === 'undefined') {
                console.error('[ERROR] Socket.IO client não encontrado. Verifique se o script socket.io.js está carregado.');
                return false;
            }

            // Determinar URL do servidor (priorizar HTTPS/WSS)
            if (!serverUrl) {
                // Tentar HTTPS primeiro, depois HTTP
                const secureUrl = 'https://localhost:3443';
                const fallbackUrl = 'http://localhost:3000';
                
                try {
                    // Testar conexão segura
                    const response = await fetch(`${secureUrl}/status`, { 
                        method: 'GET',
                        timeout: 5000 
                    });
                    if (response.ok) {
                        serverUrl = secureUrl;
                        console.log('[INFO] Usando conexão segura HTTPS/WSS');
                    } else {
                        throw new Error('Servidor seguro não disponível');
                    }
                } catch (error) {
                    serverUrl = fallbackUrl;
                    console.log('[INFO] Fallback para conexão HTTP/WS');
                }
            }

            console.log(`[INFO] Tentando conectar ao WebSocket em ${serverUrl}`);
            
            // Armazenar URL do servidor
            this.serverUrl = serverUrl;

            // Configurar conexão
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: true,
                reconnection: false, // Desabilitar reconexão automática para controlar manualmente
                reconnectionAttempts: 0,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                upgrade: true,
                rememberUpgrade: false,
                secure: serverUrl.startsWith('https'),
                rejectUnauthorized: false // Para certificados auto-assinados em desenvolvimento
            });

            // Configurar eventos básicos
            this.setupBasicEvents();

            // Aguardar conexão
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.error('[ERROR] Timeout na conexão WebSocket');
                    if (this.socket) {
                        this.socket.disconnect();
                    }
                    resolve(false);
                }, 10000); // Reduzir timeout para 10 segundos

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('[SUCCESS] Conectado ao WebSocket Server');
                    
                    // Iniciar ping/pong
                    this.startPingPong();
                    
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    // Log menos verboso para erros de conexão durante tentativas
                    if (error.message && error.message.includes('ERR_CONNECTION_REFUSED')) {
                        console.log(`[INFO] Servidor não disponível em ${serverUrl}`);
                    } else {
                        console.error('[ERROR] Erro de conexão WebSocket:', error.message || error);
                    }
                    
                    if (this.socket) {
                        this.socket.disconnect();
                    }
                    resolve(false);
                });

                this.socket.on('disconnect', (reason) => {
                    clearTimeout(timeout);
                    console.log('[DISCONNECT] Desconectado do WebSocket:', reason);
                    this.isConnected = false;
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('[ERROR] Erro ao conectar WebSocket:', error);
            return false;
        }
    }

    /**
     * Configurar eventos básicos
     */
    setupBasicEvents() {
        // Evento de desconexão
        this.socket.on('disconnect', (reason) => {
            console.log('[DISCONNECT] Desconectado do WebSocket:', reason);
            this.isConnected = false;
            
            // Tentar reconectar automaticamente se não foi desconexão intencional
            if (reason !== 'io client disconnect') {
                this.scheduleReconnect();
            }
        });

        this.socket.on('reconnect', () => {
            console.log('[RECONNECT] Reconectado ao WebSocket');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Re-autenticar após reconexão
            if (this.currentUser) {
                this.authenticate(this.currentUser.id, this.currentUser.username, this.currentUser.displayName);
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('[ERROR] Erro de reconexão:', error);
        });

        // Evento de pong
        this.socket.on('pong', () => {
            // Conexão ativa confirmada
        });

        // Eventos de agendamento
        this.socket.on('agendamento:update', (data) => {
            this.handleAgendamentoUpdate(data);
        });

        this.socket.on('agendamento:shared', (data) => {
            this.handleAgendamentoShared(data);
        });

        this.socket.on('agendamento:broadcast', (data) => {
            this.handleAgendamentoBroadcast(data);
        });

        // Eventos de notificação
        this.socket.on('notification:received', (data) => {
            this.handleNotificationReceived(data);
        });

        this.socket.on('notification:read', (data) => {
            this.handleNotificationRead(data);
        });

        // Eventos de usuário
        this.socket.on('user:connected', (data) => {
            this.handleUserConnected(data);
        });

        this.socket.on('user:disconnected', (data) => {
            this.handleUserDisconnected(data);
        });
        
        // Eventos de gerenciamento de usuários
        this.socket.on('user:updated', (data) => {
            this.handleUserUpdated(data);
        });
        
        this.socket.on('user:deleted', (data) => {
            this.handleUserDeleted(data);
        });
        
        this.socket.on('user:created', (data) => {
            this.handleUserCreated(data);
        });
        
        // Eventos específicos para o usuário atual
        this.socket.on('user:account_paused', (data) => {
            this.handleAccountPaused(data);
        });
        
        this.socket.on('user:account_deleted', (data) => {
            this.handleAccountDeleted(data);
        });

        // Eventos de sincronização
        this.socket.on('sync:response', (data) => {
            this.handleSyncResponse(data);
        });

        this.socket.on('sync:broadcast', (data) => {
            this.handleSyncBroadcast(data);
        });

        // Eventos de status
        this.socket.on('status:updated', (data) => {
            this.handleStatusUpdated(data);
        });

        this.socket.on('status:completed', (data) => {
            this.handleStatusCompleted(data);
        });

        this.socket.on('status:cancelled', (data) => {
            this.handleStatusCancelled(data);
        });

        // Eventos de busca
        this.socket.on('search:results', (data) => {
            this.handleSearchResults(data);
        });

        // Evento de autenticação
        this.socket.on('authenticated', (data) => {
            this.handleAuthenticated(data);
        });

        // Token JWT recebido
        this.socket.on('auth:token', (data) => {
            this.jwtToken = data.token;
            console.log('[JWT] Token recebido do servidor');
        });

        // Autenticação necessária
        this.socket.on('auth:required', (data) => {
            console.warn('[AUTH] Autenticação necessária:', data.message);
            this.isAuthenticated = false;
        });

        // Erro de autenticação
        this.socket.on('auth:error', (data) => {
            console.error('[ERROR] Erro de autenticação:', data.message);
            this.isAuthenticated = false;
            this.jwtToken = null;
        });

        this.socket.on('authentication:error', (data) => {
            console.error('[ERROR] Erro de autenticação:', data.message);
        });

        // ===== EVENTOS DE MOTORISTAS =====
        
        // Sincronização de motoristas
        this.socket.on('motoristas:sync', (data) => {
            this.handleMotoristasSync(data);
        });

        // Sincronização completa de motoristas
        this.socket.on('motoristas:full-sync', (data) => {
            this.handleMotoristasFullSync(data);
        });

        // Adição de motorista
        this.socket.on('motoristas:add', (data) => {
            this.handleMotoristasAdd(data);
        });

        // Remoção de motorista
        this.socket.on('motoristas:remove', (data) => {
            this.handleMotoristasRemove(data);
        });

        // Estatísticas de motoristas
        this.socket.on('motoristas:stats', (data) => {
            this.handleMotoristasStats(data);
        });

        // ===== FIM DOS EVENTOS DE MOTORISTAS =====
    }

    /**
     * Obter token JWT do servidor
     */
    async getJWTToken(userId, userName, displayName) {
        try {
            if (!this.serverUrl) {
                console.warn('URL do servidor não definida');
                return null;
            }

            const response = await fetch(`${this.serverUrl}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    userName,
                    displayName
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.jwtToken = data.token;
                console.log('[JWT] Token obtido com sucesso');
                return data.token;
            } else {
                console.error('[JWT] Erro ao obter token:', response.statusText);
                return null;
            }
        } catch (error) {
            console.error('[JWT] Erro na requisição de token:', error);
            return null;
        }
    }

    /**
     * Autenticar usuário (com suporte a JWT)
     */
    async authenticate(userId, userName, displayName, useJWT = true) {
        if (!this.isConnected) {
            console.warn('Não conectado ao WebSocket');
            return false;
        }

        this.userId = userId;
        this.userName = userName;
        this.displayName = displayName;

        let authData = {
            userId,
            userName,
            displayName
        };

        // Tentar obter token JWT se solicitado
        if (useJWT) {
            const token = await this.getJWTToken(userId, userName, displayName);
            if (token) {
                authData.token = token;
                console.log('[AUTH] Usando autenticação JWT');
            } else {
                console.log('[AUTH] Fallback para autenticação básica');
            }
        }

        this.socket.emit('authenticate', authData);
        return true;
    }

    /**
     * Enviar atualização de agendamento
     */
    sendAgendamentoUpdate(action, agendamento) {
        if (!this.isConnected) return false;

        this.socket.emit(`agendamento:${action}`, {
            agendamento,
            userId: this.userId,
            timestamp: new Date()
        });

        return true;
    }

    /**
     * Transferir agendamento
     */
    shareAgendamento(toUserId, agendamento, message = '') {
        if (!this.isConnected) return false;

        this.socket.emit('agendamento:shared', {
            toUserId,
            agendamento,
            fromUser: {
                userId: this.userId,
                userName: this.userName,
                displayName: this.displayName
            },
            message
        });

        return true;
    }

    /**
     * Enviar notificação
     */
    sendNotification(toUserId, notification) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:send', {
            toUserId,
            notification
        });

        return true;
    }

    /**
     * Marcar notificação como lida
     */
    markNotificationAsRead(notificationId) {
        if (!this.isConnected) return false;

        this.socket.emit('notification:read', {
            notificationId,
            userId: this.userId
        });

        return true;
    }

    /**
     * Solicitar sincronização
     */
    requestSync() {
        if (!this.isConnected) return false;

        this.socket.emit('sync:request');
        return true;
    }

    /**
     * Enviar consulta de busca
     */
    sendSearchQuery(query, filters = {}) {
        if (!this.isConnected) return false;

        this.socket.emit('search:query', {
            query,
            filters
        });

        return true;
    }

    /**
     * Registrar manipulador de evento
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remover manipulador de evento
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emitir evento para manipuladores registrados
     */
    emit(event, data) {
        if (!this.isConnected) {
            console.warn('[WARNING] Não conectado ao WebSocket');
            return false;
        }

        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[ERROR] Erro no manipulador de evento ${event}:`, error);
                }
            });
        }
    }

    /**
     * Manipular atualização de agendamento
     */
    handleAgendamentoUpdate(data) {
        console.log(`[APPOINTMENT] Agendamento ${data.action}:`, data.agendamento?.id);
        
        // Emitir evento personalizado para o sistema principal
        if (window.updateAgendamentoFromWebSocket) {
            window.updateAgendamentoFromWebSocket(data);
        }
    }

    /**
     * Manipular agendamento transferido
     */
    handleAgendamentoShared(data) {
        console.log(`[SHARE] Agendamento transferido de ${data.fromUser.displayName}`);
        
        // Adicionar agendamento transferido ao sistema
        if (window.addSharedAgendamento) {
            window.addSharedAgendamento(data.agendamento, data.fromUser);
        }
        
        // Mostrar notificação
        if (window.showToast) {
            window.showToast(
                `Agendamento transferido por ${data.fromUser.displayName}`,
                'info'
            );
        }
    }

    /**
     * Manipular broadcast de agendamento (notificação para todos os usuários)
     */
    handleAgendamentoBroadcast(data) {
        console.log(`[BROADCAST] Novo agendamento criado por ${data.createdBy.displayName}`);
        
        // Não processar se for o próprio usuário que criou
        if (data.createdBy.userId === this.userId) {
            return;
        }
        
        // Tocar notificação sonora única para todos os usuários conectados
        if (!window.soundMuted && window.soundManager && window.soundManager.isEnabled()) {
            // Tocar som de notificação
            window.soundManager.playAlert();
        }
        
        // Mostrar notificação visual
        if (window.showToast) {
            window.showToast(
                `Novo agendamento criado por ${data.createdBy.displayName}`,
                'info'
            );
        }
        
        // Recarregar agendamentos para mostrar o novo
        if (window.loadAgendamentos) {
            setTimeout(() => {
                window.loadAgendamentos();
            }, 1000);
        }
    }

    /**
     * Manipular notificação recebida
     */
    handleNotification(data) {
        console.log('[NOTIFICATION] Notificação recebida:', data);
        
        // Processar notificação
        if (window.processNotification) {
            window.processNotification(data);
        }
    }

    /**
     * Manipular usuário conectado
     */
    handleUserConnected(data) {
        console.log(`[USER] Usuário conectado: ${data.displayName}`);
        
        // Atualizar lista de usuários online
        if (window.updateOnlineUsers) {
            window.updateOnlineUsers(data, 'connected');
        }
    }

    /**
     * Manipular usuário desconectado
     */
    handleUserDisconnected(data) {
        console.log(`[USER] Usuário desconectado: ${data.displayName}`);
        
        // Atualizar lista de usuários online
        if (window.updateOnlineUsers) {
            window.updateOnlineUsers(data, 'disconnected');
        }
    }

    /**
     * Manipular sincronização de dados
     */
    handleDataSync(data) {
        console.log('[SYNC] Dados sincronizados');
        
        // Sincronizar dados locais
        if (window.syncLocalData) {
            window.syncLocalData(data);
        }
    }

    /**
     * Manipular broadcast de sincronização
     */
    handleSyncBroadcast(data) {
        console.log(`[SYNC] Broadcast recebido com ${data.updates?.length || 0} atualizações`);
        
        // Processar atualizações em tempo real
        if (data.updates && data.updates.length > 0) {
            data.updates.forEach(update => {
                this.processUpdate(update);
            });
        }
        
        // Emitir evento para o sistema principal
        this.emit('sync:broadcast', data);
    }

    /**
     * Processar atualização individual
     */
    processUpdate(update) {
        switch (update.type) {
            case 'agendamento':
                this.handleAgendamentoUpdate(update);
                break;
            case 'notification':
                this.handleNotificationUpdate(update);
                break;
            case 'status':
                this.handleStatusUpdate(update);
                break;
            default:
                console.log(`[UPDATE] Tipo de atualização desconhecido: ${update.type}`);
        }
    }

    /**
     * Manipular atualização de status
     */
    handleStatusUpdated(data) {
        console.log(`[STATUS] Status atualizado: ${data.newStatus} para agendamento ${data.agendamentoId}`);
        
        // Emitir evento para o sistema principal
        this.emit('status:updated', data);
        
        // Atualizar interface se disponível
        if (window.updateAgendamentoStatus) {
            window.updateAgendamentoStatus(data.agendamentoId, data.newStatus);
        }
    }

    /**
     * Manipular conclusão de agendamento
     */
    handleStatusCompleted(data) {
        console.log(`[STATUS] Agendamento ${data.agendamentoId} marcado como concluído por ${data.completedByUser}`);
        
        // Emitir evento para o sistema principal
        this.emit('status:completed', data);
        
        // Atualizar interface se disponível
        if (window.completeAgendamento) {
            window.completeAgendamento(data.agendamentoId, data.completionNotes);
        }
    }

    /**
     * Manipular cancelamento de agendamento
     */
    handleStatusCancelled(data) {
        console.log(`[STATUS] Agendamento ${data.agendamentoId} cancelado por ${data.cancelledByUser}`);
        
        // Emitir evento para o sistema principal
        this.emit('status:cancelled', data);
        
        // Atualizar interface se disponível
        if (window.cancelAgendamento) {
            window.cancelAgendamento(data.agendamentoId, data.cancelReason);
        }
    }

    /**
     * Enviar atualização de status
     */
    sendStatusUpdate(agendamentoId, newStatus, reason = '') {
        if (!this.isConnected) return false;

        this.socket.emit('status:update', {
            agendamentoId,
            newStatus,
            reason
        });

        return true;
    }

    /**
     * Marcar agendamento como concluído
     */
    sendStatusComplete(agendamentoId, completionNotes = '') {
        if (!this.isConnected) return false;

        this.socket.emit('status:complete', {
            agendamentoId,
            completionNotes
        });

        return true;
    }

    /**
     * Cancelar agendamento
     */
    sendStatusCancel(agendamentoId, cancelReason = '') {
        if (!this.isConnected) return false;

        this.socket.emit('status:cancel', {
            agendamentoId,
            cancelReason
        });

        return true;
    }

    /**
     * Forçar sincronização
     */
    forceSync() {
        if (!this.isConnected) return false;

        this.socket.emit('sync:force');
        return true;
    }

    /**
     * Manipular resultados de busca
     */
    handleSearchResults(data) {
        console.log(`[SEARCH] Resultados da busca: ${data.results.length} encontrados`);
        
        // Atualizar resultados de busca
        if (window.updateSearchResults) {
            window.updateSearchResults(data);
        }
    }

    /**
     * Manipular autenticação bem-sucedida
     */
    handleAuthSuccess(data) {
        console.log('[AUTH] Autenticado no WebSocket');
        this.isAuthenticated = true;
        
        if (this.onAuthenticated) {
            this.onAuthenticated(data);
        }
    }

    /**
     * Manipular evento de autenticação
     */
    handleAuthenticated(data) {
        console.log('[AUTH] Usuário autenticado:', data);
        this.isAuthenticated = true;
        this.userId = data.userId;
        
        // Emitir evento de autenticação
        this.emit('authenticated', data);
        
        if (this.onAuthenticated) {
            this.onAuthenticated(data);
        }
    }

    /**
     * Iniciar ping/pong para manter conexão ativa
     */
    startPingPong() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        this.pingInterval = setInterval(() => {
            if (this.isConnected && this.socket) {
                this.socket.emit('ping');
            }
        }, 30000); // Ping a cada 30 segundos
    }

    /**
     * Parar ping/pong
     */
    stopPingPong() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Agendar reconexão
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[ERROR] Máximo de tentativas de reconexão atingido');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`[RECONNECT] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    // ===== MÉTODOS DE MOTORISTAS =====

    /**
     * Enviar sincronização de motoristas para o servidor
     */
    sendMotoristasSync(motoristasData) {
        if (!this.isConnected || !this.socket) {
            console.warn('[MOTORISTAS] Não conectado ao WebSocket');
            return false;
        }

        try {
            this.socket.emit('motoristas:sync', {
                motoristas: motoristasData,
                timestamp: new Date().toISOString()
            });
            console.log('[MOTORISTAS] Dados enviados para sincronização');
            return true;
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao enviar sincronização:', error);
            return false;
        }
    }

    /**
     * Solicitar sincronização inicial de motoristas
     */
    requestMotoristasSync() {
        if (!this.isConnected || !this.socket) {
            console.warn('[MOTORISTAS] Não conectado ao WebSocket');
            return false;
        }

        try {
            this.socket.emit('motoristas:request-sync', {
                timestamp: new Date().toISOString()
            });
            console.log('[MOTORISTAS] Solicitação de sincronização enviada');
            return true;
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao solicitar sincronização:', error);
            return false;
        }
    }

    /**
     * Enviar adição de motorista
     */
    sendMotoristasAdd(cidade, motorista) {
        if (!this.isConnected || !this.socket) {
            console.warn('[MOTORISTAS] Não conectado ao WebSocket');
            return false;
        }

        try {
            this.socket.emit('motoristas:add', {
                cidade: cidade,
                motorista: motorista,
                timestamp: new Date().toISOString()
            });
            console.log(`[MOTORISTAS] Adição enviada: ${motorista} em ${cidade}`);
            return true;
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao enviar adição:', error);
            return false;
        }
    }

    /**
     * Enviar remoção de motorista
     */
    sendMotoristasRemove(cidade, motorista) {
        if (!this.isConnected || !this.socket) {
            console.warn('[MOTORISTAS] Não conectado ao WebSocket');
            return false;
        }

        try {
            this.socket.emit('motoristas:remove', {
                cidade: cidade,
                motorista: motorista,
                timestamp: new Date().toISOString()
            });
            console.log(`[MOTORISTAS] Remoção enviada: ${motorista} de ${cidade}`);
            return true;
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao enviar remoção:', error);
            return false;
        }
    }

    /**
     * Solicitar estatísticas de motoristas
     */
    requestMotoristasStats() {
        if (!this.isConnected || !this.socket) {
            console.warn('[MOTORISTAS] Não conectado ao WebSocket');
            return false;
        }

        try {
            this.socket.emit('motoristas:get-stats');
            console.log('[MOTORISTAS] Solicitação de estatísticas enviada');
            return true;
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao solicitar estatísticas:', error);
            return false;
        }
    }

    // ===== HANDLERS DE MOTORISTAS =====

    /**
     * Handler para sincronização de motoristas
     */
    handleMotoristasSync(data) {
        try {
            console.log('[MOTORISTAS] Sincronização recebida:', data);
            
            if (window.motoristaManager && data.motoristas) {
                // Processar dados recebidos através do motoristaManager
                window.motoristaManager.handleMotoristaSync(data.motoristas, true);
            }
            
            // Emitir evento customizado para outros componentes
            this.emit('motoristas:synced', data);
            
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao processar sincronização:', error);
        }
    }

    /**
     * Handler para sincronização completa de motoristas
     */
    handleMotoristasFullSync(data) {
        try {
            console.log('[MOTORISTAS] Sincronização completa recebida:', data);
            
            if (window.motoristaManager && data.motoristas) {
                // Processar sincronização completa
                window.motoristaManager.handleFullSync(data.motoristas, true);
            }
            
            // Emitir evento customizado
            this.emit('motoristas:full-synced', data);
            
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao processar sincronização completa:', error);
        }
    }

    /**
     * Handler para adição de motorista
     */
    handleMotoristasAdd(data) {
        try {
            console.log('[MOTORISTAS] Adição recebida:', data);
            
            if (window.motoristaManager && data.cidade && data.motorista) {
                // Processar adição através do motoristaManager
                window.motoristaManager.handleMotoristasAdd(data.cidade, data.motorista, true);
            }
            
            // Emitir evento customizado
            this.emit('motoristas:added', data);
            
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao processar adição:', error);
        }
    }

    /**
     * Handler para remoção de motorista
     */
    handleMotoristasRemove(data) {
        try {
            console.log('[MOTORISTAS] Remoção recebida:', data);
            
            if (window.motoristaManager && data.cidade && data.motorista) {
                // Processar remoção através do motoristaManager
                window.motoristaManager.handleMotoristasRemove(data.cidade, data.motorista, true);
            }
            
            // Emitir evento customizado
            this.emit('motoristas:removed', data);
            
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao processar remoção:', error);
        }
    }

    /**
     * Handler para estatísticas de motoristas
     */
    handleMotoristasStats(data) {
        try {
            console.log('[MOTORISTAS] Estatísticas recebidas:', data);
            
            // Emitir evento customizado
            this.emit('motoristas:stats', data);
            
        } catch (error) {
            console.error('[MOTORISTAS] Erro ao processar estatísticas:', error);
        }
    }

    // ===== FIM DOS MÉTODOS DE MOTORISTAS =====
    
    // ===== MÉTODOS DE GERENCIAMENTO DE USUÁRIOS =====
    
    /**
     * Manipular atualização de usuário
     */
    handleUserUpdated(data) {
        try {
            console.log('[USER] Usuário atualizado:', data);
            
            // Atualizar interface se necessário
            if (window.userManagement && typeof window.userManagement.handleUserUpdate === 'function') {
                window.userManagement.handleUserUpdate(data);
            }
            
            // Mostrar notificação
            if (window.safeShowToast) {
                const actionText = data.action === 'paused' ? 'pausado' : 
                                 data.action === 'activated' ? 'ativado' : 'atualizado';
                window.safeShowToast(
                    `Usuário ${data.user.displayName} foi ${actionText} por ${data.updatedBy.displayName}`,
                    'info'
                );
            }
        } catch (error) {
            console.error('[ERROR] Erro ao processar atualização de usuário:', error);
        }
    }
    
    /**
     * Manipular exclusão de usuário
     */
    handleUserDeleted(data) {
        try {
            console.log('[USER] Usuário excluído:', data);
            
            // Atualizar interface se necessário
            if (window.userManagement && typeof window.userManagement.handleUserDelete === 'function') {
                window.userManagement.handleUserDelete(data);
            }
            
            // Mostrar notificação
            if (window.safeShowToast) {
                window.safeShowToast(
                    `Usuário ${data.user.displayName} foi excluído por ${data.deletedBy.displayName}`,
                    'warning'
                );
            }
        } catch (error) {
            console.error('[ERROR] Erro ao processar exclusão de usuário:', error);
        }
    }
    
    /**
     * Manipular criação de usuário
     */
    handleUserCreated(data) {
        try {
            console.log('[USER] Usuário criado:', data);
            
            // Atualizar interface se necessário
            if (window.userManagement && typeof window.userManagement.handleUserCreate === 'function') {
                window.userManagement.handleUserCreate(data);
            }
            
            // Mostrar notificação
            if (window.safeShowToast) {
                window.safeShowToast(
                    `Novo usuário ${data.user.displayName} foi criado por ${data.createdBy.displayName}`,
                    'success'
                );
            }
        } catch (error) {
            console.error('[ERROR] Erro ao processar criação de usuário:', error);
        }
    }
    
    /**
     * Manipular pausamento da conta do usuário atual
     */
    handleAccountPaused(data) {
        try {
            console.log('[USER] Conta pausada:', data);
            
            // Mostrar notificação crítica
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Conta Pausada',
                    text: data.message || 'Sua conta foi pausada por um administrador.',
                    icon: 'warning',
                    confirmButtonText: 'Entendi',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    // Redirecionar para login após 2 segundos
                    setTimeout(() => {
                        this.handleLogout();
                    }, 2000);
                });
            } else {
                alert(data.message || 'Sua conta foi pausada por um administrador.');
                setTimeout(() => {
                    this.handleLogout();
                }, 2000);
            }
        } catch (error) {
            console.error('[ERROR] Erro ao processar pausamento da conta:', error);
        }
    }
    
    /**
     * Manipular exclusão da conta do usuário atual
     */
    handleAccountDeleted(data) {
        try {
            console.log('[USER] Conta excluída:', data);
            
            // Mostrar notificação crítica
            if (window.Swal) {
                window.Swal.fire({
                    title: 'Conta Excluída',
                    text: data.message || 'Sua conta foi excluída por um administrador.',
                    icon: 'error',
                    confirmButtonText: 'Entendi',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    // Redirecionar para login imediatamente
                    this.handleLogout();
                });
            } else {
                alert(data.message || 'Sua conta foi excluída por um administrador.');
                this.handleLogout();
            }
        } catch (error) {
            console.error('[ERROR] Erro ao processar exclusão da conta:', error);
        }
    }
    
    /**
     * Manipular logout forçado
     */
    handleLogout() {
        try {
            console.log('[USER] Executando logout forçado');
            
            // Desconectar WebSocket
            this.disconnect();
            
            // Limpar dados locais
            if (window.localStorage) {
                window.localStorage.removeItem('currentUser');
                window.localStorage.removeItem('authToken');
            }
            
            // Redirecionar para login
            if (window.location) {
                window.location.href = '../views/login.html';
            }
        } catch (error) {
            console.error('[ERROR] Erro ao executar logout:', error);
        }
    }
    
    // ===== FIM DOS MÉTODOS DE GERENCIAMENTO DE USUÁRIOS =====

    /**
     * Desconectar do WebSocket
     */
    disconnect() {
        if (this.socket) {
            console.log('[DISCONNECT] Desconectado do WebSocket');
            this.stopPingPong();
            this.socket.disconnect();
            this.isConnected = false;
            this.isAuthenticated = false;
        }
    }

    /**
     * Verificar status da conexão
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            userId: this.userId,
            userName: this.userName,
            displayName: this.displayName,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Instância global do cliente WebSocket
window.wsClient = new WebSocketClient();