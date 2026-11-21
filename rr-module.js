
/* COMMISSION — MIKAEL F. KAISER / SIGNATURE — isolated module */
(() => {
  'use strict';
  if (window.__ddsRrSignatureCommission) return;
  window.__ddsRrSignatureCommission = true;
  const EDIT = 'commission-mikael-signature-editor';
  const VIEW = 'commission-mikael-signature-view';
  const ST = 'dds:commission:mikael-signature:draft';
  const ACCESS = 'dds:commission:mikael-signature:access';
  const HASH = 'eb826ef52686f3139fee3102ae3309a785481071f03a55fb0d8a5f80b5f72789';
  const STYLE = 'https://guindaeyo.github.io/commisdeepdcsh/comm-pumkiesiz.css';
  const FONTS = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;1,400&family=Playfair+Display:ital,wght@1,400&family=Allura&display=swap';
  const COLORS = [
    ['edge','ขอบนอก','#c9859a'], ['rim','ขอบสีอ่อน','#fff0f5'],
    ['panel','พื้นแผงเข้ม','#342a32'], ['panel-light','พื้นแผงอ่อน','#6d5360'],
    ['accent','สีเน้น','#e68aa7'], ['accent-light','สีเน้นอ่อน','#fbc1d1'],
    ['text','สีตัวอักษรหลัก','#fff9fc'], ['sub','สีตัวอักษรรอง','#f5d7e0'],
    ['flag-light','สีธงอ่อน','#ffffff'], ['flag-dark','สีธงเข้ม','#30272f'],
    ['check-light','สีตารางอ่อน','#a88b97'], ['check-dark','สีตารางเข้ม','#392d35']
  ];
  const MOTION = [
    ['person-x','ตำแหน่งภาพภายใน ซ้าย–ขวา',10,-200,300,1,'%'],
    ['person-y','ตำแหน่งภาพภายใน บน–ล่าง',0,-200,300,1,'%'],
    ['person-zoom','ซูม PNG',1,.2,4,.05,'×'],
    ['person-left','ตำแหน่ง PNG ทั้งภาพ ซ้าย–ขวา',4,-150,200,1,'%'],
    ['person-top','ตำแหน่ง PNG ทั้งภาพ บน–ล่าง',-12,-150,200,1,'%'],
    ['person-width','ความกว้าง PNG',39,5,200,1,'%'],
    ['person-height','ความสูง PNG',108,5,250,1,'%']
  ];
  const initialColors = Object.fromEntries(COLORS.map(([k,,v]) => [k,v]));
  const initialMotion = Object.fromEntries(MOTION.map(([k,,v]) => [k,v]));
  const sample = {
    colors:{...initialColors}, opacity:.25,
    image:'https://iili.io/oFXsOVj.png', motion:{...initialMotion},
    text:{main:'Basil B.',script:'Bloom',sub:'racingbonnie'}
  };
  const blank = {
    colors:{...initialColors}, opacity:.25, image:'', motion:{...initialMotion},
    text:{main:'',script:'',sub:''}
  };
  const clone = obj => JSON.parse(JSON.stringify(obj));
  let card,editor,view,modal,state=clone(blank),currentPreview=null;
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function safeUrl(input){const s=String(input||'').trim();return /^https?:\/\/[^\s"'<>]+$/i.test(s)?s:'';}
  function cssUrl(input){const s=safeUrl(input);return s?`url('${s}')`:'none';}
  function buildHTML(s){
    const variables=[...COLORS.map(([key])=>`--rr-${key}:${s.colors[key]||initialColors[key]}`),`--rr-check-opacity:${Number(s.opacity)}`,
      `--rr-person:${cssUrl(s.image)}`,...MOTION.map(([key,,, , , ,unit])=>`--rr-${key}:${s.motion[key]}${unit==='×'?'':unit}`)].join(';');
    return `<link href="${STYLE}" rel="stylesheet"><link href="${FONTS}" rel="stylesheet"><div class="rr-sign" style="${esc(variables)}"><div class="rr-stage"><div class="rr-left-outer rr-shape"></div><div class="rr-left-inner rr-shape"></div><div class="rr-left-core rr-shape"></div><div class="rr-left-checker rr-shape"></div><div class="rr-banner-outer rr-shape"></div><div class="rr-banner-inner rr-shape"></div><div class="rr-banner-core rr-shape"></div><div class="rr-banner-pattern"><div class="rr-checker-sweep"></div></div><div class="rr-photo-outer rr-shape"></div><div class="rr-photo-inner rr-shape"></div><div class="rr-photo-core rr-shape"></div><div class="rr-photo-crop"><div class="rr-portrait"></div></div><div class="rr-photo-gloss rr-shape"></div><div class="rr-words"><div class="rr-title"><span class="rr-main" data-rr-text="main">${esc(s.text.main)}</span><span class="rr-script" data-rr-text="script">${esc(s.text.script)}</span></div><div class="rr-mid"><span class="rr-mini"></span><span class="rr-line"></span></div><div class="rr-sub"><i class="rr-star"></i><span data-rr-text="sub">${esc(s.text.sub)}</span><i class="rr-star"></i></div><div class="rr-speed"><span></span><span></span><span></span><span></span></div><div class="rr-gauge"><div class="rr-ticks"></div><div class="rr-needle"></div><div class="rr-center"></div></div><div class="rr-flags"><span class="rr-flag-one"></span><span class="rr-flag-two"></span></div></div><div class="rr-head"><div class="rr-portrait"></div></div></div></div>`;
  }
  const sourceDoc=s=>`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}*,*::before,*::after{box-sizing:border-box}</style></head><body>${buildHTML(s)}</body></html>`;
  function patch(frame,s){try{const root=frame.contentDocument?.querySelector('.rr-sign');if(!root)return false;
    COLORS.forEach(([key])=>root.style.setProperty('--rr-'+key,s.colors[key]));
    root.style.setProperty('--rr-check-opacity',String(s.opacity));
    root.style.setProperty('--rr-person',cssUrl(s.image));
    MOTION.forEach(([key,,,,,,unit])=>root.style.setProperty('--rr-'+key,s.motion[key]+(unit==='×'?'':unit)));
    for(const key of Object.keys(s.text)){const node=root.querySelector(`[data-rr-text="${key}"]`);if(node)node.textContent=s.text[key];}
    return true;
  }catch{return false;}}
  function initFrame(frame,s){if(!frame)return;frame.dataset.rrReady='no';frame.addEventListener('load',()=>{frame.dataset.rrReady='yes';fit(frame);},{once:true});frame.style.width='800px';frame.style.height='360px';frame.srcdoc=sourceDoc(s);}
  function fit(frame){if(!frame?.isConnected||frame.dataset.rrReady!=='yes')return;
    const host=frame.closest('[data-rr-host]');if(!host)return;
    const available=Math.max(1,host.clientWidth-20);
    const root=frame.contentDocument?.querySelector('.rr-sign');
    const dimensions=root?.getBoundingClientRect();
    const naturalWidth=Math.max(1,Math.ceil(dimensions?.width||720));
    const naturalHeight=Math.max(1,Math.ceil(dimensions?.height||260));
    const scale=Math.min(1,available/naturalWidth);
    frame.style.width=naturalWidth+'px';frame.style.height=naturalHeight+'px';
    frame.style.transform=`scale(${scale})`;
    frame.style.marginLeft=-(naturalWidth/2)+'px';
    if(frame.hasAttribute('data-rr-card-frame')){frame.style.marginLeft='0px';frame.style.left='50%';frame.style.top='50%';frame.style.transform=`translate(-50%,-50%) scale(${scale})`;}
    if(!frame.hasAttribute('data-rr-card-frame'))host.style.height=Math.max(30,Math.ceil(naturalHeight*scale)+8)+'px';
    host.style.setProperty('--rr-fit-width',Math.ceil(naturalWidth*scale)+'px');
  }
  function load(){try{const data=JSON.parse(localStorage.getItem(ST));if(data&&typeof data==='object')return {colors:{...initialColors,...data.colors},opacity:data.opacity??.25,image:data.image||'',motion:{...initialMotion,...data.motion},text:{...blank.text,...data.text}};}catch{}return clone(blank);}
  function persist(){try{localStorage.setItem(ST,JSON.stringify(state));}catch{}}
  function show(name){document.querySelectorAll('.dds-panel').forEach(p=>p.classList.toggle('is-active',p.dataset.panel===name));document.querySelectorAll('.dds-nav-button').forEach(b=>b.classList.toggle('is-active',b.dataset.page==='commission'));document.body.classList.toggle('dds-editor-mode',name===VIEW);document.documentElement.classList.toggle('dds-editor-mode',name===VIEW);window.scrollTo({top:0,behavior:'instant'});}
  function back(event){event?.preventDefault();document.body.classList.remove('dds-editor-mode','dds-modal-open');document.documentElement.classList.remove('dds-editor-mode');history.replaceState({},'','#commission');show('commission');document.querySelector('[data-work-tab="commission"]')?.click();}
  function makeSection(n,title,inner){return `<section class="dds-control-section"><div class="dds-control-title"><span>${n}</span><h2>${title}</h2></div>${inner}</section>`;}
  function makeTextField(label,key){return `<label class="dds-rr-field"><span>${esc(label)}</span><input type="text" data-rr-textfield="${key}" value="" autocomplete="off"></label>`;}
  function createEditor(){if(editor?.isConnected)return editor;editor=document.createElement('section');editor.className='dds-panel dds-rr-commission-editor';editor.dataset.panel=EDIT;editor.innerHTML=`<div class="dds-editor-heading"><button type="button" class="dds-back-button" data-rr-back>←</button><div><p class="dds-eyebrow">SIGNATURE CODE EDITOR</p><h1>COMMISSION — โคดประเภทลายเซ็น</h1><p>MIKAEL F. KAISER · สี รูป PNG ข้อความ และตำแหน่งรูป</p></div></div><div class="dds-rr-layout"><div class="dds-rr-preview-col"><div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>MIKAEL / SIGNATURE</strong></div><div class="dds-rr-preview-surface"><div class="dds-rr-preview-host" data-rr-host><iframe data-rr-editor-frame title="Signature editor preview" scrolling="no"></iframe></div></div></div><div class="dds-rr-controls"><div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่างอัตโนมัติ</strong><small data-rr-status>พร้อมแก้ไข</small></div></div><div class="dds-rr-control-scroll">${makeSection('01','สีทั้งหมด',`<div class="dds-rr-control-grid">${COLORS.map(([key,label])=>`<label class="dds-rr-field"><span>${esc(label)} — --rr-${key}</span><div class="dds-rr-color"><input type="color" data-rr-color="${key}" value="${initialColors[key]}"><input type="text" data-rr-hex="${key}" value="${initialColors[key]}" spellcheck="false"></div></label>`).join('')}<label class="dds-rr-field"><span>ความโปร่งใสของลายตาราง</span><input type="range" data-rr-opacity min="0" max="1" step=".01" value=".25"><output data-rr-opacity-value>.25</output></label></div>`)}${makeSection('02','รูป PNG — เปลี่ยนและปรับตำแหน่ง',`<div class="dds-rr-control-grid"><label class="dds-rr-field dds-rr-wide"><span>ลิงก์รูป PNG (พื้นหลังโปร่งใส)</span><input type="url" data-rr-image placeholder="วางลิงก์รูป PNG ที่นี่"></label>${MOTION.map(([key,label,,min,max,step,unit])=>`<label class="dds-rr-field"><span>${esc(label)}</span><div class="dds-rr-range"><input type="range" data-rr-range="${key}" min="${min}" max="${max}" step="${step}"><output data-rr-output="${key}">${unit}</output></div></label>`).join('')}</div>`)}${makeSection('03','ข้อความบนลายเซ็น',`<div class="dds-rr-control-grid">${makeTextField('ชื่อหลัก','main')}${makeTextField('ชื่อตัวเขียน','script')}${makeTextField('ข้อความรอง','sub')}</div>`)}</div><section class="dds-protected-commission-copy dds-rr-central-copy"><div class="dds-control-title"><span>04</span><h2>คัดลอกโคด</h2></div><div class="dds-protected-commission-copy-actions"><button type="button" data-rr-copy>COPY CODE <span>↗</span></button><button type="button" data-rr-reset>RESET</button></div></section></div></div>`;
    (document.querySelector('.dds-footer')||document.querySelector('.dds-main')||document.body).before(editor);
    editor.querySelector('[data-rr-back]').addEventListener('click',back);
    editor.querySelector('[data-rr-copy]').addEventListener('click',copyCode);
    editor.querySelector('[data-rr-reset]').addEventListener('click',()=>{if(!confirm('คืนค่าลายเซ็นเริ่มต้นที่ไม่มีรูปและข้อความหรือไม่?'))return;state=clone(blank);fillInputs();patch(currentPreview,state);persist();});
    editor.addEventListener('input',changeValue);
    editor.addEventListener('change',changeValue);
    return editor;
  }
  function fillInputs(){if(!editor)return;COLORS.forEach(([key])=>{editor.querySelector(`[data-rr-color="${key}"]`).value=state.colors[key];editor.querySelector(`[data-rr-hex="${key}"]`).value=state.colors[key];});editor.querySelector('[data-rr-image]').value=state.image;editor.querySelector('[data-rr-opacity]').value=state.opacity;editor.querySelector('[data-rr-opacity-value]').textContent=state.opacity;
    MOTION.forEach(([key,,,,,,unit])=>{editor.querySelector(`[data-rr-range="${key}"]`).value=state.motion[key];editor.querySelector(`[data-rr-output="${key}"]`).textContent=state.motion[key]+unit;});
    Object.keys(state.text).forEach(key=>editor.querySelector(`[data-rr-textfield="${key}"]`).value=state.text[key]);}
  function changeValue(e){const t=e.target;if(!(t instanceof HTMLInputElement))return;
    if(t.dataset.rrColor){state.colors[t.dataset.rrColor]=t.value;editor.querySelector(`[data-rr-hex="${t.dataset.rrColor}"]`).value=t.value;}
    else if(t.dataset.rrHex){if(!/^#[\da-f]{6}$/i.test(t.value.trim()))return;state.colors[t.dataset.rrHex]=t.value.trim();editor.querySelector(`[data-rr-color="${t.dataset.rrHex}"]`).value=t.value.trim();}
    else if(t.hasAttribute('data-rr-image'))state.image=t.value;
    else if(t.dataset.rrRange){state.motion[t.dataset.rrRange]=Number(t.value);const setting=MOTION.find(([key])=>key===t.dataset.rrRange);editor.querySelector(`[data-rr-output="${t.dataset.rrRange}"]`).textContent=t.value+setting[6];}
    else if(t.hasAttribute('data-rr-opacity')){state.opacity=Number(t.value);editor.querySelector('[data-rr-opacity-value]').textContent=t.value;}
    else if(t.dataset.rrTextfield)state.text[t.dataset.rrTextfield]=t.value;
    else return;
    patch(currentPreview,state);persist();editor.querySelector('[data-rr-status]').textContent='บันทึกแล้ว';
  }
  function copyCode(){const code='<br>'+buildHTML(state);navigator.clipboard?.writeText(code).then(()=>{editor.querySelector('[data-rr-status]').textContent='คัดลอกโคดแล้ว';}).catch(()=>{const a=document.createElement('textarea');a.value=code;document.body.append(a);a.select();document.execCommand('copy');a.remove();});}
  function openEditor(route=false){createEditor();state=load();fillInputs();show(EDIT);if(!route)history.pushState({},'','#'+EDIT);currentPreview=editor.querySelector('[data-rr-editor-frame]');if(currentPreview.dataset.rrReady==='yes'){patch(currentPreview,state);fit(currentPreview);}else initFrame(currentPreview,state);}
  function makeView(){if(view?.isConnected)return;view=document.createElement('section');view.className='dds-panel dds-commission-view-panel dds-rr-view';view.dataset.panel=VIEW;view.innerHTML=`<div class="dds-commission-view-toolbar"><button type="button" class="dds-back-button" data-rr-back>←</button></div><div class="dds-rr-view-surface"><div class="dds-rr-view-host" data-rr-host><iframe data-rr-view-frame title="Signature preview" scrolling="no"></iframe></div></div>`;(document.querySelector('.dds-footer')||document.querySelector('.dds-main')||document.body).before(view);view.querySelector('[data-rr-back]').addEventListener('click',back);}
  function openView(route=false){makeView();show(VIEW);if(!route)history.pushState({},'','#'+VIEW);const f=view.querySelector('[data-rr-view-frame]');if(f.dataset.rrReady==='yes')fit(f);else initFrame(f,sample);}
  function makeModal(){if(modal?.isConnected)return;modal=document.createElement('div');modal.className='dds-commission-lock-modal';modal.hidden=true;modal.innerHTML=`<form class="dds-commission-lock-dialog"><small>CLIENT ACCESS / MIKAEL F. KAISER</small><h2>Protected editor</h2><p>กรอกรหัสเพื่อแก้ไขโคดลายเซ็น</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-rr-cancel>CANCEL</button></div></form>`;document.body.append(modal);modal.querySelector('[data-rr-cancel]').onclick=()=>modal.hidden=true;modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const input=modal.querySelector('input');const err=modal.querySelector('.dds-commission-lock-error');try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value));const h=Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');if(h!==HASH){err.textContent='รหัสผ่านไม่ถูกต้อง';return;}sessionStorage.setItem(ACCESS,'1');modal.hidden=true;openEditor(location.hash==='#'+EDIT);}catch{err.textContent='ไม่สามารถตรวจสอบรหัสในขณะนี้';}};}
  function requestEdit(route=false){if(sessionStorage.getItem(ACCESS)==='1'){openEditor(route);return;}makeModal();modal.hidden=false;modal.querySelector('input').value='';modal.querySelector('.dds-commission-lock-error').textContent='';modal.querySelector('input').focus();}
  function install(){if(card?.isConnected)return true;const grid=document.querySelector('[data-work-panel="commission"] .dds-commission-grid')||document.querySelector('.dds-commission-grid');if(!grid)return false;if(grid.querySelector('.dds-rr-signature-card'))return true;
    card=document.createElement('article');card.className='dds-roleplay-card dds-commission-card dds-rr-signature-card';card.innerHTML=`<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><div class="dds-rr-card-host" data-rr-host><iframe data-rr-card-frame class="dds-rr-card-preview-frame" loading="lazy" scrolling="no" tabindex="-1" title="MIKAEL Signature sample"></iframe></div><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โคดประเภทลายเซ็น</p><p class="dds-commission-card-client">ผู้จ้าง <strong>MIKAEL F. KAISER</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-rr-view>VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-rr-edit>EDIT CODE <span>↗</span></button></div></div>`;grid.append(card);card.querySelector('[data-rr-view]').onclick=()=>openView();card.querySelector('[data-rr-edit]').onclick=()=>requestEdit();initFrame(card.querySelector('[data-rr-card-frame]'),sample);return true;
  }
  function route(){if(location.hash==='#'+EDIT&&!editor?.classList.contains('is-active'))requestEdit(true);else if(location.hash==='#'+VIEW&&!view?.classList.contains('is-active'))openView(true);}
  function start(){let count=0;const timer=setInterval(()=>{if(install()||++count>100)clearInterval(timer);},120);window.addEventListener('resize',()=>document.querySelectorAll('[data-rr-card-frame],[data-rr-editor-frame],[data-rr-view-frame]').forEach(fit));window.addEventListener('hashchange',route);window.addEventListener('popstate',route);setTimeout(route,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
