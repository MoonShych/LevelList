/* ==========================================================================
   xp.js — XP accumulation and the XP curve.
   Curve: each level needs a bit more XP than the last, so early levels feel
   fast and later ranks feel earned.
   ========================================================================== */

const XPSystem = (() => {

  /** XP required to go from `level` to `level + 1`. */
  function xpToNextLevel(level) {
    return 100 + (level - 1) * 20;
  }

  /**
   * Add XP to the current state. Returns { newXP, levelUps } where
   * levelUps is the number of levels gained (handled by LevelSystem).
   * This function only manages the XP number itself; level rollovers are
   * resolved by LevelSystem.checkLevelUp() right after this call.
   */
  function addXP(amount) {
    const state = Storage.getState();
    state.xp += amount;
    Storage.save(state);
    return state.xp;
  }

  return { xpToNextLevel, addXP };
})();
