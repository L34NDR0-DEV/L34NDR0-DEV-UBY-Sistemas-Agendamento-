/**
 * Módulo de integração UBY
 * Gerencia a integração com o sistema UBY de agendamentos
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class UBYIntegration extends EventEmitter {
    constructor() {
        super();
        this.dataPath = path.join(__dirname, '..', 'data');
        this.isMonitoring = false;
        this.lastUpdate = null;
    }

    /**
     * Inicia o monitoramento de dados UBY
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔄 Iniciando monitoramento UBY...');
        
        // Simular dados iniciais
        this.emitDataChange({
            type: 'system_start',
            timestamp: new Date(),
            data: {
                status: 'online',
                users: [],
                appointments: []
            }
        });
    }

    /**
     * Para o monitoramento
     */
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('⏹️ Monitoramento UBY parado');
    }

    /**
     * Emite evento de mudança de dados
     */
    emitDataChange(data) {
        this.lastUpdate = new Date();
        this.emit('dataChange', data);
    }

    /**
     * Registra callback para mudanças de dados
     */
    onDataChange(callback) {
        this.on('dataChange', callback);
    }

    /**
     * Obtém estatísticas do sistema
     */
    getStats() {
        return {
            isMonitoring: this.isMonitoring,
            lastUpdate: this.lastUpdate,
            uptime: process.uptime()
        };
    }
}

// Instância singleton
const ubyIntegration = new UBYIntegration();

// Auto-iniciar monitoramento
ubyIntegration.startMonitoring();

module.exports = ubyIntegration;