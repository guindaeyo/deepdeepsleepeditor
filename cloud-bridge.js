/* =========================================================
   DDS CLOUD BRIDGE — v112
   Loaded before script.js.
   Logged out  -> editor localStorage keys use this device as usual.
   Logged in   -> editor localStorage keys are transparently routed to
                  the active account cache.
   Device originals are NEVER overwritten by account mode.
   ========================================================= */
(() => {
  "use strict";

  if (window.DDSCloudBridge) return;

  const ACTIVE_USER_KEY = "dds:cloud:v112:active-user";
  const CACHE_PREFIX = "dds:cloud:v112:cache:";
  const PENDING_PREFIX = "dds:cloud:v112:pending:";

  const PREFIXES = [
    "dds-code-draft-v3:",
    "dds:commission-draft:",
    "dds:commission:alan-profile:draft:",
    "dds:roleplay:",
    "dds:named-local-saves:v1:"
  ];

  const native = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key
  };

  let activeUserId = "";
  let accountCache = {};
  let pending = {};

  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }

  function isEditorKey(key) {
    const value = String(key || "");
    return PREFIXES.some((prefix) => value.startsWith(prefix));
  }

  function rawGet(key) {
    try { return native.getItem.call(window.localStorage, key); }
    catch { return null; }
  }

  function rawSet(key, value) {
    try {
      native.setItem.call(window.localStorage, key, String(value));
      return true;
    } catch {
      return false;
    }
  }

  function rawRemove(key) {
    try {
      native.removeItem.call(window.localStorage, key);
      return true;
    } catch {
      return false;
    }
  }

  function cacheKey(uid) {
    return `${CACHE_PREFIX}${uid}`;
  }

  function pendingKey(uid) {
    return `${PENDING_PREFIX}${uid}`;
  }

  function loadAccountState(uid) {
    activeUserId = String(uid || "");
    accountCache = activeUserId
      ? (safeParse(rawGet(cacheKey(activeUserId)), {}) || {})
      : {};
    pending = activeUserId
      ? (safeParse(rawGet(pendingKey(activeUserId)), {}) || {})
      : {};

    if (!accountCache || typeof accountCache !== "object" || Array.isArray(accountCache)) {
      accountCache = {};
    }
    if (!pending || typeof pending !== "object" || Array.isArray(pending)) {
      pending = {};
    }
  }

  function persistCache() {
    if (!activeUserId) return;
    rawSet(cacheKey(activeUserId), JSON.stringify(accountCache));
  }

  function persistPending() {
    if (!activeUserId) return;
    rawSet(pendingKey(activeUserId), JSON.stringify(pending));
  }

  function dispatchChange(key, value, action) {
    try {
      window.dispatchEvent(new CustomEvent("dds-cloud-bridge-change", {
        detail: {
          userId: activeUserId,
          key: String(key),
          value: value == null ? null : String(value),
          action
        }
      }));
    } catch {}
  }

  function markPending(key, value, action) {
    if (!activeUserId || !isEditorKey(key)) return;
    pending[String(key)] = {
      action,
      value: value == null ? null : String(value),
      queuedAt: Date.now()
    };
    persistPending();
  }

  function activate(uid, map) {
    const nextUid = String(uid || "");
    if (!nextUid) return false;

    rawSet(ACTIVE_USER_KEY, nextUid);
    activeUserId = nextUid;

    const nextMap = map && typeof map === "object" && !Array.isArray(map)
      ? map
      : safeParse(rawGet(cacheKey(nextUid)), {}) || {};

    accountCache = { ...nextMap };
    pending = safeParse(rawGet(pendingKey(nextUid)), {}) || {};

    persistCache();
    return true;
  }

  function deactivate() {
    rawRemove(ACTIVE_USER_KEY);
    activeUserId = "";
    accountCache = {};
    pending = {};
  }

  function replaceAccountCache(uid, map) {
    const targetUid = String(uid || "");
    if (!targetUid) return;
    const clean = map && typeof map === "object" && !Array.isArray(map) ? map : {};
    rawSet(cacheKey(targetUid), JSON.stringify(clean));

    if (activeUserId === targetUid) {
      accountCache = { ...clean };
    }
  }

  function getAccountCache(uid = activeUserId) {
    const targetUid = String(uid || "");
    if (!targetUid) return {};
    if (targetUid === activeUserId) return { ...accountCache };
    const parsed = safeParse(rawGet(cacheKey(targetUid)), {}) || {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...parsed }
      : {};
  }

  function getPending(uid = activeUserId) {
    const targetUid = String(uid || "");
    if (!targetUid) return {};
    if (targetUid === activeUserId) return { ...pending };
    const parsed = safeParse(rawGet(pendingKey(targetUid)), {}) || {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...parsed }
      : {};
  }

  function clearPending(uid = activeUserId, keys = null) {
    const targetUid = String(uid || "");
    if (!targetUid) return;

    const current = targetUid === activeUserId
      ? pending
      : (safeParse(rawGet(pendingKey(targetUid)), {}) || {});

    if (Array.isArray(keys)) {
      keys.forEach((key) => delete current[key]);
    } else {
      Object.keys(current).forEach((key) => delete current[key]);
    }

    rawSet(pendingKey(targetUid), JSON.stringify(current));
    if (targetUid === activeUserId) pending = current;
  }

  function getDeviceMap() {
    const out = {};
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = native.key.call(window.localStorage, i);
        if (!isEditorKey(key)) continue;

        // Bypass our patched getItem: this is the original device value.
        const value = native.getItem.call(window.localStorage, key);
        if (value != null) out[key] = value;
      }
    } catch {}
    return out;
  }

  function getDeviceItem(key) {
    return native.getItem.call(window.localStorage, key);
  }

  function setDeviceItem(key, value) {
    return native.setItem.call(window.localStorage, key, String(value));
  }

  // Load active account synchronously BEFORE the main editor script runs.
  const storedActiveUser = rawGet(ACTIVE_USER_KEY) || "";
  if (storedActiveUser) loadAccountState(storedActiveUser);

  Storage.prototype.getItem = function(key) {
    if (
      this === window.localStorage &&
      activeUserId &&
      isEditorKey(key)
    ) {
      return Object.prototype.hasOwnProperty.call(accountCache, String(key))
        ? accountCache[String(key)]
        : null;
    }

    return native.getItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    if (
      this === window.localStorage &&
      activeUserId &&
      isEditorKey(key)
    ) {
      const normalizedKey = String(key);
      const normalizedValue = String(value);

      accountCache[normalizedKey] = normalizedValue;
      persistCache();
      markPending(normalizedKey, normalizedValue, "upsert");
      dispatchChange(normalizedKey, normalizedValue, "upsert");
      return;
    }

    return native.setItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function(key) {
    if (
      this === window.localStorage &&
      activeUserId &&
      isEditorKey(key)
    ) {
      const normalizedKey = String(key);

      delete accountCache[normalizedKey];
      persistCache();
      markPending(normalizedKey, null, "delete");
      dispatchChange(normalizedKey, null, "delete");
      return;
    }

    return native.removeItem.call(this, key);
  };

  window.DDSCloudBridge = {
    version: 112,
    prefixes: [...PREFIXES],
    isEditorKey,
    isActive: () => Boolean(activeUserId),
    getActiveUserId: () => activeUserId,
    activate,
    deactivate,
    replaceAccountCache,
    getAccountCache,
    getPending,
    clearPending,
    getDeviceMap,
    getDeviceItem,
    setDeviceItem,
    nativeGetItem: (key) => native.getItem.call(window.localStorage, key),
    nativeSetItem: (key, value) => native.setItem.call(window.localStorage, key, String(value)),
    nativeRemoveItem: (key) => native.removeItem.call(window.localStorage, key)
  };
})();
