const { app, BrowserWindow, ipcMain, Menu, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const os = require('os');

// WebSocket server files removed - connecting to external server on port 3000

// Configuração do armazenamento
const store = new Store();

// Modo desempenho (sem tocar na UI). Habilitar com PERFORMANCE_MODE=true
const performanceMode = process.env.PERFORMANCE_MODE === 'true';
console.log(`[CONFIG] Performance Mode: ${performanceMode ? 'ON' : 'OFF'}`);

// Conectando ao servidor WebSocket externo na porta 3000

let loginWindow;
let mainWindow;

// Obter usuários do sistema
function getSystemUsers() {
  try {
    const currentUser = os.userInfo();
    const systemUsers = [];
    
    // Adicionar o usuário atual
    systemUsers.push({
      id: 1,
      nome: currentUser.username,
      email: `${currentUser.username}@${os.hostname()}`,
      avatar: currentUser.username.substring(0, 2).toUpperCase(),
      isCurrentUser: true
    });
    
    // Em modo desempenho, retornar apenas o usuário atual, evitando comandos sincronizados
    if (performanceMode) {
      return systemUsers;
    }
    
    // Sistema compatível apenas com Windows 10 e 11
    try {
      const { execSync } = require('child_process');
      
      // Verificar versão do Windows
      const osVersion = execSync('ver', { encoding: 'utf8' });
      console.log(`[INFO] Sistema detectado: ${osVersion.trim()}`);
      
      // Comando para obter usuários do Windows
      const commands = [
        'wmic useraccount where "LocalAccount=True" get name',
        'net user',
        'wmic useraccount get name'
      ];
      
      let allUsernames = new Set();
      
      // Tentar diferentes comandos para obter usuários
      for (const command of commands) {
        try {
          const output = execSync(command, { encoding: 'utf8', timeout: 5000 });
          
          if (command.includes('net user')) {
            // Processar saída do comando 'net user'
            const lines = output.split('\n');
            const userSection = lines.slice(4, -3); // Pular cabeçalho e rodapé
            userSection.forEach(line => {
              const users = line.trim().split(/\s+/);
              users.forEach(user => {
                if (user && user.length > 0 && !user.includes('-') && !user.includes('*')) {
                  allUsernames.add(user);
                }
              });
            });
          } else {
            // Processar saída dos comandos wmic
            const usernames = output.split('\n')
              .map(line => line.trim())
              .filter(line => line && line !== 'Name' && line !== 'Name ');
            
            usernames.forEach(username => {
              if (username && username.length > 0) {
                allUsernames.add(username);
              }
            });
          }
        } catch (cmdError) {
          console.log(`Comando ${command} falhou:`, cmdError.message);
        }
      }
      
      // Converter Set para Array e processar
      const uniqueUsernames = Array.from(allUsernames)
        .filter(username => username !== currentUser.username)
        .slice(0, 15); // Limitar a 15 usuários adicionais
      
      uniqueUsernames.forEach((username, index) => {
        systemUsers.push({
          id: index + 2,
          nome: username,
          email: `${username}@${os.hostname()}`,
          avatar: username.substring(0, 2).toUpperCase(),
          isCurrentUser: false
        });
      });
      
      console.log(`[INFO] Encontrados ${systemUsers.length} usuários do Windows`);
      
    } catch (error) {
      console.log('[WARNING] Não foi possível obter lista completa de usuários do Windows:', error.message);
      
      // Adicionar alguns usuários padrão como fallback
      const defaultUsers = ['Administrator', 'Guest', 'DefaultAccount'];
      defaultUsers.forEach((username, index) => {
        if (username !== currentUser.username) {
          systemUsers.push({
            id: index + 2,
            nome: username,
            email: `${username}@${os.hostname()}`,
            avatar: username.substring(0, 2).toUpperCase(),
            isCurrentUser: false
          });
        }
      });
    }
    
    return systemUsers;
  } catch (error) {
    console.error('Erro ao obter usuários do sistema:', error);
    return [{
      id: 1,
      nome: 'Usuário Atual',
      email: 'usuario@sistema',
      avatar: 'UA',
      isCurrentUser: true
    }];
  }
}

// Carregar usuários do arquivo JSON
function loadUsers() {
  try {
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    const usersData = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(usersData);
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    return { users: [] };
  }
}

// Validar credenciais de usuário
function validateUser(username, password) {
  const usersData = loadUsers();
  
  // Primeiro, tentar encontrar um usuário ativo com as credenciais
  const activeUser = usersData.users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password &&
    (u.status === 'ativo' || !u.status) // Incluir usuários sem status (compatibilidade)
  );
  
  if (activeUser) {
    return activeUser;
  }
  
  // Se não encontrou usuário ativo, verificar se existe usuário com outras condições
  const user = usersData.users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  
  if (user) {
    const status = user.status || 'ativo';
    
    if (status === 'pausado') {
      return { error: 'pausado', message: 'Acesso temporariamente indisponível. Contate o administrador para mais informações.' };
    } else if (status === 'excluido') {
      return { error: 'excluido', message: 'Acesso não autorizado. Entre em contato com o suporte técnico.' };
    }
  }
  
  return null;
}

