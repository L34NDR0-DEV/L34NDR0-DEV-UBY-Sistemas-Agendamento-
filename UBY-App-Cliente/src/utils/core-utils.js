/**
 * Core Utils - Utilitários Essenciais Consolidados
 * Combina funcionalidades de database, motorista-manager e security-utils
 * Versão otimizada e consolidada para reduzir arquivos
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ===== DATABASE CORE =====

class DatabaseCore {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '../../data/app.db');
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('[ERROR] Erro ao conectar ao banco de dados:', err);
                    reject(err);
                } else {
                    console.log('[SUCCESS] Conectado ao banco de dados SQLite');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Tabela de usuários
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Tabela de agendamentos
            `CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                date_time DATETIME NOT NULL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            // Tabela de motoristas
            `CREATE TABLE IF NOT EXISTS motoristas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cidade TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(nome, cidade)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Métodos específicos para agendamentos
    async createAppointment(appointment) {
        const sql = `INSERT INTO appointments (id, user_id, title, description, date_time, status) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return this.run(sql, [appointment.id, appointment.userId, appointment.title, 
                             appointment.description, appointment.dateTime, appointment.status || 'active']);
    }

    async getAppointments(userId) {
        const sql = `SELECT * FROM appointments WHERE user_id = ? ORDER BY date_time ASC`;
        return this.all(sql, [userId]);
    }

    // Métodos específicos para motoristas
    async addMotorista(nome, cidade) {
        const sql = `INSERT OR IGNORE INTO motoristas (nome, cidade) VALUES (?, ?)`;
        return this.run(sql, [nome, cidade]);
    }

    async getMotoristasPorCidade(cidade) {
        const sql = `SELECT nome FROM motoristas WHERE cidade = ? ORDER BY nome ASC`;
        const rows = await this.all(sql, [cidade]);
        return rows.map(row => row.nome);
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// ===== MOTORISTA MANAGER =====

class MotoristaManager {
    constructor() {
        this.storageKey = 'motoristas_por_cidade';
        this.motoristas = this.loadMotoristas();
        this.database = null;
    }

    setDatabase(database) {
        this.database = database;
    }

    loadMotoristas() {
        try {
            if (typeof localStorage !== 'undefined') {
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
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.storageKey, JSON.stringify(this.motoristas));
            }
        } catch (error) {
            console.error('Erro ao salvar motoristas:', error);
        }
    }

    async adicionarMotorista(cidade, nomeMotorista) {
        if (!cidade || !nomeMotorista) return false;

        cidade = cidade.trim();
        nomeMotorista = nomeMotorista.trim();

        // Adicionar ao localStorage
        if (!this.motoristas[cidade]) {
            this.motoristas[cidade] = [];
        }

        if (!this.motoristas[cidade].includes(nomeMotorista)) {
            this.motoristas[cidade].push(nomeMotorista);
            this.motoristas[cidade].sort();
            this.saveMotoristas();

            // Adicionar ao banco de dados se disponível
            if (this.database) {
                try {
                    await this.database.addMotorista(nomeMotorista, cidade);
                } catch (error) {
                    console.error('Erro ao salvar motorista no banco:', error);
                }
            }

            return true;
        }
        return false;
    }

    async getMotoristasPorCidade(cidade) {
        if (!cidade) return [];

        // Tentar buscar do banco primeiro
        if (this.database) {
            try {
                const motoristasDB = await this.database.getMotoristasPorCidade(cidade);
                if (motoristasDB.length > 0) {
                    return motoristasDB;
                }
            } catch (error) {
                console.error('Erro ao buscar motoristas do banco:', error);
            }
        }

        // Fallback para localStorage
        return this.motoristas[cidade] || [];
    }

    buscarMotoristas(cidade, termo) {
        const motoristas = this.motoristas[cidade] || [];
        if (!termo) return motoristas;

        const termoLower = termo.toLowerCase();
        return motoristas.filter(motorista => 
            motorista.toLowerCase().includes(termoLower)
        );
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
        
        // Conectar motorista manager com database
        this.motorista.setDatabase(this.database);
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