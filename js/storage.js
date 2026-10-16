/* Jornada de Bia v31.1 - centralized storage compatibility layer */
(() => {
  const PREFIX = 'jornadaBia:';
  const legacyKeys = new Set([
    'symbolsData','guardians','medicalData','symbolHistory','favoriteIds','predictorData',
    'predictivePhraseData','contextBrainData','environmentContext','phraseUsage','symbolUsage',
    'childProfile','aiFeedback','selectedVoice','voiceRate','voicePitch','autoSpeak','theme','selectedIntent','activeHub','tempMessage',
    // Dados de segurança pertencentes à Jornada de Bia (formato legado e atual).
    'guardianPinHash','guardianPin'
  ]);
  const sessionKeys = new Set([
    'jornadaGuardianUnlocked','jornadaGuardianAttempts','jornadaBia:guardianSessionAt'
  ]);
  function key(k){ return legacyKeys.has(k) ? k : PREFIX + k; }
  window.StorageService = {
    getItem(k){ try { return localStorage.getItem(key(k)); } catch { return null; } },
    setItem(k,v){ try { localStorage.setItem(key(k), String(v)); return true; } catch(e) { void e; return false; } },
    removeItem(k){ try { localStorage.removeItem(key(k)); } catch(e){} },
    clear(){
      try {
        const keys=[];
        for(let i=0;i<localStorage.length;i++){
          const k=localStorage.key(i);
          if(k && (legacyKeys.has(k) || k.startsWith(PREFIX))) keys.push(k);
        }
        keys.forEach(k=>localStorage.removeItem(k));
        return true;
      } catch(e){ return false; }
    },
    clearSession(){
      try {
        const keys=[];
        for(let i=0;i<sessionStorage.length;i++){
          const k=sessionStorage.key(i);
          if(k && (sessionKeys.has(k) || k.startsWith(PREFIX))) keys.push(k);
        }
        keys.forEach(k=>sessionStorage.removeItem(k));
        return true;
      } catch(e){ return false; }
    },
    getJSON(k, fallback){ try { const v=this.getItem(k); return v==null?fallback:JSON.parse(v); } catch { return fallback; } },
    setJSON(k,v){ return this.setItem(k, JSON.stringify(v)); },
    info(){ let bytes=0; try { for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||''; bytes += k.length + (localStorage.getItem(k)||'').length; } } catch {} return { approxBytes:bytes }; }
  };
})();
