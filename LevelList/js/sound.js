/* ==========================================================================
   sound.js — Lightweight sound system.
   Generates short HUD-style beeps with the WebAudio API instead of shipping
   audio files, so the app stays 100% offline with zero extra assets.
   ========================================================================== */

const SoundSystem = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function isEnabled() {
    return Storage.getState().settings.sound;
  }

  function setEnabled(val) {
    const state = Storage.getState();
    state.settings.sound = !!val;
    Storage.save(state);
  }

  /** Play a short sequence of tones. notes: [{freq, dur, delay, type, gain}] */
  function playNotes(notes) {
    if (!isEnabled()) return;
    const audio = getCtx();
    if (!audio) return;
    const now = audio.currentTime;

    notes.forEach(note => {
      const osc = audio.createOscillator();
      const gainNode = audio.createGain();
      osc.type = note.type || 'sine';
      osc.frequency.value = note.freq;

      const start = now + (note.delay || 0);
      const dur = note.dur || 0.12;
      const peak = note.gain != null ? note.gain : 0.18;

      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(peak, start + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gainNode);
      gainNode.connect(audio.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  function playClick() {
    playNotes([{ freq: 620, dur: 0.05, type: 'square', gain: 0.08 }]);
  }

  function playQuestComplete() {
    playNotes([
      { freq: 520, dur: 0.09, delay: 0, type: 'triangle' },
      { freq: 780, dur: 0.14, delay: 0.08, type: 'triangle' }
    ]);
  }

  function playLevelUp() {
    playNotes([
      { freq: 440, dur: 0.1, delay: 0, type: 'sawtooth', gain: 0.12 },
      { freq: 660, dur: 0.1, delay: 0.1, type: 'sawtooth', gain: 0.12 },
      { freq: 880, dur: 0.22, delay: 0.2, type: 'sawtooth', gain: 0.14 }
    ]);
  }

  function playRankUp() {
    playNotes([
      { freq: 300, dur: 0.12, delay: 0, type: 'sawtooth', gain: 0.14 },
      { freq: 500, dur: 0.12, delay: 0.1, type: 'sawtooth', gain: 0.14 },
      { freq: 750, dur: 0.12, delay: 0.2, type: 'sawtooth', gain: 0.14 },
      { freq: 1000, dur: 0.28, delay: 0.3, type: 'sawtooth', gain: 0.16 }
    ]);
  }

  function playAchievement() {
    playNotes([
      { freq: 660, dur: 0.1, delay: 0, type: 'sine' },
      { freq: 880, dur: 0.1, delay: 0.09, type: 'sine' },
      { freq: 1100, dur: 0.18, delay: 0.18, type: 'sine' }
    ]);
  }

  return {
    isEnabled, setEnabled,
    playClick, playQuestComplete, playLevelUp, playRankUp, playAchievement
  };
})();
