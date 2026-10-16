'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'js', 'random-forest.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'random-forest.js' });
const RandomForest = sandbox.window.JornadaRandomForest;

const records = {
  'casa|manhã|quero|agua': { text: 'Quero água', count: 4, seq: 'agua' },
  'casa|tarde|quero|agua': { text: 'Quero água', count: 3, seq: 'agua' },
  'casa|noite|quero|agua': { text: 'Quero água', count: 2, seq: 'agua' },
  'casa|manhã|quero|beber,agua': { text: 'Quero água', count: 2, seq: 'beber,agua' },
  'escola|manhã|ajuda|ajuda': { text: 'Preciso de ajuda', count: 4, seq: 'ajuda' },
  'escola|tarde|ajuda|ajuda': { text: 'Preciso de ajuda', count: 3, seq: 'ajuda' },
  'escola|noite|ajuda|socorro': { text: 'Preciso de ajuda', count: 2, seq: 'socorro' },
  'medico|tarde|ajuda|dor': { text: 'Preciso de ajuda', count: 3, seq: 'dor' },
  'passeio|tarde|quero|brincar': { text: 'Quero brincar', count: 3, seq: 'brincar' },
  'passeio|manhã|quero|brincar,bola': { text: 'Quero brincar', count: 2, seq: 'brincar,bola' },
  'casa|tarde|quero|brincar': { text: 'Quero brincar', count: 2, seq: 'brincar' },
  'escola|manhã|quero|brincar': { text: 'Quero brincar', count: 1, seq: 'brincar' }
};

const rf = new RandomForest({ trees: 31, seed: 731 });
const metrics = rf.train(records);
assert.equal(metrics.ready, true, 'deve treinar com amostras suficientes e múltiplas classes');
assert.equal(metrics.samples, 12, 'deve contar registros válidos únicos');
assert.equal(metrics.classes, 3, 'deve identificar as três classes');
assert.ok(metrics.weightedSamples >= metrics.samples, 'deve considerar o peso de frequência');
assert.ok(metrics.oobAccuracy === null || (metrics.oobAccuracy >= 0 && metrics.oobAccuracy <= 1), 'métrica OOB deve estar entre 0 e 1');
const prediction = rf.predict('casa|manhã|quero|agua', { seq: 'agua' });
assert.ok(prediction && typeof prediction.text === 'string', 'deve produzir previsão');
assert.equal(prediction.trees, 31, 'deve usar o número configurado de árvores');
assert.ok(prediction.confidence >= 0 && prediction.confidence <= 1, 'confiança deve ser proporção de votos');

const sameSeed = new RandomForest({ trees: 31, seed: 731 });
sameSeed.train(records);
assert.deepEqual(sameSeed.predict('casa|manhã|quero|agua', { seq: 'agua' }), prediction, 'mesma semente deve reproduzir o resultado');

const insufficient = new RandomForest({ trees: 9 });
assert.equal(insufficient.train({ only: { text: 'Uma frase', count: 1 } }).ready, false, 'não deve treinar com poucas amostras');
const oneClass = new RandomForest();
assert.equal(oneClass.train({ a: { text: 'A' }, b: { text: 'A' }, c: { text: 'A' }, d: { text: 'A' }, e: { text: 'A' } }).ready, false, 'não deve treinar com uma única classe');
assert.equal(insufficient.predict('casa|manhã|quero|agua'), null, 'modelo não treinado deve retornar null');

console.log(JSON.stringify({ ok: true, metrics, prediction }, null, 2));
