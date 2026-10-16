/* Jornada de Bia — camada adicional de proteção local (V31.1) */
(() => {
  'use strict';
  const SESSION_KEY = 'jornadaBia:guardianSessionAt';
  const TIMEOUT_MS = 10 * 60 * 1000;
  let timer = null;
  const now = () => Date.now();
  const isUnlocked = () => window.SecurityService?.isUnlocked?.() === true;
  const touch = () => {
    if (isUnlocked()) {
      sessionStorage.setItem(SESSION_KEY, String(now()));
      schedule();
    } else {
      if (timer) clearTimeout(timer);
      timer = null;
      sessionStorage.removeItem(SESSION_KEY);
    }
  };
  const lock = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (window.SecurityService?.setSessionUnlocked) window.SecurityService.setSessionUnlocked(false);
    sessionStorage.removeItem(SESSION_KEY);
    if (typeof window.setGuardianMode === 'function') window.setGuardianMode(false);
    document.dispatchEvent(new CustomEvent('jornadaBia:sessionExpired'));
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    const stamp = Number(sessionStorage.getItem(SESSION_KEY) || 0);
    if (!stamp || !isUnlocked()) return;
    const remaining = TIMEOUT_MS - (now() - stamp);
    if (remaining <= 0) { lock(); return; }
    timer = setTimeout(() => {
      if (now() - Number(sessionStorage.getItem(SESSION_KEY) || 0) >= TIMEOUT_MS) lock();
      else schedule();
    }, Math.max(250, remaining + 50));
  };
  ['click','keydown','touchstart','pointerdown'].forEach(evt =>
    document.addEventListener(evt, () => { if (isUnlocked()) touch(); }, { passive: true, capture: true })
  );
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (!isUnlocked()) { touch(); return; }
      const stamp = Number(sessionStorage.getItem(SESSION_KEY) || 0);
      if (stamp && now() - stamp >= TIMEOUT_MS) lock(); else touch();
    }
  });
  window.JornadaBiaSecurity = Object.freeze({ touch, lock, timeoutMs: TIMEOUT_MS });
  if (isUnlocked()) touch();
})();
