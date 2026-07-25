// localStorage-Wrapper mit Schema-Versionierung.
// Der gesamte App-Zustand liegt in einem einzigen Objekt.

const KEY = 'boots_app_state_v1';

function defaultState() {
  return {
    version: 1,
    xp: 0,
    badges: {},          // badgeId -> ISO-Datum der Verleihung
    streak: { current: 0, best: 0, lastActiveDay: null },
    srs: {},             // questionId -> { box, due, seen, correct, wrong, lastAnswered }
    stats: {
      perTopic: {},      // topicId -> { correct, wrong }
      perQuestion: {},   // questionId -> { correct, wrong } (für Themen-Badges: mind. 1x richtig)
      sheets: {},        // Bogen-Nr -> { attempts, best (0..1), passed }
      examsPassed: 0,
      examsTaken: 0,
      perfectRounds: 0,
      totalCorrect: 0,
      totalWrong: 0,
    },
    settings: {},
  };
}

let state = null;

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Fehlende Felder aus dem Default ergänzen (einfache Migration)
      state = Object.assign(defaultState(), parsed);
      state.streak = Object.assign(defaultState().streak, parsed.streak || {});
      state.stats = Object.assign(defaultState().stats, parsed.stats || {});
    } else {
      state = defaultState();
    }
  } catch (e) {
    state = defaultState();
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(load()));
  } catch (e) {
    // Quota voll oder Private Mode – App bleibt nutzbar, nur ohne Persistenz
  }
}

export function reset() {
  state = defaultState();
  try {
    localStorage.removeItem(KEY);
  } catch (e) { /* egal */ }
}

// Lokales Datum als YYYY-MM-DD (lokale Zeitzone, nicht UTC!)
export function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
