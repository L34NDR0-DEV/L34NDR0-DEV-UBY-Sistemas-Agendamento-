// Sistema de Gerenciamento de Usuários
class UserManagement {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.wsClient = null;
        this.init();
    }

    async init() {
        await this.loadUsers();
        this.setupEventListeners();
        this.checkUserPermissions();
        this.initWebSocket();
    }
    
    initWebSocket() {
        // Conectar ao cliente WebSocket global se disponível
        if (window.wsClient && window.wsClient.isConnected) {
            this.wsClient = window.wsClient;
            console.log('UserManagement conectado ao WebSocket');
        } else {
            console.warn('WebSocket não disponível para UserManagement');
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('../data/users.json');
            const data = await response.json();
            this.users = data.users || []; // Acessar a propriedade 'users' do objeto JSON
            console.log('Usuários carregados:', this.users);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.users = [];
        }
    }

    checkUserPermissions() {
        // Verificar se o usuário atual é Nathan ou tem role "Suporte"
        const userNameElement = document.getElementById('userNameText');
        const userName = userNameElement?.textContent;
        console.log('Verificando usuário:', userName);
        
        // Encontrar o usuário atual na lista de usuários
        const currentUser = this.users.find(u => u.displayName === userName || u.username === userName);
        
        // Verificar se é Nathan ou tem role "Suporte"
        if (userName === 'Nathan' || (currentUser && currentUser.role === 'Suporte')) {
            const userManagementBtn = document.getElementById('userManagementBtn');
            if (userManagementBtn) {
                userManagementBtn.style.display = 'flex';
                console.log('Botão de gerenciamento exibido para:', userName, '- Role:', currentUser?.role || 'Nathan');
            }
        }
    }

    setupEventListeners() {
        // Botão de abrir modal de gerenciamento
        const userManagementBtn = document.getElementById('userManagementBtn');
        if (userManagementBtn) {
            userManagementBtn.addEventListener('click', () => {
                console.log('Botão de gerenciamento clicado');
                this.openUserManagementModal();
            });
            console.log('Event listener adicionado ao botão de gerenciamento');
        } else {
            console.error('Botão userManagementBtn não encontrado');
        }

        // Fechar modais
        const closeUserManagementModal = document.getElementById('closeUserManagementModal');
        if (closeUserManagementModal) {
            closeUserManagementModal.addEventListener('click', () => this.closeModal('userManagementModal'));
        }

        const closeUserFormModal = document.getElementById('closeUserFormModal');
        if (closeUserFormModal) {
            closeUserFormModal.addEventListener('click', () => this.closeModal('userFormModal'));
        }

        // Botão de adicionar usuário
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openUserForm());
        }

        // Cancelar formulário
        const cancelUserForm = document.getElementById('cancelUserForm');
        if (cancelUserForm) {
            cancelUserForm.addEventListener('click', () => this.closeModal('userFormModal'));
        }

        // Submeter formulário
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserFormSubmit(e));
        }

        // Fechar modal clicando fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    openUserManagementModal() {
        console.log('Abrindo modal de gerenciamento de usuários');
        this.renderUsersTable();
        const modal = document.getElementById('userManagementModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            console.log('Modal exibido com sucesso');
        } else {
            console.error('Modal userManagementModal não encontrado');
        }
    }

    openUserForm(user = null) {
        console.log('Abrindo formulário de usuário:', user);
        const modal = document.getElementById('userFormModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userFormTitle');
        
        if (!modal) {
            console.error('Modal userFormModal não encontrado');
            return;
        }
        
        if (user) {
            // Editando usuário existente
            title.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Editar Usuário
            `;
            
            // Usar querySelector para evitar conflitos de ID
            const userIdField = modal.querySelector('#userId');
            const usernameField = modal.querySelector('#username');
            const displayNameField = modal.querySelector('#displayName');
            const passwordField = modal.querySelector('#password');
            const roleField = modal.querySelector('#role');
            const statusField = modal.querySelector('#status');
            
            if (userIdField) userIdField.value = user.id;
            if (usernameField) usernameField.value = user.username;
            if (displayNameField) displayNameField.value = user.displayName;
            if (passwordField) passwordField.value = user.password;
            if (roleField) roleField.value = user.role;
            if (statusField) statusField.value = user.status || 'ativo';
        } else {
            // Adicionando novo usuário
            title.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Adicionar Usuário
            `;
            form.reset();
            const statusField = modal.querySelector('#status');
            if (statusField) statusField.value = 'ativo';
        }
        
        modal.style.display = 'flex';
        modal.classList.add('show');
        console.log('Modal de formulário aberto');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 150); // Aguardar a transição CSS
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Filtrar usuários excluídos da exibição
        const activeUsers = this.users.filter(user => user.status !== 'excluido');
        
        activeUsers.forEach(user => {
            const row = document.createElement('tr');
            const status = user.status || 'ativo';
            
            // Criar células da tabela
            const idCell = document.createElement('td');
            idCell.textContent = user.id;
            
            const usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;
            
            const roleCell = document.createElement('td');
            roleCell.textContent = user.role;
            
            const statusCell = document.createElement('td');
            let statusText = 'Ativo';
            if (status === 'pausado') statusText = 'Pausado';
            else if (status === 'excluido') statusText = 'Excluído';
            statusCell.innerHTML = `<span class="user-status ${status}">${statusText}</span>`;
            
            const actionsCell = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'user-actions';
            
            // Botão Editar
            const editBtn = document.createElement('button');
            editBtn.className = 'user-action-btn edit';
            editBtn.title = 'Editar';
            editBtn.onclick = () => this.editUser(user.id);
            editBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
            
            // Botão Pausar/Ativar
            const toggleBtn = document.createElement('button');
            if (status === 'ativo') {
                toggleBtn.className = 'user-action-btn pause';
                toggleBtn.title = 'Pausar';
                toggleBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
            } else {
                toggleBtn.className = 'user-action-btn activate';
                toggleBtn.title = 'Ativar';
                toggleBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"></polygon></svg>';
            }
            toggleBtn.onclick = () => this.toggleUserStatus(user.id);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(toggleBtn);
            
            // Botão Excluir (apenas se não for Nathan)
            if (user.username !== 'Nathan') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'user-action-btn delete';
                deleteBtn.title = 'Excluir';
                deleteBtn.onclick = () => this.deleteUser(user.id);
                deleteBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
                actionsDiv.appendChild(deleteBtn);
            }
            
            actionsCell.appendChild(actionsDiv);
            
            // Adicionar células à linha
            row.appendChild(idCell);
            row.appendChild(usernameCell);
            row.appendChild(roleCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    }

    editUser(userId) {
        console.log('Editando usuário:', userId);
        const user = this.users.find(u => u.id === userId);
        if (user) {
            console.log('Usuário encontrado:', user);
            this.openUserForm(user);
        } else {
            console.error('Usuário não encontrado:', userId);
        }
    }

    async toggleUserStatus(userId) {
        console.log('Alternando status do usuário:', userId);
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            console.error('Usuário não encontrado para toggle:', userId);
            return;
        }

        const currentStatus = user.status || 'ativo';
        const newStatus = currentStatus === 'ativo' ? 'pausado' : 'ativo';
        const actionText = newStatus === 'ativo' ? 'ativar' : 'pausar';

        console.log('Status atual:', currentStatus, 'Novo status:', newStatus);

        const result = await Swal.fire({
            title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} usuário?`,
            text: `Deseja ${actionText} o usuário ${user.displayName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                 // Atualizar status através do IPC
                 const updateResult = await window.ipcRenderer.invoke('updateUser', userId, { status: newStatus });
                
                if (updateResult.success) {
                    // Atualizar lista local
                    const userIndex = this.users.findIndex(u => u.id === userId);
                    if (userIndex !== -1) {
                        this.users[userIndex].status = newStatus;
                    }
                    
                    this.renderUsersTable();
                    
                    // Enviar evento WebSocket
                    this.sendUserUpdateEvent(updateResult.user, newStatus === 'ativo' ? 'activated' : 'paused');
                    
                    Swal.fire({
                        title: 'Sucesso!',
                        text: `Usuário ${newStatus === 'ativo' ? 'ativado' : 'pausado'} com sucesso.`,
                        icon: 'success',
                        timer: 2000
                    });
                } else {
                    throw new Error(updateResult.error || 'Erro desconhecido ao atualizar status');
                }
            } catch (error) {
                console.error('Erro ao alterar status do usuário:', error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao alterar status: ' + error.message,
                    icon: 'error'
                });
            }
        }
    }

    async deleteUser(userId) {
        console.log('Excluindo usuário:', userId);
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            console.error('Usuário não encontrado para exclusão:', userId);
            return;
        }

        console.log('Usuário encontrado para exclusão:', user);

        const result = await Swal.fire({
            title: 'Excluir usuário?',
            text: `Deseja excluir o usuário ${user.displayName}? Esta ação não pode ser desfeita.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545'
        });

        if (result.isConfirmed) {
            try {
                // Excluir usuário através do IPC
                const deleteResult = await window.ipcRenderer.invoke('deleteUser', userId);
                
                if (deleteResult.success) {
                    // Enviar evento WebSocket antes de atualizar lista local
                    this.sendUserDeleteEvent(user);
                    
                    // Atualizar lista local - marcar como excluído
                    const userIndex = this.users.findIndex(u => u.id === userId);
                    if (userIndex !== -1) {
                        this.users[userIndex].status = 'excluido';
                    }
                    
                    this.renderUsersTable();
                    
                    Swal.fire({
                        title: 'Excluído!',
                        text: 'Usuário excluído com sucesso.',
                        icon: 'success',
                        timer: 2000
                    });
                } else {
                    throw new Error(deleteResult.error || 'Erro desconhecido ao excluir usuário');
                }
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao excluir usuário: ' + error.message,
                    icon: 'error'
                });
            }
        }
    }

    async handleUserFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            id: formData.get('userId') ? parseInt(formData.get('userId')) : this.getNextUserId(),
            username: formData.get('username'),
            displayName: formData.get('displayName'),
            password: formData.get('password'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        const isEditing = formData.get('userId');
        
        try {
            let result;
            
            if (isEditing) {
                 // Editando usuário existente através do IPC
                 result = await window.ipcRenderer.invoke('updateUser', userData.id, userData);
                
                if (result.success) {
                    // Atualizar lista local
                    const userIndex = this.users.findIndex(u => u.id === userData.id);
                    if (userIndex !== -1) {
                        this.users[userIndex] = result.user;
                    }
                    
                    // Enviar evento WebSocket
                    this.sendUserUpdateEvent(result.user, 'updated');
                } else {
                    throw new Error(result.error || 'Erro desconhecido ao atualizar usuário');
                }
            } else {
                // Adicionando novo usuário através do IPC
                const newUserData = {
                    username: userData.username,
                    displayName: userData.displayName,
                    password: userData.password,
                    role: userData.role,
                    status: userData.status || 'ativo'
                };
                
                result = await window.ipcRenderer.invoke('addUser', newUserData);
                
                if (result.success) {
                    // Atualizar lista local
                    this.users.push(result.user);
                    
                    // Enviar evento WebSocket
                    this.sendUserCreateEvent(result.user);
                } else {
                    throw new Error(result.error || 'Erro desconhecido ao adicionar usuário');
                }
            }

            this.closeModal('userFormModal');
            this.renderUsersTable();
            
            Swal.fire({
                title: 'Sucesso!',
                text: `Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
                icon: 'success',
                timer: 2000
            });
            
        } catch (error) {
            console.error('Erro ao processar usuário:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao processar usuário: ' + error.message,
                icon: 'error'
            });
        }
    }

    getNextUserId() {
        return this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    }

    async saveUsers() {
        try {
            console.log('Salvando usuários no arquivo JSON:', this.users);
            
            // Salvar no arquivo users.json através do IPC
            const result = await window.ipcRenderer.invoke('saveUsers', this.users);
            
            if (result.success) {
                console.log('Usuários salvos com sucesso no arquivo JSON');
                
                // Salvar no localStorage como backup
                const usersData = { users: this.users };
                localStorage.setItem('usersBackup', JSON.stringify(usersData));
                
                return true;
            } else {
                throw new Error(result.error || 'Erro desconhecido ao salvar usuários');
            }
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao salvar alterações: ' + error.message,
                icon: 'error'
            });
            return false;
        }
    }
    
    // ===== MÉTODOS WEBSOCKET =====
    
    sendUserUpdateEvent(user, action) {
        if (!this.wsClient || !this.wsClient.isConnected) {
            console.warn('WebSocket não conectado - evento de atualização não enviado');
            return;
        }
        
        try {
            this.wsClient.socket.emit('user:update', {
                action: action,
                user: user,
                timestamp: new Date().toISOString()
            });
            console.log(`Evento WebSocket enviado: user:update (${action})`, user.displayName);
        } catch (error) {
            console.error('Erro ao enviar evento WebSocket user:update:', error);
        }
    }
    
    sendUserDeleteEvent(user) {
        if (!this.wsClient || !this.wsClient.isConnected) {
            console.warn('WebSocket não conectado - evento de exclusão não enviado');
            return;
        }
        
        try {
            this.wsClient.socket.emit('user:delete', {
                user: user,
                timestamp: new Date().toISOString()
            });
            console.log('Evento WebSocket enviado: user:delete', user.displayName);
        } catch (error) {
            console.error('Erro ao enviar evento WebSocket user:delete:', error);
        }
    }
    
    sendUserCreateEvent(user) {
        if (!this.wsClient || !this.wsClient.isConnected) {
            console.warn('WebSocket não conectado - evento de criação não enviado');
            return;
        }
        
        try {
            this.wsClient.socket.emit('user:create', {
                user: user,
                timestamp: new Date().toISOString()
            });
            console.log('Evento WebSocket enviado: user:create', user.displayName);
        } catch (error) {
            console.error('Erro ao enviar evento WebSocket user:create:', error);
        }
    }
    
    /**
     * Manipular atualização de usuário recebida via WebSocket
     */
    handleUserUpdate(data) {
        try {
            console.log('[USER] Recebida atualização de usuário:', data);
            
            // Recarregar lista de usuários para refletir mudanças
            this.loadUsers();
            
            // Atualizar tabela se estiver visível
             if (this.userTableBody) {
                 this.renderUserTable();
             }
        } catch (error) {
            console.error('[ERROR] Erro ao processar atualização de usuário:', error);
        }
    }
    
    /**
     * Manipular exclusão de usuário recebida via WebSocket
     */
    handleUserDelete(data) {
        try {
            console.log('[USER] Recebida exclusão de usuário:', data);
            
            // Recarregar lista de usuários para refletir mudanças
            this.loadUsers();
            
            // Atualizar tabela se estiver visível
             if (this.userTableBody) {
                 this.renderUserTable();
             }
        } catch (error) {
            console.error('[ERROR] Erro ao processar exclusão de usuário:', error);
        }
    }
    
    /**
     * Manipular criação de usuário recebida via WebSocket
     */
    handleUserCreate(data) {
        try {
            console.log('[USER] Recebida criação de usuário:', data);
            
            // Recarregar lista de usuários para refletir mudanças
            this.loadUsers();
            
            // Atualizar tabela se estiver visível
             if (this.userTableBody) {
                 this.renderUserTable();
             }
        } catch (error) {
            console.error('[ERROR] Erro ao processar criação de usuário:', error);
        }
    }
}

// Inicializar o sistema de gerenciamento de usuários
let userManagement;
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        userManagement = new UserManagement();
        window.userManagement = userManagement; // Tornar disponível globalmente
        console.log('UserManagement inicializado');
    }, 1000);
});