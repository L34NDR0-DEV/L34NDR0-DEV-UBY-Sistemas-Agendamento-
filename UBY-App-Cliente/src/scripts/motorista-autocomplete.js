/**
 * Sistema de autocomplete para motoristas
 * Integra com o MotoristaManager para sugerir nomes baseados na cidade
 */

class MotoristaAutocomplete {
    constructor() {
        this.currentInput = null;
        this.currentSuggestions = null;
        this.selectedIndex = -1;
        this.isVisible = false;
        
        this.init();
    }

    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Setup para o formulário principal
        this.setupInputEvents('motorista', 'motoristaSuggestions', 'cidade');
        
        // Setup para o modal de edição
        this.setupInputEvents('editMotorista', 'editMotoristaSuggestions', 'editCidade');
        
        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-container')) {
                this.hideSuggestions();
            }
        });
    }

    setupInputEvents(inputId, suggestionsId, cidadeId) {
        const input = document.getElementById(inputId);
        const suggestions = document.getElementById(suggestionsId);
        const cidadeSelect = document.getElementById(cidadeId);

        if (!input || !suggestions || !cidadeSelect) return;

        // Eventos do input
        input.addEventListener('input', (e) => {
            this.handleInput(e, suggestions, cidadeSelect);
        });

        input.addEventListener('keydown', (e) => {
            this.handleKeydown(e, suggestions);
        });

        input.addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                this.handleInput(e, suggestions, cidadeSelect);
            }
        });

        // Evento de mudança de cidade
        cidadeSelect.addEventListener('change', () => {
            if (input.value.trim()) {
                this.showSuggestions(input, suggestions, cidadeSelect.value, input.value);
            }
        });
    }

    handleInput(event, suggestionsContainer, cidadeSelect) {
        const input = event.target;
        const value = input.value.trim();
        const cidade = cidadeSelect.value;

        if (!cidade) {
            this.hideSuggestions();
            return;
        }

        if (value.length === 0) {
            this.hideSuggestions();
            return;
        }

        this.showSuggestions(input, suggestionsContainer, cidade, value);
    }

    showSuggestions(input, suggestionsContainer, cidade, searchTerm) {
        if (!window.motoristaManager) {
            console.warn('MotoristaManager não encontrado');
            return;
        }

        this.currentInput = input;
        this.currentSuggestions = suggestionsContainer;
        this.selectedIndex = -1;

        // Buscar motoristas
        const motoristas = window.motoristaManager.buscarMotoristas(cidade, searchTerm);
        
        if (motoristas.length === 0) {
            this.hideSuggestions();
            return;
        }

        // Criar HTML das sugestões
        const suggestionsHTML = motoristas.map((motorista, index) => {
            return `
                <div class="autocomplete-suggestion" data-index="${index}" data-nome="${motorista.nome}">
                    <i class="fas fa-id-card suggestion-icon"></i>
                    <span class="suggestion-text">${motorista.nome}</span>
                    <span class="suggestion-city">${cidade}</span>
                </div>
            `;
        }).join('');

        suggestionsContainer.innerHTML = suggestionsHTML;
        suggestionsContainer.classList.add('show');
        this.isVisible = true;

        // Adicionar eventos de clique
        suggestionsContainer.querySelectorAll('.autocomplete-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                this.selectSuggestion(suggestion.dataset.nome);
            });
        });
    }

    hideSuggestions() {
        if (this.currentSuggestions) {
            this.currentSuggestions.classList.remove('show');
            this.currentSuggestions.innerHTML = '';
        }
        this.isVisible = false;
        this.selectedIndex = -1;
    }

    handleKeydown(event, suggestionsContainer) {
        if (!this.isVisible) return;

        const suggestions = suggestionsContainer.querySelectorAll('.autocomplete-suggestion');
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, suggestions.length - 1);
                this.updateSelection(suggestions);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection(suggestions);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0 && suggestions[this.selectedIndex]) {
                    const selectedName = suggestions[this.selectedIndex].dataset.nome;
                    this.selectSuggestion(selectedName);
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    updateSelection(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === this.selectedIndex);
        });
    }

    selectSuggestion(nome) {
        if (this.currentInput) {
            this.currentInput.value = nome;
            
            // Disparar evento de mudança
            const changeEvent = new Event('change', { bubbles: true });
            this.currentInput.dispatchEvent(changeEvent);
        }
        
        this.hideSuggestions();
    }

    /**
     * Salva um novo motorista quando o formulário é submetido
     * @param {string} cidade - Cidade selecionada
     * @param {string} nomeMotorista - Nome do motorista
     */
    salvarMotorista(cidade, nomeMotorista) {
        if (!window.motoristaManager || !cidade || !nomeMotorista) return;
        
        window.motoristaManager.adicionarMotorista(cidade, nomeMotorista);
    }

    /**
     * Obtém todos os motoristas de uma cidade para exibição
     * @param {string} cidade - Nome da cidade
     * @returns {Array} Lista de motoristas
     */
    getMotoristasDaCidade(cidade) {
        if (!window.motoristaManager || !cidade) return [];
        
        return window.motoristaManager.getMotoristasPorCidade(cidade);
    }
}

// Instância global
window.motoristaAutocomplete = new MotoristaAutocomplete();

// Exporta para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotoristaAutocomplete;
}