/* ==========================================================================
   level.js — Converts accumulated XP into Level, one threshold at a time.
   ========================================================================== */

const LevelSystem = (() => {

  /**
   * Checks whether current XP crosses one or more level thresholds.
   * Mutates state.level and state.xp (xp becomes "xp into current level").
   * Returns an array of the new levels reached (empty if no level up).
   */
  function checkLevelUp() {
    const state = Storage.getState();
    const gained = [];

    let needed = XPSystem.xpToNextLevel(state.level);
    while (state.xp >= needed) {
      state.xp -= needed;
      state.level += 1;
      gained.push(state.level);
      needed = XPSystem.xpToNextLevel(state.level);
    }

    if (gained.length > 0) {
      Storage.save(state);
      gained.forEach(lvl => {
        HistorySystem_addLevelUp(lvl);
      });
    } else {
      Storage.save(state);
    }
    return gained;
  }

  /** small local helper so we don't create a circular file-order dependency */
  function HistorySystem_addLevelUp(level) {
    const state = Storage.getState();
    state.history.unshift({
      id: Utils.generateId('hist'),
      type: 'levelup',
      text: `Level Up! เลเวล ${level}`,
      ts: Date.now()
    });
    Storage.save(state);
  }

  return { checkLevelUp };
})();
