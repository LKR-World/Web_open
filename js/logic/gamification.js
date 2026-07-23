// XP, Ränge, Streak und Badge-Vergabe.

import { load, save, todayStr } from './storage.js';
import { BADGES } from '../data/badges.js';

export const RANKS = [
  { level: 1, name: 'Moses', xp: 0, emblem: '🐣' },
  { level: 2, name: 'Leichtmatrose', xp: 150, emblem: '🪢' },
  { level: 3, name: 'Matrose', xp: 400, emblem: '⚓' },
  { level: 4, name: 'Vollmatrose', xp: 800, emblem: '🌊' },
  { level: 5, name: 'Bootsmann', xp: 1400, emblem: '🛥️' },
  { level: 6, name: 'Steuermann', xp: 2200, emblem: '🧭' },
  { level: 7, name: 'Erster Offizier', xp: 3200, emblem: '🎖️' },
  { level: 8, name: 'Kapitän', xp: 4500, emblem: '👨‍✈️' },
];

export const XP = {
  CORRECT: 10,
  CORRECT_FIRST_TRY_NEW: 15,
  BOX_PROMOTION: 5,
  ROUND_DONE: 20,
  ROUND_PERFECT_BONUS: 50,
  EXAM_PASSED: 100,
};

export function currentRank() {
  const xp = load().xp;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xp) rank = r;
  }
  return rank;
}

export function nextRank() {
  const rank = currentRank();
  return RANKS.find((r) => r.level === rank.level + 1) || null;
}

// XP gutschreiben; gibt { levelUp, newRank } zurück
export function addXp(amount) {
  const state = load();
  const before = currentRank();
  state.xp += amount;
  save();
  const after = currentRank();
  return { levelUp: after.level > before.level, newRank: after };
}

// Streak beim ersten beantworteten Element des Tages aktualisieren.
// Gibt den Tagesbonus-XP zurück (0, wenn heute schon gezählt).
export function touchStreak() {
  const state = load();
  const today = todayStr();
  const yesterday = todayStr(-1);
  const s = state.streak;

  if (s.lastActiveDay === today) return 0;

  if (s.lastActiveDay === yesterday) {
    s.current += 1;
  } else {
    s.current = 1;
  }
  s.lastActiveDay = today;
  if (s.current > s.best) s.best = s.current;
  save();

  const bonus = 10 * Math.min(s.current, 7);
  return bonus;
}

// Alle Badge-Bedingungen prüfen; neu verliehene Badges zurückgeben.
export function checkBadges(questions) {
  const state = load();
  const newly = [];
  for (const badge of BADGES) {
    if (state.badges[badge.id]) continue;
    if (badge.check(state, questions)) {
      state.badges[badge.id] = new Date().toISOString();
      newly.push(badge);
    }
  }
  if (newly.length) save();
  return newly;
}

// Antwort in der Themen-/Fragen-Statistik verbuchen
export function recordStat(question, wasCorrect) {
  const state = load();
  const t = state.stats.perTopic[question.topic] || { correct: 0, wrong: 0 };
  const q = state.stats.perQuestion[question.id] || { correct: 0, wrong: 0 };
  if (wasCorrect) {
    t.correct += 1;
    q.correct += 1;
    state.stats.totalCorrect += 1;
  } else {
    t.wrong += 1;
    q.wrong += 1;
    state.stats.totalWrong += 1;
  }
  state.stats.perTopic[question.topic] = t;
  state.stats.perQuestion[question.id] = q;
  save();
}

// Anteil der Fragen eines Themas, die mind. einmal richtig beantwortet wurden
export function topicMastery(topicId, questions) {
  const state = load();
  const topicQuestions = questions.filter((q) => q.topic === topicId);
  if (!topicQuestions.length) return 0;
  const solved = topicQuestions.filter((q) => {
    const s = state.stats.perQuestion[q.id];
    return s && s.correct > 0;
  }).length;
  return solved / topicQuestions.length;
}
