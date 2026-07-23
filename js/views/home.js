// Dashboard: Rang, XP, Streak, fällige Karten, Themenübersicht.

import { load } from '../logic/storage.js';
import { currentRank, nextRank, topicMastery } from '../logic/gamification.js';
import { dueCount } from '../logic/srs.js';
import { TOPICS, QUESTIONS } from '../data/questions.js';

export function render(container) {
  const state = load();
  const rank = currentRank();
  const next = nextRank();

  const xpPct = next
    ? Math.min(100, Math.round(((state.xp - rank.xp) / (next.xp - rank.xp)) * 100))
    : 100;

  const due = dueCount();

  const card = document.createElement('div');
  card.className = 'card rank-card';
  card.innerHTML = `
    <div class="rank-emblem">${rank.emblem}</div>
    <div class="rank-name">${rank.name}</div>
    <div class="rank-next">${next ? `Noch ${next.xp - state.xp} XP bis ${next.name}` : 'Höchster Rang erreicht – Schiff ahoi!'}</div>
    <div class="xp-bar"><div class="xp-bar-fill" style="width:${xpPct}%"></div></div>
  `;
  container.appendChild(card);

  const stats = document.createElement('div');
  stats.className = 'stat-row';
  stats.innerHTML = `
    <div class="stat-tile">
      <div class="stat-icon">🔥</div>
      <div class="stat-value">${state.streak.current}</div>
      <div class="stat-label">Tage-Streak</div>
    </div>
    <div class="stat-tile">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${state.stats.totalCorrect}</div>
      <div class="stat-label">Richtige Antworten</div>
    </div>
    <div class="stat-tile">
      <div class="stat-icon">🏅</div>
      <div class="stat-value">${Object.keys(state.badges).length}</div>
      <div class="stat-label">Abzeichen</div>
    </div>
  `;
  container.appendChild(stats);

  if (due > 0) {
    const banner = document.createElement('a');
    banner.className = 'due-banner';
    banner.href = '#/karten';
    banner.innerHTML = `<span>🃏</span><span>${due} ${due === 1 ? 'Karte ist' : 'Karten sind'} fällig – jetzt wiederholen!</span>`;
    container.appendChild(banner);
  }

  const cta = document.createElement('a');
  cta.className = 'btn btn-primary btn-block';
  cta.style.textDecoration = 'none';
  cta.href = '#/lernen';
  cta.textContent = '⛵ Weiterlernen';
  container.appendChild(cta);

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = 'Deine Themen';
  container.appendChild(title);

  const list = document.createElement('div');
  list.className = 'topic-list';
  for (const topic of Object.values(TOPICS)) {
    const mastery = Math.round(topicMastery(topic.id, QUESTIONS) * 100);
    const count = QUESTIONS.filter((q) => q.topic === topic.id).length;
    const tile = document.createElement('button');
    tile.className = 'topic-tile';
    tile.addEventListener('click', () => { location.hash = `#/lernen/${topic.id}`; });
    tile.innerHTML = `
      <span class="topic-icon">${topic.icon}</span>
      <span class="topic-name">${topic.name}</span>
      <span class="topic-progress"><span class="topic-progress-fill" style="width:${mastery}%"></span></span>
      <span class="topic-meta">${mastery} % von ${count} Fragen</span>
    `;
    list.appendChild(tile);
  }
  container.appendChild(list);
}
