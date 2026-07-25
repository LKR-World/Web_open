// Privater Bereich: eigene Fragen einfügen/bearbeiten.
// Inhalte bleiben ausschliesslich im Browser-Speicher dieses Geräts.

import { customCount, customJson, saveCustomFromJson, clearCustom, EXAMPLE_JSON } from '../logic/customQuestions.js';

export function render(container) {
  container.innerHTML = `
    <h1 class="page-title">🔒 Privater Bereich</h1>
    <p class="page-subtitle">Füge hier eigene Fragen als JSON ein. Sie werden <strong>nur auf diesem Gerät</strong> gespeichert (Browser-Speicher), nie hochgeladen und sind nur für deinen persönlichen Gebrauch bestimmt.</p>
  `;

  const card = document.createElement('div');
  card.className = 'card';

  const info = document.createElement('p');
  info.className = 'page-subtitle';
  info.textContent = `Aktuell gespeichert: ${customCount()} eigene Fragen. Format: Liste von Objekten mit "question", "options", "correct" (Index der richtigen Antwort), optional "explanation" und "topic".`;
  card.appendChild(info);

  const area = document.createElement('textarea');
  area.className = 'import-area';
  area.rows = 16;
  area.spellcheck = false;
  area.value = customJson() || EXAMPLE_JSON;
  area.setAttribute('aria-label', 'Eigene Fragen als JSON');
  card.appendChild(area);

  const errorBox = document.createElement('div');
  errorBox.className = 'error-box';
  errorBox.style.display = 'none';
  card.appendChild(errorBox);

  const okBox = document.createElement('div');
  okBox.className = 'ok-box';
  okBox.style.display = 'none';
  card.appendChild(okBox);

  const save = document.createElement('button');
  save.className = 'btn btn-primary btn-block';
  save.style.marginTop = '12px';
  save.textContent = 'Speichern';
  save.addEventListener('click', () => {
    errorBox.style.display = 'none';
    okBox.style.display = 'none';
    try {
      const count = saveCustomFromJson(area.value);
      okBox.textContent = `✅ ${count} eigene ${count === 1 ? 'Frage' : 'Fragen'} gespeichert. Du findest sie im Lernmodus unter «Eigene Fragen» und in den Karteikarten.`;
      okBox.style.display = 'block';
      info.textContent = `Aktuell gespeichert: ${count} eigene Fragen.`;
    } catch (e) {
      errorBox.textContent = `⚠️ ${e.message}`;
      errorBox.style.display = 'block';
    }
  });
  card.appendChild(save);

  const del = document.createElement('button');
  del.className = 'btn btn-danger btn-block';
  del.style.marginTop = '10px';
  del.textContent = 'Alle eigenen Fragen löschen';
  del.addEventListener('click', () => {
    if (confirm('Alle eigenen Fragen von diesem Gerät löschen?')) {
      clearCustom();
      area.value = EXAMPLE_JSON;
      okBox.textContent = 'Eigene Fragen gelöscht.';
      okBox.style.display = 'block';
      errorBox.style.display = 'none';
      info.textContent = 'Aktuell gespeichert: 0 eigene Fragen.';
    }
  });
  card.appendChild(del);

  container.appendChild(card);

  const back = document.createElement('a');
  back.className = 'btn btn-secondary btn-block';
  back.style.textDecoration = 'none';
  back.href = '#/fortschritt';
  back.textContent = 'Zurück zu den Erfolgen';
  container.appendChild(back);
}
