/* ==========================================================================
   quest.js — Quest CRUD + the "complete quest" pipeline.
   Quest shape:
   { id, name, category, rank, xp, type: 'onetime'|'repeat', days:[0-6], createdAt }
   ========================================================================== */

const QuestSystem = (() => {

  function all() {
    return Storage.getState().quests;
  }

  function getById(id) {
    return Storage.getState().quests.find(q => q.id === id);
  }

  function create(data) {
    const state = Storage.getState();
    const quest = {
      id: Utils.generateId('q'),
      name: data.name.trim(),
      category: (data.category || '').trim(),
      rank: data.rank || 'E',
      xp: Utils.clamp(parseInt(data.xp, 10) || 10, 1, 99999),
      type: data.type === 'repeat' ? 'repeat' : 'onetime',
      days: data.type === 'repeat' ? (data.days || []) : [],
      createdAt: Date.now()
    };
    state.quests.push(quest);
    Storage.save(state);
    return quest;
  }

  function update(id, data) {
    const state = Storage.getState();
    const q = state.quests.find(x => x.id === id);
    if (!q) return null;
    q.name = data.name.trim();
    q.category = (data.category || '').trim();
    q.rank = data.rank || 'E';
    q.xp = Utils.clamp(parseInt(data.xp, 10) || 10, 1, 99999);
    q.type = data.type === 'repeat' ? 'repeat' : 'onetime';
    q.days = q.type === 'repeat' ? (data.days || []) : [];
    Storage.save(state);
    return q;
  }

  function remove(id) {
    const state = Storage.getState();
    state.quests = state.quests.filter(q => q.id !== id);
    Storage.save(state);
  }

  function search(term) {
    const t = term.trim().toLowerCase();
    if (!t) return all();
    return all().filter(q =>
      q.name.toLowerCase().includes(t) || q.category.toLowerCase().includes(t)
    );
  }

  /** Is this quest scheduled to appear on the given weekday / date? */
  function isScheduledOn(quest, dayIndex, dayKey) {
    if (quest.type === 'onetime') {
      // one-time quests show up every day until completed at least once ever
      return !hasEverBeenCompleted(quest.id);
    }
    return quest.days.includes(dayIndex);
  }

  function hasEverBeenCompleted(questId) {
    const state = Storage.getState();
    return Object.values(state.completions).some(list => list.includes(questId));
  }

  /** Quests that should render on today's Home dashboard. */
  function todaysQuests() {
    const dayIndex = Utils.todayDayIndex();
    const dayKey = Utils.dateKey();
    return all().filter(q => isScheduledOn(q, dayIndex, dayKey));
  }

  function isDoneToday(questId) {
    const dayKey = Utils.dateKey();
    const state = Storage.getState();
    return (state.completions[dayKey] || []).includes(questId);
  }

  /**
   * The full "Quest Complete" pipeline:
   * 1. mark complete for today
   * 2. add XP
   * 3. check level up
   * 4. check rank up
   * 5. check achievements
   * 6. write history
   * 7. return a summary so the UI can show popups in order
   */
  function completeQuest(questId) {
    const state = Storage.getState();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest) return null;

    const dayKey = Utils.dateKey();
    if (!state.completions[dayKey]) state.completions[dayKey] = [];
    if (state.completions[dayKey].includes(questId)) {
      return { alreadyDone: true };
    }
    state.completions[dayKey].push(questId);
    state.stats.totalCompleted += 1;

    state.history.unshift({
      id: Utils.generateId('hist'),
      type: 'quest',
      text: `สำเร็จ: ${quest.name} (+${quest.xp} XP)`,
      ts: Date.now()
    });

    Storage.save(state);

    // 2-3-4: XP -> Level -> Rank
    XPSystem.addXP(quest.xp);
    const levelsGained = LevelSystem.checkLevelUp();
    const newRank = RankSystem.checkRankUp();

    // 5: achievements (records.js owns the achievement catalog)
    const unlockedAchievements = RecordsSystem.checkAchievements();

    return {
      quest,
      levelsGained,
      newRank,
      unlockedAchievements
    };
  }

  return {
    all, getById, create, update, remove, search,
    isScheduledOn, todaysQuests, isDoneToday, completeQuest, hasEverBeenCompleted
  };
})();
