#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/Users/peng/Documents/trae_projects/WordSpire/wordspire-child-ui-prototypes';
const PAGES_DIR = path.join(PROJECT_DIR, 'pages');

const styles = [
  { slug: 'storybook', idx: 0, suffix: '', hero: 'hero-wordspire-storybook.jpg' }
];

const pageDefs = [
  { key: 'voice-guide', activeNav: 'none', title: '语音引导页' },
  { key: 'home', activeNav: 'home', title: '塔 · 首页' },
  { key: 'map', activeNav: 'map', title: '闯关地图' },
  { key: 'quiz-question', activeNav: 'map', title: '闯关游戏 · 答题中' },
  { key: 'quiz-correct', activeNav: 'map', title: '闯关游戏 · 答对反馈' },
  { key: 'quiz-wrong', activeNav: 'map', title: '闯关游戏 · 答错鼓励' },
  { key: 'quiz-complete', activeNav: 'map', title: '闯关游戏 · 关卡结算' },
  { key: 'battle-lobby', activeNav: 'battle', title: '对战大厅' },
  { key: 'battle-play', activeNav: 'battle', title: '对战进行' },
  { key: 'battle-result', activeNav: 'battle', title: '对战结算' },
  { key: 'collection-characters', activeNav: 'collection', title: '收藏图鉴 · 角色' },
  { key: 'collection-badges', activeNav: 'collection', title: '收藏图鉴 · 徽章' },
  { key: 'collection-unlock', activeNav: 'collection', title: '收藏图鉴 · 解锁弹窗' }
];

if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

function navItems(activeKey, styleSlug) {
  const s = styleSuffix(styleSlug);
  const items = [
    { key: 'home', label: '首页', path: `home${s}.html` },
    { key: 'map', label: '闯关', path: `map${s}.html` },
    { key: 'battle', label: '对战', path: `battle-lobby${s}.html` },
    { key: 'collection', label: '收藏', path: `collection-characters${s}.html` }
  ];
  return items.map(item => `
    <button class="ws-nav-item" data-nav-key="${item.key}" data-dom-id="nav-${item.key}" ${item.key === activeKey ? 'data-active="true"' : ''} onclick="location.href='${item.path}'">
      <svg viewBox="0 0 24 24">${navIcon(item.key)}</svg>
      <span>${item.label}</span>
    </button>`).join('');
}

function navIcon(key) {
  const icons = {
    home: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    map: '<path d="M20.5 3l-6 1.5-5.5-1.5-6 1.5v15l6-1.5 5.5 1.5 6-1.5V3z"/>',
    battle: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    collection: '<path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>'
  };
  return icons[key];
}

function styleSuffix(slug) {
  return '';
}

function styleAttr(slug) {
  return `data-style="${slug}"`;
}

const themeVars = {
  storybook: `:root {
  --ws-background: #FFF8E7;
  --ws-foreground: #3E2723;
  --ws-card: #FFFFFF;
  --ws-card-foreground: #3E2723;
  --ws-popover: #FFFFFF;
  --ws-popover-foreground: #3E2723;
  --ws-primary: #E85D4C;
  --ws-primary-foreground: #FFFFFF;
  --ws-muted: #F5E6D3;
  --ws-muted-foreground: #6D4C41;
  --ws-border: rgba(62, 39, 35, 0.12);
  --ws-input: #FFFFFF;
  --ws-ring: #E85D4C;
  --ws-primary-50: #FDF2F0;
  --ws-primary-100: #FADBD7;
  --ws-primary-200: #F5B7AE;
  --ws-primary-300: #EF9285;
  --ws-primary-400: #E85D4C;
  --ws-primary-500: #D64A3A;
  --ws-primary-600: #B53A2C;
  --ws-neutral-50: #FFFDF8;
  --ws-neutral-100: #FFF8E7;
  --ws-neutral-200: #F5E6D3;
  --ws-neutral-300: #E6D2BA;
  --ws-neutral-400: #A1887F;
  --ws-neutral-500: #6D4C41;
  --ws-neutral-600: #3E2723;
  --ws-state-success: #10B981;
  --ws-state-success-soft: rgba(16, 185, 129, 0.12);
  --ws-state-warning: #F59E0B;
  --ws-state-warning-soft: rgba(245, 158, 11, 0.12);
  --ws-state-error: #EF4444;
  --ws-state-error-soft: rgba(239, 68, 68, 0.12);
  --ws-state-info: #3B82F6;
  --ws-state-info-soft: rgba(59, 130, 246, 0.12);
  --ws-gold: #F4C542;
  --ws-sage: #7DB9A8;
  --ws-radius-small: 8px;
  --ws-radius-medium: 12px;
  --ws-radius-large: 16px;
  --ws-font-display: 'ZCOOL QingKe HuangYou', 'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --ws-font-body: 'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --ws-font-mono: 'JetBrains Mono', ui-monospace, monospace;
}`
};

