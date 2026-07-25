// Karteikarten-Modus: Leitner-Session mit echten Antworten (Multiple Choice),
// damit der Box-Übergang objektiv ist. Falsche Karten kommen in derselben
// Session erneut dran (Box 1 = sofort fällig).

import { load } from '../logic/storage.js';
import { pickSession, recordAnswer, getEntry, boxCounts, masteredQuestions } from '../logic/srs.js';
import { addXp, touchStreak, checkBadges, recordStat, XP } from '../logic/gamification.js';
import { TOPICS, QUESTIONS } from '../data/questions.js';
import { getAllQuestions, CUSTOM_TOPIC } from '../logic/customQuestions.js';
import { renderScenario } from '../svg/scenarios.js';
import { showToast, announce, updateHeaderXp } from '../app.js';

const SESSION_SIZE = 12;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function render(container, params) {
  if (params[0] === 'session') {
    startSession(container, false);
  } else if (params[0] === 'meister') {
    startSession(container, true);
  } else {
    renderOverview(container);
  }
}

/* ============ Übersicht ============ */

function renderOverview(container) {
  container.innerHTML = `
    <h1 class="page-title">Karteikarten</h1>
    <p class="page-subtitle">Falsch beantwortete Fragen wandern in Box 1 und kommen öfter – bis sie sitzen.</p>
  `;

  const counts = boxCounts();
  const maxCount = Math.max(1, ...Object.values(counts));

  const card = document.createElement('div');
  card.className = 'card';
  const overview = document.createElement('div');
  overview.className = 'boxes-overview';
  for (let box = 1; box <= 5; box++) {
    const col = document.createElement('div');
    col.className = 'box-col';
    const heightPct = Math.round((counts[box] / maxCount) * 70) + 8;
    col.innerHTML = `
      <span class="box-count">${counts[box]}</span>
      <span class="box-bar" style="height:${heightPct}%"></span>
      <span class="box-label">Box ${box}</span>
    `;
    overview.appendChild(col);
  }
  card.appendChild(overview);
  const legend = document.createElement('div');
  legend.className = 'boxes-legend';
  legend.textContent = 'Wiederholung: sofort · 1 Tag · 3 Tage · 7 Tage · 14 Tage';
  card.appendChild(legend);
  container.appendChild(card);

  const session = pickSession(getAllQuestions(), SESSION_SIZE);
  const dueNow = session.filter((q) => {
    const e = getEntry(q.id);
    return e && e.due <= Date.now();
  }).length;
  const freshCount = session.filter((q) => !getEntry(q.id)).length;

  if (session.length > 0) {
    const info = document.createElement('p');
    info.className = 'page-subtitle';
    info.textContent = `Nächste Session: ${session.length} Karten (${dueNow} fällig, ${freshCount} neu).`;
    container.appendChild(info);

    const start = document.createElement('button');
    start.className = 'btn btn-primary btn-block';
    start.textContent = '🃏 Session starten';
    start.addEventListener('click', () => { location.hash = '#/karten/session'; });
    container.appendChild(start);
  } else {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-icon">🌅</div><p><strong>Alles gelernt für heute!</strong><br>Keine Karten fällig und keine neuen Fragen übrig.</p>`;
    container.appendChild(empty);

    if (masteredQuestions(getAllQuestions()).length > 0) {
      const repeat = document.createElement('button');
      repeat.className = 'btn btn-secondary btn-block';
      repeat.textContent = 'Box-5-Karten freiwillig wiederholen';
      repeat.addEventListener('click', () => { location.hash = '#/karten/meister'; });
      container.appendChild(repeat);
    }
  }
}

/* ============ Session ============ */

function startSession(container, masteredOnly) {
  const cards = masteredOnly
    ? shuffle(masteredQuestions(getAllQuestions())).slice(0, SESSION_SIZE)
    : pickSession(getAllQuestions(), SESSION_SIZE);

  if (!cards.length) {
    location.hash = '#/karten';
    return;
  }

  const session = {
    queue: [...cards],
    done: 0,
    total: cards.length,
    again: 0,
    xpGained: 0,
    masteredOnly,
  };
  renderCard(container, session);
}

