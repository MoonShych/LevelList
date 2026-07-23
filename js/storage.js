/* ==========================================================================
   storage.js — Single source of truth for all persisted data.
   Everything lives under one localStorage key so export/import/reset are
   trivial and atomic (no partial-state bugs).
   ========================================================================== */

const Storage = (() => {
  const STORAGE_KEY = 'levellist_state_v1';

  function defaultState() {
    return {
      user: {
        username: 'MoonShy',
        avatar: 'a01'
      },
      quests: [],          // { id, name, category, rank, xp, type, days:[], createdAt }
      completions: {},      // dateKey -> [questId, questId, ...]  (today's + past done markers)
      history: [],          // { id, type, text, ts }
      xp: 0,
      level: 1,
      rank: 'E',
      streak: 0,
      lastStreakDate: null, // dateKey of the last day streak was evaluated
      avatar: 'a01',
      titles: [],            // unlocked title ids
      currentTitle: null,    // title id
      achievements: [],       // unlocked achievement ids
      stats: {
        totalCompleted: 0,
        totalFailed: 0
      },
      settings: {
        sound: true
      }
    };
  }

  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        cache = defaultState();
        save(cache);
        return cache;
      }
      const parsed = JSON.parse(raw);
      // merge with defaults so newly-added fields don't break old saves
      cache = Object.assign(defaultState(), parsed);
      cache.user = Object.assign(defaultState().user, parsed.user || {});
      cache.settings = Object.assign(defaultState().settings, parsed.settings || {});
      cache.stats = Object.assign(defaultState().stats, parsed.stats || {});
      return cache;
    } catch (e) {
      console.error('Storage load failed, resetting to defaults.', e);
      cache = defaultState();
      save(cache);
      return cache;
    }
  }

  function save(state = cache) {
    try {
      cache = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Storage save failed (quota exceeded?)', e);
      return false;
    }
  }

  function getState() {
    return load();
  }

  function exportData() {
    return JSON.stringify(load(), null, 2);
  }

  function importData(jsonString) {
    const parsed = JSON.parse(jsonString); // let caller catch errors
    const merged = Object.assign(defaultState(), parsed);
    save(merged);
    return merged;
  }

  function resetData() {
    cache = defaultState();
    save(cache);
    return cache;
  }

  return { getState, save, exportData, importData, resetData, STORAGE_KEY };
})();
