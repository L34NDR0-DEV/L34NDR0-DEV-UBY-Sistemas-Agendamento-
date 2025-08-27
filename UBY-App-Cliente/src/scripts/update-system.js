/**
 * Sistema de Atualização Moderno
 * Verifica versão atual vs GitHub e realiza atualizações automáticas
 */

class ModernUpdateSystem {
    constructor() {
        this.currentVersion = this.getCurrentVersion();
        this.githubRepo = 'seu-usuario/seu-repositorio'; // Configurar com seu repositório
        this.updateCheckInterval = 30 * 60 * 1000; // 30 minutos
        this.isChecking = false;
        this.isUpdating = false;
        this.updateAvailable = false;
        this.latestVersion = null;
        
        this.initializeUI();
        this.startPeriodicCheck();
        
        console.log('[UPDATE-SYSTEM] Sistema de atualização inicializado');
        console.log('[UPDATE-SYSTEM] Versão atual:', this.currentVersion);
    }
    
    // Obter versão atual do package.json
    getCurrentVersion() {
        try {
            // Tentar obter do package.json se disponível
            if (window.require) {
                const path = window.require('path');
                const fs = window.require('fs');
                const packagePath = path.join(__dirname, '../../package.json');
                
                if (fs.existsSync(packagePath)) {
                    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    return packageData.version || '1.0.0';
                }
            }
            
            // Fallback para versão padrão
            return '1.0.6';
        } catch (error) {
            console.warn('[UPDATE-SYSTEM] Erro ao obter versão atual:', error);
            return '1.0.0';
        }
    }
    
    // Verificar nova versão no GitHub
    async checkForUpdates() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        this.updateUI('checking');
        
