/* Jornada de Bia — criptografia de backups com Web Crypto API */
(() => {
  'use strict';
  const ITERATIONS = 250000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = bytes => btoa(String.fromCharCode(...bytes));
  const bytes = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  async function key(password, salt) {
    const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
  }
  window.BackupCrypto = Object.freeze({
    async encrypt(payload, password) {
      if(typeof password !== 'string' || password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres');
      const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
      const k=await key(password,salt), data=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(JSON.stringify(payload)));
      return {app:'A Jornada de Bia', encrypted:true, algorithm:'AES-GCM-256', kdf:'PBKDF2-SHA-256', iterations:ITERATIONS, salt:b64(salt), iv:b64(iv), ciphertext:b64(new Uint8Array(data))};
    },
    async decrypt(wrapper,password) {
      if(!wrapper?.encrypted || !wrapper.ciphertext) throw new Error('Backup criptografado inválido');
      const k=await key(password,bytes(wrapper.salt));
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(wrapper.iv)},k,bytes(wrapper.ciphertext));
      return JSON.parse(dec.decode(plain));
    }
  });
})();
