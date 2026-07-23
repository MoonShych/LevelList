/* ==========================================================================
   settings.js — User profile + data management (export / import / reset).
   ========================================================================== */

const SettingsSystem = (() => {

  function setUsername(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    const state = Storage.getState();
    state.user.username = trimmed.slice(0, 20);
    Storage.save(state);
    return true;
  }

  function setAvatar(avatarId) {
    AvatarSystem.select(avatarId);
  }

  function toggleSound() {
    const enabled = SoundSystem.isEnabled();
    SoundSystem.setEnabled(!enabled);
    return !enabled;
  }

  function exportToFile() {
    const json = Storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = Utils.dateKey();
    a.href = url;
    a.download = `levellist-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function importFromFile(file, onDone) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Storage.importData(reader.result);
        onDone(true);
      } catch (e) {
        console.error('Import failed', e);
        onDone(false);
      }
    };
    reader.onerror = () => onDone(false);
    reader.readAsText(file);
  }

  function resetAll() {
    Storage.resetData();
  }

  return { setUsername, setAvatar, toggleSound, exportToFile, importFromFile, resetAll };
})();
