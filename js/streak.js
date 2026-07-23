/* ==========================================================================
   streak.js — Daily streak tracking.
   Rule: finish every quest scheduled for a day -> streak +1 the next day.
   Miss any scheduled quest (or skip a day entirely) -> streak resets to 0.
   Evaluated once per day, the first time the app opens on a new day.
   ========================================================================== */

const StreakSystem = (() => {

  function yesterdayKey(todayKey) {
    const [y, m, d] = todayKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    return Utils.dateKey(dt);
  }

  /**
   * Call once on app boot. Looks at whether "yesterday" (relative to
   * lastStreakDate) was fully completed, and updates the streak counter.
   */
  function evaluateOnBoot() {
    const state = Storage.getState();
    const todayKey = Utils.dateKey();

    if (state.lastStreakDate === todayKey) {
      // already evaluated today
      return;
    }

    if (state.lastStreakDate) {
      const expectedYesterday = yesterdayKey(todayKey);
      if (state.lastStreakDate === expectedYesterday) {
        // consecutive day: check if that day's scheduled quests were all done
        const wasFullyDone = wasDayFullyCompleted(state, state.lastStreakDate);
        if (wasFullyDone) {
          state.streak += 1;
        } else {
          state.streak = 0;
        }
      } else {
        // a day (or more) was skipped entirely -> streak broken
        state.streak = 0;
      }
    }

    state.lastStreakDate = todayKey;
    Storage.save(state);
  }

  /** Were all quests scheduled for `dayKey` marked done in completions? */
  function wasDayFullyCompleted(state, dayKey) {
    const [y, m, d] = dayKey.split('-').map(Number);
    const dayIndex = new Date(y, m - 1, d).getDay();
    const scheduled = state.quests.filter(q => QuestSystem.isScheduledOn(q, dayIndex, dayKey));
    if (scheduled.length === 0) return false; // nothing scheduled = doesn't extend streak
    const done = state.completions[dayKey] || [];
    return scheduled.every(q => done.includes(q.id));
  }

  return { evaluateOnBoot, wasDayFullyCompleted };
})();
