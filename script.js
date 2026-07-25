"use strict";

/* ==================================================
   PAGE ROUTING
================================================== */

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
  "editor-code001": "01",
  "editor-code002": "01",
  "editor-code003": "01"
};

const pageTitles = {
  home: "Deep Deep Sleep Code Shop",
  roleplay: "For Roleplay | Deep Deep Sleep Code Shop",
  profile: "For Profile | Deep Deep Sleep Code Shop",
  review: "For Review | Deep Deep Sleep Code Shop",
  commission: "Commission | Deep Deep Sleep Code Shop",
  "editor-code001": "Edit CODE001 | Deep Deep Sleep Code Shop",
  "editor-code002": "Edit CODE002 | Deep Deep Sleep Code Shop",
  "editor-code003": "Edit CODE003 | Deep Deep Sleep Code Shop"
};

function openPage(pageName, updateHash = true) {
  const validPage = pageNumbers[pageName] ? pageName : "home";

  document.body.classList.toggle(
    "dds-editor-mode",
    validPage.startsWith("editor-")
  );

  panels.forEach((panel) => {
    panel.classList.toggle(
      "is-active",
      panel.dataset.panel === validPage
    );
  });

  navigationButtons.forEach((button) => {
    const navPage =
      validPage.startsWith("editor-")
        ? "roleplay"
        : validPage;

    const active =
      button.dataset.page === navPage;

    button.classList.toggle(
      "is-active",
      active
    );

    button.setAttribute(
      "aria-current",
      active ? "page" : "false"
    );
  });

  if (currentPageNumber) {
    currentPageNumber.textContent =
      pageNumbers[validPage];
  }

  document.title =
    pageTitles[validPage];

  if (updateHash) {
    history.replaceState(
      null,
      "",
      `#${validPage}`
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (validPage === "editor-code001") {
    updatePageOfOne();
  }

  if (validPage === "editor-code002") {
    updateWeirdo();
  }

  if (validPage === "editor-code003") {
    updateHihi();
  }
}

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

goButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openPage(button.dataset.go);
  });
});

editButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const codeName =
      button.dataset.editCode;

    if (codeName === "code001") {
      openPage("editor-code001");
    }

    if (codeName === "code002") {
      openPage("editor-code002");
    }

    if (codeName === "code003") {
      openPage("editor-code003");
    }
  });
});

notReadyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showToast(
      "โค้ดนี้ยังไม่ได้ใส่แม่แบบแก้ไข ส่งโค้ด CODE004–009 มาเพิ่มได้ภายหลัง"
    );
  });
});

function openPageFromHash() {
  const hashPage =
    window.location.hash.replace("#", "");

  openPage(
    pageNumbers[hashPage]
      ? hashPage
      : "home",
    false
  );
}

window.addEventListener(
  "hashchange",
  openPageFromHash
);


/* ==================================================
   TOAST
================================================== */

let toastTimer;

function showToast(message) {
  if (!toast || !toastText) {
    return;
  }

  clearTimeout(toastTimer);

  toastText.textContent = message;
  toast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}


/* ==================================================
   SHARED UTILITIES
================================================== */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textWithBreaks(value) {
  return escapeHtml(value).replace(
    /\r?\n/g,
    "<br>"
  );
}


const fdreviewCreditMarkup =
  `<div class="fdreview-credit"><span></span></div>`;

const fdreviewCreditCss = `.fdreview-credit {
  --fdreview-credit-y: -10px;

  width: 100%;
  min-height: 25px;
  padding: 7px 12px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transform: translateY(var(--fdreview-credit-y));
  background: transparent;
  font-family: Arial, sans-serif;
}

.fdreview-credit span {
  width: 11px;
  height: 10px;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  color: rgba(185, 185, 185, 0.58);
  font-size: 7px;
  font-weight: 400;
  line-height: 10px;
  letter-spacing: 0.7px;
  text-align: left;
  cursor: help;
  user-select: none;
  -webkit-user-select: none;
  transition:
    width 0.35s ease,
    color 0.25s ease;
}

.fdreview-credit span::before {
  content: "✝ deepdeepsleepfranklin";
  display: block;
  width: 135px;
  font-style: italic;
}

.fdreview-credit span:hover {
  width: 135px;
  color: rgba(215, 215, 215, 0.92);
}`;

function buildCreditStyleTag() {
  return `<style>
${fdreviewCreditCss}
</style>`;
}

function normalizePosition(value, fallback = 50) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    100,
    Math.max(0, number)
  );
}

function buildImagePositionStyle(
  x,
  y,
  extraStyle = ""
) {
  const positionStyle =
    `object-fit:cover;object-position:${x}% ${y}%`;

  return extraStyle
    ? `${extraStyle};${positionStyle}`
    : positionStyle;
}

function syncImagePositionOutputs() {
  document
    .querySelectorAll(
      "[data-image-position-range]"
    )
    .forEach((range) => {
      const output =
        document.querySelector(
          `[data-position-output="${range.id}"]`
        );

      if (!output) {
        return;
      }

      const value =
        `${range.value}%`;

      output.value = value;
      output.textContent = value;
    });
}

function normalizeColor(value, fallback) {
  const trimmed =
    String(value).trim();

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return (
      "#" +
      trimmed
        .slice(1)
        .split("")
        .map((character) => {
          return character + character;
        })
        .join("")
    ).toLowerCase();
  }

  return fallback;
}

