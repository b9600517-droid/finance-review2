(() => {
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages=['懂問題','看關係','帶入關係式','一步步示範','自己試試'];
function parseAnswer(raw){const t=String(raw??'').trim();return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(t)&&Number.isFinite(Number(t))?Number(t):null;}
function mount(container,chapter,unit,state,save,navigate){
 const bank=window.TeachingData;
 state.labs.teaching=state.labs.teaching&&typeof state.labs.teaching==='object'&&!Array.isArray(state.labs.teaching)?state.labs.teaching:{};
 let i=state.last.section;
 const $=s=>container.querySelector(s);
 const key=()=>unit.id+':'+i;
 function memory(){let v=state.labs.teaching[key()];if(!v||typeof v!=='object'||Array.isArray(v))v=state.labs.teaching[key()]={};
  const d=bank[key()];v.stage=Number.isInteger(v.stage)&&v.stage>=0&&v.stage<5?v.stage:0;v.metric=Number.isInteger(v.metric)&&v.metric>=0&&v.metric<d.metrics.length?v.metric:0;v.work=Number.isInteger(v.work)&&v.work>=0&&v.work<4?v.work:0;return v;}
 const stash=()=>{state.last={unit:unit.id,section:i};save();};
 function feedback(d,v){const a=parseAnswer(v.answer);if(a===null)return '<p class="lesson-feedback">請填數值，不含百分號或算式；單位已列在欄位旁。</p>';
  const ok=Math.abs(a-d.number.answer)<=d.number.tolerance+1e-10;
  return `<p class="lesson-feedback">${ok?'這題算對了。':'先對照步驟，找出是資料、方向、單位，還是算術不同。'} ${esc(d.number.solution)}</p>`;}
 function practice(d,s,v){return `<h2>換個問法，自己走一次。</h2><div class="lesson-check"><h3>先判斷觀念</h3><p>${esc(d.check.prompt)}</p><div class="lesson-choices">${d.check.options.map((o,j)=>`<button data-check="${j}" aria-pressed="${v.choice===j}">${esc(o)}</button>`).join('')}</div>${Number.isInteger(v.choice)?`<p class="lesson-feedback" role="status">${v.choice===d.check.correct?'這個判斷正確。':'再想一下問題真正的比較基準。'} ${esc(d.check.why)}</p>`:''}</div>
 ${d.number?`<div class="lesson-check"><h3>再試一組數字</h3><p>${esc(d.number.prompt)}</p><label class="lesson-answer" for="teachAnswer">你的答案（${esc(d.number.unit)}）<input id="teachAnswer" inputmode="decimal" type="text" value="${esc(v.answer||'')}" placeholder="先在紙上列步驟"></label><button class="btn" id="teachCheck">對照解法</button><div id="teachFeedback" role="status">${v.checked?feedback(d,v):''}</div></div>`:`<details class="boundary"><summary>用自己的話說說：${esc(s.think)}</summary><p>${esc(s.answer)}</p></details>`}
 <label for="teachNote"><h3>用自己的話留一句話（選填）</h3><p class="tiny">${esc(s.note)}</p></label><textarea id="teachNote" placeholder="這一節要回答……，我會先……">${esc(state.notes[key()]||'')}</textarea><p class="tiny" id="teachNoteStatus">筆記沿用原本小節；練習不計分，完成由你自行確認。</p>
 <details class="reference-table"><summary>學完後查閱：講義原例與補充口徑</summary><p>${esc(s.explain)}</p><ul>${s.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>${s.examples.map(e=>`<p><b>${esc(e.label)}：</b>${esc(e.text)} ${esc(e.why)}</p>`).join('')}</details>
 ${s.lab?'<details class="lesson-tool"><summary>需要時才展開：原例計算與改數字</summary><p class="tiny">此工具沿用講義原例；數字可能與剛才的小情境不同。先選好要追問的指標，再改條件。</p><div id="teachLab"></div></details>':''}
 <div class="actions"><button class="btn primary" id="teachDone">${state.done.includes(key())?'已確認理解，繼續下一節':'這一節我理解了，繼續下一節'} →</button></div>`;}
 function render(){const d=bank[key()],s=unit.sections[i],v=memory(),metric=d.metrics[v.metric];stash();
 const screens=[()=>`<div class="lesson-kicker">先不算，先把問題說清楚。</div><h2>${esc(d.question)}</h2><div class="lesson-story"><p>${esc(d.story)}</p></div><p class="tiny">這一段先建立情境；下一段才看它們如何連起來。</p>`,
 ()=>`<h2>先看關係，再決定怎麼算。</h2><div class="lesson-story"><p>${esc(d.relationship)}</p></div><div class="lesson-flow"><span>題目要問什麼</span><b>→</b><span>哪些資料有關</span><b>→</b><span>用什麼基準比較</span></div><p class="tiny">試著先預測方向：條件改變時，答案應該往哪裡走？</p>`,
 ()=>`<h2>一次只看一個關係式。</h2>${switcher(d,v)}<div class="lesson-equation"><span>${esc(metric.name)}</span><div class="formula">${esc(metric.formula)}</div><p>${esc(metric.steps[1][1])}</p></div><p class="tiny">先辨認符號與比較基準，下一段再一步一步帶入。</p>`,
 ()=>`<h2>一起走完：${esc(metric.name)}</h2>${switcher(d,v)}<div class="lesson-work"><div class="lesson-kicker">示範 ${v.work+1}／4</div><h3>${esc(metric.steps[v.work][0])}</h3><p class="${v.work===2?'worked-number':''}">${esc(metric.steps[v.work][1])}</p><div class="actions"><button class="btn" id="teachWorkPrev" ${v.work===0?'disabled':''}>← 上一步</button>${v.work<3?'<button class="btn primary" id="teachWorkNext">看下一步 →</button>':v.metric<d.metrics.length-1?'<button class="btn primary" id="teachMetricNext">接著看下一個關係 →</button>':'<span class="tiny">這個關係走完了，可以自己試一次。</span>'}</div></div>`,
 ()=>practice(d,s,v)];
 container.innerHTML=`<div class="eyebrow">${chapter.zh} · 主題 ${chapter.units.indexOf(unit)+1}／${chapter.units.length} · 分段教學</div><div class="section-title"><h1>${esc(unit.name)}</h1></div><div class="lesson-topic-nav" role="group" aria-label="選擇本主題的小節">${unit.sections.map((x,j)=>`<button data-teach-section="${j}" aria-pressed="${i===j}">${state.done.includes(unit.id+':'+j)?'✓ ':''}${j+1}. ${esc(x.name)}</button>`).join('')}</div><nav class="lesson-stage-nav" aria-label="這一節的學習順序">${stages.map((name,j)=>`<button data-teach-stage="${j}" aria-current="${v.stage===j?'step':'false'}"><span>${j+1}</span>${name}</button>`).join('')}</nav><article class="q-card lesson-card">${screens[v.stage]()}</article><div class="actions lesson-stage-actions"><button class="btn" id="teachPrev" ${v.stage===0?'disabled':''}>← 上一段</button>${v.stage<4?`<button class="btn primary" id="teachNext">接著：${stages[v.stage+1]} →</button>`:''}<span class="tiny">${v.stage+1}／5 · 可以往回看，不計分</span></div><p class="source-line">觀念依 ${esc(chapter.source)}，本主題對應 p.${unit.pages.join('、')}。小情境與練習為教學改編；講義原例與差異在「自己試試」後可展開查閱。</p>`;
 container.querySelectorAll('[data-teach-section]').forEach(b=>b.onclick=()=>{i=Number(b.dataset.teachSection);stash();render();window.scrollTo(0,0);});
 container.querySelectorAll('[data-teach-stage]').forEach(b=>b.onclick=()=>{v.stage=Number(b.dataset.teachStage);stash();render();window.scrollTo(0,0);});
 $('#teachPrev').onclick=()=>{v.stage--;render();window.scrollTo(0,0);};if($('#teachNext'))$('#teachNext').onclick=()=>{v.stage++;render();window.scrollTo(0,0);};
 container.querySelectorAll('[data-teach-metric]').forEach(b=>b.onclick=()=>{v.metric=Number(b.dataset.teachMetric);v.work=0;render();});
 if($('#teachWorkPrev'))$('#teachWorkPrev').onclick=()=>{v.work--;render();};if($('#teachWorkNext'))$('#teachWorkNext').onclick=()=>{v.work++;render();};if($('#teachMetricNext'))$('#teachMetricNext').onclick=()=>{v.metric++;v.work=0;render();};
 container.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{v.choice=Number(b.dataset.check);render();});
 if($('#teachAnswer'))$('#teachAnswer').oninput=e=>{v.answer=e.target.value;v.checked=false;$('#teachFeedback').innerHTML='';stash();};
 if($('#teachCheck'))$('#teachCheck').onclick=()=>{v.checked=true;stash();$('#teachFeedback').innerHTML=feedback(d,v);};
 if($('#teachNote'))$('#teachNote').oninput=e=>{state.notes[key()]=e.target.value;$('#teachNoteStatus').textContent=save()?'筆記已保留。':'本次未能儲存，離開前請匯出。';};
 const tool=$('.lesson-tool');if(tool)tool.ontoggle=()=>{const el=$('#teachLab');if(!tool.open||el.dataset.mounted)return;el.dataset.mounted='true';if(chapter===window.CHAPTER5)window.TimeValueLab.mount(s.lab,el,state,save,s.preset);else window.FinanceLab.mount(s.lab,el,state,save,s.ratio);};
 if($('#teachDone'))$('#teachDone').onclick=()=>{state.done=[...new Set([...state.done,key()])];const flat=chapter.units.flatMap(u=>u.sections.map((_,section)=>({unit:u.id,section}))),at=flat.findIndex(x=>x.unit===unit.id&&x.section===i),next=flat[at+1];if(next){const nextKey=next.unit+':'+next.section;if(state.labs.teaching[nextKey])state.labs.teaching[nextKey].stage=0;state.last=next;save();if(next.unit===unit.id){i=next.section;render();window.scrollTo(0,0);}else navigate('review/'+next.unit);}else{save();navigate('recap');}};
 }
 function switcher(d,v){return `<div class="lesson-switch" role="group" aria-label="一次選一個關係">${d.metrics.map((x,j)=>`<button data-teach-metric="${j}" aria-pressed="${v.metric===j}">${esc(x.name)}</button>`).join('')}</div>`;}
 render();
}
window.TeachingLesson={mount,parseAnswer};
})();