function createLoginWindow() {
  // Criar a janela de login
  loginWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
    titleBarStyle: 'hidden',
    frame: false, // Janela sem moldura (como antes)
    show: false,
    skipTaskbar: false,
    fullscreenable: true // Permitir modo tela cheia
  });

  // Carregar a página de login
  loginWindow.loadFile(path.join(__dirname, '..', 'src', 'views', 'login.html'));

  // Atalhos de teclado: F11 e Alt+Enter para alternar tela cheia
  loginWindow.webContents.on('before-input-event', (event, input) => {
    const isF11 = input.type === 'keyDown' && input.key === 'F11';
    const isAltEnter = input.type === 'keyDown' && input.key.toLowerCase() === 'enter' && input.alt;
    if (isF11 || isAltEnter) {
      event.preventDefault();
      if (isF11) {
        // F11: tela cheia real
        const isFullScreen = loginWindow.isFullScreen();
        loginWindow.setFullScreen(!isFullScreen);
        loginWindow.webContents.send('fullscreen-changed', !isFullScreen);
      } else if (isAltEnter) {
        // Alt+Enter: alterna maximizado/restaurado para manter a barra de rolagem
        if (loginWindow.isMaximized()) {
          loginWindow.unmaximize();
        } else {
          loginWindow.maximize();
        }
      }
    }
  });

  // Mostrar janela quando estiver pronta
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
    loginWindow.maximize(); // Maximizar a janela de login
  });

  // Quando a janela de login for fechada
  loginWindow.on('closed', () => {
    loginWindow = null;
    // Se a janela principal não estiver aberta, fechar o app
    if (!mainWindow) {
      app.quit();
    }
  });
}

async function createMainWindow() {
  // O cliente se conectará automaticamente ao servidor WebSocket na porta 3000
  
  // Criar a janela principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
    titleBarStyle: 'hidden',
    frame: false, // Janela sem moldura (como antes)
    show: false,
    skipTaskbar: false,
    fullscreenable: true // Permitir modo tela cheia
  });

  // Carregar a página principal
  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'views', 'main.html'));

  // Atalhos de teclado: F11 e Alt+Enter para alternar tela cheia
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isF11 = input.type === 'keyDown' && input.key === 'F11';
    const isAltEnter = input.type === 'keyDown' && input.key.toLowerCase() === 'enter' && input.alt;
    if (isF11 || isAltEnter) {
      event.preventDefault();
      if (isF11) {
        // F11: tela cheia real
        const isFullScreen = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFullScreen);
        mainWindow.webContents.send('fullscreen-changed', !isFullScreen);
      } else if (isAltEnter) {
        // Alt+Enter: alterna maximizado/restaurado para manter a barra de rolagem
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
    }
  });

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', async () => {
    // Servidor WebSocket externo deve estar rodando na porta 3000
    global.websocketPort = 3000;
    console.log('[INFO] Configurado para conectar ao servidor WebSocket na porta 3000');
    
    mainWindow.show();
    mainWindow.maximize(); // Maximizar a janela principal
    console.log('[INFO] Janela principal carregada');
  });

  // Quando a janela principal for fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configurar menu personalizado
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Sair',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Eventos do Electron
// Aceleração por hardware configurável por variável de ambiente
// Por padrão, mantém desabilitada como antes. Para habilitar, defina ENABLE_HW_ACCELERATION=true
if (process.env.ENABLE_HW_ACCELERATION === 'true') {
  console.log('[CONFIG] Hardware Acceleration: ENABLED');
} else {
  app.disableHardwareAcceleration();
  console.log('[CONFIG] Hardware Acceleration: DISABLED');
}

// Configurar ícone da aplicação
app.setAppUserModelId('com.uby.agendamentos');

// Configurações de segurança adicionais
app.on('web-contents-created', (event, contents) => {
  // Desabilitar navegação para URLs externas
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Permitir apenas navegação para arquivos locais
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
  
  // Desabilitar novas janelas
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// IPC Handlers para comunicação com o renderer
ipcMain.handle('login', async (event, credentials) => {
  const { username, password, remember } = credentials;
  
  // Validar usuário usando o arquivo JSON
  const user = validateUser(username, password);
  
  if (user && !user.error) {
    // Armazenar o objeto completo do usuário
    store.set('currentUser', user);
    
    // Se "lembrar de mim" estiver marcado, salvar as credenciais
    if (remember) {
      store.set('rememberedCredentials', { username, password });
    } else {
      store.delete('rememberedCredentials');
    }
    
    // Criar janela principal (agora é async)
    await createMainWindow();
    
    // Fechar janela de login após um pequeno delay
    setTimeout(() => {
      if (loginWindow) {
        loginWindow.close();
      }
    }, 500);
    
    return { success: true, user: user.displayName };
  } else if (user && user.error) {
    // Retornar mensagem específica para usuários pausados ou excluídos
    return { success: false, message: user.message };
  }
  
  return { success: false, message: 'Credenciais inválidas' };
});

ipcMain.handle('logout', async () => {
  store.delete('currentUser');
  
  // Criar janela de login
  createLoginWindow();
  
  // Fechar janela principal após um pequeno delay
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.close();
    }
  }, 500);
  
  return { success: true };
});

