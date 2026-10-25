(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var warn = style.getPropertyValue('--warn').trim();
  var ok = style.getPropertyValue('--ok').trim();

  // ==========================================
  // Chart 1: MVP 成功指标雷达图
  // ==========================================
  var chartSuccess = echarts.init(
    document.getElementById('chart-success'),
    null,
    { renderer: 'svg' }
  );
  chartSuccess.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: rule,
      textStyle: { color: ink, fontSize: 13 }
    },
    legend: {
      data: ['MVP 目标值', '行业基准参考'],
      bottom: 0,
      textStyle: { color: muted, fontSize: 12 }
    },
    radar: {
      indicator: [
        { name: '周活跃频次\n(≥3次/周)', max: 100 },
        { name: '4周留存率\n(≥40%)', max: 100 },
        { name: '单次时长\n(20-30min)', max: 100 },
        { name: '词汇增长\n(≥50词/4周)', max: 100 },
        { name: '拼读准确率\n(↑≥15%)', max: 100 },
        { name: '亲子PK参与率\n(≥50%)', max: 100 },
        { name: '家长端周活\n(≥60%)', max: 100 },
        { name: '首次使用完成率\n(≥80%)', max: 100 }
      ],
      shape: 'polygon',
      radius: '60%',
      center: ['50%', '48%'],
      axisName: {
        color: muted,
        fontSize: 10,
        lineHeight: 13
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(99,102,241,0.02)', 'rgba(99,102,241,0.04)', 'rgba(99,102,241,0.06)', 'rgba(99,102,241,0.08)']
        }
      },
      axisLine: { lineStyle: { color: rule } },
      splitLine: { lineStyle: { color: rule } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [75, 40, 85, 65, 70, 50, 60, 80],
            name: 'MVP 目标值',
            areaStyle: { color: 'rgba(99,102,241,0.15)' },
            lineStyle: { color: accent, width: 2 },
            itemStyle: { color: accent }
          },
          {
            value: [55, 25, 70, 50, 55, 30, 40, 60],
            name: '行业基准参考',
            areaStyle: { color: 'rgba(245,158,11,0.1)' },
            lineStyle: { color: accent2, width: 1.5, type: 'dashed' },
            itemStyle: { color: accent2 }
          }
        ]
      }
    ]
  });
  window.addEventListener('resize', function () { chartSuccess.resize(); });

  // ==========================================
  // Chart 2: 风险影响 × 发生概率散点图
  // ==========================================
  var chartRisk = echarts.init(
    document.getElementById('chart-risk'),
    null,
    { renderer: 'svg' }
  );

  var riskData = [
    { name: 'R1: MVP范围\nvs 工程量', value: [92, 95], color: danger, category: 'high' },
    { name: 'R2: 亲子PK\n工程复杂度', value: [78, 88], color: danger, category: 'high' },
    { name: 'R3: 离线缓存\n技术复杂度', value: [70, 75], color: danger, category: 'high' },
    { name: 'R4: 人教版\n版权风险', value: [70, 60], color: warn, category: 'mid' },
    { name: 'R5: 留守儿童\n触达推广', value: [85, 70], color: warn, category: 'mid' },
    { name: 'R6: 低端设备\n性能瓶颈', value: [75, 65], color: warn, category: 'mid' },
    { name: 'R7: 免费模式\n可持续性', value: [65, 80], color: warn, category: 'mid' },
    { name: 'R8: 儿童安全\n合规风险', value: [80, 50], color: warn, category: 'mid' }
  ];

  chartRisk.setOption({
    animation: false,
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: rule,
      textStyle: { color: ink, fontSize: 13 },
      formatter: function (p) {
        var d = p.data;
        return '<strong>' + d.name.replace(/\n/g, ' ') + '</strong><br/>影响度: ' + d.value[0] + '<br/>发生概率: ' + d.value[1];
      }
    },
    grid: {
      left: 70,
      right: 50,
      top: 40,
      bottom: 70
    },
    xAxis: {
      type: 'value',
      name: '影响度 →',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: muted, fontSize: 12, fontWeight: 700 },
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: '发生概率 →',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: muted, fontSize: 12, fontWeight: 700 },
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: rule, type: 'dashed' } },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 11 }
    },
    series: [
      {
        type: 'scatter',
        symbolSize: function (data) { return 24; },
        data: riskData.map(function (d) {
          return {
            name: d.name,
            value: d.value,
            itemStyle: {
              color: d.color,
              opacity: 0.75,
              borderColor: d.color,
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: d.color + '40'
            }
          };
        }),
        label: {
          show: true,
          position: 'right',
          formatter: function (p) {
            var parts = p.data.name.split(':');
            return parts[0];
          },
          color: ink,
          fontSize: 11,
          fontWeight: 700
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(239,68,68,0.04)' },
          data: [[{ xAxis: 70, yAxis: 70 }, { xAxis: 100, yAxis: 100 }]]
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: rule, type: 'dashed' },
          data: [{ xAxis: 50 }, { yAxis: 50 }]
        }
      }
    ]
  });
  window.addEventListener('resize', function () { chartRisk.resize(); });
})();
