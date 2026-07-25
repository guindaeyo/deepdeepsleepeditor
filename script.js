"use strict";

const panels = document.querySelectorAll("[data-panel]");
const navigationButtons = document.querySelectorAll("[data-page]");
const goButtons = document.querySelectorAll("[data-go]");
const editButtons = document.querySelectorAll("[data-edit-code]");
const notReadyButtons = document.querySelectorAll("[data-not-ready]");

const currentPageNumber = document.querySelector("#currentPageNumber");
const toast = document.querySelector("#siteToast");
const toastText = document.querySelector("#siteToastText");

const pageNumbers = {
  home: "00",
  roleplay: "01",
  profile: "02",
  review: "03",
  commission: "04",
  "editor-code001": "01"
};

const pageTitles = {
  home: "Deep Deep Sleep Code Shop",
  roleplay: "For Roleplay | Deep Deep Sleep Code Shop",
  profile: "For Profile | Deep Deep Sleep Code Shop",
  review: "For Review | Deep Deep Sleep Code Shop",
  commission: "Commission | Deep Deep Sleep Code Shop",
  "editor-code001": "Edit CODE001 | Deep Deep Sleep Code Shop"
};

function openPage(pageName, updateHash = true) {
  const validPage = pageNumbers[pageName] ? pageName : "home";

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === validPage);
  });

  navigationButtons.forEach((button) => {
    const navPage = validPage.startsWith("editor-") ? "roleplay" : validPage;
    const active = button.dataset.page === navPage;

    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });

  if (currentPageNumber) {
    currentPageNumber.textContent = pageNumbers[validPage];
  }

  document.title = pageTitles[validPage];

  if (updateHash) {
    history.replaceState(null, "", `#${validPage}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (validPage === "editor-code001") {
    updatePageOfOne();
  }
}

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => openPage(button.dataset.page));
});

goButtons.forEach((button) => {
  button.addEventListener("click", () => openPage(button.dataset.go));
});

editButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.editCode === "code001") {
      openPage("editor-code001");
    }
  });
});

notReadyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showToast("โค้ดนี้ยังไม่ได้ใส่แม่แบบแก้ไข ส่งโค้ด CODE002–009 มาเพิ่มได้ภายหลัง");
  });
});

function openPageFromHash() {
  const hashPage = window.location.hash.replace("#", "");
  openPage(pageNumbers[hashPage] ? hashPage : "home", false);
}

window.addEventListener("hashchange", openPageFromHash);
openPageFromHash();

let toastTimer;

function showToast(message) {
  if (!toast || !toastText) return;

  clearTimeout(toastTimer);
  toastText.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

/* PAGE OF ONE EDITOR */
const pageOfOnePreview = document.querySelector("#pageOfOnePreview");
const generatedCode = document.querySelector("#generatedCode");

const fields = {
  backg: document.querySelector("#backgColor"),
  border: document.querySelector("#borderColor"),
  text: document.querySelector("#textColor"),
  quote: document.querySelector("#quoteColor"),
  credit: document.querySelector("#creditText"),
  displayName: document.querySelector("#displayName"),
  subtitle: document.querySelector("#subtitleText"),
  quoteText: document.querySelector("#quoteText"),
  imageOne: document.querySelector("#imageOne"),
  imageTwo: document.querySelector("#imageTwo"),
  captionOne: document.querySelector("#captionOne"),
  captionTwo: document.querySelector("#captionTwo"),
  roleplay: document.querySelector("#roleplayEditor"),
  remark: document.querySelector("#remarkEditor")
};

const colorPairs = [
  ["backgColor", "backgColorPicker"],
  ["borderColor", "borderColorPicker"],
  ["textColor", "textColorPicker"],
  ["quoteColor", "quoteColorPicker"]
];

const defaultValues = {
  backg: "#e0e0e0",
  border: "#777777",
  text: "#000000",
  quote: "#9e9e9e",
  credit: "ordinary vampire\n(just a girl)",
  displayName: "Franklin D. Bloodworth",
  subtitle: "This hits like coma",
  quoteText: "“A deep sleep fell upon me — a sleep like that of death.”",
  imageOne: "https://i.pinimg.com/736x/c1/26/66/c126669ccfa791304dc162adac595a0d.jpg",
  imageTwo: "https://i.pinimg.com/736x/a1/f9/5b/a1f95bbc9e273540682aa8b279b23e95.jpg",
  captionOne: "01\nUh, you're in my zone",
  captionTwo: "02\nCome and follow",
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  remark: "หมายเห็ดนะ : สมมุติว่ายาว"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textWithBreaks(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function normalizeColor(value, fallback) {
  const trimmed = String(value).trim();

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return (
      "#" +
      trimmed
        .slice(1)
        .split("")
        .map((character) => character + character)
        .join("")
    ).toLowerCase();
  }

  return fallback;
}

function getEditorData() {
  return {
    backg: normalizeColor(fields.backg.value, defaultValues.backg),
    border: normalizeColor(fields.border.value, defaultValues.border),
    text: normalizeColor(fields.text.value, defaultValues.text),
    quote: normalizeColor(fields.quote.value, defaultValues.quote),
    credit: fields.credit.value,
    displayName: fields.displayName.value,
    subtitle: fields.subtitle.value,
    quoteText: fields.quoteText.value,
    imageOne: fields.imageOne.value.trim(),
    imageTwo: fields.imageTwo.value.trim(),
    captionOne: fields.captionOne.value,
    captionTwo: fields.captionTwo.value,
    roleplay: fields.roleplay.innerHTML,
    remark: fields.remark.innerHTML
  };
}

function buildPageOfOneMarkup(data) {
  return `<div class="pageof-wrapper" style="--backg:${data.backg};--border:${data.border};--text:${data.text};--quote:${data.quote};">
<div class="pageof-cr">${textWithBreaks(data.credit)}</div>
<div class="pageof-star">✦</div>
<div class="pageof-title">${escapeHtml(data.displayName)}</div>
<div class="pageof-subtitle">${escapeHtml(data.subtitle)}</div>
<div class="pageof-quote">${textWithBreaks(data.quoteText)}</div>
<div class="pageof-image-grid"><div class="pageof-image-block"><div class="pageof-image-frame"><img src="${escapeHtml(data.imageOne)}" alt=""></div><div class="pageof-caption">${textWithBreaks(data.captionOne)}</div></div>
<div class="pageof-image-block"><div class="pageof-image-frame"><img src="${escapeHtml(data.imageTwo)}" alt=""></div><div class="pageof-caption">${textWithBreaks(data.captionTwo)}</div></div></div>
<div class="pageof-text-box">${data.roleplay}</div>
<div class="pageof-remark"><div class="pageof-remark2">${data.remark}</div></div></div>`;
}

function buildFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/pageofone.css" rel="stylesheet">
${buildPageOfOneMarkup(data)}`;
}

function buildPreviewDocument(data) {
  const markup = buildPageOfOneMarkup(data);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://guindaeyo.github.io/deepdshop/pageofone.css" rel="stylesheet">
<style>
  html,body{margin:0;min-height:100%;background:#242424;}
  body{display:flex;justify-content:center;align-items:flex-start;padding:28px 12px;overflow-x:hidden;}
  .pageof-wrapper{max-width:100%;}
</style>
</head>
<body>
${markup}
</body>
</html>`;
}

function updatePageOfOne() {
  if (!pageOfOnePreview || !generatedCode) return;

  const data = getEditorData();
  generatedCode.value = buildFinalCode(data);
  pageOfOnePreview.srcdoc = buildPreviewDocument(data);
}

Object.values(fields).forEach((field) => {
  if (!field) return;

  field.addEventListener("input", updatePageOfOne);
  field.addEventListener("blur", updatePageOfOne);
});

colorPairs.forEach(([textId, pickerId]) => {
  const textInput = document.querySelector(`#${textId}`);
  const colorPicker = document.querySelector(`#${pickerId}`);

  if (!textInput || !colorPicker) return;

  colorPicker.addEventListener("input", () => {
    textInput.value = colorPicker.value;
    updatePageOfOne();
  });

  textInput.addEventListener("input", () => {
    const color = normalizeColor(textInput.value, "");

    if (color) {
      colorPicker.value = color;
    }

    updatePageOfOne();
  });
});

/* RICH TEXT TOOLBAR */
let lastRichEditor = null;

document.querySelectorAll(".dds-rich-editor").forEach((editor) => {
  editor.addEventListener("focus", () => {
    lastRichEditor = editor;
  });

  editor.addEventListener("keyup", () => {
    lastRichEditor = editor;
  });

  editor.addEventListener("mouseup", () => {
    lastRichEditor = editor;
  });
});

document.querySelectorAll(".dds-rich-toolbar").forEach((toolbar) => {
  const editor = document.querySelector(`#${toolbar.dataset.toolbarFor}`);

  toolbar.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();

      if (!editor) return;

      editor.focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand(button.dataset.command, false, null);
      updatePageOfOne();
    });
  });

  const colorInput = toolbar.querySelector("[data-rich-color]");

  if (colorInput) {
    colorInput.addEventListener("input", () => {
      const targetEditor = lastRichEditor || editor;

      if (!targetEditor) return;

      targetEditor.focus();
      document.execCommand("styleWithCSS", false, true);
      document.execCommand("foreColor", false, colorInput.value);
      updatePageOfOne();
    });
  }
});

