// Parametrischer SVG-Baukasten für die drei Szenariotypen:
//  - vorfahrt: Draufsicht mit Booten (optional interaktiv: "Tippe auf das Boot …")
//  - zeichen:  Tafelzeichen, Bojen und Sturmwarnleuchte
//  - lichter:  Nachtdarstellung mit Positionslichtern
//
// renderScenario(scenario, opts) -> SVGElement
//   opts.onPick(label, isCorrect) wird bei interaktiven Vorfahrt-Szenarien aufgerufen.

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.appendChild(c);
  return node;
}

function makeSvg(viewBox, bg) {
  const svg = el('svg', {
    viewBox,
    role: 'img',
    preserveAspectRatio: 'xMidYMid meet',
  });
  if (bg) svg.appendChild(bg);
  return svg;
}

export function renderScenario(scenario, opts = {}) {
  switch (scenario.type) {
    case 'vorfahrt': return renderVorfahrt(scenario, opts);
    case 'zeichen': return renderZeichen(scenario);
    case 'lichter': return renderLichter(scenario);
    default: return el('svg', { viewBox: '0 0 100 60' });
  }
}

/* ================= Vorfahrt (Draufsicht) ================= */

const BOAT_COLORS = {
  motor: '#f5f2ea',
  segel: '#f5f2ea',
  kursschiff: '#e8e8e8',
  ruder: '#e8d9b8',
};

// Bootskörper in lokalen Koordinaten, Bug zeigt nach oben (negatives y)
function boatShape(kind) {
  const g = el('g');
  const fill = BOAT_COLORS[kind] || '#f5f2ea';

  if (kind === 'kursschiff') {
    // Grosses, längliches Kursschiff
    g.appendChild(el('path', {
      d: 'M0,-13 C4,-10 5,-4 5,4 L5,10 C5,11.5 3,12.5 0,12.5 C-3,12.5 -5,11.5 -5,10 L-5,4 C-5,-4 -4,-10 0,-13 Z',
      fill, stroke: '#404a52', 'stroke-width': '1',
    }));
    g.appendChild(el('rect', { x: -3, y: -4, width: 6, height: 10, rx: 2, fill: '#cfd8de', stroke: '#404a52', 'stroke-width': '0.7' }));
  } else {
    g.appendChild(el('path', {
      d: 'M0,-10 C3,-7 4,-3 4,2 L4,8 C4,9.5 2.5,10 0,10 C-2.5,10 -4,9.5 -4,8 L-4,2 C-4,-3 -3,-7 0,-10 Z',
      fill, stroke: '#404a52', 'stroke-width': '1',
    }));
  }

  if (kind === 'segel') {
    // Segeldreieck von oben (Grossbaum leicht seitlich)
    g.appendChild(el('path', {
      d: 'M0,-6 L6,5 L0,3 Z',
      fill: '#ffffff', stroke: '#404a52', 'stroke-width': '0.8', opacity: '0.95',
    }));
    g.appendChild(el('line', { x1: 0, y1: -6, x2: 0, y2: 6, stroke: '#404a52', 'stroke-width': '0.8' }));
  } else if (kind === 'motor') {
    // Heckwelle
    g.appendChild(el('path', {
      d: 'M-3,11 Q0,13.5 3,11',
      fill: 'none', stroke: '#ffffff', 'stroke-width': '1.4', opacity: '0.8', 'stroke-linecap': 'round',
    }));
    g.appendChild(el('path', {
      d: 'M-4.5,14 Q0,17 4.5,14',
      fill: 'none', stroke: '#ffffff', 'stroke-width': '1.2', opacity: '0.5', 'stroke-linecap': 'round',
    }));
  } else if (kind === 'ruder') {
    // Paddel links und rechts
    g.appendChild(el('line', { x1: -4, y1: 0, x2: -8, y2: 3, stroke: '#7a5c30', 'stroke-width': '1.3', 'stroke-linecap': 'round' }));
    g.appendChild(el('line', { x1: 4, y1: 0, x2: 8, y2: 3, stroke: '#7a5c30', 'stroke-width': '1.3', 'stroke-linecap': 'round' }));
  }
  return g;
}

