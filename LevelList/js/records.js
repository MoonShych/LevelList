/* ==========================================================================
   records.js — Statistics, Achievements, Titles, History (the "Records" tab).
   ========================================================================== */

const RecordsSystem = (() => {

  /* ---------------- Titles ----------------
     One title per rank tier. Reaching a rank unlocks its title and it
     immediately becomes the active title (players can still see every
     title they've earned in the Title Collection). */
  const TITLE_CATALOG = [
    { id: 't_e', rank: 'E', name: 'ผู้ตื่นรู้' },
    { id: 't_d', rank: 'D', name: 'นักล่ามือใหม่' },
    { id: 't_c', rank: 'C', name: 'นักล่า' },
    { id: 't_b', rank: 'B', name: 'นักล่าชั้นสูง' },
    { id: 't_a', rank: 'A', name: 'Shadow Candidate' },
    { id: 't_s', rank: 'S', name: 'จอมราชา' }
  ];

  /* ---------------- Achievements ---------------- */
  const ACHIEVEMENT_CATALOG = [
    { id: 'ach_first_quest', icon: '🥇', name: 'ก้าวแรก', desc: 'ทำเควสสำเร็จครั้งแรก', check: s => s.stats.totalCompleted >= 1 },
    { id: 'ach_10_quest', icon: '📘', name: 'มือใหม่หัดล่า', desc: 'ทำเควสสำเร็จ 10 ครั้ง', check: s => s.stats.totalCompleted >= 10 },
    { id: 'ach_50_quest', icon: '📗', name: 'นักล่าฝึกหัด', desc: 'ทำเควสสำเร็จ 50 ครั้ง', check: s => s.stats.totalCompleted >= 50 },
    { id: 'ach_100_quest', icon: '📕', name: 'นักล่าผู้ช่ำชอง', desc: 'ทำเควสสำเร็จ 100 ครั้ง', check: s => s.stats.totalCompleted >= 100 },
    { id: 'ach_streak_3', icon: '🔥', name: 'สายไฟลุกโชน', desc: 'Streak ติดต่อกัน 3 วัน', check: s => s.streak >= 3 },
    { id: 'ach_streak_7', icon: '🔥', name: 'หนึ่งสัปดาห์ไม่มีพลาด', desc: 'Streak ติดต่อกัน 7 วัน', check: s => s.streak >= 7 },
    { id: 'ach_streak_30', icon: '🔥', name: 'วินัยเหล็ก', desc: 'Streak ติดต่อกัน 30 วัน', check: s => s.streak >= 30 },
    { id: 'ach_level_10', icon: '⭐', name: 'ก้าวสู่ระดับ 10', desc: 'ถึงเลเวล 10', check: s => s.level >= 10 },
    { id: 'ach_level_30', icon: '🌟', name: 'ก้าวสู่ระดับ 30', desc: 'ถึงเลเวล 30', check: s => s.level >= 30 },
    { id: 'ach_rank_a', icon: '🏆', name: 'ผู้ท้าชิงเงา', desc: 'ไปถึง RANK A', check: s => ['A', 'S'].includes(s.rank) },
    { id: 'ach_rank_s', icon: '👑', name: 'จอมราชา', desc: 'ไปถึง RANK S', check: s => s.rank === 'S' }
  ];

  /** Recompute state.stats derived numbers before displaying. */
  function computeStats() {
    const state = Storage.getState();
    const totalQuestDefs = state.quests.length;
    const totalCompleted = state.stats.totalCompleted;
    const totalFailed = state.stats.totalFailed;
    const completionRate = totalCompleted + totalFailed > 0
      ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100)
      : (totalCompleted > 0 ? 100 : 0);

    return {
      totalQuestDefs,
      totalCompleted,
      totalFailed,
      completionRate,
      totalXP: xpEarnedLifetime(state),
      level: state.level,
      rank: state.rank,
      streak: state.streak
    };
  }

  /** Lifetime XP isn't stored directly (xp resets each level), so approximate
   *  using level thresholds already crossed plus current in-level xp. */
  function xpEarnedLifetime(state) {
    let total = state.xp;
    for (let lvl = 1; lvl < state.level; lvl++) {
      total += XPSystem.xpToNextLevel(lvl);
    }
    return total;
  }

  /** Called after every quest completion. Unlocks any newly-earned
   *  achievements and titles, records history, and returns the new ones. */
  function checkAchievements() {
    const state = Storage.getState();
    const newlyUnlocked = [];

    ACHIEVEMENT_CATALOG.forEach(ach => {
      if (!state.achievements.includes(ach.id) && ach.check(state)) {
        state.achievements.push(ach.id);
        state.history.unshift({
          id: Utils.generateId('hist'),
          type: 'achievement',
          text: `ปลดล็อก Achievement: ${ach.name}`,
          ts: Date.now()
        });
        newlyUnlocked.push(ach);
      }
    });

    // titles unlock based on rank reached so far
    TITLE_CATALOG.forEach(title => {
      const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S'];
      const reached = rankOrder.indexOf(state.rank) >= rankOrder.indexOf(title.rank);
      if (reached && !state.titles.includes(title.id)) {
        state.titles.push(title.id);
        state.currentTitle = title.id; // auto-equip the newest title
        state.history.unshift({
          id: Utils.generateId('hist'),
          type: 'achievement',
          text: `ปลดล็อก Title: ${title.name}`,
          ts: Date.now()
        });
      }
    });

    Storage.save(state);
    return newlyUnlocked;
  }

  function currentTitleName() {
    const state = Storage.getState();
    if (!state.currentTitle) return TITLE_CATALOG[0].name;
    const t = TITLE_CATALOG.find(x => x.id === state.currentTitle);
    return t ? t.name : TITLE_CATALOG[0].name;
  }

  function unlockedAchievements() {
    const state = Storage.getState();
    return ACHIEVEMENT_CATALOG.filter(a => state.achievements.includes(a.id));
  }
  function lockedAchievements() {
    const state = Storage.getState();
    return ACHIEVEMENT_CATALOG.filter(a => !state.achievements.includes(a.id));
  }
  function allTitles() {
    const state = Storage.getState();
    return TITLE_CATALOG.map(t => ({ ...t, unlocked: state.titles.includes(t.id) }));
  }
  function history() {
    return Storage.getState().history;
  }

  return {
    computeStats, checkAchievements, currentTitleName,
    unlockedAchievements, lockedAchievements, allTitles, history,
    TITLE_CATALOG, ACHIEVEMENT_CATALOG
  };
})();
