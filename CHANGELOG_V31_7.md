# Jornada de Bia V31.7 — Biometria experimental

## Incluído
- Configuração e remoção de credencial WebAuthn de plataforma nas Configurações.
- Autenticação biométrica opcional para o Modo Responsável.
- PIN de quatro dígitos mantido como alternativa.
- Verificação local de challenge, origem, RP ID, presença/verificação do usuário e assinatura com ES256 ou RS256.
- Avisos de compatibilidade, HTTPS e limitações de segurança exibidos na interface e documentados.

## Limitações e validação
- A arquitetura continua inteiramente client-side. A validação local não substitui um servidor confiável para WebAuthn.
- A autenticação biométrica real precisa ser testada em HTTPS em cada navegador/aparelho alvo.
- Não foi realizada autenticação biométrica real no ambiente de empacotamento.
