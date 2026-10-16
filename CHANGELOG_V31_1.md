
### V31.1.1 — limpeza de registro do PWA
- Removido o registro duplicado do Service Worker no `index.html`.
- Mantido um único ponto de registro em `js/app.js`, evitando inicialização redundante.
# Jornada de Bia — V31.1 — Estabilização

## Correções
- Corrigida a restauração visual da intenção selecionada na Home (`active`).
- Unificada a sessão do Modo Responsável entre `SecurityService` e a camada de timeout avançado.
- Timeout de 10 minutos agora acompanha a mesma sessão usada pelo aplicativo e bloqueia corretamente após expiração.
- Service Worker atualizado para cache V31.1 e inclui os módulos de segurança e criptografia necessários offline.
- Versão do rodapé, logs e metadados de backup atualizados para V31.1.
- README atualizado para refletir a versão e a arquitetura atuais.

## Princípio
Nenhuma alteração de layout ou fluxo da Home foi feita nesta versão. O objetivo é estabilizar a V31 antes de novos ajustes de experiência.
