// Script de teste para verificar notificações nativas
// Execute este script no console do navegador (F12) quando estiver na página do dashboard

// Função para testar notificação de conexão de usuário
function testUserConnection() {
    console.log('🧪 Testando notificação de conexão de usuário...');
    
    // Simular dados de um usuário conectando
    const testUser = {
        id: 'test-socket-' + Date.now(),
        username: 'Usuário Teste',
        rawUsername: 'teste',
        role: 'Administrador',
        isUBYUser: true,
        connectedAt: new Date().toLocaleString('pt-BR'),
        ip: '127.0.0.1'
    };
    
    // Emitir evento de usuário conectado via socket
    if (window.socket && window.socket.connected) {
        window.socket.emit('authenticate', {
            userId: 'test-user-' + Date.now(),
            userName: 'teste',
            displayName: 'Usuário Teste'
        });
        console.log('✅ Evento de autenticação enviado');
    } else {
        console.error('❌ Socket não está conectado');
    }
}

// Função para testar notificação de desconexão
function testUserDisconnection() {
    console.log('🧪 Testando notificação de desconexão de usuário...');
    
    // Simular desconexão forçada
    if (window.socket && window.socket.connected) {
        window.socket.disconnect();
        console.log('✅ Desconexão simulada');
        
        // Reconectar após 3 segundos
        setTimeout(() => {
            window.socket.connect();
            console.log('🔄 Reconectando...');
        }, 3000);
    } else {
        console.error('❌ Socket não está conectado');
    }
}

// Função para verificar se as notificações nativas estão habilitadas
function checkNotificationPermission() {
    console.log('🔔 Verificando permissões de notificação...');
    
    if ('Notification' in window) {
        console.log('✅ API de Notification disponível');
        console.log('📋 Permissão atual:', Notification.permission);
        
        if (Notification.permission === 'default') {
            console.log('🔔 Solicitando permissão...');
            Notification.requestPermission().then(permission => {
                console.log('📋 Nova permissão:', permission);
            });
        }
    } else {
        console.error('❌ API de Notification não disponível');
    }
}

// Função para testar notificação direta do navegador
function testBrowserNotification() {
    console.log('🧪 Testando notificação direta do navegador...');
    
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Teste de Notificação', {
            body: 'Esta é uma notificação de teste do navegador',
            icon: '/favicon.ico',
            tag: 'test-notification'
        });
        
        notification.onclick = function() {
            console.log('🖱️ Notificação clicada');
            window.focus();
            notification.close();
        };
        
        console.log('✅ Notificação de teste enviada');
    } else {
        console.error('❌ Permissão de notificação não concedida');
    }
}

// Executar testes automaticamente
console.log('🚀 Script de teste de notificações carregado!');
console.log('📋 Comandos disponíveis:');
console.log('  - testUserConnection(): Testa notificação de conexão');
console.log('  - testUserDisconnection(): Testa notificação de desconexão');
console.log('  - checkNotificationPermission(): Verifica permissões');
console.log('  - testBrowserNotification(): Testa notificação direta');

// Verificar permissões automaticamente
checkNotificationPermission();