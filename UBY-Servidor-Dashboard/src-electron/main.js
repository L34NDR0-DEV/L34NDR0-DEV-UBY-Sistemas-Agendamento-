const { app, BrowserWindow, Menu, Tray, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;
let serverModule; // manter referência ao módulo do servidor para encerramento limpo

// Função para criar notificações nativas do Windows
function showNativeNotification(options) {
    // Verificar se as notificações são suportadas
    if (!Notification.isSupported()) {
        console.log('Notificações não são suportadas neste sistema');
        return;
    }

    // Configurações padrão
    const notificationOptions = {
        title: options.title || 'Servidor WebSocket',
        body: options.message || options.body || '',
        icon: path.join(__dirname, '..', 'assets', 'servidor_logo.ico'),
        silent: options.silent || false,
        urgency: options.urgency || 'normal', // low, normal, critical
        timeoutType: options.timeoutType || 'default', // default, never
        ...options
    };

    // Criar e exibir a notificação
    const notification = new Notification(notificationOptions);
    
    // Eventos da notificação
    notification.on('click', () => {
        // Quando clicada, mostrar a janela principal
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
        }
    });
    
    notification.on('close', () => {
        console.log('Notificação fechada');
    });
    
    notification.show();
    return notification;
}

// Função para encerramento gracioso do servidor
function gracefulShutdownServer(reason) {
    return new Promise((resolve, reject) => {
        console.log(`[INFO] Iniciando encerramento do servidor (${reason})...`);
        
        if (!serverModule) {
            console.log('Servidor não estava ativo');
            resolve();
            return;
        }
        
        // Timeout para forçar encerramento
        const timeout = setTimeout(() => {
            console.log('[WARNING] Timeout no encerramento do servidor, forcando...');
            reject(new Error('Timeout'));
        }, 8000); // 8 segundos
        
        try {
            // Notificar clientes sobre encerramento
            if (serverModule.io) {
                serverModule.io.emit('server-shutdown', {
                    message: 'Aplicação sendo fechada',
                    reason: reason,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Aguardar um pouco para enviar notificação
            setTimeout(() => {
                // Fechar Socket.IO primeiro
                if (serverModule.io) {
                    serverModule.io.close(() => {
                        console.log('[INFO] Socket.IO encerrado');
                        
                        // Depois fechar servidor HTTP
                        if (serverModule.server) {
                            serverModule.server.close(() => {
                                console.log('[INFO] Servidor HTTP encerrado');
                                clearTimeout(timeout);
                                resolve();
                            });
                        } else {
                            clearTimeout(timeout);
                            resolve();
                        }
                    });
                } else if (serverModule.server) {
                    serverModule.server.close(() => {
                        console.log('[INFO] Servidor HTTP encerrado');
                        clearTimeout(timeout);
                        resolve();
                    });
                } else {
                    clearTimeout(timeout);
                    resolve();
                }
            }, 500); // 500ms para enviar notificação
            
        } catch (e) {
            console.error('Erro durante encerramento:', e);
            clearTimeout(timeout);
            reject(e);
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        maximizable: false, // Desabilita o botão maximizar
        frame: true, // Usar barra de título nativa do Windows
        icon: path.join(__dirname, '..', 'assets', 'servidor_logo.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    // Remover menu padrão (File, Edit, Help, etc.)
    Menu.setApplicationMenu(null);

    // Carregar a aplicação via servidor HTTP local (permite Socket.IO funcionar)
    mainWindow.loadURL('http://localhost:3000');

    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Fechar aplicação quando janela for fechada
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Interceptar tentativa de fechar janela para minimizar para bandeja
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
            
            // Mostrar notificação apenas na primeira vez
            if (tray && !tray.notificationShown) {
                tray.displayBalloon({
                    iconType: 'info',
                    title: 'Servidor WebSocket',
                    content: 'O servidor continua rodando em segundo plano. Clique no ícone da bandeja para abrir.'
                });
                tray.notificationShown = true;
            }
        }
    });
}

// Inicializar servidor WebSocket dentro do próprio processo do Electron
function startServer() {
    try {
        // Carrega e inicia o servidor WebSocket unificado
        serverModule = require(path.join(__dirname, '..', '..', 'websocket-server-unified.js'));
        console.log('Servidor: módulo carregado com sucesso.');
        
        // Configurar listener para eventos de notificação como fallback
        process.on('native-notification', (options) => {
            showNativeNotification(options);
        });
        
    } catch (e) {
        console.error('Erro ao iniciar servidor:', e);
    }
}

// Criar system tray
function createTray() {
    const iconPath = path.join(__dirname, '..', 'assets', 'servidor_logo.ico');
    const trayIcon = nativeImage.createFromPath(iconPath);
    
    // Redimensionar ícone para o tamanho adequado da bandeja
    const resizedIcon = trayIcon.resize({ width: 16, height: 16 });
    
    tray = new Tray(resizedIcon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir Servidor',
            click: () => {
                if (mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: 'Status do Servidor',
            enabled: false,
            sublabel: 'Rodando em http://localhost:3000'
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                app.isQuiting = true;
                gracefulShutdownServer('tray-quit')
                    .then(() => {
                        app.quit();
                    })
                    .catch(() => {
                        app.quit();
                    });
            }
        }
    ]);
    
    tray.setToolTip('Servidor WebSocket - Rodando');
    tray.setContextMenu(contextMenu);
    
    // Duplo clique para abrir janela
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        } else {
            createWindow();
        }
    });
    
    // Clique simples para mostrar/ocultar janela
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        } else {
            createWindow();
        }
    });
}

