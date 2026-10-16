# Jornada de Bia V31.8 — Correção das estatísticas

## Correções
- Corrigido o primeiro clique no botão 📊: a visibilidade agora é calculada pela classe `active`, em vez de depender de um estilo inline vazio.
- Adicionada uma regra CSS específica para permitir que `#stats-section.active` apareça apesar da regra geral que oculta `.home-secondary-section`.
- O botão atualiza `aria-expanded` para refletir o estado da seção.
- A rotina de limpeza do histórico verifica o estado real da seção antes de atualizar a visualização.
- Cache do Service Worker atualizado para `jornada-bia-v31-8`, para que o navegador possa buscar os arquivos corrigidos.
- Versão do rodapé atualizada para V31.8.

## Preservação e validação
- A correção não apaga, migra ou redefine os dados do usuário.
- Mantidos os demais arquivos e funcionalidades da V31.7, incluindo a biometria experimental e o Random Forest.
- Integridade do ZIP e sintaxe JavaScript serão verificadas nesta entrega; ainda é necessário testar visualmente no navegador Android.
