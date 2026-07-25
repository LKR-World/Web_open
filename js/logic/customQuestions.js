// Privater Bereich: eigene Fragen des Users.
// Wird AUSSCHLIESSLICH in localStorage auf dem Gerät gespeichert –
// diese Inhalte verlassen den Browser nie und liegen nicht im Repository.

import { QUESTIONS, TOPICS } from '../data/questions.js';

const KEY = 'boots_custom_questions_v1';

export const CUSTOM_TOPIC = { id: 'eigene', name: 'Eigene Fragen (privat)', icon: '🔒' };

const ALLOWED_TOPICS = [...Object.keys(TOPICS), CUSTOM_TOPIC.id];

// Rohdaten lesen (Array ohne IDs, wie vom User eingegeben)
function loadRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Eigene Fragen mit stabilen IDs (cu-001 … nach Reihenfolge im Import).
// Achtung: Wird die Reihenfolge beim Bearbeiten geändert, wandert der
// Lernfortschritt der Karten mit der Position.
export function loadCustom() {
  return loadRaw().map((q, i) => ({
    id: `cu-${String(i + 1).padStart(3, '0')}`,
    topic: ALLOWED_TOPICS.includes(q.topic) ? q.topic : CUSTOM_TOPIC.id,
    question: q.question,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation || '',
  }));
}

export function customCount() {
  return loadRaw().length;
}

export function customJson() {
  const raw = loadRaw();
  return raw.length ? JSON.stringify(raw, null, 2) : '';
}

export function getAllQuestions() {
  return [...QUESTIONS, ...loadCustom()];
}

// Validiert und speichert; wirft Error mit verständlicher Meldung.
export function saveCustomFromJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Kein gültiges JSON. Prüfe Kommas, Anführungszeichen und Klammern.');
  }
  if (!Array.isArray(data)) {
    throw new Error('Das JSON muss eine Liste sein: [ { … }, { … } ].');
  }
  data.forEach((q, i) => {
    const nr = `Frage ${i + 1}`;
    if (!q || typeof q !== 'object') throw new Error(`${nr}: kein Objekt.`);
    if (typeof q.question !== 'string' || !q.question.trim()) throw new Error(`${nr}: "question" fehlt oder ist leer.`);
    if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`${nr}: "options" braucht mindestens 2 Antworten.`);
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) throw new Error(`${nr}: alle "options" müssen Text sein.`);
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) {
      throw new Error(`${nr}: "correct" muss der Index der richtigen Antwort sein (0 bis ${q.options.length - 1}).`);
    }
    if (q.topic !== undefined && !ALLOWED_TOPICS.includes(q.topic)) {
      throw new Error(`${nr}: unbekanntes "topic" (${q.topic}). Erlaubt: ${ALLOWED_TOPICS.join(', ')} – oder Feld weglassen.`);
    }
    if (q.explanation !== undefined && typeof q.explanation !== 'string') throw new Error(`${nr}: "explanation" muss Text sein.`);
  });
  const cleaned = data.map((q) => ({
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()),
    correct: q.correct,
    explanation: (q.explanation || '').trim(),
    ...(q.topic ? { topic: q.topic } : {}),
  }));
  try {
    localStorage.setItem(KEY, JSON.stringify(cleaned));
  } catch (e) {
    throw new Error('Speichern fehlgeschlagen (Browser-Speicher voll oder blockiert).');
  }
  return cleaned.length;
}

export function clearCustom() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) { /* egal */ }
}

export const EXAMPLE_JSON = `[
  {
    "question": "Beispiel: Wer muss einem Segelboot ausweichen?",
    "options": ["Das Motorboot", "Das Segelboot", "Niemand"],
    "correct": 0,
    "explanation": "Motorboote weichen Segelbooten aus.",
    "topic": "vorfahrt"
  },
  {
    "question": "Zweite Beispielfrage ohne Themenangabe?",
    "options": ["Antwort A", "Antwort B"],
    "correct": 1
  }
]`;