function waterBackground(width = 100, height = 100) {
  const g = el('g');
  g.appendChild(el('rect', { x: 0, y: 0, width, height, fill: '#7db3d5' }));
  // Dezente Wellenlinien
  for (let y = 10; y < height; y += 16) {
    const off = (y / 16) % 2 === 0 ? 0 : 8;
    g.appendChild(el('path', {
      d: `M${-6 + off},${y} q5,-2.5 10,0 t10,0 t10,0 t10,0 t10,0 t10,0 t10,0 t10,0 t10,0 t10,0`,
      fill: 'none', stroke: '#ffffff', 'stroke-width': '0.7', opacity: '0.35',
    }));
  }
  return g;
}

function renderVorfahrt(scenario, opts) {
  const p = scenario.params || {};
  const svg = makeSvg('0 0 100 100', waterBackground());

  for (const boat of p.boats || []) {
    const g = el('g', {
      transform: `translate(${boat.x},${boat.y})`,
    });

    // Kurs-Pfeil (gestrichelt in Fahrtrichtung)
    const arrow = el('g', { transform: `rotate(${boat.heading})` });
    arrow.appendChild(el('line', {
      x1: 0, y1: -13, x2: 0, y2: -26,
      stroke: '#0b3d5c', 'stroke-width': '1.2', 'stroke-dasharray': '3 2', opacity: '0.85',
    }));
    arrow.appendChild(el('path', {
      d: 'M0,-30 L-3,-24.5 L3,-24.5 Z', fill: '#0b3d5c', opacity: '0.85',
    }));
    g.appendChild(arrow);

    const body = el('g', { transform: `rotate(${boat.heading})` });
    body.appendChild(boatShape(boat.kind));
    g.appendChild(body);

    // Label-Kreis (nicht mitrotiert, immer lesbar)
    if (boat.label) {
      const labelG = el('g', { transform: 'translate(11,11)' });
      labelG.appendChild(el('circle', { r: 6, fill: '#0b3d5c' }));
      const text = el('text', {
        x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: '#ffffff', 'font-size': '7', 'font-weight': '800',
        'font-family': 'inherit',
      });
      text.textContent = boat.label;
      labelG.appendChild(text);
      g.appendChild(labelG);
    }

    if (scenario.interactive && opts.onPick) {
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.style.cursor = 'pointer';
      // Unsichtbare grosse Trefferfläche für Finger
      g.insertBefore(el('circle', { r: 20, fill: 'transparent' }), g.firstChild);
      const pick = () => {
        if (svg.dataset.answered) return;
        svg.dataset.answered = '1';
        const isCorrect = boat.label === scenario.answerTarget;
        markBoats(svg, p.boats, scenario.answerTarget, boat.label);
        opts.onPick(boat.label, isCorrect);
      };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      g.dataset.boatLabel = boat.label;
    }
    svg.appendChild(g);
  }
  return svg;
}

// Nach der Antwort: korrektes Boot grün, falsch angetipptes rot markieren
function markBoats(svg, boats, correctLabel, pickedLabel) {
  for (const g of svg.querySelectorAll('[data-boat-label]')) {
    const label = g.dataset.boatLabel;
    if (label === correctLabel || label === pickedLabel) {
      const color = label === correctLabel ? '#2e8b57' : '#c0392b';
      const boat = boats.find((b) => b.label === label);
      g.insertBefore(el('circle', {
        r: 17, fill: 'none', stroke: color, 'stroke-width': '2.2', opacity: '0.95',
      }), g.firstChild);
      if (boat) void boat; // Position steckt bereits im transform des <g>
    }
    g.style.cursor = 'default';
  }
}

