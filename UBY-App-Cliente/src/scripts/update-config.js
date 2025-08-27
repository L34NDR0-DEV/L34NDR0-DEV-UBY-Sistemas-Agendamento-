/**
 * Configuração do Sistema de Atualização
 * Configure aqui as opções do sistema de atualização
 */

window.UpdateConfig = {
    // Configuração do repositório GitHub
    repository: {
        owner: 'seu-usuario',        // Substitua pelo seu usuário do GitHub
        repo: 'seu-repositorio',     // Substitua pelo nome do seu repositório
        branch: 'main'               // Branch principal (main ou master)
    },
    
    // Configurações de verificação
    checkInterval: 30 * 60 * 1000,   // Verificar a cada 30 minutos
    autoCheck: true,                  // Verificação automática habilitada
    showNotifications: true,          // Mostrar notificações do sistema
    
    // Configurações de interface
    ui: {
        showQuickButton: true,        // Mostrar botão de acesso rápido
        autoShowModal: false,         // Mostrar modal automaticamente quando houver atualização
        theme: 'auto'                 // 'light', 'dark' ou 'auto'
    },
    
    // Configurações de desenvolvimento
    development: {
        enabled: false,               // Modo de desenvolvimento
        mockUpdates: false,           // Simular atualizações para teste
        logLevel: 'info'              // 'debug', 'info', 'warn', 'error'
    }
};

// Função para configurar o repositório
window.UpdateConfig.setRepository = function(owner, repo, branch = 'main') {
    this.repository.owner = owner;
    this.repository.repo = repo;
    this.repository.branch = branch;
    
    // Atualizar sistema de atualização se já estiver carregado
    if (window.updateSystem) {
        window.updateSystem.setRepository(`${owner}/${repo}`);
    }
    
    console.log('[UPDATE-CONFIG] Repositório configurado:', `${owner}/${repo}`);
};

// Função para habilitar modo de desenvolvimento
window.UpdateConfig.enableDevelopment = function(mockUpdates = false) {
    this.development.enabled = true;
    this.development.mockUpdates = mockUpdates;
    this.development.logLevel = 'debug';
    
    console.log('[UPDATE-CONFIG] Modo de desenvolvimento habilitado');
};

// Aplicar configurações quando o sistema estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    if (window.updateSystem && window.UpdateConfig.repository.owner !== 'seu-usuario') {
        const { owner, repo } = window.UpdateConfig.repository;
        window.updateSystem.setRepository(`${owner}/${repo}`);
    }
});

console.log('[UPDATE-CONFIG] Configurações carregadas');

/* 
=== INSTRUÇÕES DE USO ===

1. CONFIGURAÇÃO BÁSICA:
   - Edite as propriedades 'owner' e 'repo' no objeto repository
   - Exemplo: owner: 'meuusuario', repo: 'meu-projeto'

2. CONFIGURAÇÃO VIA CÓDIGO:
   UpdateConfig.setRepository('meuusuario', 'meu-projeto');

3. MODO DE DESENVOLVIMENTO:
   UpdateConfig.enableDevelopment(true); // Com simulação de atualizações

4. PERSONALIZAÇÃO:
   - Ajuste checkInterval para mudar frequência de verificação
   - Configure ui.showQuickButton para mostrar/ocultar botão flutuante
   - Use development.mockUpdates para testar sem GitHub real

5. INTEGRAÇÃO:
   - O sistema verifica automaticamente por atualizações
   - Clique no botão flutuante para abrir o modal
   - Notificações aparecem quando há atualizações disponíveis

6. GITHUB RELEASES:
   - Crie releases no GitHub com tags de versão (ex: v1.0.1)
   - O sistema compara com a versão atual do package.json
   - Atualizações são baixadas automaticamente

*/