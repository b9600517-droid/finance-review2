(() => {
'use strict';
const samples={
two:{name:'p.4 圖 6.1｜今天與一年後各存 100',page:'4',r:8,target:2,flows:[{at:0,amount:100},{at:1,amount:100}]},
five:{name:'p.7–8｜每年末存 2,000，共五次',page:'7–8',r:10,target:5,flows:[1,2,3,4,5].map(at=>({at,amount:2000}))},
saving:{name:'p.5 例 6.1｜7,000 加三次 4,000，第三年末',page:'5–6',r:8,target:3,flows:[{at:0,amount:7000},...[1,2,3].map(at=>({at,amount:4000}))]},
saving4:{name:'p.5 例 6.1｜原三次存款，第四年末',page:'5–6',r:8,target:4,flows:[{at:0,amount:7000},...[1,2,3].map(at=>({at,amount:4000}))]},
uneven:{name:'p.9 例 6.2｜100、200、300，第三年末',page:'9',r:7,target:3,flows:[{at:1,amount:100},{at:2,amount:200},{at:3,amount:300}]},
uneven5:{name:'p.9 例 6.2｜原三筆存款，第五年末',page:'9',r:7,target:5,flows:[{at:1,amount:100},{at:2,amount:200},{at:3,amount:300}]}
};
const formulas=[
{id:'individual',name:'逐筆累積後加總',en:'Separate cash flow compounding',cat:'多筆終值',formula:'FV_T = Σ CFᵢ × (1+r)^(T−tᵢ)',pages:'4、6、8–9',meaning:'每筆移到同一個目標時點 T 再相加。',trap:'T−tᵢ 是該筆的期數；不同時點不可共用相同指數。'},
{id:'balance',name:'逐期滾動餘額',en:'Balance recurrence',cat:'多筆終值',formula:'B₀ = CF₀；Bₖ = Bₖ₋₁(1+r) + CFₖ',pages:'6、8',meaning:'期末新存款在當期利息計算後加入。',trap:'若 CFₖ 是期末存款，不可改成 (Bₖ₋₁+CFₖ)(1+r)。'},
{id:'principal',name:'總本金與總利息',en:'Contributions and interest',cat:'金額拆解',formula:'本金 = Σ CFᵢ；累積利息 = FV_T − Σ CFᵢ',pages:'9',meaning:'把帳戶總餘額和實際賺到的利息分開。',trap:'需扣全部投入本金，不是只扣第一筆。此處現金流皆為存款。'},
{id:'extend',name:'無新存款時延長目標',en:'Growth after the final deposit',cat:'目標時間',formula:'FV_(T+n) = FV_T × (1+r)^n',pages:'5、9',meaning:'所有金額已在共同時點 T，可以合併再往後累積。',trap:'延長衡量時間不代表多存幾筆錢。'}
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,d=2)=>Number.isFinite(x)?Number(x.toPrecision(14)).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const numeric=x=>x!==''&&x!==null&&x!==undefined&&Number.isFinite(Number(x));
function evaluate(raw){
 if(!numeric(raw.r)||Number(raw.r)<=-100)return {error:'請輸入大於 −100% 的每年利率；8 代表 8%。'};
 if(!numeric(raw.target)||!Number.isInteger(Number(raw.target))||Number(raw.target)<0||Number(raw.target)>50)return {error:'目標年末 T 請填 0–50 的整數。'};
 if(!Array.isArray(raw.flows)||raw.flows.length<1||raw.flows.length>30)return {error:'請保留 1–30 筆存款。'};
 const r=Number(raw.r)/100,target=Number(raw.target),flows=[];
 for(let i=0;i<raw.flows.length;i++){const f=raw.flows[i];if(!numeric(f.at)||!Number.isInteger(Number(f.at))||Number(f.at)<0||Number(f.at)>target)return {error:`第 ${i+1} 筆時點須為 0 到目標年 ${target} 的整數；未到的存款不能提前算入。`};if(!numeric(f.amount)||Number(f.amount)<0)return {error:`第 ${i+1} 筆存款請填非負金額；本區只示範存款。`};const at=Number(f.at),amount=Number(f.amount),periods=target-at,factor=Math.pow(1+r,periods),fv=amount*factor;flows.push({at,amount,periods,factor,fv,interest:fv-amount});}
 const principal=flows.reduce((s,f)=>s+f.amount,0),fv=flows.reduce((s,f)=>s+f.fv,0),periods=[];
 let balance=0;
 for(let k=0;k<=target;k++){const start=balance,interest=k===0?0:start*r,deposit=flows.filter(f=>f.at===k).reduce((s,f)=>s+f.amount,0);balance=start+interest+deposit;periods.push({at:k,start,interest,deposit,end:balance});}
 if(![principal,fv,balance].every(Number.isFinite)||Math.max(principal,Math.abs(fv),Math.abs(balance))>1e100)return {error:'金額超出顯示範圍，請縮小輸入。'};
 return {r,target,flows,principal,fv,interest:fv-principal,periods,balance,difference:balance-fv};
}
function fromSample(id,method){const s=samples[id]||samples.two;return {caseId:id in samples?id:'two',r:s.r,target:s.target,flows:s.flows.map(f=>({...f})),method:method||'separate'};}
function timeline(a){const totals=new Map();a.flows.forEach(f=>totals.set(f.at,(totals.get(f.at)||0)+f.amount));return `<div class="flow-timeline" role="img" aria-label="存款時間軸，目標為第 ${a.target} 年末；${a.flows.map(f=>`t=${f.at} 存入 ${fmt(f.amount)}，生息 ${f.periods} 年`).join('；')}">${a.periods.map(p=>`<div class="flow-point ${p.at===a.target?'target':''}"><small>t = ${p.at}${p.at===0?' · 今天':''}</small><span>●</span><strong>${totals.has(p.at)?'+'+fmt(totals.get(p.at)):'無加存'}</strong><small>${p.at===a.target?'目標年末':a.target-p.at+' 期至目標'}</small></div>`).join('')}</div>`;}
function detail(a,method){return method==='balance'?`<p class="tiny">逐期法：先算舊餘額利息，再加入本期末存款。t=0 只建立初始餘額。</p><div class="table-scroll"><table><caption>逐期滾動：Bₖ = Bₖ₋₁(1+r) + CFₖ</caption><thead><tr><th>年末</th><th>期初餘額</th><th>當期利息</th><th>期末新存款</th><th>入帳後餘額</th></tr></thead><tbody>${a.periods.map(p=>`<tr><th>${p.at}</th><td>${fmt(p.start)}</td><td>${fmt(p.interest)}</td><td>${fmt(p.deposit)}</td><td>${fmt(p.end)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="tiny">逐筆法：每一筆的指數是 T−tᵢ，目標時點才存入的那筆指數為 0。</p><div class="table-scroll"><table><caption>逐筆累積：CFᵢ × (1+r)^(T−tᵢ)</caption><thead><tr><th>存入時點</th><th>本金</th><th>生息期數</th><th>累積因子</th><th>該筆終值</th><th>該筆利息</th></tr></thead><tbody>${a.flows.map(f=>`<tr><th>t=${f.at}</th><td>${fmt(f.amount)}</td><td>${f.periods}</td><td>${fmt(f.factor,6)}</td><td>${fmt(f.fv)}</td><td>${fmt(f.interest)}</td></tr>`).join('')}</tbody></table></div>`;}
function mount(mode,container,state,save,preferred,initialMethod){
 state.labs=state.labs||{};const key='flows6:'+(preferred||'two')+':'+(initialMethod||'separate'),v=state.labs[key]||(state.labs[key]=fromSample(preferred||'two',initialMethod));
 container.innerHTML=`<section class="lab-panel"><div class="eyebrow">第六章 p.1–9 · 多筆終值實驗</div><label class="tiny" for="flowsCase">講義案例／自訂</label><select id="flowsCase"><option value="">自訂目前數值</option>${Object.entries(samples).map(([id,s])=>`<option value="${id}" ${id===v.caseId?'selected':''}>${s.name}</option>`).join('')}</select><div class="number-grid"><label class="number-field">每年利率（百分數）<input type="number" step="any" data-flow-setting="r" value="${esc(v.r)}"></label><label class="number-field">目標年末 T（入帳後）<input type="number" step="1" data-flow-setting="target" value="${esc(v.target)}"></label></div><div class="flow-edit"><table><caption>編輯存款安排：t=0 是今天，其餘時點為該年末</caption><thead><tr><th>第幾年末存入 tᵢ</th><th>存入金額 CFᵢ</th><th>操作</th></tr></thead><tbody>${v.flows.map((f,i)=>`<tr><td><input aria-label="第 ${i+1} 筆存入時點" type="number" step="1" data-flow-at="${i}" value="${esc(f.at)}"></td><td><input aria-label="第 ${i+1} 筆存入金額" type="number" step="any" data-flow-amount="${i}" value="${esc(f.amount)}"></td><td><button class="btn text" data-flow-remove="${i}" ${v.flows.length===1?'disabled':''}>移除<span class="sr-only">第 ${i+1} 筆</span></button></td></tr>`).join('')}</tbody></table></div><div class="actions"><button class="btn" id="flowAdd" ${v.flows.length>=30?'disabled':''}>新增一筆存款</button><button class="btn text" id="flowsReset">還原本節講義案例</button></div><div id="flowResult" aria-live="polite"></div><div class="tabs" role="group" aria-label="選擇多筆終值算法"><button data-flow-method="separate" aria-pressed="${v.method==='separate'}">逐筆累積後加總</button><button data-flow-method="balance" aria-pressed="${v.method==='balance'}">逐期滾動餘額</button></div><div id="flowDetail"></div><p class="source-line" id="flowSource"></p><p class="tiny">每年固定 r、各筆存款在所列時點入帳。改目標年不會自動新增存款；tᵢ>T 會提示修正。年限採 0–50 整數、最多 30 筆非負存款；可在同一年列多筆。計算保留精度，顯示才取整。</p></section>`;
 const update=()=>{const a=evaluate(v),s=samples[v.caseId];container.querySelector('#flowSource').textContent=s?'來源：Ch6_eeclass.pdf，p.'+s.page+'；上方選定的講義案例。':'自訂教學情境，不代表講義原始數值。';const el=container.querySelector('#flowResult'),de=container.querySelector('#flowDetail');if(a.error){el.innerHTML=`<div class="lab-result"><span class="error">${esc(a.error)}</span></div>`;de.innerHTML='';return;}el.innerHTML=`${timeline(a)}<div class="lab-result"><div class="cash-results"><div><span>第 ${a.target} 年末總餘額 FV</span><strong>${fmt(a.fv)}</strong></div><div><span>所有存入本金</span><strong>${fmt(a.principal)}</strong></div><div><span>累積利息（可為負）</span><strong>${fmt(a.interest)}</strong></div></div><p class="method-check">兩法核對：逐筆 ${fmt(a.fv)} ／ 逐期 ${fmt(a.balance)}${Math.abs(a.difference)<1e-9*Math.max(1,Math.abs(a.fv))?' · 一致':' · 超出浮點核對容許值，請縮小輸入'}</p></div>`;de.innerHTML=detail(a,v.method);};
 const changed=()=>{v.caseId='';container.querySelector('#flowsCase').value='';save();update();};
 container.querySelectorAll('[data-flow-setting]').forEach(el=>el.oninput=()=>{v[el.dataset.flowSetting]=el.value;changed();});
 container.querySelectorAll('[data-flow-at]').forEach(el=>el.oninput=()=>{v.flows[Number(el.dataset.flowAt)].at=el.value;changed();});
 container.querySelectorAll('[data-flow-amount]').forEach(el=>el.oninput=()=>{v.flows[Number(el.dataset.flowAmount)].amount=el.value;changed();});
 container.querySelectorAll('[data-flow-remove]').forEach(el=>el.onclick=()=>{v.flows.splice(Number(el.dataset.flowRemove),1);v.caseId='';save();mount(mode,container,state,save,preferred,initialMethod);});
 container.querySelector('#flowAdd').onclick=()=>{if(v.flows.length<30){v.flows.push({at:numeric(v.target)?Number(v.target):0,amount:0});v.caseId='';save();mount(mode,container,state,save,preferred,initialMethod);}};
 container.querySelectorAll('[data-flow-method]').forEach(el=>el.onclick=()=>{v.method=el.dataset.flowMethod;save();container.querySelectorAll('[data-flow-method]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.flowMethod===v.method));update();});
 container.querySelector('#flowsCase').onchange=el=>{if(el.target.value)Object.assign(v,fromSample(el.target.value,v.method));else v.caseId='';save();mount(mode,container,state,save,preferred,initialMethod);};
 container.querySelector('#flowsReset').onclick=()=>{Object.assign(v,fromSample(preferred||'two',initialMethod));save();mount(mode,container,state,save,preferred,initialMethod);};
 update();
}
window.CashFlowLab={samples,formulas,evaluate,mount,format:fmt};
})();