function sanitizeRichHtml(html) {
  const template =
    document.createElement("template");

  template.innerHTML = html;

  const allowedTags = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "S",
    "STRIKE",
    "SPAN",
    "DIV",
    "P",
    "BR"
  ]);

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(
        node.textContent || ""
      );
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const tagName =
      node.tagName.toUpperCase();

    if (!allowedTags.has(tagName)) {
      const fragment =
        document.createDocumentFragment();

      Array.from(node.childNodes).forEach(
        (child) => {
          fragment.appendChild(
            cleanNode(child)
          );
        }
      );

      return fragment;
    }

    const cleanElement =
      document.createElement(
        tagName.toLowerCase()
      );

    if (
      ["SPAN", "DIV", "P"].includes(tagName)
    ) {
      const allowedStyles = [];

      if (node.style.color) {
        allowedStyles.push(
          `color:${node.style.color}`
        );
      }

      if (node.style.fontWeight) {
        allowedStyles.push(
          `font-weight:${node.style.fontWeight}`
        );
      }

      if (node.style.fontStyle) {
        allowedStyles.push(
          `font-style:${node.style.fontStyle}`
        );
      }

      if (
        node.style.textDecoration ||
        node.style.textDecorationLine
      ) {
        allowedStyles.push(
          `text-decoration:${
            node.style.textDecoration ||
            node.style.textDecorationLine
          }`
        );
      }

      if (allowedStyles.length) {
        cleanElement.setAttribute(
          "style",
          allowedStyles.join(";")
        );
      }
    }

    Array.from(node.childNodes).forEach(
      (child) => {
        cleanElement.appendChild(
          cleanNode(child)
        );
      }
    );

    return cleanElement;
  }

  const cleanContainer =
    document.createElement("div");

  Array.from(
    template.content.childNodes
  ).forEach((node) => {
    cleanContainer.appendChild(
      cleanNode(node)
    );
  });

  return cleanContainer.innerHTML;
}

function buildStylesheetLinks(cssUrls) {
  const urls =
    Array.isArray(cssUrls)
      ? cssUrls
      : [cssUrls];

  return urls
    .map((url) => {
      return `<link href="${url}" rel="stylesheet">`;
    })
    .join("\n");
}

function normalizeRichParagraphHtml(html) {
  return sanitizeRichHtml(html)
    .replace(
      /<div><br\s*\/?><\/div>/gi,
      "<br><br>"
    )
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "<br>")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "<br>")
    .replace(
      /(?:<br>\s*)+$/gi,
      ""
    );
}

function buildEditorPreviewDocument(
  cssUrls,
  markup
) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>
${buildStylesheetLinks(cssUrls)}
<style>
  html,
  body {
    margin: 0;
    min-height: 100%;
    background: #242424;
  }

  body {
    padding: 28px 20px;
    overflow: hidden;
  }

  .dds-preview-shell {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .dds-preview-target {
    flex: 0 0 auto;
    transform-origin: top center;
  }

${fdreviewCreditCss}
</style>
</head>
<body>
  <div class="dds-preview-shell">
    <div class="dds-preview-target">
      ${markup}
    </div>
  </div>
</body>
</html>`;
}

function buildCardPreviewDocument(
  cssUrls,
  markup
) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>
${buildStylesheetLinks(cssUrls)}
<style>
  html,
  body {
    margin: 0;
    width: 100%;
    height: 100%;
    background: #242424;
    overflow: hidden;
  }

  body {
    padding: 12px;
  }

  .dds-card-preview-shell {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: hidden;
  }

  .dds-card-preview-target {
    flex: 0 0 auto;
    transform-origin: top center;
  }

${fdreviewCreditCss}
</style>
</head>
<body>
  <div class="dds-card-preview-shell">
    <div class="dds-card-preview-target">
      ${markup}
    </div>
  </div>
</body>
</html>`;
}

function resizeEditorPreview(iframe) {
  if (!iframe) {
    return;
  }

  try {
    const previewDocument =
      iframe.contentDocument;

    const target =
      previewDocument?.querySelector(
        ".dds-preview-target"
      );

    const shell =
      previewDocument?.querySelector(
        ".dds-preview-shell"
      );

    if (!target || !shell) {
      return;
    }

    target.style.transform = "none";
    shell.style.height = "auto";

    const naturalWidth =
      target.scrollWidth;

    const naturalHeight =
      target.scrollHeight;

    const availableWidth = Math.max(
      300,
      iframe.clientWidth - 44
    );

    const scale = Math.min(
      1,
      availableWidth / naturalWidth
    );

    target.style.transform =
      `scale(${scale})`;

    shell.style.height =
      `${Math.ceil(
        naturalHeight * scale
      )}px`;

    iframe.style.height =
      `${Math.ceil(
        naturalHeight * scale
      ) + 58}px`;
  } catch (error) {
    iframe.style.height = "1000px";
  }
}

function resizeCardPreview(iframe) {
  if (!iframe) {
    return;
  }

  try {
    const previewDocument =
      iframe.contentDocument;

    const target =
      previewDocument?.querySelector(
        ".dds-card-preview-target"
      );

    if (!target) {
      return;
    }

    target.style.transform = "none";

    const naturalWidth =
      target.scrollWidth;

    const naturalHeight =
      target.scrollHeight;

    const availableWidth = Math.max(
      80,
      iframe.clientWidth - 24
    );

    const availableHeight = Math.max(
      60,
      iframe.clientHeight - 24
    );

    const scale = Math.min(
      1,
      availableWidth / naturalWidth,
      availableHeight / naturalHeight
    );

    target.style.transform =
      `scale(${scale})`;
  } catch (error) {
    return;
  }
}

function schedulePreviewResize(
  iframe,
  resizeFunction
) {
  if (!iframe) {
    return;
  }

  const runResize = () => {
    requestAnimationFrame(() => {
      resizeFunction(iframe);
    });
  };

  iframe.addEventListener("load", () => {
    runResize();

    setTimeout(runResize, 180);
    setTimeout(runResize, 700);
    setTimeout(runResize, 1500);
  });
}

function bindColorPairs(
  pairs,
  updateFunction
) {
  pairs.forEach(
    ([textId, pickerId]) => {
      const textInput =
        document.querySelector(
          `#${textId}`
        );

      const colorPicker =
        document.querySelector(
          `#${pickerId}`
        );

      if (!textInput || !colorPicker) {
        return;
      }

      colorPicker.addEventListener(
        "input",
        () => {
          textInput.value =
            colorPicker.value;

          updateFunction();
        }
      );

      textInput.addEventListener(
        "input",
        () => {
          const color =
            normalizeColor(
              textInput.value,
              ""
            );

          if (color) {
            colorPicker.value = color;
          }

          updateFunction();
        }
      );
    }
  );
}

