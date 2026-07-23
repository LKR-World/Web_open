// Badge-Definitionen. check(state, questions) wird nach jeder Antwort/Session ausgewertet.

function topicBadge(id, topicId, name, icon) {
  return {
    id,
    name,
    icon,
    description: `90 % der Fragen zu diesem Thema mindestens einmal richtig beantwortet.`,
    check(state, questions) {
      const topicQuestions = questions.filter((q) => q.topic === topicId);
      if (!topicQuestions.length) return false;
      const solved = topicQuestions.filter((q) => {
        const s = state.stats.perQuestion[q.id];
        return s && s.correct > 0;
      }).length;
      return solved / topicQuestions.length >= 0.9;
    },
  };
}

export const BADGES = [
  {
    id: 'leinen-los',
    name: 'Leinen los!',
    icon: '🪢',
    description: 'Erste Frage beantwortet.',
    check(state) {
      return state.stats.totalCorrect + state.stats.totalWrong >= 1;
    },
  },
  {
    id: 'landratte-ade',
    name: 'Landratte ade',
    icon: '🐀',
    description: '25 Fragen richtig beantwortet.',
    check(state) {
      return state.stats.totalCorrect >= 25;
    },
  },
  {
    id: 'seefest',
    name: 'Seefest',
    icon: '🌊',
    description: '100 Fragen richtig beantwortet.',
    check(state) {
      return state.stats.totalCorrect >= 100;
    },
  },
  topicBadge('profi-vorfahrt', 'vorfahrt', 'Vorfahrtsprofi', '⛵'),
  topicBadge('profi-zeichen', 'zeichen', 'Zeichenkenner', '🛟'),
  topicBadge('profi-lichter', 'lichter', 'Lichterkundig', '🔦'),
  topicBadge('profi-manoever', 'manoever', 'Manöver-Ass', '🧭'),
  topicBadge('profi-sicherheit', 'sicherheit', 'Sicherheitschef', '🦺'),
  topicBadge('profi-notfall', 'notfall', 'Retter in der Not', '🚨'),
  topicBadge('profi-allgemein', 'allgemein', 'Paragraphenfest', '📋'),
  {
    id: 'perfekte-runde',
    name: 'Perfekte Runde',
    icon: '💯',
    description: 'Eine Quiz-Runde ohne einen einzigen Fehler abgeschlossen.',
    check(state) {
      return state.stats.perfectRounds >= 1;
    },
  },
  {
    id: 'pruefungsreif',
    name: 'Prüfungsreif',
    icon: '🎓',
    description: 'Prüfungssimulation bestanden (mind. 80 %).',
    check(state) {
      return state.stats.examsPassed >= 1;
    },
  },
  {
    id: 'dranbleiber',
    name: 'Dranbleiber',
    icon: '🔥',
    description: '3 Tage am Stück gelernt.',
    check(state) {
      return state.streak.best >= 3;
    },
  },
  {
    id: 'wochensegler',
    name: 'Wochensegler',
    icon: '📅',
    description: '7 Tage am Stück gelernt.',
    check(state) {
      return state.streak.best >= 7;
    },
  },
  {
    id: 'eiserner-kapitaen',
    name: 'Eiserner Kapitän',
    icon: '🏆',
    description: '30 Tage am Stück gelernt.',
    check(state) {
      return state.streak.best >= 30;
    },
  },
  {
    id: 'kistenmeister',
    name: 'Kistenmeister',
    icon: '📦',
    description: '20 Karten bis in Box 5 gebracht.',
    check(state) {
      return Object.values(state.srs).filter((e) => e.box === 5).length >= 20;
    },
  },
];
