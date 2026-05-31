const ACT_STATUS_KEY = 'teacher-act-status-map';

export function loadActStatusMap() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(ACT_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveActStatusMap(nextMap) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ACT_STATUS_KEY, JSON.stringify(nextMap));
  } catch {
    // Ignore storage errors in environments where localStorage is unavailable.
  }
}
