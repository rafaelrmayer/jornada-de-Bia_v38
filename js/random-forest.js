/* Jornada de Bia v31.6 — Random Forest categórico experimental.
 * Treina apenas com registros locais de contexto; não transmite dados.
 * A confiança é a proporção de votos das árvores, não uma probabilidade calibrada.
 */
(function (global) {
  'use strict';

  class JornadaRandomForest {
    constructor(options = {}) {
      this.trees = Math.max(3, Math.min(51, Math.floor(Number(options.trees) || 9)));
      const requestedSeed = Number(options.seed);
      this.seed = Number.isFinite(requestedSeed) ? ((requestedSeed >>> 0) || 731) : 731;
      this.model = [];
      this.labels = [];
      this.featuresList = ['environment', 'time', 'intent', 'sequence', 'symbolCount', 'firstSymbol', 'lastSymbol'];
      this.metrics = { ready: false, samples: 0, weightedSamples: 0, classes: 0, oobAccuracy: null };
    }

    random() {
      this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
      return this.seed / 4294967296;
    }

    features(key, row = {}) {
      const parts = String(key || '').split('|');
      const sequenceFromKey = parts.slice(3).join('|');
      const sequence = sequenceFromKey || String(row.seq || 'none');
      const symbols = sequence === 'none' ? [] : sequence.split(',').filter(Boolean);
      return {
        environment: parts[0] || 'auto',
        time: parts[1] || 'desconhecido',
        intent: parts[2] || 'nenhuma',
        sequence,
        symbolCount: String(symbols.length),
        firstSymbol: symbols[0] || 'none',
        lastSymbol: symbols[symbols.length - 1] || 'none'
      };
    }

    train(records) {
      const data = [];
      for (const [key, row] of Object.entries(records || {})) {
        if (!row || typeof row !== 'object' || typeof row.text !== 'string' || !row.text.trim()) continue;
        const rawCount = Number(row.count);
        const weight = Math.max(1, Math.min(8, Number.isFinite(rawCount) ? rawCount : 1));
        data.push({ id: data.length, x: this.features(key, row), y: row.text.trim(), weight });
      }

      this.model = [];
      this.labels = [...new Set(data.map(item => item.y))];
      const weightedSamples = data.reduce((sum, item) => sum + item.weight, 0);
      this.metrics = { ready: false, samples: data.length, weightedSamples, classes: this.labels.length, oobAccuracy: null };
      if (data.length < 5 || this.labels.length < 2) return this.metrics;

      const oobVotes = new Map(data.map(item => [item.id, {}]));
      for (let t = 0; t < this.trees; t++) {
        const sample = [];
        const inBag = new Set();
        const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
        for (let i = 0; i < data.length; i++) {
          let draw = this.random() * totalWeight;
          let chosen = data[data.length - 1];
          for (const item of data) {
            draw -= item.weight;
            if (draw < 0) { chosen = item; break; }
          }
          sample.push(chosen);
          inBag.add(chosen.id);
        }
        const tree = this.buildTree(sample, 0);
        this.model.push(tree);

        for (const item of data) {
          if (inBag.has(item.id)) continue;
          const label = this.predictTree(tree, item.x);
          if (label) {
            const votes = oobVotes.get(item.id);
            votes[label] = (votes[label] || 0) + 1;
          }
        }
      }

      let evaluated = 0, correct = 0;
      for (const item of data) {
        const votes = oobVotes.get(item.id);
        const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
        if (!ranked.length) continue;
        evaluated++;
        if (ranked[0][0] === item.y) correct++;
      }
      this.metrics = {
        ready: true,
        samples: data.length,
        weightedSamples,
        classes: this.labels.length,
        oobAccuracy: evaluated ? correct / evaluated : null,
        oobEvaluated: evaluated
      };
      return this.metrics;
    }

    buildTree(rows, depth) {
      const counts = {};
      rows.forEach(row => { counts[row.y] = (counts[row.y] || 0) + 1; });
      const majority = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      if (depth >= 5 || Object.keys(counts).length === 1 || rows.length < 4) return { label: majority };

      const candidateFeatures = this.featuresList.slice();
      for (let i = candidateFeatures.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [candidateFeatures[i], candidateFeatures[j]] = [candidateFeatures[j], candidateFeatures[i]];
      }
      const featureCount = Math.max(1, Math.floor(Math.sqrt(this.featuresList.length)));
      const chosenFeatures = candidateFeatures.slice(0, featureCount);
      let best = null, bestScore = Infinity;

      for (const feature of chosenFeatures) {
        const groups = {};
        rows.forEach(row => {
          const value = String(row.x[feature] ?? '?');
          (groups[value] || (groups[value] = [])).push(row);
        });
        if (Object.keys(groups).length < 2) continue;
        let score = 0;
        for (const group of Object.values(groups)) {
          const groupCounts = {};
          group.forEach(row => { groupCounts[row.y] = (groupCounts[row.y] || 0) + 1; });
          let entropy = 0;
          for (const count of Object.values(groupCounts)) {
            const p = count / group.length;
            entropy -= p * Math.log2(p);
          }
          score += (group.length / rows.length) * entropy;
        }
        if (score < bestScore) { bestScore = score; best = { feature, groups }; }
      }

      if (!best) return { label: majority };
      const branches = {};
      for (const [value, group] of Object.entries(best.groups)) branches[value] = this.buildTree(group, depth + 1);
      return { feature: best.feature, branches, label: majority };
    }

    predictTree(tree, features) {
      let node = tree;
      while (node && node.feature) {
        node = node.branches[String(features[node.feature] ?? '?')] || { label: node.label };
      }
      return node && node.label ? node.label : null;
    }

    predict(key, row = {}) {
      if (!this.model.length) return null;
      const features = this.features(key, row);
      const votes = {};
      for (const tree of this.model) {
        const label = this.predictTree(tree, features);
        if (label) votes[label] = (votes[label] || 0) + 1;
      }
      const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
      return ranked.length ? {
        text: ranked[0][0],
        confidence: ranked[0][1] / this.model.length,
        trees: this.model.length,
        votes: ranked.map(([text, count]) => ({ text, count }))
      } : null;
    }
  }

  global.JornadaRandomForest = JornadaRandomForest;
})(window);
