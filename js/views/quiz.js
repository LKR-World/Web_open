// Lernmodus: Themenauswahl, Quiz-Runden und Prüfungssimulation.

import { load, save } from '../logic/storage.js';
import { recordAnswer, getEntry } from '../logic/srs.js';
import { addXp, touchStreak, checkBadges, recordStat, XP, topicMastery } from '../logic/gamification.js';
import { TOPICS, QUESTIONS } from '../data/questions.js';
import { renderScenario } from '../svg/scenarios.js';
import { showToast, announce, updateHeaderXp } from '../app.js';

const ROUND_SIZE = 10;
const EXAM_SIZE = 30;
const EXAM_PASS = 0.8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function render(container, params) {
  const mode = params[0];
  if (!mode) {
    renderTopicChooser(container);
  } else {
    startQuiz(container, mode);
  }
}

/* ============ Themenauswahl ============ */

function renderTopicChooser(container) {
  container.innerHTML = `
    <h1 class="page-title">Lernmodus</h1>
    <p class="page-subtitle">Wähle ein Thema – oder stelle dich der Prüfungssimulation.</p>
  `;
  const list = document.createElement('div');
  list.className = 'topic-list';

  const alle = document.createElement('button');
  alle.className = 'topic-tile topic-tile-wide';
  alle.innerHTML = `<span class="topic-icon">🎲</span><div><div class="topic-name">Alle Themen gemischt</div><div class="topic-meta">${ROUND_SIZE} zufällige Fragen quer durch den Stoff</div></div>`;
  alle.addEventListener('click', () => { location.hash = '#/lernen/alle'; });
  list.appendChild(alle);

  for (const topic of Object.values(TOPICS)) {
    const mastery = Math.round(topicMastery(topic.id, QUESTIONS) * 100);
    const tile = document.createElement('button');
    tile.className = 'topic-tile';
    tile.innerHTML = `
      <span class="topic-icon">${topic.icon}</span>
      <span class="topic-name">${topic.name}</span>
      <span class="topic-progress"><span class="topic-progress-fill" style="width:${mastery}%"></span></span>
      <span class="topic-meta">${mastery} % gemeistert</span>
    `;
    tile.addEventListener('click', () => { location.hash = `#/lernen/${topic.id}`; });
    list.appendChild(tile);
  }

  const exam = document.createElement('button');
  exam.className = 'topic-tile topic-tile-wide topic-tile-exam';
  exam.innerHTML = `<span class="topic-icon">🎓</span><div><div class="topic-name">Prüfungssimulation</div><div class="topic-meta">${EXAM_SIZE} Fragen aus allen Themen – bestanden ab ${Math.round(EXAM_PASS * 100)} %</div></div>`;
  exam.addEventListener('click', () => { location.hash = '#/lernen/pruefung'; });
  list.appendChild(exam);

  container.appendChild(list);
}

/* ============ Quiz-Runde ============ */

function startQuiz(container, mode) {
  let pool;
  let title;
  const isExam = mode === 'pruefung';

  if (isExam) {
    pool = shuffle(QUESTIONS).slice(0, EXAM_SIZE);
    title = 'Prüfungssimulation';
  } else if (mode === 'alle') {
    pool = shuffle(QUESTIONS).slice(0, ROUND_SIZE);
    title = 'Alle Themen';
  } else if (TOPICS[mode]) {
    pool = shuffle(QUESTIONS.filter((q) => q.topic === mode)).slice(0, ROUND_SIZE);
    title = TOPICS[mode].name;
  } else {
    location.hash = '#/lernen';
    return;
  }

  const session = {
    questions: pool,
    index: 0,
    correct: 0,
    wrong: 0,
    xpGained: 0,
    isExam,
    title,
  };
  renderQuestion(container, session);
}

function renderQuestion(container, session) {
  const q = session.questions[session.index];
  container.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'quiz-top';
  const abort = document.createElement('button');
  abort.className = 'quiz-abort';
  abort.setAttribute('aria-label', 'Runde abbrechen');
  abort.textContent = '✕';
  abort.addEventListener('click', () => { location.hash = '#/lernen'; });
  const bar = document.createElement('div');
  bar.className = 'quiz-progress';
  bar.innerHTML = `<div class="quiz-progress-fill" style="width:${(session.index / session.questions.length) * 100}%"></div>`;
  const counter = document.createElement('span');
  counter.className = 'quiz-counter';
  counter.textContent = `${session.index + 1} / ${session.questions.length}`;
  top.append(abort, bar, counter);
  container.appendChild(top);

  const card = document.createElement('div');
  card.className = 'card';
  const text = document.createElement('div');
  text.className = 'question-text';
  text.textContent = q.question;
  card.appendChild(text);

  const isInteractive = q.scenario && q.scenario.interactive;

  if (q.scenario) {
    const box = document.createElement('div');
    box.className = 'scenario-box';
    const svg = renderScenario(q.scenario, {
      onPick: isInteractive ? (label, isCorrect) => handleAnswer(container, card, session, q, isCorrect, null) : undefined,
    });
    box.appendChild(svg);
    card.appendChild(box);
    if (isInteractive) {
      const hint = document.createElement('div');
      hint.className = 'scenario-hint';
      hint.textContent = 'Tippe direkt auf die Grafik.';
      card.appendChild(hint);
    }
  }

  if (!isInteractive) {
    const optionsEl = document.createElement('div');
    optionsEl.className = 'options';
    // Optionen mischen, Bezug zum korrekten Index behalten
    const order = shuffle(q.options.map((_, i) => i));
    for (const originalIndex of order) {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = q.options[originalIndex];
      btn.addEventListener('click', () => {
        for (const b of optionsEl.querySelectorAll('button')) b.disabled = true;
        const isCorrect = originalIndex === q.correct;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          const correctBtn = [...optionsEl.querySelectorAll('button')]
            .find((b, i) => order[i] === q.correct);
          if (correctBtn) correctBtn.classList.add('correct');
        }
        handleAnswer(container, card, session, q, isCorrect, null);
      });
      optionsEl.appendChild(btn);
    }
    card.appendChild(optionsEl);
  }

  container.appendChild(card);
}