async function copyText(
  text,
  fallbackElement
) {
  try {
    await navigator.clipboard.writeText(
      text
    );
  } catch (error) {
    if (fallbackElement) {
      fallbackElement.focus();
      fallbackElement.select();
      document.execCommand("copy");
    }
  }
}


/* ==================================================
   CODE001 — PAGE OF ONE
================================================== */

const pageOfOnePreview =
  document.querySelector(
    "#pageOfOnePreview"
  );

const roleplayCardPreview001 =
  document.querySelector(
    "#roleplayCardPreview001"
  );

const generatedCode =
  document.querySelector(
    "#generatedCode"
  );

const fields001 = {
  backg:
    document.querySelector(
      "#backgColor"
    ),

  border:
    document.querySelector(
      "#borderColor"
    ),

  text:
    document.querySelector(
      "#textColor"
    ),

  quote:
    document.querySelector(
      "#quoteColor"
    ),

  credit:
    document.querySelector(
      "#creditText"
    ),

  displayName:
    document.querySelector(
      "#displayName"
    ),

  subtitle:
    document.querySelector(
      "#subtitleText"
    ),

  quoteText:
    document.querySelector(
      "#quoteText"
    ),

  imageOne:
    document.querySelector(
      "#imageOne"
    ),

  imageOneX:
    document.querySelector(
      "#imageOneX"
    ),

  imageOneY:
    document.querySelector(
      "#imageOneY"
    ),

  imageTwo:
    document.querySelector(
      "#imageTwo"
    ),

  imageTwoX:
    document.querySelector(
      "#imageTwoX"
    ),

  imageTwoY:
    document.querySelector(
      "#imageTwoY"
    ),

  captionOne:
    document.querySelector(
      "#captionOne"
    ),

  captionTwo:
    document.querySelector(
      "#captionTwo"
    ),

  roleplay:
    document.querySelector(
      "#roleplayEditor"
    ),

  remark:
    document.querySelector(
      "#remarkEditor"
    )
};

const defaults001 = {
  backg: "#e0e0e0",
  border: "#777777",
  text: "#000000",
  quote: "#9e9e9e",
  credit:
    "ordinary vampire\n(just a girl)",
  displayName:
    "Franklin D. Bloodworth",
  subtitle:
    "This hits like coma",
  quoteText:
    "“A deep sleep fell upon me — a sleep like that of death.”",
  imageOne:
    "https://i.pinimg.com/736x/c1/26/66/c126669ccfa791304dc162adac595a0d.jpg",
  imageOneX: 50,
  imageOneY: 50,
  imageTwo:
    "https://i.pinimg.com/736x/a1/f9/5b/a1f95bbc9e273540682aa8b279b23e95.jpg",
  imageTwoX: 50,
  imageTwoY: 50,
  captionOne:
    "01\nUh, you're in my zone",
  captionTwo:
    "02\nCome and follow",
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  remark:
    "หมายเห็ดนะ : สมมุติว่ายาว"
};

function getPageOfOneData() {
  return {
    backg:
      normalizeColor(
        fields001.backg.value,
        defaults001.backg
      ),

    border:
      normalizeColor(
        fields001.border.value,
        defaults001.border
      ),

    text:
      normalizeColor(
        fields001.text.value,
        defaults001.text
      ),

    quote:
      normalizeColor(
        fields001.quote.value,
        defaults001.quote
      ),

    credit:
      fields001.credit.value,

    displayName:
      fields001.displayName.value,

    subtitle:
      fields001.subtitle.value,

    quoteText:
      fields001.quoteText.value,

    imageOne:
      fields001.imageOne.value.trim(),

    imageOneX:
      normalizePosition(
        fields001.imageOneX.value,
        defaults001.imageOneX
      ),

    imageOneY:
      normalizePosition(
        fields001.imageOneY.value,
        defaults001.imageOneY
      ),

    imageTwo:
      fields001.imageTwo.value.trim(),

    imageTwoX:
      normalizePosition(
        fields001.imageTwoX.value,
        defaults001.imageTwoX
      ),

    imageTwoY:
      normalizePosition(
        fields001.imageTwoY.value,
        defaults001.imageTwoY
      ),

    captionOne:
      fields001.captionOne.value,

    captionTwo:
      fields001.captionTwo.value,

    roleplay:
      sanitizeRichHtml(
        fields001.roleplay.innerHTML
      ),

    remark:
      sanitizeRichHtml(
        fields001.remark.innerHTML
      )
  };
}

function buildPageOfOneMarkup(data) {
  return `<div class="pageof-wrapper" style="--backg:${data.backg};--border:${data.border};--text:${data.text};--quote:${data.quote};">
<div class="pageof-cr">${textWithBreaks(data.credit)}</div>
<div class="pageof-star">✦</div>
<div class="pageof-title">${escapeHtml(data.displayName)}</div>
<div class="pageof-subtitle">${escapeHtml(data.subtitle)}</div>
<div class="pageof-quote">${textWithBreaks(data.quoteText)}</div>
<div class="pageof-image-grid"><div class="pageof-image-block"><div class="pageof-image-frame"><img src="${escapeHtml(data.imageOne)}" alt="" style="${buildImagePositionStyle(data.imageOneX, data.imageOneY)}"></div><div class="pageof-caption">${textWithBreaks(data.captionOne)}</div></div>
<div class="pageof-image-block"><div class="pageof-image-frame"><img src="${escapeHtml(data.imageTwo)}" alt="" style="${buildImagePositionStyle(data.imageTwoX, data.imageTwoY)}"></div><div class="pageof-caption">${textWithBreaks(data.captionTwo)}</div></div></div>
<div class="pageof-text-box">${data.roleplay}</div>
<div class="pageof-remark"><div class="pageof-remark2">${data.remark}</div></div></div>
${fdreviewCreditMarkup}`;
}

function buildPageOfOneFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/pageofone.css" rel="stylesheet">
${buildCreditStyleTag()}
${buildPageOfOneMarkup(data)}`;
}

function updatePageOfOne() {
  if (!generatedCode) {
    return;
  }

  const data =
    getPageOfOneData();

  generatedCode.value =
    buildPageOfOneFinalCode(data);

  if (pageOfOnePreview) {
    pageOfOnePreview.srcdoc =
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/pageofone.css",
        buildPageOfOneMarkup(data)
      );
  }

  if (roleplayCardPreview001) {
    roleplayCardPreview001.srcdoc =
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/pageofone.css",
        buildPageOfOneMarkup(data)
      );
  }
}


/* ==================================================
   CODE002 — WEIRDO
================================================== */

const weirdoPreview =
  document.querySelector(
    "#weirdoPreview"
  );

const roleplayCardPreview002 =
  document.querySelector(
    "#roleplayCardPreview002"
  );

const generatedWeirdoCode =
  document.querySelector(
    "#generatedWeirdoCode"
  );

const fields002 = {
  backg:
    document.querySelector(
      "#wzBackgColor"
    ),

  border:
    document.querySelector(
      "#wzBorderColor"
    ),

  line:
    document.querySelector(
      "#wzLineColor"
    ),

  text:
    document.querySelector(
      "#wzTextColor"
    ),

  topLeft:
    document.querySelector(
      "#wzTopLeft"
    ),

  topRight:
    document.querySelector(
      "#wzTopRight"
    ),

  displayName:
    document.querySelector(
      "#wzDisplayName"
    ),

  subtitle:
    document.querySelector(
      "#wzSubtitle"
    ),

  imageLeftOne:
    document.querySelector(
      "#wzImageLeftOne"
    ),

  imageLeftOneX:
    document.querySelector(
      "#wzImageLeftOneX"
    ),

  imageLeftOneY:
    document.querySelector(
      "#wzImageLeftOneY"
    ),

  imageLeftTwo:
    document.querySelector(
      "#wzImageLeftTwo"
    ),

  imageLeftTwoX:
    document.querySelector(
      "#wzImageLeftTwoX"
    ),

  imageLeftTwoY:
    document.querySelector(
      "#wzImageLeftTwoY"
    ),

  imageCenter:
    document.querySelector(
      "#wzImageCenter"
    ),

  imageCenterX:
    document.querySelector(
      "#wzImageCenterX"
    ),

  imageCenterY:
    document.querySelector(
      "#wzImageCenterY"
    ),

  imageRightOne:
    document.querySelector(
      "#wzImageRightOne"
    ),

  imageRightOneX:
    document.querySelector(
      "#wzImageRightOneX"
    ),

  imageRightOneY:
    document.querySelector(
      "#wzImageRightOneY"
    ),

  imageRightTwo:
    document.querySelector(
      "#wzImageRightTwo"
    ),

  imageRightTwoX:
    document.querySelector(
      "#wzImageRightTwoX"
    ),

  imageRightTwoY:
    document.querySelector(
      "#wzImageRightTwoY"
    ),

  roleplay:
    document.querySelector(
      "#weirdoRoleplayEditor"
    ),

  footer:
    document.querySelector(
      "#wzFooterText"
    )
};

const defaults002 = {
  backg: "#000000",
  border: "#444444",
  line: "#444444",
  text: "#ffffff",
  topLeft: "✦",
  topRight: "✦",
  displayName:
    "Franklin D. Bloodworth",
  subtitle:
    "I can smell that hot blood just under your skin",
  imageLeftOne:
    "https://i.pinimg.com/1200x/96/4c/9f/964c9f53fed10111d8fba1f1272c8a4e.jpg",
  imageLeftOneX: 50,
  imageLeftOneY: 50,
  imageLeftTwo:
    "https://i.pinimg.com/1200x/68/a1/0c/68a10cb7ace82b2b0d49ae02726d033b.jpg",
  imageLeftTwoX: 50,
  imageLeftTwoY: 50,
  imageCenter:
    "https://i.pinimg.com/736x/79/0c/3b/790c3b92b668039e2d10d04758ca8dd5.jpg",
  imageCenterX: 50,
  imageCenterY: 50,
  imageRightOne:
    "https://i.pinimg.com/736x/7a/c9/88/7ac98884b1ebd57f098a1ad5e91418a7.jpg",
  imageRightOneX: 50,
  imageRightOneY: 50,
  imageRightTwo:
    "https://s12.gifyu.com/images/bEjC5.png",
  imageRightTwoX: 50,
  imageRightTwoY: 50,
  roleplay:
    `<div>คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</div><div><br></div><div>ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</div>`,
  footer: "vampire"
};

function getWeirdoData() {
  return {
    backg:
      normalizeColor(
        fields002.backg.value,
        defaults002.backg
      ),

    border:
      normalizeColor(
        fields002.border.value,
        defaults002.border
      ),

    line:
      normalizeColor(
        fields002.line.value,
        defaults002.line
      ),

    text:
      normalizeColor(
        fields002.text.value,
        defaults002.text
      ),

    topLeft:
      fields002.topLeft.value,

    topRight:
      fields002.topRight.value,

    displayName:
      fields002.displayName.value,

    subtitle:
      fields002.subtitle.value,

    imageLeftOne:
      fields002.imageLeftOne.value.trim(),

    imageLeftOneX:
      normalizePosition(
        fields002.imageLeftOneX.value,
        defaults002.imageLeftOneX
      ),

    imageLeftOneY:
      normalizePosition(
        fields002.imageLeftOneY.value,
        defaults002.imageLeftOneY
      ),

    imageLeftTwo:
      fields002.imageLeftTwo.value.trim(),

    imageLeftTwoX:
      normalizePosition(
        fields002.imageLeftTwoX.value,
        defaults002.imageLeftTwoX
      ),

    imageLeftTwoY:
      normalizePosition(
        fields002.imageLeftTwoY.value,
        defaults002.imageLeftTwoY
      ),

    imageCenter:
      fields002.imageCenter.value.trim(),

    imageCenterX:
      normalizePosition(
        fields002.imageCenterX.value,
        defaults002.imageCenterX
      ),

    imageCenterY:
      normalizePosition(
        fields002.imageCenterY.value,
        defaults002.imageCenterY
      ),

    imageRightOne:
      fields002.imageRightOne.value.trim(),

    imageRightOneX:
      normalizePosition(
        fields002.imageRightOneX.value,
        defaults002.imageRightOneX
      ),

    imageRightOneY:
      normalizePosition(
        fields002.imageRightOneY.value,
        defaults002.imageRightOneY
      ),

    imageRightTwo:
      fields002.imageRightTwo.value.trim(),

    imageRightTwoX:
      normalizePosition(
        fields002.imageRightTwoX.value,
        defaults002.imageRightTwoX
      ),

    imageRightTwoY:
      normalizePosition(
        fields002.imageRightTwoY.value,
        defaults002.imageRightTwoY
      ),

    roleplay:
      sanitizeRichHtml(
        fields002.roleplay.innerHTML
      ),

    footer:
      fields002.footer.value
  };
}

function buildWeirdoMarkup(data) {
  return `<div class="jnsz-weirdo-frame" style="--wzbackg:${data.backg};--wzborder:${data.border};--wzline:${data.line};--wztext:${data.text};"><div class="jnsz-weirdo-top-bar">