        try {
            console.log('[UPDATE-SYSTEM] Verificando atualizações...');
            
            const response = await fetch(`https://api.github.com/repos/${this.githubRepo}/releases/latest`);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const releaseData = await response.json();
            this.latestVersion = releaseData.tag_name.replace('v', '');
            
            console.log('[UPDATE-SYSTEM] Versão mais recente:', this.latestVersion);
            
            if (this.isNewerVersion(this.latestVersion, this.currentVersion)) {
                this.updateAvailable = true;
                this.updateUI('available', {
                    currentVersion: this.currentVersion,
                    latestVersion: this.latestVersion,
                    releaseNotes: releaseData.body || 'Melhorias e correções'
                });
                
                console.log('[UPDATE-SYSTEM] Nova versão disponível!');
                this.showUpdateNotification();
            } else {
                this.updateAvailable = false;
                this.updateUI('uptodate');
                console.log('[UPDATE-SYSTEM] Aplicação está atualizada');
            }
            
        } catch (error) {
            console.error('[UPDATE-SYSTEM] Erro ao verificar atualizações:', error);
            this.updateUI('error', { error: error.message });
        } finally {
            this.isChecking = false;
        }
    }
    
    // Comparar versões (semver básico)
    isNewerVersion(latest, current) {
        const parseVersion = (v) => v.split('.').map(n => parseInt(n) || 0);
        const latestParts = parseVersion(latest);
        const currentParts = parseVersion(current);
        
        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        
        return false;
    }
    
    // Realizar atualização
    async performUpdate() {
        if (this.isUpdating || !this.updateAvailable) return;
        
        this.isUpdating = true;
        this.updateUI('downloading');
        
        try {
            console.log('[UPDATE-SYSTEM] Iniciando atualização...');
            
            // Simular download (implementar lógica real conforme necessário)
            await this.simulateDownload();
            
            this.updateUI('installing');
            
            // Simular instalação
            await this.simulateInstallation();
            
            this.updateUI('completed');
            
            console.log('[UPDATE-SYSTEM] Atualização concluída!');
            
            // Solicitar reinicialização
            setTimeout(() => {
                this.requestRestart();
            }, 2000);
            
        } catch (error) {
            console.error('[UPDATE-SYSTEM] Erro durante atualização:', error);
            this.updateUI('error', { error: error.message });
        } finally {
            this.isUpdating = false;
        }
    }
    
    // Simular processo de download
    async simulateDownload() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 200);
        });
    }
    
    // Simular processo de instalação
    async simulateInstallation() {
        return new Promise((resolve) => {
            setTimeout(resolve, 3000);
        });
    }
    
    // Solicitar reinicialização da aplicação
    requestRestart() {
        if (confirm('Atualização concluída! Deseja reiniciar a aplicação agora?')) {
            if (window.require) {
                const { remote } = window.require('electron');
                remote.app.relaunch();
                remote.app.exit();
            } else {
                window.location.reload();
            }
        }
    }
    
    // Inicializar interface do usuário
    initializeUI() {
        // Criar container do sistema de atualização
        const updateContainer = document.createElement('div');
        updateContainer.id = 'update-system-container';
        updateContainer.className = 'update-system-hidden';
        
        updateContainer.innerHTML = `
            <div class="update-modal">
                <div class="update-header">
                    <div class="update-icon">${window.UpdateIcons.update}</div>
                    <h3 class="update-title">Sistema de Atualização</h3>
                    <button class="update-close" onclick="updateSystem.hideUpdateModal()">
                        ${window.UpdateIcons.error}
                    </button>
                </div>
                
                <div class="update-content">
                    <div class="update-status" id="update-status">
                        <div class="status-icon" id="status-icon">${window.UpdateIcons.info}</div>
                        <div class="status-text" id="status-text">Verificando atualizações...</div>
                    </div>
                    
                    <div class="update-details" id="update-details" style="display: none;">
                        <div class="version-info">
                            <div class="current-version">
                                <span>Versão Atual:</span>
                                <strong id="current-version-text">${this.currentVersion}</strong>
                            </div>
                            <div class="latest-version">
                                <span>Nova Versão:</span>
                                <strong id="latest-version-text">-</strong>
                            </div>
                        </div>
                        
                        <div class="release-notes" id="release-notes">
                            <h4>Novidades:</h4>
                            <div id="release-notes-content">Carregando...</div>
                        </div>
                    </div>
                    
                    <div class="update-progress" id="update-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>
                </div>
                
                <div class="update-actions">
                    <button class="btn-secondary" id="check-updates-btn" onclick="updateSystem.checkForUpdates()">
                        ${window.UpdateIcons.github} Verificar Atualizações
                    </button>
                    <button class="btn-primary" id="install-update-btn" onclick="updateSystem.performUpdate()" style="display: none;">
                        ${window.UpdateIcons.download} Instalar Atualização
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(updateContainer);
        
        // Criar botão de acesso rápido
        this.createQuickAccessButton();
    }
    
    // Criar botão de acesso rápido
    createQuickAccessButton() {
        const quickButton = document.createElement('div');
        quickButton.id = 'update-quick-button';
        quickButton.className = 'update-quick-button';
        quickButton.innerHTML = `
            <div class="quick-button-icon">${window.UpdateIcons.update}</div>
            <div class="quick-button-badge" id="update-badge" style="display: none;">!</div>
        `;
        
        quickButton.onclick = () => this.showUpdateModal();
        document.body.appendChild(quickButton);
    }
    
    // Mostrar modal de atualização
    showUpdateModal() {
        const container = document.getElementById('update-system-container');
        container.className = 'update-system-visible';
    }
    
    // Ocultar modal de atualização
    hideUpdateModal() {
        const container = document.getElementById('update-system-container');
        container.className = 'update-system-hidden';
    }
    
    // Mostrar notificação de atualização
    showUpdateNotification() {
        const badge = document.getElementById('update-badge');
        if (badge) badge.style.display = 'block';
        
        // Notificação do sistema (se disponível)
        if (window.Notification && Notification.permission === 'granted') {
            new Notification('Atualização Disponível', {
                body: `Nova versão ${this.latestVersion} disponível!`,
                icon: 'src/assets/icons/app-icon.png'
            });
        }
    }
    
    // Atualizar interface do usuário
    updateUI(state, data = {}) {
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        const updateDetails = document.getElementById('update-details');
        const updateProgress = document.getElementById('update-progress');
        const checkBtn = document.getElementById('check-updates-btn');
        const installBtn = document.getElementById('install-update-btn');
        
        // Reset visibility
        updateDetails.style.display = 'none';
        updateProgress.style.display = 'none';
        checkBtn.style.display = 'inline-flex';
        installBtn.style.display = 'none';
        
        switch (state) {
            case 'checking':
                statusIcon.innerHTML = window.UpdateIcons.loading;
                statusText.textContent = 'Verificando atualizações...';
                checkBtn.disabled = true;
                break;
                
            case 'available':
                statusIcon.innerHTML = window.UpdateIcons.download;
                statusText.textContent = 'Nova atualização disponível!';
                updateDetails.style.display = 'block';
                document.getElementById('latest-version-text').textContent = data.latestVersion;
                document.getElementById('release-notes-content').textContent = data.releaseNotes;
                checkBtn.style.display = 'none';
                installBtn.style.display = 'inline-flex';
                checkBtn.disabled = false;
                break;
                
            case 'uptodate':
                statusIcon.innerHTML = window.UpdateIcons.check;
                statusText.textContent = 'Aplicação está atualizada!';
                checkBtn.disabled = false;
                break;
                
            case 'downloading':
                statusIcon.innerHTML = window.UpdateIcons.download;
                statusText.textContent = 'Baixando atualização...';
                updateProgress.style.display = 'block';
                installBtn.disabled = true;
                break;
                
            case 'installing':
                statusIcon.innerHTML = window.UpdateIcons.install;
                statusText.textContent = 'Instalando atualização...';
                break;
                
            case 'completed':
                statusIcon.innerHTML = window.UpdateIcons.check;
                statusText.textContent = 'Atualização concluída!';
                updateProgress.style.display = 'none';
                break;
                
            case 'error':
                statusIcon.innerHTML = window.UpdateIcons.error;
                statusText.textContent = `Erro: ${data.error || 'Erro desconhecido'}`;
                checkBtn.disabled = false;
                installBtn.disabled = false;
                break;
        }
    }
    
    // Atualizar progresso
    updateProgress(percentage) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }
    
    // Iniciar verificação periódica
    startPeriodicCheck() {
        // Verificação inicial após 5 segundos
        setTimeout(() => {
            this.checkForUpdates();
        }, 5000);
        
        // Verificação periódica
        setInterval(() => {
            this.checkForUpdates();
        }, this.updateCheckInterval);
    }
    
    // Configurar repositório GitHub
    setRepository(repo) {
        this.githubRepo = repo;
        console.log('[UPDATE-SYSTEM] Repositório configurado:', repo);
    }
}

// Inicializar sistema de atualização quando DOM estiver pronto
let updateSystem;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateSystem = new ModernUpdateSystem();
        window.updateSystem = updateSystem;
    });
} else {
    updateSystem = new ModernUpdateSystem();
    window.updateSystem = updateSystem;
}

console.log('[UPDATE-SYSTEM] Módulo carregado');