const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Importar módulos essenciais do UBY
const ubyIntegration = require('./src/uby-integration');
const UBYDataMonitor = require('./src/uby-data-monitor');
const ubyDataMonitor = new UBYDataMonitor();

// ===== CONFIGURAÇÕES DE SEGURANÇA E RATE LIMITING =====

const RATE_LIMIT_CONFIG = {
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // máximo 100 requests por IP
        message: {
            error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
            retryAfter: 15 * 60
        },
        standardHeaders: true,
        legacyHeaders: false
    },
    websocket: {
        windowMs: 5 * 60 * 1000, // 5 minutos
        max: 10, // máximo 10 conexões por IP
        message: {
            error: 'Muitas tentativas de conexão WebSocket, tente novamente em 5 minutos.',
            retryAfter: 5 * 60
        }
    }
};

const PROTECTION_CONFIG = {
    maxConnectionsPerIP: 5,
    maxMessagesPerMinute: 60,
    blockDuration: 30 * 60 * 1000, // 30 minutos
    cleanupInterval: 5 * 60 * 1000 // 5 minutos
};

// Maps para controle de rate limiting
const connectionAttempts = new Map();
const userMessageCounts = new Map();
const blockedIPs = new Set();
const suspiciousIPs = new Map();

// ===== FUNÇÕES DE PROTEÇÃO =====

function isIPBlocked(ip) {
    return blockedIPs.has(ip);
}

function blockIP(ip, reason = 'Rate limit exceeded') {
    console.log(`🚫 Bloqueando IP ${ip}: ${reason}`);
    blockedIPs.add(ip);
    
    setTimeout(() => {
        blockedIPs.delete(ip);
        console.log(`✅ IP ${ip} desbloqueado após timeout`);
    }, PROTECTION_CONFIG.blockDuration);
    
    const suspicious = suspiciousIPs.get(ip) || { violations: 0, lastViolation: 0 };
    suspicious.violations++;
    suspicious.lastViolation = Date.now();
    suspiciousIPs.set(ip, suspicious);
}

function checkConnectionAttempts(ip) {
    const now = Date.now();
    const attempts = connectionAttempts.get(ip) || { count: 0, firstAttempt: now, blocked: false };
    
    if (now - attempts.firstAttempt > RATE_LIMIT_CONFIG.websocket.windowMs) {
        attempts.count = 0;
        attempts.firstAttempt = now;
        attempts.blocked = false;
    }
    
    attempts.count++;
    connectionAttempts.set(ip, attempts);
    
    if (attempts.count > RATE_LIMIT_CONFIG.websocket.max) {
        blockIP(ip, 'Excesso de tentativas de conexão WebSocket');
        return false;
    }
    
    return true;
}

function checkUserMessageRate(socketId) {
    const now = Date.now();
    const userMessages = userMessageCounts.get(socketId) || { count: 0, windowStart: now };
    
    if (now - userMessages.windowStart > 60000) { // 1 minuto
        userMessages.count = 0;
        userMessages.windowStart = now;
    }
    
    userMessages.count++;
    userMessageCounts.set(socketId, userMessages);
    
    return userMessages.count <= PROTECTION_CONFIG.maxMessagesPerMinute;
}

// Limpeza periódica de dados antigos
setInterval(() => {
    const now = Date.now();
    
    // Limpar tentativas de conexão antigas
    for (const [ip, data] of connectionAttempts.entries()) {
        if (now - data.firstAttempt > RATE_LIMIT_CONFIG.websocket.windowMs) {
            connectionAttempts.delete(ip);
        }
    }
    
    // Limpar contadores de mensagens antigas
    for (const [socketId, data] of userMessageCounts.entries()) {
        if (now - data.windowStart > 60000) {
            userMessageCounts.delete(socketId);
        }
    }
    
    // Limpar IPs suspeitos antigos
    for (const [ip, data] of suspiciousIPs.entries()) {
        if (now - data.lastViolation > PROTECTION_CONFIG.blockDuration * 2) {
            suspiciousIPs.delete(ip);
        }
    }
}, PROTECTION_CONFIG.cleanupInterval);

// ===== CONFIGURAÇÃO DO SERVIDOR =====

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingInterval: 25000,
    pingTimeout: 20000
});

const PORT = process.env.PORT || 3000;

// Middleware de segurança
const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.general);
app.use(generalLimiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));
// Servir arquivos estáticos da pasta assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rota principal para servir o dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Headers de segurança
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ===== ARMAZENAMENTO DE ESTADO =====

const connectedUsers = new Map();
const userIdToSocketId = new Map();
const userHeartbeats = new Map();
let stats = {
    startTime: new Date(),
    totalMessages: 0,
    connectedUsers: 0
};

