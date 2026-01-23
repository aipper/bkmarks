import { js as baseJs } from './ui'

function replaceOnce(source: string, search: string, replacement: string) {
  const idx = source.indexOf(search)
  if (idx === -1) return { value: source, replaced: false }
  return { value: source.replace(search, replacement), replaced: true }
}

export function js() {
  let out = baseJs()

  const confirmSnippet =
    "let confirmInit=false;let confirmState=null;function confirmEls(){return{modal:document.getElementById('confirmModal'),backdrop:document.getElementById('confirmBackdrop'),close:document.getElementById('confirmClose'),cancel:document.getElementById('confirmCancel'),ok:document.getElementById('confirmOk'),title:document.getElementById('confirmTitle'),subtitle:document.getElementById('confirmSubtitle'),body:document.getElementById('confirmBody')}}function closeConfirm(){const el=confirmEls();if(el.modal)el.modal.classList.add('hidden');document.body.classList.remove('modal-open');confirmState=null}function ensureConfirm(){if(confirmInit)return;confirmInit=true;const el=confirmEls();if(!el.modal)return;const close=()=>closeConfirm();[el.backdrop,el.close,el.cancel].forEach((b)=>b&&b.addEventListener('click',close));if(el.ok)el.ok.addEventListener('click',async()=>{const st=confirmState;if(!st||st.busy)return;st.busy=true;const okText=st.okText||'确定';const loadingText=st.loadingText||'处理中…';if(el.ok){el.ok.disabled=true;el.ok.textContent=loadingText}try{if(typeof st.onOk==='function')await st.onOk();closeConfirm()}catch{alert('操作失败');closeConfirm()}finally{if(el.ok){el.ok.disabled=false;el.ok.textContent=okText}st.busy=false}});document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&confirmState)closeConfirm()})}function openConfirm(opts){ensureConfirm();const el=confirmEls();if(!el.modal)return;confirmState={...opts,busy:false};if(el.title)el.title.textContent=opts.title||'确认操作';if(el.subtitle)el.subtitle.textContent=opts.subtitle||'';if(el.ok){el.ok.textContent=opts.okText||'确定';el.ok.classList.toggle('danger',!!opts.danger)}if(el.body){el.body.innerHTML='';if(opts.body){const d=document.createElement('div');d.textContent=opts.body;el.body.appendChild(d)}if(opts.hint){const h=document.createElement('div');h.className='confirm-hint';h.textContent=opts.hint;el.body.appendChild(h)}}document.body.classList.add('modal-open');el.modal.classList.remove('hidden')}"

  const batchSnippet =
    "let batchAiBusy=false;function setBatchAiInfo(t){const el=document.getElementById('batchAiInfo');if(el)el.textContent=t||''}async function batchAi(btn){if(batchAiBusy)return;const q=((elSearch&&elSearch.value)||'').toLowerCase();const filtered=items.filter(it=>{const inTag=activeTag==='全部'||(it.tags||[]).includes(activeTag);const str=(it.title||'')+' '+(it.url||'');const inSearch=str.toLowerCase().includes(q);return inTag&&inSearch});const todo=filtered.filter(it=>!it.aiCheckedAt);if(!todo.length){setBatchAiInfo('暂无待识别');return}openConfirm({title:'批量AI识别',subtitle:`范围：当前筛选（${todo.length}条未识别）`,body:'将对未识别的书签逐条调用 AI 分类。',hint:'可能消耗配额；已识别的不会重复识别。',okText:'开始',loadingText:'开始中…',onOk:async()=>{batchAiBusy=true;const original=(btn&&btn.textContent)||'批量AI识别';if(btn){btn.disabled=true}let ok=0;let skipped=0;let failed=0;let limited=0;for(let i=0;i<todo.length;i++){const it=todo[i];if(btn)btn.textContent=`识别中 ${i+1}/${todo.length}`;try{const r=await fetch('/api/ai/classify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:it.url,title:it.title||''})});if(r.status===429){limited=todo.length-i;break}if(!r.ok){failed++;continue}const j=await r.json();if(j&&j.skipped)skipped++;else ok++}catch{failed++}}if(btn){btn.disabled=false;btn.textContent=original}batchAiBusy=false;await fetchItems();const parts=[];if(ok)parts.push(`成功${ok}`);if(skipped)parts.push(`跳过${skipped}`);if(failed)parts.push(`失败${failed}`);if(limited)parts.push(`配额不足剩余${limited}`);setBatchAiInfo(parts.length?`批量识别：${parts.join('，')}`:'批量识别完成')}})}document.addEventListener('click',(e)=>{const t=e.target;const btn=t&&t.closest?t.closest('#batchAiBtn'):null;if(!btn)return;e.preventDefault();e.stopPropagation();batchAi(btn)});"

  const delCode =
    "const delBtn=document.createElement('button');delBtn.type='button';delBtn.className='ai-btn danger';delBtn.textContent='删除';delBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();openConfirm({title:'删除书签？',subtitle:it.title||it.url,body:(host||it.url),hint:'仅删除服务器记录，本地 Chrome 书签不受影响；扩展“全量同步”会自动跳过该 URL。',okText:'删除',loadingText:'删除中…',danger:true,onOk:async()=>{const r=await fetch('/api/bookmarks/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:it.url})});if(!r.ok)throw new Error('bad');await fetchItems()}})});"

  out = replaceOnce(
    out,
    "finally{if(el.save)el.save.disabled=false}}function ensureTagEditor(){",
    "finally{if(el.save)el.save.disabled=false}}" + confirmSnippet + batchSnippet + 'function ensureTagEditor(){'
  ).value

  out = replaceOnce(
    out,
    "card.addEventListener('keydown',(e)=>{if(e.key==='Enter')window.open(it.url,'_blank')});",
    "card.addEventListener('keydown',(e)=>{if(e.target.closest('.ai-btn'))return;if(e.key==='Enter')window.open(it.url,'_blank')});"
  ).value

  const aiBlock =
    "if(it.aiCheckedAt){aiBtn.textContent='已识别';aiBtn.disabled=true}else{aiBtn.textContent='AI识别';aiBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();runAi(it,aiBtn)})}"
  out = replaceOnce(out, aiBlock, aiBlock + delCode).value

  out = replaceOnce(
    out,
    'meta.appendChild(u);meta.appendChild(st);meta.appendChild(editBtn);meta.appendChild(aiBtn);',
    'meta.appendChild(u);meta.appendChild(st);meta.appendChild(editBtn);meta.appendChild(aiBtn);meta.appendChild(delBtn);'
  ).value

  out = replaceOnce(
    out,
    '<div class="user-menu" role="menu"><a class="menu-item" href="/app/profile">个人中心</a>',
    '<div class="user-menu" role="menu"><a class="menu-item" href="/app">书签主页</a><a class="menu-item" href="/app/profile">个人中心</a>'
  ).value

  out = replaceOnce(
    out,
    "const nav=[{id:'profile',label:'个人中心',href:'/app/profile'},{id:'settings',label:'系统设置',href:'/app/settings'},{id:'status',label:'系统状态',href:'/app/status'},{id:'tags',label:'标签管理',href:'/app/tags'}];",
    "const nav=[{id:'bookmarks',label:'书签主页',href:'/app'},{id:'profile',label:'个人中心',href:'/app/profile'},{id:'settings',label:'系统设置',href:'/app/settings'},{id:'status',label:'系统状态',href:'/app/status'},{id:'tags',label:'标签管理',href:'/app/tags'}];"
  ).value

  return out
}
