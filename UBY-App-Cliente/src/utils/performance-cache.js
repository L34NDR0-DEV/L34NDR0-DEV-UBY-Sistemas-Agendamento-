/**
 * Performance Cache - Sistema de Cache e Otimização Consolidado
 * Combina funcionalidades de smart-cache, offline-cache e performance-optimizer
 * Versão otimizada para reduzir arquivos
 */

// ===== SMART CACHE SYSTEM =====

class SmartCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || this.calculateOptimalSize();
        this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutos
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0
        };
        this.compressionEnabled = options.compression !== false;
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // 1 minuto
    }

    calculateOptimalSize() {
        if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
            const cores = navigator.hardwareConcurrency;
            return Math.max(50, cores * 10);
        }
        return 100;
    }

    set(key, value, ttl = null) {
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const expiry = Date.now() + (ttl || this.defaultTTL);
        const compressedValue = this.compressionEnabled ? this.compress(value) : value;
        
        this.cache.set(key, {
            value: compressedValue,
            expiry,
            lastAccessed: Date.now(),
            compressed: this.compressionEnabled
        });
        
        this.stats.sets++;
        return true;
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        item.lastAccessed = Date.now();
        this.stats.hits++;
        
        return item.compressed ? this.decompress(item.value) : item.value;
    }

    compress(data) {
        try {
            return JSON.stringify(data);
        } catch (error) {
            console.warn('Erro na compressão:', error);
            return data;
        }
    }

    decompress(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            return data;
        }
    }

    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.cache) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    cleanup() {
        const now = Date.now();
        const toDelete = [];
        
        for (const [key, item] of this.cache) {
            if (now > item.expiry) {
                toDelete.push(key);
            }
        }
        
        toDelete.forEach(key => this.cache.delete(key));
    }

    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }

    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// ===== OFFLINE CACHE SYSTEM =====

class OfflineCache {
    constructor() {
        this.storageKey = 'uby_offline_cache';
        this.pendingActionsKey = 'uby_pending_actions';
        this.maxOfflineItems = 1000;
        this.syncInProgress = false;
    }

    store(key, data, metadata = {}) {
        try {
            const offlineData = this.getOfflineData();
            
            offlineData[key] = {
                data,
                timestamp: Date.now(),
                metadata,
                synced: false
            };
            
            // Limitar tamanho do cache offline
            const keys = Object.keys(offlineData);
            if (keys.length > this.maxOfflineItems) {
                const sortedKeys = keys.sort((a, b) => 
                    offlineData[a].timestamp - offlineData[b].timestamp
                );
                
                const toRemove = sortedKeys.slice(0, keys.length - this.maxOfflineItems);
                toRemove.forEach(k => delete offlineData[k]);
            }
            
            this.saveOfflineData(offlineData);
            return true;
        } catch (error) {
            console.error('Erro ao armazenar dados offline:', error);
            return false;
        }
    }

    retrieve(key) {
        try {
            const offlineData = this.getOfflineData();
            return offlineData[key] || null;
        } catch (error) {
            console.error('Erro ao recuperar dados offline:', error);
            return null;
        }
    }

    addPendingAction(action) {
        try {
            const pendingActions = this.getPendingActions();
            pendingActions.push({
                ...action,
                id: Date.now() + Math.random(),
                timestamp: Date.now()
            });
            
            this.savePendingActions(pendingActions);
            return true;
        } catch (error) {
            console.error('Erro ao adicionar ação pendente:', error);
            return false;
        }
    }

    async syncPendingActions(syncFunction) {
        if (this.syncInProgress) return false;
        
        this.syncInProgress = true;
        
        try {
            const pendingActions = this.getPendingActions();
            const successfulActions = [];
            
            for (const action of pendingActions) {
                try {
                    const result = await syncFunction(action);
                    if (result) {
                        successfulActions.push(action.id);
                    }
                } catch (error) {
                    console.error('Erro ao sincronizar ação:', error);
                }
            }
            
            // Remover ações sincronizadas com sucesso
            const remainingActions = pendingActions.filter(
                action => !successfulActions.includes(action.id)
            );
            
            this.savePendingActions(remainingActions);
            return successfulActions.length;
        } finally {
            this.syncInProgress = false;
        }
    }

    getOfflineData() {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : {};
            }
            return {};
        } catch (error) {
            console.error('Erro ao carregar dados offline:', error);
            return {};
        }
    }

    saveOfflineData(data) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Erro ao salvar dados offline:', error);
        }
    }

    getPendingActions() {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.pendingActionsKey);
                return stored ? JSON.parse(stored) : [];
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar ações pendentes:', error);
            return [];
        }
    }

    savePendingActions(actions) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.pendingActionsKey, JSON.stringify(actions));
            }
        } catch (error) {
            console.error('Erro ao salvar ações pendentes:', error);
        }
    }

    clearOfflineData() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(this.storageKey);
                localStorage.removeItem(this.pendingActionsKey);
            }
        } catch (error) {
            console.error('Erro ao limpar dados offline:', error);
        }
    }
}

