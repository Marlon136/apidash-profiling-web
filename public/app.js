// Palette taken from the reference banner (cyan / navy / warm accents)
const C = {
  ui:    '#f5c518',   // warm yellow  (UI/build)
  raster:'#05a2df',   // reference cyan (raster/GPU)
  accent:'#1f4e79',   // navy
  warm:  '#e8863c',   // orange
  grey:  '#8aa0ae',
  ink:   '#16293a',
  rule:  '#d4e3ec',
  budget:'#e8863c',   // orange budget line, stands out on cyan bars
};
const FONT = { family: 'Inter, system-ui, sans-serif', size: 12.5, color: C.ink };
const BASE = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: FONT,
  margin: { l: 56, r: 18, t: 14, b: 44 },
  hoverlabel: { font: { family: FONT.family, size: 12 }, bgcolor: '#fffdf8', bordercolor: C.rule },
  xaxis: { gridcolor: C.rule, zerolinecolor: C.rule, linecolor: C.rule },
  yaxis: { gridcolor: C.rule, zerolinecolor: C.rule, linecolor: C.rule },
};
const CFG = { displayModeBar: 'hover', displaylogo: false,
  modeBarButtonsToRemove: ['select2d','lasso2d','autoScale2d','toggleSpikelines'], responsive: true };

function merge(a, b){ return Object.assign({}, a, b, {
  xaxis: Object.assign({}, a.xaxis, b.xaxis),
  yaxis: Object.assign({}, a.yaxis, b.yaxis) }); }

fetch('data.json').then(r => r.json()).then(D => {
  document.getElementById('cpu-total').textContent = D.cpuTotal;

  /* ---- Figure 1: S2 vs S3 compared on the three metrics that matter ---- */
  const fs = D.frameSummary;
  const budgetLine = { type:'line', xref:'paper', x0:0, x1:1, y0:16.7, y1:16.7,
    line:{color:C.budget, width:1.4, dash:'dash'} };
  const budgetAnno = { xref:'paper', x:0.99, xanchor:'right', y:16.7, yanchor:'bottom',
    text:'16.7 ms budget (60 FPS)', showarrow:false, font:{size:11, color:C.budget},
    bgcolor:'rgba(243,248,251,.85)' };
  Plotly.newPlot('chart-frames', [
    { x: fs.metrics, y: fs.S2, name:'S2 · small GET', type:'bar', marker:{color:C.raster},
      text: fs.S2.map((v,i)=> i===2 ? v+'%' : v+' ms'), textposition:'outside',
      textfont:{size:12,color:C.ink},
      hovertemplate:'%{x}<br>S2: %{y}<extra></extra>' },
    { x: fs.metrics, y: fs.S3, name:'S3 · large JSON', type:'bar', marker:{color:C.warm},
      text: fs.S3.map((v,i)=> i===2 ? v+'%' : v+' ms'), textposition:'outside',
      textfont:{size:12,color:C.ink},
      hovertemplate:'%{x}<br>S3: %{y}<extra></extra>' },
  ], merge(BASE, { barmode:'group', showlegend:true,
      legend:{orientation:'h', y:1.14, x:0, font:{size:12.5}},
      shapes:[budgetLine], annotations:[budgetAnno],
      margin:{l:52,r:18,t:30,b:40},
      xaxis:{}, yaxis:{title:'ms  /  %', range:[0,70]} }), CFG);

  /* ---- Figure 2: repaints (horizontal bars) ---- */
  const rp = D.repaints.slice().reverse();
  Plotly.newPlot('chart-repaints', [{
    type:'bar', orientation:'h',
    x: rp.map(r=>r.n), y: rp.map(r=>r.obj),
    marker:{ color: rp.map(r=> r.n>=3000 ? C.warm : (r.n>=1500 ? C.raster : C.accent)) },
    hovertemplate:'%{y}<br>%{x:,} repaints<extra></extra>'
  }], merge(BASE, { margin:{l:200,r:18,t:10,b:44}, xaxis:{title:'Repaints in the recording'}, yaxis:{} }), CFG);

  /* ---- Figure 3: heap by package ---- */
  const hp = D.heapByPackage.slice().reverse();
  Plotly.newPlot('chart-heap', [{
    type:'bar', orientation:'h',
    x: hp.map(r=>r.kb), y: hp.map(r=>r.pkg),
    marker:{ color: hp.map(r=> r.pkg==='lottie' ? C.warm : C.raster) },
    hovertemplate:'%{y}<br>%{x:.1f} KB<extra></extra>'
  }], merge(BASE, { margin:{l:150,r:18,t:10,b:44}, xaxis:{title:'Retained Dart heap (KB)'}, yaxis:{} }), CFG);

  /* ---- Figure 4: top classes ---- */
  const hc = D.heapTopClasses.slice().reverse();
  Plotly.newPlot('chart-heapclasses', [{
    type:'bar', orientation:'h',
    x: hc.map(r=>r.kb), y: hc.map(r=>r.cls),
    customdata: hc.map(r=>[r.inst, r.lib]),
    marker:{ color:C.raster },
    hovertemplate:'%{y}<br>%{x:.1f} KB · %{customdata[0]:,} instances<br>[%{customdata[1]}]<extra></extra>'
  }], merge(BASE, { margin:{l:180,r:18,t:10,b:44}, xaxis:{title:'Retained size (KB)'}, yaxis:{} }), CFG);

  /* ---- Figure 5: CPU buckets (horizontal) ---- */
  const cb = D.cpuBuckets.slice().sort((a,b)=>a.pct-b.pct);
  const palette = {'List building (JSON parse)':C.warm,'Byte copying':C.orange||'#e8863c',
    'Text layout/paint':C.raster,'Decompression (CRC32)':C.accent,'Disk write (Hive)':C.ui,
    'Isolate messaging':C.grey,'Other':'#b9cedb'};
  Plotly.newPlot('chart-cpu', [{
    type:'bar', orientation:'h',
    x: cb.map(r=>r.pct), y: cb.map(r=>r.label),
    marker:{ color: cb.map(r=>palette[r.label]||C.raster) },
    hovertemplate:'%{y}<br>%{x:.1f}% of CPU samples<extra></extra>'
  }], merge(BASE, { margin:{l:190,r:18,t:10,b:44}, xaxis:{title:'% of CPU samples'}, yaxis:{} }), CFG);
});
