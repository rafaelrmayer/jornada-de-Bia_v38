/* Jornada de Bia v31.1 - SecurityService
 * Client-side protection only: this is not a substitute for server authentication.
 */
(() => {
  const PIN_KEY = 'guardianPinHash';
  const LEGACY_PIN_KEY = 'guardianPin';
  const SESSION_KEY = 'jornadaGuardianUnlocked';
  const ATTEMPTS_KEY = 'jornadaGuardianAttempts';
  const MAX_ATTEMPTS = 5;
  const LOCK_MS = 30_000;
  const ITERATIONS = 120_000;
  const BIOMETRIC_KEY = 'jornadaBia:biometricCredential';

  const enc = new TextEncoder();
  const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const fromB64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

  async function derive(pin, salt) {
    const material = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, 256);
  }

  async function makeHash(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(pin, salt);
    return `pbkdf2-sha256:${ITERATIONS}:${toB64(salt)}:${toB64(hash)}`;
  }

  async function verifyHash(pin, stored) {
    const parts = String(stored || '').split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 500000) return false;
    const material = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:fromB64(parts[2]), iterations, hash:'SHA-256' }, material, 256);
    const a = new Uint8Array(bits), b = fromB64(parts[3]);
    if (a.length !== b.length) return false;
    let diff = 0; for (let i=0;i<a.length;i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  function attempts() {
    try { return JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || '{}'); } catch { return {}; }
  }
  function saveAttempts(v) { sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(v)); }

  const toB64Url = bytes => toB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const fromB64Url = str => {
    const normalized = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    return fromB64(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  };
  const randomBytes = size => crypto.getRandomValues(new Uint8Array(size));
  const biometricRecord = () => {
    try {
      const value = JSON.parse(localStorage.getItem(BIOMETRIC_KEY) || 'null');
      if (!value || typeof value.id !== 'string' || typeof value.publicKey !== 'string' || !Number.isInteger(value.algorithm) || typeof value.rpId !== 'string') return null;
      return value;
    } catch { return null; }
  };
  function derEcdsaToRaw(signature) {
    const der = new Uint8Array(signature);
    if (der.length === 64) return der;
    if (der.length < 8 || der[0] !== 0x30) throw new Error('Assinatura biométrica inválida.');
    let i = 2;
    if (der[1] & 0x80) i = 2 + (der[1] & 0x7f);
    if (der[i++] !== 0x02) throw new Error('Assinatura biométrica inválida.');
    const rLen = der[i++]; let r = der.slice(i, i + rLen); i += rLen;
    if (der[i++] !== 0x02) throw new Error('Assinatura biométrica inválida.');
    const sLen = der[i++]; let t = der.slice(i, i + sLen);
    while (r.length > 32 && r[0] === 0) r = r.slice(1);
    while (t.length > 32 && t[0] === 0) t = t.slice(1);
    if (r.length > 32 || t.length > 32) throw new Error('Assinatura biométrica inválida.');
    const raw = new Uint8Array(64); raw.set(r, 32 - r.length); raw.set(t, 64 - t.length); return raw;
  }
  async function isBiometricAvailable() {
    if (!window.isSecureContext || !window.PublicKeyCredential || !navigator.credentials || !crypto?.subtle) return false;
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch { return false; }
  }
  async function registerBiometric() {
    if (!(await isBiometricAvailable())) throw new Error('Este navegador não disponibiliza autenticação biométrica neste contexto. Use HTTPS e um aparelho compatível.');
    if (!(await this.hasPin())) throw new Error('Ative primeiro o Modo Responsável e crie seu PIN de 4 dígitos.');
    const rpId = location.hostname;
    const userId = randomBytes(16);
    const challenge = randomBytes(32);
    const credential = await navigator.credentials.create({ publicKey: {
      challenge,
      rp: { id: rpId, name: 'Jornada de Bia' },
      user: { id: userId, name: 'responsavel@jornadadebia.local', displayName: 'Responsável da Jornada de Bia' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'discouraged', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none'
    }});
    if (!credential || !credential.response || typeof credential.response.getPublicKey !== 'function') {
      throw new Error('Este navegador não permite guardar a chave pública localmente. O PIN continua disponível.');
    }
    const publicKey = credential.response.getPublicKey();
    const algorithm = credential.response.getPublicKeyAlgorithm();
    if (!publicKey || ![-7, -257].includes(algorithm)) throw new Error('O autenticador usou um algoritmo não suportado nesta versão.');
    const record = { id: toB64Url(credential.rawId), publicKey: toB64Url(publicKey), algorithm, rpId, createdAt: Date.now() };
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(record));
    return true;
  }
  async function verifyBiometric() {
    const record = biometricRecord();
    if (!record) return false;
    if (!(await isBiometricAvailable())) throw new Error('A autenticação biométrica não está disponível neste navegador.');
    if (record.rpId !== location.hostname) throw new Error('A credencial biométrica pertence a outro endereço. Use o PIN e configure novamente.');
    const challenge = randomBytes(32);
    const credential = await navigator.credentials.get({ publicKey: {
      challenge,
      rpId: record.rpId,
      allowCredentials: [{ type: 'public-key', id: fromB64Url(record.id) }],
      userVerification: 'required',
      timeout: 60000
    }});
    if (!credential || !credential.response || toB64Url(credential.rawId) !== record.id) return false;
    const response = credential.response;
    const clientDataBytes = new Uint8Array(response.clientDataJSON);
    const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
    if (clientData.type !== 'webauthn.get' || clientData.challenge !== toB64Url(challenge) || clientData.origin !== location.origin) return false;
    const authData = new Uint8Array(response.authenticatorData);
    if (authData.length < 37) return false;
    const rpHash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(record.rpId)));
    for (let i = 0; i < 32; i++) if (authData[i] !== rpHash[i]) return false;
    const flags = authData[32];
    if (!(flags & 0x01) || !(flags & 0x04)) return false; // user presence + verified user
    const clientHash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataBytes));
    const signed = new Uint8Array(authData.length + clientHash.length); signed.set(authData); signed.set(clientHash, authData.length);
    const keyBytes = fromB64Url(record.publicKey);
    let key, signature = new Uint8Array(response.signature), algorithm;
    if (record.algorithm === -7) {
      key = await crypto.subtle.importKey('spki', keyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      algorithm = { name: 'ECDSA', hash: 'SHA-256' };
      signature = derEcdsaToRaw(signature);
    } else if (record.algorithm === -257) {
      key = await crypto.subtle.importKey('spki', keyBytes, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      algorithm = { name: 'RSASSA-PKCS1-v1_5' };
    } else return false;
    return await crypto.subtle.verify(algorithm, key, signature, signed);
  }

  window.SecurityService = {
    async hasPin() {
      if (localStorage.getItem(PIN_KEY)) return true;
      const legacy = localStorage.getItem(LEGACY_PIN_KEY);
      if (/^\d{4}$/.test(legacy || '')) {
        const hashed = await makeHash(legacy);
        localStorage.setItem(PIN_KEY, hashed);
        localStorage.removeItem(LEGACY_PIN_KEY);
        return true;
      }
      return false;
    },
    async migrateLegacyPin() {
      return this.hasPin();
    },
    async setPin(pin) {
      if (!/^\d{4}$/.test(pin || '')) throw new Error('PIN inválido');
      localStorage.setItem(PIN_KEY, await makeHash(pin));
      sessionStorage.removeItem(ATTEMPTS_KEY);
    },
    async verifyPin(pin) {
      const now = Date.now();
      const a = attempts();
      if (a.lockUntil && now < a.lockUntil) return { ok:false, reason:'locked', remaining:0 };
      if (!/^\d{4}$/.test(pin || '')) return { ok:false, reason:'invalid', remaining:MAX_ATTEMPTS };
      await this.hasPin();
      const stored = localStorage.getItem(PIN_KEY);
      if (!stored) return { ok:false, reason:'missing', remaining:MAX_ATTEMPTS };
      const ok = await verifyHash(pin, stored);
      if (ok) { saveAttempts({ count:0, lockUntil:0 }); return { ok:true, remaining:MAX_ATTEMPTS }; }
      const count = (a.count || 0) + 1;
      if (count >= MAX_ATTEMPTS) { saveAttempts({ count, lockUntil:now + LOCK_MS }); return { ok:false, reason:'locked', remaining:0 }; }
      saveAttempts({ count, lockUntil:0 });
      return { ok:false, reason:'wrong', remaining:MAX_ATTEMPTS-count };
    },
    isLocked() { const a=attempts(); return !!(a.lockUntil && Date.now()<a.lockUntil); },
    isUnlocked() { return sessionStorage.getItem(SESSION_KEY) === 'true'; },
    isBiometricConfigured() { return !!biometricRecord(); },
    isBiometricAvailable,
    registerBiometric,
    verifyBiometric,
    removeBiometric() { localStorage.removeItem(BIOMETRIC_KEY); },
    setSessionUnlocked(value) {
      if (value) {
        sessionStorage.setItem(SESSION_KEY,'true');
        window.JornadaBiaSecurity?.touch?.();
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('jornadaBia:guardianSessionAt');
      }
    }
  };
})();
