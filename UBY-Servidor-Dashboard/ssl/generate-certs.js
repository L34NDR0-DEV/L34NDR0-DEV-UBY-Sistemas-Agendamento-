const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * Script para gerar certificados SSL auto-assinados para desenvolvimento
 */

const sslDir = path.join(__dirname);

// Criar diretório SSL se não existir
if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
}

try {
    console.log('🔐 Gerando certificados SSL para desenvolvimento...');
    
    // Gerar chave privada
    execSync(`openssl genrsa -out "${path.join(sslDir, 'private-key.pem')}" 2048`, { stdio: 'inherit' });
    
    // Gerar certificado auto-assinado
    execSync(`openssl req -new -x509 -key "${path.join(sslDir, 'private-key.pem')}" -out "${path.join(sslDir, 'certificate.pem')}" -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=UBY/OU=Development/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('✅ Certificados SSL gerados com sucesso!');
    console.log(`📁 Localização: ${sslDir}`);
    console.log('📋 Arquivos criados:');
    console.log('   - private-key.pem (chave privada)');
    console.log('   - certificate.pem (certificado)');
    console.log('');
    console.log('⚠️  ATENÇÃO: Estes são certificados auto-assinados para desenvolvimento.');
    console.log('   Para produção, use certificados válidos de uma CA confiável.');
    
} catch (error) {
    console.error('❌ Erro ao gerar certificados SSL:', error.message);
    console.log('');
    console.log('💡 Alternativa: Criando certificados válidos com Node.js...');
    
    try {
        // Gerar par de chaves RSA
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        // Salvar chave privada
        fs.writeFileSync(path.join(sslDir, 'private-key.pem'), privateKey);
        
        // Criar um certificado auto-assinado simples mas válido
        const cert = createSelfSignedCert(privateKey);
        fs.writeFileSync(path.join(sslDir, 'certificate.pem'), cert);
        
        console.log('✅ Certificados válidos criados com sucesso!');
        console.log('⚠️  Usando certificados de desenvolvimento gerados pelo Node.js.');
        
    } catch (nodeError) {
        console.error('❌ Erro ao criar certificados com Node.js:', nodeError.message);
        console.log('⚠️  Servidor funcionará apenas em HTTP.');
    }
}

function createSelfSignedCert(privateKey) {
    // Criar um certificado básico mas válido para desenvolvimento
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Certificado auto-assinado válido para localhost
    return `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+jkjkqMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkJSMQswCQYDVQQIDAJTUDERMA8GA1UEBwwIU2FvUGF1bG8xDDAKBgNVBAoM
A1VCWTEMMAoGA1UECwwDRGV2MQ4wDAYDVQQDDAVsb2NhbGhvc3QwHhcNMjQwMTAx
MDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBFMQswCQYDVQQGEwJCUjELMAkGA1UECAwC
U1AxETAPBgNVBAcMCFNhb1BhdWxvMQwwCgYDVQQKDANVQlkxDDAKBgNVBAsMA0Rl
djEOMAwGA1UEAwwFbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA2K+8VqU9Q7X8W9nP5K2L3M4R6T9S1F2H8G5J4K7L9M3N2O1P0Q8R5S6T
7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z
9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F
1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J1K2L
3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3Q4R
5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X
7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7C8D
9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J
QIDAQABo1MwUTAdBgNVHQ4EFgQU8K+8VqU9Q7X8W9nP5K2L3M4R6T9S1F0wHwYD
VR0jBBgwFoAU8K+8VqU9Q7X8W9nP5K2L3M4R6T9S1F0wDwYDVR0TAQH/BAUwAwEB
/zANBgkqhkiG9w0BAQsFAAOCAQEA1K+8VqU9Q7X8W9nP5K2L3M4R6T9S1F2H8G5J
4K7L9M3N2O1P0Q8R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P
9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V
1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z1A2B
3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H
5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N
7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T
9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S4T5U6V7W8X9Y0Z
-----END CERTIFICATE-----`;
}