/* COPY */
const copyButton = document.querySelector("#copyGeneratedCode");

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    updatePageOfOne();
    const code = generatedCode.value;

    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ด CODE001 เรียบร้อยแล้ว");
    } catch (error) {
      generatedCode.focus();
      generatedCode.select();
      document.execCommand("copy");
      showToast("คัดลอกโค้ด CODE001 เรียบร้อยแล้ว");
    }
  });
}

/* RESET */
const resetButton = document.querySelector("#resetPageOfOne");

if (resetButton) {
  resetButton.addEventListener("click", () => {
    fields.backg.value = defaultValues.backg;
    fields.border.value = defaultValues.border;
    fields.text.value = defaultValues.text;
    fields.quote.value = defaultValues.quote;
    fields.credit.value = defaultValues.credit;
    fields.displayName.value = defaultValues.displayName;
    fields.subtitle.value = defaultValues.subtitle;
    fields.quoteText.value = defaultValues.quoteText;
    fields.imageOne.value = defaultValues.imageOne;
    fields.imageTwo.value = defaultValues.imageTwo;
    fields.captionOne.value = defaultValues.captionOne;
    fields.captionTwo.value = defaultValues.captionTwo;
    fields.roleplay.textContent = defaultValues.roleplay;
    fields.remark.textContent = defaultValues.remark;

    colorPairs.forEach(([textId, pickerId]) => {
      const textInput = document.querySelector(`#${textId}`);
      const colorPicker = document.querySelector(`#${pickerId}`);

      if (textInput && colorPicker) {
        colorPicker.value = normalizeColor(textInput.value, "#000000");
      }
    });

    updatePageOfOne();
    showToast("คืนค่า CODE001 เรียบร้อยแล้ว");
  });
}

updatePageOfOne();
