(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ============================================================
  // Chart 1: MVP 开发路线图甘特（12 周）
  // ============================================================
  var roadmapEl = document.getElementById('chart-roadmap');
  if (roadmapEl) {
    var tasks = [
      { name: '阶段0 · 准备', start: 0, end: 2 },
      { name: '阶段1 · 数据与内容', start: 2, end: 5 },
      { name: '阶段2 · 游戏核心', start: 4, end: 8 },
      { name: '阶段3 · 对战与家长', start: 6, end: 10 },
      { name: '阶段4 · 基础设施', start: 8, end: 12 },
      { name: '阶段5 · 收口发布', start: 10, end: 12 }
    ];

    var roadmap = echarts.init(roadmapEl, null, { renderer: 'svg' });
    roadmap.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: rule,
        textStyle: { color: ink, fontSize: 13 },
        formatter: function (params) {
          var d = params.data || {};
          return d.name + '<br/>第 ' + (d.value[1] + 1) + ' – ' + d.value[2] + ' 周';
        }
      },
      grid: { left: 150, right: 30, top: 24, bottom: 30 },
      xAxis: {
        type: 'value',
        min: 0,
        max: 12,
        interval: 2,
        axisLabel: { color: muted, formatter: function (v) { return 'W' + v; } },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: tasks.map(function (t) { return t.name; }),
        axisLabel: { color: ink, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      series: [{
        type: 'custom',
        clip: true,
        renderItem: function (params, api) {
          var categoryIndex = api.value(0);
          var start = api.coord([api.value(1), categoryIndex]);
          var end = api.coord([api.value(2), categoryIndex]);
          var height = api.size([0, 1])[1] * 0.6;
          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 3),
              height: height
            },
            style: api.style({ fill: accent })
          };
        },
        data: tasks.map(function (t, i) {
          return { name: t.name, value: [i, t.start, t.end] };
        })
      }]
    });
    window.addEventListener('resize', function () { roadmap.resize(); });
  }

  // ============================================================
  // Chart 2: 功能优先级矩阵（用户价值 × 实现成本）
  // ============================================================
  var priorityEl = document.getElementById('chart-priority');
  if (priorityEl) {
    // 数据：value = [实现成本(周), 用户价值(1-10), 影响面(气泡)]
    var mvpData = [
      { name: '词汇闯关', value: [3.0, 10, 42] },
      { name: '自然拼读', value: [3.5, 9, 38] },
      { name: '闯关引擎', value: [4.0, 10, 40] },
      { name: '自适应难度', value: [2.0, 8, 34] },
      { name: 'AI 对战', value: [2.5, 8, 30] },
      { name: '角色收集', value: [1.5, 7, 26] },
      { name: '离线缓存', value: [3.0, 9, 36] },
      { name: '零引导上手', value: [1.5, 9, 32] },
      { name: '家长报告', value: [2.5, 8, 30] },
      { name: '防沉迷', value: [1.0, 8, 24] }
    ];
    var v2Data = [
      { name: '亲子 PK', value: [4.0, 7, 22] },
      { name: '排行榜', value: [2.0, 6, 18] }
    ];

    var priority = echarts.init(priorityEl, null, { renderer: 'svg' });
    priority.setOption({
      animation: false,
      grid: { left: 60, right: 30, top: 60, bottom: 56 },
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: rule,
        textStyle: { color: ink, fontSize: 13 },
        formatter: function (params) {
          return '<strong>' + params.name + '</strong><br/>实现成本：约 ' + params.value[0] + ' 周<br/>用户价值：' + params.value[1] + ' / 10';
        }
      },
      xAxis: {
        type: 'value',
        name: '实现成本（周）',
        nameLocation: 'middle',
        nameGap: 32,
        nameTextStyle: { color: muted, fontSize: 12 },
        max: 5,
        min: 0,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value',
        name: '用户价值（1-10）',
        nameTextStyle: { color: muted, fontSize: 12 },
        max: 10,
        min: 4,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        {
          name: 'MVP 必做',
          type: 'scatter',
          data: mvpData,
          symbolSize: function (val) { return val[2]; },
          itemStyle: { color: accent, opacity: 0.75 },
          label: {
            show: true,
            position: 'top',
            formatter: function (p) { return p.name; },
            color: ink,
            fontSize: 10
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: muted, type: 'dashed', opacity: 0.4 },
            label: { show: false },
            data: [{ xAxis: 2.75 }, { yAxis: 7.5 }]
          }
        },
        {
          name: 'V2 规划',
          type: 'scatter',
          data: v2Data,
          symbolSize: function (val) { return val[2]; },
          itemStyle: { color: accent2, opacity: 0.8 },
          label: {
            show: true,
            position: 'top',
            formatter: function (p) { return p.name; },
            color: ink,
            fontSize: 10
          }
        }
      ]
    });
    window.addEventListener('resize', function () { priority.resize(); });
  }
})();