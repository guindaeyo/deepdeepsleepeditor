/* =========================================================
   CODE014 — www.s$sLuv.c0m / SOLE EDITOR OWNER v165
   Loaded BEFORE the remote core script.
========================================================= */
(() => {
  "use strict";

  if (window.__DDS_CODE014_SSSLUV_INSTALLED__) return;
  window.__DDS_CODE014_SSSLUV_INSTALLED__ = true;

  const PANEL_NAME = "editor-code014";
  const DRAFT_KEY = "dds:roleplay:code014:draft:v2";
  const STYLESHEET_URL = "https://guindaeyo.github.io/deepdshop/ddsh-sssluv01.css";
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600&family=DotGothic16&display=swap";
  const ICON_URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
  const CANVAS_WIDTH = 650;

  const defaults = Object.freeze({
    bg: "#ffffff",
    window: "#ffffff",
    bar: "#f3f1f1",
    border: "#8f8583",
    text: "#5a4644",
    subtext: "#705c58",
    pink: "#efb5d0",
    pinkLight: "#f9d7e7",
    tabActive: "#ffffff",
    input: "#faeff6",
    note: "#fff7fb",
    dot1: "#79625d",
    dot2: "#ffffff",
    dot3: "#fff5fa",

    profileImage: "https://i.pinimg.com/1200x/43/05/35/4305356aff40a8bdf9230ae9f1b6e140.jpg",
    profileX: 50,
    profileY: 50,
    profileZoom: 100,

    pngImage: "https://i.pinimg.com/736x/b1/62/99/b16299abee915ce7f20f0133d427daaf.jpg",

    firstName: "Franklin D.",
    lastName: "Bloodworth",
    firstX: 0,
    firstY: 0,
    lastX: 0,
    lastY: 0,
    titleGroupX: 0,
    titleGroupY: 0,

    blogName: "https://Babyboo.bo0lvu.com",
    location: "เมเปิดโร้ด 5",
    date: "today",
    line1: "I Love My Sweet✩Star",
    line2: "Please use me like a drug. 🩸💫",
    roleplay: "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
    noteText: "⪩ ⪨ ꠹ ⋆˚꩜｡ ~ ม่ายบอกหรอกน้า ~ ｡꩜˚⋆"
  });

  /*
   * v135: หน้า Editor เริ่มว่างสำหรับผู้ใช้กรอกเอง
   * คงเฉพาะสี + ค่าตำแหน่งกลาง/ซูมมาตรฐานไว้เป็น guideline
   * OFFICIAL_CODE / card preview ยังใช้ defaults ตัวอย่างเดิมด้านบน
   */
  const editorDefaults = Object.freeze({
    bg: defaults.bg,
    window: defaults.window,
    bar: defaults.bar,
    border: defaults.border,
    text: defaults.text,
    subtext: defaults.subtext,
    pink: defaults.pink,
    pinkLight: defaults.pinkLight,
    tabActive: defaults.tabActive,
    input: defaults.input,
    note: defaults.note,
    dot1: defaults.dot1,
    dot2: defaults.dot2,
    dot3: defaults.dot3,

    profileImage: "",
    profileX: 50,
    profileY: 50,
    profileZoom: 100,
    pngImage: "",

    firstName: "",
    lastName: "",
    firstX: 0,
    firstY: 0,
    lastX: 0,
    lastY: 0,
    titleGroupX: 0,
    titleGroupY: 0,

    blogName: "",
    location: "",
    date: "",
    line1: "",
    line2: "",
    roleplay: "",
    noteText: ""
  });

  let card = null;
  let panel = null;
  let previewTimer = 0;
  let draftTimer = 0;
  let cardRendered = false;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function validHex(value, fallback) {
    const raw = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
  }

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (text) text.textContent = message;
    if (toast) {
      toast.classList.add("is-visible");
      clearTimeout(toast.__code014Timer);
      toast.__code014Timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
    }
  }


  function plainUrlText(value) {
    return h(value || "").replace(/:\/\//g, ":&#8203;//");
  }

  function bbcodeToPreviewHtml(value) {
    let text = h(value || "").replace(/\r\n?/g, "\n");
    const renderList = (source, ordered) => {
      const pattern = ordered ? /\[list=1\]([\s\S]*?)\[\/list\]/gi : /\[list\](?!\s*=)([\s\S]*?)\[\/list\]/gi;
      const tag = ordered ? "ol" : "ul";
      return source.replace(pattern, (_match, body) => {
        const items = String(body || "").split(/\[\*\]/i).slice(1).map((item) => item.trim()).filter(Boolean).map((item) => `<li>${item}</li>`).join("");
        return items ? `<${tag} style="margin:10px 0;padding-left:24px">${items}</${tag}>` : "";
      });
    };
    text = renderList(text, true);
    text = renderList(text, false);
    return text
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=small\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:.82em">$1</span>')
      .replace(/\[size=medium\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1em">$1</span>')
      .replace(/\[size=large\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1.28em">$1</span>')
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<span style="display:block;text-align:$1">$2</span>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[img\]([^\[]+)\[\/img\]/gi, '<img src="$1" alt="" style="display:block;max-width:100%;height:auto;margin:10px auto">')
      .replace(/\[video=youtube\]([^\[]+)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">▶ YouTube</a>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<span style="display:block;padding:7px 9px;border:1px solid currentColor">$1</span>')
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code style="display:block;padding:7px 9px;border:1px solid currentColor">$1</code>')
      .replace(/\[(hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi, '<span style="display:block;padding:7px 9px;border:1px solid currentColor">$2</span>')
      .replace(/\[hr\]/gi, '<hr style="margin:14px 0;border:0;border-top:1px solid currentColor;opacity:.3">')
      .replace(/\n/g, "<br>");
  }

  function roleToHtml(value, previewMode) {
    return previewMode ? bbcodeToPreviewHtml(value) : h(value || "");
  }

  function buildCode(values = defaults, previewMode = false) {
    const v = { ...defaults, ...values };
    const profileX = clamp(v.profileX, -100, 200, defaults.profileX);
    const profileY = clamp(v.profileY, -100, 200, defaults.profileY);
    const profileZoom = clamp(v.profileZoom, 50, 200, defaults.profileZoom);
    const profileMoveX = profileX - 50;
    const profileMoveY = profileY - 50;
    const firstX = clamp(v.firstX, -180, 180, 0);
    const firstY = clamp(v.firstY, -180, 180, 0);
    const lastX = clamp(v.lastX, -180, 180, 0);
    const lastY = clamp(v.lastY, -180, 180, 0);
    const groupX = clamp(v.titleGroupX, -220, 220, 0);
    const groupY = clamp(v.titleGroupY, -220, 220, 0);
    const roleplay = roleToHtml(v.roleplay, previewMode);

    return `<link href="${STYLESHEET_URL}" rel="stylesheet"><link href="${FONT_URL}" rel="stylesheet"><link rel="stylesheet" href="${ICON_URL}"><div class="ddsh-sssluv" style="--ddsh-sssluv-bg:${validHex(v.bg,defaults.bg)};--ddsh-sssluv-window:${validHex(v.window,defaults.window)};--ddsh-sssluv-bar:${validHex(v.bar,defaults.bar)};--ddsh-sssluv-border:${validHex(v.border,defaults.border)};--ddsh-sssluv-text:${validHex(v.text,defaults.text)};--ddsh-sssluv-subtext:${validHex(v.subtext,defaults.subtext)};--ddsh-sssluv-pink:${validHex(v.pink,defaults.pink)};--ddsh-sssluv-pink-light:${validHex(v.pinkLight,defaults.pinkLight)};--ddsh-sssluv-tab-active:${validHex(v.tabActive,defaults.tabActive)};--ddsh-sssluv-input:${validHex(v.input,defaults.input)};--ddsh-sssluv-note:${validHex(v.note,defaults.note)};--ddsh-sssluv-dot-1:${validHex(v.dot1,defaults.dot1)};--ddsh-sssluv-dot-2:${validHex(v.dot2,defaults.dot2)};--ddsh-sssluv-dot-3:${validHex(v.dot3,defaults.dot3)};"><div class="ddsh-sssluv-profile"><div class="ddsh-sssluv-browserbar"><div class="ddsh-sssluv-browserdots"><i></i><i></i><i></i></div></div><div class="ddsh-sssluv-profilebody"><div class="ddsh-sssluv-photo" style="overflow:hidden!important"><img src="${h(v.profileImage)}" alt="" style="object-position:50% 50%!important;transform:translate(${profileMoveX}% , ${profileMoveY}%) scale(${(profileZoom/100).toFixed(3)})!important;transform-origin:center center!important;will-change:transform"></div><div class="ddsh-sssluv-profileinfo"><div class="ddsh-sssluv-titlearea"><i class="bi bi-heart-fill ddsh-sssluv-tinyheart"></i><div class="ddsh-sssluv-title" style="position:relative!important;left:${groupX}px!important;top:${groupY}px!important"><span class="ddsh-sssluv-name-first" style="position:relative!important;left:${firstX}px!important;top:${firstY}px!important">${h(v.firstName)}</span><br><span class="ddsh-sssluv-name-last" style="position:relative!important;left:${lastX}px!important;top:${lastY}px!important">${h(v.lastName)}</span></div><i class="bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-one"></i><i class="bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-two"></i><i class="bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-three"></i></div><div class="ddsh-sssluv-field ddsh-sssluv-field-wide"><div class="ddsh-sssluv-label">Blog Name</div><div class="ddsh-sssluv-input">${plainUrlText(v.blogName)}</div></div><div class="ddsh-sssluv-minirow"><div class="ddsh-sssluv-field"><div class="ddsh-sssluv-label">Location</div><div class="ddsh-sssluv-input ddsh-sssluv-select"><span>${h(v.location)}</span><i class="bi bi-geo-alt-fill"></i></div></div><div class="ddsh-sssluv-field"><div class="ddsh-sssluv-label">Date</div><div class="ddsh-sssluv-input ddsh-sssluv-birthday">${h(v.date)}</div></div></div></div></div></div><div class="ddsh-sssluv-main"><div class="ddsh-sssluv-tabs"><div class="ddsh-sssluv-tab ddsh-sssluv-tab-active">Tasks</div><div class="ddsh-sssluv-tab">Events</div><div class="ddsh-sssluv-tab">Table</div><div class="ddsh-sssluv-tab">Dash</div><div class="ddsh-sssluv-expand"><i class="bi bi-arrows-angle-expand"></i></div></div><div class="ddsh-sssluv-content"><div class="ddsh-sssluv-heading"><div class="ddsh-sssluv-frontimg"><img src="${h(v.pngImage)}" alt=""></div><div class="ddsh-sssluv-headtext"><div class="ddsh-sssluv-bigline">${h(v.line1)}</div><div class="ddsh-sssluv-smallline">${h(v.line2)}</div></div></div><div class="ddsh-sssluv-rpbox"><div class="ddsh-sssluv-rptext">${roleplay}</div></div><div class="ddsh-sssluv-plus"><i class="bi bi-plus-lg"></i></div></div></div><div class="ddsh-sssluv-note"><div class="ddsh-sssluv-notehead"><i class="bi bi-heart"></i><span>NOTE</span></div><div class="ddsh-sssluv-notetext">${h(v.noteText)}</div></div></div><div class="ddshcr-ssluv0"><span></span></div>`;
  }

  const OFFICIAL_CODE = buildCode(defaults, false);
  const CARD_PREVIEW_CODE = "<link href=\"https://guindaeyo.github.io/deepdshop/ddsh-sssluv01.css\" rel=\"stylesheet\"><link href=\"https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600&family=DotGothic16&display=swap\" rel=\"stylesheet\"><link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css\"><div class=\"ddsh-sssluv\" style=\"--ddsh-sssluv-bg:#ffffff;--ddsh-sssluv-window:#ffffff;--ddsh-sssluv-bar:#f3f1f1;--ddsh-sssluv-border:#8f8583;--ddsh-sssluv-text:#5a4644;--ddsh-sssluv-subtext:#705c58;--ddsh-sssluv-pink:#efb5d0;--ddsh-sssluv-pink-light:#f9d7e7;--ddsh-sssluv-tab-active:#ffffff;--ddsh-sssluv-input:#faeff6;--ddsh-sssluv-note:#fff7fb;--ddsh-sssluv-dot-1:#79625d;--ddsh-sssluv-dot-2:#ffffff;--ddsh-sssluv-dot-3:#fff5fa;\"><div class=\"ddsh-sssluv-profile\"><div class=\"ddsh-sssluv-browserbar\"><div class=\"ddsh-sssluv-browserdots\"><i></i><i></i><i></i></div></div><div class=\"ddsh-sssluv-profilebody\"><div class=\"ddsh-sssluv-photo\" style=\"overflow:hidden!important\"><img src=\"https://i.pinimg.com/1200x/43/05/35/4305356aff40a8bdf9230ae9f1b6e140.jpg\" alt=\"\" style=\"object-position:50% 50%!important;scale:1.100!important;transform-origin:center center!important\"></div><div class=\"ddsh-sssluv-profileinfo\"><div class=\"ddsh-sssluv-titlearea\"><i class=\"bi bi-heart-fill ddsh-sssluv-tinyheart\"></i><div class=\"ddsh-sssluv-title\" style=\"position:relative!important;left:-4px!important;top:10px!important\"><span class=\"ddsh-sssluv-name-first\" style=\"position:relative!important;left:0px!important;top:20px!important\">Franklin D.</span><br><span class=\"ddsh-sssluv-name-last\" style=\"position:relative!important;left:46px!important;top:-20px!important\">Bloodworth</span></div><i class=\"bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-one\"></i><i class=\"bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-two\"></i><i class=\"bi bi-stars ddsh-sssluv-sparkle ddsh-sssluv-sparkle-three\"></i></div><div class=\"ddsh-sssluv-field ddsh-sssluv-field-wide\"><div class=\"ddsh-sssluv-label\">Blog Name</div><div class=\"ddsh-sssluv-input\">https:&#8203;//Babyboo.bo0lvu.com</div></div><div class=\"ddsh-sssluv-minirow\"><div class=\"ddsh-sssluv-field\"><div class=\"ddsh-sssluv-label\">Location</div><div class=\"ddsh-sssluv-input ddsh-sssluv-select\"><span>เมเปิดโร้ด 5</span><i class=\"bi bi-geo-alt-fill\"></i></div></div><div class=\"ddsh-sssluv-field\"><div class=\"ddsh-sssluv-label\">Date</div><div class=\"ddsh-sssluv-input ddsh-sssluv-birthday\">today</div></div></div></div></div></div><div class=\"ddsh-sssluv-main\"><div class=\"ddsh-sssluv-tabs\"><div class=\"ddsh-sssluv-tab ddsh-sssluv-tab-active\">Tasks</div><div class=\"ddsh-sssluv-tab\">Events</div><div class=\"ddsh-sssluv-tab\">Table</div><div class=\"ddsh-sssluv-tab\">Dash</div><div class=\"ddsh-sssluv-expand\"><i class=\"bi bi-arrows-angle-expand\"></i></div></div><div class=\"ddsh-sssluv-content\"><div class=\"ddsh-sssluv-heading\"><div class=\"ddsh-sssluv-frontimg\"><img src=\"https://i.pinimg.com/736x/b1/62/99/b16299abee915ce7f20f0133d427daaf.jpg\" alt=\"\"></div><div class=\"ddsh-sssluv-headtext\"><div class=\"ddsh-sssluv-bigline\">I Love My Sweet✩Star</div><div class=\"ddsh-sssluv-smallline\">Please use me like a drug. </div></div></div><div class=\"ddsh-sssluv-rpbox\"><div class=\"ddsh-sssluv-rptext\">คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</div></div><div class=\"ddsh-sssluv-plus\"><i class=\"bi bi-plus-lg\"></i></div></div></div><div class=\"ddsh-sssluv-note\"><div class=\"ddsh-sssluv-notehead\"><i class=\"bi bi-heart\"></i><span>NOTE</span></div><div class=\"ddsh-sssluv-notetext\">⪩ ⪨ ꠹ ⋆˚꩜｡ ~ ม่ายบอกหรอกน้า ~ ｡꩜˚⋆</div></div></div><div class=\"ddshcr-ssluv0\"><span></span></div>";

  function previewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}.dds-code014-preview-root{width:${CANVAS_WIDTH}px;min-width:${CANVAS_WIDTH}px;max-width:${CANVAS_WIDTH}px;margin:0 auto;padding:20px 0;box-sizing:border-box}</style></head><body><div class="dds-code014-preview-root">${code}</div></body></html>`;
  }

  function measureIframe(iframe) {
    try {
      const doc = iframe?.contentDocument;
      const root = doc?.querySelector(".dds-code014-preview-root");
      if (!root) return { width: CANVAS_WIDTH, height: 950 };
      const rect = root.getBoundingClientRect();
      return {
        width: Math.max(CANVAS_WIDTH, Math.ceil(rect.width || 0), root.scrollWidth || 0),
        height: Math.max(1, Math.ceil(rect.height || 0), root.scrollHeight || 0)
      };
    } catch {
      return { width: CANVAS_WIDTH, height: 950 };
    }
  }

  function writeIframe(iframe, code, afterLoad) {
    if (!iframe) return;
    iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("height", "1100px", "important");
    const refit = () => requestAnimationFrame(() => requestAnimationFrame(() => afterLoad?.()));
    iframe.onload = () => {
      refit();
      [80, 180, 420, 850, 1500].forEach((delay) => setTimeout(refit, delay));
      try { iframe.contentDocument?.fonts?.ready?.then(refit); } catch {}
    };
    iframe.srcdoc = previewDocument(code);
  }

  function fitIframe(iframe, stage, padding = 16) {
    if (!iframe || !stage || stage.clientWidth < 20 || stage.clientHeight < 20) return false;
    const m = measureIframe(iframe);
    const availableWidth = Math.max(1, stage.clientWidth - padding * 2);
    const availableHeight = Math.max(1, stage.clientHeight - padding * 2);
    const scale = Math.max(.01, Math.min(1, availableWidth / m.width, availableHeight / m.height));
    const scaledWidth = m.width * scale;
    const scaledHeight = m.height * scale;
    iframe.style.setProperty("position", "absolute", "important");
    iframe.style.setProperty("left", `${Math.max(0,(stage.clientWidth-scaledWidth)/2)}px`, "important");
    iframe.style.setProperty("top", `${Math.max(0,(stage.clientHeight-scaledHeight)/2)}px`, "important");
    iframe.style.setProperty("width", `${m.width}px`, "important");
    iframe.style.setProperty("height", `${m.height}px`, "important");
    iframe.style.setProperty("max-width", "none", "important");
    iframe.style.setProperty("transform", `scale(${scale})`, "important");
    iframe.style.setProperty("transform-origin", "top left", "important");
    return true;
  }

  function sizeEditorPreviewActual(iframe, stage, padding = 28) {
    if (!iframe || !stage || stage.clientWidth < 20) return;

    const m = measureIframe(iframe);
    const availableWidth = Math.max(
      1,
      stage.clientWidth - padding * 2
    );

    /*
     * Fit แค่ความกว้าง ไม่ย่อทั้งก้อนตามความสูง
     * งานยาวให้เลื่อนลงด้วย scrollbar ของ stage
     */
    const scale = Math.min(
      1,
      availableWidth / m.width
    );

    const renderedHeight = Math.ceil(
      m.height * scale
    );

    stage.style.setProperty(
      "height",
      "100%",
      "important"
    );

    stage.style.setProperty(
      "min-height",
      "0",
      "important"
    );

    stage.style.setProperty(
      "max-height",
      "100%",
      "important"
    );

    stage.style.setProperty(
      "overflow-y",
      "auto",
      "important"
    );

    stage.style.setProperty(
      "overflow-x",
      "hidden",
      "important"
    );

    stage.style.setProperty(
      "scrollbar-width",
      "thin",
      "important"
    );

    stage.style.setProperty(
      "scrollbar-color",
      "#c11724 #090909",
      "important"
    );

    stage.style.setProperty(
      "--dds-code014-scroll-height",
      `${renderedHeight + padding * 2}px`
    );

    iframe.style.setProperty(
      "position",
      "absolute",
      "important"
    );

    iframe.style.setProperty(
      "left",
      "50%",
      "important"
    );

    iframe.style.setProperty(
      "top",
      `${padding}px`,
      "important"
    );

    iframe.style.setProperty(
      "width",
      `${m.width}px`,
      "important"
    );

    iframe.style.setProperty(
      "min-width",
      `${m.width}px`,
      "important"
    );

    iframe.style.setProperty(
      "max-width",
      `${m.width}px`,
      "important"
    );

    iframe.style.setProperty(
      "height",
      `${m.height}px`,
      "important"
    );

    iframe.style.setProperty(
      "min-height",
      `${m.height}px`,
      "important"
    );

    iframe.style.setProperty(
      "max-height",
      `${m.height}px`,
      "important"
    );

    iframe.style.setProperty(
      "transform",
      `translateX(-50%) scale(${scale})`,
      "important"
    );

    iframe.style.setProperty(
      "transform-origin",
      "top center",
      "important"
    );

    iframe.style.setProperty(
      "overflow",
      "hidden",
      "important"
    );

    /*
     * ให้ wheel / trackpad จับที่ stage โดยตรง
     * ไม่ติดอยู่บน iframe ที่เลื่อนไม่ได้
     */
    iframe.style.setProperty(
      "pointer-events",
      "none",
      "important"
    );
  }

  function toolbarMarkup() {
    return `<div class="dds-rich-toolbar dds-bbcode-toolbar dds-code014-bbcode-toolbar" data-code014-toolbar>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="b" title="ตัวหนา [b]"><b>B</b></button><button type="button" data-code014-bbcode="i" title="ตัวเอียง [i]"><i>I</i></button><button type="button" data-code014-bbcode="u" title="ขีดเส้นใต้ [u]"><u>U</u></button><button type="button" data-code014-bbcode="s" title="ขีดฆ่า [s]"><s>S</s></button></div>
      <div class="dds-bbcode-group"><label class="dds-bbcode-color" title="สีตัวอักษร [color]"><span>A</span><input type="color" data-code014-bbcode-color value="#8f0e16" aria-label="เลือกสีตัวอักษร"></label><button type="button" data-code014-bbcode="size-small">A−</button><button type="button" data-code014-bbcode="size-medium">A</button><button type="button" data-code014-bbcode="size-large">A+</button></div>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="align-left">⇤</button><button type="button" data-code014-bbcode="align-center">↔</button><button type="button" data-code014-bbcode="align-right">⇥</button><button type="button" data-code014-bbcode="align-justify">☰</button></div>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="url">🔗</button><button type="button" data-code014-bbcode="img">▣</button><button type="button" data-code014-bbcode="video">▶</button></div>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="quote">❝</button><button type="button" data-code014-bbcode="code">&lt;/&gt;</button><button type="button" data-code014-bbcode="hide">◉</button><button type="button" data-code014-bbcode="spoiler">▤</button></div>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="list">•≡</button><button type="button" data-code014-bbcode="list-1">1≡</button><button type="button" data-code014-bbcode="list-item">[*]</button></div>
      <div class="dds-bbcode-group"><button type="button" data-code014-bbcode="hr">―</button><button type="button" data-code014-bbcode="clear">CLEAR</button></div>
    </div>`;
  }

  function createPanel() {
    if (panel?.isConnected) return panel;
    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-code014-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `<div class="dds-editor-heading"><button aria-label="กลับหน้า FOR ROLEPLAY" class="dds-back-button" data-code014-back title="กลับหน้า FOR ROLEPLAY" type="button">←</button><div><p class="dds-eyebrow">ROLEPLAY CODE EDITOR</p><h1>www.s$sLuv.c0m</h1><p>Please use me like a drug.</p></div></div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column"><div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>CODE014</strong></div><div class="dds-code014-editor-stage"><iframe class="dds-protected-commission-preview-frame dds-code014-editor-preview" data-code014-editor-preview scrolling="no" title="ตัวอย่าง CODE014"></iframe></div></div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-code014-draft-status>ยังไม่มีแบบร่าง</small></div></div>
          <div class="dds-protected-commission-scroll dds-code014-controls-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโคด</h2></div><div class="dds-color-grid">${colorField("พื้นหลัง","bg",editorDefaults.bg)}${colorField("แถบบน","bar",editorDefaults.bar)}${colorField("เส้น / ขอบ","border",editorDefaults.border)}${colorField("ข้อความหลัก","text",editorDefaults.text)}${colorField("ข้อความรอง","subtext",editorDefaults.subtext)}${colorField("สีชมพูหลัก","pink",editorDefaults.pink)}${colorField("สีชมพูอ่อน","pinkLight",editorDefaults.pinkLight)}${colorField("แท็บ Active","tabActive",editorDefaults.tabActive)}${colorField("ช่อง Input","input",editorDefaults.input)}${colorField("พื้น Note","note",editorDefaults.note)}${colorField("จุด 1","dot1",editorDefaults.dot1)}${colorField("จุด 2","dot2",editorDefaults.dot2)}${colorField("จุด 3","dot3",editorDefaults.dot3)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>ชื่อ</h2></div><div class="dds-form-grid">${textField("ชื่อ","firstName",editorDefaults.firstName)}${textField("นามสกุล","lastName",editorDefaults.lastName)}</div><div class="dds-image-position"><div class="dds-image-position-heading"><span>ตำแหน่งชื่อและนามสกุล</span><small>ขยับแยกแต่ละบรรทัด หรือขยับชื่อ + นามสกุลพร้อมกัน</small></div>${rangeRow("ชื่อ · ซ้ายขวา","firstX",editorDefaults.firstX,-180,180,"ซ้าย","ขวา")}${rangeRow("ชื่อ · บนล่าง","firstY",editorDefaults.firstY,-180,180,"บน","ล่าง")}${rangeRow("นามสกุล · ซ้ายขวา","lastX",editorDefaults.lastX,-180,180,"ซ้าย","ขวา")}${rangeRow("นามสกุล · บนล่าง","lastY",editorDefaults.lastY,-180,180,"บน","ล่าง")}${rangeRow("ชื่อ + นามสกุล · ซ้ายขวา","titleGroupX",editorDefaults.titleGroupX,-220,220,"ซ้าย","ขวา")}${rangeRow("ชื่อ + นามสกุล · บนล่าง","titleGroupY",editorDefaults.titleGroupY,-220,220,"บน","ล่าง")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>ข้อมูลโปรไฟล์</h2></div><div class="dds-form-grid">${textField("Blog Name","blogName",editorDefaults.blogName,true)}${textField("Location","location",editorDefaults.location)}${textField("Date","date",editorDefaults.date)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>รูปโปรไฟล์</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ลิงก์รูปหลัก</span><input type="url" data-code014-field="profileImage" data-dds-field-key="code014-profileImage" value="${h(editorDefaults.profileImage)}"></label></div><div class="dds-image-position">${rangeRow("แนวนอน · เลื่อนรูป","profileX",editorDefaults.profileX,-100,200,"ซ้าย","ขวา","%")}${rangeRow("แนวตั้ง · เลื่อนรูป","profileY",editorDefaults.profileY,-100,200,"บน","ล่าง","%")}${rangeRow("ซูมรูป","profileZoom",editorDefaults.profileZoom,50,200,"ออก","เข้า","%")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>รูป PNG / รูปประกอบ</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ลิงก์รูป PNG / รูปหน้าหัวข้อความ</span><input type="url" data-code014-field="pngImage" data-dds-field-key="code014-pngImage" value="${h(editorDefaults.pngImage)}"></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>06</span><h2>หัวข้อความ</h2></div><div class="dds-form-grid">${textField("ข้อความ 1","line1",editorDefaults.line1,true)}${textField("ข้อความ 2","line2",editorDefaults.line2,true)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>07</span><h2>เนื้อหาโรลเพลย์</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full dds-code014-roleplay-field"><span>ข้อความโรลเพลย์</span>${toolbarMarkup()}<textarea data-code014-field="roleplay" data-dds-field-key="code014-roleplay" rows="8">${h(editorDefaults.roleplay)}</textarea><div class="dds-word-counter" data-code014-word-counter data-empty="false"><span class="dds-word-counter-label">จำนวนคำ</span><strong><span data-code014-word-count-number>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>08</span><h2>หมายเหตุ</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความ NOTE</span><textarea data-code014-field="noteText" data-dds-field-key="code014-noteText" rows="4">${h(editorDefaults.noteText)}</textarea></label></div></section>
          </div>
          <section class="dds-protected-commission-copy"><div class="dds-control-title"><span>09</span><h2>คัดลอกโคด</h2></div><p>คัดลอก CODE014 พร้อมสี รูป ตำแหน่ง และซูม โดยตำแหน่งชื่อจะติดไปกับโค้ดจริง</p><div class="dds-protected-commission-copy-actions"><button type="button" data-code014-copy>COPY CODE <span>↗</span></button><button type="button" data-code014-reset>RESET</button></div></section>
        </div>
      </div>`;
    const main = document.querySelector(".dds-main");
    const footer = document.querySelector(".dds-footer");
    if (footer?.parentElement === main) main.insertBefore(panel, footer); else main?.appendChild(panel);
    bindPanel();
    return panel;
  }

  function getValues() {
    const values = { ...editorDefaults };
    panel?.querySelectorAll("[data-code014-field]").forEach((field) => {
      const key = field.dataset.code014Field;
      if (!key) return;
      values[key] = field.type === "range" ? Number(field.value) : field.value;
    });
    return values;
  }

  function setValues(values) {
    panel?.querySelectorAll("[data-code014-field]").forEach((field) => {
      const key = field.dataset.code014Field;
      if (!key || values[key] == null) return;
      field.value = values[key];
      const picker = panel.querySelector(`[data-code014-color-picker="${key}"]`);
      if (picker && /^#[0-9a-f]{6}$/i.test(String(values[key]))) picker.value = values[key];
    });
    syncOutputs();
    updateWordCounter();
  }

  function syncOutputs() {
    panel?.querySelectorAll("[data-code014-output]").forEach((output) => {
      const key = output.dataset.code014Output;
      const input = panel.querySelector(`[data-code014-field="${key}"]`);
      if (!input) return;
      const unit = ["profileX","profileY","profileZoom","pngX","pngY","pngZoom"].includes(key) ? "%" : "px";
      output.textContent = `${input.value}${unit}`;
    });
  }

  function removeBbcodeForWordCount(value) {
    return String(value || "")
      .replace(/\[img(?:=[^\]]*)?\][\s\S]*?\[\/img\]/gi, " ")
      .replace(/\[video(?:=[^\]]*)?\][\s\S]*?\[\/video\]/gi, " ")
      .replace(/\[url(?:=[^\]]*)?\]([\s\S]*?)\[\/url\]/gi, " $1 ")
      .replace(/\[(?:\/?[a-z][a-z0-9_-]*(?:=[^\]]*)?|\*|hr)\]/gi, " ")
      .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countWords(value) {
    const clean = removeBbcodeForWordCount(value);
    if (!clean) return 0;

    if (typeof Intl?.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      let count = 0;

      for (const segment of segmenter.segment(clean)) {
        if (segment.isWordLike) count += 1;
      }

      return count;
    }

    const words = clean.match(
      /[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g
    );

    return words ? words.length : 0;
  }

  function updateWordCounter() {
    const textarea = panel?.querySelector('[data-code014-field="roleplay"]');
    const counter = panel?.querySelector("[data-code014-word-counter]");
    if (!textarea || !counter) return;
    const count = countWords(textarea.value);
    const number = counter.querySelector("[data-code014-word-count-number]");
    if (number) number.textContent = count.toLocaleString("th-TH");
    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function replaceSelection(target, replacement, caretOffset = null) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText(replacement, start, end, "end");
    if (Number.isInteger(caretOffset)) {
      const caret = start + caretOffset;
      target.setSelectionRange(caret, caret);
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
  }

  function wrapTag(target, openTag, closeTag) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const replacement = `${openTag}${selected}${closeTag}`;
    replaceSelection(target, replacement, selected ? replacement.length : openTag.length);
  }

  function applyList(target, ordered) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const lines = selected.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const openTag = ordered ? "[list=1]" : "[list]";
    const body = lines.length ? lines.map((line) => `[*]${line}`).join("\n") : "[*]";
    replaceSelection(target, `${openTag}\n${body}\n[/list]`);
  }

  function applyBbcode(target, action, toolbar) {
    if (!target) return;
    if (["b","i","u","s","quote","code","hide","spoiler"].includes(action)) { wrapTag(target, `[${action}]`, `[/${action}]`); return; }
    const wrappers = {
      "size-small":["[size=small]","[/size]"], "size-medium":["[size=medium]","[/size]"], "size-large":["[size=large]","[/size]"],
      "align-left":["[align=left]","[/align]"], "align-center":["[align=center]","[/align]"], "align-right":["[align=right]","[/align]"], "align-justify":["[align=justify]","[/align]"]
    };
    if (wrappers[action]) { wrapTag(target, wrappers[action][0], wrappers[action][1]); return; }
    if (action === "color") { const color = toolbar?.querySelector("[data-code014-bbcode-color]")?.value || "#8f0e16"; wrapTag(target, `[color=${color}]`, "[/color]"); return; }
    if (action === "url") { const selected = target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0); const url = prompt("ใส่ลิงก์ URL", "https://"); if (url !== null) replaceSelection(target, `[url=${url}]${selected || url}[/url]`); return; }
    if (action === "img") { const url = prompt("ใส่ลิงก์รูปภาพ", "https://"); if (url !== null) replaceSelection(target, `[img]${url}[/img]`); return; }
    if (action === "video") { const url = prompt("ใส่ลิงก์ YouTube", "https://"); if (url !== null) replaceSelection(target, `[video=youtube]${url}[/video]`); return; }
    if (action === "list") { applyList(target, false); return; }
    if (action === "list-1") { applyList(target, true); return; }
    if (action === "list-item") { replaceSelection(target, `[*]${target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0)}`); return; }
    if (action === "hr") { replaceSelection(target, "[hr]"); return; }
    if (action === "clear") {
      const start = target.selectionStart ?? 0, end = target.selectionEnd ?? start;
      if (start === end) { notify("คลุมข้อความที่ต้องการล้าง BBCode ก่อน"); return; }
      replaceSelection(target, target.value.slice(start, end).replace(/\[[^\]]*\]/g, ""));
    }
  }

  function updatePreview() {
    if (!panel?.classList.contains("is-active")) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const iframe = panel.querySelector("[data-code014-editor-preview]");
      const stage = panel.querySelector(".dds-code014-editor-stage");
      writeIframe(iframe, buildCode(getValues(), true), () => sizeEditorPreviewActual(iframe, stage, 28));
    }, 45);
    syncOutputs();
    updateWordCounter();
  }

  function setDraftStatus(savedAt) {
    const target = panel?.querySelector("[data-code014-draft-status]");
    if (!target) return;
    target.textContent = savedAt ? `บันทึกล่าสุด ${new Date(savedAt).toLocaleTimeString("th-TH", { hour:"2-digit", minute:"2-digit" })}` : "ยังไม่มีแบบร่าง";
  }

  function getDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
  }

  function saveDraft() {
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
      setDraftStatus(savedAt);
    } catch {}
  }

  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 350);
  }

  async function copyCode() {
    const output = buildCode(getValues(), false);
    try { await navigator.clipboard.writeText(output); }
    catch {
      const temp = document.createElement("textarea");
      temp.value = output; temp.style.position = "fixed"; temp.style.opacity = "0";
      document.body.appendChild(temp); temp.select(); document.execCommand("copy"); temp.remove();
    }
    notify("คัดลอกโคด CODE014 แล้ว");
  }

  function bindPanel() {
    panel.querySelector("[data-code014-back]")?.addEventListener("click", goBack);
    panel.querySelectorAll("[data-code014-field]").forEach((input) => {
      input.addEventListener("input", () => {
        const picker = panel.querySelector(`[data-code014-color-picker="${input.dataset.code014Field}"]`);
        if (picker && /^#[0-9a-f]{6}$/i.test(input.value.trim())) picker.value = input.value.trim();
        updatePreview(); scheduleDraftSave();
      });
      input.addEventListener("change", updatePreview);
    });
    panel.querySelectorAll("[data-code014-color-picker]").forEach((picker) => {
      picker.addEventListener("input", () => {
        const field = panel.querySelector(`[data-code014-field="${picker.dataset.code014ColorPicker}"]`);
        if (field) field.value = picker.value;
        updatePreview(); scheduleDraftSave();
      });
    });
    const textarea = panel.querySelector('[data-code014-field="roleplay"]');
    const toolbar = panel.querySelector("[data-code014-toolbar]");
    toolbar?.querySelectorAll("[data-code014-bbcode]").forEach((button) => button.addEventListener("click", () => applyBbcode(textarea, button.dataset.code014Bbcode, toolbar)));
    toolbar?.querySelector("[data-code014-bbcode-color]")?.addEventListener("change", () => applyBbcode(textarea, "color", toolbar));
    panel.querySelector("[data-code014-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-code014-reset]")?.addEventListener("click", () => { setValues(editorDefaults); updatePreview(); scheduleDraftSave(); notify("รีเซ็ต CODE014 แล้ว"); });
  }

  function installCard() {
    if (card?.isConnected) return true;
    const grid = document.querySelector('[data-panel="roleplay"] .dds-roleplay-grid');
    if (!grid) return false;
    const code13 = grid.querySelector(".dds-roleplay-card-code013");
    if (!code13) return false;
    const existing = grid.querySelector(".dds-roleplay-card-code014");
    if (existing) {
      card = existing;

      const button =
        card.querySelector("[data-code014-edit]");

      if (button) {
        button.onclick = (event) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
          window.__ddsOpenCode014?.();
        };
      }

      return true;
    }

    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-roleplay-card-code014";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live dds-roleplay-card-preview-code014"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-code014-card-preview-frame" data-code014-card-preview loading="eager" scrolling="no" tabindex="-1" title="ตัวอย่าง DEEP DEEP SLEEP CODE014"></iframe><span class="dds-roleplay-preview-badge">AVAILABLE</span></div><div class="dds-roleplay-card-body"><span class="dds-roleplay-index">CODE014</span><h2 class="dds-roleplay-name">www.s$sLuv.c0m</h2><button class="dds-roleplay-edit" data-code014-edit type="button">EDIT CODE <span>↗</span></button></div>`;
    code13.insertAdjacentElement("afterend", card);
    card.querySelector("[data-code014-edit]")?.addEventListener(
      "click",
      (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        window.__ddsOpenCode014?.();
      }
    );

    const iframe = card.querySelector("[data-code014-card-preview]");
    const render = () => {
      if (cardRendered || !iframe) return;
      cardRendered = true;
      writeIframe(iframe, CARD_PREVIEW_CODE, () => fitIframe(iframe, card.querySelector(".dds-roleplay-card-preview"), 16));
    };
    render();
    if ("ResizeObserver" in window) {
      const stage = card.querySelector(".dds-roleplay-card-preview");
      const observer = new ResizeObserver(() => requestAnimationFrame(() => fitIframe(iframe, stage, 16)));
      observer.observe(stage);
    }
    return true;
  }

  function showPanel(name) {
    document.body.classList.add("dds-editor-mode");
    document.querySelectorAll("[data-panel]").forEach((candidate) => candidate.classList.toggle("is-active", candidate.dataset.panel === name));
    document.querySelectorAll("[data-page]").forEach((button) => {
      const active = button.dataset.page === "roleplay";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    const pageNumber = document.getElementById("currentPageNumber"); if (pageNumber) pageNumber.textContent = "01";
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function goBack() {
    document.body.classList.remove("dds-editor-mode");
    document.querySelectorAll("[data-panel]").forEach((candidate) => candidate.classList.toggle("is-active", candidate.dataset.panel === "roleplay"));
    document.querySelectorAll("[data-page]").forEach((button) => {
      const active = button.dataset.page === "roleplay";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    const pageNumber = document.getElementById("currentPageNumber"); if (pageNumber) pageNumber.textContent = "01";
    history.replaceState(null, "", "#roleplay");
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function openEditor() {
    const target = createPanel();

    if (!target) return;

    const draft = getDraft();

    setValues(
      draft?.values
        ? { ...editorDefaults, ...draft.values }
        : { ...editorDefaults }
    );

    setDraftStatus(draft?.savedAt || 0);

    document.documentElement.classList.add(
      "dds-editor-mode"
    );

    document.body.classList.add(
      "dds-editor-mode"
    );

    showPanel(PANEL_NAME);

    target.classList.add("is-active");

    history.replaceState(
      null,
      "",
      "#editor-code014"
    );

    window.scrollTo(0, 0);

    updatePreview();
  }

  window.__ddsOpenCode014 =
    () => openEditor();

  function handleHash() {
    if (
      location.hash === "#editor-code014" &&
      !panel?.classList.contains("is-active")
    ) {
      openEditor();
    }
  }

  function install() {
    /*
     * สร้าง panel ไว้ล่วงหน้าแบบ hidden:
     * กดครั้งแรกไม่ต้องรอสร้าง DOM ขนาดใหญ่
     */
    createPanel();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 120) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      const cardFrame = card?.querySelector("[data-code014-card-preview]");
      if (cardFrame) fitIframe(cardFrame, card?.querySelector(".dds-roleplay-card-preview"), 16);
      const editorFrame = panel?.querySelector("[data-code014-editor-preview]");
      if (editorFrame && panel?.classList.contains("is-active")) sizeEditorPreviewActual(editorFrame, panel.querySelector(".dds-code014-editor-stage"), 28);
    });
    window.addEventListener("hashchange", handleHash);
    setTimeout(handleHash, 320);
  }

  /*
   * Capture listener owned by CODE014 itself.
   * ไม่มี route/guard ซ้อนจาก module อื่นอีกแล้ว
   */
  document.addEventListener(
    "click",
    (event) => {
      const button =
        event.target?.closest?.(
          ".dds-roleplay-card-code014 [data-code014-edit]"
        );

      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      openEditor();
    },
    true
  );

  const boot = () => {
    install();

    if (location.hash === "#editor-code014") {
      openEditor();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      { once:true }
    );
  } else {
    boot();
  }
})();
