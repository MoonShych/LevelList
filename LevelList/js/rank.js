/* ==========================================================================
   rank.js — Rank is purely derived from Level (E/D/C/B/A/S).
   ========================================================================== */

const RankSystem = (() => {
  // Ordered low -> high; each entry is the minimum level for that rank.
  const THRESHOLDS = [
    { rank: 'S', min: 40 },
    { rank: 'A', min: 30 },
    { rank: 'B', min: 20 },
    { rank: 'C', min: 10 },
    { rank: 'D', min: 5 },
    { rank: 'E', min: 1 }
  ];

  function rankForLevel(level) {
    const found = THRESHOLDS.find(t => level >= t.min);
    return found ? found.rank : 'E';
  }

  /**
   * Recomputes rank from the current level. If it changed, records history
   * and returns the new rank; otherwise returns null.
   */
  function checkRankUp() {
    const state = Storage.getState();
    const newRank = rankForLevel(state.level);
    if (newRank !== state.rank) {
      const oldRank = state.rank;
      state.rank = newRank;
      state.history.unshift({
        id: Utils.generateId('hist'),
        type: 'rankup',
        text: `Rank Up! ${oldRank} → ${newRank}`,
        ts: Date.now()
      });
      Storage.save(state);
      return newRank;
    }
    Storage.save(state);
    return null;
  }

  return { rankForLevel, checkRankUp, THRESHOLDS };
})();