function renderCard(container, session) {
  const q = session.queue[0];
  container.innerHTML = '';

  const top = document.createElement('div');
  top.className = 'quiz-top';
  const abort = document.createElement('button');
  abort.className = 'quiz-abort';
  abort.setAttribute('aria-label', 'Session beenden');
  abort.textContent = '✕';
  abort.addEventListener('click', () => { location.hash = '#/karten'; });
  const bar = document.createElement('div');
  bar.className = 'quiz-progress';
  bar.innerHTML = `<div class="quiz-progress-fill" style="width:${(session.done / session.total) * 100}%"></div>`;
  const counter = document.createElement('span');
  counter.className = 'quiz-counter';
  counter.textContent = `${session.done} / ${session.total}`;
  top.append(abort, bar, counter);
  container.appendChild(top);

  const entry = getEntry(q.id);
  const status = document.createElement('div');
  status.className = 'flash-status';
  const topicName = TOPICS[q.topic]
    ? `${TOPICS[q.topic].icon} ${TOPICS[q.topic].name}`
    : `${CUSTOM_TOPIC.icon} ${CUSTOM_TOPIC.name}`;
  status.innerHTML = `
    <span>${topicName}</span>
    <span class="flash-badge${entry && entry.wrong > entry.correct ? ' again' : ''}">${entry ? `Box ${entry.box}` : 'Neu'}</span>
  `;
  container.appendChild(status);

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
    box.appendChild(renderScenario(q.scenario, {
      onPick: isInteractive ? (label, isCorrect) => handleAnswer(container, card, session, q, isCorrect) : undefined,
    }));
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
        handleAnswer(container, card, session, q, isCorrect);
      });
      optionsEl.appendChild(btn);
    }
    card.appendChild(optionsEl);
  }

  container.appendChild(card);
}

function handleAnswer(container, card, session, q, isCorrect) {
  const wasNew = !getEntry(q.id);
  const { promoted, newBox } = recordAnswer(q.id, isCorrect);
  recordStat(q, isCorrect);

  let xp = 0;
  if (isCorrect) {
    xp += wasNew ? XP.CORRECT_FIRST_TRY_NEW : XP.CORRECT;
    if (promoted && !wasNew) xp += XP.BOX_PROMOTION;
  }

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
  const title = isCorrect
    ? `✅ Richtig! ${promoted ? `Karte steigt in Box ${newBox}.` : 'Karte bleibt in Box 5.'} +${xp} XP`
    : '❌ Falsch – Karte zurück in Box 1, sie kommt gleich nochmal.';
  note.innerHTML = `<div class="explanation-title">${title}</div>`;
  const body = document.createElement('div');
  body.textContent = q.explanation;
  note.appendChild(body);
  card.appendChild(note);

  const next = document.createElement('button');
  next.className = 'btn btn-primary btn-block quiz-next';
  next.textContent = 'Weiter →';
  next.addEventListener('click', () => {
    session.queue.shift();
    if (isCorrect) {
      session.done += 1;
    } else if (session.masteredOnly) {
      session.done += 1; // freiwillige Wiederholung: nicht erneut einreihen
    } else {
      session.again += 1;
      session.queue.push(q); // falsch: hinten wieder einreihen
    }
    if (session.queue.length) {
      renderCard(container, session);
    } else {
      finishSession(container, session);
    }
  });
  container.appendChild(next);
  next.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function finishSession(container, session) {
  container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'result-screen';
  screen.innerHTML = `
    <div class="result-emoji">${session.again === 0 ? '🏆' : '🃏'}</div>
    <div class="result-title">Session geschafft!</div>
    <div class="result-sub">${session.total} Karten gelernt${session.again ? `, ${session.again} brauchten einen zweiten Anlauf` : ' – alles im ersten Anlauf!'}</div>
    <div class="xp-gain">+${session.xpGained} XP</div>
  `;
  const back = document.createElement('a');
  back.className = 'btn btn-primary btn-block';
  back.style.textDecoration = 'none';
  back.href = '#/karten';
  back.textContent = 'Zur Übersicht';
  screen.appendChild(back);
  container.appendChild(screen);
}