function shellWrapper({ styleSlug, activeNav, content }) {
  return `<!DOCTYPE html>
<html lang="zh-CN" class="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${content.title} · 词灵塔</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=ZCOOL+QingKe+HuangYou&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet">
  <style id="theme-vars">
${themeVars[styleSlug]}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.1/dist/index.global.js"></script>
  <script src="https://unpkg.com/lucide@1.8.0/dist/umd/lucide.min.js"></script>
  <style type="text/tailwindcss">
  @theme inline {
    --color-background: var(--ws-background);
    --color-foreground: var(--ws-foreground);
    --color-card: var(--ws-card);
    --color-card-foreground: var(--ws-card-foreground);
    --color-popover: var(--ws-popover);
    --color-popover-foreground: var(--ws-popover-foreground);
    --color-primary: var(--ws-primary);
    --color-primary-foreground: var(--ws-primary-foreground);
    --color-muted: var(--ws-muted);
    --color-muted-foreground: var(--ws-muted-foreground);
    --color-border: var(--ws-border);
    --color-input: var(--ws-input);
    --color-ring: var(--ws-ring);
    --radius-sm: var(--ws-radius-small);
    --radius-md: var(--ws-radius-medium);
    --radius-lg: var(--ws-radius-large);
  }
  @layer base {
    body { background: var(--ws-background); color: var(--ws-foreground); }
    td, th { @apply break-words; word-break: break-all; word-break: auto-phrase; }
    th { @apply whitespace-nowrap; }
  }
  </style>
  <style id="semantic-token-fallback">
    .bg-background { background-color: var(--ws-background); }
    .text-background { color: var(--ws-background); }
    .border-background { border-color: var(--ws-background); }
    .ring-background { --tw-ring-color: var(--ws-background); }
    .bg-foreground { background-color: var(--ws-foreground); }
    .text-foreground { color: var(--ws-foreground); }
    .border-foreground { border-color: var(--ws-foreground); }
    .ring-foreground { --tw-ring-color: var(--ws-foreground); }
    .bg-card { background-color: var(--ws-card); }
    .text-card { color: var(--ws-card); }
    .border-card { border-color: var(--ws-card); }
    .ring-card { --tw-ring-color: var(--ws-card); }
    .bg-card-foreground { background-color: var(--ws-card-foreground); }
    .text-card-foreground { color: var(--ws-card-foreground); }
    .border-card-foreground { border-color: var(--ws-card-foreground); }
    .ring-card-foreground { --tw-ring-color: var(--ws-card-foreground); }
    .bg-popover { background-color: var(--ws-popover); }
    .text-popover { color: var(--ws-popover); }
    .border-popover { border-color: var(--ws-popover); }
    .ring-popover { --tw-ring-color: var(--ws-popover); }
    .bg-popover-foreground { background-color: var(--ws-popover-foreground); }
    .text-popover-foreground { color: var(--ws-popover-foreground); }
    .border-popover-foreground { border-color: var(--ws-popover-foreground); }
    .ring-popover-foreground { --tw-ring-color: var(--ws-popover-foreground); }
    .bg-primary { background-color: var(--ws-primary); }
    .text-primary { color: var(--ws-primary); }
    .border-primary { border-color: var(--ws-primary); }
    .ring-primary { --tw-ring-color: var(--ws-primary); }
    .bg-primary-foreground { background-color: var(--ws-primary-foreground); }
    .text-primary-foreground { color: var(--ws-primary-foreground); }
    .border-primary-foreground { border-color: var(--ws-primary-foreground); }
    .ring-primary-foreground { --tw-ring-color: var(--ws-primary-foreground); }
    .bg-muted { background-color: var(--ws-muted); }
    .text-muted { color: var(--ws-muted); }
    .border-muted { border-color: var(--ws-muted); }
    .ring-muted { --tw-ring-color: var(--ws-muted); }
    .bg-muted-foreground { background-color: var(--ws-muted-foreground); }
    .text-muted-foreground { color: var(--ws-muted-foreground); }
    .border-muted-foreground { border-color: var(--ws-muted-foreground); }
    .ring-muted-foreground { --tw-ring-color: var(--ws-muted-foreground); }
    .bg-border { background-color: var(--ws-border); }
    .text-border { color: var(--ws-border); }
    .border-border { border-color: var(--ws-border); }
    .ring-border { --tw-ring-color: var(--ws-border); }
    .bg-input { background-color: var(--ws-input); }
    .text-input { color: var(--ws-input); }
    .border-input { border-color: var(--ws-input); }
    .ring-input { --tw-ring-color: var(--ws-input); }
    .bg-ring { background-color: var(--ws-ring); }
    .text-ring { color: var(--ws-ring); }
    .border-ring { border-color: var(--ws-ring); }
    .ring-ring { --tw-ring-color: var(--ws-ring); }
  </style>
  <link rel="stylesheet" href="../colors_and_type-${styleSlug}.css">
  <link rel="stylesheet" href="../shared-components.css">
  <style>
    .ws-page-content { padding: 24px; padding-bottom: 130px; }
    .ws-shell { background: #FFF8E7; }
  </style>
</head>
<body class="min-h-screen font-sans antialiased">
<main class="ws-shell" ${styleAttr(styleSlug)}>
  <div class="ws-page-content">
${content.body}
  </div>
  ${activeNav !== 'none' ? `<nav class="ws-bottom-nav">
${navItems(activeNav, styleSlug)}
  </nav>` : ''}
</main>
<script>lucide.createIcons();</script>
</body>
</html>`;
}

