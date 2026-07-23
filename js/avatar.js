/* ==========================================================================
   avatar.js — Icon-only avatar catalog (no images allowed by spec).
   ========================================================================== */

const AvatarSystem = (() => {
  const CATALOG = [
    { id: 'a01', icon: '🧙', name: 'นักเวทย์' },
    { id: 'a02', icon: '🗡️', name: 'นักดาบ' },
    { id: 'a03', icon: '🏹', name: 'นักธนู' },
    { id: 'a04', icon: '🛡️', name: 'อัศวิน' },
    { id: 'a05', icon: '🥷', name: 'นินจา' },
    { id: 'a06', icon: '👹', name: 'ปีศาจ' },
    { id: 'a07', icon: '🧝', name: 'เอลฟ์' },
    { id: 'a08', icon: '🐉', name: 'มังกร' },
    { id: 'a09', icon: '☠️', name: 'นักล่าเงา' },
    { id: 'a10', icon: '🦂', name: 'นักล่า' },
    { id: 'a11', icon: '🔮', name: 'ผู้ทำนาย' },
    { id: 'a12', icon: '⚡', name: 'จอมเวท' }
  ];

  function all() {
    return CATALOG;
  }

  function getById(id) {
    return CATALOG.find(a => a.id === id) || CATALOG[0];
  }

  function iconFor(id) {
    return getById(id).icon;
  }

  function select(id) {
    const state = Storage.getState();
    state.avatar = id;
    state.user.avatar = id;
    Storage.save(state);
  }

  return { all, getById, iconFor, select };
})();