<div>${escapeHtml(data.topLeft)}</div>
<div>${escapeHtml(data.topRight)}</div></div>
<div class="jnsz-weirdo-title">${escapeHtml(data.displayName)}</div>
<div class="jnsz-weirdo-subtitle">${textWithBreaks(data.subtitle)}</div>
<div class="jnsz-weirdo-divider"></div>
<div class="jnsz-weirdo-flex"><div class="column">
<img src="${escapeHtml(data.imageLeftOne)}" class="jnsz-weirdo-in4img" style="${buildImagePositionStyle(data.imageLeftOneX, data.imageLeftOneY, "margin-bottom:-30px")}" alt="">
<img src="${escapeHtml(data.imageLeftTwo)}" class="jnsz-weirdo-in4img" style="${buildImagePositionStyle(data.imageLeftTwoX, data.imageLeftTwoY, "margin-top:-10px")}" alt=""></div>
<div class="column center-column">
<img src="${escapeHtml(data.imageCenter)}" class="jnsz-weirdo-center-img" style="${buildImagePositionStyle(data.imageCenterX, data.imageCenterY)}" alt=""></div>
<div class="column">
<img src="${escapeHtml(data.imageRightOne)}" class="jnsz-weirdo-in4img" style="${buildImagePositionStyle(data.imageRightOneX, data.imageRightOneY, "margin-bottom:-30px")}" alt="">
<img src="${escapeHtml(data.imageRightTwo)}" class="jnsz-weirdo-in4img" style="${buildImagePositionStyle(data.imageRightTwoX, data.imageRightTwoY, "margin-top:-10px")}" alt=""></div></div>

<div class="jnsz-weirdo-footer-bar" style="margin-top: -0px;"></div>
<div class="jnsz-weirdo-text-box">${data.roleplay}</div>
<div class="jnsz-weirdo-swatches">
<div class="jnsz-weirdo-swatch"></div>
<div class="jnsz-weirdo-swatch"></div>
<div class="jnsz-weirdo-swatch"></div></div>
<div class="jnsz-weirdo-footer">${escapeHtml(data.footer)}</div></div>
${fdreviewCreditMarkup}`;
}

function buildWeirdoFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/jnsz-weirdo-tzz.css" rel="stylesheet">
${buildCreditStyleTag()}
${buildWeirdoMarkup(data)}`;
}

function updateWeirdo() {
  if (!generatedWeirdoCode) {
    return;
  }

  const data =
    getWeirdoData();

  generatedWeirdoCode.value =
    buildWeirdoFinalCode(data);

  if (weirdoPreview) {
    weirdoPreview.srcdoc =
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/jnsz-weirdo-tzz.css",
        buildWeirdoMarkup(data)
      );
  }

  if (roleplayCardPreview002) {
    roleplayCardPreview002.srcdoc =
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/jnsz-weirdo-tzz.css",
        buildWeirdoMarkup(data)
      );
  }
}



/* ==================================================
   CODE003 — HIHI!, BABY
================================================== */

const hihiPreview =
  document.querySelector(
    "#hihiPreview"
  );

const roleplayCardPreview003 =
  document.querySelector(
    "#roleplayCardPreview003"
  );

const generatedHihiCode =
  document.querySelector(
    "#generatedHihiCode"
  );

const fields003 = {
  useBackground:
    document.querySelector(
      "#hhUseBackground"
    ),

  backg:
    document.querySelector(
      "#hhBackgColor"
    ),

  backh:
    document.querySelector(
      "#hhBackhColor"
    ),

  backhbttm:
    document.querySelector(
      "#hhBackhbttmColor"
    ),

  border:
    document.querySelector(
      "#hhBorderColor"
    ),

  text:
    document.querySelector(
      "#hhTextColor"
    ),

  image:
    document.querySelector(
      "#hhImage"
    ),

  imageX:
    document.querySelector(
      "#hhImageX"
    ),

  imageY:
    document.querySelector(
      "#hhImageY"
    ),

  species:
    document.querySelector(
      "#hhSpecies"
    ),

  nameLineOne:
    document.querySelector(
      "#hhNameLineOne"
    ),

  nameLineTwo:
    document.querySelector(
      "#hhNameLineTwo"
    ),

  heading:
    document.querySelector(
      "#hhHeading"
    ),

  description:
    document.querySelector(
      "#hhDescription"
    ),

  roleplay:
    document.querySelector(
      "#hihiRoleplayEditor"
    )
};

