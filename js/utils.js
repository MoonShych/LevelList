/* ==========================================================================
   utils.js — Generic helper functions shared across the whole system.
   No dependencies. Loaded first.
   ========================================================================== */

const Utils = (() => {

  /** Generate a reasonably unique id (no external libs). */
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** Clamp a number between min/max. */
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /** Returns YYYY-MM-DD for a Date (local time), used as the "day key". */
  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** JS getDay(): 0=Sunday..6=Saturday. Matches the app's day picker values. */
  function todayDayIndex(date = new Date()) {
    return date.getDay();
  }

  const DAY_LABELS_TH = {
    0: 'อาทิตย์', 1: 'จันทร์', 2: 'อังคาร', 3: 'พุธ', 4: 'พฤหัส', 5: 'ศุกร์', 6: 'เสาร์'
  };

  function dayLabel(dayIndex) {
    return DAY_LABELS_TH[dayIndex] || '';
  }

  /** Format a timestamp for history / records display. */
  function formatDateTime(ts) {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  }

  /** Escape user text before injecting into innerHTML. */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  /** Simple toast message shown at bottom of screen. */
  let toastTimer = null;
  function toast(message, duration = 1800) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  return {
    generateId, clamp, dateKey, todayDayIndex, dayLabel,
    formatDateTime, escapeHtml, qs, qsa, toast
  };
})();