// ===== PERFORMANCE OPTIMIZER =====

class PerformanceOptimizer {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.lazyLoadObserver = null;
        this.initializeLazyLoading();
    }

    debounce(func, delay, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    throttle(func, delay, key = 'default') {
        return (...args) => {
            if (this.throttleTimers.has(key)) {
                return;
            }
            
            func.apply(this, args);
            
            const timer = setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
            
            this.throttleTimers.set(key, timer);
        };
    }

    initializeLazyLoading() {
        if (typeof IntersectionObserver !== 'undefined') {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                        }
                        
                        if (element.dataset.lazyFunction) {
                            try {
                                const func = new Function(element.dataset.lazyFunction);
                                func.call(element);
                                element.removeAttribute('data-lazy-function');
                            } catch (error) {
                                console.error('Erro na função lazy:', error);
                            }
                        }
                        
                        this.lazyLoadObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }

    observeLazyElement(element) {
        if (this.lazyLoadObserver && element) {
            this.lazyLoadObserver.observe(element);
        }
    }

    optimizeForm(formElement) {
        if (!formElement) return;
        
        const inputs = formElement.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Debounce para validação
            const validateInput = this.debounce(() => {
                this.validateField(input);
            }, 300, `validate_${input.name || input.id}`);
            
            input.addEventListener('input', validateInput);
            
            // Throttle para auto-save
            const autoSave = this.throttle(() => {
                this.autoSaveField(input);
            }, 2000, `autosave_${input.name || input.id}`);
            
            input.addEventListener('change', autoSave);
        });
    }

    validateField(field) {
        // Validação básica
        if (field.required && !field.value.trim()) {
            field.classList.add('invalid');
            return false;
        }
        
        field.classList.remove('invalid');
        return true;
    }

    autoSaveField(field) {
        try {
            const formData = new FormData(field.form);
            const data = Object.fromEntries(formData.entries());
            
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`autosave_${field.form.id}`, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Erro no auto-save:', error);
        }
    }

    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => {
                    try {
                        update();
                    } catch (error) {
                        console.error('Erro na atualização DOM:', error);
                    }
                });
                resolve();
            });
        });
    }

    measurePerformance(name, func) {
        return async (...args) => {
            const start = performance.now();
            
            try {
                const result = await func(...args);
                const end = performance.now();
                
                console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
                return result;
            } catch (error) {
                const end = performance.now();
                console.error(`Performance [${name}] ERROR: ${(end - start).toFixed(2)}ms`, error);
                throw error;
            }
        };
    }

    destroy() {
        // Limpar timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        
        this.debounceTimers.clear();
        this.throttleTimers.clear();
        
        // Desconectar observer
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.disconnect();
        }
    }
}

// ===== CLASSE PRINCIPAL =====

class PerformanceCache {
    constructor(options = {}) {
        this.smartCache = new SmartCache(options.cache);
        this.offlineCache = new OfflineCache();
        this.optimizer = new PerformanceOptimizer();
    }

    // Métodos de conveniência para cache
    set(key, value, ttl) {
        return this.smartCache.set(key, value, ttl);
    }

    get(key) {
        return this.smartCache.get(key);
    }

    // Métodos de conveniência para offline
    storeOffline(key, data, metadata) {
        return this.offlineCache.store(key, data, metadata);
    }

    getOffline(key) {
        return this.offlineCache.retrieve(key);
    }

    addPendingAction(action) {
        return this.offlineCache.addPendingAction(action);
    }

    // Métodos de conveniência para otimização
    debounce(func, delay, key) {
        return this.optimizer.debounce(func, delay, key);
    }

    throttle(func, delay, key) {
        return this.optimizer.throttle(func, delay, key);
    }

    optimizeForm(form) {
        return this.optimizer.optimizeForm(form);
    }

    measurePerformance(name, func) {
        return this.optimizer.measurePerformance(name, func);
    }

    getStats() {
        return {
            cache: this.smartCache.getStats(),
            offline: {
                pendingActions: this.offlineCache.getPendingActions().length,
                offlineItems: Object.keys(this.offlineCache.getOfflineData()).length
            }
        };
    }

    destroy() {
        this.smartCache.destroy();
        this.optimizer.destroy();
    }
}

// Instância global
const performanceCache = new PerformanceCache();

// Compatibilidade com browser
if (typeof window !== 'undefined') {
    window.performanceCache = performanceCache;
    window.smartCache = performanceCache.smartCache;
    window.offlineCache = performanceCache.offlineCache;
    window.performanceOptimizer = performanceCache.optimizer;
}

// Compatibilidade com Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceCache,
        SmartCache,
        OfflineCache,
        PerformanceOptimizer,
        performanceCache
    };
}

// Limpeza automática ao fechar
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        performanceCache.destroy();
    });
}