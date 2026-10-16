# A Jornada de Bia — V30.2

## Organização da tela principal

- Mantido o visual existente da V30.1.
- Reorganizada a área principal de comunicação.
- Mantidos quatro cartões principais visíveis: Quero, Preciso, Como estou e Eu estou aqui.
- As sugestões ficam ocultas inicialmente.
- Ao tocar em Quero, Preciso ou Como estou, a área de sugestões se expande logo abaixo do cartão selecionado.
- As sugestões são específicas para a intenção escolhida.
- O botão Eu estou aqui permanece como ação direta e fala a frase imediatamente.
- Mantida a lógica de aprendizado local, registro de uso e síntese de voz.
- A antiga central adaptativa foi mantida no código e visualmente deslocada para uma área secundária da tela, evitando duplicação no foco inicial.

## Correção de identidade

- Nome oficial padronizado para **A Jornada de Bia** / **Jornada de Bia**.
- Corrigidos título da página, cabeçalho, metadados, manifest e mensagens internas.

## Segurança da alteração

- V30.1 utilizada como base.
- Arquivos originais preservados durante a implementação.
- JavaScript validado com `node --check`.
- HTML validado com parser HTML.
