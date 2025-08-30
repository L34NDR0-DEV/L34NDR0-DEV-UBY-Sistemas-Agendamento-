/**
 * Core Utils - Utilitários Essenciais Consolidados
 * Combina funcionalidades de database, motorista-manager e security-utils
 * Versão otimizada e consolidada para reduzir arquivos
 */
const path = require('path');
const fs = require('fs');

// ===== DATABASE CORE (FILE-BASED) =====

class DatabaseCore {
    constructor() {
        this.appointmentsPath = null;
        this.setupPaths();
    }

    setupPaths() {
        try {
            const electron = typeof require !== 'undefined' ? require('electron') : null;
            const app = electron && (electron.remote ? electron.remote.app : (electron.app || null));
            if (app && app.getPath) {
                const userData = app.getPath('userData');
                const dataDir = path.join(userData, 'data');
                if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
                this.appointmentsPath = path.join(dataDir, 'appointments.json');
            } else {
                this.appointmentsPath = path.join(__dirname, '../../data/appointments.json');
            }
        } catch {
            this.appointmentsPath = path.join(__dirname, '../../data/appointments.json');
        }
        const dir = path.dirname(this.appointmentsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    async initialize() {
        try {
            if (!fs.existsSync(this.appointmentsPath)) {
                fs.writeFileSync(this.appointmentsPath, JSON.stringify({ appointments: [] }, null, 2), 'utf8');
            }
            return true;
        } catch (error) {
            console.error('[ERROR] Erro ao inicializar armazenamento de agendamentos:', error);
            return false;
        }
    }

    readAppointments() {
        try {
            const raw = fs.readFileSync(this.appointmentsPath, 'utf8');
            const data = raw ? JSON.parse(raw) : { appointments: [] };
            if (!data.appointments) data.appointments = [];
            return data.appointments;
        } catch {
            return [];
        }
    }

    writeAppointments(list) {
        try {
            fs.writeFileSync(this.appointmentsPath, JSON.stringify({ appointments: list }, null, 2), 'utf8');
            return true;
        } catch (e) {
            console.error('Erro ao salvar appointments:', e);
            return false;
        }
    }

    async createAppointment(appointment) {
        const list = this.readAppointments();
        list.push(appointment);
        this.writeAppointments(list);
        return { id: appointment.id, changes: 1 };
    }

    async getAppointments(userId) {
        const list = this.readAppointments();
        if (!userId) return list;
        return list.filter(a => a.userId === userId);
    }

    close() {}
}

// ===== MOTORISTA MANAGER =====

class MotoristaManager {
    constructor() {
        this.storageKey = 'motoristas_por_cidade';
        this.filePath = null;
        this.motoristas = {};
        this.storageMode = 'memory';
        this.setupStorage();
        this.motoristas = this.loadMotoristas();
    }

    setupStorage() {
        try {
            // Preferir arquivo no userData do Electron
            const electron = typeof require !== 'undefined' ? require('electron') : null;
            const app = electron && (electron.remote ? electron.remote.app : (electron.app || null));
            if (app && app.getPath) {
                const userData = app.getPath('userData');
                const dataDir = path.join(userData, 'data');
                if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
                this.filePath = path.join(dataDir, 'motoristas.json');
                this.storageMode = 'file';
                return;
            }
        } catch {}

        // Fallback: localStorage
        if (typeof localStorage !== 'undefined') {
            this.storageMode = 'localStorage';
            return;
        }

        // Último recurso: memória
        this.storageMode = 'memory';
    }

    loadMotoristas() {
        try {
            if (this.storageMode === 'file' && this.filePath) {
                if (fs.existsSync(this.filePath)) {
                    const raw = fs.readFileSync(this.filePath, 'utf8');
                    return JSON.parse(raw || '{}');
                }
                return {};
            }
            if (this.storageMode === 'localStorage') {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : {};
            }
            return {};
        } catch (error) {
            console.error('Erro ao carregar motoristas:', error);
            return {};
        }
    }

    saveMotoristas() {
        try {
            if (this.storageMode === 'file' && this.filePath) {
                fs.writeFileSync(this.filePath, JSON.stringify(this.motoristas, null, 2), 'utf8');
                return;
            }
            if (this.storageMode === 'localStorage') {
                localStorage.setItem(this.storageKey, JSON.stringify(this.motoristas));
                return;
            }
        } catch (error) {
            console.error('Erro ao salvar motoristas:', error);
        }
    }

    async adicionarMotorista(cidade, nomeMotorista) {
        if (!cidade || !nomeMotorista) return false;

        cidade = cidade.trim();
        nomeMotorista = nomeMotorista.trim();

        if (!this.motoristas[cidade]) {
            this.motoristas[cidade] = [];
        }

        if (!this.motoristas[cidade].includes(nomeMotorista)) {
            this.motoristas[cidade].push(nomeMotorista);
            this.motoristas[cidade].sort();
            this.saveMotoristas();
            return true;
        }
        return false;
    }

    async getMotoristasPorCidade(cidade) {
        if (!cidade) return [];
        return this.motoristas[cidade] || [];
    }

    buscarMotoristas(cidade, termo) {
        const motoristas = this.motoristas[cidade] || [];
        if (!termo) return motoristas;
        const termoLower = termo.toLowerCase();
        return motoristas.filter(motorista => {
            // Verificar se motorista é uma string válida antes de chamar toLowerCase
            if (typeof motorista !== 'string' || !motorista) {
                return false;
            }
            return motorista.toLowerCase().includes(termoLower);
        });
    }
}

// ===== SECURITY UTILS =====

class SecurityUtils {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
    }

    generateEncryptionKey() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        } else {
            return 'default-key-' + Date.now().toString(36) + Math.random().toString(36);
        }
    }

    encryptSensitiveData(data) {
        try {
            if (!data) return null;
            
            const jsonString = JSON.stringify(data);
            const encoded = btoa(jsonString);
            
            const timestamp = Date.now();
            const payload = {
                data: encoded,
                timestamp: timestamp,
                checksum: this.generateChecksum(encoded + timestamp)
            };
            
            return btoa(JSON.stringify(payload));
        } catch (error) {
            console.error('Erro na criptografia:', error);
            return null;
        }
    }

    decryptSensitiveData(encryptedData) {
        try {
            if (!encryptedData) return null;
            
            const payload = JSON.parse(atob(encryptedData));
            const expectedChecksum = this.generateChecksum(payload.data + payload.timestamp);
            
            if (payload.checksum !== expectedChecksum) {
                console.warn('Checksum inválido - dados podem ter sido alterados');
                return null;
            }
            
            return JSON.parse(atob(payload.data));
        } catch (error) {
            console.error('Erro na descriptografia:', error);
            return null;
        }
    }

    generateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>"'&]/g, function(match) {
                const escapeMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return escapeMap[match];
            })
            .trim();
    }

    validateDataFormat(data, expectedFormat) {
        if (!data || !expectedFormat) return false;
        
        switch (expectedFormat) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
            case 'phone':
                return /^[\d\s\-\(\)\+]+$/.test(data);
            case 'date':
                return !isNaN(Date.parse(data));
            case 'alphanumeric':
                return /^[a-zA-Z0-9\s]+$/.test(data);
            default:
                return true;
        }
    }
}

