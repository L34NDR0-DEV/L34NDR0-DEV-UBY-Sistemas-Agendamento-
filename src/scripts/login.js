const { ipcRenderer } = require('electron');

// Loader rápido: some após o DOM ficar pronto
function initializePreloader() {
    const quick = document.getElementById('quickLoader');
    if (!quick) return;
    setTimeout(() => {
        quick.parentElement && quick.parentElement.removeChild(quick);
    }, 600);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar preloader
    initializePreloader();
    // Verificar se há credenciais lembradas
    const rememberedCredentials = await ipcRenderer.invoke('getRememberedCredentials');
    if (rememberedCredentials) {
        document.getElementById('username').value = rememberedCredentials.username;
        document.getElementById('password').value = rememberedCredentials.password;
        document.getElementById('remember').checked = true;
    }

    // Configurar controles da janela
    setupWindowControls();
    
    // Configurar formulário de login
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Configurar toggle da senha
    setupPasswordToggle();
    
    // Configurar modal de cadastro
    setupRegisterModal();
    
    // Configurar efeitos visuais
    setupRippleEffects();
    setupFloatingShapes();
    setupInputAnimations();
});

// Configurar controles da janela
function setupWindowControls() {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-minimize');
        });
    }
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-maximize');
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            ipcRenderer.send('login-window-close');
        });
    }
    
    // Configurar evento F11 para tela cheia
    // document.addEventListener('keydown', (e) => {
    //     if (e.key === 'F11') {
    //         e.preventDefault();
    //         console.log('F11 pressionado - alternando tela cheia (login)');
    //         ipcRenderer.send('login-window-toggle-fullscreen');
    //     }
    // });
    
    // Escutar mudanças no estado de tela cheia
    if (ipcRenderer) {
        ipcRenderer.on('fullscreen-changed', (event, isFullScreen) => {
            console.log('Estado de tela cheia alterado (login):', isFullScreen);
            // Opcional: atualizar UI para refletir o estado de tela cheia
            document.body.classList.toggle('fullscreen-mode', isFullScreen);
        });
    }
}

// Função de login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    if (!username || !password) {
        showError('Dados incompletos. Verifique os campos e tente novamente.');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;
    
    try {
        const result = await ipcRenderer.invoke('login', { username, password, remember });
        
        if (result.success) {
            // Login bem-sucedido - a janela principal será aberta pelo processo principal
            showSuccess('Login realizado com sucesso!');
        } else {
            showError(result.message || 'Dados de acesso incorretos. Contate o suporte se necessário.');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Falha temporária no sistema. Entre em contato com o administrador.');
    } finally {
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Configurar toggle da senha
function setupPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            
            if (isPassword) {
                // Mostrar senha
                passwordInput.type = 'text';
                passwordToggle.classList.add('showing');
                passwordToggle.title = 'Ocultar senha';
                
                // Adicionar classe para animação
                passwordToggle.classList.add('animating');
                setTimeout(() => {
                    passwordToggle.classList.remove('animating');
                }, 300);
            } else {
                // Ocultar senha
                passwordInput.type = 'password';
                passwordToggle.classList.remove('showing');
                passwordToggle.title = 'Mostrar senha';
                
                // Adicionar classe para animação
                passwordToggle.classList.add('animating');
                setTimeout(() => {
                    passwordToggle.classList.remove('animating');
                }, 300);
            }
        });
        
        // Adicionar suporte a tecla Enter no campo de senha
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
        
        // Adicionar efeito de hover com animação
        passwordToggle.addEventListener('mouseenter', () => {
            passwordToggle.style.transform = 'translateY(-50%) scale(1.1)';
        });
        
        passwordToggle.addEventListener('mouseleave', () => {
            passwordToggle.style.transform = 'translateY(-50%) scale(1)';
        });
    }
}

// Configurar modal de cadastro
function setupRegisterModal() {
    const newUserBtn = document.getElementById('newUserBtn');
    const registerModal = document.getElementById('registerModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    const registerForm = document.getElementById('registerForm');
    
    // Abrir modal
    if (newUserBtn) {
        newUserBtn.addEventListener('click', () => {
            registerModal.classList.add('show');
        });
    }
    
    // Fechar modal
    function closeModal() {
        registerModal.classList.remove('show');
        // Limpar formulário
        registerForm.reset();
        hideRegisterError();
    }
    
    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', closeModal);
    }
    
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', closeModal);
    }
    
    // Fechar ao clicar fora do modal
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            closeModal();
        }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && registerModal.classList.contains('show')) {
            closeModal();
        }
    });
    
    // Configurar toggles de senha no modal
    setupRegisterPasswordToggles();
    
    // Configurar formulário de cadastro
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Configurar validação em tempo real
    setupRegisterValidation();
}

