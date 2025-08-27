/**
 * System Helpers - Utilitários de Sistema Consolidados
 * Combina funcionalidades auxiliares, configurações e utilitários diversos
 * Terceiro arquivo da consolidação para manter apenas 3 arquivos em utils
 */

// ===== CONFIGURATION MANAGER =====

class ConfigurationManager {
    constructor() {
        this.config = {
            app: {
                name: 'UBY Sistema de Agendamento',
                version: '1.0.6',
                environment: 'production'
            },
            database: {
                path: './data/app.db',
                backupInterval: 24 * 60 * 60 * 1000, // 24 horas
                maxConnections: 10
            },
            cache: {
                defaultTTL: 5 * 60 * 1000, // 5 minutos
                maxSize: 100,
                cleanupInterval: 60 * 1000 // 1 minuto
            },
            security: {
                encryptionEnabled: true,
                sessionTimeout: 30 * 60 * 1000, // 30 minutos
                maxLoginAttempts: 5
            },
            performance: {
                debounceDelay: 300,
                throttleDelay: 1000,
                lazyLoadThreshold: 50
            }
        };
        
        this.loadUserConfig();
    }

    loadUserConfig() {
        try {
            if (typeof localStorage !== 'undefined') {
                const userConfig = localStorage.getItem('uby_user_config');
                if (userConfig) {
                    const parsed = JSON.parse(userConfig);
                    this.config = this.mergeConfig(this.config, parsed);
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar configuração do usuário:', error);
        }
    }

    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        
        for (const key in userConfig) {
            if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
                merged[key] = this.mergeConfig(merged[key] || {}, userConfig[key]);
            } else {
                merged[key] = userConfig[key];
            }
        }
        
        return merged;
    }

    get(path) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return null;
            }
            current = current[key];
        }
        
        return current;
    }

    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveUserConfig();
    }

    saveUserConfig() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('uby_user_config', JSON.stringify(this.config));
            }
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
        }
    }

    reset() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('uby_user_config');
        }
        this.loadUserConfig();
    }
}

// ===== LOGGER SYSTEM =====

class Logger {
    constructor() {
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.levels.INFO;
        this.logs = [];
        this.maxLogs = 1000;
    }

    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.levels[level.toUpperCase()] || this.levels.INFO;
        } else {
            this.currentLevel = level;
        }
    }

    log(level, message, data = null) {
        if (level > this.currentLevel) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: Object.keys(this.levels)[level],
            message,
            data
        };
        
        this.logs.push(logEntry);
        
        // Limitar número de logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        
        // Output no console
        const consoleMethod = level === 0 ? 'error' : level === 1 ? 'warn' : 'log';
        console[consoleMethod](`[${logEntry.level}] ${message}`, data || '');
    }

    error(message, data) {
        this.log(this.levels.ERROR, message, data);
    }

    warn(message, data) {
        this.log(this.levels.WARN, message, data);
    }

    info(message, data) {
        this.log(this.levels.INFO, message, data);
    }

    debug(message, data) {
        this.log(this.levels.DEBUG, message, data);
    }

    getLogs(level = null) {
        if (level === null) {
            return this.logs;
        }
        
        const levelName = typeof level === 'string' ? level.toUpperCase() : Object.keys(this.levels)[level];
        return this.logs.filter(log => log.level === levelName);
    }

    clearLogs() {
        this.logs = [];
    }

    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}

// ===== UTILITY FUNCTIONS =====