// Handler para registro de novos usuários
ipcMain.handle('register', async (event, userData) => {
  const { username, displayName, password } = userData;
  
  try {
    // Carregar usuários existentes
    const usersData = loadUsers();
    
    // Verificar se o usuário já existe
    const existingUser = usersData.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (existingUser) {
      // Se o usuário existe mas está excluído, permitir recadastro
      if (existingUser.status === 'excluido') {
        // Atualizar dados do usuário excluído
        existingUser.displayName = displayName;
        existingUser.password = password;
        existingUser.status = 'ativo';
        existingUser.updatedAt = new Date().toISOString();
        existingUser.role = existingUser.role || 'user'; // Manter role anterior ou definir como 'user'
        
        // Salvar no arquivo JSON
        const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
        
        console.log(`[INFO] Usuário recadastrado após exclusão: ${username}`);
        
        return { success: true, message: 'Conta reativada com sucesso' };
      } else {
        return { success: false, message: 'Nome de usuário já existe' };
      }
    }
    
    // Criar novo usuário
    const newUser = {
      id: Date.now().toString(),
      username: username,
      displayName: displayName,
      password: password,
      createdAt: new Date().toISOString(),
      role: 'user'
    };
    
    // Adicionar à lista de usuários
    usersData.users.push(newUser);
    
    // Salvar no arquivo JSON
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    
    console.log(`[INFO] Novo usuário registrado: ${username}`);
    
    return { success: true, message: 'Usuário criado com sucesso' };
  } catch (error) {
    console.error('[ERROR] Erro ao registrar usuário:', error);
    return { success: false, message: 'Erro interno do sistema' };
  }
});

ipcMain.handle('getCurrentUser', async () => {
  return store.get('currentUser', null);
});

ipcMain.handle('getRememberedCredentials', async () => {
  return store.get('rememberedCredentials', null);
});

ipcMain.handle('getSystemUsers', async () => {
  return getSystemUsers();
});

ipcMain.handle('saveAgendamento', async (event, agendamento) => {
  const agendamentos = store.get('agendamentos', []);
  agendamento.id = Date.now().toString();
  agendamento.createdAt = new Date().toISOString();
  agendamentos.push(agendamento);
  store.set('agendamentos', agendamentos);
  return { success: true, agendamento };
});

ipcMain.handle('getAgendamentos', async () => {
  return store.get('agendamentos', []);
});

ipcMain.handle('getAgendamentoById', async (event, id) => {
  const agendamentos = store.get('agendamentos', []);
  const agendamento = agendamentos.find(a => a.id === id);
  return agendamento || null;
});