// ===== PERSISTÊNCIA DE ESTADO =====

const USER_STATE_FILE = path.join(__dirname, 'data', 'user-state.json');

function saveUserState() {
    try {
        const stateData = {
            connectedUsers: Array.from(connectedUsers.values()),
            userIdToSocketId: Object.fromEntries(userIdToSocketId),
            timestamp: Date.now()
        };
        
        const stateDir = path.dirname(USER_STATE_FILE);
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        
        fs.writeFileSync(USER_STATE_FILE, JSON.stringify(stateData, null, 2));
        console.log('Estado dos usuários salvo com sucesso');
    } catch (error) {
        console.error('Erro ao salvar estado dos usuários:', error);
    }
}

function loadUserState() {
    try {
        if (fs.existsSync(USER_STATE_FILE)) {
            const stateData = JSON.parse(fs.readFileSync(USER_STATE_FILE, 'utf8'));
            
            if (stateData.connectedUsers) {
                stateData.connectedUsers.forEach(user => {
                    if (user.userId && user.userName) {
                        connectedUsers.set(user.socketId || user.userId, user);
                    }
                });
            }
            
            if (stateData.userIdToSocketId) {
                Object.entries(stateData.userIdToSocketId).forEach(([userId, socketId]) => {
                    userIdToSocketId.set(userId, socketId);
                });
            }
            
            console.log(`Estado anterior carregado com ${stateData.connectedUsers?.length || 0} usuários`);
            return stateData;
        }
    } catch (error) {
        console.error('Erro ao carregar estado dos usuários:', error);
    }
    return null;
}

// Carregar estado anterior
loadUserState();

// ===== ROTAS HTTP =====

app.get('/status', (req, res) => {
    res.json({ 
        status: 'running', 
        port: PORT, 
        connectedUsers: connectedUsers.size,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000)
    });
});

app.get('/info', (req, res) => {
    res.json({ 
        message: 'Servidor WebSocket UBY Agendamentos Unificado', 
        version: '2.0.0',
        port: PORT,
        connectedUsers: connectedUsers.size,
        features: ['rate-limiting', 'security-headers', 'state-persistence', 'uby-integration']
    });
});

