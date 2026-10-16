/* Jornada de Bia v31.1 - versioned backup and validation */
(() => {
  const BACKUP_VERSION = 3;
  const MAX_BYTES = 5 * 1024 * 1024;
  const CONFIG_KEYS = new Set(['symbolsData','voiceRate','voicePitch','autoSpeak','theme']);
  const safeJson = v => { try { return JSON.parse(v); } catch { return null; } };

  async function digest(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function download(text, filename) {
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function validateData(d) {
    if (!d || typeof d !== 'object') throw new Error('Dados ausentes');
    if (!Array.isArray(d.symbolsData) || !Array.isArray(d.guardians)) throw new Error('Estrutura principal inválida');
    if (d.symbolsData.length > 2000 || d.guardians.length > 50) throw new Error('Quantidade de registros excedida');
    const textFields = ['childProfile','medicalData'];
    textFields.forEach(k => { if (d[k] && JSON.stringify(d[k]).length > 200000) throw new Error('Dados sensíveis excedem o limite'); });
    if (d.history && !Array.isArray(d.history)) throw new Error('Histórico inválido');
    if (d.favoriteIds && !Array.isArray(d.favoriteIds)) throw new Error('Favoritos inválidos');
    if (d.symbolUsage && typeof d.symbolUsage !== 'object') throw new Error('Uso de símbolos inválido');
    return true;
  }
  window.BackupService = {
    async export(data, opts={}) {
      const clean = opts.configurationOnly ? Object.fromEntries(Object.entries(data).filter(([k])=>CONFIG_KEYS.has(k))) : data;
      const body = JSON.stringify(clean);
      const payload = { app:'A Jornada de Bia', appVersion:'31.1.0', backupVersion:BACKUP_VERSION, type:opts.configurationOnly?'configuration':'full', exportedAt:new Date().toISOString(), data:clean };
      payload.integrity = await digest(JSON.stringify(payload));
      if (typeof opts.password !== 'string' || opts.password.length < 8) throw new Error('Backup protegido exige uma senha com pelo menos 8 caracteres');
      const text=JSON.stringify(await BackupCrypto.encrypt(payload, opts.password),null,2);
      const suffix=opts.preImport?'pre-import':(opts.configurationOnly?'config':'completo');
      download(text, `jornada-bia-backup-${suffix}-${new Date().toISOString().slice(0,10)}.json`);
      return payload;
    },
    async readAndValidate(file) {
      if (file.size > MAX_BYTES) throw new Error('Arquivo muito grande');
      const text=await file.text(); if(text.length>MAX_BYTES) throw new Error('Arquivo muito grande');
      let p=JSON.parse(text);
      if(p.encrypted){
        if(!window.BackupCrypto) throw new Error('Módulo de criptografia indisponível');
        const password=prompt('Digite a senha deste backup:');
        if(password===null) throw new Error('Importação cancelada');
        p=await BackupCrypto.decrypt(p,password);
      }
      if (!p || typeof p!=='object' || !p.data) throw new Error('Formato inválido');
      if (!['full','configuration'].includes(p.type || 'full')) throw new Error('Tipo de backup inválido');
      if (p.backupVersion && p.backupVersion > BACKUP_VERSION) throw new Error('Versão de backup não suportada');
      if (p.integrity) {
        const copy={...p}; delete copy.integrity;
        if (await digest(JSON.stringify(copy)) !== p.integrity) throw new Error('Integridade inválida');
      }
      if (p.type === 'configuration') {
        if (!Array.isArray(p.data.symbolsData)) throw new Error('Configuração inválida');
      } else { validateData(p.data); }
      return p;
    },
    validateData
  };
})();
