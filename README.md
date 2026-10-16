# A Jornada de Bia — v31.7

Home simplificada, estabilização de segurança, temas azul/rosa/verde com modo escuro e Random Forest experimental local.

## Estrutura
- `index.html`: estrutura da interface
- `css/style.css`: estilos extraídos sem alteração intencional
- `js/app.js`: lógica da aplicação
- `js/storage.js`: camada centralizada de persistência
- `js/security.js`: PIN com PBKDF2, sessão e bloqueio por tentativas
- `js/backup.js`: backup versionado, validação e integridade SHA-256
- `manifest.json`: configuração PWA
- `sw.js`: cache offline, versionamento e atualização do PWA

## Segurança
O PIN antigo em texto puro é migrado para PBKDF2-SHA-256 na primeira verificação. A sessão desbloqueada não fica mais persistida em `localStorage`.

Importante: como o app é client-side, isto não equivale a autenticação forte. Quem controla o dispositivo, o navegador ou os arquivos do app pode alterar o código. Para proteção de dados médicos contra um atacante local, a próxima etapa deve ser um cofre criptografado com chave derivada de uma senha do responsável e política clara de recuperação.

## Backups
- Backup completo
- Backup de configuração
- Backup automático de segurança antes da importação
- Validação de tamanho, estrutura, versão e integridade

## Publicação
Use GitHub Pages, HTTPS ou outro servidor web. Não abra o PWA diretamente com `file://`, pois Service Worker e APIs de origem segura dependem de uma origem web válida.

## V31.2 — tema e modelo experimental
- Tema Verde Pastel disponível no botão de tema.
- `js/random-forest.js` contém o classificador experimental de floresta aleatória.
- O modelo só participa das previsões quando há dados locais suficientes; a lógica anterior permanece como fallback.


## V31.4 — consolidação de segurança e interface
- Mantida a limpeza seletiva do armazenamento da Jornada de Bia.
- Encerrada a sessão de responsáveis durante a exclusão geral.
- Cache do Service Worker versionado como `jornada-bia-v31-4`.
- Preservado o tema Verde Pastel e o módulo experimental de Random Forest.
- Restauradas pequenas diferenças visuais e de estado de intenção que não faziam parte das melhorias visuais.
- A exclusão completa deve ser validada em navegador real antes do uso com dados importantes.


## V31.5 — identidade e aparência
- Subtítulo atualizado para: “Não é sobre ensinar alguém a falar. É sobre garantir que sua voz possa ser ouvida.”
- Configurações de aparência reorganizadas com seleção independente de cor (azul, rosa e verde) e modo escuro.
- Adicionado tema escuro verde com fundo preto e detalhes verdes.
- Preferência visual continua salva via StorageService e mantém compatibilidade com temas anteriores.
- Service Worker atualizado para o cache `jornada-bia-v31-5`.
- Testes sintáticos e estruturais executados; inspeção visual manual em navegador real continua recomendada.


## V31.6 — Random Forest experimental revisado
- Corrigida a leitura das variáveis de contexto: ambiente, horário e intenção agora são interpretados na ordem em que são gravados.
- Implementado bootstrap ponderado pela frequência de uso e seleção aleatória de atributos em cada divisão de árvore.
- Incluídas métricas diagnósticas de amostras, classes e acurácia out-of-bag (OOB), quando calculável.
- A confiança da previsão representa a proporção de votos das árvores; não é uma probabilidade calibrada.
- Adicionados testes automatizados com dados sintéticos; esses resultados não representam desempenho real com dados da Jornada de Bia.
- O modelo permanece local e experimental, com fallback para a previsão já existente.


## V31.7 — biometria experimental no navegador
- Adicionada opção para configurar/remover credencial WebAuthn com autenticador de plataforma e verificação de usuário obrigatória, quando suportado.
- O Modo Responsável pode tentar autenticar por biometria e mantém o PIN como alternativa.
- A chave pública e o identificador da credencial ficam armazenados localmente; a biometria não é lida nem enviada pela aplicação.
- Requer origem segura (HTTPS ou localhost) e navegador/aparelho compatíveis. Credenciais WebAuthn são vinculadas à origem; mudar domínio pode exigir novo registro.
- Limitação essencial: esta versão é client-side e verifica localmente uma assinatura WebAuthn. Não equivale à autenticação WebAuthn validada por um servidor confiável e não protege contra alteração do código/armazenamento local. Não usar como única proteção de dados sensíveis.
- O PIN existente permanece como alternativa; remover a credencial biométrica não remove o PIN nem os dados da aplicação.
- Testes reais em aparelhos e navegadores continuam necessários; não foi possível executar cerimônia biométrica neste ambiente de desenvolvimento.


## V31.8 — Correção das estatísticas
Corrige a abertura/fechamento da seção Estatísticas pelo botão 📊. Consulte `CHANGELOG_V31_8.md`.
