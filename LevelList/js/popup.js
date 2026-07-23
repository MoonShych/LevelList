/* ==========================================================================
   popup.js — Central popup queue.
   Multiple system events (quest complete, level up, rank up, achievement)
   can fire in the same action; queue keeps them from overlapping.
   ========================================================================== */

const PopupSystem = (() => {
  const queue = [];
  let showing = false;

  const CONFIG = {
    quest: { eyebrow: 'QUEST COMPLETE', icon: '✅', cls: 'type-quest', sound: () => SoundSystem.playQuestComplete() },
    levelup: { eyebrow: 'LEVEL UP', icon: '⬆️', cls: 'type-levelup', sound: () => SoundSystem.playLevelUp() },
    rankup: { eyebrow: 'RANK UP', icon: '🏆', cls: 'type-rankup', sound: () => SoundSystem.playRankUp() },
    achievement: { eyebrow: 'ACHIEVEMENT UNLOCKED', icon: '🎖️', cls: 'type-achievement', sound: () => SoundSystem.playAchievement() }
  };

  function show(type, title, sub) {
    queue.push({ type, title, sub });
    if (!showing) next();
  }

  function next() {
    if (queue.length === 0) { showing = false; return; }
    showing = true;
    const { type, title, sub } = queue.shift();
    const cfg = CONFIG[type] || CONFIG.quest;

    const overlay = document.getElementById('systemPopup');
    const box = document.getElementById('popupBox');
    box.className = `popup-box ${cfg.cls}`;
    document.getElementById('popupEyebrow').textContent = cfg.eyebrow;
    document.getElementById('popupIcon').textContent = cfg.icon;
    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupSub').textContent = sub || '';

    overlay.classList.remove('hidden');
    cfg.sound();
  }

  function close() {
    document.getElementById('systemPopup').classList.add('hidden');
    setTimeout(next, 180);
  }

  function init() {
    document.getElementById('popupCloseBtn').addEventListener('click', close);
    document.getElementById('systemPopup').addEventListener('click', (e) => {
      if (e.target.id === 'systemPopup') close();
    });
  }

  return { show, close, init };
})();