/* ================= Schifffahrtszeichen ================= */

// Symbole innerhalb der Tafel (lokal ca. -20..20)
function signSymbol(symbol) {
  const g = el('g');
  const stroke = '#1d2b35';
  switch (symbol) {
    case 'anker':
      g.appendChild(el('path', {
        d: 'M0,-13 L0,10 M-9,2 C-9,9 -4,12 0,12 C4,12 9,9 9,2 M-5,-7 L5,-7',
        fill: 'none', stroke, 'stroke-width': '2.6', 'stroke-linecap': 'round',
      }));
      g.appendChild(el('circle', { cx: 0, cy: -15, r: 2.6, fill: 'none', stroke, 'stroke-width': '2' }));
      break;
    case 'motorboot':
      g.appendChild(el('path', {
        d: 'M-14,4 L14,4 L9,10 L-11,10 Z', fill: stroke,
      }));
      g.appendChild(el('path', { d: 'M-4,4 L-4,-3 L6,-3 L8,4 Z', fill: stroke }));
      g.appendChild(el('path', { d: 'M9,7 Q13,7 15,4', fill: 'none', stroke, 'stroke-width': '1.6' }));
      break;
    case 'wasserski':
      g.appendChild(el('circle', { cx: 3, cy: -11, r: 3, fill: stroke }));
      g.appendChild(el('path', {
        d: 'M2,-8 L-2,0 L4,4 M-2,0 L-8,-4 M4,4 L2,10',
        fill: 'none', stroke, 'stroke-width': '2.4', 'stroke-linecap': 'round',
      }));
      g.appendChild(el('line', { x1: -12, y1: 13, x2: 12, y2: 13, stroke, 'stroke-width': '2.2', 'stroke-linecap': 'round' }));
      break;
    case 'segelboot':
      g.appendChild(el('path', { d: 'M1,-13 L1,6 L-10,6 Z', fill: stroke }));
      g.appendChild(el('path', { d: 'M3,-8 L3,6 L11,6 Z', fill: stroke }));
      g.appendChild(el('path', { d: 'M-13,9 L13,9 L9,14 L-9,14 Z', fill: stroke }));
      break;
    case 'baden':
      g.appendChild(el('circle', { cx: 0, cy: -9, r: 3.2, fill: stroke }));
      g.appendChild(el('path', {
        d: 'M-9,-1 Q0,-6 9,-1', fill: 'none', stroke, 'stroke-width': '2.6', 'stroke-linecap': 'round',
      }));
      g.appendChild(el('path', {
        d: 'M-13,6 q3.25,-2.5 6.5,0 t6.5,0 t6.5,0 t6.5,0 M-13,12 q3.25,-2.5 6.5,0 t6.5,0 t6.5,0 t6.5,0',
        fill: 'none', stroke, 'stroke-width': '1.8',
      }));
      break;
    case 'windsurf':
      g.appendChild(el('circle', { cx: -4, cy: -12, r: 2.8, fill: stroke }));
      g.appendChild(el('path', {
        d: 'M-4,-9 L-4,-1 L-1,4 M-4,-5 L2,-8',
        fill: 'none', stroke, 'stroke-width': '2.2', 'stroke-linecap': 'round',
      }));
      g.appendChild(el('path', { d: 'M4,-14 C10,-8 10,0 6,6 L4,-14 Z', fill: stroke }));
      g.appendChild(el('line', { x1: 4, y1: -14, x2: 3, y2: 8, stroke, 'stroke-width': '1.6' }));
      g.appendChild(el('path', { d: 'M-11,9 L11,9 L8,12.5 L-8,12.5 Z', fill: stroke }));
      break;
    case 'pfeil':
      g.appendChild(el('path', {
        d: 'M-12,0 L8,0 M8,0 L1,-6 M8,0 L1,6',
        fill: 'none', stroke, 'stroke-width': '3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }));
      break;
    case 'geschwindigkeit-10':
      {
        const text = el('text', {
          x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': '20', 'font-weight': '800', fill: stroke, 'font-family': 'inherit',
        });
        text.textContent = '10';
        g.appendChild(text);
      }
      break;
    case 'p':
      {
        const text = el('text', {
          x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': '26', 'font-weight': '800', fill: stroke, 'font-family': 'inherit',
        });
        text.textContent = 'P';
        g.appendChild(text);
      }
      break;
    default:
      break;
  }
  return g;
}

// Tafelzeichen:
//  border 'verbot' (weiss, roter Rand + Diagonale)
//  border 'beschraenkung' (weiss, roter Rand ohne Diagonale, z. B. Tempolimite)
//  border 'gebot'/'hinweis' (blau)
function signBoard(p) {
  const g = el('g');
  const size = 44;
  const half = size / 2;

  if (p.border === 'beschraenkung') {
    g.appendChild(el('rect', { x: -half, y: -half, width: size, height: size, rx: 3, fill: '#ffffff', stroke: '#c0392b', 'stroke-width': '5' }));
    g.appendChild(signSymbol(p.symbol));
  } else if (p.border === 'verbot') {
    g.appendChild(el('rect', { x: -half, y: -half, width: size, height: size, rx: 3, fill: '#ffffff', stroke: '#c0392b', 'stroke-width': '5' }));
    g.appendChild(signSymbol(p.symbol));
    g.appendChild(el('line', {
      x1: -half + 3, y1: half - 3, x2: half - 3, y2: -half + 3,
      stroke: '#c0392b', 'stroke-width': '4.5', 'stroke-linecap': 'round',
    }));
  } else if (p.border === 'gebot' || p.border === 'hinweis') {
    g.appendChild(el('rect', { x: -half, y: -half, width: size, height: size, rx: 3, fill: '#1c5fa8', stroke: '#123f70', 'stroke-width': '1.5' }));
    const sym = signSymbol(p.symbol);
    // Symbole auf blauem Grund weiss einfärben
    for (const node of sym.querySelectorAll('*')) {
      if (node.getAttribute('fill') && node.getAttribute('fill') !== 'none') node.setAttribute('fill', '#ffffff');
      if (node.getAttribute('stroke')) node.setAttribute('stroke', '#ffffff');
    }
    g.appendChild(sym);
  }
  return g;
}

// Bojen: kind 'gelb' | 'gelb-kreuz' | 'rot-weiss' | 'gelb-kugel'
function buoy(p) {
  const g = el('g');
  switch (p.kind) {
    case 'gelb': // gelbe Spierentonne (Sperr-/Zonenbegrenzung)
      g.appendChild(el('path', {
        d: 'M-3,-24 L3,-24 L5,14 L-5,14 Z', fill: '#f2c322', stroke: '#8a6d0d', 'stroke-width': '1.2',
      }));
      break;
    case 'gelb-kugel':
      g.appendChild(el('circle', { cx: 0, cy: 0, r: 10, fill: '#f2c322', stroke: '#8a6d0d', 'stroke-width': '1.2' }));
      break;
    case 'gelb-kreuz': // gelbe Boje mit gelbem Kreuz-Toppzeichen
      g.appendChild(el('path', {
        d: 'M-3,-14 L3,-14 L5,14 L-5,14 Z', fill: '#f2c322', stroke: '#8a6d0d', 'stroke-width': '1.2',
      }));
      g.appendChild(el('path', {
        d: 'M-6,-24 L6,-16 M6,-24 L-6,-16',
        stroke: '#f2c322', 'stroke-width': '3.4', 'stroke-linecap': 'round',
      }));
      break;
    case 'rot-weiss': // rot-weiss gestreifte Fahrwasser-Boje
      g.appendChild(el('path', {
        d: 'M-6,-18 L6,-18 L8,14 L-8,14 Z', fill: '#ffffff', stroke: '#7a2018', 'stroke-width': '1.2',
      }));
      g.appendChild(el('path', { d: 'M-6,-18 L6,-18 L6.7,-7 L-6.7,-7 Z', fill: '#d0392b' }));
      g.appendChild(el('path', { d: 'M-7.3,3 L7.3,3 L8,14 L-8,14 Z', fill: '#d0392b' }));
      break;
    default:
      break;
  }
  // Wasserlinie unter der Boje
  g.appendChild(el('path', {
    d: 'M-16,16 q4,-2.5 8,0 t8,0 t8,0 t8,0',
    fill: 'none', stroke: '#ffffff', 'stroke-width': '1.4', opacity: '0.8',
  }));
  return g;
}

// Sturmwarnleuchte: orange Blitzleuchte, mode 'vorsicht' (40/min) | 'sturm' (90/min)
function stormLight(p) {
  const g = el('g');
  g.appendChild(el('rect', { x: -3, y: -2, width: 6, height: 22, fill: '#5a6b77' }));
  g.appendChild(el('rect', { x: -8, y: -14, width: 16, height: 14, rx: 2, fill: '#3b4650', stroke: '#242c33', 'stroke-width': '1' }));
  g.appendChild(el('circle', { cx: 0, cy: -7, r: 4.6, fill: '#ff9d00' }));
  g.appendChild(el('circle', { cx: 0, cy: -7, r: 8, fill: '#ff9d00', opacity: '0.3' }));
  // Blitz-Strahlen
  for (const a of [-40, 0, 40]) {
    g.appendChild(el('line', {
      x1: 0, y1: -7, x2: 16 * Math.sin((a * Math.PI) / 180), y2: -7 - 14 * Math.cos((a * Math.PI) / 180),
      stroke: '#ffb84d', 'stroke-width': '2', 'stroke-linecap': 'round', opacity: '0.8',
      transform: 'translate(0,-4)',
    }));
  }
  const label = el('text', {
    x: 0, y: 30, 'text-anchor': 'middle', 'font-size': '7.5', 'font-weight': '700',
    fill: '#1d2b35', 'font-family': 'inherit',
  });
  label.textContent = p.mode === 'sturm' ? '90 ×/min' : '40 ×/min';
  g.appendChild(label);
  return g;
}

function renderZeichen(scenario) {
  const p = scenario.params || {};
  const svg = makeSvg('0 0 100 70');
  // Heller Himmel/Wasser-Hintergrund
  svg.appendChild(el('rect', { x: 0, y: 0, width: 100, height: 70, fill: '#dcecf5' }));
  svg.appendChild(el('rect', { x: 0, y: 52, width: 100, height: 18, fill: '#7db3d5' }));
  svg.appendChild(el('path', {
    d: 'M0,52 q6,-2 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0',
    fill: 'none', stroke: '#ffffff', 'stroke-width': '0.8', opacity: '0.5',
  }));

  const items = p.items || [p];
  const spacing = 100 / (items.length + 1);
  items.forEach((item, i) => {
    const x = spacing * (i + 1);
    let node;
    if (item.kind === 'raute') {
      // Gelbe Raute: empfohlene Brückendurchfahrt (an einem Brückenpfeiler-Balken)
      svg.appendChild(el('rect', { x: 6, y: 8, width: 88, height: 9, fill: '#8a8f94' }));
      svg.appendChild(el('rect', { x: 14, y: 17, width: 8, height: 39, fill: '#8a8f94' }));
      svg.appendChild(el('rect', { x: 78, y: 17, width: 8, height: 39, fill: '#8a8f94' }));
      node = el('g', { transform: `translate(${x},33)` });
      node.appendChild(el('path', {
        d: 'M0,-13 L10,0 L0,13 L-10,0 Z',
        fill: '#f2c322', stroke: '#8a6d0d', 'stroke-width': '1.4',
      }));
    } else if (item.kind === 'tafel') {
      node = el('g', { transform: `translate(${x},30) scale(0.62)` });
      node.appendChild(signBoard(item));
      // Pfahl unter der Tafel
      svg.appendChild(el('rect', { x: x - 1.4, y: 44, width: 2.8, height: 12, fill: '#7a5c30' }));
    } else if (item.kind === 'sturmwarnung') {
      node = el('g', { transform: `translate(${x},32) scale(1.05)` });
      node.appendChild(stormLight(item));
    } else {
      node = el('g', { transform: `translate(${x},36) scale(0.95)` });
      node.appendChild(buoy(item));
    }
    svg.appendChild(node);
  });
  return svg;
}

/* ================= Lichterführung (Nacht) ================= */

const LIGHT_COLORS = {
  weiss: '#fff8d6',
  rot: '#ff4b3a',
  gruen: '#3ddc6a',
  gelb: '#ffd23a',
};

function renderLichter(scenario) {
  const p = scenario.params || {};
  const svg = makeSvg('0 0 100 62');
  svg.appendChild(el('rect', { x: 0, y: 0, width: 100, height: 62, fill: '#0a1628' }));
  // Wasser-Schimmer
  svg.appendChild(el('rect', { x: 0, y: 46, width: 100, height: 16, fill: '#0e2036' }));
  svg.appendChild(el('path', {
    d: 'M0,46 q6,-1.5 12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0 t12,0',
    fill: 'none', stroke: '#27455f', 'stroke-width': '0.8',
  }));
  // Sterne
  for (const [sx, sy] of [[12, 8], [30, 5], [55, 10], [78, 6], [90, 14], [45, 4], [68, 13], [20, 15]]) {
    svg.appendChild(el('circle', { cx: sx, cy: sy, r: 0.6, fill: '#c8d8e8', opacity: '0.7' }));
  }

  // Schwache Bootssilhouette
  if (p.silhouette !== 'keine') {
    const sil = el('g', { transform: 'translate(50,40)' });
    if (p.silhouette === 'seite-bb' || p.silhouette === 'seite-stb') {
      // Boot von der Seite
      const flip = p.silhouette === 'seite-stb' ? -1 : 1;
      sil.appendChild(el('path', {
        d: `M${-26 * flip},4 L${26 * flip},4 L${18 * flip},10 L${-20 * flip},10 Z`,
        fill: '#1a2d42',
      }));
      sil.appendChild(el('path', {
        d: `M${-8 * flip},4 L${-8 * flip},-4 L${8 * flip},-4 L${11 * flip},4 Z`,
        fill: '#1a2d42',
      }));
      sil.appendChild(el('line', { x1: 0, y1: -4, x2: 0, y2: -14, stroke: '#1a2d42', 'stroke-width': '1.6' }));
    } else {
      // Boot frontal (Bug) oder Heck – schmale Silhouette
      sil.appendChild(el('path', {
        d: 'M-9,10 C-9,2 -6,-4 0,-6 C6,-4 9,2 9,10 Z',
        fill: '#1a2d42',
      }));
      sil.appendChild(el('line', { x1: 0, y1: -6, x2: 0, y2: -16, stroke: '#1a2d42', 'stroke-width': '1.6' }));
    }
    svg.appendChild(sil);
  }

  // Lichter mit Glow (doppelte Kreise, kein Filter nötig)
  for (const light of p.lights || []) {
    const color = LIGHT_COLORS[light.color] || '#ffffff';
    svg.appendChild(el('circle', { cx: light.x, cy: light.y, r: 5.5, fill: color, opacity: '0.18' }));
    svg.appendChild(el('circle', { cx: light.x, cy: light.y, r: 3.2, fill: color, opacity: '0.4' }));
    svg.appendChild(el('circle', { cx: light.x, cy: light.y, r: 1.7, fill: color }));
  }
  return svg;
}
