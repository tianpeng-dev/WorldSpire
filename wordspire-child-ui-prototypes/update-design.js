#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/Users/peng/Documents/trae_projects/WordSpire/wordspire-child-ui-prototypes';
const DESIGN_PATH = path.join(PROJECT_DIR, 'wordspire-child-ui-prototypes.design');

function styleSuffix(slug) {
  return '';
}

function interactionsFor(pageKey, suffix, htmlToId) {
  const targetId = (html) => htmlToId[html] || html;
  const map = {
    'voice-guide': [
      { domId: 'wg-start', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' }
    ],
    'home': [
      { domId: 'home-continue', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'home-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'map': [
      { domId: 'map-stage-2', trigger: 'click', targetPageId: targetId(`quiz-question${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'quiz-question': [
      { domId: 'opt-0', trigger: 'click', targetPageId: targetId(`quiz-correct${suffix}.html`), type: 'navigate' },
      { domId: 'opt-1', trigger: 'click', targetPageId: targetId(`quiz-wrong${suffix}.html`), type: 'navigate' },
      { domId: 'opt-2', trigger: 'click', targetPageId: targetId(`quiz-wrong${suffix}.html`), type: 'navigate' },
      { domId: 'opt-3', trigger: 'click', targetPageId: targetId(`quiz-wrong${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'quiz-correct': [
      { domId: 'correct-next', trigger: 'click', targetPageId: targetId(`quiz-question${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'quiz-wrong': [
      { domId: 'wrong-retry', trigger: 'click', targetPageId: targetId(`quiz-question${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'quiz-complete': [
      { domId: 'complete-next', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'complete-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'battle-lobby': [
      { domId: 'lobby-ai-start', trigger: 'click', targetPageId: targetId(`battle-play${suffix}.html`), type: 'navigate' },
      { domId: 'lobby-parent-accept', trigger: 'click', targetPageId: targetId(`battle-play${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'battle-play': [
      { domId: 'b-opt-0', trigger: 'click', targetPageId: targetId(`battle-result${suffix}.html`), type: 'navigate' },
      { domId: 'b-opt-1', trigger: 'click', targetPageId: targetId(`battle-result${suffix}.html`), type: 'navigate' },
      { domId: 'b-opt-2', trigger: 'click', targetPageId: targetId(`battle-result${suffix}.html`), type: 'navigate' },
      { domId: 'b-opt-3', trigger: 'click', targetPageId: targetId(`battle-result${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'battle-result': [
      { domId: 'result-again', trigger: 'click', targetPageId: targetId(`battle-play${suffix}.html`), type: 'navigate' },
      { domId: 'result-back', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'collection-characters': [
      { domId: 'chars-to-badges', trigger: 'click', targetPageId: targetId(`collection-badges${suffix}.html`), type: 'navigate' },
      { domId: 'chars-grid', trigger: 'click', targetPageId: targetId(`collection-unlock${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'collection-badges': [
      { domId: 'badges-to-chars', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ],
    'collection-unlock': [
      { domId: 'unlock-confirm', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' },
      { domId: 'unlock-cancel', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' },
      { domId: 'nav-home', trigger: 'click', targetPageId: targetId(`home${suffix}.html`), type: 'navigate' },
      { domId: 'nav-map', trigger: 'click', targetPageId: targetId(`map${suffix}.html`), type: 'navigate' },
      { domId: 'nav-battle', trigger: 'click', targetPageId: targetId(`battle-lobby${suffix}.html`), type: 'navigate' },
      { domId: 'nav-collection', trigger: 'click', targetPageId: targetId(`collection-characters${suffix}.html`), type: 'navigate' }
    ]
  };
  return map[pageKey] || [];
}

const design = JSON.parse(fs.readFileSync(DESIGN_PATH, 'utf-8'));

const htmlToId = {};
for (const node of design.data) {
  if (node.type === 'page' && node.devMetadata && node.devMetadata.htmlSrc) {
    htmlToId[node.devMetadata.htmlSrc] = node.id;
    htmlToId[path.basename(node.devMetadata.htmlSrc)] = node.id;
  }
}

for (const node of design.data) {
  if (node.type !== 'page') continue;
  const htmlSrc = node.devMetadata.htmlSrc;
  const baseName = path.basename(htmlSrc, '.html');
  let pageKey = baseName;
  let suffix = '';

  if (baseName.endsWith('-2')) {
    suffix = '-2';
    pageKey = baseName.slice(0, -2);
  } else if (baseName.endsWith('-1')) {
    suffix = '-1';
    pageKey = baseName.slice(0, -2);
  }

  node.devMetadata.interactions = interactionsFor(pageKey, suffix, htmlToId);
}

fs.writeFileSync(DESIGN_PATH, JSON.stringify(design, null, 2), 'utf-8');
console.log(`Updated interactions in ${DESIGN_PATH}`);