app.get('/api/stats', async (req, res) => {
    try {
        const statsData = {
            server: {
                uptime: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
                connectedUsers: connectedUsers.size,
                totalMessages: stats.totalMessages,
                startTime: stats.startTime.toISOString()
            },
            uby: {
                totalUsers: ubyIntegration.getAllUsers().length,
                activeUsers: ubyIntegration.getAllUsers().filter(u => ubyIntegration.isUserActive(u.username)).length
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: process.memoryUsage()
            }
        };
        
        res.json(statsData);
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ===== INTEGRAÇÃO COM UBY =====

// Monitorar mudanças nos dados do UBY
ubyIntegration.onDataChange((data) => {
    console.log('UBY Integration: Dados alterados, notificando clientes...');
    
    io.emit('uby-data-updated', {
        users: data.users || [],
        changes: data.changes || [],
        timestamp: new Date().toISOString()
    });
});

ubyDataMonitor.onDataChange((changeData) => {
    console.log('UBY Data Monitor: Mudança detectada, notificando clientes...');
    
    io.emit('uby-system-data-updated', {
        type: changeData.type,
        data: changeData.data,
        timestamp: new Date().toISOString()
    });
});

// ===== EVENTOS WEBSOCKET =====

io.on('connection', (socket) => {
    const clientIP = socket.handshake.address;
    
    // Verificar rate limiting
    if (isIPBlocked(clientIP)) {
        console.log(`🚫 Conexão rejeitada de IP bloqueado: ${clientIP}`);
        socket.emit('rate-limit-exceeded', RATE_LIMIT_CONFIG.websocket.message);
        socket.disconnect(true);
        return;
    }
    
    if (!checkConnectionAttempts(clientIP)) {
        console.log(`🚫 Muitas tentativas de conexão de ${clientIP}`);
        socket.emit('rate-limit-exceeded', RATE_LIMIT_CONFIG.websocket.message);
        socket.disconnect(true);
        return;
    }
    
    console.log(`[INFO] Cliente conectado: ${socket.id} (IP: ${clientIP})`);
    
    // Wrapper para verificar rate limiting de mensagens
    const originalOn = socket.on.bind(socket);
    socket.on = function(event, handler) {
        return originalOn(event, (...args) => {
            if (!checkUserMessageRate(socket.id)) {
                console.log(`🚫 Rate limit de mensagens excedido para ${socket.id}`);
                socket.emit('rate-limit-exceeded', {
                    error: 'Muitas mensagens por minuto',
                    retryAfter: 60
                });
                return;
            }
            
            stats.totalMessages++;
            return handler(...args);
        });
    };
    
    // ===== EVENTOS DE AUTENTICAÇÃO =====
    
    socket.on('authenticate', (data) => {
        try {
            const { userId, userName, displayName } = data;
            
            if (!userId || !userName) {
                socket.emit('authentication:error', { message: 'Dados de autenticação inválidos' });
                return;
            }
            
            // Verificar se usuário existe no sistema UBY
            const ubyUser = ubyIntegration.getUserByUsername(userName);
            if (!ubyUser) {
                socket.emit('authentication:error', { message: 'Usuário não encontrado no sistema UBY' });
                return;
            }
            
            // Verificar se já existe uma sessão ativa para este usuário
            const existingSocketId = userIdToSocketId.get(userId);
            if (existingSocketId && existingSocketId !== socket.id) {
                const existingSocket = io.sockets.sockets.get(existingSocketId);
                if (existingSocket) {
                    existingSocket.emit('session-replaced', {
                        message: 'Sua sessão foi substituída por uma nova conexão'
                    });
                    existingSocket.disconnect(true);
                }
            }
            
            // Configurar dados do socket
            socket.userId = userId;
            socket.userName = userName;
            socket.displayName = displayName || ubyIntegration.getDisplayName(userName);
            
            // Armazenar usuário conectado
            const userInfo = {
                userId,
                userName,
                displayName: socket.displayName,
                connectedAt: new Date().toISOString(),
                socketId: socket.id,
                ip: clientIP
            };
            
            connectedUsers.set(socket.id, userInfo);
            userIdToSocketId.set(userId, socket.id);
            userHeartbeats.set(socket.id, Date.now());
            
            console.log(`[AUTH] Usuário autenticado: ${socket.displayName} (${userName})`);
            
            // Resposta de autenticação
            socket.emit('authenticated', {
                success: true,
                userId,
                userName,
                displayName: socket.displayName,
                connectedUsers: connectedUsers.size
            });
            
            // Notificar outros usuários
            socket.broadcast.emit('user:connected', {
                userId,
                userName,
                displayName: socket.displayName
            });
            
            // Salvar estado
            saveUserState();
            
        } catch (error) {
            console.error('[ERROR] Erro na autenticação:', error);
            socket.emit('authentication:error', { message: 'Erro interno na autenticação' });
        }
    });
    
    // ===== EVENTOS DE AGENDAMENTOS =====
    
    socket.on('agendamento:create', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[AGENDAMENTO] Novo agendamento criado por ${socket.displayName}:`, data.agendamento?.titulo);
        
        socket.broadcast.emit('agendamento:broadcast', {
            agendamento: data.agendamento,
            createdBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('agendamento:update', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[AGENDAMENTO] Agendamento atualizado por ${socket.displayName}:`, data.agendamento?.titulo);
        
        socket.broadcast.emit('agendamento:update', {
            action: data.action || 'updated',
            agendamento: data.agendamento,
            updatedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('agendamento:share', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[SHARE] Agendamento compartilhado por ${socket.displayName}`);
        
        socket.broadcast.emit('agendamento:shared', {
            agendamento: data.agendamento,
            sharedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    // ===== EVENTOS DE USUÁRIOS =====
    
    socket.on('user:update', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[USER] Usuário atualizado por ${socket.displayName}:`, data.user?.displayName);
        
        socket.broadcast.emit('user:updated', {
            user: data.user,
            updatedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('user:delete', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[USER] Usuário deletado por ${socket.displayName}:`, data.userId);
        
        socket.broadcast.emit('user:deleted', {
            userId: data.userId,
            deletedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('user:create', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[USER] Usuário criado por ${socket.displayName}:`, data.user?.displayName);
        
        socket.broadcast.emit('user:created', {
            user: data.user,
            createdBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    // ===== EVENTOS DE MOTORISTAS =====
    
    socket.on('motoristas:sync', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[MOTORISTAS] Sincronização por ${socket.displayName}`);
        
        socket.broadcast.emit('motoristas:sync', {
            motoristas: data.motoristas,
            syncedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('motoristas:add', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[MOTORISTAS] Motorista adicionado por ${socket.displayName}:`, data.motorista?.nome);
        
        socket.broadcast.emit('motoristas:add', {
            motorista: data.motorista,
            addedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('motoristas:remove', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        console.log(`[MOTORISTAS] Motorista removido por ${socket.displayName}:`, data.motoristaId);
        
        socket.broadcast.emit('motoristas:remove', {
            motoristaId: data.motoristaId,
            removedBy: {
                userId: socket.userId,
                displayName: socket.displayName,
                userName: socket.userName
            },
            timestamp: new Date().toISOString()
        });
    });
    
    // ===== EVENTOS DE NOTIFICAÇÕES =====
    
    socket.on('notification:send', (data) => {
        if (!socket.userId) {
            socket.emit('auth:required', { message: 'Autenticação necessária' });
            return;
        }
        
        const targetSocketId = userIdToSocketId.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('notification:received', {
                notification: data.notification,
                from: {
                    userId: socket.userId,
                    displayName: socket.displayName,
                    userName: socket.userName
                },
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // ===== EVENTOS DE SISTEMA =====
    
    socket.on('ping', () => {
        userHeartbeats.set(socket.id, Date.now());
        socket.emit('pong');
    });
    
    socket.on('heartbeat', () => {
        userHeartbeats.set(socket.id, Date.now());
        socket.emit('heartbeat-ack');
    });
    
    // ===== EVENTOS DE DESCONEXÃO =====
    
    socket.on('disconnect', (reason) => {
        console.log(`[INFO] Cliente desconectado: ${socket.id} (${reason})`);
        
        const user = connectedUsers.get(socket.id);
        if (user) {
            console.log(`[INFO] Usuário ${user.displayName} desconectado`);
            
            // Remover dos mapas
            connectedUsers.delete(socket.id);
            userIdToSocketId.delete(user.userId);
            userHeartbeats.delete(socket.id);
            userMessageCounts.delete(socket.id);
            
            // Notificar outros usuários
            socket.broadcast.emit('user:disconnected', {
                userId: user.userId,
                userName: user.userName,
                displayName: user.displayName
            });
            
            // Salvar estado
            saveUserState();
        }
    });
    
    socket.on('error', (error) => {
        console.error(`[ERROR] Erro no socket ${socket.id}:`, error);
    });
    
    // Handler para encerramento do servidor via dashboard
    socket.on('shutdown-server', () => {
        console.log(`[INFO] Solicitação de encerramento recebida do cliente ${socket.id}`);
        
        // Notificar todos os clientes sobre o encerramento
        io.emit('server-shutdown', {
            message: 'Servidor sendo encerrado pelo administrador',
            timestamp: new Date().toISOString()
        });
        
        // Aguardar um pouco para garantir que a mensagem seja enviada
        setTimeout(() => {
            gracefulShutdown('dashboard-shutdown');
        }, 1000);
    });
});

// ===== LIMPEZA PERIÓDICA =====

// Verificar heartbeats e remover conexões inativas
setInterval(() => {
    const now = Date.now();
    const HEARTBEAT_TIMEOUT = 60000; // 1 minuto
    
    for (const [socketId, lastHeartbeat] of userHeartbeats.entries()) {
        if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                console.log(`[CLEANUP] Removendo conexão inativa: ${socketId}`);
                socket.disconnect(true);
            }
            userHeartbeats.delete(socketId);
        }
    }
}, 30000); // Verificar a cada 30 segundos

// Salvar estado periodicamente
setInterval(() => {
    saveUserState();
}, 5 * 60 * 1000); // A cada 5 minutos

// ===== TRATAMENTO DE SINAIS =====

let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log(`\n🛑 Recebido ${signal}. Iniciando encerramento gracioso...`);
    
    // Notificar clientes sobre encerramento
    io.emit('server-shutdown', {
        message: 'Servidor sendo encerrado',
        reason: signal,
        timestamp: new Date().toISOString()
    });
    
    // Salvar estado final
    saveUserState();
    
    // Aguardar um pouco para enviar notificações
    setTimeout(() => {
        // Fechar Socket.IO
        io.close(() => {
            console.log('✅ Socket.IO encerrado');
            
            // Fechar servidor HTTP
            server.close(() => {
                console.log('✅ Servidor HTTP encerrado');
                process.exit(0);
            });
        });
    }, 1000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (error) => {
    console.error('[FATAL] Exceção não capturada:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Promise rejeitada não tratada:', reason);
    gracefulShutdown('unhandledRejection');
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====

server.listen(PORT, () => {
    console.log(`🚀 Servidor WebSocket UBY Unificado rodando na porta ${PORT}`);
    console.log(`📊 Dashboard disponível em: http://localhost:${PORT}/status`);
    console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`👥 Usuários conectados: ${connectedUsers.size}`);
    console.log(`🛡️  Proteções ativas: Rate Limiting, Security Headers, State Persistence`);
});

module.exports = { app, server, io, connectedUsers, userIdToSocketId };