class UtilityFunctions {
    static formatDate(date, format = 'dd/mm/yyyy') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('dd', day)
            .replace('mm', month)
            .replace('yyyy', year)
            .replace('hh', hours)
            .replace('MM', minutes);
    }

    static formatCurrency(value, currency = 'BRL') {
        if (typeof value !== 'number') return '';
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`;
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
        return phoneRegex.test(phone);
    }

    static sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static retry(fn, maxAttempts = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const attempt = async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(error);
                    } else {
                        setTimeout(attempt, delay * attempts);
                    }
                }
            };
            
            attempt();
        });
    }
}

// ===== EVENT EMITTER =====

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return this;
        
        this.events[event] = this.events[event].filter(
            listener => listener !== listenerToRemove
        );
        
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return false;
        
        this.events[event].forEach(listener => {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error('Erro no listener do evento:', error);
            }
        });
        
        return true;
    }

    once(event, listener) {
        const onceWrapper = (...args) => {
            listener.apply(this, args);
            this.off(event, onceWrapper);
        };
        
        return this.on(event, onceWrapper);
    }

    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
        return this;
    }

    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// ===== STORAGE MANAGER =====

class StorageManager {
    constructor() {
        this.prefix = 'uby_';
    }

    set(key, value, expiry = null) {
        try {
            const data = {
                value,
                timestamp: Date.now(),
                expiry: expiry ? Date.now() + expiry : null
            };
            
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.prefix + key, JSON.stringify(data));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao salvar no storage:', error);
            return false;
        }
    }

    get(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.prefix + key);
                if (!stored) return null;
                
                const data = JSON.parse(stored);
                
                // Verificar expiração
                if (data.expiry && Date.now() > data.expiry) {
                    this.remove(key);
                    return null;
                }
                
                return data.value;
            }
            return null;
        } catch (error) {
            console.error('Erro ao ler do storage:', error);
            return null;
        }
    }

    remove(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(this.prefix + key);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao remover do storage:', error);
            return false;
        }
    }

    clear() {
        try {
            if (typeof localStorage !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao limpar storage:', error);
            return false;
        }
    }

    getAll() {
        try {
            const result = {};
            if (typeof localStorage !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        const cleanKey = key.replace(this.prefix, '');
                        result[cleanKey] = this.get(cleanKey);
                    }
                });
            }
            return result;
        } catch (error) {
            console.error('Erro ao obter todos os dados do storage:', error);
            return {};
        }
    }
}

// ===== CLASSE PRINCIPAL =====

class SystemHelpers {
    constructor() {
        this.config = new ConfigurationManager();
        this.logger = new Logger();
        this.utils = UtilityFunctions;
        this.events = new EventEmitter();
        this.storage = new StorageManager();
    }

    // Métodos de conveniência
    log(level, message, data) {
        return this.logger.log(this.logger.levels[level.toUpperCase()], message, data);
    }

    getConfig(path) {
        return this.config.get(path);
    }

    setConfig(path, value) {
        return this.config.set(path, value);
    }

    formatDate(date, format) {
        return this.utils.formatDate(date, format);
    }

    generateId(prefix) {
        return this.utils.generateId(prefix);
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    on(event, listener) {
        return this.events.on(event, listener);
    }

    store(key, value, expiry) {
        return this.storage.set(key, value, expiry);
    }

    retrieve(key) {
        return this.storage.get(key);
    }

    getSystemInfo() {
        return {
            app: this.config.get('app'),
            timestamp: new Date().toISOString(),
            logs: this.logger.logs.length,
            storage: Object.keys(this.storage.getAll()).length,
            events: Object.keys(this.events.events).length
        };
    }
}

// Instância global
const systemHelpers = new SystemHelpers();

// Compatibilidade com browser
if (typeof window !== 'undefined') {
    window.systemHelpers = systemHelpers;
    window.configManager = systemHelpers.config;
    window.logger = systemHelpers.logger;
    window.utilityFunctions = systemHelpers.utils;
    window.eventEmitter = systemHelpers.events;
    window.storageManager = systemHelpers.storage;
}

// Compatibilidade com Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SystemHelpers,
        ConfigurationManager,
        Logger,
        UtilityFunctions,
        EventEmitter,
        StorageManager,
        systemHelpers
    };
}

// Inicialização automática
if (typeof document !== 'undefined') {
    systemHelpers.logger.info('System Helpers inicializado');
}