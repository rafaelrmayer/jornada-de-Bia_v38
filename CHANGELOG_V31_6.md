# Jornada de Bia — V31.6

## Random Forest experimental
- Corrigida a interpretação das variáveis do contexto (`ambiente | horário | intenção | sequência`).
- Substituída a amostragem expandida de frequências por bootstrap ponderado de registros únicos.
- Adicionada seleção aleatória de atributos em cada divisão de árvore, tornando o conjunto mais próximo de um Random Forest clássico.
- Adicionadas métricas diagnósticas de amostras válidas, amostras ponderadas, classes e acurácia out-of-bag (OOB), quando houver previsões OOB.
- A confiança exibida pelo classificador é a fração de votos, não uma probabilidade calibrada.
- Mantido o fallback para o mecanismo de previsão existente caso o modelo não esteja pronto ou ocorra uma falha.
- Incluídos testes automatizados com conjunto sintético cobrindo treino, previsão, reprodutibilidade e amostras insuficientes.
- Atualizado o cache do Service Worker para `jornada-bia-v31-6`.

## Limites da validação
Os testes sintéticos verificam o comportamento do código, não a qualidade das previsões em uso real. Antes de interpretar o modelo como confiável, será necessário avaliar dados representativos, métricas adequadas e possíveis vieses, respeitando a privacidade e o consentimento.
