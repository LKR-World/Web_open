# ⚓ Bootsprüfung A – Interaktive Lern-App

Eine spielerische Lern-App zur Vorbereitung auf die **Theorieprüfung für den
Schweizer Bootsführerschein, Kategorie A (Motorboot)**.

Alle Fragen sind original formuliert und decken die Themengebiete der
Binnenschifffahrtsverordnung (BSV) ab – sie ersetzen nicht den offiziellen
Prüfungskatalog, sondern trainieren das Verständnis der Regeln.

## Features

- **🧭 Lernmodus** – Quiz-Runden pro Thema oder quer durch den Stoff, mit
  sofortigem Feedback und Erklärung zu jeder Frage
- **🎓 Prüfungssimulation** – 30 zufällige Fragen, bestanden ab 80 %
- **🃏 Karteikarten (Leitner-System)** – falsch beantwortete Fragen kommen
  automatisch öfter, bis sie sitzen (5 Boxen: sofort / 1 / 3 / 7 / 14 Tage)
- **🖼️ Visuelle Szenarien** – Vorfahrtssituationen zum Antippen,
  Schifffahrtszeichen und Lichterführung als Grafiken
- **🏅 Gamification** – XP, nautische Ränge (Moses → Kapitän), Abzeichen und
  Tages-Streak

## Themen (102 Fragen)

Vorfahrtsregeln · Schifffahrtszeichen · Lichterführung · Manöver & Fahrregeln ·
Sicherheit & Umwelt · Verhalten bei Notfällen · Allgemeine Vorschriften

## Lokal starten

Die App ist eine statische Single-Page-App ohne Build-Step (Vanilla JS,
ES-Module). Wegen der Module braucht es einen kleinen Webserver:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Deployment (GitHub Pages)

Repo-Root ist direkt der Web-Root – einfach GitHub Pages für den Branch
aktivieren (Settings → Pages → Deploy from branch, Ordner `/`). Es werden nur
relative Pfade verwendet, die App läuft also auch unter
`https://<user>.github.io/Web_open/` ohne Anpassung.

## Technik

- Kein Framework, keine externen Abhängigkeiten, kein CDN
- Fortschritt (XP, Streak, Karteikarten) liegt in `localStorage` auf dem Gerät
- Fragenbank: `js/data/questions.js` · SVG-Baukasten: `js/svg/scenarios.js`

## Hinweis

Ohne Gewähr für Vollständigkeit und Richtigkeit – massgebend sind die BSV und
der offizielle Prüfungsstoff deines Kantons.
