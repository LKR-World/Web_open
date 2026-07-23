// Einstiegspunkt: Hash-Router, Header-XP, Toast-Overlay.

import { load } from './logic/storage.js';
import * as home from './views/home.js';
import * as quiz from './views/quiz.js';
import * as flashcards from './views/flashcards.js';
import * as progress from './views/progress.js';

const routes = {
  home,
  lernen: quiz,
  karten: flashcards,
  fortschritt: progress,
};

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [route, ...rest] = hash.split('/');
  return { route: route || 'home', params: rest };
}

export function render() {
  const { route, params } = parseHash();
  const view = routes[route] || routes.home;
  const container = document.getElementById('view');
  container.innerHTML = '';
  window.scrollTo(0, 0);
  view.render(container, params);
  updateTabs(route in routes ? route : 'home');
  updateHeaderXp();
}

function updateTabs(activeRoute) {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.route === activeRoute);
  }
}

export function updateHeaderXp() {
  const elXp = document.getElementById('header-xp');
  if (elXp) elXp.textContent = `${load().xp} XP`;
}

/* ============ Toasts (Badges, Level-Up, XP) ============ */

export function showToast({ icon, title, sub, gold = false, duration = 3200 }) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (gold ? ' gold' : '');
  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.textContent = icon;
  const textEl = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;
  textEl.appendChild(titleEl);
  if (sub) {
    const subEl = document.createElement('div');
    subEl.className = 'toast-sub';
    subEl.textContent = sub;
    textEl.appendChild(subEl);
  }
  toast.appendChild(iconEl);
  toast.appendChild(textEl);
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// Gebündelte Anzeige nach einer Antwort/Runde
export function announce({ levelUp, newRank, badges = [] }) {
  if (levelUp && newRank) {
    showToast({ icon: newRank.emblem, title: `Beförderung: ${newRank.name}!`, sub: 'Neuer Rang erreicht', gold: true, duration: 4200 });
  }
  badges.forEach((badge, i) => {
    setTimeout(() => {
      showToast({ icon: badge.icon, title: `Abzeichen: ${badge.name}`, sub: badge.description, gold: true, duration: 4200 });
    }, 600 * (i + (levelUp ? 1 : 0)));
  });
}

window.addEventListener('hashchange', render);
render();