// ===== PERFORMANCE CACHE SIMPLES =====

class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50;
        this.ttl = 5 * 60 * 1000; // 5 minutos
    }

    set(key, value, customTTL = null) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        const expiry = Date.now() + (customTTL || this.ttl);
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    clear() {
        this.cache.clear();
    }
}

// ===== EXPORTS E INICIALIZAÇÃO =====

class CoreUtils {
    constructor() {
        this.database = new DatabaseCore();
        this.motorista = new MotoristaManager();
        this.security = new SecurityUtils();
        this.cache = new SimpleCache();
        
        // MotoristaManager agora é file-based e não depende de database
    }

    async initialize() {
        try {
            await this.database.initialize();
            console.log('Core Utils inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Core Utils:', error);
            return false;
        }
    }

    // Métodos de conveniência
    async addMotorista(cidade, nome) {
        return this.motorista.adicionarMotorista(cidade, nome);
    }

    async getMotoristas(cidade) {
        return this.motorista.getMotoristasPorCidade(cidade);
    }

    encrypt(data) {
        return this.security.encryptSensitiveData(data);
    }

    decrypt(data) {
        return this.security.decryptSensitiveData(data);
    }

    sanitize(input) {
        return this.security.sanitizeInput(input);
    }

    cacheSet(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }

    cacheGet(key) {
        return this.cache.get(key);
    }

    async createAppointment(appointment) {
        return this.database.createAppointment(appointment);
    }

    async getAppointments(userId) {
        return this.database.getAppointments(userId);
    }

    close() {
        this.database.close();
    }
}

// Instância global
const coreUtils = new CoreUtils();

// Compatibilidade com browser
if (typeof window !== 'undefined') {
    window.coreUtils = coreUtils;
    window.motoristaManager = coreUtils.motorista;
    window.securityUtils = coreUtils.security;
}

// Compatibilidade com Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CoreUtils,
        DatabaseCore,
        MotoristaManager,
        SecurityUtils,
        SimpleCache,
        coreUtils
    };
}

// Auto-inicialização
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            coreUtils.initialize();
        });
    } else {
        coreUtils.initialize();
    }
}