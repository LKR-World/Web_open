// Fortschritt: Statistik pro Thema, Badge-Galerie, Streak, Reset.

import { load, reset } from '../logic/storage.js';
import { currentRank } from '../logic/gamification.js';
import { TOPICS, QUESTIONS } from '../data/questions.js';
import { BADGES } from '../data/badges.js';
import { render as rerenderApp } from '../app.js';

export function render(container) {
  const state = load();
  const rank = currentRank();

  container.innerHTML = `
    <h1 class="page-title">Deine Erfolge</h1>
    <p class="page-subtitle">${rank.emblem} ${rank.name} · ${state.xp} XP</p>
  `;

  const stats = document.createElement('div');
  stats.className = 'stat-row';
  stats.innerHTML = `
    <div class="stat-tile">
      <div class="stat-icon">🔥</div>
      <div class="stat-value">${state.streak.best}</div>
      <div class="stat-label">Beste Streak</div>
    </div>
    <div class="stat-tile">
      <div class="stat-icon">🎓</div>
      <div class="stat-value">${state.stats.examsPassed}</div>
      <div class="stat-label">Simulationen bestanden</div>
    </div>
    <div class="stat-tile">
      <div class="stat-icon">💯</div>
      <div class="stat-value">${state.stats.perfectRounds}</div>
      <div class="stat-label">Perfekte Runden</div>
    </div>
  `;
  container.appendChild(stats);

  /* Themen-Statistik */
  const topicTitle = document.createElement('div');
  topicTitle.className = 'section-title';
  topicTitle.textContent = 'Themen im Griff';
  container.appendChild(topicTitle);

  const card = document.createElement('div');
  card.className = 'card';
  for (const topic of Object.values(TOPICS)) {
    const topicQuestions = QUESTIONS.filter((q) => q.topic === topic.id);
    const solved = topicQuestions.filter((q) => {
      const s = state.stats.perQuestion[q.id];
      return s && s.correct > 0;
    }).length;
    const pct = topicQuestions.length ? Math.round((solved / topicQuestions.length) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'topic-stat-row';
    row.innerHTML = `
      <span class="topic-stat-icon">${topic.icon}</span>
      <span class="topic-stat-name">${topic.name}</span>
      <span class="topic-stat-bar"><span class="topic-stat-fill" style="width:${pct}%"></span></span>
      <span class="topic-stat-pct">${pct} %</span>
    `;
    card.appendChild(row);
  }
  container.appendChild(card);

  /* Badges */
  const badgeTitle = document.createElement('div');
  badgeTitle.className = 'section-title';
  badgeTitle.textContent = `Abzeichen (${Object.keys(state.badges).length} / ${BADGES.length})`;
  container.appendChild(badgeTitle);

  const grid = document.createElement('div');
  grid.className = 'badge-grid';
  for (const badge of BADGES) {
    const earned = !!state.badges[badge.id];
    const item = document.createElement('div');
    item.className = 'badge-item' + (earned ? '' : ' locked');
    item.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.description}</div>
    `;
    grid.appendChild(item);
  }
  container.appendChild(grid);

  /* Reset */
  const resetTitle = document.createElement('div');
  resetTitle.className = 'section-title';
  resetTitle.textContent = 'Daten';
  container.appendChild(resetTitle);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-danger btn-block';
  resetBtn.textContent = 'Allen Fortschritt zurücksetzen';
  resetBtn.addEventListener('click', () => {
    if (confirm('Wirklich allen Fortschritt (XP, Abzeichen, Karteikarten) löschen? Das kann nicht rückgängig gemacht werden.')) {
      reset();
      rerenderApp();
    }
  });
  container.appendChild(resetBtn);
}