ipcMain.handle('updateAgendamento', async (event, agendamento) => {
  const agendamentos = store.get('agendamentos', []);
  const index = agendamentos.findIndex(a => a.id === agendamento.id);
  if (index !== -1) {
    agendamentos[index] = { ...agendamentos[index], ...agendamento };
    store.set('agendamentos', agendamentos);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('deleteAgendamento', async (event, id) => {
  const agendamentos = store.get('agendamentos', []);
  const filtered = agendamentos.filter(a => a.id !== id);
  store.set('agendamentos', filtered);
  return { success: true };
});

// Handler para deletar agendamento permanentemente
ipcMain.handle('deletePostItPermanently', async (event, id) => {
  try {
    const agendamentos = store.get('agendamentos', []);
    const filtered = agendamentos.filter(a => a.id !== id);
    store.set('agendamentos', filtered);
    
    console.log(`[INFO] Agendamento ${id} deletado permanentemente`);
    return { success: true, deletedId: id };
  } catch (error) {
    console.error('Erro ao deletar agendamento permanentemente:', error);
    return { success: false, error: error.message };
  }
});

// Handler para transferir agendamento
ipcMain.handle('shareAgendamento', async (event, shareData) => {
  try {
    const { agendamentoId, fromUserId, fromUserName, toUserId, toUserName, message } = shareData;
    
    // Buscar o agendamento
    const agendamentos = store.get('agendamentos', []);
    const agendamentoIndex = agendamentos.findIndex(a => a.id === agendamentoId);
    
    if (agendamentoIndex === -1) {
      return { success: false, error: 'Agendamento não encontrado' };
    }
    
    const agendamento = agendamentos[agendamentoIndex];
    
    // Remover verificação de permissão - qualquer pessoa pode transferir
        // Comentário: Permitindo transferência livre de agendamentos
    
    // Preservar informações do usuário original se ainda não existir
    if (!agendamento.originalCreatedBy) {
      agendamento.originalCreatedBy = agendamento.atendente || fromUserName;
      agendamento.originalCreatedAt = agendamento.createdAt || new Date().toISOString();
    }
    
    // Transferir o agendamento para o novo usuário
    agendamento.userId = toUserId;
    agendamento.atendente = toUserName;
    agendamento.sharedAt = new Date().toISOString();
    agendamento.sharedFrom = fromUserName;
    agendamento.shareMessage = message;
    
    // Atualizar o agendamento
    agendamentos[agendamentoIndex] = agendamento;
    store.set('agendamentos', agendamentos);
    
    // Criar notificação para o usuário destinatário
    const notifications = store.get('notifications', []);
    const notification = {
      id: Date.now().toString(),
      userId: toUserId,
      type: 'agendamento_transferido',
        title: 'Novo Agendamento Transferido',
        message: `${fromUserName} transferiu um agendamento para você: ${agendamento.cliente}`,
      agendamentoId: agendamentoId,
      shareMessage: message,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(notification);
    store.set('notifications', notifications);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao transferir agendamento:', error);
    return { success: false, error: error.message };
  }
});

// Handler para buscar notificações do usuário
ipcMain.handle('getNotifications', async (event, userId) => {
  const notifications = store.get('notifications', []);
  return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// Handler para salvar notificação
ipcMain.handle('saveNotification', async (event, notification) => {
  try {
    const notifications = store.get('notifications', []);
    
    // Verificar se já existe uma notificação com o mesmo ID
    const existingIndex = notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex !== -1) {
      // Atualizar notificação existente
      notifications[existingIndex] = notification;
    } else {
      // Adicionar nova notificação
      notifications.push(notification);
    }
    
    store.set('notifications', notifications);
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
    return { success: false, error: error.message };
  }
});

// Handler para marcar notificação como lida
ipcMain.handle('markNotificationAsRead', async (event, notificationId) => {
  const notifications = store.get('notifications', []);
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    store.set('notifications', notifications);
    return { success: true };
  }
  
  return { success: false };
});

// Handler para remover notificação
ipcMain.handle('removeNotification', async (event, notificationId) => {
  const notifications = store.get('notifications', []);
  const filtered = notifications.filter(n => n.id !== notificationId);
  store.set('notifications', filtered);
  return { success: true };
});

// Handler para limpar todos os agendamentos (lixeira)
ipcMain.handle('clearAllAgendamentos', async () => {
  try {
    const agendamentos = store.get('agendamentos', []);
    const count = agendamentos.length;
    
    // Limpar todos os agendamentos
    store.set('agendamentos', []);
    
    console.log(`[INFO] Lixeira: ${count} agendamentos removidos do electron-store`);
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('❌ Erro ao limpar agendamentos:', error);
    return { success: false, error: error.message };
  }
});

// Handler para limpar todas as notificações (lixeira)
ipcMain.handle('clearAllNotifications', async () => {
  try {
    const notifications = store.get('notifications', []);
    const count = notifications.length;
    
    // Limpar todas as notificações
    store.set('notifications', []);
    
    console.log(`[INFO] Lixeira: ${count} notificacoes removidas do electron-store`);
    return { success: true, deletedCount: count };
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    return { success: false, error: error.message };
  }
});

// Handler para buscar usuários (atualizado para usar users.json)
ipcMain.handle('getUsers', async () => {
  return loadUsers().users || [];
});

// Handler para salvar usuários no arquivo JSON
ipcMain.handle('saveUsers', async (event, users) => {
  try {
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    const usersData = { users: users };
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    console.log('[INFO] Usuários salvos no arquivo users.json');
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Erro ao salvar usuários:', error);
    return { success: false, error: error.message };
  }
});

// Handler para atualizar um usuário específico
ipcMain.handle('updateUser', async (event, userId, userData) => {
  try {
    const usersData = loadUsers();
    const userIndex = usersData.users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // Atualizar dados do usuário
    usersData.users[userIndex] = { ...usersData.users[userIndex], ...userData };
    
    // Salvar no arquivo
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    
    console.log(`[INFO] Usuário ${userId} atualizado com sucesso`);
    return { success: true, user: usersData.users[userIndex] };
  } catch (error) {
    console.error('[ERROR] Erro ao atualizar usuário:', error);
    return { success: false, error: error.message };
  }
});

// Handler para adicionar novo usuário
ipcMain.handle('addUser', async (event, userData) => {
  try {
    const usersData = loadUsers();
    
    // Gerar novo ID
    const newId = usersData.users.length > 0 ? Math.max(...usersData.users.map(u => u.id)) + 1 : 1;
    
    // Criar novo usuário
    const newUser = {
      id: newId,
      ...userData,
      status: userData.status || 'ativo'
    };
    
    // Adicionar à lista
    usersData.users.push(newUser);
    
    // Salvar no arquivo
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    
    console.log(`[INFO] Novo usuário adicionado: ${newUser.username}`);
    return { success: true, user: newUser };
  } catch (error) {
    console.error('[ERROR] Erro ao adicionar usuário:', error);
    return { success: false, error: error.message };
  }
});

// Handler para deletar usuário (marcar como excluído)
ipcMain.handle('deleteUser', async (event, userId) => {
  try {
    const usersData = loadUsers();
    const userIndex = usersData.users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    // Marcar como excluído ao invés de remover
    usersData.users[userIndex].status = 'excluido';
    
    // Salvar no arquivo
    const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
    fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf8');
    
    console.log(`[INFO] Usuário ${userId} marcado como excluído`);
    return { success: true };
  } catch (error) {
    console.error('[ERROR] Erro ao deletar usuário:', error);
    return { success: false, error: error.message };
  }
});

// ===== SISTEMA DE NOTIFICAÇÕES NATIVAS DO WINDOWS =====

// Função para verificar e configurar permissões de notificação
async function checkNotificationPermissions() {
  try {
    // Verificar se as notificações são suportadas
    if (!Notification.isSupported()) {
      console.warn('[NOTIFICATION] Sistema não suporta notificações nativas');
      return false;
    }

    // Verificar versão do Windows para otimizações específicas
    const osVersion = os.release();
    const isWindows11 = parseFloat(osVersion) >= 10.0 && os.version().includes('Windows 11');
    
    if (isWindows11) {
      console.log('[NOTIFICATION] Windows 11 detectado - aplicando otimizacoes especificas');
    }

    console.log('[NOTIFICATION] Permissoes de notificacao verificadas');
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Erro ao verificar permissões:', error);
    return false;
  }
}

// Função para testar notificações
function testNotification() {
  showNativeNotification(
    'UBY - Sistema de Agendamento',
    'Sistema de notificações funcionando corretamente!',
    {
      urgency: 'normal',
      sound: true,
      tag: 'test-notification'
    }
  );
}

// Função para mostrar notificação nativa do Windows
function showNativeNotification(title, body, options = {}) {
  if (!Notification.isSupported()) {
    console.warn('[NOTIFICATION] Notificações não são suportadas neste sistema');
    return false;
  }

  try {
    // Configurações otimizadas para Windows 11
    const notificationConfig = {
      title: title,
      body: body,
      icon: path.join(__dirname, '..', 'assets', 'logo.ico'),
      sound: options.sound !== false, // Por padrão, reproduz som
      urgency: options.urgency || 'normal', // low, normal, critical
      timeoutType: options.timeoutType || 'default', // default, never
      silent: options.silent || false,
      // Configurações específicas para Windows 11
      tag: options.tag || 'uby-notification', // Agrupa notificações similares
      renotify: options.renotify || false, // Permite renotificar
      requireInteraction: options.urgency === 'critical' // Requer interação para notificações críticas
    };

    const notification = new Notification(notificationConfig);

    notification.on('click', () => {
      console.log('[NOTIFICATION] Notificação clicada');
      // Focar na janela principal se estiver minimizada
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
        mainWindow.show();
      }
    });

    notification.on('close', () => {
      console.log('[NOTIFICATION] Notificação fechada');
    });

    notification.on('failed', (error) => {
      console.error('[NOTIFICATION] Falha ao exibir notificação:', error);
    });

    notification.show();
    console.log(`[NOTIFICATION] Notificação nativa exibida: ${title}`);
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] Erro ao exibir notificação nativa:', error);
    return false;
  }
}

// Handler para mostrar notificação nativa via IPC
ipcMain.handle('showNativeNotification', async (event, data) => {
  const { title, body, options } = data;
  const success = showNativeNotification(title, body, options);
  return { success };
});

// Handler para verificar permissões de notificação
ipcMain.handle('checkNotificationPermissions', async () => {
  return await checkNotificationPermissions();
});

// Handler para testar notificações
ipcMain.handle('testNotification', async () => {
  testNotification();
  return true;
});

// Handler para verificar se notificações são suportadas
ipcMain.handle('isNotificationSupported', async () => {
  return { supported: Notification.isSupported() };
});

// Função para notificar agendamentos atrasados
function notifyDelayedAppointment(agendamento) {
  const title = 'Agendamento Atrasado!';
  const body = `${agendamento.cliente} - ${agendamento.cidade}\nHorário: ${agendamento.horario}`;
  
  showNativeNotification(title, body, {
    urgency: 'critical',
    sound: true,
    timeoutType: 'never' // Não desaparece automaticamente
  });
}

// Handler para notificar agendamento atrasado via IPC
ipcMain.handle('notifyDelayedAppointment', async (event, agendamento) => {
  notifyDelayedAppointment(agendamento);
  return { success: true };
});

// ===== SISTEMA DE PREFERÊNCIAS DE USUÁRIO =====

// Handler para carregar preferências do usuário
ipcMain.handle('getUserPreferences', async (event, userId) => {
  try {
    const preferencesKey = `userPreferences_${userId}`;
    const preferences = store.get(preferencesKey, null);
    console.log(`[PREFERENCES] Carregando preferências para usuário ${userId}:`, preferences);
    return preferences;
  } catch (error) {
    console.error('[PREFERENCES] Erro ao carregar preferências:', error);
    return null;
  }
});

// Handler para salvar preferências do usuário
ipcMain.handle('saveUserPreferences', async (event, userId, preferences) => {
  try {
    const preferencesKey = `userPreferences_${userId}`;
    store.set(preferencesKey, preferences);
    console.log(`[PREFERENCES] Preferências salvas para usuário ${userId}:`, preferences);
    return { success: true };
  } catch (error) {
    console.error('[PREFERENCES] Erro ao salvar preferências:', error);
    return { success: false, error: error.message };
  }
});

// Handler para resetar preferências do usuário
ipcMain.handle('resetUserPreferences', async (event, userId) => {
  try {
    const preferencesKey = `userPreferences_${userId}`;
    store.delete(preferencesKey);
    console.log(`[PREFERENCES] Preferências resetadas para usuário ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[PREFERENCES] Erro ao resetar preferências:', error);
    return { success: false, error: error.message };
  }
});

// Handler para exportar preferências do usuário
ipcMain.handle('exportUserPreferences', async (event, userId) => {
  try {
    const preferencesKey = `userPreferences_${userId}`;
    const preferences = store.get(preferencesKey, null);
    
    if (preferences) {
      const exportData = {
        userId: userId,
        preferences: preferences,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      console.log(`[PREFERENCES] Preferências exportadas para usuário ${userId}`);
      return { success: true, data: exportData };
    } else {
      return { success: false, error: 'Nenhuma preferência encontrada' };
    }
  } catch (error) {
    console.error('[PREFERENCES] Erro ao exportar preferências:', error);
    return { success: false, error: error.message };
  }
});

// Handler para importar preferências do usuário
ipcMain.handle('importUserPreferences', async (event, userId, importData) => {
  try {
    if (importData && importData.preferences) {
      const preferencesKey = `userPreferences_${userId}`;
      store.set(preferencesKey, importData.preferences);
      console.log(`[PREFERENCES] Preferências importadas para usuário ${userId}:`, importData.preferences);
      return { success: true };
    } else {
      return { success: false, error: 'Dados de importação inválidos' };
    }
  } catch (error) {
    console.error('[PREFERENCES] Erro ao importar preferências:', error);
    return { success: false, error: error.message };
  }
});

// Controles da janela principal
ipcMain.on('main-window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('main-window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('main-window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Controle de tela cheia
ipcMain.on('main-window-toggle-fullscreen', () => {
  if (mainWindow) {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
    
    // Enviar estado atual para o renderer
    mainWindow.webContents.send('fullscreen-changed', !isFullScreen);
  }
});

// Controles da janela de login
ipcMain.on('login-window-minimize', () => {
  if (loginWindow) {
    loginWindow.minimize();
  }
});

ipcMain.on('login-window-maximize', () => {
  if (loginWindow) {
    if (loginWindow.isMaximized()) {
      loginWindow.unmaximize();
    } else {
      loginWindow.maximize();
    }
  }
});

ipcMain.on('login-window-close', () => {
  if (loginWindow) {
    loginWindow.close();
  }
});

// Controle de tela cheia para janela de login
ipcMain.on('login-window-toggle-fullscreen', () => {
  if (loginWindow) {
    const isFullScreen = loginWindow.isFullScreen();
    loginWindow.setFullScreen(!isFullScreen);
    
    // Enviar estado atual para o renderer
    loginWindow.webContents.send('fullscreen-changed', !isFullScreen);
  }
});

// Handler para reiniciar a aplicação
ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// ===== SISTEMA DE ATUALIZAÇÃO =====

// Configurar autoUpdater
autoUpdater.checkForUpdatesAndNotify = false; // Desabilitar verificação automática
autoUpdater.autoDownload = true; // Baixar automaticamente
autoUpdater.autoInstallOnAppQuit = true; // Instalar automaticamente

// Configuração para desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
// SISTEMA DE ATUALIZAÇÕES ATIVADO - Removida verificação que desabilitava updates
const disableUpdates = process.env.DISABLE_UPDATES === 'true';

// Configurar repositório do GitHub para atualizações
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'L34NDR0-DEV',
  repo: 'UBY--Sistemas-Agendamento-1.0.0'
});

if (disableUpdates) {
    console.log('[INFO] Sistema de atualizacoes desabilitado (variavel de ambiente)');
} else {
    console.log('[INFO] Sistema de atualizacoes ativado');
}

// Configurar logs do autoUpdater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Função para verificar se o GitHub está acessível
async function checkGitHubAccess() {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: '/',
        method: 'GET',
        headers: {
          'User-Agent': 'UBY-Agendamentos/1.0 (Electron Updater)',
          'Accept': 'application/vnd.github+json'
        }
      };
      const req = https.request(options, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  } catch (error) {
    console.log('Erro ao verificar acesso ao GitHub:', error.message);
    return false;
  }
}

// Event listeners do autoUpdater
autoUpdater.on('checking-for-update', () => {
  console.log('[INFO] Verificando atualizacoes...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[INFO] Atualizacao disponivel:', info);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
    // Criar botão de atualização quando houver atualização disponível
    mainWindow.webContents.executeJavaScript(`
      if (window.updateManager && typeof window.updateManager.createUpdateButton === 'function') {
        window.updateManager.createUpdateButton();
      }
    `);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[INFO] Nenhuma atualizacao disponivel');
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('❌ Erro no autoUpdater:', err);
  
  // Lista de erros que devem ser ignorados (são normais em desenvolvimento)
  const ignoredErrors = [
    'No published versions on GitHub',
    'Cannot find latest.yml',
    'latest.yml in the latest release artifacts',
    'HttpError: 404',
    'ENOTFOUND',
    'ECONNREFUSED',
    'Network Error',
    'timeout',
    'ETIMEDOUT',
    'getaddrinfo ENOTFOUND',
    'connect ECONNREFUSED',
    'socket hang up',
    'read ECONNRESET'
  ];
  
  const shouldIgnore = ignoredErrors.some(ignoredError => 
    err.message && err.message.toLowerCase().includes(ignoredError.toLowerCase())
  );
  
  if (!shouldIgnore && mainWindow) {
    console.log('[WARNING] Erro real detectado, enviando para o renderer');
    mainWindow.webContents.send('update-error', {
      message: 'Erro ao verificar atualizações. Tente novamente mais tarde.',
      details: err.message
    });
  } else {
    // Para erros ignorados, enviar mensagem de "sem atualização" em vez de erro
    console.log('[INFO] Erro ignorado (normal para desenvolvimento):', err.message);
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', { 
        message: 'Nenhuma atualização disponível no momento' 
      });
    }
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`📥 Progresso do download: ${Math.round(progressObj.percent)}%`);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[INFO] Atualizacao baixada:', info);
  // Enviar para o renderer
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

// IPC handlers para o sistema de atualização moderno
ipcMain.handle('check-for-updates', async () => {
    console.log('[INFO] Verificacao de atualizacao solicitada pelo renderer');
    
    // Verificar se as atualizações estão desabilitadas (apenas por variável de ambiente)
    if (disableUpdates) {
        console.log('[INFO] Atualizacoes desabilitadas por variavel de ambiente');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { 
                message: 'Sistema de atualizações desabilitado por configuração' 
            });
        }
        return { success: false, reason: 'disabled' };
    }
    
    // Verificar acesso ao GitHub primeiro
    const githubAccessible = await checkGitHubAccess();
    if (!githubAccessible) {
        console.log('[WARNING] GitHub nao acessivel');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { 
                message: 'Nenhuma atualização disponível no momento' 
            });
        }
        return { success: false, reason: 'network' };
    }
    
    try {
        // Verificar se há releases no GitHub com timeout para evitar pendência
        const timeoutPromise = new Promise((resolve) => {
            const t = setTimeout(() => {
                console.log('[INFO] Timeout na verificacao de atualizacoes (padrao)');
                if (mainWindow) {
                    mainWindow.webContents.send('update-not-available', {
                        message: 'Nenhuma atualização disponível no momento (timeout)'
                    });
                }
                resolve({ __timedOut: true });
            }, 15000); // 15s timeout
            // Guardar referência caso precise futuramente (não necessário cancelar aqui)
        });

        const result = await Promise.race([
            autoUpdater.checkForUpdates(),
            timeoutPromise
        ]);

        if (result && result.__timedOut) {
            return { success: false, reason: 'timeout' };
        }

        console.log('[INFO] Verificacao concluida');
        return { success: true, result };
    } catch (err) {
        console.log('[INFO] Erro ao verificar atualizacoes:', err.message);
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available', { 
                message: 'Nenhuma atualização disponível no momento' 
            });
        }
        return { success: false, reason: 'error', error: err.message };
    }
});

// Handler para verificação silenciosa de atualizações
ipcMain.handle('check-for-updates-quiet', async () => {
    console.log('[INFO] Verificacao silenciosa de atualizacao solicitada pelo renderer');
    
    // Verificar se as atualizações estão desabilitadas (apenas por variável de ambiente)
    if (disableUpdates) {
        console.log('[INFO] Atualizacoes desabilitadas por variavel de ambiente, enviando resposta silenciosa');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
        return { success: false, reason: 'disabled' };
    }
    
    // Verificar acesso ao GitHub primeiro
    const githubAccessible = await checkGitHubAccess();
    if (!githubAccessible) {
        console.log('[WARNING] GitHub nao acessivel, enviando resposta silenciosa');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
        return { success: false, reason: 'network' };
    }
    
    // Adicionar timeout para evitar que a verificação fique pendente
    const timeout = setTimeout(() => {
        console.log('[INFO] Timeout na verificacao silenciosa de atualizacoes');
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
    }, 10000); // 10 segundos de timeout
    
    try {
        // Verificar se há releases no GitHub sem mostrar mensagens de erro
        const result = await autoUpdater.checkForUpdates();
        clearTimeout(timeout);
        return { success: true, result };
    } catch (err) {
        clearTimeout(timeout);
        console.log('[INFO] Nenhuma atualizacao disponivel (verificacao silenciosa):', err.message);
        // Enviar resposta silenciosa para o renderer
        if (mainWindow) {
            mainWindow.webContents.send('update-not-available-silent');
        }
        return { success: false, reason: 'error', error: err.message };
    }
});

ipcMain.handle('download-update', async () => {
  console.log('[INFO] Download de atualizacao solicitado pelo renderer');
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    console.log('❌ Erro no download:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('quit-and-install', () => {
  console.log('[INFO] Instalacao e reinicializacao solicitada pelo renderer');
  autoUpdater.quitAndInstall();
  return { success: true };
});

ipcMain.handle('cancel-update', () => {
  console.log('[INFO] Cancelamento de atualizacao solicitado pelo renderer');
  // O electron-updater não tem método para cancelar, mas podemos ignorar
  return { success: true };
});

// Handler para obter versão da aplicação
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});


// Funções de WebSocket removidas - usando servidor externo na porta 3000

// Handler para obter status do WebSocket
ipcMain.handle('getWebSocketStatus', async () => {
  try {
    // Verificar se o servidor na porta 3000 está respondendo
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/info', (res) => {
        resolve({
          isRunning: true,
          port: 3000,
          message: 'Servidor WebSocket encontrado na porta 3000'
        });
      });
      req.on('error', () => {
        resolve({
          isRunning: false,
          port: null,
          message: 'Servidor WebSocket não encontrado na porta 3000'
        });
      });
      req.setTimeout(3000, () => {
        req.destroy();
        resolve({
          isRunning: false,
          port: null,
          message: 'Timeout ao verificar servidor WebSocket'
        });
      });
    });
  } catch (error) {
    return {
      isRunning: false,
      port: null,
      message: 'Erro ao verificar status do WebSocket'
    };
  }
});

// Handler para verificar conexão WebSocket
ipcMain.handle('restartWebSocketServer', async () => {
  try {
    // Apenas verificar se o servidor na porta 3000 está rodando
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/info', (res) => {
        resolve({ success: true });
      });
      req.on('error', () => {
        resolve({ success: false, error: 'Servidor WebSocket não encontrado na porta 3000' });
      });
      req.setTimeout(3000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout ao verificar servidor WebSocket' });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao verificar conexão WebSocket:', error);
    return { success: false, error: error.message };
  }
});

// Handler para verificar conexão com servidor WebSocket externo
ipcMain.handle('startWebSocketServer', async () => {
  try {
    console.log('[INFO] Verificando conexão com servidor WebSocket na porta 3000 via IPC...');
    
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/info', (res) => {
        console.log('[SUCCESS] Servidor WebSocket encontrado na porta 3000');
        global.websocketPort = 3000;
        resolve({ success: true, port: 3000 });
      });
      req.on('error', () => {
        console.log('[INFO] Servidor WebSocket não encontrado na porta 3000');
        resolve({ success: false, error: 'Servidor WebSocket não encontrado na porta 3000. Inicie o servidor primeiro.' });
      });
      req.setTimeout(3000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout ao verificar servidor WebSocket' });
      });
    });
    
  } catch (error) {
    console.error('[ERROR] Erro ao verificar conexão WebSocket via IPC:', error);
    return { success: false, error: error.message };
  }
});

// ===== EVENTOS DO APP =====

// Quando o app estiver pronto
app.whenReady().then(async () => {
  console.log('[INFO] Aplicacao Electron iniciada');
  console.log('[INFO] Configurado para conectar ao servidor WebSocket na porta 3000');
  
  // Definir porta padrão do WebSocket
  global.websocketPort = 3000;
  
  // Verificar permissões de notificação
  await checkNotificationPermissions();
  
  // Criar janela de login
  createLoginWindow();
});

// Quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  // Aplicação compatível apenas com Windows 10 e 11
  app.quit();
});

// Quando o app for ativado (Windows)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoginWindow();
  }
});

// Quando o app for encerrado
app.on('before-quit', () => {
  console.log('[INFO] Aplicação sendo fechada');
});
