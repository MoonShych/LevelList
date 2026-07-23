/* ==========================================================================
   app.js — App bootstrap, page navigation, and all rendering / event wiring.
   Loaded last, after every subsystem is defined.
   ========================================================================== */

(() => {
  let editingQuestId = null;
  let selectedRank = 'E';
  let selectedType = 'onetime';
  let selectedDays = [];

  /* ------------------------------------------------------------------ */
  /* BOOT                                                                 */
  /* ------------------------------------------------------------------ */
  function boot() {
    seedDemoQuestsIfEmpty();
    StreakSystem.evaluateOnBoot();
    bindNavigation();
    bindHome();
    bindQuestForm();
    bindRecordsTabs();
    bindSettings();
    PopupSystem.init();

    renderAll();

    setTimeout(() => {
      document.getElementById('bootOverlay').style.opacity = '0';
      setTimeout(() => document.getElementById('bootOverlay').classList.add('hidden'), 500);
      document.getElementById('app').classList.remove('hidden');
    }, 650);
  }

  /** First-run only: give new players a few starter quests so Home isn't empty. */
  function seedDemoQuestsIfEmpty() {
    const state = Storage.getState();
    if (state.quests.length > 0) return;
    QuestSystem.create({ name: 'ดื่มน้ำ 8 แก้ว', category: 'สุขภาพ', rank: 'E', xp: 10, type: 'repeat', days: [0, 1, 2, 3, 4, 5, 6] });
    QuestSystem.create({ name: 'อ่านหนังสือ 30 นาที', category: 'การเรียน', rank: 'D', xp: 20, type: 'repeat', days: [1, 2, 3, 4, 5] });
    QuestSystem.create({ name: 'ออกกำลังกาย', category: 'สุขภาพ', rank: 'C', xp: 30, type: 'repeat', days: [1, 3, 5] });
    QuestSystem.create({ name: 'วางแผนงานสัปดาห์นี้', category: 'งาน', rank: 'B', xp: 40, type: 'onetime', days: [] });
  }

  function renderAll() {
    renderHome();
    renderAllQuests();
    renderRecords();
    renderSettings();
  }

  /* ------------------------------------------------------------------ */
  /* NAVIGATION                                                           */
  /* ------------------------------------------------------------------ */
  function bindNavigation() {
    Utils.qsa('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SoundSystem.playClick();
        goToPage(btn.dataset.page);
      });
    });
  }

  function goToPage(pageId) {
    Utils.qsa('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    Utils.qsa('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
    if (pageId === 'add') renderAllQuests();
    if (pageId === 'records') renderRecords();
    if (pageId === 'settings') renderSettings();
  }

  /* ------------------------------------------------------------------ */
  /* HOME PAGE                                                            */
  /* ------------------------------------------------------------------ */
  function bindHome() {
    document.getElementById('btnSoundToggleTop').addEventListener('click', (e) => {
      const enabled = SoundSystem.isEnabled();
      SoundSystem.setEnabled(!enabled);
      e.currentTarget.textContent = !enabled ? '🔊' : '🔇';
      if (!enabled) SoundSystem.playClick();
      renderSettings();
    });
  }

  function renderHome() {
    const state = Storage.getState();

    document.getElementById('homeAvatarIcon').textContent = AvatarSystem.iconFor(state.avatar);
    document.getElementById('homeUsername').textContent = state.user.username;
    document.getElementById('homeTitle').textContent = RecordsSystem.currentTitleName();
    document.getElementById('homeRank').textContent = `RANK ${state.rank}`;
    document.getElementById('homeRank').className = `badge badge-rank rank-${state.rank}`;
    document.getElementById('homeLevel').textContent = `LV. ${state.level}`;
    document.getElementById('btnSoundToggleTop').textContent = state.settings.sound ? '🔊' : '🔇';

    const needed = XPSystem.xpToNextLevel(state.level);
    document.getElementById('xpNumbers').textContent = `${state.xp} / ${needed}`;
    const pct = Utils.clamp((state.xp / needed) * 100, 0, 100);
    document.getElementById('xpBarFill').style.width = `${pct}%`;

    renderDailyStatus();
    renderTodayQuests();
  }

  function renderDailyStatus() {
    const state = Storage.getState();
    const today = QuestSystem.todaysQuests();
    const dayKey = Utils.dateKey();
    const doneList = state.completions[dayKey] || [];
    const doneCount = today.filter(q => doneList.includes(q.id)).length;
    const total = today.length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    document.getElementById('dailyDoneTotal').textContent = `${doneCount} / ${total}`;
    document.getElementById('dailyPercent').textContent = `${pct}%`;
    document.getElementById('dailyStreak').textContent = `${state.streak} 🔥`;
  }

  function renderTodayQuests() {
    const list = document.getElementById('todayQuestList');
    const empty = document.getElementById('todayEmptyState');
    const quests = QuestSystem.todaysQuests();

    list.innerHTML = '';
    if (quests.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    quests.forEach(q => {
      list.appendChild(buildQuestCard(q, true));
    });
  }

  function buildQuestCard(q, showCompleteButton) {
    const done = QuestSystem.isDoneToday(q.id);
    const card = document.createElement('div');
    card.className = `quest-card${done ? ' done' : ''}`;

    const main = document.createElement('div');
    main.className = 'quest-main';
    main.innerHTML = `
      <div class="quest-name${done ? ' strike' : ''}">${Utils.escapeHtml(q.name)}</div>
      <div class="quest-meta">
        <span class="quest-rank-chip rank-${q.rank}">${q.rank}</span>
        <span class="quest-xp-chip">+${q.xp} XP</span>
        ${q.category ? `<span class="quest-cat-chip">${Utils.escapeHtml(q.category)}</span>` : ''}
      </div>
    `;
    main.addEventListener('click', () => openQuestForm(q.id));
    card.appendChild(main);

    if (showCompleteButton) {
      const btn = document.createElement('button');
      btn.className = `btn-complete${done ? ' done' : ''}`;
      btn.textContent = done ? 'สำเร็จแล้ว' : 'COMPLETE';
      btn.disabled = done;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCompleteQuest(q.id);
      });
      card.appendChild(btn);
    }
    return card;
  }

  function handleCompleteQuest(questId) {
    const result = QuestSystem.completeQuest(questId);
    if (!result || result.alreadyDone) return;

    renderHome();
    renderAllQuests();
    renderRecords();

    // popups fire in order: quest -> level up(s) -> rank up -> achievements
    PopupSystem.show('quest', 'เควสสำเร็จ!', `+${result.quest.xp} XP`);
    (result.levelsGained || []).forEach(lvl => {
      PopupSystem.show('levelup', `LEVEL ${lvl}`, 'พลังของคุณเพิ่มขึ้น!');
    });
    if (result.newRank) {
      PopupSystem.show('rankup', `RANK ${result.newRank}`, 'คุณได้เลื่อนขั้น!');
    }
    (result.unlockedAchievements || []).forEach(ach => {
      PopupSystem.show('achievement', ach.name, ach.desc);
    });
  }

  /* ------------------------------------------------------------------ */
  /* ADD / MANAGE QUEST PAGE                                              */
  /* ------------------------------------------------------------------ */
  function renderAllQuests(filterTerm) {
    const list = document.getElementById('allQuestList');
    const empty = document.getElementById('allEmptyState');
    const quests = filterTerm != null ? QuestSystem.search(filterTerm) : QuestSystem.all();

    list.innerHTML = '';
    if (quests.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    quests.slice().reverse().forEach(q => {
      list.appendChild(buildQuestCard(q, true));
    });
  }

  /* ------------------------------------------------------------------ */
  /* QUEST FORM MODAL                                                     */
  /* ------------------------------------------------------------------ */
  function bindQuestForm() {
    document.getElementById('btnOpenQuestForm').addEventListener('click', () => openQuestForm(null));
    document.getElementById('btnCloseQuestForm').addEventListener('click', closeQuestForm);
    document.getElementById('questFormModal').addEventListener('click', (e) => {
      if (e.target.id === 'questFormModal') closeQuestForm();
    });

    Utils.qsa('#rankPicker .pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRank = btn.dataset.rank;
        Utils.qsa('#rankPicker .pill').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    Utils.qsa('#typePicker .pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedType = btn.dataset.type;
        Utils.qsa('#typePicker .pill').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('repeatDaysBlock').classList.toggle('hidden', selectedType !== 'repeat');
      });
    });

    Utils.qsa('#dayPicker .pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day, 10);
        if (selectedDays.includes(day)) {
          selectedDays = selectedDays.filter(d => d !== day);
        } else {
          selectedDays.push(day);
        }
        btn.classList.toggle('active');
      });
    });

    document.getElementById('btnSaveQuest').addEventListener('click', saveQuestForm);
    document.getElementById('btnDeleteQuest').addEventListener('click', deleteQuestFromForm);

    document.getElementById('questSearchInput').addEventListener('input', (e) => {
      renderAllQuests(e.target.value);
    });
  }

  function openQuestForm(questId) {
    editingQuestId = questId;
    const modal = document.getElementById('questFormModal');
    const q = questId ? QuestSystem.getById(questId) : null;

    document.getElementById('questFormTitle').textContent = q ? 'แก้ไขเควส' : 'สร้างเควสใหม่';
    document.getElementById('questId').value = q ? q.id : '';
    document.getElementById('questName').value = q ? q.name : '';
    document.getElementById('questCategory').value = q ? q.category : '';
    document.getElementById('questXP').value = q ? q.xp : 10;
    document.getElementById('btnDeleteQuest').classList.toggle('hidden', !q);

    selectedRank = q ? q.rank : 'E';
    selectedType = q ? q.type : 'onetime';
    selectedDays = q ? [...q.days] : [];

    Utils.qsa('#rankPicker .pill').forEach(b => b.classList.toggle('active', b.dataset.rank === selectedRank));
    Utils.qsa('#typePicker .pill').forEach(b => b.classList.toggle('active', b.dataset.type === selectedType));
    Utils.qsa('#dayPicker .pill').forEach(b => b.classList.toggle('active', selectedDays.includes(parseInt(b.dataset.day, 10))));
    document.getElementById('repeatDaysBlock').classList.toggle('hidden', selectedType !== 'repeat');

    modal.classList.remove('hidden');
  }

  function closeQuestForm() {
    document.getElementById('questFormModal').classList.add('hidden');
    editingQuestId = null;
  }

  function saveQuestForm() {
    const name = document.getElementById('questName').value.trim();
    if (!name) {
      Utils.toast('กรุณาใส่ชื่อเควส');
      return;
    }
    if (selectedType === 'repeat' && selectedDays.length === 0) {
      Utils.toast('กรุณาเลือกวันอย่างน้อย 1 วัน');
      return;
    }

    const data = {
      name,
      category: document.getElementById('questCategory').value,
      rank: selectedRank,
      xp: document.getElementById('questXP').value,
      type: selectedType,
      days: selectedDays
    };

    if (editingQuestId) {
      QuestSystem.update(editingQuestId, data);
      Utils.toast('บันทึกการแก้ไขแล้ว');
    } else {
      QuestSystem.create(data);
      Utils.toast('สร้างเควสใหม่แล้ว');
    }

    SoundSystem.playClick();
    closeQuestForm();
    renderHome();
    renderAllQuests();
  }

  function deleteQuestFromForm() {
    if (!editingQuestId) return;
    QuestSystem.remove(editingQuestId);
    Utils.toast('ลบเควสแล้ว');
    closeQuestForm();
    renderHome();
    renderAllQuests();
  }

  /* ------------------------------------------------------------------ */
  /* RECORDS PAGE                                                         */
  /* ------------------------------------------------------------------ */
  function bindRecordsTabs() {
    Utils.qsa('#recordsTabbar .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.qsa('#recordsTabbar .tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        Utils.qsa('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  }

  function renderRecords() {
    const stats = RecordsSystem.computeStats();
    const grid = document.getElementById('statGrid');
    grid.innerHTML = `
      ${statCard(stats.totalQuestDefs, 'Total Quest')}
      ${statCard(stats.totalCompleted, 'Completed Quest')}
      ${statCard(stats.totalFailed, 'Failed Quest')}
      ${statCard(stats.completionRate + '%', 'Completion Rate')}
      ${statCard(stats.totalXP, 'Total XP')}
      ${statCard(stats.level, 'Level')}
      ${statCard(stats.rank, 'Rank')}
      ${statCard(stats.streak + ' 🔥', 'Current Streak')}
    `;

    const unlocked = RecordsSystem.unlockedAchievements();
    const locked = RecordsSystem.lockedAchievements();
    document.getElementById('achUnlocked').innerHTML = unlocked.length
      ? unlocked.map(a => achItem(a, true)).join('')
      : `<div class="empty-state"><div class="empty-sub">ยังไม่มี Achievement ที่ปลดล็อก</div></div>`;
    document.getElementById('achLocked').innerHTML = locked.map(a => achItem(a, false)).join('');

    document.getElementById('currentTitleCard').textContent = RecordsSystem.currentTitleName();
    const titles = RecordsSystem.allTitles();
    document.getElementById('titleList').innerHTML = titles.map(t => `
      <div class="title-item">
        <div class="ach-icon">${t.unlocked ? '🎖️' : '🔒'}</div>
        <div>
          <div class="ach-name">${Utils.escapeHtml(t.name)}</div>
          <div class="ach-desc">Rank ${t.rank}${t.unlocked ? '' : ' (ยังไม่ปลดล็อก)'}</div>
        </div>
      </div>
    `).join('');

    const history = RecordsSystem.history();
    const histEl = document.getElementById('historyList');
    const histEmpty = document.getElementById('historyEmpty');
    if (history.length === 0) {
      histEl.innerHTML = '';
      histEmpty.classList.remove('hidden');
    } else {
      histEmpty.classList.add('hidden');
      const iconFor = { quest: '✅', levelup: '⬆️', rankup: '🏆', achievement: '🎖️' };
      histEl.innerHTML = history.slice(0, 100).map(h => `
        <div class="history-item">
          <div class="history-icon">${iconFor[h.type] || '•'}</div>
          <div class="history-text">
            ${Utils.escapeHtml(h.text)}
            <div class="history-time">${Utils.formatDateTime(h.ts)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  function statCard(value, label) {
    return `<div class="stat-card"><div class="v">${value}</div><div class="l">${label}</div></div>`;
  }
  function achItem(a, unlocked) {
    return `
      <div class="ach-item${unlocked ? '' : ' locked'}">
        <div class="ach-icon">${a.icon}</div>
        <div>
          <div class="ach-name">${Utils.escapeHtml(a.name)}</div>
          <div class="ach-desc">${Utils.escapeHtml(a.desc)}</div>
        </div>
      </div>
    `;
  }

  /* ------------------------------------------------------------------ */
  /* SETTINGS PAGE                                                        */
  /* ------------------------------------------------------------------ */
  function bindSettings() {
    document.getElementById('settingsUsername').addEventListener('change', (e) => {
      SettingsSystem.setUsername(e.target.value);
      renderHome();
      Utils.toast('บันทึกชื่อแล้ว');
    });

    document.getElementById('soundSwitch').addEventListener('click', (e) => {
      const nowEnabled = SettingsSystem.toggleSound();
      e.currentTarget.setAttribute('aria-checked', String(nowEnabled));
      if (nowEnabled) SoundSystem.playClick();
      renderHome();
    });

    document.getElementById('btnExport').addEventListener('click', () => {
      SettingsSystem.exportToFile();
      Utils.toast('Export ข้อมูลแล้ว');
    });

    document.getElementById('btnImport').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      SettingsSystem.importFromFile(file, (success) => {
        Utils.toast(success ? 'Import สำเร็จ' : 'Import ล้มเหลว: ไฟล์ไม่ถูกต้อง');
        if (success) renderAll();
        e.target.value = '';
      });
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      if (confirm('ยืนยันการรีเซ็ตข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        SettingsSystem.resetAll();
        renderAll();
        Utils.toast('รีเซ็ตข้อมูลแล้ว');
      }
    });
  }

  function renderSettings() {
    const state = Storage.getState();
    document.getElementById('settingsUsername').value = state.user.username;
    document.getElementById('soundSwitch').setAttribute('aria-checked', String(state.settings.sound));

    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = AvatarSystem.all().map(a => `
      <button type="button" class="avatar-option${a.id === state.avatar ? ' selected' : ''}" data-avatar="${a.id}" title="${Utils.escapeHtml(a.name)}">${a.icon}</button>
    `).join('');
    Utils.qsa('.avatar-option', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        SettingsSystem.setAvatar(btn.dataset.avatar);
        renderSettings();
        renderHome();
        SoundSystem.playClick();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', boot);
})();