const defaults003 = {
  useBackground: true,
  backg: "#000000",
  backh: "#000000",
  backhbttm: "#ffffff",
  border: "#ffffff",
  text: "#ffffff",
  image:
    "https://i.pinimg.com/1200x/a9/4e/93/a94e93741f7803b0fa8c84392a999731.jpg",
  imageX: 50,
  imageY: 50,
  species: "vampire",
  nameLineOne: "Franklin D.",
  nameLineTwo: "Bloodworth",
  heading: "Hi, baby",
  description:
    "I'm your bad habit, yeah\nyou want me and you can't stop it",
  roleplay:
    `คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊<br><br>ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊`
};

const hihiStylesheets = [
  "https://guindaeyo.github.io/deepdshop/hihi-jnszrebye.css",
  "https://dl.dropboxusercontent.com/scl/fi/yvq68vg3cbfh3athi6ecw/Elgian.css?rlkey=8r9wc6wzrxw30u118ygdh5hyf&st=qavrf1qw&dl=0"
];

function getHihiData() {
  return {
    useBackground:
      fields003.useBackground.checked,

    backg:
      normalizeColor(
        fields003.backg.value,
        defaults003.backg
      ),

    backh:
      normalizeColor(
        fields003.backh.value,
        defaults003.backh
      ),

    backhbttm:
      normalizeColor(
        fields003.backhbttm.value,
        defaults003.backhbttm
      ),

    border:
      normalizeColor(
        fields003.border.value,
        defaults003.border
      ),

    text:
      normalizeColor(
        fields003.text.value,
        defaults003.text
      ),

    image:
      fields003.image.value.trim(),

    imageX:
      normalizePosition(
        fields003.imageX.value,
        defaults003.imageX
      ),

    imageY:
      normalizePosition(
        fields003.imageY.value,
        defaults003.imageY
      ),

    species:
      fields003.species.value,

    nameLineOne:
      fields003.nameLineOne.value,

    nameLineTwo:
      fields003.nameLineTwo.value,

    heading:
      fields003.heading.value,

    description:
      fields003.description.value,

    roleplay:
      normalizeRichParagraphHtml(
        fields003.roleplay.innerHTML
      )
  };
}

function buildHihiStyle(data) {
  const variables = [];

  if (data.useBackground) {
    variables.push(
      `--hhbackg:${data.backg}`
    );
  }

  variables.push(
    `--hhbackh:${data.backh}`,
    `--hhbackhbttm:${data.backhbttm}`,
    `--hhborder:${data.border}`,
    `--hhtext:${data.text}`
  );

  return variables.join(";") + ";";
}

function buildHihiMarkup(data) {
  return `<div class="hihiz-main-box" style="${buildHihiStyle(data)}">
<div class="hihiz-main-image"><img src="${escapeHtml(data.image)}" alt="" style="${buildImagePositionStyle(data.imageX, data.imageY)}">
<div class="hihiz-label-top">${escapeHtml(data.species)}</div>
<div class="hihiz-namez">${escapeHtml(data.nameLineOne)}<br>${escapeHtml(data.nameLineTwo)}</div><div class="hihiz-label2"><h1>${escapeHtml(data.heading)}</h1>
<p>${textWithBreaks(data.description)}</p>
</div></div><div class="hihiz-textzz">
<p>${data.roleplay}</p></div></div>
${fdreviewCreditMarkup}`;
}

function buildHihiFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/hihi-jnszrebye.css" rel="stylesheet">
<link href="https://dl.dropboxusercontent.com/scl/fi/yvq68vg3cbfh3athi6ecw/Elgian.css?rlkey=8r9wc6wzrxw30u118ygdh5hyf&amp;st=qavrf1qw&amp;dl=0" rel="stylesheet">
${buildCreditStyleTag()}
${buildHihiMarkup(data)}`;
}

function syncHihiBackgroundControl() {
  const isEnabled =
    fields003.useBackground.checked;

  const textInput =
    document.querySelector(
      "#hhBackgColor"
    );

  const picker =
    document.querySelector(
      "#hhBackgColorPicker"
    );

  if (textInput) {
    textInput.disabled = !isEnabled;
  }

  if (picker) {
    picker.disabled = !isEnabled;
  }
}

function updateHihi() {
  if (!generatedHihiCode) {
    return;
  }

  syncHihiBackgroundControl();

  const data =
    getHihiData();

  generatedHihiCode.value =
    buildHihiFinalCode(data);

  if (hihiPreview) {
    hihiPreview.srcdoc =
      buildEditorPreviewDocument(
        hihiStylesheets,
        buildHihiMarkup(data)
      );
  }

  if (roleplayCardPreview003) {
    roleplayCardPreview003.srcdoc =
      buildCardPreviewDocument(
        hihiStylesheets,
        buildHihiMarkup(data)
      );
  }
}


/* ==================================================
   INPUT BINDINGS
================================================== */

Object.values(fields001).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updatePageOfOne
  );

  field.addEventListener(
    "blur",
    updatePageOfOne
  );
});

Object.values(fields002).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateWeirdo
  );

  field.addEventListener(
    "blur",
    updateWeirdo
  );
});

Object.values(fields003).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateHihi
  );

  field.addEventListener(
    "change",
    updateHihi
  );

  field.addEventListener(
    "blur",
    updateHihi
  );
});

bindColorPairs(
  [
    ["backgColor", "backgColorPicker"],
    ["borderColor", "borderColorPicker"],
    ["textColor", "textColorPicker"],
    ["quoteColor", "quoteColorPicker"]
  ],
  updatePageOfOne
);

bindColorPairs(
  [
    ["wzBackgColor", "wzBackgColorPicker"],
    ["wzBorderColor", "wzBorderColorPicker"],
    ["wzLineColor", "wzLineColorPicker"],
    ["wzTextColor", "wzTextColorPicker"]
  ],
  updateWeirdo
);

bindColorPairs(
  [
    ["hhBackgColor", "hhBackgColorPicker"],
    ["hhBackhColor", "hhBackhColorPicker"],
    ["hhBackhbttmColor", "hhBackhbttmColorPicker"],
    ["hhBorderColor", "hhBorderColorPicker"],
    ["hhTextColor", "hhTextColorPicker"]
  ],
  updateHihi
);


/* ==================================================
   RICH-TEXT TOOLBARS
================================================== */

const savedSelections =
  new WeakMap();

const richEditorUpdaters = {
  roleplayEditor:
    updatePageOfOne,

  remarkEditor:
    updatePageOfOne,

  weirdoRoleplayEditor:
    updateWeirdo,

  hihiRoleplayEditor:
    updateHihi
};

function saveEditorSelection(editor) {
  const selection =
    window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0
  ) {
    return;
  }

  const range =
    selection.getRangeAt(0);

  if (
    editor.contains(
      range.commonAncestorContainer
    )
  ) {
    savedSelections.set(
      editor,
      range.cloneRange()
    );
  }
}

function restoreEditorSelection(editor) {
  const range =
    savedSelections.get(editor);

  if (!range) {
    return;
  }

  const selection =
    window.getSelection();

  selection.removeAllRanges();
  selection.addRange(range);
}

document
  .querySelectorAll(".dds-rich-editor")
  .forEach((editor) => {
    const updateFunction =
      richEditorUpdaters[editor.id];

    [
      "focus",
      "keyup",
      "mouseup"
    ].forEach((eventName) => {
      editor.addEventListener(
        eventName,
        () => {
          saveEditorSelection(editor);
        }
      );
    });

    editor.addEventListener(
      "input",
      () => {
        saveEditorSelection(editor);

        if (updateFunction) {
          updateFunction();
        }
      }
    );
  });

document
  .querySelectorAll(".dds-rich-toolbar")
  .forEach((toolbar) => {
    const editor =
      document.querySelector(
        `#${toolbar.dataset.toolbarFor}`
      );

    if (!editor) {
      return;
    }

    const updateFunction =
      richEditorUpdaters[editor.id];

    toolbar
      .querySelectorAll("[data-command]")
      .forEach((button) => {
        button.addEventListener(
          "mousedown",
          (event) => {
            event.preventDefault();

            editor.focus();
            restoreEditorSelection(editor);

            document.execCommand(
              "styleWithCSS",
              false,
              true
            );

            document.execCommand(
              button.dataset.command,
              false,
              null
            );

            saveEditorSelection(editor);

            if (updateFunction) {
              updateFunction();
            }
          }
        );
      });

    const colorInput =
      toolbar.querySelector(
        "[data-rich-color]"
      );

    if (colorInput) {
      colorInput.addEventListener(
        "input",
        () => {
          editor.focus();
          restoreEditorSelection(editor);

          document.execCommand(
            "styleWithCSS",
            false,
            true
          );

          document.execCommand(
            "foreColor",
            false,
            colorInput.value
          );

          saveEditorSelection(editor);

          if (updateFunction) {
            updateFunction();
          }
        }
      );
    }
  });


/* ==================================================
   COPY BUTTONS
================================================== */

const copyButton001 =
  document.querySelector(
    "#copyGeneratedCode"
  );

if (copyButton001) {
  copyButton001.addEventListener(
    "click",
    async () => {
      updatePageOfOne();

      await copyText(
        generatedCode.value,
        generatedCode
      );

      showToast(
        "คัดลอกโค้ด CODE001 เรียบร้อยแล้ว"
      );
    }
  );
}

const copyButton002 =
  document.querySelector(
    "#copyGeneratedWeirdoCode"
  );

