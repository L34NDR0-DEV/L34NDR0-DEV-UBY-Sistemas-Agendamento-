const { contextBridge } = require('electron');

// Expor apenas informações essenciais para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    version: process.versions.electron
});