
        // ============================================
        // SEGURANÇA: SANITIZAÇÃO DE TEXTO PARA HTML
        // ============================================
        // Qualquer texto vindo de campos livres (nome de responsável, rótulo
        // de símbolo, observações, etc.) passa por aqui antes de entrar em
        // innerHTML ou em atributos, evitando HTML/JS injetado no app.
        function escapeHtml(value) {
            if (value === null || value === undefined) return '';
            return String(value).replace(/[&<>"']/g, (ch) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[ch]));
        }

        SecurityService.migrateLegacyPin();

        // ============================================
        // DADOS DOS SÍMBOLOS (PADRÃO)
        // ============================================
        const defaultSymbols = [
            { id: 'comer', emoji: '🍽️', label: 'Comer', category: 'comer' },
            { id: 'agua', emoji: '🥤', label: 'Beber água', category: 'comer' },
            { id: 'suco', emoji: '🧃', label: 'Suco', category: 'comer' },
            { id: 'pizza', emoji: '🍕', label: 'Pizza', category: 'comer' },
            { id: 'banheiro', emoji: '🚽', label: 'Banheiro', category: 'acoes' },
            { id: 'dormir', emoji: '😴', label: 'Dormir', category: 'acoes' },
            { id: 'brincar', emoji: '🎮', label: 'Brincar', category: 'acoes' },
            { id: 'banho', emoji: '🛁', label: 'Tomar banho', category: 'acoes' },
            { id: 'passear', emoji: '🚶', label: 'Passear', category: 'acoes' },
            { id: 'escola', emoji: '📚', label: 'Escola', category: 'objetos' },
            { id: 'casa', emoji: '🏠', label: 'Casa', category: 'objetos' },
            { id: 'carro', emoji: '🚗', label: 'Carro', category: 'objetos' },
            { id: 'musica', emoji: '🎵', label: 'Música', category: 'objetos' },
            { id: 'familia', emoji: '👨‍👩‍👧', label: 'Família', category: 'objetos' },
            { id: 'medico', emoji: '🏥', label: 'Médico', category: 'objetos' },
            { id: 'feliz', emoji: '😊', label: 'Feliz', category: 'sentimentos' },
            { id: 'triste', emoji: '😢', label: 'Triste', category: 'sentimentos' },
            { id: 'cansado', emoji: '😫', label: 'Cansado', category: 'sentimentos' },
            { id: 'fome', emoji: '🍕', label: 'Com fome', category: 'sentimentos' },
            { id: 'sede', emoji: '💧', label: 'Com sede', category: 'sentimentos' },
            { id: 'love', emoji: '❤️', label: 'Amo você', category: 'sentimentos' },
        ];

        const categories = [
            { id: 'all', emoji: '📋', label: 'Todos' },
            { id: 'comer', emoji: '🍽️', label: 'Comer' },
            { id: 'sentimentos', emoji: '😊', label: 'Sentimentos' },
            { id: 'acoes', emoji: '🏃', label: 'Ações' },
            { id: 'objetos', emoji: '🎨', label: 'Objetos' },
        ];

        // Carrega símbolos do localStorage ou usa os padrão
        let symbolsData = JSON.parse(StorageService.getItem('symbolsData') || JSON.stringify(defaultSymbols));

        // ============================================
        // DADOS DOS RESPONSÁVEIS (COMEÇA VAZIO)
        // ============================================
        const defaultGuardians = [];
        let guardians = JSON.parse(StorageService.getItem('guardians') || JSON.stringify(defaultGuardians));
        let editingGuardianId = null;
        let editingSymbolId = null;

        // ============================================
        // DADOS MÉDICOS (NOVA VERSÃO)
        // ============================================
        const defaultMedical = {
            healthPlan: '',
            supportLevel: '',
            allergies: [],
            observations: '',
            sensoryPreferences: {
                sound: false, light: false, touch: false, smells: false, crowds: false, fabrics: false,
                helps: []
            }
        };

        const healthPlanOptions = [
            'Unimed',
            'Amil',
            'Bradesco Saúde',
            'SulAmérica',
            'NotreDame Intermédica',
            'Hapvida',
            'GNDI',
            'Golden Cross',
            'Medial Saúde',
            'Biovida',
            'Real Saúde',
            'Santa Helena',
            'Nenhum plano de saúde',
            'Outro'
        ];

        const allergiesOptions = [
            'Nenhuma alergia conhecida',
            'Alergia a medicamentos',
            'Alergia a amendoim',
            'Alergia a frutos do mar',
            'Alergia a ovos',
            'Alergia a látex',
            'Alergia a picadas de insetos',
            'Asma',
            'Dermatite',
            'Alergia ao pólen',
            'Alergia ao leite',
            'Alergia ao glúten',
            'Outra alergia'
        ];

        let medicalData = JSON.parse(StorageService.getItem('medicalData') || JSON.stringify(defaultMedical));

        // ============================================
        // IA: PREDITOR DE SÍMBOLOS (COM LIMPEZA DE REFERÊNCIAS)
        // ============================================
        class SymbolPredictor {
            constructor() {
                this.sequences = [];
                this.frequency = {};
                this.phraseUsage = {};
                this.interactions = 0;
                this.loadFromStorage();
            }
            loadFromStorage() {
                try {
                    const saved = StorageService.getItem('predictorData');
                    if (saved) {
                        const data = JSON.parse(saved);
                        this.sequences = data.sequences || [];
                        this.frequency = data.frequency || {};
                        this.phraseUsage = data.phraseUsage || {};
                        this.interactions = Number(data.interactions || 0);
                    }
                    this.cleanOrphanReferences();
                } catch(e) {}
            }
            cleanOrphanReferences() {
                const validIds=new Set(symbolsData.map(s=>s.id));
                this.sequences=this.sequences.filter(seq=>String(seq.sequence||'').split('|').every(id=>validIds.has(id)));
                const clean={};
                Object.entries(this.frequency).forEach(([k,v])=>{if(k.split('|').every(id=>validIds.has(id)))clean[k]=v;});
                this.frequency=clean;
                this.saveToStorage();
            }
            saveToStorage() {
                try { StorageService.setItem('predictorData',JSON.stringify({sequences:this.sequences.slice(-300),frequency:this.frequency,phraseUsage:this.phraseUsage,interactions:this.interactions})); } catch(e) {}
            }
            recordSequence(symbols) {
                if(!symbols.length)return;
                this.interactions++;
                const ids=symbols.map(s=>s.id);
                for(let n=1;n<=Math.min(3,ids.length-1);n++){
                    for(let i=0;i+n<ids.length;i++){
                        const key=ids.slice(i,i+n+1).join('|');
                        this.frequency[key]=(this.frequency[key]||0)+1;
                    }
                }
                if(ids.length>=2){
                    const seq=ids.join('|');
                    this.sequences.push({sequence:seq,timestamp:Date.now(),hour:new Date().getHours()});
                    if(this.sequences.length>300)this.sequences.shift();
                }
                this.saveToStorage(); this.updateStats();
            }
            recordPhrase(text){
                if(!text)return;
                this.phraseUsage[text]=(this.phraseUsage[text]||0)+1;
                this.interactions++;
                this.saveToStorage(); this.updateStats();
            }
            scoreCandidate(id,currentIds) {
                let score=0;
                const key=currentIds.length ? currentIds.join('|')+'|'+id : id;
                score+=(this.frequency[key]||0)*8;
                const pair=currentIds.length ? currentIds[currentIds.length-1]+'|'+id : '';
                score+=(this.frequency[pair]||0)*4;
                const now=new Date().getHours();
                for(const seq of this.sequences){
                    if(seq.hour!==now)continue;
                    const parts=String(seq.sequence).split('|');
                    if(currentIds.length && parts.slice(0,currentIds.length).join('|')===currentIds.join('|') && parts[currentIds.length]===id)score+=6;
                }
                score+=(symbolUsage[id]||0)*0.25;
                return score;
            }
            predictNext(currentSymbols,limit=5){
                const currentIds=currentSymbols.map(s=>s.id);
                const candidates=symbolsData.filter(s=>!currentIds.includes(s.id));
                return candidates.map(s=>({symbol:s,score:this.scoreCandidate(s.id,currentIds)}))
                    .sort((a,b)=>b.score-a.score)
                    .slice(0,limit).map(x=>x.symbol);
            }
            getMostUsed(limit=5){
                return symbolsData.map(s=>({s,score:(symbolUsage[s.id]||0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.s);
            }
            getPatternsCount(){return this.sequences.length;}
            getTopSymbols(limit=6){return this.getMostUsed(limit);}
            getPhraseStats(){return Object.entries(this.phraseUsage).sort((a,b)=>b[1]-a[1]);}
            reset(){this.sequences=[];this.frequency={};this.phraseUsage={};this.interactions=0;this.saveToStorage();this.updateStats();}
            updateStats(){
                const p=document.getElementById('patternsLearned');if(p)p.textContent=this.sequences.length;
                const i=document.getElementById('learningInteractions');if(i)i.textContent=this.interactions;
                const q=document.getElementById('learningSequences');if(q)q.textContent=this.sequences.length;
                const ph=document.getElementById('learningPhrases');if(ph)ph.textContent=this.getPhraseStats().reduce((a,b)=>a+b[1],0);
                const fb=JSON.parse(StorageService.getItem('aiFeedback')||'{}');const total=(fb.like||0)+(fb.dislike||0);const pct=total?Math.round((fb.like||0)/total*100):0;const f=document.getElementById('learningFeedback');if(f)f.textContent=pct+'%';
                const top=document.getElementById('learningTopList');if(top){const arr=this.getTopSymbols(6);top.innerHTML=arr.length?arr.map(s=>`<span class="learning-chip">${escapeHtml(s.emoji)} ${escapeHtml(s.label)}</span>`).join(''):'<span style="font-size:.78rem;color:var(--text-light);font-weight:600;">Ainda aprendendo seus padrões…</span>';}
            }
        }

        // ============================================
        // IA: ANALISADOR DE CONTEXTO
        // ============================================
        class ContextAnalyzer {
            constructor() {
                this.contexts = {
                    'comer': ['🍽️', '🥤', '🧃', '🍕', '🍪'],
                    'higiene': ['🚽', '🛁', '🚶'],
                    'emocional': ['😊', '😢', '😫', '❤️', '😍'],
                    'atividades': ['🎮', '📚', '🎵', '🏃'],
                    'social': ['👨‍👩‍👧', '🏠', '🚗']
                };
                this.currentContext = null;
                this.contextConfidence = 0;
            }
            analyzeContext(selectedSymbols) {
                if (selectedSymbols.length === 0) {
                    this.currentContext = null;
                    this.contextConfidence = 0;
                    return null;
                }
                const contextScores = {};
                const lastSymbols = selectedSymbols.slice(-3);
                for (const [context, emojis] of Object.entries(this.contexts)) {
                    let score = 0;
                    for (const symbol of lastSymbols) {
                        if (emojis.includes(symbol.emoji)) score += 1;
                    }
                    if (lastSymbols.length > 0) {
                        const lastEmoji = lastSymbols[lastSymbols.length - 1].emoji;
                        if (emojis.includes(lastEmoji)) score += 2;
                    }
                    contextScores[context] = score / (lastSymbols.length + 2);
                }
                let bestContext = null;
                let bestScore = 0;
                for (const [context, score] of Object.entries(contextScores)) {
                    if (score > bestScore) {
                        bestScore = score;
                        bestContext = context;
                    }
                }
                this.currentContext = bestContext;
                this.contextConfidence = bestScore;
                return { context: bestContext, confidence: bestScore };
            }
            getContextSuggestions(selectedSymbols, limit = 2) {
                const context = this.analyzeContext(selectedSymbols);
                if (!context || context.confidence < 0.2) return [];
                const emojis = this.contexts[context.context] || [];
                return symbolsData
                    .filter(s => emojis.includes(s.emoji))
                    .filter(s => !selectedSymbols.find(sel => sel.id === s.id))
                    .slice(0, limit);
            }
        }

        // ============================================
        // IA: GERADOR DE FRASES
        // ============================================
        class PhraseGenerator {
            constructor() {
                this.templates = {
                    comer: ['Eu quero comer {0}.','Estou com fome. Quero {0}.'],
                    higiene: ['Eu quero ir ao banheiro.','Preciso de ajuda para ir ao banheiro.'],
                    emocional: ['Estou me sentindo {0}.','Eu estou {0}.'],
                    atividades: ['Eu quero {0}.','Quero brincar com {0}.'],
                    social: ['Quero falar com {0}.','Quero ficar com {0}.'],
                    objetos: ['Eu quero {0}.','Me dá {0}, por favor.']
                };
            }
            generatePhrase(symbols) {
                if (!symbols.length) return null;
                const labels=symbols.map(s=>String(s.label||'').trim());
                const lower=labels.map(x=>x.toLowerCase());
                const context=contextAnalyzer.analyzeContext(symbols);
                let phrase='';
                const has=(...words)=>words.some(w=>lower.some(x=>x===w||x.includes(w)));
                if (has('não quero','nao quero','não','nao')) phrase='Eu não quero isso.';
                else if (has('ajuda','socorro')) phrase='Eu preciso de ajuda.';
                else if (has('dor','dói','doi')) phrase=labels.length>1?`Estou com dor em ${labels[labels.length-1]}.`:'Estou com dor.';
                else if (has('água','agua')) phrase='Eu quero água.';
                else if (has('comer','comida','fome')) phrase=labels.length>1?`Eu quero comer ${labels[labels.length-1]}.`:'Eu quero comer.';
                else if (has('casa')) phrase='Eu quero ir para casa.';
                else if (has('banheiro')) phrase='Eu quero ir ao banheiro.';
                else if (has('feliz','triste','cansado','bravo','medo')) phrase=`Estou ${labels[labels.length-1].toLowerCase()}.`;
                else if (labels.length===1) phrase=labels[0];
                else if (context && context.context==='social') phrase=`Quero falar com ${labels[labels.length-1]}.`;
                else phrase=`Eu quero ${labels[labels.length-1].toLowerCase()}.`;
                phrase=phrase.replace(/\s+/g,' ').replace(/\.\./g,'.').trim();
                return {text:phrase,emojis:symbols.map(s=>s.emoji).join(' '),symbols};
            }
        }

        // ============================================
        // V18: IA DE COMUNICAÇÃO PREDITIVA
        // ============================================
        class PredictivePhraseEngine {
            constructor(){
                this.data={};
                this.load();
            }
            load(){
                try{ this.data=JSON.parse(StorageService.getItem('predictivePhraseData')||'{}')||{}; }catch(e){this.data={};}
            }
            save(){
                try{
                    const entries=Object.entries(this.data).sort((a,b)=>b[1].count-a[1].count).slice(0,500);
                    this.data=Object.fromEntries(entries);
                    StorageService.setItem('predictivePhraseData',JSON.stringify(this.data));
                }catch(e){}
            }
            normalize(text){return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
            key(ids){return ids.join('|');}
            learn(symbols,text){
                if(!symbols?.length || !text)return;
                const ids=symbols.map(s=>s.id);
                const hours=[new Date().getHours()];
                const key=this.key(ids);
                const old=this.data[key]||{count:0,text:text,emoji:symbols.map(s=>s.emoji).join(' '),hours:[]};
                old.count++;
                old.text=text;
                old.emoji=symbols.map(s=>s.emoji).join(' ');
                old.hours=Array.isArray(old.hours)?old.hours:[];
                old.hours.push(hours[0]); if(old.hours.length>30)old.hours.shift();
                old.contexts=old.contexts||{}; const ctxEnv=contextBrain?.environment||'auto'; const ctx=contextAnalyzer?.analyzeContext(symbols)?.context||'auto'; const env=ctxEnv==='auto'?ctx:ctxEnv; const h=hours[0]>=6&&hours[0]<11?'manhã':hours[0]>=11&&hours[0]<15?'almoco':hours[0]>=15&&hours[0]<19?'tarde':'noite'; const ck=[env,h,selectedIntent||'nenhuma'].join('|'); old.contexts[ck]=(old.contexts[ck]||0)+1;
                this.data[key]=old; this.save();
            }
            similarity(a,b){
                let same=0; const n=Math.min(a.length,b.length);
                for(let i=0;i<n;i++)if(a[i]===b[i])same++; 
                return n?same/n:0;
            }
            suggest(selected,limit=3){
                const ids=selected.map(s=>s.id); const now=new Date().getHours();
                const rows=[];
                for(const [key,v] of Object.entries(this.data)){
                    const seq=key.split('|');
                    if(seq.length<2 || ids.length>=seq.length)continue;
                    const prefix=seq.slice(0,ids.length);
                    if(ids.length && prefix.join('|')!==ids.join('|'))continue;
                    const hourBonus=Array.isArray(v.hours)&&v.hours.includes(now)?2:0;
                    const score=(v.count*3)+hourBonus+(ids.length*2);
                    const symbols=seq.map(id=>symbolsData.find(s=>s.id===id)).filter(Boolean);
                    if(symbols.length===seq.length)rows.push({text:v.text,emoji:v.emoji,symbols,score,count:v.count});
                }
                return rows.sort((a,b)=>b.score-a.score).slice(0,limit);
            }
            suggestContextual(selected,environment,timeLabel,intent,limit=3){
                const ids=selected.map(s=>s.id), now=new Date().getHours(), bucket=(now>=6&&now<11?'manhã':now>=11&&now<15?'almoco':now>=15&&now<19?'tarde':'noite');
                const env=environment==='auto'?(contextAnalyzer.analyzeContext(selected)?.context||'auto'):environment;
                const rows=[];
                for(const [key,v] of Object.entries(this.data)){
                    const seq=key.split('|'); if(seq.length<2 || ids.length>=seq.length)continue;
                    if(ids.length && seq.slice(0,ids.length).join('|')!==ids.join('|'))continue;
                    const h=Array.isArray(v.hours)&&v.hours.includes(now)?4:0;
                    const ctx=(v.contexts||{}); const c=ctx[[env,bucket,intent||'nenhuma'].join('|')]||0;
                    const score=(v.count||0)*3+h+c*5+ids.length*2;
                    const symbols=seq.map(id=>symbolsData.find(s=>s.id===id)).filter(Boolean);
                    if(symbols.length===seq.length)rows.push({text:v.text,emoji:v.emoji,symbols,score,count:v.count});
                }
                return rows.sort((a,b)=>b.score-a.score).slice(0,limit);
            }
            fallback(selected,limit=3){
                if(selected.length===0)return [];
                const generated=phraseGenerator.generatePhrase(selected);
                if(!generated)return [];
                return [{text:generated.text,emoji:generated.emojis,symbols:generated.symbols,score:0,count:0}].slice(0,limit);
            }
            reset(){this.data={};this.save();}
        }

        // ============================================
        // V18: CÉREBRO DE CONTEXTO
        // ============================================
        class ContextBrain {
            constructor(){
                this.environment=StorageService.getItem('environmentContext')||'auto';
                this.lastPrediction=''; this.lastScore=0; this.load();
            }
            load(){try{this.stats=JSON.parse(StorageService.getItem('contextBrainData')||'{}')||{};}catch(e){this.stats={};}}
            save(){try{StorageService.setItem('contextBrainData',JSON.stringify(this.stats));}catch(e){}}
            timeBucket(){const h=new Date().getHours(); if(h>=6&&h<11)return 'manhã'; if(h>=11&&h<15)return 'almoco'; if(h>=15&&h<19)return 'tarde'; return 'noite';}
            timeLabel(){return {manhã:'Manhã',almoco:'Almoço',tarde:'Tarde',noite:'Noite'}[this.timeBucket()]}
            environmentLabel(){return {auto:'Automático',casa:'Casa',escola:'Escola',passeio:'Passeio',medico:'Médico',carro:'Carro'}[this.environment]||'Automático';}
            intentLabel(){return {quero:'Quero algo',sentindo:'Como estou',lugar:'Onde/ir',ajuda:'Preciso de ajuda'}[selectedIntent]||'Comunicação';}
            envKey(){return this.environment==='auto' ? (contextAnalyzer.analyzeContext(selectedSymbols)?.context||'auto') : this.environment;}
            contextKey(){return [this.envKey(),this.timeBucket(),selectedIntent||'nenhuma'].join('|');}
            recentPhrase(){const usage=JSON.parse(StorageService.getItem('phraseUsage')||'{}');const arr=Object.entries(usage).sort((a,b)=>b[1]-a[1]);return arr[0]?.[0]||'Ainda aprendendo';}
            learnedCount(){return Object.values(this.stats).reduce((a,v)=>a+(typeof v==='number'?v:(v?.count||0)),0)}
            candidateRows(){
                const key=this.contextKey(), rows=[];
                for(const [k,v] of Object.entries(this.stats)){
                    if(!k.startsWith(key+'|')) continue;
                    if(v?.text) rows.push({text:v.text,count:v.count||1,score:(v.count||1)*4});
                }
                return rows.sort((a,b)=>b.score-a.score);
            }
            infer(){
                const context=contextAnalyzer.analyzeContext(selectedSymbols)||{};
                const time=this.timeLabel(), env=this.environmentLabel(), intent=this.intentLabel();
                const learned=predictiveEngine.suggestContextual(selectedSymbols,this.environment,time,selectedIntent,4);
                const contextual=this.candidateRows();
                const fallback=getContextualPhrases();
                let prediction=learned[0]?.text||contextual[0]?.text||fallback[0]||'';
                if(selectedSymbols.length && !learned.length){const generated=phraseGenerator.generatePhrase(selectedSymbols);if(generated)prediction=generated.text;}
                const score=learned[0]?.score||0;
                // Random Forest experimental: local-only, requires at least five weighted records.
                try {
                    if (window.JornadaRandomForest && this.stats && Object.keys(this.stats).length >= 5) {
                        const rf = new window.JornadaRandomForest({trees: 9});
                        const trained = rf.train(this.stats);
                        const rfResult = trained.ready ? rf.predict(this.contextKey() + '|' + (selectedSymbols.map(s=>s.id).join(',')||'none'), {seq:selectedSymbols.map(s=>s.id).join(',')||'none'}) : null;
                        if (rfResult && rfResult.confidence >= 0.45 && rfResult.text) prediction = rfResult.text;
                    }
                } catch (e) { /* keep the established prediction path if RF cannot run */ }

                this.lastPrediction=prediction; this.lastScore=score;
                return {time,env,intent,detected:context.context||'Em aberto',confidence:context.confidence||0,prediction,recent:this.recentPhrase(),score,learned:this.learnedCount()};
            }
            render(){
                const grid=document.getElementById('contextBrainGrid'), box=document.getElementById('contextBrainPrediction'), status=document.getElementById('brainStatus'); if(!grid||!box)return;
                const d=this.infer();
                grid.innerHTML=`<div class="context-chip"><strong>🕐 HORÁRIO</strong>${escapeHtml(d.time)}</div><div class="context-chip"><strong>📍 AMBIENTE</strong>${escapeHtml(d.env)}</div><div class="context-chip"><strong>💬 INTENÇÃO</strong>${escapeHtml(d.intent)}</div><div class="context-chip"><strong>🧠 CONTEXTO</strong>${escapeHtml(d.detected)}</div><div class="context-chip"><strong>📚 MAIS USADA</strong>${escapeHtml(d.recent)}</div><div class="context-chip"><strong>🧩 APRENDIZADO</strong>${d.learned} registros</div>`;
                box.innerHTML=`<strong>✨ ${escapeHtml(d.prediction||'Continue escolhendo símbolos.')}</strong><small>${selectedSymbols.length?'Previsão combinando sequência, horário, intenção e ambiente.':'Previsão baseada no histórico contextual local.'}</small>`;
                const insight=document.getElementById('adaptiveInsight'), bar=document.getElementById('contextLearningBar');
                if(insight){insight.querySelector('span').textContent=d.score>0?`Encontrei um padrão contextual semelhante. Confiança relativa: ${Math.min(99,Math.round(45+d.score*3))}%.`:'Ainda não encontrei um padrão específico; vou aprender com esta interação.';}
                if(bar)bar.style.width=Math.min(100,Math.max(4,d.score*4))+'%';
                status.textContent=selectedSymbols.length?'Analisando':'Observando';
            }
            learn(text){
                if(!text)return;
                const key=this.contextKey(); const seq=selectedSymbols.map(s=>s.id).join(',')||'none';
                const k=key+'|'+seq;
                const old=this.stats[k]&&typeof this.stats[k]==='object'?this.stats[k]:{count:0,text:'',seq};
                old.count++; old.text=text; old.seq=seq; old.lastUsed=Date.now();
                this.stats[k]=old; this.save();
            }
        }

        // ============================================
        // INSTÂNCIA DAS IAS
        // ============================================
        const predictor = new SymbolPredictor();
        const contextAnalyzer = new ContextAnalyzer();
        const phraseGenerator = new PhraseGenerator();
        const predictiveEngine = new PredictivePhraseEngine();
        const contextBrain = new ContextBrain();

        // ============================================
        // ESTADO DO APP
        // ============================================
        let selectedSymbols = [];
        let history = JSON.parse(StorageService.getItem('symbolHistory') || '[]');
        let currentCategory = 'all';
        let speechSynthesisEnabled = 'speechSynthesis' in window;
        let currentPage = 'home';
        let showAllSymbols = false;
        let currentVoice = null;
        let voiceRate = 1;
        let voicePitch = 1.02;
        let autoSpeak = false;
        let guardianUnlocked = SecurityService.isUnlocked();
        let favoriteIds = JSON.parse(StorageService.getItem('favoriteIds') || '[]');
        const QUICK_PHRASES = [
            {text:'Eu quero água', ids:['water']},
            {text:'Eu quero comer', ids:['food']},
            {text:'Estou feliz 😊', ids:['happy']},
            {text:'Estou triste 😢', ids:['sad']},
            {text:'Preciso de ajuda', ids:['help']},
            {text:'Quero ir para casa', ids:['home']}
        ];
        let childProfile = JSON.parse(StorageService.getItem('childProfile') || '{"name":"Bia","greeting":"Olá! 🌻 Vamos conversar?","photo":""}');
        let selectedIntent = StorageService.getItem('selectedIntent') || '';
        let activeHub = StorageService.getItem('activeHub') || '';
        let symbolUsage = JSON.parse(StorageService.getItem('symbolUsage') || '{}');
        let aiFeedback = JSON.parse(StorageService.getItem('aiFeedback') || '{"like":0,"dislike":0}');
        const INTENT_LABELS = {quero:'💙 Quero', preciso:'🆘 Preciso', sentindo:'😊 Como estou', lugar:'📍 Onde / ir', ajuda:'🆘 Preciso de ajuda'};

        let selectedHealthPlan = '';
        let selectedAllergies = [];
        let sensoryModeActive = false;

        // ============================================
        // DOM ELEMENTOS
        // ============================================
        const symbolsGrid = document.getElementById('symbolsGrid');
        const editSymbolsGrid = document.getElementById('editSymbolsGrid');
        const categoriesGrid = document.getElementById('categoriesGrid');
        const feedbackDisplay = document.getElementById('feedbackDisplay');
        const clearBtn = document.getElementById('clearBtn');
        const speakBtn = document.getElementById('speakBtn');
        const saveBtn = document.getElementById('saveBtn');
        const historyList = document.getElementById('historyList');
        const historyList2 = document.getElementById('historyList2');
        const suggestionsList = document.getElementById('suggestionsList');
        const suggestionsToggle = document.getElementById('suggestions-toggle');
        const statsBtn = document.getElementById('stats-btn');
        const statsSection = document.getElementById('stats-section');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const clearHistoryBtn2 = document.getElementById('clearHistoryBtn2');
        const themeToggle = document.getElementById('theme-toggle');
        const themeTooltip = document.getElementById('themeTooltip');
        const navItems = document.querySelectorAll('.nav-item');
        const guardiansList = document.getElementById('guardiansList');
        const addGuardianBtn = document.getElementById('addGuardianBtn');
        const toggleSymbolsView = document.getElementById('toggleSymbolsView');
        const whatsappContactBtn = document.getElementById('whatsappContactBtn');
        const contactModal = document.getElementById('contactModal');
        const contactList = document.getElementById('contactList');
        const fabMain = document.getElementById('fabMain');
        const fabOptions = document.getElementById('fabOptions');
        const quickContactFab = document.getElementById('quickContactFab');
        const addSymbolBtn = document.getElementById('addSymbolBtn');
        const symbolModal = document.getElementById('symbolModal');
        const symbolModalCancel = document.getElementById('symbolModalCancel');
        const symbolModalSave = document.getElementById('symbolModalSave');
        const editSymbolCount = document.getElementById('editSymbolCount');
        const medicalSaveBtn = document.getElementById('medicalSaveBtn');
        const healthPlanModal = document.getElementById('healthPlanModal');
        const allergiesModal = document.getElementById('allergiesModal');
        const healthPlanList = document.getElementById('healthPlanList');
        const allergiesList = document.getElementById('allergiesList');
        const quickPhrasesGrid = document.getElementById('quickPhrasesGrid');
        const favoritesGrid = document.getElementById('favoritesGrid');
        const voicePreviewBtn = document.getElementById('voicePreviewBtn');
        const voiceQualityDot = document.getElementById('voiceQualityDot');
        const voiceQualityText = document.getElementById('voiceQualityText');
        const guardianModeBtn = document.getElementById('guardianModeBtn');
        const biometricStatus = document.getElementById('biometricStatus');
        const biometricSetupBtn = document.getElementById('biometricSetupBtn');
        const biometricRemoveBtn = document.getElementById('biometricRemoveBtn');

        // Configurações
        const voiceSelect = document.getElementById('voiceSelect');
        const voiceRateInput = document.getElementById('voiceRate');
        const voiceRateValue = document.getElementById('voiceRateValue');
        const voicePitchInput = document.getElementById('voicePitch');
        const voicePitchValue = document.getElementById('voicePitchValue');
        const autoSpeakToggle = document.getElementById('autoSpeak');
        const darkModeToggle = document.getElementById('darkModeToggle');
        const colorThemeSelect = document.getElementById('colorThemeSelect');
        const clearAllDataBtn = document.getElementById('clearAllDataBtn');

        // ============================================
        // FUNÇÕES DE ÁUDIO (Earcons)
        // ============================================
        
        let audioContext = null;
        
        function playClickSound() {
            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.08);
                if (navigator.vibrate) navigator.vibrate(8);
            } catch (e) {}
        }
        
        function playSuccessSound() {
            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                const notes = [523, 659, 784];
                notes.forEach((freq, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.08);
                    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime + index * 0.08);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.08 + 0.1);
                    oscillator.start(audioContext.currentTime + index * 0.08);
                    oscillator.stop(audioContext.currentTime + index * 0.08 + 0.1);
                });
            } catch (e) {}
        }
        
        function playErrorSound() {
            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (e) {}
        }

        // ============================================
        // FUNÇÕES DE VOZ
        // ============================================
        
        function voiceScore(voice) {
            const n = (voice.name || '').toLowerCase();
            const l = (voice.lang || '').toLowerCase();
            let score = 0;
            if (l === 'pt-br') score += 60;
            else if (l.startsWith('pt')) score += 45;
            if (/natural|neural|online|premium|enhanced|melhor|google/.test(n)) score += 25;
            if (/maria|francisca|female|feminina|luciana|helena|camila|ana/.test(n)) score += 8;
            if (voice.localService) score += 4;
            return score;
        }

        function getBestVoice() {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return null;
            const pt = voices.filter(v => /^pt(-|_)/i.test(v.lang));
            return (pt.length ? pt : voices).slice().sort((a,b) => voiceScore(b)-voiceScore(a))[0] || null;
        }

        function loadVoices() {
            const voices = window.speechSynthesis.getVoices();
            voiceSelect.innerHTML = '<option value="default">✨ Melhor voz disponível</option>';
            const sorted = voices.slice().sort((a,b) => voiceScore(b)-voiceScore(a));
            const ptVoices = sorted.filter(v => /^pt(-|_)/i.test(v.lang));
            const otherVoices = sorted.filter(v => !/^pt(-|_)/i.test(v.lang));
            [...ptVoices, ...otherVoices].forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            const savedVoice = StorageService.getItem('selectedVoice');
            if (savedVoice && voices.some(v => v.name === savedVoice)) voiceSelect.value = savedVoice;
            currentVoice = voiceSelect.value === 'default' ? getBestVoice() : (voices.find(v => v.name === voiceSelect.value) || getBestVoice());
            updateVoiceQuality();
        }

        function getSelectedVoice() {
            const voices = window.speechSynthesis.getVoices();
            if (voiceSelect.value !== 'default') return voices.find(v => v.name === voiceSelect.value) || getBestVoice();
            return getBestVoice();
        }

        function updateVoiceQuality() {
            const voice = getSelectedVoice();
            if (voice) {
                voiceQualityDot.classList.add('good');
                voiceQualityText.textContent = `Voz escolhida: ${voice.name} · ${voice.lang}`;
            } else {
                voiceQualityDot.classList.remove('good');
                voiceQualityText.textContent = 'Aguardando as vozes do navegador…';
            }
        }

        function previewVoice() {
            speakText('Olá! Eu sou a voz da Jornada de Bia. Vamos conversar juntos.', true);
        }

        function updateVoiceSettings() {
            voiceRate = parseFloat(voiceRateInput.value);
            voiceRateValue.textContent = voiceRate.toFixed(2);
            voicePitch = parseFloat(voicePitchInput.value);
            voicePitchValue.textContent = voicePitch.toFixed(2);
            StorageService.setItem('voiceRate', voiceRate);
            StorageService.setItem('voicePitch', voicePitch);
        }

        function loadVoiceSettings() {
            const savedRate = StorageService.getItem('voiceRate');
            const savedPitch = StorageService.getItem('voicePitch');
            voiceRate = savedRate ? parseFloat(savedRate) : 0.92;
            voicePitch = savedPitch ? parseFloat(savedPitch) : 1.02;
            voiceRateInput.value = voiceRate; voiceRateValue.textContent = voiceRate.toFixed(2);
            voicePitchInput.value = voicePitch; voicePitchValue.textContent = voicePitch.toFixed(2);
            const savedAutoSpeak = StorageService.getItem('autoSpeak');
            if (savedAutoSpeak) { autoSpeak = savedAutoSpeak === 'true'; autoSpeakToggle.checked = autoSpeak; }
        }

        // ============================================
        // FUNÇÕES DE TEMA
        // ============================================
        
        function getThemeConfig(themeValue) {
            const configs = {
                light: { name: 'Rosa', icon: '🌸', color: 'pink', dark: false },
                blue: { name: 'Azul', icon: '💙', color: 'blue', dark: false },
                green: { name: 'Verde', icon: '🌿', color: 'green', dark: false },
                dark: { name: 'Rosa escuro', icon: '🌙', color: 'pink', dark: true },
                'dark-blue': { name: 'Azul escuro', icon: '🌌', color: 'blue', dark: true },
                'dark-green': { name: 'Verde escuro', icon: '🌑', color: 'green', dark: true }
            };
            return configs[themeValue] || configs.light;
        }

        function setTheme(themeValue, persist = true) {
            const normalized = themeValue === null || themeValue === 'pink' ? 'light' : themeValue;
            if (normalized === 'light') document.documentElement.removeAttribute('data-theme');
            else document.documentElement.setAttribute('data-theme', normalized);
            const config = getThemeConfig(normalized);
            if (themeToggle) {
                themeToggle.textContent = config.icon;
                themeTooltip.textContent = `Tema ${config.name}`;
                themeToggle.setAttribute('aria-label', `Tema atual: ${config.name}. Alternar tema`);
            }
            if (persist) StorageService.setItem('theme', normalized);
            updateThemeMeta();
            updateToggleStates();
        }

        function toggleTheme() {
            const order = ['light', 'blue', 'green', 'dark', 'dark-blue', 'dark-green'];
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const index = order.indexOf(current);
            setTheme(order[(index + 1) % order.length]);
        }

        function loadTheme() {
            let savedTheme = StorageService.getItem('theme') || 'light';
            // Compatibilidade com preferências de versões anteriores.
            if (savedTheme === 'pink') savedTheme = 'light';
            if (!['light', 'blue', 'green', 'dark', 'dark-blue', 'dark-green'].includes(savedTheme)) savedTheme = 'light';
            setTheme(savedTheme, false);
        }

        function updateThemeMeta() {
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                const computedStyle = getComputedStyle(document.documentElement);
                const bgColor = computedStyle.getPropertyValue('--primary').trim();
                metaTheme.content = bgColor || '#F3F7F1';
            }
        }

        function updateToggleStates() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const config = getThemeConfig(currentTheme);
            if (darkModeToggle) darkModeToggle.checked = config.dark;
            if (colorThemeSelect) colorThemeSelect.value = config.color;
        }

        function applyThemeFromSettings() {
            const color = colorThemeSelect ? colorThemeSelect.value : 'pink';
            const isDark = !!(darkModeToggle && darkModeToggle.checked);
            let theme = 'light';
            if (color === 'blue') theme = isDark ? 'dark-blue' : 'blue';
            else if (color === 'green') theme = isDark ? 'dark-green' : 'green';
            else theme = isDark ? 'dark' : 'light';
            setTheme(theme);
        }

        // ============================================
        // FUNÇÕES MÉDICAS (NOVA VERSÃO)
        // ============================================

        function renderMedical() {
            document.getElementById('medHealthPlan').value = medicalData.healthPlan || '';
            document.getElementById('medSupportLevel').value = medicalData.supportLevel || '';
            document.getElementById('medAllergies').value = Array.isArray(medicalData.allergies) ? medicalData.allergies.join(', ') : (medicalData.allergies || '');
            document.getElementById('medObservations').value = medicalData.observations || '';
            const sp = medicalData.sensoryPreferences || {};
            ['sound','light','touch','smells','crowds','fabrics'].forEach(k => { const el=document.getElementById('sens'+k.charAt(0).toUpperCase()+k.slice(1)); if(el) el.checked=!!sp[k]; });
            const helps = Array.isArray(sp.helps) ? sp.helps : [];
            document.querySelectorAll('.sensHelp').forEach(el => { el.checked = helps.includes(el.value); });
        }

        function saveMedicalData() {
            const healthPlan = document.getElementById('medHealthPlan').value.trim();
            const supportLevel = document.getElementById('medSupportLevel').value;
            const allergies = document.getElementById('medAllergies').value.split(',').map(v => v.trim()).filter(Boolean);
            const observations = document.getElementById('medObservations').value.trim();
            const sensoryPreferences = {
                sound: !!document.getElementById('sensSound')?.checked,
                light: !!document.getElementById('sensLight')?.checked,
                touch: !!document.getElementById('sensTouch')?.checked,
                smells: !!document.getElementById('sensSmells')?.checked,
                crowds: !!document.getElementById('sensCrowds')?.checked,
                fabrics: !!document.getElementById('sensFabrics')?.checked,
                helps: Array.from(document.querySelectorAll('.sensHelp:checked')).map(el => el.value)
            };
            medicalData = { healthPlan, supportLevel, allergies, observations, sensoryPreferences };
            StorageService.setItem('medicalData', JSON.stringify(medicalData));
            playSuccessSound();
            showToast('✅ Informações médicas salvas com sucesso!');
            renderMedical();
        }

        function openHealthPlanSelector() {
            selectedHealthPlan = document.getElementById('medHealthPlan').value || '';
            document.getElementById('healthPlanSearch').value = '';
            healthPlanList.innerHTML = '';
            
            healthPlanOptions.forEach(option => {
                const div = document.createElement('div');
                div.className = 'selector-option' + (option === selectedHealthPlan ? ' selected' : '');
                div.innerHTML = `
                    <span>${option}</span>
                    <span class="option-check">✅</span>
                `;
                div.onclick = () => selectHealthPlanOption(option);
                healthPlanList.appendChild(div);
            });
            
            healthPlanModal.classList.add('active');
        }

        function selectHealthPlanOption(option) {
            selectedHealthPlan = option;
            document.querySelectorAll('#healthPlanList .selector-option').forEach(el => {
                el.classList.toggle('selected', el.textContent.trim() === option);
            });
        }

        function filterHealthPlans() {
            const search = document.getElementById('healthPlanSearch').value.toLowerCase();
            const options = document.querySelectorAll('#healthPlanList .selector-option');
            options.forEach(opt => {
                const text = opt.textContent.toLowerCase();
                opt.style.display = text.includes(search) ? 'flex' : 'none';
            });
        }

        function selectHealthPlan() {
            if (selectedHealthPlan) {
                document.getElementById('medHealthPlan').value = selectedHealthPlan;
            }
            closeHealthPlanModal();
            playClickSound();
        }

        function closeHealthPlanModal() {
            healthPlanModal.classList.remove('active');
        }

        function openAllergiesSelector() {
            const current = document.getElementById('medAllergies').value || '';
            selectedAllergies = current.split(',').map(v => v.trim()).filter(Boolean);
            document.getElementById('allergiesSearch').value = '';
            renderAllergiesOptions();
            allergiesModal.classList.add('active');
        }

        function renderAllergiesOptions() {
            allergiesList.innerHTML = '';
            allergiesOptions.forEach(option => {
                const div = document.createElement('div');
                const isSelected = selectedAllergies.includes(option);
                div.className = 'selector-option' + (isSelected ? ' selected' : '');
                div.setAttribute('role','button');
                div.setAttribute('aria-pressed', String(isSelected));
                div.innerHTML = `<span>${option}</span><span class="option-check">${isSelected ? '✅' : '⬜'}</span>`;
                div.onclick = () => selectAllergiesOption(option);
                allergiesList.appendChild(div);
            });
        }

        function selectAllergiesOption(option) {
            if (option === 'Nenhuma alergia conhecida') {
                selectedAllergies = ['Nenhuma alergia conhecida'];
            } else {
                selectedAllergies = selectedAllergies.filter(v => v !== 'Nenhuma alergia conhecida');
                if (selectedAllergies.includes(option)) {
                    selectedAllergies = selectedAllergies.filter(v => v !== option);
                } else {
                    selectedAllergies.push(option);
                }
            }
            renderAllergiesOptions();
            filterAllergies();
        }

        function filterAllergies() {
            const search = document.getElementById('allergiesSearch').value.toLowerCase();
            document.querySelectorAll('#allergiesList .selector-option').forEach(opt => {
                opt.style.display = opt.textContent.toLowerCase().includes(search) ? 'flex' : 'none';
            });
        }

        function selectAllergies() {
            document.getElementById('medAllergies').value = selectedAllergies.join(', ');
            closeAllergiesModal();
            playClickSound();
        }

        function closeAllergiesModal() {
            allergiesModal.classList.remove('active');
        }

        // ============================================
        // MODO DE CRISE SENSORIAL
        // ============================================
        function openSensoryCrisis() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            sensoryModeActive = true;
            document.body.classList.add('sensory-mode-active');
            showPage('sensory-crisis');
            document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
            document.getElementById('page-sensory-crisis')?.classList.add('active');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === 'sensory-crisis'));
        }

        function closeSensoryCrisis() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            sensoryModeActive = false;
            document.body.classList.remove('sensory-mode-active');
            showPage('home');
        }

        function speakSensory(text) {
            speakText(text, true);
        }

        function callSensoryResponsible() {
            speakSensory('Preciso do meu responsável agora');
            setTimeout(() => openContactModal(), 250);
        }

        // ============================================
        // FUNÇÕES PRINCIPAIS
        // ============================================

        function renderCategories() {
            categoriesGrid.innerHTML = categories.map(cat => `
                <div class="category-card ${cat.id === currentCategory ? 'active' : ''}" 
                     data-category="${cat.id}" 
                     onclick="filterCategory('${cat.id}')"
                     role="button"
                     tabindex="0"
                     aria-label="Filtrar por categoria ${cat.label}">
                    <span class="emoji">${cat.emoji}</span>
                    <span class="label">${cat.label}</span>
                </div>
            `).join('');
            
            document.querySelectorAll('.category-card').forEach(el => {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const category = el.dataset.category;
                        filterCategory(category);
                    }
                });
            });
        }

        function renderSymbols() {
            const filtered = currentCategory === 'all' ? symbolsData : symbolsData.filter(s => s.category === currentCategory);
            const displayData = showAllSymbols ? filtered : filtered.slice(0, 12);
            
            symbolsGrid.innerHTML = '';
            displayData.forEach((symbol, index) => {
                const card = document.createElement('div');
                card.className = 'symbol-card';
                card.dataset.symbolId = symbol.id;
                card.style.animationDelay = `${index * 0.03}s`;
                card.setAttribute('role', 'gridcell');
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-label', `Adicionar símbolo ${symbol.label}`);
                const isFavorite = favoriteIds.includes(symbol.id);
                card.classList.toggle('is-favorite', isFavorite);
                card.innerHTML = `
                    <button class="favorite-toggle" type="button" aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" title="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${isFavorite ? '⭐' : '☆'}</button>
                    <span class="emoji">${escapeHtml(symbol.emoji)}</span>
                    <span class="label">${escapeHtml(symbol.label)}</span>
                    <span class="category-badge">${escapeHtml(symbol.category)}</span>
                `;
                card.querySelector('.favorite-toggle').addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(symbol);
                });
                card.addEventListener('click', () => {
                    playClickSound();
                    addSymbol(symbol);
                });
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playClickSound();
                        addSymbol(symbol);
                    }
                });
                card.addEventListener('touchstart', () => { card.style.transform = 'scale(0.95)'; }, { passive: true });
                card.addEventListener('touchend', () => { card.style.transform = ''; }, { passive: true });
                symbolsGrid.appendChild(card);
            });

            toggleSymbolsView.textContent = showAllSymbols ? 'Mostrar menos' : 'Mostrar todos';
            toggleSymbolsView.style.display = filtered.length > 12 ? 'block' : 'none';
            
            document.getElementById('totalSymbols').textContent = symbolsData.length;
            renderEditSymbols();
        }

        function renderEditSymbols() {
            editSymbolsGrid.innerHTML = '';
            symbolsData.forEach((symbol) => {
                const item = document.createElement('div');
                item.className = 'edit-symbol-item';
                item.innerHTML = `
                    <span class="emoji">${escapeHtml(symbol.emoji)}</span>
                    <span class="label">${escapeHtml(symbol.label)}</span>
                    <span class="category-badge">${escapeHtml(symbol.category)}</span>
                    <div class="edit-actions">
                        <button class="edit-btn" onclick="openEditSymbol('${symbol.id}')" title="Editar" aria-label="Editar símbolo ${escapeHtml(symbol.label)}">✏️</button>
                        <button class="delete-btn" onclick="deleteSymbol('${symbol.id}')" title="Excluir" aria-label="Excluir símbolo ${escapeHtml(symbol.label)}">🗑️</button>
                    </div>
                `;
                editSymbolsGrid.appendChild(item);
            });
            
            editSymbolCount.textContent = `${symbolsData.length} símbolo${symbolsData.length !== 1 ? 's' : ''}`;
        }

        function addSymbol(symbol) {
            selectedSymbols.push(symbol);
            symbolUsage[symbol.id]=(symbolUsage[symbol.id]||0)+1;
            StorageService.setItem('symbolUsage',JSON.stringify(symbolUsage));
            renderMostUsed();
            updateFeedback();
            updateSuggestions();
            renderPredictivePhrases();
            contextBrain.render();
            predictor.recordSequence(selectedSymbols);
            if (navigator.vibrate) navigator.vibrate(10);
            predictor.updateStats();
            document.getElementById('totalMessages').textContent = history.length + 1;
            playSuccessSound();
            if (autoSpeak) speakMessage();
        }

        function updateFeedback() {
            if (selectedSymbols.length === 0) {
                feedbackDisplay.innerHTML = `<p class="feedback-placeholder">🌻 Toque em um símbolo para começar</p>`;
                return;
            }
            const context = contextAnalyzer.analyzeContext(selectedSymbols);
            let feedbackHTML = selectedSymbols.map(s => 
                `<span class="symbol-item">${escapeHtml(s.emoji)} ${escapeHtml(s.label)}</span>`
            ).join('');
            if (context && context.confidence > 0.35) {
                feedbackHTML += `<span class="context-indicator">📌 ${escapeHtml(context.context)}</span>`;
                const cb=document.getElementById('contextBadge'); if(cb){cb.hidden=false;cb.textContent=`🧠 Contexto: ${context.context}`;}
            } else { const cb=document.getElementById('contextBadge'); if(cb) cb.hidden=true; }
            feedbackDisplay.innerHTML = feedbackHTML;
            const fullText = selectedSymbols.map(s => s.label).join(' ');
            feedbackDisplay.setAttribute('aria-label', `Mensagem: ${fullText}`);
            const lastSymbol = selectedSymbols[selectedSymbols.length - 1];
            if (lastSymbol) {
                feedbackDisplay.setAttribute('aria-live', 'polite');
                setTimeout(() => {
                    feedbackDisplay.setAttribute('aria-live', 'assertive');
                }, 100);
            }
        }

        function renderPredictivePhrases(){
            const list=document.getElementById('predictiveList'); const badge=document.getElementById('predictiveConfidence');
            if(!list)return;
            if(selectedSymbols.length===0){
                list.innerHTML='<p class="predictive-empty">Use alguns símbolos para a Jornada de Bia aprender suas combinações.</p>';
                if(badge)badge.textContent='Aprendendo';
                return;
            }
            let rows=predictiveEngine.suggest(selectedSymbols,3);
            if(!rows.length) rows=predictiveEngine.fallback(selectedSymbols,1);
            if(!rows.length){list.innerHTML='<p class="predictive-empty">Ainda não tenho uma frase provável. Continue escolhendo símbolos.</p>';return;}
            if(badge)badge.textContent=rows[0].count>0?'🧠 Aprendida':'✨ Primeira sugestão';
            list.innerHTML=rows.map((r,i)=>`<button class="predictive-item" type="button" data-index="${i}" role="listitem"><span class="pi-emoji">${escapeHtml(r.emoji||'💬')}</span><span class="pi-body"><strong>${escapeHtml(r.text)}</strong><small>${r.count?`Usada ${r.count} vez${r.count===1?'':'es'}`:'Sugestão baseada nos símbolos atuais'}</small></span></button>`).join('');
            list.querySelectorAll('.predictive-item').forEach((btn,i)=>btn.addEventListener('click',()=>{
                const r=rows[i]; if(!r)return;
                selectedSymbols=r.symbols.map(s=>({...s}));
                updateFeedback(); updateSuggestions();
                speakText(r.text); predictor.recordPhrase(r.text); predictiveEngine.learn(selectedSymbols,r.text); contextBrain.learn(r.text); contextBrain.render();
                playSuccessSound(); if(navigator.vibrate)navigator.vibrate([15,30,15]);
            }));
        }

        function updateSuggestions() {
            if (selectedSymbols.length === 0) {
                suggestionsList.innerHTML = `<p class="suggestions-placeholder">Selecione símbolos para ver sugestões da IA</p>`;
                return;
            }
            const suggestions = [];
            const predicted = predictor.predictNext(selectedSymbols, 3).sort((a,b)=>(symbolUsage[b.id]||0)-(symbolUsage[a.id]||0));
            for (const pred of predicted) {
                if (!selectedSymbols.find(s => s.id === pred.id)) {
                    suggestions.push({ type: 'prediction', label: pred.label, emoji: pred.emoji, symbol: pred, context: '🤖 IA' });
                }
            }
            const contextSuggestions = contextAnalyzer.getContextSuggestions(selectedSymbols, 2);
            for (const sug of contextSuggestions) {
                if (!selectedSymbols.find(s => s.id === sug.id) && !suggestions.find(s => s.symbol?.id === sug.id)) {
                    suggestions.push({ type: 'context', label: sug.label, emoji: sug.emoji, symbol: sug, context: '📌 Contexto' });
                }
            }
            const phrase = phraseGenerator.generatePhrase(selectedSymbols);
            if (phrase) {
                suggestions.push({ type: 'phrase', label: phrase.text, emoji: phrase.emojis, phrase: phrase, context: '💬 Frase' });
            }
            if (suggestions.length === 0) {
                suggestionsList.innerHTML = `<p class="suggestions-placeholder">Sem sugestões no momento</p>`;
                return;
            }
            suggestionsList.innerHTML = suggestions.map((sug, index) => `
                <div class="suggestion-item" style="animation-delay: ${index * 0.05}s" data-type="${sug.type}" role="listitem" tabindex="0" aria-label="Sugestão: ${escapeHtml(sug.label)}">
                    <span class="suggestion-emoji">${escapeHtml(sug.emoji)}</span>
                    <span>${escapeHtml(sug.label)}</span>
                    <span class="suggestion-context">${escapeHtml(sug.context)}</span>
                </div>
            `).join('');
            
            suggestionsList.querySelectorAll('.suggestion-item').forEach((item, index) => {
                const sug = suggestions[index];
                item.addEventListener('click', () => {
                    playClickSound();
                    if (sug.type === 'phrase' && sug.phrase) {
                        selectedSymbols = sug.phrase.symbols || [];
                        updateFeedback();
                        speakMessage();
                    } else if (sug.symbol) {
                        addSymbol(sug.symbol);
                    }
                    if (navigator.vibrate) navigator.vibrate(10);
                });
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playClickSound();
                        if (sug.type === 'phrase' && sug.phrase) {
                            selectedSymbols = sug.phrase.symbols || [];
                            updateFeedback();
                            speakMessage();
                        } else if (sug.symbol) {
                            addSymbol(sug.symbol);
                        }
                        if (navigator.vibrate) navigator.vibrate(10);
                    }
                });
            });
        }

        function speakMessage() {
            if (selectedSymbols.length === 0) { 
                speakText('Toque em um símbolo para começar'); 
                return; 
            }
            const generated = phraseGenerator.generatePhrase(selectedSymbols);
            const text = generated?.text || selectedSymbols.map(s => s.label).join(' ');
            speakText(text);
            predictor.recordPhrase(text);
            predictiveEngine.learn(selectedSymbols,text);
            renderPredictivePhrases();
        }

        function speakText(text, preview = false) {
            if (!speechSynthesisEnabled) { alert('Seu navegador não suporta síntese de voz'); return; }
            if (!text) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const selectedVoice = getSelectedVoice();
            utterance.lang = selectedVoice?.lang || 'pt-BR';
            utterance.voice = selectedVoice || null;
            utterance.rate = preview ? Math.max(0.78, Math.min(voiceRate, 0.98)) : voiceRate;
            utterance.pitch = voicePitch;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
        }

        function clearMessage() {
            if (selectedSymbols.length === 0) return;
            selectedSymbols = [];
            updateFeedback();
            updateSuggestions();
            renderPredictivePhrases();
            if (navigator.vibrate) navigator.vibrate(5);
            playErrorSound();
        }

        function saveMessage() {
            if (selectedSymbols.length === 0) { 
                playErrorSound();
                alert('Adicione símbolos antes de salvar'); 
                return; 
            }
            const generated = phraseGenerator.generatePhrase(selectedSymbols);
            const text = generated?.text || selectedSymbols.map(s => s.label).join(' ');
            const emojis = selectedSymbols.map(s => s.emoji).join(' ');
            const entry = {
                id: Date.now(),
                text: text,
                emojis: emojis,
                symbols: [...selectedSymbols],
                timestamp: new Date().toLocaleString('pt-BR')
            };
            history.unshift(entry);
            if (history.length > 50) history.pop();
            StorageService.setItem('symbolHistory', JSON.stringify(history));
            updateHistory();
            clearMessage();
            if (navigator.vibrate) navigator.vibrate(15);
            playSuccessSound();
            document.getElementById('totalMessages').textContent = history.length;
        }

        function updateHistory() {
            const renderHistory = (targetList) => {
                if (history.length === 0) {
                    targetList.innerHTML = `<p class="history-empty">Nenhuma mensagem salva ainda</p>`;
                    return;
                }
                targetList.innerHTML = history.map(item => `
                    <div class="history-item" data-id="${item.id}" role="listitem" tabindex="0" aria-label="Mensagem: ${escapeHtml(item.text)}">
                        <span class="history-text">${escapeHtml(item.emojis)} ${escapeHtml(item.text)}</span>
                        <span class="history-time">${escapeHtml(item.timestamp)}</span>
                    </div>
                `).join('');
                targetList.querySelectorAll('.history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = parseInt(item.dataset.id);
                        const entry = history.find(h => h.id === id);
                        if (entry) {
                            selectedSymbols = [...entry.symbols];
                            updateFeedback();
                            updateSuggestions();
                            speakMessage();
                            showPage('home');
                        }
                    });
                    item.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const id = parseInt(item.dataset.id);
                            const entry = history.find(h => h.id === id);
                            if (entry) {
                                selectedSymbols = [...entry.symbols];
                                updateFeedback();
                                updateSuggestions();
                                speakMessage();
                                showPage('home');
                            }
                        }
                    });
                });
            };
            renderHistory(historyList);
            renderHistory(historyList2);
            document.getElementById('totalMessages').textContent = history.length;
        }

        function filterCategory(category) {
            currentCategory = category;
            renderCategories();
            renderSymbols();
            showPage('home');
            if (navigator.vibrate) navigator.vibrate(8);
        }

        const PAGE_MAP = Object.freeze({
            'home': 'page-home',
            'edit-symbols': 'page-edit-symbols',
            'history': 'page-history',
            'guardians': 'page-guardians',
            'medical': 'page-medical',
            'sensory-crisis': 'page-sensory-crisis',
            'settings': 'page-settings',
            'about': 'page-about'
        });

        function showPage(page) {
            let requestedPage = page;

            // Nunca deixe a interface sem uma página ativa por causa de um
            // data-page inválido ou de uma chamada antiga.
            if (!PAGE_MAP[requestedPage]) {
                requestedPage = 'home';
            }

            if (['edit-symbols','guardians','medical','settings'].includes(requestedPage) && !guardianUnlocked) {
                if (requestedPage !== 'guardians') {
                    showToast('🔐 Ative o Modo Responsável primeiro');
                    requestedPage = 'guardians';
                }
            }

            currentPage = requestedPage;
            document.querySelectorAll('.nav-item').forEach(n => {
                n.classList.toggle('active', n.dataset.page === requestedPage);
            });
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
            });

            const target = document.getElementById(PAGE_MAP[requestedPage]);
            if (target) {
                target.classList.add('active');
            } else {
                // Proteção adicional caso o HTML e o mapa de páginas saiam de sincronia.
                currentPage = 'home';
                document.querySelector('[data-page="home"]')?.classList.add('active');
                document.getElementById('page-home')?.classList.add('active');
            }
        }

        // ============================================
        // FUNÇÕES DOS RESPONSÁVEIS
        // ============================================

        function renderGuardians() {
            const container = document.getElementById('guardiansList');
            const count = document.getElementById('guardianCount');
            count.textContent = `${guardians.length} responsável${guardians.length !== 1 ? 'es' : ''}`;
            if (guardians.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: var(--text-light);">
                        <div style="font-size: 4rem; margin-bottom: 16px;">👨‍👩‍👧</div>
                        <p style="font-size: 1.1rem; font-weight: 800; color: var(--text);">Nenhum responsável cadastrado</p>
                        <p style="font-size: 0.9rem; margin-top: 4px; font-weight: 600;">Clique em "Adicionar Responsável" para começar</p>
                        <p style="font-size: 0.8rem; margin-top: 8px; opacity: 0.7; font-weight: 600;">💡 Adicione os contatos para usar o WhatsApp</p>
                    </div>
                `;
                updateFabOptions();
                return;
            }
            container.innerHTML = guardians.map(g => `
                <div class="guardian-card" data-id="${g.id}">
                    <div class="guardian-info">
                        <div class="name">
                            ${escapeHtml(g.name)}
                            ${g.isPrimary ? '<span class="primary-badge">⭐ Principal</span>' : ''}
                        </div>
                        <div class="relationship">${escapeHtml(g.relationship)}</div>
                        <div class="phone">📞 ${escapeHtml(g.phone)}</div>
                        ${g.email ? `<div class="email">✉️ ${escapeHtml(g.email)}</div>` : ''}
                        ${g.observations ? `<div class="observations">📝 ${escapeHtml(g.observations)}</div>` : ''}
                    </div>
                    <div class="guardian-actions">
                        <button class="whatsapp-btn" onclick="contactGuardian('${g.id}', 'whatsapp')" title="WhatsApp" aria-label="Enviar WhatsApp para ${escapeHtml(g.name)}">💬</button>
                        <button class="call-btn" onclick="contactGuardian('${g.id}', 'call')" title="Ligar" aria-label="Ligar para ${escapeHtml(g.name)}">📞</button>
                        ${g.email ? `<button class="email-btn" onclick="emailGuardianById(${g.id})" title="Enviar e-mail" aria-label="Enviar e-mail para ${escapeHtml(g.name)}">✉️</button>` : ''}
                        <button class="primary-btn" onclick="togglePrimary(${g.id})" title="Marcar como principal" aria-label="Marcar ${escapeHtml(g.name)} como principal">⭐</button>
                        <button class="edit-btn" onclick="openEditGuardian(${g.id})" title="Editar" aria-label="Editar ${escapeHtml(g.name)}">✏️</button>
                        <button class="delete-btn" onclick="deleteGuardian(${g.id})" title="Excluir" aria-label="Excluir ${escapeHtml(g.name)}">🗑️</button>
                    </div>
                </div>
            `).join('');
            updateFabOptions();
        }

        function openAddGuardian() {
            editingGuardianId = null;
            document.getElementById('modalTitle').textContent = '➕ Adicionar Responsável';
            document.getElementById('modalSubtitle').textContent = 'Preencha os dados do novo responsável';
            document.getElementById('guardianName').value = '';
            document.getElementById('guardianRelationship').value = '';
            document.getElementById('guardianPhone').value = '';
            document.getElementById('guardianEmail').value = '';
            document.getElementById('guardianObservations').value = '';
            document.getElementById('guardianPrimary').checked = false;
            document.getElementById('guardianModal').classList.add('active');
        }

        function openEditGuardian(id) {
            const guardian = guardians.find(g => g.id === id);
            if (!guardian) return;
            editingGuardianId = id;
            document.getElementById('modalTitle').textContent = '✏️ Editar Responsável';
            document.getElementById('modalSubtitle').textContent = 'Atualize os dados do responsável';
            document.getElementById('guardianName').value = guardian.name || '';
            document.getElementById('guardianRelationship').value = guardian.relationship || '';
            document.getElementById('guardianPhone').value = guardian.phone || '';
            document.getElementById('guardianEmail').value = guardian.email || '';
            document.getElementById('guardianObservations').value = guardian.observations || '';
            document.getElementById('guardianPrimary').checked = guardian.isPrimary || false;
            document.getElementById('guardianModal').classList.add('active');
        }

        function closeGuardianModal() {
            document.getElementById('guardianModal').classList.remove('active');
            editingGuardianId = null;
        }

        function saveGuardian() {
            const name = document.getElementById('guardianName').value.trim();
            const relationship = document.getElementById('guardianRelationship').value.trim();
            const phone = document.getElementById('guardianPhone').value.trim();
            const email = document.getElementById('guardianEmail').value.trim();
            const observations = document.getElementById('guardianObservations').value.trim();
            const isPrimary = document.getElementById('guardianPrimary').checked;
            if (!name) {
                playErrorSound();
                showToast('⚠️ Por favor, informe o nome do responsável');
                document.getElementById('guardianName').focus();
                return;
            }
            if (!relationship) {
                playErrorSound();
                showToast('⚠️ Por favor, informe o parentesco');
                document.getElementById('guardianRelationship').focus();
                return;
            }
            if (!phone) {
                playErrorSound();
                showToast('⚠️ Por favor, informe o telefone');
                document.getElementById('guardianPhone').focus();
                return;
            }
            if (isPrimary) guardians = guardians.map(g => ({ ...g, isPrimary: false }));
            if (editingGuardianId) {
                const index = guardians.findIndex(g => g.id === editingGuardianId);
                if (index !== -1) {
                    guardians[index] = { ...guardians[index], name, relationship, phone, email: email || '', observations: observations || '', isPrimary };
                }
                playSuccessSound();
                showToast('✅ Responsável atualizado com sucesso!');
            } else {
                const newGuardian = { id: Date.now(), name, relationship, phone, email: email || '', observations: observations || '', isPrimary };
                guardians.push(newGuardian);
                playSuccessSound();
                showToast('✅ Responsável adicionado com sucesso!');
            }
            StorageService.setItem('guardians', JSON.stringify(guardians));
            renderGuardians();
            closeGuardianModal();
        }

        function deleteGuardian(id) {
            const guardian = guardians.find(g => g.id === id);
            if (!guardian) return;
            if (!confirm(`Tem certeza que deseja excluir ${guardian.name}?`)) return;
            guardians = guardians.filter(g => g.id !== id);
            StorageService.setItem('guardians', JSON.stringify(guardians));
            renderGuardians();
            playErrorSound();
            showToast('🗑️ Responsável removido');
        }

        function togglePrimary(id) {
            guardians = guardians.map(g => ({ ...g, isPrimary: g.id === id }));
            StorageService.setItem('guardians', JSON.stringify(guardians));
            renderGuardians();
            playSuccessSound();
            showToast('⭐ Responsável principal atualizado!');
        }

        function emailGuardian(email) {
            window.location.href = `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}`;
        }
        function emailGuardianById(id) {
            const guardian = guardians.find(g => g.id === id);
            if (guardian?.email) emailGuardian(guardian.email);
        }

        // ============================================
        // FUNÇÕES WHATSAPP
        // ============================================

        function openWhatsApp(phone, message = '') {
            if (!phone) {
                playErrorSound();
                showToast('⚠️ Número de telefone não disponível');
                return;
            }
            let cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
                if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
                cleanPhone = '55' + cleanPhone;
            }
            const encodedMessage = encodeURIComponent(message);
            const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
            const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
            try {
                window.location.href = appUrl;
                const timeoutId = setTimeout(() => { window.open(webUrl, '_blank'); }, 2000);
                document.addEventListener('visibilitychange', function onVisibility() {
                    if (document.hidden) { clearTimeout(timeoutId); document.removeEventListener('visibilitychange', onVisibility); }
                });
            } catch (e) { window.open(webUrl, '_blank'); }
        }

        function contactGuardian(id, method) {
            const guardian = guardians.find(g => g.id === parseInt(id));
            if (!guardian) {
                playErrorSound();
                showToast('⚠️ Responsável não encontrado');
                return;
            }
            let message = '🌻∞ Mensagem da Jornada de Bia:\n\n';
            if (selectedSymbols.length > 0) {
                const symbolsText = selectedSymbols.map(s => `${s.emoji} ${s.label}`).join('\n');
                message += symbolsText;
            } else {
                message += 'Olá! Estou usando o Jornada de Bia para me comunicar.';
            }
            if (method === 'whatsapp') {
                openWhatsApp(guardian.phone, message);
                closeContactModal();
            } else if (method === 'call') {
                const cleanPhone = guardian.phone.replace(/\D/g, '');
                window.location.href = `tel:${cleanPhone}`;
                closeContactModal();
            }
        }

        function openContactModal() {
            if (guardians.length === 0) {
                playErrorSound();
                showToast('⚠️ Nenhum responsável cadastrado. Adicione na aba "Responsáveis"');
                return;
            }
            contactList.innerHTML = guardians.map(g => `
                <div class="contact-option">
                    <div class="contact-info">
                        <div class="name">${escapeHtml(g.name)}${g.isPrimary ? '<span class="emergency-badge">⭐ Principal</span>' : ''}</div>
                        <div class="relationship">${escapeHtml(g.relationship)}</div>
                        <div class="phone-display">📞 ${escapeHtml(g.phone)}</div>
                    </div>
                    <button class="contact-action whatsapp-action" onclick="contactGuardian('${g.id}', 'whatsapp')" title="WhatsApp" aria-label="Enviar WhatsApp para ${escapeHtml(g.name)}">💬</button>
                    <button class="contact-action phone-action" onclick="contactGuardian('${g.id}', 'call')" title="Ligar" aria-label="Ligar para ${escapeHtml(g.name)}">📞</button>
                </div>
            `).join('');
            contactModal.classList.add('active');
        }

        function closeContactModal() {
            contactModal.classList.remove('active');
        }

        function sendQuickMessageToSelected(message) {
            const primary = guardians.find(g => g.isPrimary) || guardians[0];
            if (!primary) {
                playErrorSound();
                showToast('⚠️ Nenhum responsável cadastrado');
                return;
            }
            const fullMessage = `🌻∞ Mensagem da Jornada de Bia:\n\n${message}`;
            playClickSound();
            openWhatsApp(primary.phone, fullMessage);
            closeContactModal();
        }

        // ============================================
        // FUNÇÕES FAB
        // ============================================

        function toggleFab() {
            fabMain.classList.toggle('active');
            fabOptions.classList.toggle('active');
            if (navigator.vibrate) navigator.vibrate(8);
        }

        function updateFabOptions() {
            if (guardians.length === 0) {
                quickContactFab.style.display = 'none';
                return;
            }
            quickContactFab.style.display = 'flex';
            const primary = guardians.find(g => g.isPrimary) || guardians[0];
            const others = guardians.filter(g => g.id !== primary.id).slice(0, 2);
            const contacts = [primary, ...others];
            fabOptions.innerHTML = contacts.map(g => `
                <button class="fab-option whatsapp" onclick="contactGuardian('${g.id}', 'whatsapp')" aria-label="Enviar WhatsApp para ${escapeHtml(g.name)}">
                    💬
                    <span class="tooltip">${escapeHtml(g.name)}</span>
                </button>
            `).join('') + `
                <button class="fab-option emergency" onclick="openContactModal()" aria-label="Ver todos os contatos">
                    🆘
                    <span class="tooltip">Ver todos</span>
                </button>
            `;
        }

        // ============================================
        // FUNÇÕES DE ESTATÍSTICAS
        // ============================================

        function showStatistics() {
            // O estado visual é controlado pela classe .active, não pelo estilo inline.
            // Isso evita que o primeiro clique considere a seção visível quando o style está vazio.
            const isVisible = statsSection.classList.contains('active');
            statsSection.classList.toggle('active', !isVisible);
            statsSection.style.display = isVisible ? 'none' : 'block';
            statsBtn.setAttribute('aria-expanded', String(!isVisible));
            if (!isVisible) {
                const uniqueSymbols = new Set(history.flatMap(h => h.symbols.map(s => s.id)));
                const avgLength = history.reduce((acc, h) => acc + h.symbols.length, 0) / (history.length || 1);
                document.getElementById('statsGrid').innerHTML = `
                    <div class="stat-item"><span class="stat-value">${history.length}</span><span class="stat-label">Mensagens</span></div>
                    <div class="stat-item"><span class="stat-value">${uniqueSymbols.size}</span><span class="stat-label">Símbolos usados</span></div>
                    <div class="stat-item"><span class="stat-value">${avgLength.toFixed(1)}</span><span class="stat-label">Média por msg</span></div>
                    <div class="stat-item"><span class="stat-value ai-stat">${predictor.getPatternsCount()}</span><span class="stat-label">🧠 Padrões IA</span></div>
                `;
                statsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (navigator.vibrate) navigator.vibrate(8);
            }
        }

        function clearHistory() {
            if (history.length === 0) return;
            if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
                history = [];
                StorageService.setItem('symbolHistory', JSON.stringify(history));
                updateHistory();
                document.getElementById('totalMessages').textContent = 0;
                if (statsSection.classList.contains('active')) showStatistics();
                playErrorSound();
                showToast('🗑️ Histórico limpo');
            }
        }

        function clearAllData() {
            if (!confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) return;
            if (!confirm('Isso apagará: histórico, símbolos editados, responsáveis, informações médicas e padrões da IA. Continuar?')) return;
            // Apaga somente dados pertencentes à Jornada de Bia; preserva outras aplicações
            // que compartilhem a mesma origem. Também encerra a sessão de responsáveis.
            const localCleared = StorageService.clear();
            // Encerra também o estado de segurança em memória (timer/modo responsável).
            try { window.JornadaBiaSecurity?.lock?.(); } catch (e) { /* falha será refletida pela limpeza de sessão */ }
            const sessionCleared = StorageService.clearSession();
            if (!localCleared || !sessionCleared) {
                showToast('⚠️ Não foi possível limpar todos os dados. Verifique as permissões do navegador.');
                return;
            }
            symbolsData = JSON.parse(JSON.stringify(defaultSymbols));
            guardians = JSON.parse(JSON.stringify(defaultGuardians));
            medicalData = JSON.parse(JSON.stringify(defaultMedical));
            history = [];
            selectedSymbols = [];
            predictor.sequences = [];
            predictor.frequency = {};
            predictiveEngine.reset();
            renderCategories();
            renderSymbols();
            renderGuardians();
            renderMedical();
            updateHistory();
            updateSuggestions();
            updateFeedback();
            predictor.updateStats();
            document.getElementById('totalMessages').textContent = 0;
            playErrorSound();
            showToast('🗑️ Todos os dados foram limpos!');
        }

        // ============================================
        // FUNÇÕES DE EDIÇÃO DE SÍMBOLOS
        // ============================================

        function openAddSymbol() {
            editingSymbolId = null;
            document.getElementById('symbolModalTitle').textContent = '➕ Adicionar Símbolo';
            document.getElementById('symbolModalSubtitle').textContent = 'Preencha os dados do novo símbolo';
            document.getElementById('symbolEmoji').value = '';
            document.getElementById('symbolLabel').value = '';
            document.getElementById('symbolCategory').value = 'comer';
            symbolModal.classList.add('active');
        }

        function openEditSymbol(id) {
            const symbol = symbolsData.find(s => s.id === id);
            if (!symbol) return;
            editingSymbolId = id;
            document.getElementById('symbolModalTitle').textContent = '✏️ Editar Símbolo';
            document.getElementById('symbolModalSubtitle').textContent = 'Atualize os dados do símbolo';
            document.getElementById('symbolEmoji').value = symbol.emoji || '';
            document.getElementById('symbolLabel').value = symbol.label || '';
            document.getElementById('symbolCategory').value = symbol.category || 'comer';
            symbolModal.classList.add('active');
        }

        function closeSymbolModal() {
            symbolModal.classList.remove('active');
            editingSymbolId = null;
        }

        function saveSymbol() {
            const emoji = document.getElementById('symbolEmoji').value.trim();
            const label = document.getElementById('symbolLabel').value.trim();
            const category = document.getElementById('symbolCategory').value;
            if (!emoji) {
                playErrorSound();
                showToast('⚠️ Por favor, informe o emoji');
                document.getElementById('symbolEmoji').focus();
                return;
            }
            if (!label) {
                playErrorSound();
                showToast('⚠️ Por favor, informe o nome do símbolo');
                document.getElementById('symbolLabel').focus();
                return;
            }
            if (editingSymbolId) {
                const index = symbolsData.findIndex(s => s.id === editingSymbolId);
                if (index !== -1) {
                    symbolsData[index] = { ...symbolsData[index], emoji, label, category };
                }
                playSuccessSound();
                showToast('✅ Símbolo atualizado com sucesso!');
            } else {
                const newId = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') + '_' + Date.now();
                symbolsData.push({ id: newId, emoji, label, category });
                playSuccessSound();
                showToast('✅ Símbolo adicionado com sucesso!');
            }
            StorageService.setItem('symbolsData', JSON.stringify(symbolsData));
            predictor.cleanOrphanReferences();
            renderSymbols();
            renderCategories();
            closeSymbolModal();
        }

        function deleteSymbol(id) {
            const symbol = symbolsData.find(s => s.id === id);
            if (!symbol) return;
            if (!confirm(`Tem certeza que deseja excluir o símbolo "${symbol.label}"?`)) return;
            symbolsData = symbolsData.filter(s => s.id !== id);
            StorageService.setItem('symbolsData', JSON.stringify(symbolsData));
            predictor.cleanOrphanReferences();
            renderSymbols();
            renderCategories();
            playErrorSound();
            showToast('🗑️ Símbolo removido');
        }

        // ============================================
        // FUNÇÕES DE TOAST
        // ============================================

        function showToast(message) {
            const oldToast = document.querySelector('.toast-message');
            if (oldToast) oldToast.remove();
            const toast = document.createElement('div');
            toast.className = 'toast-message';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // ============================================
        // EXPORTA FUNÇÕES PARA O WINDOW (onclick)
        // ============================================
        window.openHealthPlanSelector = openHealthPlanSelector;
        window.openAllergiesSelector = openAllergiesSelector;
        window.closeHealthPlanModal = closeHealthPlanModal;
        window.closeAllergiesModal = closeAllergiesModal;
        window.selectHealthPlan = selectHealthPlan;
        window.selectAllergies = selectAllergies;
        window.filterHealthPlans = filterHealthPlans;
        window.filterAllergies = filterAllergies;
        window.contactGuardian = contactGuardian;
        window.sendQuickMessageToSelected = sendQuickMessageToSelected;
        window.closeContactModal = closeContactModal;
        window.openEditSymbol = openEditSymbol;
        window.deleteSymbol = deleteSymbol;
        window.filterCategory = filterCategory;
        window.togglePrimary = togglePrimary;
        window.emailGuardian = emailGuardian;

        // ============================================
        // EVENT LISTENERS
        // ============================================
        
        document.getElementById('showAllCategories').addEventListener('click', () => {
            filterCategory('all');
            if (navigator.vibrate) navigator.vibrate(8);
        });
        document.getElementById('showAllCategories').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                filterCategory('all');
                if (navigator.vibrate) navigator.vibrate(8);
            }
        });

        toggleSymbolsView.addEventListener('click', () => {
            showAllSymbols = !showAllSymbols;
            renderSymbols();
            if (navigator.vibrate) navigator.vibrate(8);
        });
        toggleSymbolsView.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showAllSymbols = !showAllSymbols;
                renderSymbols();
                if (navigator.vibrate) navigator.vibrate(8);
            }
        });

        clearBtn.addEventListener('click', clearMessage);
        speakBtn.addEventListener('click', speakNaturalMessage);
        saveBtn.addEventListener('click', saveMessage);
        statsBtn.addEventListener('click', showStatistics);
        clearHistoryBtn.addEventListener('click', clearHistory);
        clearHistoryBtn2.addEventListener('click', clearHistory);
        themeToggle.addEventListener('click', toggleTheme);
        whatsappContactBtn.addEventListener('click', openContactModal);

        suggestionsToggle.addEventListener('click', () => {
            const list = suggestionsList;
            const arrow = suggestionsToggle.querySelector('.suggestions-arrow');
            const isCollapsed = list.classList.toggle('collapsed');
            arrow.classList.toggle('collapsed', isCollapsed);
            if (navigator.vibrate) navigator.vibrate(5);
        });
        suggestionsToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const list = suggestionsList;
                const arrow = suggestionsToggle.querySelector('.suggestions-arrow');
                const isCollapsed = list.classList.toggle('collapsed');
                arrow.classList.toggle('collapsed', isCollapsed);
                if (navigator.vibrate) navigator.vibrate(5);
            }
        });

        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                showPage(btn.dataset.page);
                if (navigator.vibrate) navigator.vibrate(8);
            });
        });

        addGuardianBtn.addEventListener('click', openAddGuardian);
        document.getElementById('modalCancel').addEventListener('click', closeGuardianModal);
        document.getElementById('modalSave').addEventListener('click', saveGuardian);
        addSymbolBtn.addEventListener('click', openAddSymbol);
        symbolModalCancel.addEventListener('click', closeSymbolModal);
        symbolModalSave.addEventListener('click', saveSymbol);
        medicalSaveBtn.addEventListener('click', saveMedicalData);

        voiceSelect.addEventListener('change', () => {
            const selected = voiceSelect.value;
            StorageService.setItem('selectedVoice', selected);
            currentVoice = selected;
            updateVoiceQuality();
            previewVoice();
            playClickSound();
        });

        voiceRateInput.addEventListener('input', updateVoiceSettings);
        voicePitchInput.addEventListener('input', updateVoiceSettings);

        autoSpeakToggle.addEventListener('change', () => {
            autoSpeak = autoSpeakToggle.checked;
            StorageService.setItem('autoSpeak', autoSpeak);
            playClickSound();
        });

        darkModeToggle.addEventListener('change', applyThemeFromSettings);
        colorThemeSelect.addEventListener('change', applyThemeFromSettings);
        clearAllDataBtn.addEventListener('click', clearAllData);

        document.getElementById('guardianModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeGuardianModal();
        });

        symbolModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeSymbolModal();
        });

        contactModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeContactModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeGuardianModal();
                closeContactModal();
                closeSymbolModal();
                closeHealthPlanModal();
                closeAllergiesModal();
            }
            if (e.key === 'Enter' && document.getElementById('guardianModal').classList.contains('active')) {
                saveGuardian();
            }
            if (e.key === 'Enter' && symbolModal.classList.contains('active')) {
                saveSymbol();
            }
            if (e.key === 'Escape') clearMessage();
            if (e.key === 'Enter' && e.ctrlKey) speakMessage();
            if (e.key === 's' && e.ctrlKey) { 
                e.preventDefault(); 
                saveMessage(); 
            }
        });

        fabMain.addEventListener('click', toggleFab);

        // Modais médicos
        document.getElementById('healthPlanModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeHealthPlanModal();
        });
        document.getElementById('allergiesModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeAllergiesModal();
        });

        // ============================================
        // PWA INSTALLATION
        // ============================================
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installBanner').style.display = 'flex';
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    document.getElementById('installBanner').style.display = 'none';
                    playSuccessSound();
                }
                deferredPrompt = null;
            }
        });

        document.getElementById('installClose').addEventListener('click', () => {
            document.getElementById('installBanner').style.display = 'none';
        });

        window.addEventListener('appinstalled', () => {
            document.getElementById('installBanner').style.display = 'none';
            playSuccessSound();
        });

        // ============================================
        // SERVICE WORKER
        // ============================================
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(() => console.log('✅ ServiceWorker registrado'))
                    .catch(err => console.log('❌ Erro:', err));
            });
        }

        // ============================================
        // V14: PERFIL, INTENÇÕES, SOS E BACKUP
        // ============================================
        function renderChildProfile(){
            const name = childProfile.name || 'Bia';
            const greeting = childProfile.greeting || `Olá, ${name}! 🌻`;
            const avatar = document.getElementById('childAvatar');
            const preview = document.getElementById('profilePhotoPreview');
            [avatar,preview].forEach(el=>{ if(!el)return; el.replaceChildren(); if(childProfile.photo && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(childProfile.photo) && childProfile.photo.length <= 3*1024*1024){ const img=document.createElement('img'); img.src=childProfile.photo; img.alt=`Foto de ${name}`; el.appendChild(img); } else { el.textContent='🌻'; } });
            const g=document.getElementById('childGreeting'); if(g) g.textContent=greeting;
            const np=document.getElementById('profileNamePreview'); if(np) np.textContent=name;
            const ni=document.getElementById('childName'); if(ni) ni.value=childProfile.name||'';
            const gi=document.getElementById('childGreetingInput'); if(gi) gi.value=childProfile.greeting||'';
        }
        function saveChildProfile(){
            childProfile.name=(document.getElementById('childName')?.value||'Bia').trim()||'Bia';
            childProfile.greeting=(document.getElementById('childGreetingInput')?.value||`Olá, ${childProfile.name}! 🌻`).trim();
            StorageService.setItem('childProfile',JSON.stringify(childProfile)); renderChildProfile(); showToast('🌻 Perfil salvo');
        }
        function resetChildProfile(){ childProfile={name:'Bia',greeting:'Olá! 🌻 Vamos conversar?',photo:''}; StorageService.setItem('childProfile',JSON.stringify(childProfile)); renderChildProfile(); showToast('↩️ Perfil restaurado'); }
        function handleChildPhoto(e){ const file=e.target.files?.[0]; if(!file)return; if(file.size>2*1024*1024){showToast('⚠️ Escolha uma foto de até 2 MB');return;} const r=new FileReader(); r.onload=()=>{childProfile.photo=r.result; StorageService.setItem('childProfile',JSON.stringify(childProfile));renderChildProfile();showToast('📷 Foto atualizada')}; r.readAsDataURL(file); }
        function selectIntent(intent){
            selectedIntent=intent;
            StorageService.setItem('selectedIntent',intent);
            document.querySelectorAll('.intent-btn').forEach(b=>b.classList.toggle('active',b.dataset.intent===intent));

            const suggestionMaps={
              quero:[['💧','Quero água.'],['🍎','Quero comer.'],['🧸','Quero brincar.'],['🏠','Quero ir para casa.'],['➕','Quero mais.'],['❌','Não quero.']],
              preciso:[['🆘','Preciso de ajuda.'],['❤️','Quero meu responsável.'],['🤕','Estou com dor.'],['🚽','Preciso ir ao banheiro.'],['🌙','Preciso de um lugar tranquilo.'],['🚪','Preciso sair daqui.']],
              sentindo:[['😊','Estou feliz.'],['😢','Estou triste.'],['😡','Estou bravo.'],['😴','Estou cansado.'],['😨','Estou com medo.'],['🤕','Estou com dor.']],
              lugar:[['🏠','Quero ir para casa.'],['🚽','Quero ir ao banheiro.'],['🚪','Quero sair.'],['👨‍👩‍👧','Onde está minha família?']]
            };
            const titleMap={quero:'💙 O que você quer?',preciso:'🆘 O que você precisa?',sentindo:'😊 Como você está?',lugar:'📍 Onde você quer ir?'};
            const expansion=document.getElementById('intentExpansion');
            const suggestions=document.getElementById('intentSuggestions');
            const title=document.getElementById('intentExpansionTitle');
            const hint=document.getElementById('intentExpansionHint');
            if(!expansion||!suggestions)return;
            const items=suggestionMaps[intent]||[];
            if(title) title.textContent=titleMap[intent]||INTENT_LABELS[intent]||'Escolha uma opção';
            if(hint) hint.textContent='Sugestões para você';
            suggestions.innerHTML=items.map(([emoji,text],i)=>`<button class="intent-suggestion" type="button" data-index="${i}" aria-label="${escapeHtml(text)}"><span>${escapeHtml(emoji)}</span><strong>${escapeHtml(text)}</strong></button>`).join('');
            suggestions.querySelectorAll('.intent-suggestion').forEach(btn=>btn.addEventListener('click',()=>{
                const item=items[Number(btn.dataset.index)];
                if(!item)return;
                const text=item[1];
                speakText(text);
                recordPhraseUse(text);
                predictor.recordPhrase(text);
                playClickSound();
                if(navigator.vibrate)navigator.vibrate(10);
            }));
            expansion.hidden=false;
            expansion.classList.remove('is-closing');
            requestAnimationFrame(()=>expansion.classList.add('is-open'));
        }

        function collapseIntentExpansion(){
            const expansion=document.getElementById('intentExpansion');
            if(!expansion)return;
            expansion.classList.remove('is-open');
            expansion.classList.add('is-closing');
            setTimeout(()=>{ if(!expansion.classList.contains('is-open')) expansion.hidden=true; },180);
            document.querySelectorAll('.intent-btn').forEach(b=>b.classList.remove('active'));
        }
        function recordPhraseUse(text){
            const key='phraseUsage'; const data=JSON.parse(StorageService.getItem(key)||'{}'); data[text]=(data[text]||0)+1; StorageService.setItem(key,JSON.stringify(data));
        }
        function speakNaturalMessage(){
            if(!selectedSymbols.length)return;
            const generated=phraseGenerator.generatePhrase(selectedSymbols); speakText(generated?.text || selectedSymbols.map(s=>s.label).join(' '));
        }
        function emergencyHelp(){
            const name=childProfile.name||'Bia';
            const msg=`${name} precisa de ajuda agora. Por favor, venha me ajudar.`;
            speakText(msg,true); playErrorSound(); if(navigator.vibrate)navigator.vibrate([80,60,120,60,180]);
            const primary=guardians.find(g=>g.isPrimary)||guardians[0];
            if(primary?.phone && confirm('Deseja abrir o contato do responsável principal?')) openWhatsApp(primary.phone,`🆘 ${msg}`);
        }
        function rateAI(kind){ aiFeedback[kind]=(aiFeedback[kind]||0)+1; StorageService.setItem('aiFeedback',JSON.stringify(aiFeedback)); showToast(kind==='like'?'👍 Obrigado! Vou valorizar esse tipo de sugestão.':'👎 Obrigado! Vou evitar esse tipo de sugestão.'); }
        async function exportBackup(options = {}) {
            try {
                const payload = {
                    symbolsData, guardians, medicalData, history, favoriteIds, symbolUsage, childProfile, aiFeedback,
                    voiceRate, voicePitch, autoSpeak, theme: StorageService.getItem('theme'),
                    predictorData: JSON.parse(StorageService.getItem('predictorData') || '{\"sequences\":[],\"frequency\":{}}'),
                    predictivePhraseData: JSON.parse(StorageService.getItem('predictivePhraseData') || '{}'),
                    contextBrainData: JSON.parse(StorageService.getItem('contextBrainData') || '{}'),
                    environmentContext: StorageService.getItem('environmentContext') || 'auto'
                };
                const password = prompt('Crie uma senha para proteger este backup (mínimo 8 caracteres):');
                if(password === null) return;
                await BackupService.export(payload, { configurationOnly: !!options.configurationOnly, password });
                showToast(options.configurationOnly ? '⬇️ Backup de configuração exportado' : '⬇️ Backup completo exportado');
            } catch (err) { console.error(err); showToast('❌ Não foi possível exportar o backup'); }
        }

        async function importBackupFile(e){
            const file=e.target.files?.[0]; if(!file)return;
            try {
                const p=await BackupService.readAndValidate(file);
                const preImportPassword = prompt('Crie uma senha para o backup de segurança antes da importação (mínimo 8 caracteres):');
                if (preImportPassword === null) { showToast('Importação cancelada'); return; }
                if (preImportPassword.length < 8) { showToast('A senha deve ter pelo menos 8 caracteres'); return; }
                await BackupService.export({ symbolsData, guardians, medicalData, history, favoriteIds, symbolUsage, childProfile, aiFeedback }, { preImport: true, password: preImportPassword });
                const d=p.data;
                if(!Array.isArray(d.symbolsData)) throw new Error('Backup inválido');
                StorageService.setItem('symbolsData',JSON.stringify(d.symbolsData));
                if(p.type !== 'configuration') {
                    if(!Array.isArray(d.guardians)) throw new Error('Backup inválido');
                    StorageService.setItem('guardians',JSON.stringify(d.guardians));
                }
                if(d.medicalData)StorageService.setItem('medicalData',JSON.stringify(d.medicalData));
                if(d.history)StorageService.setItem('symbolHistory',JSON.stringify(Array.isArray(d.history)?d.history.slice(-50):[]));
                if(d.favoriteIds)StorageService.setItem('favoriteIds',JSON.stringify(Array.isArray(d.favoriteIds)?d.favoriteIds:[]));
                if(d.symbolUsage)StorageService.setItem('symbolUsage',JSON.stringify(d.symbolUsage));
                if(d.childProfile)StorageService.setItem('childProfile',JSON.stringify(d.childProfile));
                if(d.aiFeedback)StorageService.setItem('aiFeedback',JSON.stringify(d.aiFeedback));
                if(d.predictorData)StorageService.setItem('predictorData',JSON.stringify(d.predictorData));
                if(d.predictivePhraseData)StorageService.setItem('predictivePhraseData',JSON.stringify(d.predictivePhraseData));
                if(d.contextBrainData)StorageService.setItem('contextBrainData',JSON.stringify(d.contextBrainData));
                if(typeof d.environmentContext==='string')StorageService.setItem('environmentContext',d.environmentContext);
                if(typeof d.theme==='string')StorageService.setItem('theme',d.theme);
                if(typeof d.voiceRate==='number')StorageService.setItem('voiceRate',String(d.voiceRate));
                if(typeof d.voicePitch==='number')StorageService.setItem('voicePitch',String(d.voicePitch));
                if(typeof d.autoSpeak==='boolean')StorageService.setItem('autoSpeak',String(d.autoSpeak));
                showToast('⬆️ Backup validado e importado. Recarregando...');
                setTimeout(()=>location.reload(),700);
            } catch(err) { console.error(err); showToast('❌ Backup inválido ou corrompido'); }
            finally { e.target.value=''; }
        }

        function renderQuickPhrases() {
            if (!quickPhrasesGrid) return;
            quickPhrasesGrid.innerHTML = QUICK_PHRASES.map(p => `<button class="quick-phrase-btn" type="button" data-phrase="${escapeHtml(p.text)}">${escapeHtml(p.text)}<small>Toque para falar</small></button>`).join('');
            quickPhrasesGrid.querySelectorAll('.quick-phrase-btn').forEach(btn => btn.addEventListener('click', () => {
                selectedSymbols = []; updateFeedback();
                speakText(btn.dataset.phrase);
                playClickSound();
            }));
        }

        function renderMostUsed() {
            const grid = document.getElementById('mostUsedGrid');
            if (!grid) return;
            const ranked = symbolsData
                .map(s => ({s, count: Number(symbolUsage[s.id] || 0)}))
                .filter(x => x.count > 0)
                .sort((a,b) => b.count - a.count)
                .slice(0, 8);
            grid.innerHTML = ranked.length ? ranked.map(x => `
                <button class="most-used-card" type="button" data-id="${x.s.id}" aria-label="Adicionar ${escapeHtml(x.s.label)}. Usado ${x.count} vezes">
                    <span class="emoji">${escapeHtml(x.s.emoji)}</span><span class="label">${escapeHtml(x.s.label)}</span><span class="usage-count">${x.count} uso${x.count===1?'':'s'}</span>
                </button>`).join('') : '<div style="grid-column:1/-1;color:var(--text-light);font-size:.85rem;font-weight:600;padding:10px 0;">Os símbolos mais usados aparecerão aqui conforme a Jornada de Bia for utilizada.</div>';
            grid.querySelectorAll('.most-used-card').forEach(btn => btn.addEventListener('click', () => {
                const sym = symbolsData.find(x => x.id === btn.dataset.id); if (sym) { playClickSound(); addSymbol(sym); }
            }));
        }

        function renderFavorites() {
            if (!favoritesGrid) return;
            const favs = symbolsData.filter(s => favoriteIds.includes(s.id));
            favoritesGrid.innerHTML = favs.length ? favs.map(s => `<button class="favorite-symbol-btn" type="button" data-id="${s.id}">${escapeHtml(s.emoji)} ${escapeHtml(s.label)} <span class="favorite-star">⭐</span></button>`).join('') : '<div style="color:var(--text-light);font-size:.85rem;font-weight:600;">Use ⭐ nos símbolos para criar seus favoritos.</div>';
            favoritesGrid.querySelectorAll('.favorite-symbol-btn').forEach(btn => btn.addEventListener('click', () => { const s=symbolsData.find(x=>x.id===btn.dataset.id); if(s) addSymbol(s); }));
            const favoritesSection = document.getElementById('favoritesSection');
            const favoritesToggle = document.getElementById('favoritesToggle');
            if (favoritesSection && favoritesToggle && favoritesGrid) {
                const isOpen = favoritesToggle.getAttribute('aria-expanded') === 'true';
                favoritesGrid.hidden = !isOpen;
                favoritesSection.classList.toggle('is-open', isOpen);
            }
        }

        function toggleFavorite(symbol) {
            favoriteIds = favoriteIds.includes(symbol.id) ? favoriteIds.filter(id=>id!==symbol.id) : [...favoriteIds, symbol.id];
            StorageService.setItem('favoriteIds', JSON.stringify(favoriteIds));
            renderFavorites(); renderMostUsed(); renderSymbols();
        }

        function setGuardianMode(unlocked) {
            guardianUnlocked = unlocked;
            SecurityService.setSessionUnlocked(unlocked);
            if (guardianModeBtn) guardianModeBtn.textContent = unlocked ? '🔒 Bloquear' : '🔓 Ativar'; const cm=document.getElementById('childModeBtn'); if(cm) cm.textContent=unlocked?'🌻 Modo Criança':'🔐 Responsável';
            document.querySelectorAll('#page-edit-symbols input,#page-edit-symbols button.add-symbol-btn').forEach(el => el.disabled = !unlocked);
        }

        async function toggleGuardianMode() {
            if (guardianUnlocked) { setGuardianMode(false); showToast('🔒 Modo Responsável bloqueado'); return; }
            if (SecurityService.isLocked()) { showToast('⏳ Muitas tentativas. Aguarde alguns segundos.'); return; }
            if (SecurityService.isBiometricConfigured()) {
                try {
                    if (await SecurityService.verifyBiometric()) {
                        setGuardianMode(true); showToast('🔓 Modo Responsável ativado por biometria'); return;
                    }
                } catch (error) {
                    // Cancelar a biometria não bloqueia o acesso por PIN.
                }
                showToast('Biometria não concluída. Você pode usar seu PIN.');
            }
            const existing = await SecurityService.hasPin();
            if (!existing) {
                const pin = prompt('Crie um PIN de 4 dígitos para o Modo Responsável:');
                if (!/^\d{4}$/.test(pin || '')) { showToast('⚠️ Use exatamente 4 dígitos'); return; }
                const confirmPin = prompt('Digite o PIN novamente para confirmar:');
                if (confirmPin !== pin) { showToast('❌ Os PINs não conferem'); return; }
                await SecurityService.setPin(pin);
            }
            const entered = prompt('Digite o PIN do Modo Responsável:');
            const result = await SecurityService.verifyPin(entered || '');
            if (result.ok) { setGuardianMode(true); showToast('🔓 Modo Responsável ativado'); }
            else showToast(result.reason === 'locked' ? '⏳ Muitas tentativas. Aguarde.' : `❌ PIN incorreto (${result.remaining} tentativa(s))`);
        }

        // ============================================
        // V15: FLUXOS DE COMUNICAÇÃO E CONTEXTO
        // ============================================
        const HUB_OPTIONS={
            necessidade:[['💧','Quero água.'],['🍎','Quero comer.'],['🧸','Quero brincar.'],['❌','Não quero.'],['➕','Quero mais.'],['✅','Acabou.']],
            sentimento:[['😊','Estou feliz.'],['😢','Estou triste.'],['😡','Estou bravo.'],['😴','Estou cansado.'],['😨','Estou com medo.'],['❤️','Gosto de você.']],
            dor:[['🤕','Estou com dor.'],['🧠','Minha cabeça dói.'],['🫃','Minha barriga dói.'],['👂','Meu ouvido dói.'],['🦵','Minha perna dói.'],['🖐️','Meu braço dói.'],['🦷','Meu dente dói.'],['❓','Não sei onde dói.']],
            social:[['👋','Oi!'],['🙏','Obrigado!'],['❤️','Eu gosto de você.'],['🙋','Posso?'],['❓','O que é isso?'],['👋','Tchau!'],['🏠','Quero falar com minha família.'],['🧑‍🏫','Quero falar com meu responsável.']]
        };
        function openHub(hub){
            activeHub=hub; StorageService.setItem('activeHub',hub);
            document.querySelectorAll('.comm-btn').forEach(b=>b.classList.toggle('active',b.dataset.hub===hub));
            const panel=document.getElementById('adaptivePanel'), title=document.getElementById('adaptiveTitle'), choices=document.getElementById('adaptiveChoices');
            if(!panel||!choices)return; panel.hidden=false;
            const names={necessidade:'💙 O que você precisa?',sentimento:'❤️ Como você está?',dor:'🤕 Onde ou como dói?',social:'👋 O que você quer dizer?'};
            title.textContent=names[hub]||'Escolha uma opção';
            choices.className='adaptive-grid'+(hub==='dor'?' pain-grid':'');
            choices.innerHTML=(HUB_OPTIONS[hub]||[]).map((o,i)=>`<button class="adaptive-choice" type="button" data-choice="${i}">${escapeHtml(o[0])} ${escapeHtml(o[1])}</button>`).join('');
            choices.querySelectorAll('.adaptive-choice').forEach(btn=>btn.addEventListener('click',()=>{
                const item=HUB_OPTIONS[hub][Number(btn.dataset.choice)];
                const text=item[1]; showAdaptivePhrase(text); recordPhraseUse(text); predictor.recordPhrase(text); playClickSound();
                if(navigator.vibrate)navigator.vibrate(12);
            }));
        }
        function showAdaptivePhrase(text){
            const box=document.getElementById('phrasePreview'), out=document.getElementById('phrasePreviewText');
            if(!box||!out)return; out.textContent=text; box.hidden=false; box.dataset.phrase=text;
        }
        function speakAdaptivePhrase(){
            const box=document.getElementById('phrasePreview'); const text=box?.dataset?.phrase; if(text){speakText(text);playSuccessSound();}
        }
        function getContextualPhrases(){
            const h=new Date().getHours();
            if(h>=6&&h<11)return ['Bom dia!','Quero tomar café.','Estou com sono.'];
            if(h>=11&&h<15)return ['Quero almoçar.','Quero água.','Estou com fome.'];
            if(h>=15&&h<19)return ['Quero brincar.','Quero um lanche.','Quero sair.'];
            return ['Quero jantar.','Estou cansado.','Quero ir para casa.'];
        }
        function renderContextualQuickPhrases(){
            const grid=document.getElementById('quickPhrasesGrid'); if(!grid)return;
            const base=getContextualPhrases();
            const usage=JSON.parse(StorageService.getItem('phraseUsage')||'{}');
            const merged=[...base,...QUICK_PHRASES.map(x=>x.text)];
            const unique=[...new Set(merged)].sort((a,b)=>(usage[b]||0)-(usage[a]||0)).slice(0,8);
            grid.innerHTML=unique.map(t=>`<button class="quick-phrase-btn" type="button" data-phrase="${escapeHtml(t)}">${escapeHtml(t)}<small>Toque para falar</small></button>`).join('');
            grid.querySelectorAll('.quick-phrase-btn').forEach(btn=>btn.addEventListener('click',()=>{speakText(btn.dataset.phrase);playClickSound();recordPhraseUse(btn.dataset.phrase);}));
        }

        document.getElementById('clearMostUsed')?.addEventListener('click',()=>{ symbolUsage={}; StorageService.setItem('symbolUsage','{}'); renderMostUsed(); showToast('🔥 Destaques de uso limpos'); });
        document.getElementById('clearMostUsed')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('clearMostUsed').click();}});

        document.getElementById('resetLearningBtn')?.addEventListener('click',()=>{
            if(confirm('Reiniciar o aprendizado da Jornada de Bia? O histórico de mensagens não será apagado.')){ predictor.reset(); predictiveEngine.reset(); StorageService.removeItem('phraseUsage'); StorageService.removeItem('contextBrainData'); contextBrain.stats={}; showToast('♻️ Aprendizado reiniciado'); renderPredictivePhrases(); }
        });

        // ============================================
        // V18: EVENTOS
        // ============================================
        document.querySelectorAll('.intent-btn').forEach(btn=>btn.addEventListener('click',()=>selectIntent(btn.dataset.intent)));
        document.getElementById('intentCollapseBtn')?.addEventListener('click',collapseIntentExpansion);
        // V31: construtor de frase fechado por padrão
        function toggleHomePhraseBuilder(force){
            const home=document.getElementById('page-home');
            const toggle=document.getElementById('phraseBuilderToggle');
            if(!home||!toggle)return;
            const open=typeof force==='boolean' ? force : !home.classList.contains('home-builder-open');
            home.classList.toggle('home-builder-open',open);
            toggle.setAttribute('aria-expanded',String(open));
            const label=document.getElementById('phraseBuilderLabel');
            if(label) label.textContent=open?'Fechar construtor':'Construa sua frase';
            if(open){
                setTimeout(()=>document.getElementById('homeSymbolsBuilder')?.scrollIntoView({behavior:'smooth',block:'start'}),60);
            }else{
                document.getElementById('intentExpansion')?.setAttribute('hidden','');
            }
            playClickSound();
        }
        document.getElementById('phraseBuilderToggle')?.addEventListener('click',()=>toggleHomePhraseBuilder());
        document.getElementById('phraseBuilderClose')?.addEventListener('click',()=>toggleHomePhraseBuilder(false));

        document.getElementById('favoritesToggle')?.addEventListener('click',()=>{
            const toggle=document.getElementById('favoritesToggle');
            const grid=document.getElementById('favoritesGrid');
            const section=document.getElementById('favoritesSection');
            if(!toggle||!grid)return;
            const open=toggle.getAttribute('aria-expanded')!=='true';
            toggle.setAttribute('aria-expanded',String(open));
            grid.hidden=!open;
            section?.classList.toggle('is-open',open);
            if(open) renderFavorites();
            playClickSound();
        });
        document.getElementById('hereBtn')?.addEventListener('click',()=>{ selectedIntent=''; StorageService.removeItem('selectedIntent'); document.querySelectorAll('.intent-btn').forEach(b=>b.classList.remove('active')); speakText('Eu estou aqui.'); recordPhraseUse('Eu estou aqui.'); predictor.recordPhrase('Eu estou aqui.'); playClickSound(); if(navigator.vibrate)navigator.vibrate(12); });
        document.querySelectorAll('.comm-btn').forEach(btn=>btn.addEventListener('click',()=>openHub(btn.dataset.hub)));
        document.getElementById('speakAdaptiveBtn')?.addEventListener('click',speakAdaptivePhrase);
        document.getElementById('sosBtn')?.addEventListener('click',emergencyHelp);
        document.getElementById('aiLikeBtn')?.addEventListener('click',()=>rateAI('like'));
        document.getElementById('aiDislikeBtn')?.addEventListener('click',()=>rateAI('dislike'));
        document.getElementById('saveProfileBtn')?.addEventListener('click',saveChildProfile);
        document.getElementById('resetProfileBtn')?.addEventListener('click',resetChildProfile);
        document.getElementById('childPhotoInput')?.addEventListener('change',handleChildPhoto);
        document.getElementById('exportDataBtn')?.addEventListener('click',exportBackup);
        document.getElementById('exportConfigBtn')?.addEventListener('click',()=>exportBackup({configurationOnly:true}));
        document.getElementById('importDataBtn')?.addEventListener('click',()=>document.getElementById('importDataInput')?.click());
        document.getElementById('importDataInput')?.addEventListener('change',importBackupFile);
        document.getElementById('environmentContext')?.addEventListener('change',e=>{contextBrain.environment=e.target.value;StorageService.setItem('environmentContext',e.target.value);contextBrain.render();showToast('📍 Contexto atualizado');});
        document.getElementById('clearContextBtn')?.addEventListener('click',()=>{contextBrain.environment='auto';StorageService.setItem('environmentContext','auto');const el=document.getElementById('environmentContext');if(el)el.value='auto';contextBrain.render();showToast('↺ Contexto automático');});
        document.getElementById('speakContextPrediction')?.addEventListener('click',()=>{const d=contextBrain.infer();if(d.prediction){speakText(d.prediction);recordPhraseUse(d.prediction);predictor.recordPhrase(d.prediction);contextBrain.learn(d.prediction);}});
        document.getElementById('useContextPrediction')?.addEventListener('click',()=>{const d=contextBrain.infer();if(d.prediction){showAdaptivePhrase(d.prediction);recordPhraseUse(d.prediction);predictor.recordPhrase(d.prediction);predictiveEngine.learn(selectedSymbols,d.prediction);contextBrain.learn(d.prediction);renderPredictivePhrases();}});
        contextBrain.render();

        document.getElementById('childModeBtn')?.addEventListener('click',()=>{ if(guardianUnlocked){setGuardianMode(false);showToast('🌻 Modo Criança ativado')} else showPage('guardians'); });
        renderChildProfile();
        renderContextualQuickPhrases();
        if(activeHub) openHub(activeHub);
        if(selectedIntent) document.querySelector(`.intent-btn[data-intent="${selectedIntent}"]`)?.classList.remove('active');

        // ============================================
        // INICIALIZAÇÃO
        // ============================================
        if (voicePreviewBtn) voicePreviewBtn.addEventListener('click', previewVoice);
        if (guardianModeBtn) guardianModeBtn.addEventListener('click', toggleGuardianMode);

        async function refreshBiometricSettings() {
            if (!biometricStatus || !biometricSetupBtn || !biometricRemoveBtn) return;
            const configured = SecurityService.isBiometricConfigured();
            const available = await SecurityService.isBiometricAvailable();
            biometricStatus.textContent = configured
                ? 'Biometria configurada neste navegador. O PIN continua disponível como alternativa.'
                : available
                    ? 'Aparelho compatível detectado. Configure depois de criar o PIN do Modo Responsável.'
                    : 'Não detectamos um autenticador biométrico compatível. Verifique HTTPS e o suporte do aparelho.';
            biometricRemoveBtn.disabled = !configured;
            biometricSetupBtn.disabled = !available;
            biometricSetupBtn.textContent = configured ? '🔄 Reconfigurar biometria' : '🔑 Configurar biometria';
        }
        if (biometricSetupBtn) biometricSetupBtn.addEventListener('click', async () => {
            biometricSetupBtn.disabled = true;
            try {
                await SecurityService.registerBiometric();
                showToast('✅ Biometria configurada neste navegador');
            } catch (error) {
                showToast('⚠️ ' + (error?.message || 'Não foi possível configurar a biometria.'));
            } finally { await refreshBiometricSettings(); }
        });
        if (biometricRemoveBtn) biometricRemoveBtn.addEventListener('click', async () => {
            if (!SecurityService.isBiometricConfigured()) return;
            if (confirm('Remover a biometria deste navegador? O PIN continuará funcionando.')) {
                SecurityService.removeBiometric();
                showToast('Biometria removida. O PIN continua disponível.');
                await refreshBiometricSettings();
            }
        });
        refreshBiometricSettings();
        if (speechSynthesisEnabled) { window.speechSynthesis.onvoiceschanged = loadVoices; setTimeout(loadVoices, 250); }

        loadTheme();
        loadVoiceSettings();
        renderQuickPhrases();
        setGuardianMode(guardianUnlocked);
        renderCategories();
        renderSymbols();
        if (symbolsGrid) symbolsGrid.addEventListener('dblclick', (e) => { const card=e.target.closest('[data-symbol-id], .symbol-card'); const id=card?.dataset?.symbolId || card?.getAttribute('data-id'); const sym=symbolsData.find(x=>x.id===id); if(sym){ toggleFavorite(sym); showToast(favoriteIds.includes(id)?'⭐ Adicionado aos favoritos':'☆ Removido dos favoritos'); } });
        renderFavorites();
        renderGuardians();
        renderMedical();
        updateHistory();
        updateSuggestions();
        predictor.updateStats();
        document.getElementById('totalMessages').textContent = history.length;
        showPage('home');

        const tempMessage = StorageService.getItem('tempMessage');
        if (tempMessage) {
            try {
                const parsed = JSON.parse(tempMessage);
                if (parsed.length > 0) {
                    selectedSymbols = parsed;
                    updateFeedback();
                    updateSuggestions();
                    StorageService.removeItem('tempMessage');
                }
            } catch (e) {}
        }

        console.log('🌻∞ Jornada de Bia v31.1 - Modo sensorial personalizado');
        console.log(`📚 ${symbolsData.length} símbolos carregados`);
        console.log(`🧠 ${predictor.getPatternsCount()} padrões aprendidos`);
        console.log(`💾 ${history.length} mensagens salvas`);
        console.log(`👨‍👩‍👧 ${guardians.length} responsáveis cadastrados`);
        console.log(`🔊 Síntese de voz: ${speechSynthesisEnabled ? '✅' : '❌'}`);
        
        console.log('🌻∞ Girassol + Infinito = Amor Eterno ❤️');
        console.log('🎨 Design melhorado com fontes Nunito, gradientes e sombras');
        console.log('♿ Acessibilidade: ✅ (Teclado, ARIA, Leitores de tela)');
        console.log('🏥 Informações médicas: ✅ (Nova versão com seletores)');
    