// Configurar toggles de senha no modal de cadastro
function setupRegisterPasswordToggles() {
    const newPasswordInput = document.getElementById('newPassword');
    const newPasswordToggle = document.getElementById('newPasswordToggle');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    
    // Toggle para nova senha
    if (newPasswordToggle && newPasswordInput) {
        newPasswordToggle.addEventListener('click', () => {
            const isPassword = newPasswordInput.type === 'password';
            
            if (isPassword) {
                newPasswordInput.type = 'text';
                newPasswordToggle.classList.add('showing');
                newPasswordToggle.title = 'Ocultar senha';
            } else {
                newPasswordInput.type = 'password';
                newPasswordToggle.classList.remove('showing');
                newPasswordToggle.title = 'Mostrar senha';
            }
        });
    }
    
    // Toggle para confirmar senha
    if (confirmPasswordToggle && confirmPasswordInput) {
        confirmPasswordToggle.addEventListener('click', () => {
            const isPassword = confirmPasswordInput.type === 'password';
            
            if (isPassword) {
                confirmPasswordInput.type = 'text';
                confirmPasswordToggle.classList.add('showing');
                confirmPasswordToggle.title = 'Ocultar senha';
            } else {
                confirmPasswordInput.type = 'password';
                confirmPasswordToggle.classList.remove('showing');
                confirmPasswordToggle.title = 'Mostrar senha';
            }
        });
    }
}

// Função de cadastro
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (!username || !password || !confirmPassword) {
        showRegisterError('Dados incompletos. Verifique os campos obrigatórios.');
        return;
    }
    
    // Validar nome de usuário (apenas primeiro nome ou dois nomes)
    const nameParts = username.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0 || nameParts.length > 2) {
        showRegisterError('Formato de nome inválido. Use apenas primeiro nome ou dois nomes.');
        return;
    }
    
    // Validar se contém apenas letras e espaços
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!nameRegex.test(username)) {
        showRegisterError('Nome inválido. Use apenas letras e espaços.');
        return;
    }
    
    // Validar senha numérica
    const passwordRegex = /^\d{6,}$/;
    if (!passwordRegex.test(password)) {
        showRegisterError('Senha inválida. Mínimo de 6 dígitos numéricos.');
        return;
    }
    
    if (password !== confirmPassword) {
        showRegisterError('Confirmação de senha incorreta. Verifique os dados.');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.getElementById('confirmRegisterBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Criando...
    `;
    submitBtn.disabled = true;
    
    try {
        const result = await ipcRenderer.invoke('register', { 
            username: username.trim(),
            displayName: username.trim(), // Usar o username como displayName
            password 
        });
        
        if (result.success) {
            showRegisterSuccess('Conta criada com sucesso! Você pode fazer login agora.');
            setTimeout(() => {
                document.getElementById('registerModal').classList.remove('show');
                // Preencher campos de login
                document.getElementById('username').value = username.trim();
                document.getElementById('password').value = password;
            }, 2000);
        } else {
            showRegisterError(result.message || 'Falha ao criar conta. Contate o administrador se persistir.');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showRegisterError('Falha temporária no sistema. Entre em contato com o suporte técnico.');
    } finally {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Mostrar erro no modal de cadastro
function showRegisterError(message) {
    const errorDiv = document.getElementById('registerErrorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Mostrar sucesso no modal de cadastro
function showRegisterSuccess(message) {
    const errorDiv = document.getElementById('registerErrorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Ocultar erro do modal de cadastro
function hideRegisterError() {
    const errorDiv = document.getElementById('registerErrorMessage');
    errorDiv.style.display = 'none';
}

// Mostrar mensagem de erro
function showError(message) {
    const errorDiv = document.getElementById('error-message') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'error-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.className = 'success-message';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Criar div de mensagem se não existir
function createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        border-radius: 4px;
        text-align: center;
        font-size: 14px;
        display: none;
    `;
    
    const form = document.getElementById('loginForm');
    form.appendChild(errorDiv);
    
    return errorDiv;
}

// Configurar validação em tempo real para o cadastro
function setupRegisterValidation() {
    const usernameInput = document.getElementById('newUsername');
    const passwordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Validar nome de usuário
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            const value = usernameInput.value.trim();
            const nameParts = value.split(' ').filter(part => part.length > 0);
            const nameRegex = /^[a-zA-ZÀ-ÿ\s]*$/;
            
            if (value && !nameRegex.test(value)) {
                usernameInput.style.borderColor = '#e74c3c';
                showFieldError(usernameInput, 'Apenas letras são permitidas');
            } else if (value && (nameParts.length === 0 || nameParts.length > 2)) {
                usernameInput.style.borderColor = '#e74c3c';
                showFieldError(usernameInput, 'Use apenas primeiro nome ou dois nomes');
            } else {
                usernameInput.style.borderColor = '#2ecc71';
                hideFieldError(usernameInput);
            }
        });
    }
    
    // Validar senha
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const value = passwordInput.value;
            const passwordRegex = /^\d{6,}$/;
            
            if (value && !passwordRegex.test(value)) {
                passwordInput.style.borderColor = '#e74c3c';
                showFieldError(passwordInput, 'Apenas números, mínimo 6 dígitos');
            } else if (value && passwordRegex.test(value)) {
                passwordInput.style.borderColor = '#2ecc71';
                hideFieldError(passwordInput);
            } else {
                passwordInput.style.borderColor = '';
                hideFieldError(passwordInput);
            }
        });
    }
    
    // Validar confirmação de senha
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const passwordValue = passwordInput.value;
            const confirmValue = confirmPasswordInput.value;
            
            if (confirmValue && confirmValue !== passwordValue) {
                confirmPasswordInput.style.borderColor = '#e74c3c';
                showFieldError(confirmPasswordInput, 'Senhas não coincidem');
            } else if (confirmValue && confirmValue === passwordValue) {
                confirmPasswordInput.style.borderColor = '#2ecc71';
                hideFieldError(confirmPasswordInput);
            } else {
                confirmPasswordInput.style.borderColor = '';
                hideFieldError(confirmPasswordInput);
            }
        });
    }
}