// Função para configurar handlers IPC para notificações
function setupNotificationHandlers() {
    // Handler para receber solicitações de notificação do renderer
    ipcMain.handle('show-notification', (event, options) => {
        return showNativeNotification(options);
    });
    
    // Handler para verificar se notificações são suportadas
    ipcMain.handle('notification-supported', () => {
        return Notification.isSupported();
    });
}

// Eventos do Electron
app.whenReady().then(() => {
    // Definir AppUserModelID no Windows para ícone e integração da barra de tarefas
    if (process.platform === 'win32') {
        app.setAppUserModelId('servidor.websocket.app');
    }

    // Criar system tray primeiro
    createTray();
    
    startServer();
    
    // Configurar handlers IPC para notificações
    setupNotificationHandlers();

    // Aguardar um pouco para o servidor iniciar (opcional)
    setTimeout(() => {
        createWindow();
        
        // Notificação de inicialização
        setTimeout(() => {
            showNativeNotification({
                title: 'Servidor WebSocket',
                body: 'Servidor iniciado com sucesso na porta 3000',
                urgency: 'normal'
            });
        }, 2000);
    }, 800);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Prevenir que a aplicação feche quando todas as janelas forem fechadas
// Isso permite que o servidor continue rodando em background
app.on('window-all-closed', () => {
    // No macOS, aplicações geralmente ficam ativas mesmo sem janelas
    // No Windows/Linux, vamos manter rodando em background
    if (process.platform === 'darwin') {
        // Encerrar servidor ao sair no macOS
        gracefulShutdownServer('app-quit')
            .then(() => {
                console.log('[INFO] Encerramento completo, saindo da aplicacao');
                app.quit();
            })
            .catch((e) => {
                console.error('Erro durante encerramento, forçando saída:', e);
                app.quit();
            });
    }
    // No Windows/Linux, não fazer nada - deixar rodando em background
});



// Handler para before-quit para encerramento mais controlado
app.on('before-quit', (event) => {
    if (!app.isQuiting) {
        event.preventDefault();
        app.isQuiting = true;
        
        gracefulShutdownServer('before-quit')
            .then(() => {
                app.quit();
            })
            .catch(() => {
                app.quit();
            });
    }
});