/**
 * Configuração de Firewall e Validação de Origem
 * Script para configurar regras de segurança no Windows
 */

const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

class FirewallConfig {
    constructor() {
        this.appName = 'UBY-Agendamentos';
        this.httpPort = 3000;
        this.httpsPort = 3443;
        this.isWindows = os.platform() === 'win32';
    }

    /**
     * Configurar regras de firewall
     */
    async configureFirewall() {
        console.log('🔥 Configurando regras de firewall...');
        
        if (!this.isWindows) {
            console.log('⚠️  Configuração de firewall disponível apenas para Windows');
            return false;
        }

        try {
            // Verificar se está executando como administrador
            if (!this.isRunningAsAdmin()) {
                console.log('⚠️  Execute como administrador para configurar o firewall');
                console.log('💡 Dica: Clique com o botão direito e "Executar como administrador"');
                return false;
            }

            // Remover regras existentes (se houver)
            await this.removeExistingRules();

            // Adicionar regras de entrada
            await this.addInboundRules();

            // Adicionar regras de saída
            await this.addOutboundRules();

            console.log('✅ Regras de firewall configuradas com sucesso!');
            return true;

        } catch (error) {
            console.error('❌ Erro ao configurar firewall:', error.message);
            return false;
        }
    }

    /**
     * Verificar se está executando como administrador
     */
    isRunningAsAdmin() {
        try {
            execSync('net session', { stdio: 'ignore' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Remover regras existentes
     */
    async removeExistingRules() {
        console.log('🧹 Removendo regras existentes...');
        
        const rulesToRemove = [
            `${this.appName}-HTTP-In`,
            `${this.appName}-HTTPS-In`,
            `${this.appName}-HTTP-Out`,
            `${this.appName}-HTTPS-Out`
        ];

        for (const ruleName of rulesToRemove) {
            try {
                execSync(`netsh advfirewall firewall delete rule name="${ruleName}"`, { stdio: 'ignore' });
            } catch (error) {
                // Ignorar se a regra não existir
            }
        }
    }

    /**
     * Adicionar regras de entrada
     */
    async addInboundRules() {
        console.log('📥 Configurando regras de entrada...');

        // Regra para HTTP (porta 3000)
        const httpInRule = `netsh advfirewall firewall add rule name="${this.appName}-HTTP-In" dir=in action=allow protocol=TCP localport=${this.httpPort} remoteip=127.0.0.1,::1,LocalSubnet`;
        
        // Regra para HTTPS (porta 3443)
        const httpsInRule = `netsh advfirewall firewall add rule name="${this.appName}-HTTPS-In" dir=in action=allow protocol=TCP localport=${this.httpsPort} remoteip=127.0.0.1,::1,LocalSubnet`;

        try {
            execSync(httpInRule, { stdio: 'inherit' });
            console.log(`✅ Regra de entrada HTTP (porta ${this.httpPort}) adicionada`);
            
            execSync(httpsInRule, { stdio: 'inherit' });
            console.log(`✅ Regra de entrada HTTPS (porta ${this.httpsPort}) adicionada`);
        } catch (error) {
            throw new Error(`Falha ao adicionar regras de entrada: ${error.message}`);
        }
    }

    /**
     * Adicionar regras de saída
     */
    async addOutboundRules() {
        console.log('📤 Configurando regras de saída...');

        // Regra para HTTP (porta 3000)
        const httpOutRule = `netsh advfirewall firewall add rule name="${this.appName}-HTTP-Out" dir=out action=allow protocol=TCP localport=${this.httpPort} remoteip=127.0.0.1,::1,LocalSubnet`;
        
        // Regra para HTTPS (porta 3443)
        const httpsOutRule = `netsh advfirewall firewall add rule name="${this.appName}-HTTPS-Out" dir=out action=allow protocol=TCP localport=${this.httpsPort} remoteip=127.0.0.1,::1,LocalSubnet`;

        try {
            execSync(httpOutRule, { stdio: 'inherit' });
            console.log(`✅ Regra de saída HTTP (porta ${this.httpPort}) adicionada`);
            
            execSync(httpsOutRule, { stdio: 'inherit' });
            console.log(`✅ Regra de saída HTTPS (porta ${this.httpsPort}) adicionada`);
        } catch (error) {
            throw new Error(`Falha ao adicionar regras de saída: ${error.message}`);
        }
    }

    /**
     * Listar regras do firewall relacionadas ao app
     */
    async listRules() {
        console.log('📋 Listando regras do firewall...');
        
        try {
            const output = execSync(`netsh advfirewall firewall show rule name=all | findstr "${this.appName}"`, { encoding: 'utf8' });
            console.log(output);
        } catch (error) {
            console.log('ℹ️  Nenhuma regra encontrada para o aplicativo');
        }
    }

    /**
     * Remover todas as regras do firewall
     */
    async removeAllRules() {
        console.log('🗑️  Removendo todas as regras do firewall...');
        
        if (!this.isRunningAsAdmin()) {
            console.log('⚠️  Execute como administrador para remover regras do firewall');
            return false;
        }

        try {
            await this.removeExistingRules();
            console.log('✅ Todas as regras removidas com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover regras:', error.message);
            return false;
        }
    }

    /**
     * Verificar status do firewall
     */
    async checkFirewallStatus() {
        console.log('🔍 Verificando status do firewall...');
        
        try {
            const output = execSync('netsh advfirewall show allprofiles state', { encoding: 'utf8' });
            console.log(output);
            
            // Verificar se o firewall está ativo
            const isActive = output.includes('State                                 ON');
            
            if (isActive) {
                console.log('✅ Firewall do Windows está ativo');
            } else {
                console.log('⚠️  Firewall do Windows está desativado');
                console.log('💡 Recomendação: Ative o firewall para maior segurança');
            }
            
            return isActive;
        } catch (error) {
            console.error('❌ Erro ao verificar status do firewall:', error.message);
            return false;
        }
    }

    /**
     * Configuração completa de segurança
     */
    async setupCompleteSecurity() {
        console.log('🛡️  Iniciando configuração completa de segurança...');
        console.log('');
        
        // Verificar status do firewall
        await this.checkFirewallStatus();
        console.log('');
        
        // Configurar regras
        const success = await this.configureFirewall();
        console.log('');
        
        if (success) {
            // Listar regras configuradas
            await this.listRules();
            console.log('');
            
            console.log('🎉 Configuração de segurança concluída!');
            console.log('');
            console.log('📋 Resumo das configurações:');
            console.log(`   • Porta HTTP: ${this.httpPort} (localhost apenas)`);
            console.log(`   • Porta HTTPS: ${this.httpsPort} (localhost apenas)`);
            console.log('   • Acesso restrito a localhost e rede local');
            console.log('   • Regras de entrada e saída configuradas');
            console.log('');
            console.log('⚠️  IMPORTANTE:');
            console.log('   • Mantenha o firewall ativo');
            console.log('   • Use apenas conexões HTTPS em produção');
            console.log('   • Monitore logs de acesso regularmente');
        } else {
            console.log('❌ Falha na configuração de segurança');
        }
        
        return success;
    }
}

// Função principal
async function main() {
    const firewall = new FirewallConfig();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'setup';
    
    switch (command) {
        case 'setup':
            await firewall.setupCompleteSecurity();
            break;
            
        case 'configure':
            await firewall.configureFirewall();
            break;
            
        case 'list':
            await firewall.listRules();
            break;
            
        case 'remove':
            await firewall.removeAllRules();
            break;
            
        case 'status':
            await firewall.checkFirewallStatus();
            break;
            
        case 'help':
        default:
            console.log('🔥 Configurador de Firewall UBY Agendamentos');
            console.log('');
            console.log('Comandos disponíveis:');
            console.log('  setup     - Configuração completa de segurança (padrão)');
            console.log('  configure - Configurar apenas regras de firewall');
            console.log('  list      - Listar regras existentes');
            console.log('  remove    - Remover todas as regras');
            console.log('  status    - Verificar status do firewall');
            console.log('  help      - Mostrar esta ajuda');
            console.log('');
            console.log('Exemplo: node firewall-config.js setup');
            break;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FirewallConfig;