function pageContent(key, style) {
  const h = style.hero;
  const imgRoot = '../assets';
  const s = styleSuffix(style.slug);
  const primaryBtnClass = 'ws-button';

  const templates = {
    'voice-guide': {
      title: '语音引导页',
      body: `
    <section class="voice-guide" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;text-align:center;gap:24px;">
      <div class="ws-hero" style="max-width:420px;border-radius:50%;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.12);">
        <img src="${imgRoot}/${h}" alt="词灵塔" style="width:100%;height:auto;display:block;">
      </div>
      <h1 class="ws-title" style="font-size:42px;margin-bottom:8px;" data-dom-id="wg-title">词灵塔</h1>
      <p class="ws-subtitle" style="font-size:24px;max-width:520px;" data-dom-id="wg-subtitle">没有大人陪，也能把英语玩会</p>
      <div class="ws-mascot-wrap" style="display:flex;align-items:center;gap:16px;margin:16px 0;" data-dom-id="wg-mascot">
        <img src="${imgRoot}/mascot-word-spirit.jpg" class="ws-mascot" alt="小塔" style="border-radius:50%;background:var(--ws-card);border:3px solid var(--ws-border);">
        <div class="ws-card" style="padding:16px 20px;max-width:280px;text-align:left;">
          <p style="font-size:20px;font-weight:700;margin:0;">“你好呀，我是小塔，我们一起去闯关吧！”</p>
        </div>
      </div>
      <button class="${primaryBtnClass}" style="min-width:260px;min-height:72px;font-size:28px;" data-dom-id="wg-start" onclick="location.href='home${s}.html'">开始冒险</button>
      <p style="font-size:18px;color:var(--ws-muted-foreground);margin-top:8px;">全程语音引导，小朋友自己就能玩</p>
    </section>`
    },
    'home': {
      title: '塔 · 首页',
      body: `
    <section class="home">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <p style="font-size:18px;color:var(--ws-muted-foreground);margin:0;">下午好，小芳</p>
          <h1 class="ws-title" style="margin-bottom:0;">词灵塔</h1>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="ws-badge" data-dom-id="home-streak"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>5 天连胜</div>
          <div class="ws-badge" data-dom-id="home-stars"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>128 星</div>
        </div>
      </header>
      <div class="ws-hero" data-dom-id="home-hero">
        <img src="${imgRoot}/${h}" alt="今日主题">
      </div>
      <div class="ws-card" style="margin-bottom:20px;" data-dom-id="home-task">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-size:24px;margin:0;">今日任务</h2>
          <span style="font-size:18px;color:var(--ws-muted-foreground);">3/5 完成</span>
        </div>
        <div class="ws-progress-bar"><div class="fill" style="width:60%;"></div></div>
        <div style="display:flex;gap:12px;margin-top:16px;">
          <button class="${primaryBtnClass}" style="flex:1;" data-dom-id="home-continue" onclick="location.href='map${s}.html'">继续闯关</button>
          <button class="ws-button ws-button-secondary" style="flex:1;" data-dom-id="home-battle" onclick="location.href='battle-lobby${s}.html'">去对战</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="ws-card" data-dom-id="home-weekly">
          <p style="font-size:18px;color:var(--ws-muted-foreground);margin:0;">本周新词</p>
          <p style="font-size:36px;font-weight:800;margin:8px 0 0;color:var(--ws-primary);">14</p>
        </div>
        <div class="ws-card" data-dom-id="home-accuracy">
          <p style="font-size:18px;color:var(--ws-muted-foreground);margin:0;">拼读准确率</p>
          <p style="font-size:36px;font-weight:800;margin:8px 0 0;color:var(--ws-primary);">74%</p>
        </div>
      </div>
    </section>`
    },
    'map': {
      title: '闯关地图',
      body: `
    <section class="map">
      <header style="margin-bottom:20px;">
        <h1 class="ws-title">水果王国</h1>
        <p class="ws-subtitle">闯过关卡，收集角色与星星</p>
      </header>
      <div class="map-track" style="display:flex;flex-direction:column;gap:20px;align-items:center;padding:16px 0;" data-dom-id="map-track">
        <div class="map-node completed" style="width:100%;max-width:520px;display:flex;align-items:center;gap:16px;" data-dom-id="map-stage-1">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--ws-state-success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;">1</div>
          <div class="ws-card" style="flex:1;padding:16px 20px;">
            <p style="font-size:22px;font-weight:700;margin:0;">苹果与香蕉</p>
            <p style="font-size:16px;color:var(--ws-muted-foreground);margin:4px 0 0;">已完成 · 获得 5 星</p>
          </div>
        </div>
        <div class="map-node in-progress" style="width:100%;max-width:520px;display:flex;align-items:center;gap:16px;" data-dom-id="map-stage-2">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--ws-primary);display:flex;align-items:center;justify-content:center;color:var(--ws-primary-foreground);font-size:28px;font-weight:800;">2</div>
          <div class="ws-card" style="flex:1;padding:16px 20px;border:2px solid var(--ws-primary);" onclick="location.href='quiz-question${s}.html'">
            <p style="font-size:22px;font-weight:700;margin:0;">葡萄与橙子</p>
            <p style="font-size:16px;color:var(--ws-muted-foreground);margin:4px 0 0;">进行中 · 点击继续</p>
          </div>
        </div>
        <div class="map-node locked" style="width:100%;max-width:520px;display:flex;align-items:center;gap:16px;" data-dom-id="map-stage-3">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--ws-muted);display:flex;align-items:center;justify-content:center;color:var(--ws-muted-foreground);font-size:28px;font-weight:800;">3</div>
          <div class="ws-card ws-locked" style="flex:1;padding:16px 20px;">
            <p style="font-size:22px;font-weight:700;margin:0;">西瓜与草莓</p>
            <p style="font-size:16px;color:var(--ws-muted-foreground);margin:4px 0 0;">未解锁 · 通关第 2 关开启</p>
          </div>
        </div>
        <div class="map-node locked" style="width:100%;max-width:520px;display:flex;align-items:center;gap:16px;" data-dom-id="map-stage-4">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--ws-muted);display:flex;align-items:center;justify-content:center;color:var(--ws-muted-foreground);font-size:28px;font-weight:800;">4</div>
          <div class="ws-card ws-locked" style="flex:1;padding:16px 20px;">
            <p style="font-size:22px;font-weight:700;margin:0;">水果大挑战</p>
            <p style="font-size:16px;color:var(--ws-muted-foreground);margin:4px 0 0;">未解锁 · 通关第 3 关开启</p>
          </div>
        </div>
      </div>
    </section>`
    },
    'quiz-question': {
      title: '闯关游戏 · 答题中',
      body: `
    <section class="quiz-question">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div class="ws-badge" data-dom-id="quiz-progress">第 2 / 5 题</div>
        <div class="ws-badge" data-dom-id="quiz-stars"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>2 星</div>
      </header>
      <div class="ws-card" style="text-align:center;margin-bottom:24px;" data-dom-id="quiz-prompt">
        <p style="font-size:22px;color:var(--ws-muted-foreground);margin-bottom:12px;">点击正确的图片</p>
        <h2 class="ws-title" style="font-size:42px;margin-bottom:16px;">Apple</h2>
        <button class="ws-button ws-button-secondary" style="min-height:48px;font-size:18px;padding:10px 24px;" data-dom-id="quiz-audio">再听一遍</button>
      </div>
      <div class="quiz-options" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" data-dom-id="quiz-options">
        <button class="ws-option-card" style="padding:24px;" data-dom-id="opt-0" onclick="location.href='quiz-correct${s}.html'">
          <div style="font-size:64px;margin-bottom:8px;">🍎</div>
          <div style="font-size:20px;">苹果</div>
        </button>
        <button class="ws-option-card" style="padding:24px;" data-dom-id="opt-1" onclick="location.href='quiz-wrong${s}.html'">
          <div style="font-size:64px;margin-bottom:8px;">🍌</div>
          <div style="font-size:20px;">香蕉</div>
        </button>
        <button class="ws-option-card" style="padding:24px;" data-dom-id="opt-2" onclick="location.href='quiz-wrong${s}.html'">
          <div style="font-size:64px;margin-bottom:8px;">🍇</div>
          <div style="font-size:20px;">葡萄</div>
        </button>
        <button class="ws-option-card" style="padding:24px;" data-dom-id="opt-3" onclick="location.href='quiz-wrong${s}.html'">
          <div style="font-size:64px;margin-bottom:8px;">🍊</div>
          <div style="font-size:20px;">橙子</div>
        </button>
      </div>
    </section>`
    },
    'quiz-correct': {
      title: '闯关游戏 · 答对反馈',
      body: `
    <section class="quiz-correct" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:24px;">
      <div data-dom-id="correct-stars" style="font-size:80px;animation:pop 0.4s ease;">⭐ +1</div>
      <h1 class="ws-title" style="font-size:48px;color:var(--ws-state-success);margin:0;">答对啦！</h1>
      <div class="ws-card" style="max-width:460px;" data-dom-id="correct-word">
        <p style="font-size:24px;font-weight:700;margin:0;">Apple</p>
        <p style="font-size:20px;color:var(--ws-muted-foreground);margin:8px 0 0;">苹果</p>
      </div>
      <button class="${primaryBtnClass}" style="min-width:260px;" data-dom-id="correct-next" onclick="location.href='quiz-question${s}.html'">下一题</button>
      <style>@keyframes pop{0%{transform:scale(0.5);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}</style>
    </section>`
    },
    'quiz-wrong': {
      title: '闯关游戏 · 答错鼓励',
      body: `
    <section class="quiz-wrong" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:24px;">
      <div data-dom-id="wrong-mascot" style="display:flex;align-items:center;gap:16px;">
        <img src="${imgRoot}/mascot-word-spirit.jpg" class="ws-mascot" alt="小塔" style="border-radius:50%;">
        <div class="ws-card" style="text-align:left;max-width:280px;">
          <p style="font-size:20px;font-weight:700;margin:0;">“没关系，再试一次！”</p>
        </div>
      </div>
      <h1 class="ws-title" style="font-size:36px;margin:0;">再想想看</h1>
      <div class="ws-card" style="max-width:460px;" data-dom-id="wrong-hint">
        <p style="font-size:20px;color:var(--ws-muted-foreground);margin:0;">正确答案是</p>
        <p style="font-size:32px;font-weight:800;margin:8px 0 0;color:var(--ws-state-success);">🍎 Apple</p>
      </div>
      <button class="${primaryBtnClass}" style="min-width:260px;" data-dom-id="wrong-retry" onclick="location.href='quiz-question${s}.html'">再试一次</button>
    </section>`
    },
    'quiz-complete': {
      title: '闯关游戏 · 关卡结算',
      body: `
    <section class="quiz-complete" style="text-align:center;">
      <h1 class="ws-title" style="font-size:42px;">关卡完成！</h1>
      <div class="ws-hero" style="max-width:320px;margin:0 auto 24px;border-radius:50%;" data-dom-id="complete-hero">
        <img src="${imgRoot}/mascot-word-spirit.jpg" alt="小塔" style="border-radius:50%;">
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;" data-dom-id="complete-stats">
        <div class="ws-card"><p style="font-size:16px;color:var(--ws-muted-foreground);margin:0;">得分</p><p style="font-size:32px;font-weight:800;margin:4px 0 0;color:var(--ws-primary);">80</p></div>
        <div class="ws-card"><p style="font-size:16px;color:var(--ws-muted-foreground);margin:0;">星星</p><p style="font-size:32px;font-weight:800;margin:4px 0 0;color:var(--ws-primary);">+5</p></div>
        <div class="ws-card"><p style="font-size:16px;color:var(--ws-muted-foreground);margin:0;">新词</p><p style="font-size:32px;font-weight:800;margin:4px 0 0;color:var(--ws-primary);">3</p></div>
      </div>
      <div class="ws-card" style="margin-bottom:24px;text-align:left;" data-dom-id="complete-reward">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:80px;height:80px;border-radius:var(--ws-radius-large);background:var(--ws-primary-100);display:flex;align-items:center;justify-content:center;font-size:48px;">🍎</div>
          <div>
            <p style="font-size:22px;font-weight:700;margin:0;">解锁角色：小苹果</p>
            <p style="font-size:18px;color:var(--ws-muted-foreground);margin:4px 0 0;">已加入你的收藏</p>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="${primaryBtnClass}" style="flex:1;" data-dom-id="complete-next" onclick="location.href='map${s}.html'">下一关</button>
        <button class="ws-button ws-button-secondary" style="flex:1;" data-dom-id="complete-battle" onclick="location.href='battle-lobby${s}.html'">去对战</button>
      </div>
    </section>`
    },
    'battle-lobby': {
      title: '对战大厅',
      body: `
    <section class="battle-lobby">
      <header style="margin-bottom:24px;">
        <h1 class="ws-title">对战大厅</h1>
        <p class="ws-subtitle">挑战小塔，或接受妈妈的亲子 PK</p>
      </header>
      <div class="ws-card" style="margin-bottom:20px;text-align:center;" data-dom-id="lobby-ai">
        <div style="font-size:72px;margin-bottom:12px;">🤖</div>
        <h2 style="font-size:28px;margin-bottom:8px;">挑战小塔</h2>
        <p style="font-size:20px;color:var(--ws-muted-foreground);margin-bottom:20px;">AI 对手会按你的水平出题，离线也能玩</p>
        <button class="${primaryBtnClass}" style="min-width:240px;" data-dom-id="lobby-ai-start" onclick="location.href='battle-play${s}.html'">开始对战</button>
      </div>
      <div class="ws-card" style="margin-bottom:20px;text-align:center;" data-dom-id="lobby-parent">
        <div style="font-size:72px;margin-bottom:12px;">👩</div>
        <h2 style="font-size:28px;margin-bottom:8px;">亲子 PK</h2>
        <p style="font-size:20px;color:var(--ws-muted-foreground);margin-bottom:20px;">妈妈发来挑战，接受就能开始</p>
        <div class="ws-card" style="background:var(--ws-primary-50);margin-bottom:20px;text-align:left;">
          <p style="font-size:18px;font-weight:700;margin:0;">妈妈的挑战：水果王国 · 第 2 关</p>
          <p style="font-size:16px;color:var(--ws-muted-foreground);margin:8px 0 0;">“周末一起比一比？”</p>
        </div>
        <button class="${primaryBtnClass}" style="min-width:240px;" data-dom-id="lobby-parent-accept" onclick="location.href='battle-play${s}.html'">接受挑战</button>
      </div>
    </section>`
    },
    'battle-play': {
      title: '对战进行',
      body: `
    <section class="battle-play">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="text-align:center;">
          <div style="font-size:48px;">🧒</div>
          <p style="font-size:18px;font-weight:700;margin:4px 0 0;">小芳</p>
          <p style="font-size:28px;font-weight:800;color:var(--ws-primary);margin:0;">2</p>
        </div>
        <div style="text-align:center;">
          <p style="font-size:24px;font-weight:800;margin:0;">VS</p>
          <p style="font-size:16px;color:var(--ws-muted-foreground);">第 1 回合</p>
        </div>
        <div style="text-align:center;">
          <div style="font-size:48px;">🤖</div>
          <p style="font-size:18px;font-weight:700;margin:4px 0 0;">小塔</p>
          <p style="font-size:28px;font-weight:800;color:var(--ws-primary);margin:0;">1</p>
        </div>
      </header>
      <div class="ws-card" style="text-align:center;margin-bottom:24px;" data-dom-id="battle-prompt">
        <p style="font-size:22px;color:var(--ws-muted-foreground);margin-bottom:12px;">快速选出正确图片</p>
        <h2 class="ws-title" style="font-size:42px;margin-bottom:16px;">Banana</h2>
      </div>
      <div class="battle-options" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" data-dom-id="battle-options">
        <button class="ws-option-card" data-dom-id="b-opt-0" onclick="location.href='battle-result${s}.html'">
          <div style="font-size:56px;">🍎</div>
        </button>
        <button class="ws-option-card" data-dom-id="b-opt-1" onclick="location.href='battle-result${s}.html'">
          <div style="font-size:56px;">🍌</div>
        </button>
        <button class="ws-option-card" data-dom-id="b-opt-2" onclick="location.href='battle-result${s}.html'">
          <div style="font-size:56px;">🍇</div>
        </button>
        <button class="ws-option-card" data-dom-id="b-opt-3" onclick="location.href='battle-result${s}.html'">
          <div style="font-size:56px;">🍊</div>
        </button>
      </div>
    </section>`
    },
    'battle-result': {
      title: '对战结算',
      body: `
    <section class="battle-result" style="text-align:center;">
      <div data-dom-id="result-trophy" style="font-size:96px;margin-bottom:16px;">🏆</div>
      <h1 class="ws-title" style="font-size:48px;color:var(--ws-state-success);">你赢了！</h1>
      <p class="ws-subtitle" style="margin-bottom:24px;">小芳 3 : 1 小塔</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;" data-dom-id="result-stats">
        <div class="ws-card"><p style="font-size:18px;color:var(--ws-muted-foreground);margin:0;">连胜</p><p style="font-size:36px;font-weight:800;margin:4px 0 0;color:var(--ws-primary);">+1</p></div>
        <div class="ws-card"><p style="font-size:18px;color:var(--ws-muted-foreground);margin:0;">获得星星</p><p style="font-size:36px;font-weight:800;margin:4px 0 0;color:var(--ws-primary);">+10</p></div>
      </div>
      <div class="ws-card" style="margin-bottom:24px;text-align:left;" data-dom-id="result-rank">
        <p style="font-size:20px;font-weight:700;margin:0;">本周排名：第 3 名</p>
        <p style="font-size:18px;color:var(--ws-muted-foreground);margin:8px 0 0;">再赢 1 场就能升到第 2 名</p>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="${primaryBtnClass}" style="flex:1;" data-dom-id="result-again" onclick="location.href='battle-play${s}.html'">再来一局</button>
        <button class="ws-button ws-button-secondary" style="flex:1;" data-dom-id="result-back" onclick="location.href='home${s}.html'">回首页</button>
      </div>
    </section>`
    },
    'collection-characters': {
      title: '收藏图鉴 · 角色',
      body: `
    <section class="collection-characters">
      <header style="margin-bottom:20px;">
        <h1 class="ws-title">角色图鉴</h1>
        <p class="ws-subtitle">你已经收集 5 / 12 个角色</p>
      </header>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" data-dom-id="chars-grid">
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🍎</div><p style="font-size:20px;font-weight:700;margin:0;">小苹果</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🍌</div><p style="font-size:20px;font-weight:700;margin:0;">香蕉仔</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🍇</div><p style="font-size:20px;font-weight:700;margin:0;">葡萄精灵</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🍊</div><p style="font-size:20px;font-weight:700;margin:0;">橙子骑士</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🍉</div><p style="font-size:20px;font-weight:700;margin:0;">西瓜博士</p></div>
        <div class="ws-card ws-locked" style="text-align:center;padding:20px;" onclick="location.href='collection-unlock${s}.html'"><div style="font-size:64px;margin-bottom:8px;">❓</div><p style="font-size:20px;font-weight:700;margin:0;">未解锁</p></div>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <button class="ws-button ws-button-secondary" style="min-width:240px;" data-dom-id="chars-to-badges" onclick="location.href='collection-badges${s}.html'">查看徽章</button>
      </div>
    </section>`
    },
    'collection-badges': {
      title: '收藏图鉴 · 徽章',
      body: `
    <section class="collection-badges">
      <header style="margin-bottom:20px;">
        <h1 class="ws-title">徽章墙</h1>
        <p class="ws-subtitle">你已经获得 3 / 8 枚徽章</p>
      </header>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" data-dom-id="badges-grid">
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🔥</div><p style="font-size:20px;font-weight:700;margin:0;">连胜 5 天</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">⭐</div><p style="font-size:20px;font-weight:700;margin:0;">100 星达成</p></div>
        <div class="ws-card" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🏆</div><p style="font-size:20px;font-weight:700;margin:0;">对战首胜</p></div>
        <div class="ws-card ws-locked" style="text-align:center;padding:20px;"><div style="font-size:64px;margin-bottom:8px;">🔒</div><p style="font-size:20px;font-weight:700;margin:0;">解锁 10 词</p></div>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <button class="ws-button ws-button-secondary" style="min-width:240px;" data-dom-id="badges-to-chars" onclick="location.href='collection-characters${s}.html'">查看角色</button>
      </div>
    </section>`
    },
    'collection-unlock': {
      title: '收藏图鉴 · 解锁弹窗',
      body: `
    <section class="collection-unlock" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;gap:24px;">
      <div class="ws-card" style="max-width:460px;width:100%;padding:32px;" data-dom-id="unlock-modal">
        <div style="font-size:96px;margin-bottom:16px;">🍓</div>
        <h2 class="ws-title" style="font-size:32px;margin-bottom:8px;">解锁草莓公主</h2>
        <p style="font-size:22px;color:var(--ws-muted-foreground);margin-bottom:24px;">需要 50 颗星星</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px;">
          <div class="ws-badge" style="font-size:20px;padding:10px 18px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>128</div>
          <span style="font-size:24px;">- 50</span>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="${primaryBtnClass}" style="flex:1;" data-dom-id="unlock-confirm" onclick="location.href='collection-characters${s}.html'">确认解锁</button>
          <button class="ws-button ws-button-secondary" style="flex:1;" data-dom-id="unlock-cancel" onclick="location.href='collection-characters${s}.html'">再想想</button>
        </div>
      </div>
    </section>`
    }
  };
  return templates[key];
}

let generatedCount = 0;
for (const style of styles) {
  for (const page of pageDefs) {
    const content = pageContent(page.key, style);
    const fileName = `${page.key}${style.suffix}.html`;
    const filePath = path.join(PAGES_DIR, fileName);
    const html = shellWrapper({ styleSlug: style.slug, activeNav: page.activeNav, content });
    fs.writeFileSync(filePath, html, 'utf-8');
    generatedCount++;
    console.log(`Generated ${filePath}`);
  }
}

console.log(`Done. Generated ${generatedCount} pages.`);
