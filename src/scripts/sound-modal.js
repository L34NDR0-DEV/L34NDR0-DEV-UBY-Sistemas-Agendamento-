// ===== MODAL DE SOM SIMPLIFICADO =====

// Configurações padrão
let soundSettings = {
    enabled: true,
    volume: 70
};

let voiceSettings = {
    enabled: true,
    volume: 80
};

// Classe simplificada para o modal de som
class SoundModal {
    constructor() {
        this.modal = document.getElementById('soundModal');
        this.init();
    }

    init() {
        if (!this.modal) {
            console.error('Modal de som não encontrado');
            return;
        }

        this.bindEvents();
        this.loadSettings();
        this.updateUI();
    }

    bindEvents() {
        // Botão fechar
        const closeBtn = document.getElementById('closeSoundModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Clique fora do modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Toggle de som
        const soundEnabled = document.getElementById('soundEnabled');
        if (soundEnabled) {
            soundEnabled.addEventListener('change', async (e) => {
                soundSettings.enabled = e.target.checked;
                this.applySoundSettings();
                
                // Salvar imediatamente nas preferências
                if (window.userPreferencesManager) {
                    window.userPreferencesManager.preferences.soundEnabled = soundSettings.enabled;
                    await window.userPreferencesManager.saveUserPreferences();
                }
            });
        }

        // Volume do som
        const soundVolumeSlider = document.getElementById('soundVolumeSlider');
        const soundVolumeValue = document.getElementById('soundVolumeValue');
        if (soundVolumeSlider && soundVolumeValue) {
            soundVolumeSlider.addEventListener('input', async (e) => {
                const volume = parseInt(e.target.value);
                soundSettings.volume = volume;
                soundVolumeValue.textContent = `${volume}%`;
                this.applySoundSettings();
                
                // Salvar imediatamente nas preferências
                if (window.userPreferencesManager) {
                    window.userPreferencesManager.preferences.soundVolume = volume;
                    await window.userPreferencesManager.saveUserPreferences();
                }
            });
        }

        // Toggle de voz
        const voiceEnabled = document.getElementById('voiceEnabled');
        if (voiceEnabled) {
            voiceEnabled.addEventListener('change', async (e) => {
                voiceSettings.enabled = e.target.checked;
                this.applyVoiceSettings();
                
                // Salvar imediatamente nas preferências
                if (window.userPreferencesManager) {
                    window.userPreferencesManager.preferences.ttsEnabled = voiceSettings.enabled;
                    await window.userPreferencesManager.saveUserPreferences();
                }
            });
        }

        // Volume da voz
        const voiceVolumeSlider = document.getElementById('voiceVolumeSlider');
        const voiceVolumeValue = document.getElementById('voiceVolumeValue');
        if (voiceVolumeSlider && voiceVolumeValue) {
            voiceVolumeSlider.addEventListener('input', async (e) => {
                const volume = parseInt(e.target.value);
                voiceSettings.volume = volume;
                voiceVolumeValue.textContent = `${volume}%`;
                this.applyVoiceSettings();
                
                // Salvar imediatamente nas preferências
                if (window.userPreferencesManager) {
                    window.userPreferencesManager.preferences.ttsVolume = volume;
                    await window.userPreferencesManager.saveUserPreferences();
                }
            });
        }

        // Toggle para falar nome do atendente
        const speakAttendantName = document.getElementById('speakAttendantName');
        if (speakAttendantName) {
            speakAttendantName.addEventListener('change', (e) => {
                if (window.userPreferencesManager) {
                    window.userPreferencesManager.preferences.speakAttendantName = e.target.checked;
                    window.userPreferencesManager.saveUserPreferences();
                }
            });
        }

        // Botão salvar
        const saveBtn = document.getElementById('saveSoundSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                await this.saveSettings();
                this.close();
            });
        }
    }

    open() {
        this.modal.classList.add('show');
    }

    close() {
        this.modal.classList.remove('show');
    }

    loadSettings() {
        // Carregar das preferências do usuário se disponível
        if (window.userPreferencesManager && window.userPreferencesManager.preferences) {
            const prefs = window.userPreferencesManager.preferences;
            
            // Carregar configurações de som
            soundSettings.enabled = prefs.soundEnabled !== undefined ? prefs.soundEnabled : soundSettings.enabled;
            soundSettings.volume = prefs.soundVolume !== undefined ? prefs.soundVolume : soundSettings.volume;
            
            // Carregar configurações de voz
            voiceSettings.enabled = prefs.ttsEnabled !== undefined ? prefs.ttsEnabled : voiceSettings.enabled;
            voiceSettings.volume = prefs.ttsVolume !== undefined ? prefs.ttsVolume : voiceSettings.volume;
            
            console.log('[SoundModal] Configurações carregadas das preferências do usuário');
        } else {
            // Fallback para localStorage se preferências não estiverem disponíveis
            const savedSoundSettings = localStorage.getItem('soundSettings');
            if (savedSoundSettings) {
                soundSettings = { ...soundSettings, ...JSON.parse(savedSoundSettings) };
            }

            const savedVoiceSettings = localStorage.getItem('voiceSettings');
            if (savedVoiceSettings) {
                voiceSettings = { ...voiceSettings, ...JSON.parse(savedVoiceSettings) };
            }
            
            console.log('[SoundModal] Configurações carregadas do localStorage (fallback)');
        }
    }

    async saveSettings() {
        // Salvar nas preferências do usuário se disponível
        if (window.userPreferencesManager && window.userPreferencesManager.preferences) {
            // Atualizar preferências
            window.userPreferencesManager.preferences.soundEnabled = soundSettings.enabled;
            window.userPreferencesManager.preferences.soundVolume = soundSettings.volume;
            window.userPreferencesManager.preferences.ttsEnabled = voiceSettings.enabled;
            window.userPreferencesManager.preferences.ttsVolume = voiceSettings.volume;
            
            // Salvar preferências
            await window.userPreferencesManager.saveUserPreferences();
            
            console.log('[SoundModal] Configurações salvas nas preferências do usuário');
        } else {
            // Fallback para localStorage
            localStorage.setItem('soundSettings', JSON.stringify(soundSettings));
            localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
            
            console.log('[SoundModal] Configurações salvas no localStorage (fallback)');
        }
        
        this.applySoundSettings();
        this.applyVoiceSettings();
    }

    updateUI() {
        // Atualizar controles de som
        const soundEnabled = document.getElementById('soundEnabled');
        if (soundEnabled) {
            soundEnabled.checked = soundSettings.enabled;
        }

        const soundVolumeSlider = document.getElementById('soundVolumeSlider');
        const soundVolumeValue = document.getElementById('soundVolumeValue');
        if (soundVolumeSlider && soundVolumeValue) {
            soundVolumeSlider.value = soundSettings.volume;
            soundVolumeValue.textContent = `${soundSettings.volume}%`;
        }

        // Atualizar controles de voz
        const voiceEnabled = document.getElementById('voiceEnabled');
        if (voiceEnabled) {
            voiceEnabled.checked = voiceSettings.enabled;
        }

        const voiceVolumeSlider = document.getElementById('voiceVolumeSlider');
        const voiceVolumeValue = document.getElementById('voiceVolumeValue');
        if (voiceVolumeSlider && voiceVolumeValue) {
            voiceVolumeSlider.value = voiceSettings.volume;
            voiceVolumeValue.textContent = `${voiceSettings.volume}%`;
        }

        // Atualizar controle de falar nome do atendente
        const speakAttendantName = document.getElementById('speakAttendantName');
        if (speakAttendantName && window.userPreferencesManager) {
            speakAttendantName.checked = window.userPreferencesManager.preferences.speakAttendantName;
        }
    }

    applySoundSettings() {
        if (window.soundManager) {
            window.soundManager.setEnabled(soundSettings.enabled);
            window.soundManager.setVolume(soundSettings.volume / 100);
        }
    }

    applyVoiceSettings() {
        if (window.voiceManager) {
            window.voiceManager.setEnabled(voiceSettings.enabled);
            window.voiceManager.setVolume(voiceSettings.volume / 100);
        }
    }
}

// Instância global
let soundModalInstance = null;

// Função para abrir o modal
function openSoundModal() {
    if (!soundModalInstance) {
        soundModalInstance = new SoundModal();
    }
    soundModalInstance.open();
}

// Função para fechar o modal
function closeSoundModal() {
    if (soundModalInstance) {
        soundModalInstance.close();
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Configurar botão de som
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', openSoundModal);
        }

        // Inicializar modal
        soundModalInstance = new SoundModal();
    }, 500);
});

// Exportar para uso global
window.openSoundModal = openSoundModal;
window.closeSoundModal = closeSoundModal;
window.SoundModal = SoundModal;