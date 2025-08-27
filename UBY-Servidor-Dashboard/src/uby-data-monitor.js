/**
 * Monitor de dados UBY
 * Monitora mudanças nos dados do sistema UBY
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const chokidar = require('chokidar');

class UBYDataMonitor extends EventEmitter {
    constructor() {
        super();
        this.dataPath = path.join(__dirname, '..', 'data');
        this.watcher = null;
        this.isWatching = false;
        this.stats = {
            filesWatched: 0,
            lastChange: null,
            totalChanges: 0
        };
    }

    /**
     * Inicia o monitoramento de arquivos
     */
    startWatching() {
        if (this.isWatching) return;

        try {
            // Garantir que o diretório de dados existe
            if (!fs.existsSync(this.dataPath)) {
                fs.mkdirSync(this.dataPath, { recursive: true });
            }

            this.watcher = chokidar.watch(this.dataPath, {
                ignored: /(^|[\/\\])\../, // ignorar arquivos ocultos
                persistent: true,
                ignoreInitial: false
            });

            this.watcher
                .on('add', (filePath) => this.handleFileChange('add', filePath))
                .on('change', (filePath) => this.handleFileChange('change', filePath))
                .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
                .on('error', (error) => {
                    console.error('❌ Erro no monitor de arquivos:', error);
                });

            this.isWatching = true;
            console.log('👁️ Monitor de dados UBY iniciado');
            console.log(`📁 Monitorando: ${this.dataPath}`);

        } catch (error) {
            console.error('❌ Erro ao iniciar monitor:', error);
        }
    }

    /**
     * Para o monitoramento
     */
    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        this.isWatching = false;
        console.log('⏹️ Monitor de dados UBY parado');
    }

    /**
     * Manipula mudanças nos arquivos
     */
    handleFileChange(event, filePath) {
        const fileName = path.basename(filePath);
        const changeData = {
            event,
            filePath,
            fileName,
            timestamp: new Date()
        };

        this.stats.lastChange = changeData.timestamp;
        this.stats.totalChanges++;

        console.log(`📄 Arquivo ${event}: ${fileName}`);
        
        this.emit('dataChange', changeData);
    }

    /**
     * Registra callback para mudanças de dados
     */
    onDataChange(callback) {
        this.on('dataChange', callback);
    }

    /**
     * Obtém estatísticas do monitor
     */
    getStats() {
        return {
            ...this.stats,
            isWatching: this.isWatching,
            dataPath: this.dataPath
        };
    }

    /**
     * Lista arquivos sendo monitorados
     */
    getWatchedFiles() {
        if (!this.watcher) return [];
        return this.watcher.getWatched();
    }
}

module.exports = UBYDataMonitor;