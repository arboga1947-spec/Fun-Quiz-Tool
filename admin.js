const app = document.querySelector('#adminApp');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadCodes() { return supabaseFetch('test_codes?select=code,used_count,created_at,batch_id,test_batches(note)&order=created_at.desc'); }
function groupBatches(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.batch_id)) groups.set(row.batch_id, {id:row.batch_id,note:row.test_batches?.note || '未备注',rows:[]});
    groups.get(row.batch_id).rows.push(row);
  }
  return [...groups.values()].filter(batch => batch.rows.some(row => row.used_count < 3));
}
async function render() {
  let rows=[], error='';
  try { rows=await loadCodes(); } catch(e) { error='加载失败：'+e.message; }
  const batches=groupBatches(rows);
  app.innerHTML=`<div class="wrap shell"><div class="brand"><div class="brand-mark">⟡</div><div class="eyebrow">ADMIN CONSOLE</div></div><section class="panel"><h2>生成测试密码</h2><p class="hint">每个密码可使用 3 次。备注留空时自动编号为 1、2、3……</p><label>批次备注<input id="batchNote" class="input" placeholder="选填，留空自动编号"></label><label>生成数量<input id="batchCount" class="input" type="number" min="1" max="500" step="1" value="10"></label><div class="result-actions"><button class="btn" id="generateButton" onclick="generateBatch()">随机生成一批</button><button class="btn ghost" onclick="exportLatest()">导出最新批次 CSV</button><button class="btn ghost" onclick="render()">刷新使用次数</button></div><p id="adminNotice" class="hint" role="status">${escapeHtml(error)}</p></section><section class="panel" style="margin-top:18px"><h2>批次密码窗口</h2><p class="hint">当前有 ${batches.length} 个可用批次。整批密码用完后自动隐藏，历史数据保留。</p><div style="max-height:65vh;overflow:auto">${batches.length?batches.map(batch=>`<details open style="border-top:1px solid var(--line);padding:16px 0"><summary style="cursor:pointer">批次 ${escapeHtml(batch.note)} · ${batch.rows.length} 个密码 · 剩余 ${batch.rows.reduce((n,r)=>n+Math.max(0,3-r.used_count),0)} 次</summary>${batch.rows.map(row=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;flex-wrap:wrap"><code style="color:var(--accent);flex:1">${escapeHtml(row.code)}</code><span>剩余 ${Math.max(0,3-row.used_count)}/3 次</span><button class="btn ghost copy-code" data-code="${escapeHtml(row.code)}">复制</button></div>`).join('')}</details>`).join(''):'<p class="hint">暂无可用批次，请先生成密码。</p>'}</div></section></div>`;
  app.querySelectorAll('.copy-code').forEach(button=>button.addEventListener('click',()=>copyCode(button)));
}
async function copyCode(button) {
  try { await navigator.clipboard.writeText(button.dataset.code); button.textContent='已复制'; setTimeout(()=>button.textContent='复制',1500); }
  catch(e) { document.querySelector('#adminNotice').textContent='无法自动复制，请手动复制密码：'+button.dataset.code; }
}
async function generateBatch() {
  const count=Number(document.querySelector('#batchCount').value);
  if(!Number.isInteger(count)||count<1||count>500){document.querySelector('#adminNotice').textContent='请输入 1—500 之间的整数';return;}
  let note=document.querySelector('#batchNote').value.trim();
  const button=document.querySelector('#generateButton'); button.disabled=true;
  try {
    const batches=await supabaseFetch('test_batches?select=id,note');
    if(!note) note=String(Math.max(0,...batches.filter(b=>/^[1-9]\d*$/.test(b.note)).map(b=>Number(b.note)))+1);
    const existing=await loadCodes(); const seen=new Set(existing.map(r=>r.code)); const codes=[]; const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    while(codes.length<count){const values=crypto.getRandomValues(new Uint8Array(10));const code=Array.from(values,v=>chars[v%chars.length]).join('');if(!seen.has(code)){seen.add(code);codes.push(code);}}
    const [batch]=await supabaseFetch('test_batches',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({note})});
    await supabaseFetch('test_codes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(codes.map(code=>({batch_id:batch.id,code,used_count:0})))});
    await render();document.querySelector('#adminNotice').textContent=`批次 ${note} 已保存到云端，共 ${count} 个密码。`;
  } catch(e){document.querySelector('#adminNotice').textContent='生成失败：'+e.message;button.disabled=false;}
}
async function exportLatest(){
  try {
    const [batch]=await supabaseFetch('test_batches?select=id,note&order=created_at.desc&limit=1');
    if(!batch){document.querySelector('#adminNotice').textContent='暂无批次';return;}
    const rows=await supabaseFetch('test_codes?select=code,used_count,created_at&batch_id=eq.'+encodeURIComponent(batch.id));
    const cell=value=>'"'+String(value).replace(/"/g,'""')+'"';
    const csv='\ufeff'+[['密码','批次备注','已使用次数','剩余次数','生成时间'],...rows.map(r=>[r.code,batch.note,r.used_count,3-r.used_count,r.created_at])].map(row=>row.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='最新批次密码.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){document.querySelector('#adminNotice').textContent='导出失败：'+e.message;}
}
render();
setInterval(()=>{if(!document.hidden&&!document.querySelector('#batchNote')?.value&&!document.querySelector('#generateButton')?.disabled)render();},60000);