if (copyButton002) {
  copyButton002.addEventListener(
    "click",
    async () => {
      updateWeirdo();

      await copyText(
        generatedWeirdoCode.value,
        generatedWeirdoCode
      );

      showToast(
        "คัดลอกโค้ด CODE002 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton003 =
  document.querySelector(
    "#copyGeneratedHihiCode"
  );

if (copyButton003) {
  copyButton003.addEventListener(
    "click",
    async () => {
      updateHihi();

      await copyText(
        generatedHihiCode.value,
        generatedHihiCode
      );

      showToast(
        "คัดลอกโค้ด CODE003 เรียบร้อยแล้ว"
      );
    }
  );
}


/* ==================================================
   RESET BUTTONS
================================================== */

const resetButton001 =
  document.querySelector(
    "#resetPageOfOne"
  );

if (resetButton001) {
  resetButton001.addEventListener(
    "click",
    () => {
      fields001.backg.value =
        defaults001.backg;

      fields001.border.value =
        defaults001.border;

      fields001.text.value =
        defaults001.text;

      fields001.quote.value =
        defaults001.quote;

      fields001.credit.value =
        defaults001.credit;

      fields001.displayName.value =
        defaults001.displayName;

      fields001.subtitle.value =
        defaults001.subtitle;

      fields001.quoteText.value =
        defaults001.quoteText;

      fields001.imageOne.value =
        defaults001.imageOne;

      fields001.imageOneX.value =
        defaults001.imageOneX;

      fields001.imageOneY.value =
        defaults001.imageOneY;

      fields001.imageTwo.value =
        defaults001.imageTwo;

      fields001.imageTwoX.value =
        defaults001.imageTwoX;

      fields001.imageTwoY.value =
        defaults001.imageTwoY;

      fields001.captionOne.value =
        defaults001.captionOne;

      fields001.captionTwo.value =
        defaults001.captionTwo;

      fields001.roleplay.textContent =
        defaults001.roleplay;

      fields001.remark.textContent =
        defaults001.remark;

      [
        ["backgColor", "backgColorPicker"],
        ["borderColor", "borderColorPicker"],
        ["textColor", "textColorPicker"],
        ["quoteColor", "quoteColorPicker"]
      ].forEach(([textId, pickerId]) => {
        const textInput =
          document.querySelector(
            `#${textId}`
          );

        const picker =
          document.querySelector(
            `#${pickerId}`
          );

        if (textInput && picker) {
          picker.value =
            normalizeColor(
              textInput.value,
              "#000000"
            );
        }
      });

      syncImagePositionOutputs();
      updatePageOfOne();

      showToast(
        "คืนค่า CODE001 เรียบร้อยแล้ว"
      );
    }
  );
}

const resetButton002 =
  document.querySelector(
    "#resetWeirdo"
  );

if (resetButton002) {
  resetButton002.addEventListener(
    "click",
    () => {
      fields002.backg.value =
        defaults002.backg;

      fields002.border.value =
        defaults002.border;

      fields002.line.value =
        defaults002.line;

      fields002.text.value =
        defaults002.text;

      fields002.topLeft.value =
        defaults002.topLeft;

      fields002.topRight.value =
        defaults002.topRight;

      fields002.displayName.value =
        defaults002.displayName;

      fields002.subtitle.value =
        defaults002.subtitle;

      fields002.imageLeftOne.value =
        defaults002.imageLeftOne;

      fields002.imageLeftOneX.value =
        defaults002.imageLeftOneX;

      fields002.imageLeftOneY.value =
        defaults002.imageLeftOneY;

      fields002.imageLeftTwo.value =
        defaults002.imageLeftTwo;

      fields002.imageLeftTwoX.value =
        defaults002.imageLeftTwoX;

      fields002.imageLeftTwoY.value =
        defaults002.imageLeftTwoY;

      fields002.imageCenter.value =
        defaults002.imageCenter;

      fields002.imageCenterX.value =
        defaults002.imageCenterX;

      fields002.imageCenterY.value =
        defaults002.imageCenterY;

      fields002.imageRightOne.value =
        defaults002.imageRightOne;

      fields002.imageRightOneX.value =
        defaults002.imageRightOneX;

      fields002.imageRightOneY.value =
        defaults002.imageRightOneY;

      fields002.imageRightTwo.value =
        defaults002.imageRightTwo;

      fields002.imageRightTwoX.value =
        defaults002.imageRightTwoX;

      fields002.imageRightTwoY.value =
        defaults002.imageRightTwoY;

      fields002.roleplay.innerHTML =
        defaults002.roleplay;

      fields002.footer.value =
        defaults002.footer;

      [
        ["wzBackgColor", "wzBackgColorPicker"],
        ["wzBorderColor", "wzBorderColorPicker"],
        ["wzLineColor", "wzLineColorPicker"],
        ["wzTextColor", "wzTextColorPicker"]
      ].forEach(([textId, pickerId]) => {
        const textInput =
          document.querySelector(
            `#${textId}`
          );

        const picker =
          document.querySelector(
            `#${pickerId}`
          );

        if (textInput && picker) {
          picker.value =
            normalizeColor(
              textInput.value,
              "#000000"
            );
        }
      });

      syncImagePositionOutputs();
      updateWeirdo();

      showToast(
        "คืนค่า CODE002 เรียบร้อยแล้ว"
      );
    }
  );
}



const resetButton003 =
  document.querySelector(
    "#resetHihi"
  );

if (resetButton003) {
  resetButton003.addEventListener(
    "click",
    () => {
      fields003.useBackground.checked =
        defaults003.useBackground;

      fields003.backg.value =
        defaults003.backg;

      fields003.backh.value =
        defaults003.backh;

      fields003.backhbttm.value =
        defaults003.backhbttm;

      fields003.border.value =
        defaults003.border;

      fields003.text.value =
        defaults003.text;

      fields003.image.value =
        defaults003.image;

      fields003.imageX.value =
        defaults003.imageX;

      fields003.imageY.value =
        defaults003.imageY;

      fields003.species.value =
        defaults003.species;

      fields003.nameLineOne.value =
        defaults003.nameLineOne;

      fields003.nameLineTwo.value =
        defaults003.nameLineTwo;

      fields003.heading.value =
        defaults003.heading;

      fields003.description.value =
        defaults003.description;

      fields003.roleplay.innerHTML =
        defaults003.roleplay;

      [
        ["hhBackgColor", "hhBackgColorPicker"],
        ["hhBackhColor", "hhBackhColorPicker"],
        ["hhBackhbttmColor", "hhBackhbttmColorPicker"],
        ["hhBorderColor", "hhBorderColorPicker"],
        ["hhTextColor", "hhTextColorPicker"]
      ].forEach(([textId, pickerId]) => {
        const textInput =
          document.querySelector(
            `#${textId}`
          );

        const picker =
          document.querySelector(
            `#${pickerId}`
          );

        if (textInput && picker) {
          picker.value =
            normalizeColor(
              textInput.value,
              "#000000"
            );
        }
      });

      syncImagePositionOutputs();
      updateHihi();

      showToast(
        "คืนค่า CODE003 เรียบร้อยแล้ว"
      );
    }
  );
}



document
  .querySelectorAll(
    "[data-image-position-range]"
  )
  .forEach((range) => {
    range.addEventListener(
      "input",
      syncImagePositionOutputs
    );

    range.addEventListener(
      "change",
      syncImagePositionOutputs
    );
  });

syncImagePositionOutputs();


/* ==================================================
   PREVIEW RESIZE BINDINGS
================================================== */

schedulePreviewResize(
  pageOfOnePreview,
  resizeEditorPreview
);

schedulePreviewResize(
  weirdoPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  hihiPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  roleplayCardPreview001,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview002,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview003,
  resizeCardPreview
);

let resizeTimer;

window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      resizeEditorPreview(
        pageOfOnePreview
      );

      resizeEditorPreview(
        weirdoPreview
      );

      resizeEditorPreview(
        hihiPreview
      );

      resizeCardPreview(
        roleplayCardPreview001
      );

      resizeCardPreview(
        roleplayCardPreview002
      );

      resizeCardPreview(
        roleplayCardPreview003
      );
    }, 120);
  }
);


/* ==================================================
   INITIALIZE
================================================== */

updatePageOfOne();
updateWeirdo();
updateHihi();
openPageFromHash();