// Mostrar erro de campo específico
function showFieldError(input, message) {
    let errorDiv = input.parentNode.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Ocultar erro de campo específico
function hideFieldError(input) {
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Função para configurar efeitos de ripple nos botões
function setupRippleEffects() {
    const buttons = document.querySelectorAll('.btn-login, .btn-register');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = this.querySelector('.btn-ripple');
            if (ripple) {
                // Criar efeito de ripple
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                const rippleElement = document.createElement('div');
                rippleElement.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    pointer-events: none;
                `;
                
                ripple.appendChild(rippleElement);
                
                setTimeout(() => {
                    rippleElement.remove();
                }, 600);
            }
        });
    });
    
    // Adicionar keyframes para animação de ripple
    if (!document.querySelector('#ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função para configurar animações das formas flutuantes
function setupFloatingShapes() {
    const shapesContainer = document.querySelector('.floating-shapes');
    if (!shapesContainer) return;
    
    // Adicionar movimento aleatório às formas
    const shapes = shapesContainer.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        const delay = index * 0.5;
        const duration = 8 + Math.random() * 4;
        
        shape.style.animationDelay = `${delay}s`;
        shape.style.animationDuration = `${duration}s`;
        
        // Adicionar movimento de mouse
        document.addEventListener('mousemove', (e) => {
            const rect = shape.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) * 0.01;
            const deltaY = (e.clientY - centerY) * 0.01;
            
            shape.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });
    });
}

// Função para configurar animações dos inputs
function setupInputAnimations() {
    const inputs = document.querySelectorAll('.input-group input');
    
    inputs.forEach(input => {
        // Efeito de foco suave
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Efeito de digitação
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.parentElement.classList.add('has-value');
            } else {
                this.parentElement.classList.remove('has-value');
            }
        });
    });
    
    // Adicionar estilos para os estados dos inputs
    if (!document.querySelector('#input-animations')) {
        const style = document.createElement('style');
        style.id = 'input-animations';
        style.textContent = `
            .input-group.focused .input-icon svg {
                transform: scale(1.1) rotate(5deg);
                stroke: #FF6B00;
            }
            
            .input-group.has-value input {
                border-color: #10b981;
            }
            
            .input-group.has-value .input-icon svg {
                stroke: #10b981;
            }
        `;
        document.head.appendChild(style);
    }
}