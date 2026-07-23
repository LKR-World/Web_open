// Leitner-System mit 5 Boxen.
// Box 1 = sofort wieder fällig, danach 1 / 3 / 7 / 14 Tage.

import { load, save } from './storage.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const BOX_INTERVALS_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
export const MAX_BOX = 5;

export function getEntry(questionId) {
  return load().srs[questionId] || null;
}

// Antwort verbuchen; gibt { promoted, newBox } zurück.
export function recordAnswer(questionId, wasCorrect) {
  const state = load();
  const now = Date.now();
  let entry = state.srs[questionId];
  if (!entry) {
    entry = { box: 1, due: now, seen: 0, correct: 0, wrong: 0, lastAnswered: 0 };
    state.srs[questionId] = entry;
  }
  entry.seen += 1;
  entry.lastAnswered = now;

  let promoted = false;
  if (wasCorrect) {
    entry.correct += 1;
    if (entry.box < MAX_BOX) {
      entry.box += 1;
      promoted = true;
    }
  } else {
    entry.wrong += 1;
    entry.box = 1;
  }
  entry.due = now + BOX_INTERVALS_DAYS[entry.box] * DAY_MS;
  save();
  return { promoted, newBox: entry.box };
}

// Anzahl fälliger Karten (nur bereits gesehene Fragen)
export function dueCount() {
  const state = load();
  const now = Date.now();
  return Object.values(state.srs).filter((e) => e.due <= now).length;
}

// Kartenauswahl für eine Session:
// 1. fällige Karten (niedrigste Box zuerst, dann älteste due)
// 2. auffüllen mit neuen (nie gesehenen) Fragen, thematisch durchmischt
export function pickSession(allQuestions, size = 12) {
  const state = load();
  const now = Date.now();

  const due = allQuestions
    .filter((q) => {
      const e = state.srs[q.id];
      return e && e.due <= now;
    })
    .sort((a, b) => {
      const ea = state.srs[a.id];
      const eb = state.srs[b.id];
      if (ea.box !== eb.box) return ea.box - eb.box;
      return ea.due - eb.due;
    });

  const picked = due.slice(0, size);
  if (picked.length < size) {
    const fresh = interleaveByTopic(allQuestions.filter((q) => !state.srs[q.id]));
    picked.push(...fresh.slice(0, size - picked.length));
  }
  return picked;
}

// Box-5-Karten zur freiwilligen Wiederholung
export function masteredQuestions(allQuestions) {
  const state = load();
  return allQuestions.filter((q) => state.srs[q.id] && state.srs[q.id].box === MAX_BOX);
}

export function boxCounts() {
  const state = load();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const e of Object.values(state.srs)) counts[e.box] += 1;
  return counts;
}

// Reihum je eine Frage pro Thema, damit neue Karten gemischt sind
function interleaveByTopic(questions) {
  const byTopic = new Map();
  for (const q of questions) {
    if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
    byTopic.get(q.topic).push(q);
  }
  const lists = [...byTopic.values()];
  const result = [];
  let added = true;
  while (added) {
    added = false;
    for (const list of lists) {
      if (list.length) {
        result.push(list.shift());
        added = true;
      }
    }
  }
  return result;
}
