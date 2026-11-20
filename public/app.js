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

  /* ---- Figure 1: frames, stacked UI + raster, toggle S2 / S3 ---- */
  function frameTraces(rows){
    const x = rows.map((_,i)=>i);
    return [
      { x, y: rows.map(r=>r.build), name:'UI / build', type:'bar', marker:{color:C.ui},
        hovertemplate:'frame %{x}<br>UI %{y:.1f} ms<extra></extra>' },
      { x, y: rows.map(r=>r.raster), name:'Raster / GPU', type:'bar', marker:{color:C.raster},
        hovertemplate:'frame %{x}<br>Raster %{y:.1f} ms<extra></extra>' },
    ];
  }
  const budgetLine = { type:'line', xref:'paper', x0:0, x1:1, y0:16.7, y1:16.7,
    line:{color:C.budget, width:1.3, dash:'dash'} };
  const budgetAnno = { xref:'paper', x:0.01, y:16.7, yanchor:'bottom', text:'16.7 ms (60 FPS)',
    showarrow:false, font:{size:11, color:C.budget}, bgcolor:'rgba(247,245,239,.8)' };
  function drawFrames(which){
    const rows = which==='S3' ? D.framesS3 : D.framesS2;
    const lay = merge(BASE, { barmode:'stack', showlegend:true,
      legend:{orientation:'h', y:1.12, x:0, font:{size:12}},
      shapes:[budgetLine], annotations:[budgetAnno],
      xaxis:{title:'Frame index'}, yaxis:{title:'Time (ms)', range:[0, 300]} });
    Plotly.react('chart-frames', frameTraces(rows), lay, CFG);
  }
  drawFrames('S2');
  // toggle buttons injected above the chart
  const holder = document.getElementById('chart-frames');
  const bar = document.createElement('div'); bar.className='toggle';
  bar.innerHTML = '<button data-k="S2" class="on">S2 · small GET (125 frames)</button>'
                + '<button data-k="S3">S2+S3 · large JSON (231 frames)</button>';
  holder.parentNode.insertBefore(bar, holder);
  bar.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    bar.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); drawFrames(b.dataset.k);
  });

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
