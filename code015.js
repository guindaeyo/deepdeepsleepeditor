(() => {
  'use strict';
  const KEY='dds-code-draft-v3:code015';
  const STYLE='https://guindaeyo.github.io/deepdshop/ddsh-cyworld.css';
  const PHOTO='https://i.pinimg.com/1200x/9e/e6/78/9ee678c67394c3bbf00e789eebdebdc8.jpg';
  const DEMO={world:"frk's world",folder1:'001',folder2:'002',account:'deadbutrich',filename:'Franklin D. Bloodworth.exe',photo:PHOTO,roleplay:'คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊',music:'0X1=LOVESONG - TXT',linkLabel:'click me'};
  const COLORS={bg:'#eefbff',window:'#ffffff',green:'#d8ffc0',greenTop:'#f2ffe9',pink:'#f6b5ee',blue:'#b6f3ff',border:'#171717',text:'#171717',rpBg:'#ffffff',pillTop:'#ffffff',pillMiddle:'#fde5f9',userTop:'#ffffff',controlBg:'#ffffff'};
  const labels={bg:'พื้นหลัง',window:'พื้นหน้าต่าง',green:'สีเขียว',greenTop:'สีเขียวอ่อนด้านบน',pink:'สีชมพู',blue:'สีฟ้า',border:'เส้นขอบ',text:'สีตัวอักษร',rpBg:'พื้นหลังโรลเพลย์',pillTop:'พื้นหลังแท็บด้านบน',pillMiddle:'พื้นหลังแท็บตรงกลาง',userTop:'พื้นหลังชื่อบัญชี',controlBg:'พื้นหลังปุ่มควบคุม'};
  const BLANK=()=>({...COLORS,world:'',folder1:'',folder2:'',account:'',filename:'',photo:'',roleplay:'',music:'',linkLabel:'',musicUrl:'',linkUrl:'',photoX:50,photoY:50,photoZoom:100});
  let state=BLANK(),panel=null,frameTimer=0,saveTimer=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
  const cssVars=s=>Object.entries(COLORS).map(([k])=>'--syre-'+({'greenTop':'green-top',rpBg:'rp-bg',pillTop:'pill-top',pillMiddle:'pill-middle',userTop:'user-top',controlBg:'control-bg'}[k]||k)+':'+( /^#[\da-f]{6}$/i.test(s[k])?s[k]:COLORS[k])).join(';');
  const plainBB=s=>esc(s).replace(/\[b\]([\s\S]*?)\[\/b\]/gi,'<strong>$1</strong>').replace(/\[i\]([\s\S]*?)\[\/i\]/gi,'<em>$1</em>').replace(/\[u\]([\s\S]*?)\[\/u\]/gi,'<u>$1</u>').replace(/\[s\]([\s\S]*?)\[\/s\]/gi,'<s>$1</s>').replace(/\[color=(#[0-9a-f]{6})\]([\s\S]*?)\[\/color\]/gi,'<span style="color:$1">$2</span>').replace(/\n/g,'<br>');
  // Keep the photo's crop/zoom rules *inside the exported HTML*, not just the editor iframe.
  const photoNumber=(value,fallback,min,max)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
  function photoStyles(s){
    const x=photoNumber(s.photoX,50,0,100);
    const y=photoNumber(s.photoY,50,0,100);
    const zoom=photoNumber(s.photoZoom,100,50,250)/100;
    // Translate within the extra image area created by zoom, keeping the photo clipped.
    const tx=(50-x)*Math.max(0,zoom-1);
    const ty=(50-y)*Math.max(0,zoom-1);
    return `position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:${x}% ${y}%!important;transform-origin:50% 50%!important;transform:translate(${tx}%,${ty}%) scale(${zoom})!important;transition:none!important`;
  }
  // Change only the edited node. Replacing srcdoc on each keystroke causes a visible flash.
  function patchLivePreview(key){
    const iframe=panel?.querySelector('[data-015-preview]');
    const doc=iframe?.contentDocument;
    const root=doc?.querySelector('.ddsh-syre');
    if(!root){pendingLiveKeys.add(key);return;}
    if(Object.prototype.hasOwnProperty.call(COLORS,key)){
      const name=({'greenTop':'green-top',rpBg:'rp-bg',pillTop:'pill-top',pillMiddle:'pill-middle',userTop:'user-top',controlBg:'control-bg'}[key]||key);
      root.style.setProperty('--syre-'+name,/^#[\da-f]{6}$/i.test(state[key])?state[key]:COLORS[key]);
      return;
    }
    const selectors={world:'.ddsh-syre-brand',folder1:'.ddsh-syre-top .ddsh-syre-folder:nth-child(2)',folder2:'.ddsh-syre-top .ddsh-syre-folder:nth-child(3)',account:'.ddsh-syre-user',filename:'.ddsh-syre-rplabel',roleplay:'.ddsh-syre-rptext',music:'.ddsh-syre-music span',linkLabel:'.ddsh-syre-link span'};
    if(key==='photo'){
      const holder=root.querySelector('.ddsh-syre-photo');
      if(!holder)return;
      let img=holder.querySelector('img');
      if(!safeUrl(state.photo)){img?.remove();return;}
      if(!img){img=doc.createElement('img');holder.append(img);}
      if(img.getAttribute('src')!==safeUrl(state.photo))img.setAttribute('src',safeUrl(state.photo));
      img.setAttribute('style',photoStyles(state));
      return;
    }
    if(key==='photoX'||key==='photoY'||key==='photoZoom'){
      applyPhotoTransform(iframe);return;
    }
    if(key==='musicUrl'||key==='linkUrl'){
      const a=root.querySelector(key==='musicUrl'?'.ddsh-syre-music':'.ddsh-syre-link');
      if(a){a.setAttribute('href',safeUrl(state[key])||'#');}
      return;
    }
    const el=root.querySelector(selectors[key]||'.__no_match__');
    if(!el)return;
    if(key==='roleplay'){el.innerHTML=plainBB(state[key]);requestFit(iframe,true);}
    else if(key==='account'){let span=el.querySelector('span');if(!span){span=doc.createElement('span');el.prepend(span);}span.textContent='@';el.replaceChildren(span,doc.createTextNode(state.account));}
    else if(key==='filename'){let ico=el.querySelector('i');el.replaceChildren(...(ico?[ico]:[]),doc.createTextNode(' '+state.filename));}
    else if(key==='folder1'||key==='folder2'){let ico=el.querySelector('i');el.replaceChildren(...(ico?[ico]:[]),doc.createTextNode(' '+state[key]));}
    else el.textContent=state[key];
  }
  function expandIfNeeded(iframe){
    requestFit(iframe,true);
  }
  function applyPhotoTransform(iframe){
    const img=iframe?.contentDocument?.querySelector('.ddsh-syre-photo img');
    if(img){img.setAttribute('style',photoStyles(state));}
  }
  function codeMarkup(s){
    const a=(txt,klass,url,icon)=>`<a class="ddsh-syre-pill ${klass}" href="${esc(safeUrl(url)||'#')}"${safeUrl(url)?' target="_blank" rel="noopener noreferrer"':''}><i class="bi ${icon}"></i> <span>${esc(txt)}</span></a>`;
    return `<div class="ddsh-syre" style="${cssVars(s)}"><div class="ddsh-syre-top"><a class="ddsh-syre-pill ddsh-syre-brand" href="#">${esc(s.world)}</a><a class="ddsh-syre-pill ddsh-syre-folder" href="#"><i class="bi bi-folder-fill"></i> ${esc(s.folder1)}</a><a class="ddsh-syre-pill ddsh-syre-folder" href="#"><i class="bi bi-folder-fill"></i> ${esc(s.folder2)}</a></div><div class="ddsh-syre-window"><div class="ddsh-syre-toolbar"><div class="ddsh-syre-user"><span>@</span>${esc(s.account)}</div><div class="ddsh-syre-controls"><span><i class="bi bi-x-lg"></i></span><span><i class="bi bi-dash-lg"></i></span><span><i class="bi bi-copy"></i></span></div></div><div class="ddsh-syre-content"><div class="ddsh-syre-photo" style="position:relative!important;overflow:hidden!important">${safeUrl(s.photo)?`<img src="${esc(safeUrl(s.photo))}" style="${photoStyles(s)}">`:''}</div><div class="ddsh-syre-rp"><div class="ddsh-syre-rpbox"><div class="ddsh-syre-rplabel"><i class="bi bi-chevron-right"></i> ${esc(s.filename)}</div><div class="ddsh-syre-rptext">${plainBB(s.roleplay)}</div></div></div></div></div><div class="ddsh-syre-bottom">${a(s.music,'ddsh-syre-music',s.musicUrl,'bi-music-note-beamed')}${a(s.linkLabel,'ddsh-syre-link',s.linkUrl,'bi-suit-heart-fill')}</div></div><div class="ddshcr-ccyword"><span></span></div>`;
  }
  function docHTML(s,card=false){return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${STYLE}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&family=DotGothic16&display=swap"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"><style>html,body{margin:0;overflow:hidden!important;background:transparent;scrollbar-width:none!important;scrollbar-color:transparent transparent!important}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}body{width:800px;min-height:50px;height:auto!important;max-height:none!important} .ddsh-syre{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important} .ddsh-syre-photo{overflow:hidden}.ddsh-syre-photo img{width:100%;height:100%;object-fit:cover}</style></head><body>${codeMarkup(s)}<div data-code015-end style="height:1px!important;clear:both!important;display:block!important"></div></body></html>`;}
  const colorField=(k)=>`<label class="dds-color-field"><span>${labels[k]}</span><div><input type="color" data-015-picker="${k}" value="${COLORS[k]}"><input type="text" data-015="${k}" data-dds-v236-counter="true" value="${COLORS[k]}"></div></label>`;
  const field=(label,key,kind='text')=>`<label class="dds-field"><span>${label}</span><input type="${kind}" data-015="${key}" data-dds-field-key="code015-${key}" value=""></label>`;
  const row=(label,key,min,max,value)=>`<label class="dds-position-row"><span>${label}</span><small>${key==='photoZoom'?'ออก':'ต้น'}</small><input data-015="${key}" type="range" min="${min}" max="${max}" value="${value}"><small>${key==='photoZoom'?'เข้า':'ปลาย'}</small><output data-015-output="${key}">${value}%</output></label>`;
  function createPanel(){
    panel=document.createElement('section');panel.className='dds-panel dds-protected-commission-editor dds-code015-editor';panel.dataset.panel='editor-code015';
    panel.innerHTML=`<div class="dds-editor-heading"><div><p class="dds-eyebrow">ROLEPLAY CODE EDITOR</p><h1>cyworld.exe</h1><p>click click post!</p></div></div><div class="dds-protected-commission-layout"><div class="dds-protected-commission-preview-column"><div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>CODE015</strong></div><div class="dds-code015-stage"><div class="dds-code015-fit"><iframe title="CODE015 live preview" data-015-preview></iframe></div></div></div><div class="dds-protected-commission-controls-column"><div class="dds-code015-savebar"><div><strong>บันทึกแบบร่าง</strong><small data-015-status>ยังไม่มีแบบร่าง</small></div><input data-015-save-name placeholder="กรอกชื่อการบันทึก"><button type="button" data-015-save>SAVE AS</button><select data-015-saves><option value="">กดเพื่อเลือกไฟล์ที่บันทึก</option></select><button type="button" data-015-load>LOAD</button><button type="button" data-015-delete>DELETE</button></div><div class="dds-protected-commission-scroll"><section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโคด</h2></div><div class="dds-color-grid">${Object.keys(COLORS).map(colorField).join('')}</div></section><section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>ชื่อ World / โฟลเดอร์</h2></div><div class="dds-form-grid">${field('ชื่อ World','world')}${field('ชื่อไฟล์ 001','folder1')}${field('ชื่อไฟล์ 002','folder2')}</div></section><section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>ชื่อบัญชีและชื่อไฟล์</h2></div><div class="dds-form-grid">${field('ชื่อแอคเค้า','account')}${field('ชื่อไฟล์ .exe','filename')}</div></section><section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>รูปภาพ</h2></div><div class="dds-form-grid">${field('URL รูปภาพ','photo','url')}</div><div class="dds-image-position">${row('ตำแหน่งรูป แนวนอน','photoX',0,100,50)}${row('ตำแหน่งรูป แนวตั้ง','photoY',0,100,50)}${row('ซูมรูป','photoZoom',50,250,100)}</div></section><section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>เนื้อหาโรลเพลย์</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความโรลเพลย์</span><textarea id="dds-code015-roleplay" data-015="roleplay" data-dds-field-key="code015-roleplay" rows="8" placeholder="เพิ่มเนื้อหาโรลเพลย์..."></textarea><div class="dds-word-counter" data-015-counter><span class="dds-word-counter-label">จำนวนคำ</span> <strong><span data-015-count>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label></div></section><section class="dds-control-section"><div class="dds-control-title"><span>06</span><h2>เพลงและลิงก์</h2></div><div class="dds-form-grid">${field('ชื่อเพลง','music')}${field('ข้อความ Click me','linkLabel')}${field('URL เพลง (จะใส่ก็ได้ ไม่ใส่ก็ได้)','musicUrl','url')}${field('URL ลิงก์ (จะใส่ก็ได้ ไม่ใส่ก็ได้)','linkUrl','url')}</div></section></div><section class="dds-protected-commission-copy"><div class="dds-control-title"><span>07</span><h2>คัดลอกโคด</h2></div><div class="dds-protected-commission-copy-actions"><button type="button" data-015-copy>COPY CODE <span>↗</span></button><button type="button" data-015-reset>RESET</button></div></section></div></div>`;
    document.querySelector('.dds-main')?.append(panel);
    panel.querySelectorAll('[data-015]').forEach(el=>el.addEventListener('input',()=>{state[el.dataset['015']]=el.value;const k=el.dataset['015'];panel.querySelector(`[data-015-output="${k}"]`)?.replaceChildren(document.createTextNode(el.value+'%'));const picker=panel.querySelector(`[data-015-picker="${k}"]`);if(picker&&/^#[\da-f]{6}$/i.test(el.value))picker.value=el.value;updateCounter();patchLivePreview(k);scheduleSave();}));
    panel.querySelectorAll('[data-015-picker]').forEach(el=>el.addEventListener('input',()=>{let k=el.dataset['015Picker'];state[k]=el.value;panel.querySelector(`[data-015="${k}"]`).value=el.value;patchLivePreview(k);scheduleSave();}));
    panel.querySelector('[data-015-copy]').onclick=()=>{const code=`<link href="${STYLE}" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&family=DotGothic16&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">`+codeMarkup(state);navigator.clipboard.writeText(code).then(()=>{panel.querySelector('[data-015-copy]').textContent='COPIED ✓';setTimeout(()=>panel.querySelector('[data-015-copy]').textContent='COPY CODE ↗',1200)}).catch(()=>{});};
    panel.querySelector('[data-015-reset]').onclick=()=>{state=BLANK();sync();scheduleSave();};
    panel.querySelector('[data-015-save]').onclick=()=>{const name=panel.querySelector('[data-015-save-name]').value.trim();if(!name)return;let saves=JSON.parse(localStorage.getItem(KEY+':named')||'{}');saves[name]={...state};localStorage.setItem(KEY+':named',JSON.stringify(saves));refreshSaves();panel.querySelector('[data-015-saves]').value=name;};
    panel.querySelector('[data-015-load]').onclick=()=>{let name=panel.querySelector('[data-015-saves]').value;let saves=JSON.parse(localStorage.getItem(KEY+':named')||'{}');if(saves[name]){state={...BLANK(),...saves[name]};sync();}};
    panel.querySelector('[data-015-delete]').onclick=()=>{let name=panel.querySelector('[data-015-saves]').value;let saves=JSON.parse(localStorage.getItem(KEY+':named')||'{}');delete saves[name];localStorage.setItem(KEY+':named',JSON.stringify(saves));refreshSaves();};
    if(typeof window.__ddsInstallBbcodeToolbarForTarget==='function')window.__ddsInstallBbcodeToolbarForTarget(panel.querySelector('[data-015="roleplay"]'));
    new MutationObserver(()=>{const el=panel.querySelector('[data-015="roleplay"]');if(el&&state.roleplay!==el.value){state.roleplay=el.value;updateCounter();patchLivePreview('roleplay');scheduleSave();}}).observe(panel.querySelector('.dds-protected-commission-scroll'),{childList:true,subtree:true});
    refreshSaves();sync();return panel;
  }
  function refreshSaves(){let select=panel.querySelector('[data-015-saves]');let saves={};try{saves=JSON.parse(localStorage.getItem(KEY+':named')||'{}')}catch{}select.innerHTML='<option value="">กดเพื่อเลือกไฟล์ที่บันทึก</option>'+Object.keys(saves).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');}
  function sync(){panel.querySelectorAll('[data-015]').forEach(el=>el.value=state[el.dataset['015']]??'');panel.querySelectorAll('[data-015-picker]').forEach(el=>el.value=state[el.dataset['015Picker']]);updateCounter();if(previewReady){Object.keys(state).forEach(patchLivePreview);requestFit(panel.querySelector('[data-015-preview]'),true);}else render();}
  function updateCounter(){let text=state.roleplay.replace(/\[[^\]]+\]/g,'').trim();let words=(text.match(/[\p{Script=Thai}]+|[\p{L}\p{N}]+/gu)||[]).length;panel.querySelector('[data-015-count]').textContent=words;}
  function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(state));panel.querySelector('[data-015-status]').textContent='บันทึกแล้ว';}catch{}},180);}
  // CODE015: give the embedded document an independent, generous layout viewport.
  // The size of the viewport MUST NEVER be used as the artwork's measured height.
  // Photo zoom/position only affects the image; never rebuild or refit the artwork.
  let fitObserver=null,fitPending=0,previewVersion=0,previewReady=false;
  const pendingLiveKeys=new Set();
  const CODE015_WIDTH=800;
  const CODE015_SAFE_VIEWPORT=3200;
  function artworkHeight(doc){
    const root=doc.querySelector('.ddsh-syre');
    if(!root)return 0;
    const top=doc.body.getBoundingClientRect().top;
    const bottomOf=(el)=>{
      if(!el)return 0;
      const rect=el.getBoundingClientRect();
      return rect.height?rect.bottom-top:0;
    };
    let bottom=Math.max(bottomOf(root),root.offsetTop+root.scrollHeight);
    root.querySelectorAll('.ddsh-syre-window,.ddsh-syre-content,.ddsh-syre-rp,.ddsh-syre-rpbox,.ddsh-syre-rptext,.ddsh-syre-bottom').forEach(el=>{bottom=Math.max(bottom,bottomOf(el));});
    // The credits are a sibling of the artwork. Include them, as well as the
    // actual bottom row which was previously clipped in the live preview.
    for(const selector of ['.ddsh-syre-bottom','.ddshcr-ccyword','[data-code015-end]']){
      bottom=Math.max(bottom,bottomOf(doc.querySelector(selector)));
    }
    return Math.max(100,Math.ceil(bottom+18));
  }
  function fitPreview(iframe,keepScale=false){
    if(!iframe?.isConnected||!panel?.classList.contains('is-active'))return;
    const doc=iframe.contentDocument;
    const stage=iframe.closest('.dds-code015-stage');
    const holder=iframe.parentElement;
    if(!doc?.querySelector('.ddsh-syre')||!stage||!holder)return;
    // The iframe is intentionally taller than its contents. In particular,
    // image onload / CSS reflow can never clip the bottom before it is measured.
    // The extra viewport is transparent and NOT included in the fit calculation.
    const naturalHeight=artworkHeight(doc);
    if(naturalHeight<=0)return;
    const viewportHeight=Math.ceil(naturalHeight+36);
    if(iframe.style.height!==viewportHeight+'px')iframe.style.setProperty('height',viewportHeight+'px','important');
    iframe.style.setProperty('width',CODE015_WIDTH+'px','important');
    const availableWidth=Math.max(1,stage.clientWidth-28);
    const availableHeight=Math.max(1,stage.clientHeight-28);
    const oldScale=Number(iframe.dataset.code015Scale)||0;
    // Maintain a steady scale on edits; only change it when the stage resizes
    // or the initial CSS/fonts settle. The stage itself remains scrollable.
    const maxScale=Math.min(1,availableWidth/CODE015_WIDTH);
    const scale=keepScale&&oldScale?Math.min(oldScale,maxScale):maxScale;
    iframe.dataset.code015Scale=String(scale);
    iframe.style.setProperty('transform',`scale(${scale})`,'important');
    iframe.style.setProperty('top','0px','important');
    iframe.style.setProperty('left','0px','important');
    const visualHeight=Math.ceil(viewportHeight*scale);
    holder.style.setProperty('width',Math.ceil(CODE015_WIDTH*scale)+'px','important');
    holder.style.setProperty('height',visualHeight+'px','important');
    holder.style.flex='0 0 auto';
    // Only the outer stage scrolls. Its viewport is NOT the iframe height.
    stage.style.setProperty('overflow-y','auto','important');
  }
  function requestFit(iframe,keepScale=false){
    cancelAnimationFrame(fitPending);
    fitPending=requestAnimationFrame(()=>fitPreview(iframe,keepScale));
  }
  function watchPreview(iframe){
    if(fitObserver){fitObserver.disconnect();fitObserver=null;}
    const doc=iframe.contentDocument;
    if(!doc)return;
    const root=doc.querySelector('.ddsh-syre');
    if(root&&typeof ResizeObserver!=='undefined'){
      fitObserver=new ResizeObserver(()=>requestFit(iframe,true));
      fitObserver.observe(root);
    }
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link=>link.addEventListener('load',()=>requestFit(iframe),{once:true}));
    doc.fonts?.ready?.then(()=>{if(iframe.isConnected)requestFit(iframe);});
    doc.querySelectorAll('img').forEach(img=>{
      if(!img.complete)img.addEventListener('load',()=>requestFit(iframe,true),{once:true});
    });
  }
  function render(){
    if(!panel)return;
    const iframe=panel.querySelector('[data-015-preview]');
    if(!iframe||previewReady||iframe.dataset.code015Loading==='1')return;
    iframe.dataset.code015Loading='1';
    const version=++previewVersion;
    // Set a safe iframe height BEFORE setting srcdoc, so even the first paint
    // never clips content at the default 150px frame height.
    iframe.style.setProperty('width',CODE015_WIDTH+'px','important');
    iframe.style.setProperty('height',CODE015_SAFE_VIEWPORT+'px','important');
    iframe.onload=()=>{
      if(!iframe.isConnected||version!==previewVersion)return;
      previewReady=true;
      iframe.dataset.code015Loading='0';
      iframe.dataset.code015Scale='';
      // Updates typed while the initial iframe was still loading are applied in place.
      for(const key of pendingLiveKeys)patchLivePreview(key);
      pendingLiveKeys.clear();
      watchPreview(iframe);
      requestFit(iframe);
    };
    iframe.srcdoc=docHTML(state);
    requestAnimationFrame(()=>{if(version===previewVersion)requestFit(iframe);});
  }
  function fitCardPreview(frame){
    if(!frame?.isConnected)return;
    const holder=frame.parentElement;
    const doc=frame.contentDocument;
    if(!doc?.body || !holder)return;
    const root=doc.querySelector('.ddsh-syre');
    if(!root)return;
    const actualWidth=Math.max(800,root.scrollWidth,Math.ceil(root.getBoundingClientRect().width));
    const actualHeight=Math.max(root.scrollHeight,Math.ceil(root.getBoundingClientRect().height),doc.body.scrollHeight)+8;
    const availableWidth=Math.max(1,holder.clientWidth-20);
    const availableHeight=Math.max(1,holder.clientHeight-20);
    const scale=Math.min(1,availableWidth/actualWidth,availableHeight/actualHeight);
    frame.style.setProperty('width',actualWidth+'px','important');
    frame.style.setProperty('height',actualHeight+'px','important');
    frame.style.setProperty('left','50%','important');
    frame.style.setProperty('top',Math.max(0,Math.round((holder.clientHeight-actualHeight*scale)/2))+'px','important');
    frame.style.setProperty('transform',`translateX(-50%) scale(${scale})`,'important');
    frame.classList.remove('dds-preview-loading');
    frame.classList.add('dds-preview-ready');
  }
  function card(){
    const grid=document.querySelector('[data-panel="roleplay"] .dds-roleplay-grid');
    if(!grid||grid.querySelector('[data-015-open]'))return;
    const article=document.createElement('article');article.className='dds-roleplay-card';
    article.innerHTML=`<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe class="dds-roleplay-card-preview-frame dds-preview-ready" title="ตัวอย่าง cyworld.exe" aria-hidden="true" loading="eager" tabindex="-1" data-015-card></iframe><span class="dds-roleplay-preview-badge">AVAILABLE</span></div><div class="dds-roleplay-card-body"><span class="dds-roleplay-index">CODE015</span><h2 class="dds-roleplay-name">cyworld.exe</h2><button type="button" class="dds-roleplay-edit" data-015-open>EDIT CODE <span>↗</span></button></div>`;
    grid.appendChild(article);
    const fr=article.querySelector('[data-015-card]');
    const update=()=>fitCardPreview(fr);
    fr.addEventListener('load',()=>{
      update();
      fr.contentDocument?.fonts?.ready?.then(update);
      fr.contentDocument?.querySelectorAll('img').forEach(img=>{
        if(!img.complete)img.addEventListener('load',update,{once:true});
      });
      [80,300,800].forEach(t=>setTimeout(update,t));
    });
    fr.srcdoc=docHTML({...BLANK(),...DEMO},true);
    if(window.ResizeObserver)new ResizeObserver(update).observe(fr.parentElement);
    article.querySelector('[data-015-open]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open();});
  }
  function open(){if(!panel)createPanel();document.querySelectorAll('.dds-panel.is-active').forEach(p=>p.classList.remove('is-active'));panel.classList.add('is-active');document.body.classList.add('dds-editor-mode','dds-force-editor-mode');document.documentElement.classList.add('dds-force-editor-mode');if(location.hash!=='#editor-code015')history.pushState({ddsCode015:true},'','#editor-code015');window.scrollTo(0,0);if(!previewReady)render();else requestFit(panel.querySelector('[data-015-preview]'),true);}
  function route(){if(location.hash==='#editor-code015'){open();return;}if(!panel)return;panel.classList.remove('is-active');}
  function init(){card();if(!panel)createPanel();try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')state={...BLANK(),...v};}catch{}sync();route();window.addEventListener('hashchange',route);window.addEventListener('popstate',()=>setTimeout(route,0));window.addEventListener('resize',()=>{if(panel.classList.contains('is-active'))requestFit(panel.querySelector('[data-015-preview]'));});document.addEventListener('click',e=>{if(e.target.closest('[data-015-open]'))return;if(panel?.classList.contains('is-active')&&e.target.closest('[data-page],[data-go],[data-browser-page]'))panel.classList.remove('is-active');},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