function handleAnswer(container, card, session, q, isCorrect) {
  const wasNew = !getEntry(q.id);
  const { promoted } = recordAnswer(q.id, isCorrect);
  recordStat(q, isCorrect);

  let xp = 0;
  if (isCorrect) {
    xp += wasNew ? XP.CORRECT_FIRST_TRY_NEW : XP.CORRECT;
    if (promoted && !wasNew) xp += XP.BOX_PROMOTION;
    session.correct += 1;
  } else {
    session.wrong += 1;
  }

  // Streak: erstes beantwortetes Element des Tages gibt Bonus
  const streakBonus = touchStreak();
  if (streakBonus > 0) {
    xp += streakBonus;
    const s = load().streak;
    showToast({ icon: '🔥', title: `Streak: Tag ${s.current}`, sub: `+${streakBonus} XP Tagesbonus` });
  }

  if (xp > 0) {
    session.xpGained += xp;
    const levelInfo = addXp(xp);
    announce({ ...levelInfo, badges: checkBadges(QUESTIONS) });
  } else {
    announce({ levelUp: false, badges: checkBadges(QUESTIONS) });
  }
  updateHeaderXp();

  const note = document.createElement('div');
  note.className = 'explanation' + (isCorrect ? ' correct-note' : '');
  note.innerHTML = `<div class="explanation-title">${isCorrect ? `✅ Richtig! +${xp} XP` : '❌ Leider falsch'}</div>`;
  const body = document.createElement('div');
  body.textContent = q.explanation;
  note.appendChild(body);
  card.appendChild(note);

  const next = document.createElement('button');
  next.className = 'btn btn-primary btn-block quiz-next';
  const isLast = session.index === session.questions.length - 1;
  next.textContent = isLast ? 'Zum Ergebnis' : 'Weiter →';
  next.addEventListener('click', () => {
    session.index += 1;
    if (session.index < session.questions.length) {
      renderQuestion(container, session);
    } else {
      finishRound(container, session);
    }
  });
  container.appendChild(next);
  next.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

/* ============ Rundenabschluss ============ */

function finishRound(container, session) {
  const state = load();
  const total = session.questions.length;
  const pct = Math.round((session.correct / total) * 100);
  const perfect = session.wrong === 0;

  let bonus = XP.ROUND_DONE;
  if (perfect) {
    bonus += XP.ROUND_PERFECT_BONUS;
    state.stats.perfectRounds += 1;
  }

  let passed = false;
  if (session.isExam) {
    state.stats.examsTaken += 1;
    passed = session.correct / total >= EXAM_PASS;
    if (passed) {
      state.stats.examsPassed += 1;
      bonus += XP.EXAM_PASSED;
    }
  }
  save();

  session.xpGained += bonus;
  const levelInfo = addXp(bonus);
  announce({ ...levelInfo, badges: checkBadges(QUESTIONS) });
  updateHeaderXp();

  container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'result-screen';

  let emoji, titleText, subText;
  if (session.isExam) {
    emoji = passed ? '🎓' : '🌊';
    titleText = passed ? 'Bestanden!' : 'Noch nicht bestanden';
    subText = passed
      ? `Du hast die Simulation mit ${pct} % gemeistert – prüfungsreif!`
      : `Du brauchst mindestens ${Math.round(EXAM_PASS * 100)} % – dranbleiben, Kurs halten!`;
  } else if (perfect) {
    emoji = '🏆';
    titleText = 'Perfekte Runde!';
    subText = 'Alle Fragen richtig – so segelt ein Kapitän.';
  } else if (pct >= 70) {
    emoji = '⛵';
    titleText = 'Gut unterwegs!';
    subText = 'Die Fehler landen automatisch in deinen Karteikarten.';
  } else {
    emoji = '🧭';
    titleText = 'Kurs korrigieren';
    subText = 'Kein Problem – die kniffligen Fragen kommen in den Karteikarten wieder.';
  }

  screen.innerHTML = `
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">${titleText}</div>
    <div class="result-sub">${subText}</div>
    <div class="result-score">${session.correct} / ${total}</div>
    <div class="xp-gain">+${session.xpGained} XP</div>
  `;

  const again = document.createElement('button');
  again.className = 'btn btn-primary btn-block';
  again.textContent = session.isExam ? 'Simulation wiederholen' : 'Noch eine Runde';
  // hashchange feuert bei identischem Hash nicht – Runde deshalb direkt neu starten
  again.addEventListener('click', () => {
    const viewContainer = document.getElementById('view');
    viewContainer.innerHTML = '';
    startQuiz(viewContainer, sessionModeOf(session));
  });

  const back = document.createElement('a');
  back.className = 'btn btn-secondary btn-block';
  back.style.cssText = 'text-decoration:none;margin-top:10px;';
  back.href = '#/lernen';
  back.textContent = 'Zur Themenwahl';

  screen.appendChild(again);
  screen.appendChild(back);
  container.appendChild(screen);
}

function sessionModeOf(session) {
  if (session.isExam) return 'pruefung';
  const topic = Object.values(TOPICS).find((t) => t.name === session.title);
  return topic ? topic.id : 'alle';
}
