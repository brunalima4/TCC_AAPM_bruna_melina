(function () {
    // 1. Verifica se o usuário logado é administrador
    if (localStorage.getItem('tipoUsuario') !== 'admin') {
        alert('Acesso restrito para administradores.');
        window.location.replace('logincadastro.html?modo=admin');
        return;
    }

    const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos em milissegundos
    const CHAVE_ULTIMA_ATIVIDADE = 'aapm_admin_ultima_atividade';
    let timerInatividade = null;
    let sessaoEncerrada = false;

    function encerrarSessaoPorInatividade() {
        if (sessaoEncerrada) return;
        sessaoEncerrada = true;

        localStorage.removeItem('token');
        localStorage.removeItem('tipoUsuario');
        localStorage.removeItem('nomeUsuario');
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem(CHAVE_ULTIMA_ATIVIDADE);

        alert('Seu tempo expirou por inatividade (30 minutos sem movimentação). Faça login novamente.');
        window.location.replace('logincadastro.html?modo=admin');
    }

    function verificarExpiracaoAcumulada() {
        const ultimaAtividade = parseInt(localStorage.getItem(CHAVE_ULTIMA_ATIVIDADE), 10);
        if (ultimaAtividade && (Date.now() - ultimaAtividade >= TEMPO_INATIVIDADE_MS)) {
            encerrarSessaoPorInatividade();
            return true;
        }
        return false;
    }

    function registrarAtividade() {
        if (sessaoEncerrada) return;
        if (verificarExpiracaoAcumulada()) return;

        localStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(Date.now()));

        clearTimeout(timerInatividade);
        timerInatividade = setTimeout(encerrarSessaoPorInatividade, TEMPO_INATIVIDADE_MS);
    }

    // Verifica ao carregar a página se já se passaram 30 minutos de inatividade
    if (!verificarExpiracaoAcumulada()) {
        registrarAtividade();
    }

    // Eventos que mantêm a sessão ativa enquanto o admin estiver mexendo no site
    const eventosAtividade = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    eventosAtividade.forEach(evento => {
        window.addEventListener(evento, registrarAtividade, { passive: true });
    });

    // Sincroniza a atividade entre múltiplas abas abertas
    window.addEventListener('storage', (e) => {
        if (e.key === CHAVE_ULTIMA_ATIVIDADE && e.newValue) {
            clearTimeout(timerInatividade);
            timerInatividade = setTimeout(encerrarSessaoPorInatividade, TEMPO_INATIVIDADE_MS);
        }
        if (e.key === 'tipoUsuario' && e.newValue !== 'admin') {
            window.location.replace('logincadastro.html?modo=admin');
        }
    });
})();