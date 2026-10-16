# A Jornada de Bia — V30.1

## Foco
Estabilidade e navegação, preservando a V30 original e seu visual.

## Alterações
- Removida a dupla vinculação de eventos dos menus de navegação.
- A navegação dos menus usa o `click` nativo dos botões, evitando acionamento duplicado por teclado.
- Consolidada a configuração da voz para evitar listeners duplicados.
- Criado um mapa único e imutável de páginas (`PAGE_MAP`).
- Navegação inválida retorna para `Início` em vez de deixar a interface sem página ativa.
- Adicionada proteção caso o mapa de páginas e o HTML fiquem fora de sincronia.
- Nenhum arquivo da V30 original foi sobrescrito.

## Validação realizada
- Sintaxe JavaScript validada com `node --check` nos quatro módulos principais.
- Estrutura de navegação e IDs das páginas conferidos contra o HTML da V30.

## Próxima etapa
Testar manualmente no navegador/GitHub Pages todos os oito menus e, depois, seguir para a V30.2 (segurança e dados).


## V30.1-Security — proteção aplicada
- Limpeza limitada às chaves da Jornada de Bia.
- Validação de fotos por MIME/base64 e tamanho.
- Escape aplicado às frases rápidas dinâmicas.
- Remoção de dados pessoais dos logs.
- Backup versão 3 com limites adicionais de validação.
- Mantida a V30.1 original fora desta cópia.

## V30.1 — Segurança Avançada
- Adicionada expiração automática da sessão do Modo Responsável após 10 minutos de inatividade.
- Bloqueio ao retornar de uma aba mantida em segundo plano por tempo excedido.
- Eventos de interação renovam a sessão apenas quando o responsável está desbloqueado.
- Nova API local `JornadaBiaSecurity` para integração futura com limpeza de dados sensíveis.

## V30.1 — Backup Criptografado
- Backups completos e de configuração protegidos com AES-GCM-256.
- Derivação de chave por PBKDF2-SHA-256 com salt aleatório.
- Senha nunca é armazenada no aplicativo.
- Importação solicita a senha e rejeita alterações no conteúdo por autenticação criptográfica.

## Correção de segurança — backup protegido obrigatório
- Exportações exigem senha válida com pelo menos 8 caracteres.
- Cancelar a senha do backup pré-importação interrompe a importação sem gerar arquivo desprotegido.
