"use strict";

/* ==================================================
   PAGE ROUTING
================================================== */

const panels = document.querySelectorAll("[data-panel]");
const navigationButtons = document.querySelectorAll("[data-page]");
const goButtons = document.querySelectorAll("[data-go]");
const editButtons = document.querySelectorAll("[data-edit-code]");
const profileEditButtons = document.querySelectorAll("[data-edit-profile]");
const reviewEditButtons = document.querySelectorAll("[data-edit-review]");
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
  "editor-code003": "01",
  "editor-code004": "01",
  "editor-code005": "01",
  "editor-code006": "01",
  "editor-code007": "01",
  "editor-code008": "01",
  "editor-code009": "01",
  "editor-profile001": "02",
  "editor-review001": "03"
};

const pageTitles = {
  home: "― www. deep deep sleep code shop .com ―",
  roleplay: "― www. deep deep sleep code shop .com ―",
  profile: "― www. deep deep sleep code shop .com ―",
  review: "― www. deep deep sleep code shop .com ―",
  commission: "― www. deep deep sleep code shop .com ―",
  "editor-code001": "― www. deep deep sleep code shop .com ―",
  "editor-code002": "― www. deep deep sleep code shop .com ―",
  "editor-code003": "― www. deep deep sleep code shop .com ―",
  "editor-code004": "― www. deep deep sleep code shop .com ―",
  "editor-code005": "― www. deep deep sleep code shop .com ―",
  "editor-code006": "― www. deep deep sleep code shop .com ―",
  "editor-code007": "― www. deep deep sleep code shop .com ―",
  "editor-code008": "― www. deep deep sleep code shop .com ―",
  "editor-code009": "― www. deep deep sleep code shop .com ―",
  "editor-profile001": "― www. deep deep sleep code shop .com ―",
  "editor-review001": "― www. deep deep sleep code shop .com ―"
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
      validPage.startsWith("editor-review")
        ? "review"
        : validPage.startsWith("editor-profile")
          ? "profile"
          : validPage.startsWith("editor-")
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

  if (validPage === "editor-code004") {
    updateUuiaa();
  }

  if (validPage === "editor-code005") {
    updateComma();
  }

  if (validPage === "editor-code006") {
    updateNewRules();
  }

  if (validPage === "editor-code007") {
    updateLoveSong();
  }

  if (validPage === "editor-code008") {
    updateDumbDumber();
  }

  if (validPage === "editor-code009") {
    updateHigherHeaven();
  }

  if (validPage === "editor-profile001") {
    updatePolaroidLove();
  }

  if (validPage === "editor-review001") {
    updateFoodReview();
  }

  requestAnimationFrame(() => {
    activatePendingPreviews(
      validPage
    );
  });
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

    if (codeName === "code004") {
      openPage("editor-code004");
    }

    if (codeName === "code005") {
      openPage("editor-code005");
    }

    if (codeName === "code006") {
      openPage("editor-code006");
    }

    if (codeName === "code007") {
      openPage("editor-code007");
    }

    if (codeName === "code008") {
      openPage("editor-code008");
    }

    if (codeName === "code009") {
      openPage("editor-code009");
    }
  });
});

profileEditButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const profileName =
      button.dataset.editProfile;

    if (profileName === "profile001") {
      openPage("editor-profile001");
    }
  });
});

reviewEditButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const reviewName =
      button.dataset.editReview;

    if (reviewName === "review001") {
      openPage("editor-review001");
    }
  });
});

notReadyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showToast(
      "โค้ดนี้ยังไม่ได้ใส่แม่แบบแก้ไข ส่งโค้ด CODE009 มาเพิ่มได้ภายหลัง"
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

const fdreviewCreditCss = `.fdreview-credit{--fdreview-credit-y:-10px;width:100%;min-height:25px;padding:7px 12px 8px;display:flex;align-items:center;justify-content:center;position:relative;transform:translateY(var(--fdreview-credit-y));background:transparent;font-family:Arial,sans-serif}.fdreview-credit span{width:11px;height:10px;display:block;overflow:hidden;white-space:nowrap;color:rgba(185,185,185,.58);font-size:7px;font-weight:400;line-height:10px;letter-spacing:.7px;text-align:left;cursor:help;user-select:none;-webkit-user-select:none;transition:width .35s ease,color .25s ease}.fdreview-credit span::before{content:"✝ deepdeepsleepfranklin";display:block;width:135px;font-style:italic}.fdreview-credit span:hover{width:135px;color:rgba(215,215,215,.92)}`;

function buildCreditStyleTag() {
  return `<style>${fdreviewCreditCss}</style>`;
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

function buildBackgroundImageStyle(
  url,
  x,
  y
) {
  return `background-image:url('${escapeHtml(url)}');background-position:${x}% ${y}%;background-size:cover;background-repeat:no-repeat;`;
}

function formatEmojiOrSymbol(value) {
  const trimmed =
    String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  const entityMatch =
    trimmed.match(/^&#(\d+);?$/);

  const decimal =
    entityMatch
      ? entityMatch[1]
      : /^\d+$/.test(trimmed)
        ? trimmed
        : null;

  if (decimal) {
    const codePoint =
      Number(decimal);

    if (
      Number.isInteger(codePoint) &&
      codePoint >= 0 &&
      codePoint <= 1114111
    ) {
      return `&#${codePoint};`;
    }
  }

  return escapeHtml(trimmed);
}

function buildOptionalImageTag({
  url,
  className,
  x,
  y,
  fit = "contain",
  alt = ""
}) {
  const cleanUrl =
    String(url || "").trim();

  if (!cleanUrl) {
    return "";
  }

  return `<img class="${className}" src="${escapeHtml(cleanUrl)}" alt="${escapeHtml(alt)}" style="object-fit:${fit};object-position:${x}% ${y}%;">`;
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


/* ==================================================
   FAST + STABLE PREVIEW MANAGER
================================================== */

const previewStates =
  new WeakMap();

const cardPreviewObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const state =
              getPreviewState(
                entry.target
              );

            state.isNearViewport =
              entry.isIntersecting;

            if (entry.isIntersecting) {
              commitPendingPreview(
                entry.target,
                true
              );
            }
          });
        },
        {
          root: null,
          rootMargin:
            "520px 0px 520px 0px",
          threshold: 0.01
        }
      )
    : null;

function getPreviewState(iframe) {
  let state =
    previewStates.get(iframe);

  if (!state) {
    state = {
      pendingSrcdoc: "",
      currentSrcdoc: "",
      resizeFunction: null,
      timer: null,
      loaded: false,
      observed: false,
      isNearViewport: false,
      resizeObserver: null,
      resizeObserverTimer: null,
      assetTimer: null
    };

    previewStates.set(
      iframe,
      state
    );
  }

  return state;
}

function isCardPreviewIframe(iframe) {
  return iframe.classList.contains(
    "dds-roleplay-card-preview-frame"
  );
}

function isPreviewPanelActive(iframe) {
  const panel =
    iframe.closest("[data-panel]");

  return Boolean(
    panel?.classList.contains(
      "is-active"
    )
  );
}

function isPreviewNearViewport(iframe) {
  const rect =
    iframe.getBoundingClientRect();

  const margin = 520;

  return (
    rect.bottom >= -margin &&
    rect.top <=
      window.innerHeight + margin
  );
}

function markPreviewLoading(iframe) {
  if (
    iframe.classList.contains(
      "dds-preview-ready"
    )
  ) {
    return;
  }

  iframe.classList.add(
    "dds-preview-loading"
  );
}

function revealPreview(iframe) {
  iframe.classList.remove(
    "dds-preview-loading"
  );

  iframe.classList.add(
    "dds-preview-ready"
  );
}

function runPreviewResize(
  iframe,
  resizeFunction,
  reveal = false
) {
  if (
    !iframe ||
    typeof resizeFunction !==
      "function"
  ) {
    return;
  }

  requestAnimationFrame(() => {
    resizeFunction(iframe);

    requestAnimationFrame(() => {
      resizeFunction(iframe);

      if (reveal) {
        revealPreview(iframe);
      }
    });
  });
}

function watchPreviewAssets(
  iframe,
  resizeFunction
) {
  const state =
    getPreviewState(iframe);

  const previewDocument =
    iframe.contentDocument;

  if (!previewDocument) {
    return;
  }

  const refresh = () => {
    runPreviewResize(
      iframe,
      resizeFunction
    );
  };

  state.resizeObserver
    ?.disconnect();

  clearTimeout(
    state.resizeObserverTimer
  );

  const target =
    previewDocument.querySelector(
      ".dds-preview-target, .dds-card-preview-target"
    );

  const shell =
    previewDocument.querySelector(
      ".dds-preview-shell, .dds-card-preview-shell"
    );

  if (
    "ResizeObserver" in window &&
    (target || shell)
  ) {
    state.resizeObserver =
      new ResizeObserver(refresh);

    if (target) {
      state.resizeObserver.observe(
        target
      );
    }

    if (shell) {
      state.resizeObserver.observe(
        shell
      );
    }

    state.resizeObserverTimer =
      setTimeout(() => {
        state.resizeObserver
          ?.disconnect();
      }, 2600);
  }

  previewDocument.fonts
    ?.ready
    ?.then(refresh)
    .catch(() => {});

  previewDocument
    .querySelectorAll("img")
    .forEach((image) => {
      if (image.complete) {
        return;
      }

      image.addEventListener(
        "load",
        refresh,
        { once: true }
      );

      image.addEventListener(
        "error",
        refresh,
        { once: true }
      );
    });

  previewDocument
    .querySelectorAll(
      'link[rel="stylesheet"]'
    )
    .forEach((link) => {
      if (link.sheet) {
        return;
      }

      link.addEventListener(
        "load",
        refresh,
        { once: true }
      );

      link.addEventListener(
        "error",
        refresh,
        { once: true }
      );
    });

  clearTimeout(
    state.assetTimer
  );

  const delays = [
    70,
    180,
    420,
    850,
    1500,
    2400
  ];

  delays.forEach((delay) => {
    setTimeout(refresh, delay);
  });

  state.assetTimer =
    setTimeout(() => {
      runPreviewResize(
        iframe,
        resizeFunction,
        true
      );
    }, 130);
}

function updateLoadedPreviewDocument(
  iframe,
  srcdoc,
  resizeFunction
) {
  const previewDocument =
    iframe.contentDocument;

  if (
    !previewDocument ||
    previewDocument.readyState ===
      "loading"
  ) {
    return false;
  }

  const currentTarget =
    previewDocument.querySelector(
      ".dds-preview-target, .dds-card-preview-target"
    );

  if (!currentTarget) {
    return false;
  }

  const parsedDocument =
    new DOMParser().parseFromString(
      srcdoc,
      "text/html"
    );

  const nextTarget =
    parsedDocument.querySelector(
      ".dds-preview-target, .dds-card-preview-target"
    );

  if (!nextTarget) {
    return false;
  }

  currentTarget.innerHTML =
    nextTarget.innerHTML;

  watchPreviewAssets(
    iframe,
    resizeFunction
  );

  runPreviewResize(
    iframe,
    resizeFunction,
    true
  );

  return true;
}

function applyPreviewDocument(
  iframe
) {
  const state =
    getPreviewState(iframe);

  const srcdoc =
    state.pendingSrcdoc;

  if (
    !srcdoc ||
    !isPreviewPanelActive(iframe)
  ) {
    return;
  }

  if (
    isCardPreviewIframe(iframe) &&
    !state.isNearViewport &&
    !isPreviewNearViewport(iframe)
  ) {
    return;
  }

  if (
    state.currentSrcdoc === srcdoc &&
    state.loaded
  ) {
    runPreviewResize(
      iframe,
      state.resizeFunction,
      true
    );

    return;
  }

  if (
    state.loaded &&
    state.currentSrcdoc &&
    updateLoadedPreviewDocument(
      iframe,
      srcdoc,
      state.resizeFunction
    )
  ) {
    state.currentSrcdoc = srcdoc;
    return;
  }

  state.currentSrcdoc = srcdoc;
  state.loaded = false;

  markPreviewLoading(iframe);

  iframe.srcdoc = srcdoc;
}

function commitPendingPreview(
  iframe,
  immediate = false
) {
  const state =
    getPreviewState(iframe);

  clearTimeout(state.timer);

  const delay =
    immediate
      ? 0
      : isCardPreviewIframe(iframe)
        ? 35
        : 90;

  state.timer =
    setTimeout(() => {
      applyPreviewDocument(iframe);
    }, delay);
}

function queuePreviewDocument(
  iframe,
  srcdoc,
  resizeFunction
) {
  if (!iframe) {
    return;
  }

  const state =
    getPreviewState(iframe);

  state.pendingSrcdoc = srcdoc;
  state.resizeFunction =
    resizeFunction;

  if (
    isCardPreviewIframe(iframe) &&
    !state.observed
  ) {
    state.observed = true;

    if (cardPreviewObserver) {
      cardPreviewObserver.observe(
        iframe
      );
    }
  }

  if (!isPreviewPanelActive(iframe)) {
    return;
  }

  if (
    !isCardPreviewIframe(iframe) ||
    state.isNearViewport ||
    isPreviewNearViewport(iframe)
  ) {
    commitPendingPreview(iframe);
  }
}

function activatePendingPreviews(
  pageName
) {
  const panel =
    document.querySelector(
      `[data-panel="${pageName}"]`
    );

  if (!panel) {
    return;
  }

  panel
    .querySelectorAll(
      ".dds-editor-preview-frame, .dds-roleplay-card-preview-frame"
    )
    .forEach((iframe) => {
      const state =
        getPreviewState(iframe);

      if (
        !state.pendingSrcdoc
      ) {
        return;
      }

      if (
        !isCardPreviewIframe(iframe) ||
        isPreviewNearViewport(iframe)
      ) {
        state.isNearViewport = true;

        commitPendingPreview(
          iframe,
          true
        );
      }
    });
}

function measurePreviewVisualBounds(target) {
  const targetRect =
    target.getBoundingClientRect();

  let minX = 0;
  let minY = 0;

  let maxX = Math.max(
    target.scrollWidth,
    targetRect.width
  );

  let maxY = Math.max(
    target.scrollHeight,
    targetRect.height
  );

  const elements = [
    target,
    ...target.querySelectorAll("*")
  ];

  elements.forEach((element) => {
    const computed =
      element.ownerDocument
        ?.defaultView
        ?.getComputedStyle(element);

    if (
      computed?.display === "none" ||
      computed?.visibility === "hidden"
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    if (
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.top) ||
      rect.width === 0 ||
      rect.height === 0
    ) {
      return;
    }

    const left =
      rect.left - targetRect.left;

    const top =
      rect.top - targetRect.top;

    const right =
      rect.right - targetRect.left;

    const bottom =
      rect.bottom - targetRect.top;

    minX = Math.min(
      minX,
      left
    );

    minY = Math.min(
      minY,
      top
    );

    maxX = Math.max(
      maxX,
      right
    );

    maxY = Math.max(
      maxY,
      bottom
    );
  });

  return {
    minX,
    minY,
    width: Math.max(
      1,
      maxX - minX
    ),
    height: Math.max(
      1,
      maxY - minY
    )
  };
}

function resetVisualBoundsStyles(
  target,
  shell
) {
  target.style.position = "";
  target.style.left = "";
  target.style.top = "";
  target.style.transform = "none";
  target.style.transformOrigin = "";

  shell.style.display = "";
  shell.style.position = "";
  shell.style.width = "";
  shell.style.height = "";
  shell.style.margin = "";
}

function applyVisualBoundsPreview({
  iframe,
  target,
  shell,
  availableWidth,
  availableHeight = null,
  fitMode = "width"
}) {
  resetVisualBoundsStyles(
    target,
    shell
  );

  const bounds =
    measurePreviewVisualBounds(
      target
    );

  const widthScale =
    availableWidth /
    bounds.width;

  const heightScale =
    availableHeight
      ? availableHeight /
        bounds.height
      : 1;

  const scale =
    fitMode === "contain" &&
    availableHeight
      ? Math.min(
          1,
          widthScale,
          heightScale
        )
      : Math.min(
          1,
          widthScale
        );

  const scaledWidth =
    Math.ceil(
      bounds.width * scale
    );

  const scaledHeight =
    Math.ceil(
      bounds.height * scale
    );

  shell.style.display = "block";
  shell.style.position = "relative";
  shell.style.width =
    `${scaledWidth}px`;
  shell.style.height =
    `${scaledHeight}px`;
  shell.style.margin =
    "0 auto";

  target.style.position =
    "absolute";

  target.style.left =
    `${-bounds.minX * scale}px`;

  target.style.top =
    `${-bounds.minY * scale}px`;

  target.style.transformOrigin =
    "top left";

  target.style.transform =
    `scale(${scale})`;

  return {
    scale,
    width: scaledWidth,
    height: scaledHeight
  };
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

    const useVisualBounds =
      iframe.dataset.previewVisualBounds ===
      "true";

    if (useVisualBounds) {
      const availableWidth = Math.max(
        300,
        iframe.clientWidth - 44
      );

      const result =
        applyVisualBoundsPreview({
          iframe,
          target,
          shell,
          availableWidth,
          fitMode: "width"
        });

      iframe.style.height =
        `${result.height + 58}px`;

      return;
    }

    target.style.transform = "none";
    shell.style.height = "auto";

    const codeRoot =
      Array.from(
        target.children
      ).find((element) => {
        return element.tagName !== "STYLE";
      });

    const naturalWidth =
      Math.max(
        codeRoot?.scrollWidth || 0,
        codeRoot?.getBoundingClientRect()
          .width || 0,
        target.scrollWidth
      );

    const naturalHeight =
      Math.max(
        codeRoot?.scrollHeight || 0,
        target.scrollHeight
      );

    const availableWidth = Math.max(
      300,
      iframe.clientWidth - 44
    );

    const nativePreview =
      iframe.dataset.previewNative ===
      "true";

    const scale =
      nativePreview
        ? Math.min(
            1.12,
            availableWidth / naturalWidth
          )
        : Math.min(
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

    const shell =
      previewDocument?.querySelector(
        ".dds-card-preview-shell"
      );

    const useVisualBounds =
      iframe.dataset.previewVisualBounds ===
      "true";

    if (
      useVisualBounds &&
      shell
    ) {
      const availableWidth = Math.max(
        80,
        iframe.clientWidth - 24
      );

      const availableHeight = Math.max(
        60,
        iframe.clientHeight - 24
      );

      applyVisualBoundsPreview({
        iframe,
        target,
        shell,
        availableWidth,
        availableHeight,
        fitMode:
          iframe.dataset.previewFit ||
          "contain"
      });

      return;
    }

    target.style.transform = "none";

    const codeRoot =
      Array.from(
        target.children
      ).find((element) => {
        return element.tagName !== "STYLE";
      });

    const naturalWidth =
      Math.max(
        codeRoot?.scrollWidth || 0,
        codeRoot?.getBoundingClientRect()
          .width || 0,
        target.scrollWidth
      );

    const naturalHeight =
      Math.max(
        codeRoot?.scrollHeight || 0,
        target.scrollHeight
      );

    const availableWidth = Math.max(
      80,
      iframe.clientWidth - 24
    );

    const availableHeight = Math.max(
      60,
      iframe.clientHeight - 24
    );

    const fitMode =
      iframe.dataset.previewFit || "contain";

    const scale =
      fitMode === "width"
        ? Math.min(
            1,
            availableWidth / naturalWidth
          )
        : Math.min(
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

function resizePolaroidFixedCanvasPreview(iframe) {
  if (!iframe) {
    return;
  }

  const stage =
    iframe.closest(
      ".dds-profile-preview-stage, .dds-roleplay-card-preview"
    );

  if (!stage) {
    return;
  }

  const canvasWidth =
    Math.max(
      1,
      Number(
        iframe.dataset
          .profileCanvasWidth || 1100
      ) || 1100
    );

  const canvasHeight =
    Math.max(
      1,
      Number(
        iframe.dataset
          .profileCanvasHeight || 1500
      ) || 1500
    );

  const isEditorPreview =
    iframe.classList.contains(
      "dds-profile-editor-preview-frame"
    );

  const padding =
    isEditorPreview
      ? 28
      : 18;

  const availableWidth =
    Math.max(
      1,
      stage.clientWidth - padding
    );

  const availableHeight =
    Math.max(
      1,
      stage.clientHeight - padding
    );

  const fitScale =
    Math.min(
      availableWidth / canvasWidth,
      availableHeight / canvasHeight
    );

  if (isEditorPreview) {
    const zoom =
      Math.max(
        0.5,
        Math.min(
          2.5,
          Number(
            iframe.dataset.profileZoom || 1
          ) || 1
        )
      );

    const scale =
      fitScale * zoom;

    const host =
      iframe.closest(
        ".dds-profile-preview-canvas-host"
      );

    if (!host) {
      return;
    }

    const scaledWidth =
      Math.ceil(
        canvasWidth * scale
      );

    const scaledHeight =
      Math.ceil(
        canvasHeight * scale
      );

    host.style.width =
      `${scaledWidth}px`;

    host.style.height =
      `${scaledHeight}px`;

    const horizontalSpace =
      Math.max(
        14,
        Math.floor(
          (
            stage.clientWidth -
            scaledWidth
          ) / 2
        )
      );

    const verticalSpace =
      Math.max(
        14,
        Math.floor(
          (
            stage.clientHeight -
            scaledHeight
          ) / 2
        )
      );

    host.style.marginLeft =
      `${horizontalSpace}px`;

    host.style.marginRight =
      "14px";

    host.style.marginTop =
      `${verticalSpace}px`;

    host.style.marginBottom =
      "14px";

    iframe.style.setProperty(
      "--dds-profile-canvas-scale",
      String(scale)
    );

    updatePolaroidLoveZoomOutput();

    return;
  }

  iframe.style.setProperty(
    "--dds-profile-canvas-scale",
    String(fitScale)
  );
}

function updatePolaroidLoveZoomOutput() {
  const iframe =
    document.querySelector(
      "#polaroidLovePreview"
    );

  const output =
    document.querySelector(
      "#polaroidLoveZoomOutput"
    );

  if (!iframe || !output) {
    return;
  }

  const zoom =
    Number(
      iframe.dataset.profileZoom || 1
    ) || 1;

  output.textContent =
    `${Math.round(zoom * 100)}%`;
}

function setPolaroidLoveZoom(nextZoom) {
  const iframe =
    document.querySelector(
      "#polaroidLovePreview"
    );

  const stage =
    document.querySelector(
      "#polaroidLovePreviewStage"
    );

  if (!iframe) {
    return;
  }

  const previousZoom =
    Number(
      iframe.dataset.profileZoom || 1
    ) || 1;

  const zoom =
    Math.max(
      0.5,
      Math.min(
        2.5,
        nextZoom
      )
    );

  if (
    Math.abs(
      zoom - previousZoom
    ) < 0.001
  ) {
    return;
  }

  const centerRatioX =
    stage && stage.scrollWidth > 0
      ? (
          stage.scrollLeft +
          stage.clientWidth / 2
        ) /
        stage.scrollWidth
      : 0.5;

  const centerRatioY =
    stage && stage.scrollHeight > 0
      ? (
          stage.scrollTop +
          stage.clientHeight / 2
        ) /
        stage.scrollHeight
      : 0.5;

  iframe.dataset.profileZoom =
    zoom.toFixed(2);

  resizePolaroidFixedCanvasPreview(
    iframe
  );

  requestAnimationFrame(() => {
    if (!stage) {
      return;
    }

    stage.scrollLeft =
      Math.max(
        0,
        stage.scrollWidth *
          centerRatioX -
        stage.clientWidth / 2
      );

    stage.scrollTop =
      Math.max(
        0,
        stage.scrollHeight *
          centerRatioY -
        stage.clientHeight / 2
      );
  });
}


function resizeReviewDesktopCardPreview(iframe) {
  if (!iframe) {
    return;
  }

  const previewBox =
    iframe.closest(
      ".dds-roleplay-card-preview"
    );

  if (!previewBox) {
    return;
  }

  const desktopWidth =
    Math.max(
      1,
      Number(
        iframe.dataset
          .reviewDesktopWidth || 1300
      ) || 1300
    );

  const desktopHeight =
    Math.max(
      1,
      Number(
        iframe.dataset
          .reviewDesktopHeight || 920
      ) || 920
    );

  const availableWidth =
    Math.max(
      1,
      previewBox.clientWidth - 18
    );

  const availableHeight =
    Math.max(
      1,
      previewBox.clientHeight - 18
    );

  const scale =
    Math.min(
      availableWidth / desktopWidth,
      availableHeight / desktopHeight
    );

  iframe.style.setProperty(
    "--dds-review-card-scale",
    String(scale)
  );
}

function schedulePreviewResize(
  iframe,
  resizeFunction
) {
  if (!iframe) {
    return;
  }

  const state =
    getPreviewState(iframe);

  state.resizeFunction =
    resizeFunction;

  iframe.addEventListener("load", () => {
    state.loaded = true;

    watchPreviewAssets(
      iframe,
      resizeFunction
    );

    runPreviewResize(
      iframe,
      resizeFunction,
      true
    );
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
    queuePreviewDocument(
      pageOfOnePreview,
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/pageofone.css",
        buildPageOfOneMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview001) {
    queuePreviewDocument(
      roleplayCardPreview001,
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/pageofone.css",
        buildPageOfOneMarkup(data)
      ),
      resizeCardPreview
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
    queuePreviewDocument(
      weirdoPreview,
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/jnsz-weirdo-tzz.css",
        buildWeirdoMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview002) {
    queuePreviewDocument(
      roleplayCardPreview002,
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/jnsz-weirdo-tzz.css",
        buildWeirdoMarkup(data)
      ),
      resizeCardPreview
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
    queuePreviewDocument(
      hihiPreview,
      buildEditorPreviewDocument(
        hihiStylesheets,
        buildHihiMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview003) {
    queuePreviewDocument(
      roleplayCardPreview003,
      buildCardPreviewDocument(
        hihiStylesheets,
        buildHihiMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE004 — U-I-A U-I-A U-E
================================================== */

const uuiaaPreview =
  document.querySelector(
    "#uuiaaPreview"
  );

const roleplayCardPreview004 =
  document.querySelector(
    "#roleplayCardPreview004"
  );

const generatedUuiaaCode =
  document.querySelector(
    "#generatedUuiaaCode"
  );

const fields004 = {
  backg:
    document.querySelector(
      "#mmBackgColor"
    ),

  border:
    document.querySelector(
      "#mmBorderColor"
    ),

  textOne:
    document.querySelector(
      "#mmTextOneColor"
    ),

  name:
    document.querySelector(
      "#mmNameColor"
    ),

  textTwo:
    document.querySelector(
      "#mmTextTwoColor"
    ),

  miniText:
    document.querySelector(
      "#mmMiniTextColor"
    ),

  species:
    document.querySelector(
      "#mmSpecies"
    ),

  firstLetter:
    document.querySelector(
      "#mmFirstLetter"
    ),

  displayName:
    document.querySelector(
      "#mmDisplayName"
    ),

  caption:
    document.querySelector(
      "#mmCaption"
    ),

  leftVerticalText:
    document.querySelector(
      "#mmLeftVerticalText"
    ),

  leftImage:
    document.querySelector(
      "#mmLeftImage"
    ),

  leftImageX:
    document.querySelector(
      "#mmLeftImageX"
    ),

  leftImageY:
    document.querySelector(
      "#mmLeftImageY"
    ),

  leftIcon:
    document.querySelector(
      "#mmLeftIcon"
    ),

  leftIconX:
    document.querySelector(
      "#mmLeftIconX"
    ),

  leftIconY:
    document.querySelector(
      "#mmLeftIconY"
    ),

  centerImage:
    document.querySelector(
      "#mmCenterImage"
    ),

  centerImageX:
    document.querySelector(
      "#mmCenterImageX"
    ),

  centerImageY:
    document.querySelector(
      "#mmCenterImageY"
    ),

  centerIcon:
    document.querySelector(
      "#mmCenterIcon"
    ),

  centerIconX:
    document.querySelector(
      "#mmCenterIconX"
    ),

  centerIconY:
    document.querySelector(
      "#mmCenterIconY"
    ),

  rightShortText:
    document.querySelector(
      "#mmRightShortText"
    ),

  rightVerticalText:
    document.querySelector(
      "#mmRightVerticalText"
    ),

  rightImage:
    document.querySelector(
      "#mmRightImage"
    ),

  rightImageX:
    document.querySelector(
      "#mmRightImageX"
    ),

  rightImageY:
    document.querySelector(
      "#mmRightImageY"
    ),

  rightIcon:
    document.querySelector(
      "#mmRightIcon"
    ),

  rightIconX:
    document.querySelector(
      "#mmRightIconX"
    ),

  rightIconY:
    document.querySelector(
      "#mmRightIconY"
    ),

  roleplay:
    document.querySelector(
      "#uuiaaRoleplayEditor"
    ),

  footer:
    document.querySelector(
      "#mmFooterNote"
    )
};

const defaults004 = {
  backg: "#fffafa",
  border: "#949494",
  textOne: "#f48fb1",
  name: "#000000",
  textTwo: "#555555",
  miniText: "#b0aeae",
  species: "vampire",
  firstLetter: "F",
  displayName:
    "ranklin D.Bloodworth",
  caption:
    "I can smell that hot blood just under your skin",
  leftVerticalText:
    "Franklin D.Bloodworth",
  leftImage:
    "https://i.pinimg.com/1200x/3e/af/9a/3eaf9a88c175ed4b9289b598b3192add.jpg",
  leftImageX: 50,
  leftImageY: 50,
  leftIcon:
    "https://iili.io/B6Q10Rj.png",
  leftIconX: 50,
  leftIconY: 50,
  centerImage:
    "https://i.pinimg.com/736x/ec/67/e6/ec67e6bc9336afef549cdcff98e4deb4.jpg",
  centerImageX: 50,
  centerImageY: 50,
  centerIcon:
    "https://iili.io/B6QM9Hu.png",
  centerIconX: 50,
  centerIconY: 50,
  rightShortText: "Boo!",
  rightVerticalText:
    "Franklin D.Bloodworth",
  rightImage:
    "https://i.pinimg.com/1200x/3c/2a/9e/3c2a9e3841b607b1ed13288cbfce303e.jpg",
  rightImageX: 50,
  rightImageY: 50,
  rightIcon:
    "https://iili.io/B6QM7fI.png",
  rightIconX: 50,
  rightIconY: 50,
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  footer:
    "I'm your bad habit, yeahyou want me and you can't stop it"
};

function getUuiaaData() {
  return {
    backg:
      normalizeColor(
        fields004.backg.value,
        defaults004.backg
      ),

    border:
      normalizeColor(
        fields004.border.value,
        defaults004.border
      ),

    textOne:
      normalizeColor(
        fields004.textOne.value,
        defaults004.textOne
      ),

    name:
      normalizeColor(
        fields004.name.value,
        defaults004.name
      ),

    textTwo:
      normalizeColor(
        fields004.textTwo.value,
        defaults004.textTwo
      ),

    miniText:
      normalizeColor(
        fields004.miniText.value,
        defaults004.miniText
      ),

    species:
      fields004.species.value,

    firstLetter:
      fields004.firstLetter.value,

    displayName:
      fields004.displayName.value,

    caption:
      fields004.caption.value,

    leftVerticalText:
      fields004.leftVerticalText.value,

    leftImage:
      fields004.leftImage.value.trim(),

    leftImageX:
      normalizePosition(
        fields004.leftImageX.value,
        defaults004.leftImageX
      ),

    leftImageY:
      normalizePosition(
        fields004.leftImageY.value,
        defaults004.leftImageY
      ),

    leftIcon:
      fields004.leftIcon.value.trim(),

    leftIconX:
      normalizePosition(
        fields004.leftIconX.value,
        defaults004.leftIconX
      ),

    leftIconY:
      normalizePosition(
        fields004.leftIconY.value,
        defaults004.leftIconY
      ),

    centerImage:
      fields004.centerImage.value.trim(),

    centerImageX:
      normalizePosition(
        fields004.centerImageX.value,
        defaults004.centerImageX
      ),

    centerImageY:
      normalizePosition(
        fields004.centerImageY.value,
        defaults004.centerImageY
      ),

    centerIcon:
      fields004.centerIcon.value.trim(),

    centerIconX:
      normalizePosition(
        fields004.centerIconX.value,
        defaults004.centerIconX
      ),

    centerIconY:
      normalizePosition(
        fields004.centerIconY.value,
        defaults004.centerIconY
      ),

    rightShortText:
      fields004.rightShortText.value,

    rightVerticalText:
      fields004.rightVerticalText.value,

    rightImage:
      fields004.rightImage.value.trim(),

    rightImageX:
      normalizePosition(
        fields004.rightImageX.value,
        defaults004.rightImageX
      ),

    rightImageY:
      normalizePosition(
        fields004.rightImageY.value,
        defaults004.rightImageY
      ),

    rightIcon:
      fields004.rightIcon.value.trim(),

    rightIconX:
      normalizePosition(
        fields004.rightIconX.value,
        defaults004.rightIconX
      ),

    rightIconY:
      normalizePosition(
        fields004.rightIconY.value,
        defaults004.rightIconY
      ),

    roleplay:
      normalizeRichParagraphHtml(
        fields004.roleplay.innerHTML
      ),

    footer:
      fields004.footer.value
  };
}

function buildUuiaaMarkup(data) {
  const leftIcon =
    buildOptionalImageTag({
      url: data.leftIcon,
      className: "uuiiaamymyzz-icon",
      x: data.leftIconX,
      y: data.leftIconY,
      fit: "contain",
      alt: ""
    });

  const centerIcon =
    buildOptionalImageTag({
      url: data.centerIcon,
      className: "uuiiaamymy02-icon",
      x: data.centerIconX,
      y: data.centerIconY,
      fit: "contain",
      alt: ""
    });

  const rightIcon =
    buildOptionalImageTag({
      url: data.rightIcon,
      className: "uuiiaamymy-icon",
      x: data.rightIconX,
      y: data.rightIconY,
      fit: "contain",
      alt: ""
    });

  return `<div class="mymy-uuiiaa-box" style="--mmbackg:${data.backg};--mmborder:${data.border};--textone:${data.textOne};--mmnamez:${data.name};--texttwo:${data.textTwo};--minitext:${data.miniText};">
<div class="uuiiaamymy-main-container">
<h3 class="uuiiaamymy-subtitle">${escapeHtml(data.species)}</h3>
<h1 class="uuiiaamymy-name"><span class="uuiiaamymy-cursive">${escapeHtml(data.firstLetter)}</span>${escapeHtml(data.displayName)}</h1>
<h3 class="uuiiaamymy-caption">${textWithBreaks(data.caption)}</h3>
<div class="uuiiaamymy-gallery-section">
<div class="uuiiaamymy-image-card left-card">
<span class="uuiiaamymy-vertical-text">${escapeHtml(data.leftVerticalText)}</span>
<img src="${escapeHtml(data.leftImage)}" alt="Left Image" style="${buildImagePositionStyle(data.leftImageX, data.leftImageY)}">
${leftIcon}</div>
<div class="uuiiaamymy-image-card polaroid">
<img src="${escapeHtml(data.centerImage)}" alt="Center Image" style="${buildImagePositionStyle(data.centerImageX, data.centerImageY)}"></div>
<div class="uuiiaamymy-image-card right-card"><span class="uuiiaamymy-d">${escapeHtml(data.rightShortText)}</span>
<img src="${escapeHtml(data.rightImage)}" alt="Right Image" style="${buildImagePositionStyle(data.rightImageX, data.rightImageY)}">
${rightIcon}
${centerIcon}
<span class="uuiiaamymy-vertical-text02">${escapeHtml(data.rightVerticalText)}</span>
</div></div>
<div class="uuiiaamymy-text">
${data.roleplay}
</div><div class="uuiiaamymy-footer-note">${textWithBreaks(data.footer)}</div></div></div>
${fdreviewCreditMarkup}`;
}

function buildUuiaaFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/uuiiaa-rebyes.css" rel="stylesheet">
${buildCreditStyleTag()}
${buildUuiaaMarkup(data)}`;
}

function updateUuiaa() {
  if (!generatedUuiaaCode) {
    return;
  }

  const data =
    getUuiaaData();

  generatedUuiaaCode.value =
    buildUuiaaFinalCode(data);

  if (uuiaaPreview) {
    queuePreviewDocument(
      uuiaaPreview,
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/uuiiaa-rebyes.css",
        buildUuiaaMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview004) {
    queuePreviewDocument(
      roleplayCardPreview004,
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/uuiiaa-rebyes.css",
        buildUuiaaMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE005 — THIS HITS LIKE COMA
================================================== */

const commaPreview =
  document.querySelector(
    "#commaPreview"
  );

const roleplayCardPreview005 =
  document.querySelector(
    "#roleplayCardPreview005"
  );

const generatedCommaCode =
  document.querySelector(
    "#generatedCommaCode"
  );

const fields005 = {
  backg:
    document.querySelector(
      "#commaBgColor"
    ),

  border:
    document.querySelector(
      "#commaBorderColor"
    ),

  name:
    document.querySelector(
      "#commaNameColor"
    ),

  text:
    document.querySelector(
      "#commaTextColor"
    ),

  muted:
    document.querySelector(
      "#commaMutedColor"
    ),

  topText:
    document.querySelector(
      "#commaTopText"
    ),

  displayName:
    document.querySelector(
      "#commaDisplayName"
    ),

  imageOne:
    document.querySelector(
      "#commaImageOne"
    ),

  imageOneX:
    document.querySelector(
      "#commaImageOneX"
    ),

  imageOneY:
    document.querySelector(
      "#commaImageOneY"
    ),

  imageTwo:
    document.querySelector(
      "#commaImageTwo"
    ),

  imageTwoX:
    document.querySelector(
      "#commaImageTwoX"
    ),

  imageTwoY:
    document.querySelector(
      "#commaImageTwoY"
    ),

  imageThree:
    document.querySelector(
      "#commaImageThree"
    ),

  imageThreeX:
    document.querySelector(
      "#commaImageThreeX"
    ),

  imageThreeY:
    document.querySelector(
      "#commaImageThreeY"
    ),

  imageFour:
    document.querySelector(
      "#commaImageFour"
    ),

  imageFourX:
    document.querySelector(
      "#commaImageFourX"
    ),

  imageFourY:
    document.querySelector(
      "#commaImageFourY"
    ),

  roleplay:
    document.querySelector(
      "#commaRoleplayEditor"
    ),

  footerLeft:
    document.querySelector(
      "#commaFooterLeft"
    ),

  footerCenter:
    document.querySelector(
      "#commaFooterCenter"
    ),

  footerRight:
    document.querySelector(
      "#commaFooterRight"
    )
};

const defaults005 = {
  backg: "#ffffff",
  border: "#415986",
  name: "#000000",
  text: "#000000",
  muted: "#666666",
  topText: "1309",
  displayName:
    "Franklin D. Bloodworth",
  imageOne:
    "https://i.pinimg.com/736x/2a/eb/f0/2aebf0d221a26adcb36d611c0e606b0b.jpg",
  imageOneX: 50,
  imageOneY: 50,
  imageTwo:
    "https://i.pinimg.com/736x/fb/10/2f/fb102f9936c2d4083353a5c32c83f2a2.jpg",
  imageTwoX: 50,
  imageTwoY: 50,
  imageThree:
    "https://s12.gifyu.com/images/bEjFx.jpg",
  imageThreeX: 50,
  imageThreeY: 50,
  imageFour:
    "https://i.pinimg.com/736x/12/ce/86/12ce86bf9f12d5606856760781a35613.jpg",
  imageFourX: 50,
  imageFourY: 50,
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  footerLeft: "✦",
  footerCenter: "NO LABELS",
  footerRight: "✧"
};

const commaStylesheets = [
  "https://guindaeyo.github.io/deepdshop/ddsh-comma.css",
  "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,600&display=swap"
];

function getCommaData() {
  return {
    backg:
      normalizeColor(
        fields005.backg.value,
        defaults005.backg
      ),

    border:
      normalizeColor(
        fields005.border.value,
        defaults005.border
      ),

    name:
      normalizeColor(
        fields005.name.value,
        defaults005.name
      ),

    text:
      normalizeColor(
        fields005.text.value,
        defaults005.text
      ),

    muted:
      normalizeColor(
        fields005.muted.value,
        defaults005.muted
      ),

    topText:
      fields005.topText.value,

    displayName:
      fields005.displayName.value,

    imageOne:
      fields005.imageOne.value.trim(),

    imageOneX:
      normalizePosition(
        fields005.imageOneX.value,
        defaults005.imageOneX
      ),

    imageOneY:
      normalizePosition(
        fields005.imageOneY.value,
        defaults005.imageOneY
      ),

    imageTwo:
      fields005.imageTwo.value.trim(),

    imageTwoX:
      normalizePosition(
        fields005.imageTwoX.value,
        defaults005.imageTwoX
      ),

    imageTwoY:
      normalizePosition(
        fields005.imageTwoY.value,
        defaults005.imageTwoY
      ),

    imageThree:
      fields005.imageThree.value.trim(),

    imageThreeX:
      normalizePosition(
        fields005.imageThreeX.value,
        defaults005.imageThreeX
      ),

    imageThreeY:
      normalizePosition(
        fields005.imageThreeY.value,
        defaults005.imageThreeY
      ),

    imageFour:
      fields005.imageFour.value.trim(),

    imageFourX:
      normalizePosition(
        fields005.imageFourX.value,
        defaults005.imageFourX
      ),

    imageFourY:
      normalizePosition(
        fields005.imageFourY.value,
        defaults005.imageFourY
      ),

    roleplay:
      normalizeRichParagraphHtml(
        fields005.roleplay.innerHTML
      ),

    footerLeft:
      fields005.footerLeft.value,

    footerCenter:
      fields005.footerCenter.value,

    footerRight:
      fields005.footerRight.value
  };
}

function buildCommaMarkup(data) {
  return `<div class="cy650" style="--bggcolor:${data.backg};--border-color:${data.border};--txtfont:${data.text};--nametxtfont:${data.name};--muted:${data.muted};"><div class="cy650-top"><div class="line"></div><div class="num">${escapeHtml(data.topText)}</div></div>
<div class="cy650-grid"><div class="cy650-img cy-a"><img src="${escapeHtml(data.imageOne)}" alt="" style="${buildImagePositionStyle(data.imageOneX, data.imageOneY)}"></div><div class="cy650-img cy-b"><img src="${escapeHtml(data.imageTwo)}" alt="" style="${buildImagePositionStyle(data.imageTwoX, data.imageTwoY)}"></div><div class="cy650-img cy-c"><img src="${escapeHtml(data.imageThree)}" alt="" style="${buildImagePositionStyle(data.imageThreeX, data.imageThreeY)}"></div><div class="cy650-img cy-d"><img src="${escapeHtml(data.imageFour)}" alt="" style="${buildImagePositionStyle(data.imageFourX, data.imageFourY)}"></div></div>
<div class="cy650-title"><div class="word"><span>${escapeHtml(data.displayName)}</span><div class="line"></div></div></div>
<div class="cy650-rp"><div>
${data.roleplay}
</div></div>
<div class="cy650-foot"><div>${escapeHtml(data.footerLeft)}</div><div class="center">${escapeHtml(data.footerCenter)}</div><div>${escapeHtml(data.footerRight)}</div><div></div></div></div>
${fdreviewCreditMarkup}`;
}

function buildCommaFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/ddsh-comma.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&amp;family=Cormorant+Garamond:ital,wght@0,400;0,600;1,600&amp;display=swap" rel="stylesheet">
${buildCreditStyleTag()}
${buildCommaMarkup(data)}`;
}

function updateComma() {
  if (!generatedCommaCode) {
    return;
  }

  const data =
    getCommaData();

  generatedCommaCode.value =
    buildCommaFinalCode(data);

  if (commaPreview) {
    queuePreviewDocument(
      commaPreview,
      buildEditorPreviewDocument(
        commaStylesheets,
        buildCommaMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview005) {
    queuePreviewDocument(
      roleplayCardPreview005,
      buildCardPreviewDocument(
        commaStylesheets,
        buildCommaMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE006 — NEW RULES, I'M TROUBLEMAKER
================================================== */

const newRulesPreview =
  document.querySelector(
    "#newRulesPreview"
  );

const roleplayCardPreview006 =
  document.querySelector(
    "#roleplayCardPreview006"
  );

const generatedNewRulesCode =
  document.querySelector(
    "#generatedNewRulesCode"
  );

const fields006 = {
  bg:
    document.querySelector(
      "#nrBgColor"
    ),

  card:
    document.querySelector(
      "#nrCardColor"
    ),

  pill:
    document.querySelector(
      "#nrPillColor"
    ),

  pillTwo:
    document.querySelector(
      "#nrPillTwoColor"
    ),

  textRoleplay:
    document.querySelector(
      "#nrTextRoleplayColor"
    ),

  textName:
    document.querySelector(
      "#nrTextNameColor"
    ),

  textUnder:
    document.querySelector(
      "#nrTextUnderColor"
    ),

  dotOne:
    document.querySelector(
      "#nrDotOneColor"
    ),

  dotTwo:
    document.querySelector(
      "#nrDotTwoColor"
    ),

  dotThree:
    document.querySelector(
      "#nrDotThreeColor"
    ),

  dotFour:
    document.querySelector(
      "#nrDotFourColor"
    ),

  sideInfo:
    document.querySelector(
      "#nrSideInfo"
    ),

  sideProfile:
    document.querySelector(
      "#nrSideProfile"
    ),

  displayName:
    document.querySelector(
      "#nrDisplayName"
    ),

  bigAvatar:
    document.querySelector(
      "#nrBigAvatar"
    ),

  bigAvatarX:
    document.querySelector(
      "#nrBigAvatarX"
    ),

  bigAvatarY:
    document.querySelector(
      "#nrBigAvatarY"
    ),

  species:
    document.querySelector(
      "#nrSpecies"
    ),

  miniAvatar:
    document.querySelector(
      "#nrMiniAvatar"
    ),

  miniAvatarX:
    document.querySelector(
      "#nrMiniAvatarX"
    ),

  miniAvatarY:
    document.querySelector(
      "#nrMiniAvatarY"
    ),

  websiteText:
    document.querySelector(
      "#nrWebsiteText"
    ),

  accountAvatar:
    document.querySelector(
      "#nrAccountAvatar"
    ),

  accountAvatarX:
    document.querySelector(
      "#nrAccountAvatarX"
    ),

  accountAvatarY:
    document.querySelector(
      "#nrAccountAvatarY"
    ),

  accountName:
    document.querySelector(
      "#nrAccountName"
    ),

  accountSubtitle:
    document.querySelector(
      "#nrAccountSubtitle"
    ),

  roleplay:
    document.querySelector(
      "#newRulesRoleplayEditor"
    ),

  replyText:
    document.querySelector(
      "#nrReplyText"
    ),

  actionOne:
    document.querySelector(
      "#nrActionOne"
    ),

  actionTwo:
    document.querySelector(
      "#nrActionTwo"
    ),

  actionThree:
    document.querySelector(
      "#nrActionThree"
    ),

  sendIcon:
    document.querySelector(
      "#nrSendIcon"
    ),

  noteText:
    document.querySelector(
      "#nrNoteText"
    ),

  footerAvatar:
    document.querySelector(
      "#nrFooterAvatar"
    ),

  footerAvatarX:
    document.querySelector(
      "#nrFooterAvatarX"
    ),

  footerAvatarY:
    document.querySelector(
      "#nrFooterAvatarY"
    ),

  footerText:
    document.querySelector(
      "#nrFooterText"
    )
};

const defaults006 = {
  bg: "#000000",
  card: "#ffffff",
  pill: "#b0120a",
  pillTwo: "#f7e9eb",
  textRoleplay: "#000000",
  textName: "#000000",
  textUnder: "#ffffff",
  dotOne: "#f0c6cb",
  dotTwo: "#cdd6b5",
  dotThree: "#e9d3d8",
  dotFour: "#bfcaa1",
  sideInfo: "info",
  sideProfile: "profile",
  displayName:
    "Franklin D. Bloodworth",
  bigAvatar:
    "https://i.pinimg.com/originals/02/1f/76/021f765d9949819655d126fb615755d2.gif",
  bigAvatarX: 50,
  bigAvatarY: 50,
  species: "Vampire",
  miniAvatar:
    "https://s13.gifyu.com/images/bveD6.png",
  miniAvatarX: 50,
  miniAvatarY: 50,
  websiteText: "404 Not Found",
  accountAvatar:
    "https://i.pinimg.com/736x/f0/4d/ac/f04dac7b07081300b88df1a8a9cb2737.jpg",
  accountAvatarX: 50,
  accountAvatarY: 50,
  accountName: "@noturmeow",
  accountSubtitle:
    "I can smell that hot blood\njust under your skin.",
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  replyText:
    "ordinary vampire",
  actionOne: "♡",
  actionTwo: "128049",
  actionThree: "128293",
  sendIcon: "✦",
  noteText: "หมายเหตุ",
  footerAvatar:
    "https://i.pinimg.com/736x/7a/41/a9/7a41a9da2d1b1ac800debddb139f4a9a.jpg",
  footerAvatarX: 50,
  footerAvatarY: 50,
  footerText:
    "In motion (Yeah, stay just like that) We're flowin' (Only for me)\nJust like that, just you and me. I wanna dive in deeper. Into your ocean, I like you just like this"
};

const newRulesStylesheets = [
  "https://guindaeyo.github.io/deepdshop/ddshop-newrules.css",
  "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap"
];

function getNewRulesData() {
  return {
    bg:
      normalizeColor(
        fields006.bg.value,
        defaults006.bg
      ),

    card:
      normalizeColor(
        fields006.card.value,
        defaults006.card
      ),

    pill:
      normalizeColor(
        fields006.pill.value,
        defaults006.pill
      ),

    pillTwo:
      normalizeColor(
        fields006.pillTwo.value,
        defaults006.pillTwo
      ),

    textRoleplay:
      normalizeColor(
        fields006.textRoleplay.value,
        defaults006.textRoleplay
      ),

    textName:
      normalizeColor(
        fields006.textName.value,
        defaults006.textName
      ),

    textUnder:
      normalizeColor(
        fields006.textUnder.value,
        defaults006.textUnder
      ),

    dotOne:
      normalizeColor(
        fields006.dotOne.value,
        defaults006.dotOne
      ),

    dotTwo:
      normalizeColor(
        fields006.dotTwo.value,
        defaults006.dotTwo
      ),

    dotThree:
      normalizeColor(
        fields006.dotThree.value,
        defaults006.dotThree
      ),

    dotFour:
      normalizeColor(
        fields006.dotFour.value,
        defaults006.dotFour
      ),

    sideInfo:
      fields006.sideInfo.value,

    sideProfile:
      fields006.sideProfile.value,

    displayName:
      fields006.displayName.value,

    bigAvatar:
      fields006.bigAvatar.value.trim(),

    bigAvatarX:
      normalizePosition(
        fields006.bigAvatarX.value,
        defaults006.bigAvatarX
      ),

    bigAvatarY:
      normalizePosition(
        fields006.bigAvatarY.value,
        defaults006.bigAvatarY
      ),

    species:
      fields006.species.value,

    miniAvatar:
      fields006.miniAvatar.value.trim(),

    miniAvatarX:
      normalizePosition(
        fields006.miniAvatarX.value,
        defaults006.miniAvatarX
      ),

    miniAvatarY:
      normalizePosition(
        fields006.miniAvatarY.value,
        defaults006.miniAvatarY
      ),

    websiteText:
      fields006.websiteText.value,

    accountAvatar:
      fields006.accountAvatar.value.trim(),

    accountAvatarX:
      normalizePosition(
        fields006.accountAvatarX.value,
        defaults006.accountAvatarX
      ),

    accountAvatarY:
      normalizePosition(
        fields006.accountAvatarY.value,
        defaults006.accountAvatarY
      ),

    accountName:
      fields006.accountName.value,

    accountSubtitle:
      fields006.accountSubtitle.value,

    roleplay:
      normalizeRichParagraphHtml(
        fields006.roleplay.innerHTML
      ),

    replyText:
      fields006.replyText.value,

    actionOne:
      fields006.actionOne.value,

    actionTwo:
      fields006.actionTwo.value,

    actionThree:
      fields006.actionThree.value,

    sendIcon:
      fields006.sendIcon.value,

    noteText:
      fields006.noteText.value,

    footerAvatar:
      fields006.footerAvatar.value.trim(),

    footerAvatarX:
      normalizePosition(
        fields006.footerAvatarX.value,
        defaults006.footerAvatarX
      ),

    footerAvatarY:
      normalizePosition(
        fields006.footerAvatarY.value,
        defaults006.footerAvatarY
      ),

    footerText:
      fields006.footerText.value
  };
}

function buildNewRulesMarkup(data) {
  return `<div class="babiezfrn-zi" style="--bg:${data.bg};--card:${data.card};--pill:${data.pill};--pill2:${data.pillTwo};--textro:${data.textRoleplay};--textname:${data.textName};--textun:${data.textUnder};--dot1:${data.dotOne};--dot2:${data.dotTwo};--dot3:${data.dotThree};--dot4:${data.dotFour};"><div class="babiezfrn-left"><div class="babiezfrn-sidepill">${escapeHtml(data.sideInfo)}</div><div class="babiezfrn-sidepill small">${escapeHtml(data.sideProfile)}</div><div class="babiezfrn-dots"><i></i><i></i><i></i><i></i></div></div><div class="babiezfrn-slider"><div class="knob"></div></div><div class="babiezfrn-float">
<img class="bigav" src="${escapeHtml(data.bigAvatar)}" alt="" style="${buildImagePositionStyle(data.bigAvatarX, data.bigAvatarY)}"><div class="pill">${escapeHtml(data.displayName)}</div></div>
<div class="babiezfrn-card"><div class="babiezfrn-topstrip"><span class="babiezfrn-dot"></span><div class="babiezfrn-tab"><span>${escapeHtml(data.species)}</span><span style="opacity:.6;">→</span><img class="babiezfrn-miniav" src="${escapeHtml(data.miniAvatar)}" alt="" style="${buildImagePositionStyle(data.miniAvatarX, data.miniAvatarY)}"><b>${escapeHtml(data.websiteText)}</b><span class="x">×</span></div></div><div class="babiezfrn-inner"><div class="babiezfrn-head"><img class="av" src="${escapeHtml(data.accountAvatar)}" alt="" style="${buildImagePositionStyle(data.accountAvatarX, data.accountAvatarY)}"><div class="babiezfrn-title"><b>${escapeHtml(data.accountName)}</b><span>${textWithBreaks(data.accountSubtitle)}</span></div><div class="babiezfrn-menu">⋮</div></div><div class="babiezfrn-conf"><p>
${data.roleplay}</p></div>
<div class="babiezfrn-reply">${escapeHtml(data.replyText)}</div><div class="babiezfrn-actions"><div class="babiezfrn-ico">${formatEmojiOrSymbol(data.actionOne)}</div><div class="babiezfrn-ico">${formatEmojiOrSymbol(data.actionTwo)}</div><div class="babiezfrn-ico">${formatEmojiOrSymbol(data.actionThree)}</div><div class="spacer"></div><div class="babiezfrn-btn"><span class="sendico">${formatEmojiOrSymbol(data.sendIcon)}</span>${escapeHtml(data.noteText)}</div></div></div></div>
<div class="babiezfrn-foot"><img class="fava" src="${escapeHtml(data.footerAvatar)}" alt="" style="${buildImagePositionStyle(data.footerAvatarX, data.footerAvatarY)}"><div>${textWithBreaks(data.footerText)}</div></div></div>
${fdreviewCreditMarkup}`;
}

function buildNewRulesFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/ddshop-newrules.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&amp;display=swap" rel="stylesheet">
${buildCreditStyleTag()}
${buildNewRulesMarkup(data)}`;
}

function updateNewRules() {
  if (!generatedNewRulesCode) {
    return;
  }

  const data =
    getNewRulesData();

  generatedNewRulesCode.value =
    buildNewRulesFinalCode(data);

  if (newRulesPreview) {
    queuePreviewDocument(
      newRulesPreview,
      buildEditorPreviewDocument(
        newRulesStylesheets,
        buildNewRulesMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview006) {
    queuePreviewDocument(
      roleplayCardPreview006,
      buildCardPreviewDocument(
        newRulesStylesheets,
        buildNewRulesMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE007 — 0X1=LOVESONG
================================================== */

const loveSongPreview =
  document.querySelector(
    "#loveSongPreview"
  );

const roleplayCardPreview007 =
  document.querySelector(
    "#roleplayCardPreview007"
  );

const generatedLoveSongCode =
  document.querySelector(
    "#generatedLoveSongCode"
  );

const fields007 = {
  background:
    document.querySelector(
      "#loveBgColor"
    ),

  border:
    document.querySelector(
      "#loveBorderColor"
    ),

  name:
    document.querySelector(
      "#loveNameColor"
    ),

  subname:
    document.querySelector(
      "#loveSubnameColor"
    ),

  header:
    document.querySelector(
      "#loveHeaderColor"
    ),

  dot:
    document.querySelector(
      "#loveDotColor"
    ),

  pillBackground:
    document.querySelector(
      "#lovePillBgColor"
    ),

  pillTextColor:
    document.querySelector(
      "#lovePillTextColor"
    ),

  roleplayColor:
    document.querySelector(
      "#loveRoleplayColor"
    ),

  since:
    document.querySelector(
      "#loveSince"
    ),

  year:
    document.querySelector(
      "#loveYear"
    ),

  firstName:
    document.querySelector(
      "#loveFirstName"
    ),

  lastName:
    document.querySelector(
      "#loveLastName"
    ),

  gridOne:
    document.querySelector(
      "#loveGridOne"
    ),

  gridOneX:
    document.querySelector(
      "#loveGridOneX"
    ),

  gridOneY:
    document.querySelector(
      "#loveGridOneY"
    ),

  gridTwo:
    document.querySelector(
      "#loveGridTwo"
    ),

  gridTwoX:
    document.querySelector(
      "#loveGridTwoX"
    ),

  gridTwoY:
    document.querySelector(
      "#loveGridTwoY"
    ),

  gridThree:
    document.querySelector(
      "#loveGridThree"
    ),

  gridThreeX:
    document.querySelector(
      "#loveGridThreeX"
    ),

  gridThreeY:
    document.querySelector(
      "#loveGridThreeY"
    ),

  gridFour:
    document.querySelector(
      "#loveGridFour"
    ),

  gridFourX:
    document.querySelector(
      "#loveGridFourX"
    ),

  gridFourY:
    document.querySelector(
      "#loveGridFourY"
    ),

  portrait:
    document.querySelector(
      "#lovePortrait"
    ),

  portraitX:
    document.querySelector(
      "#lovePortraitX"
    ),

  portraitY:
    document.querySelector(
      "#lovePortraitY"
    ),

  leftSmall:
    document.querySelector(
      "#loveLeftSmall"
    ),

  leftMain:
    document.querySelector(
      "#loveLeftMain"
    ),

  pillText:
    document.querySelector(
      "#lovePillText"
    ),

  rightText:
    document.querySelector(
      "#loveRightText"
    ),

  species:
    document.querySelector(
      "#loveSpecies"
    ),

  quote:
    document.querySelector(
      "#loveQuote"
    ),

  roleplay:
    document.querySelector(
      "#loveSongRoleplayEditor"
    )
};

const defaults007 = {
  background: "#000000",
  border: "#5e1612",
  name: "#5e1612",
  subname: "#969696",
  header: "#a1534f",
  dot: "#5e1612",
  pillBackground: "#5e1612",
  pillTextColor: "#969696",
  roleplayColor: "#969696",
  since: "SINCE",
  year: "1901",
  firstName: "Franklin",
  lastName: "D. Bloodworth",
  gridOne:
    "https://i.pinimg.com/736x/9c/f2/40/9cf2405a2928f9d7d01b1939e0ebd105.jpg",
  gridOneX: 50,
  gridOneY: 50,
  gridTwo:
    "https://i.pinimg.com/736x/6a/6d/50/6a6d50c9ef95af8256787457afc9d708.jpg",
  gridTwoX: 50,
  gridTwoY: 50,
  gridThree:
    "https://i.pinimg.com/1200x/9a/99/8e/9a998e55b0c30fd5e9a1a1e4187f5a6a.jpg",
  gridThreeX: 50,
  gridThreeY: 50,
  gridFour:
    "https://i.pinimg.com/736x/c6/8f/d8/c68fd84f6be475c36c74fa7e8dfe2296.jpg",
  gridFourX: 50,
  gridFourY: 50,
  portrait:
    "https://i.pinimg.com/736x/1d/f5/9b/1df59b21acb1aea311368d50522183d3.jpg",
  portraitX: 50,
  portraitY: 50,
  leftSmall: "it's",
  leftMain: "O U R",
  pillText: "girl",
  rightText: "HE'S..",
  species: "Vampire",
  quote:
    "i can smell that hot blood just under your skin",
  roleplay:
    `คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊<br><br>ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊`
};

function getLoveSongData() {
  return {
    background:
      normalizeColor(
        fields007.background.value,
        defaults007.background
      ),

    border:
      normalizeColor(
        fields007.border.value,
        defaults007.border
      ),

    name:
      normalizeColor(
        fields007.name.value,
        defaults007.name
      ),

    subname:
      normalizeColor(
        fields007.subname.value,
        defaults007.subname
      ),

    header:
      normalizeColor(
        fields007.header.value,
        defaults007.header
      ),

    dot:
      normalizeColor(
        fields007.dot.value,
        defaults007.dot
      ),

    pillBackground:
      normalizeColor(
        fields007.pillBackground.value,
        defaults007.pillBackground
      ),

    pillTextColor:
      normalizeColor(
        fields007.pillTextColor.value,
        defaults007.pillTextColor
      ),

    roleplayColor:
      normalizeColor(
        fields007.roleplayColor.value,
        defaults007.roleplayColor
      ),

    since:
      fields007.since.value,

    year:
      fields007.year.value,

    firstName:
      fields007.firstName.value,

    lastName:
      fields007.lastName.value,

    gridOne:
      fields007.gridOne.value.trim(),

    gridOneX:
      normalizePosition(
        fields007.gridOneX.value,
        defaults007.gridOneX
      ),

    gridOneY:
      normalizePosition(
        fields007.gridOneY.value,
        defaults007.gridOneY
      ),

    gridTwo:
      fields007.gridTwo.value.trim(),

    gridTwoX:
      normalizePosition(
        fields007.gridTwoX.value,
        defaults007.gridTwoX
      ),

    gridTwoY:
      normalizePosition(
        fields007.gridTwoY.value,
        defaults007.gridTwoY
      ),

    gridThree:
      fields007.gridThree.value.trim(),

    gridThreeX:
      normalizePosition(
        fields007.gridThreeX.value,
        defaults007.gridThreeX
      ),

    gridThreeY:
      normalizePosition(
        fields007.gridThreeY.value,
        defaults007.gridThreeY
      ),

    gridFour:
      fields007.gridFour.value.trim(),

    gridFourX:
      normalizePosition(
        fields007.gridFourX.value,
        defaults007.gridFourX
      ),

    gridFourY:
      normalizePosition(
        fields007.gridFourY.value,
        defaults007.gridFourY
      ),

    portrait:
      fields007.portrait.value.trim(),

    portraitX:
      normalizePosition(
        fields007.portraitX.value,
        defaults007.portraitX
      ),

    portraitY:
      normalizePosition(
        fields007.portraitY.value,
        defaults007.portraitY
      ),

    leftSmall:
      fields007.leftSmall.value,

    leftMain:
      fields007.leftMain.value,

    pillText:
      fields007.pillText.value,

    rightText:
      fields007.rightText.value,

    species:
      fields007.species.value,

    quote:
      fields007.quote.value,

    roleplay:
      normalizeRichParagraphHtml(
        fields007.roleplay.innerHTML
      )
  };
}

function buildLoveSongMarkup(data) {
  return `<div class="oxoneddsp-container" style="--backgbg:${data.background};--borderox:${data.border};--nameox:${data.name};--subnameox:${data.subname};--linehd:${data.header};--dotox:${data.dot};--unbg:${data.pillBackground};--unbgtext:${data.pillTextColor};--roltext:${data.roleplayColor};"><div class="oxoneddsp-header"><div class="since">${escapeHtml(data.since)}</div><div class="year">${escapeHtml(data.year)}</div></div><div class="oxoneddsp-content"><div class="oxoneddsp-area"><div class="oxoneddsp-dots"><span></span><span></span><span></span></div><h1 class="oxoneddspmain-title">${escapeHtml(data.firstName)}</h1><p class="oxoneddspsub-title">${escapeHtml(data.lastName)}</p></div><div class="oxoneddspgrid-wrapper"><div class="oxoneddspbg-grid"><div class="oxoneddspgrid-item" style="${buildBackgroundImageStyle(data.gridOne, data.gridOneX, data.gridOneY)}"></div><div class="oxoneddspgrid-item" style="${buildBackgroundImageStyle(data.gridTwo, data.gridTwoX, data.gridTwoY)}"></div><div class="oxoneddspgrid-item" style="${buildBackgroundImageStyle(data.gridThree, data.gridThreeX, data.gridThreeY)}"></div><div class="oxoneddspgrid-item" style="${buildBackgroundImageStyle(data.gridFour, data.gridFourX, data.gridFourY)}"></div></div><div class="oxoneddspportrait-frame"><img src="${escapeHtml(data.portrait)}" alt="" style="${buildImagePositionStyle(data.portraitX, data.portraitY)}"></div></div><div class="oxoneddspside-text left"><span class="small">${escapeHtml(data.leftSmall)}</span><p>${escapeHtml(data.leftMain)}</p><div class="oxoneddsppill">${escapeHtml(data.pillText)}</div></div><div class="oxoneddspside-text right"><p>${escapeHtml(data.rightText)}</p></div><div class="oxoneddspname-label">${escapeHtml(data.species)}</div><div class="oxoneddsprp-section"><div class="oxoneddsprp-header">${textWithBreaks(data.quote)}</div><div class="oxoneddsprp-box">
${data.roleplay}
</div></div></div></div>
${fdreviewCreditMarkup}`;
}

function buildLoveSongFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/oxone-ddshop.css" rel="stylesheet">
${buildCreditStyleTag()}
${buildLoveSongMarkup(data)}`;
}

function updateLoveSong() {
  if (!generatedLoveSongCode) {
    return;
  }

  const data =
    getLoveSongData();

  generatedLoveSongCode.value =
    buildLoveSongFinalCode(data);

  if (loveSongPreview) {
    queuePreviewDocument(
      loveSongPreview,
      buildEditorPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/oxone-ddshop.css",
        buildLoveSongMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview007) {
    queuePreviewDocument(
      roleplayCardPreview007,
      buildCardPreviewDocument(
        "https://guindaeyo.github.io/deepdshop/oxone-ddshop.css",
        buildLoveSongMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE008 — DUMB AND DUMBER
================================================== */

const dumbDumberPreview =
  document.querySelector(
    "#dumbDumberPreview"
  );

const roleplayCardPreview008 =
  document.querySelector(
    "#roleplayCardPreview008"
  );

const generatedDumbDumberCode =
  document.querySelector(
    "#generatedDumbDumberCode"
  );

const fields008 = {
  background:
    document.querySelector(
      "#dndBgColor"
    ),

  mainColor:
    document.querySelector(
      "#dndMainColor"
    ),

  roleColor:
    document.querySelector(
      "#dndRoleColor"
    ),

  topSymbol:
    document.querySelector(
      "#dndTopSymbol"
    ),

  displayName:
    document.querySelector(
      "#dndDisplayName"
    ),

  species:
    document.querySelector(
      "#dndSpecies"
    ),

  imageOne:
    document.querySelector(
      "#dndImageOne"
    ),

  imageOneX:
    document.querySelector(
      "#dndImageOneX"
    ),

  imageOneY:
    document.querySelector(
      "#dndImageOneY"
    ),

  imageTwo:
    document.querySelector(
      "#dndImageTwo"
    ),

  imageTwoX:
    document.querySelector(
      "#dndImageTwoX"
    ),

  imageTwoY:
    document.querySelector(
      "#dndImageTwoY"
    ),

  imageThree:
    document.querySelector(
      "#dndImageThree"
    ),

  imageThreeX:
    document.querySelector(
      "#dndImageThreeX"
    ),

  imageThreeY:
    document.querySelector(
      "#dndImageThreeY"
    ),

  imageFour:
    document.querySelector(
      "#dndImageFour"
    ),

  imageFourX:
    document.querySelector(
      "#dndImageFourX"
    ),

  imageFourY:
    document.querySelector(
      "#dndImageFourY"
    ),

  heartSymbol:
    document.querySelector(
      "#dndHeartSymbol"
    ),

  tabOne:
    document.querySelector(
      "#dndTabOne"
    ),

  tabTwo:
    document.querySelector(
      "#dndTabTwo"
    ),

  tabThree:
    document.querySelector(
      "#dndTabThree"
    ),

  roleplay:
    document.querySelector(
      "#dumbDumberRoleplayEditor"
    ),

  bottomOne:
    document.querySelector(
      "#dndBottomOne"
    ),

  bottomTwo:
    document.querySelector(
      "#dndBottomTwo"
    ),

  bottomThree:
    document.querySelector(
      "#dndBottomThree"
    )
};

const defaults008 = {
  background: "#f5f5f5",
  mainColor: "#0277bd",
  roleColor: "#666666",
  topSymbol: "✝",
  displayName:
    "Franklin D. Bloodworth",
  species: "vampire",
  imageOne:
    "https://i.pinimg.com/736x/62/12/86/621286dd570bda22e0f7aaf3f46310a0.jpg",
  imageOneX: 50,
  imageOneY: 50,
  imageTwo:
    "https://i.pinimg.com/736x/43/a0/09/43a00959667506ed5eaab40058350961.jpg",
  imageTwoX: 50,
  imageTwoY: 50,
  imageThree:
    "https://i.pinimg.com/1200x/89/59/e5/8959e57bd671d97c0bc6489ea3de84b2.jpg",
  imageThreeX: 50,
  imageThreeY: 50,
  imageFour:
    "https://i.pinimg.com/736x/35/4b/b7/354bb7fa087f23d3bf0aad6cd20f19b5.jpg",
  imageFourX: 50,
  imageFourY: 50,
  heartSymbol: "♥",
  tabOne: "PRETTY",
  tabTwo: "DIRTY",
  tabThree: "RICH",
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอ มาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  bottomOne: "Gallery",
  bottomTwo: "Video",
  bottomThree: "Archive"
};

const dumbDumberStylesheets = [
  "https://guindaeyo.github.io/deepdshop/ddsh-dumbndumber.css",
  "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&display=swap"
];

function getDumbDumberData() {
  return {
    background:
      normalizeColor(
        fields008.background.value,
        defaults008.background
      ),

    mainColor:
      normalizeColor(
        fields008.mainColor.value,
        defaults008.mainColor
      ),

    roleColor:
      normalizeColor(
        fields008.roleColor.value,
        defaults008.roleColor
      ),

    topSymbol:
      fields008.topSymbol.value,

    displayName:
      fields008.displayName.value,

    species:
      fields008.species.value,

    imageOne:
      fields008.imageOne.value.trim(),

    imageOneX:
      normalizePosition(
        fields008.imageOneX.value,
        defaults008.imageOneX
      ),

    imageOneY:
      normalizePosition(
        fields008.imageOneY.value,
        defaults008.imageOneY
      ),

    imageTwo:
      fields008.imageTwo.value.trim(),

    imageTwoX:
      normalizePosition(
        fields008.imageTwoX.value,
        defaults008.imageTwoX
      ),

    imageTwoY:
      normalizePosition(
        fields008.imageTwoY.value,
        defaults008.imageTwoY
      ),

    imageThree:
      fields008.imageThree.value.trim(),

    imageThreeX:
      normalizePosition(
        fields008.imageThreeX.value,
        defaults008.imageThreeX
      ),

    imageThreeY:
      normalizePosition(
        fields008.imageThreeY.value,
        defaults008.imageThreeY
      ),

    imageFour:
      fields008.imageFour.value.trim(),

    imageFourX:
      normalizePosition(
        fields008.imageFourX.value,
        defaults008.imageFourX
      ),

    imageFourY:
      normalizePosition(
        fields008.imageFourY.value,
        defaults008.imageFourY
      ),

    heartSymbol:
      fields008.heartSymbol.value,

    tabOne:
      fields008.tabOne.value,

    tabTwo:
      fields008.tabTwo.value,

    tabThree:
      fields008.tabThree.value,

    roleplay:
      normalizeRichParagraphHtml(
        fields008.roleplay.innerHTML
      ),

    bottomOne:
      fields008.bottomOne.value,

    bottomTwo:
      fields008.bottomTwo.value,

    bottomThree:
      fields008.bottomThree.value
  };
}

function buildDumbDumberMarkup(data) {
  return `<div class="dndddp-wrap" style="--bgg01:${data.background};--colormain:${data.mainColor};--colorrole:${data.roleColor};"><div class="dndddp-title"><div class="dndddp-cloud">${formatEmojiOrSymbol(data.topSymbol)}</div><h1>${escapeHtml(data.displayName)}</h1><span>${escapeHtml(data.species)}</span></div>
<div class="dndddp-grid"><div class="dndddp-photo p1"><img src="${escapeHtml(data.imageOne)}" alt="" style="${buildImagePositionStyle(data.imageOneX, data.imageOneY)}"></div><div class="dndddp-photo p2"><img src="${escapeHtml(data.imageTwo)}" alt="" style="${buildImagePositionStyle(data.imageTwoX, data.imageTwoY)}"></div><div class="dndddp-photo p3"><img src="${escapeHtml(data.imageThree)}" alt="" style="${buildImagePositionStyle(data.imageThreeX, data.imageThreeY)}"></div><div class="dndddp-photo p4"><img src="${escapeHtml(data.imageFour)}" alt="" style="${buildImagePositionStyle(data.imageFourX, data.imageFourY)}"></div>
<div class="dndddp-heart">${formatEmojiOrSymbol(data.heartSymbol)}</div><div class="dndddp-tabs-bottom"><span>${escapeHtml(data.tabOne)}</span><span>${escapeHtml(data.tabTwo)}</span><span>${escapeHtml(data.tabThree)}</span></div></div><div class="dndddp-rp">
${data.roleplay}
</div><div class="dndddp-bottom"><span>‹</span><div><a href="#">${escapeHtml(data.bottomOne)}</a><a href="#">${escapeHtml(data.bottomTwo)}</a><a href="#">${escapeHtml(data.bottomThree)}</a></div><span>›</span></div></div>
${fdreviewCreditMarkup}`;
}

function buildDumbDumberFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/ddsh-dumbndumber.css" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet">
${buildCreditStyleTag()}
${buildDumbDumberMarkup(data)}`;
}

function updateDumbDumber() {
  if (!generatedDumbDumberCode) {
    return;
  }

  const data =
    getDumbDumberData();

  generatedDumbDumberCode.value =
    buildDumbDumberFinalCode(data);

  if (dumbDumberPreview) {
    queuePreviewDocument(
      dumbDumberPreview,
      buildEditorPreviewDocument(
        dumbDumberStylesheets,
        buildDumbDumberMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview008) {
    queuePreviewDocument(
      roleplayCardPreview008,
      buildCardPreviewDocument(
        dumbDumberStylesheets,
        buildDumbDumberMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   CODE009 — HIGHER THAN HEAVEN
================================================== */

const higherHeavenPreview =
  document.querySelector(
    "#higherHeavenPreview"
  );

const roleplayCardPreview009 =
  document.querySelector(
    "#roleplayCardPreview009"
  );

const generatedHigherHeavenCode =
  document.querySelector(
    "#generatedHigherHeavenCode"
  );

const fields009 = {
  background:
    document.querySelector(
      "#hthBgColor"
    ),

  mainColor:
    document.querySelector(
      "#hthMainColor"
    ),

  mainSoftColor:
    document.querySelector(
      "#hthMainSoftColor"
    ),

  fontColor:
    document.querySelector(
      "#hthFontColor"
    ),

  polaroidTextColor:
    document.querySelector(
      "#hthPolaroidTextColor"
    ),

  dotColor:
    document.querySelector(
      "#hthDotColor"
    ),

  mainImage:
    document.querySelector(
      "#hthMainImage"
    ),

  mainImageX:
    document.querySelector(
      "#hthMainImageX"
    ),

  mainImageY:
    document.querySelector(
      "#hthMainImageY"
    ),

  miniTopImage:
    document.querySelector(
      "#hthMiniTopImage"
    ),

  miniTopImageX:
    document.querySelector(
      "#hthMiniTopImageX"
    ),

  miniTopImageY:
    document.querySelector(
      "#hthMiniTopImageY"
    ),

  miniBottomImage:
    document.querySelector(
      "#hthMiniBottomImage"
    ),

  miniBottomImageX:
    document.querySelector(
      "#hthMiniBottomImageX"
    ),

  miniBottomImageY:
    document.querySelector(
      "#hthMiniBottomImageY"
    ),

  bgLetterOne:
    document.querySelector(
      "#hthBgLetterOne"
    ),

  bgLetterTwo:
    document.querySelector(
      "#hthBgLetterTwo"
    ),

  species:
    document.querySelector(
      "#hthSpecies"
    ),

  sideText:
    document.querySelector(
      "#hthSideText"
    ),

  navOne:
    document.querySelector(
      "#hthNavOne"
    ),

  navTwo:
    document.querySelector(
      "#hthNavTwo"
    ),

  navThree:
    document.querySelector(
      "#hthNavThree"
    ),

  initial:
    document.querySelector(
      "#hthInitial"
    ),

  firstName:
    document.querySelector(
      "#hthFirstName"
    ),

  lastName:
    document.querySelector(
      "#hthLastName"
    ),

  leftTag:
    document.querySelector(
      "#hthLeftTag"
    ),

  rightTag:
    document.querySelector(
      "#hthRightTag"
    ),

  roleplay:
    document.querySelector(
      "#higherHeavenRoleplayEditor"
    ),

  note:
    document.querySelector(
      "#hthNote"
    )
};

const defaults009 = {
  background: "#ffffff",
  mainColor: "#9f1d1d",
  mainSoftColor: "#9f1d1d1a",
  fontColor: "#151515",
  polaroidTextColor: "#ffffff",
  dotColor: "#c40000",
  mainImage:
    "https://i.pinimg.com/1200x/3c/a4/c5/3ca4c5ba1880cba01f579ff125a8bdec.jpg",
  mainImageX: 50,
  mainImageY: 50,
  miniTopImage:
    "https://i.pinimg.com/736x/f7/6b/a0/f76ba073cd529f4e4ba96c970d2931ee.jpg",
  miniTopImageX: 50,
  miniTopImageY: 50,
  miniBottomImage:
    "https://i.pinimg.com/1200x/cd/6e/d4/cd6ed40fb981f1dd745233ed1d01bb68.jpg",
  miniBottomImageX: 50,
  miniBottomImageY: 50,
  bgLetterOne: "F",
  bgLetterTwo: "K",
  species: "Vampire",
  sideText: "WHO IS HE?",
  navOne: "blood",
  navTwo: "naughty",
  navThree: "stubborn",
  initial: "F",
  firstName: "ranklin D.",
  lastName: "Bloodworth",
  leftTag: "black cat",
  rightTag: "meow",
  roleplay:
    "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอ มาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  note: "เจ้าที่แรง - สโมสรชิมิ"
};

const higherHeavenStylesheets = [
  "https://guindaeyo.github.io/deepdshop/ddsh-hthvn.css",
  "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&display=swap"
];

function getHigherHeavenData() {
  return {
    background:
      normalizeColor(
        fields009.background.value,
        defaults009.background
      ),

    mainColor:
      normalizeColor(
        fields009.mainColor.value,
        defaults009.mainColor
      ),

    mainSoftColor:
      String(
        fields009.mainSoftColor.value ||
        defaults009.mainSoftColor
      ).trim(),

    fontColor:
      normalizeColor(
        fields009.fontColor.value,
        defaults009.fontColor
      ),

    polaroidTextColor:
      normalizeColor(
        fields009.polaroidTextColor.value,
        defaults009.polaroidTextColor
      ),

    dotColor:
      normalizeColor(
        fields009.dotColor.value,
        defaults009.dotColor
      ),

    mainImage:
      fields009.mainImage.value.trim(),

    mainImageX:
      normalizePosition(
        fields009.mainImageX.value,
        defaults009.mainImageX
      ),

    mainImageY:
      normalizePosition(
        fields009.mainImageY.value,
        defaults009.mainImageY
      ),

    miniTopImage:
      fields009.miniTopImage.value.trim(),

    miniTopImageX:
      normalizePosition(
        fields009.miniTopImageX.value,
        defaults009.miniTopImageX
      ),

    miniTopImageY:
      normalizePosition(
        fields009.miniTopImageY.value,
        defaults009.miniTopImageY
      ),

    miniBottomImage:
      fields009.miniBottomImage.value.trim(),

    miniBottomImageX:
      normalizePosition(
        fields009.miniBottomImageX.value,
        defaults009.miniBottomImageX
      ),

    miniBottomImageY:
      normalizePosition(
        fields009.miniBottomImageY.value,
        defaults009.miniBottomImageY
      ),

    bgLetterOne:
      fields009.bgLetterOne.value,

    bgLetterTwo:
      fields009.bgLetterTwo.value,

    species:
      fields009.species.value,

    sideText:
      fields009.sideText.value,

    navOne:
      fields009.navOne.value,

    navTwo:
      fields009.navTwo.value,

    navThree:
      fields009.navThree.value,

    initial:
      fields009.initial.value,

    firstName:
      fields009.firstName.value,

    lastName:
      fields009.lastName.value,

    leftTag:
      fields009.leftTag.value,

    rightTag:
      fields009.rightTag.value,

    roleplay:
      normalizeRichParagraphHtml(
        fields009.roleplay.innerHTML
      ),

    note:
      fields009.note.value
  };
}

function buildHigherHeavenMarkup(data) {
  return `<div class="ddshigherth-frame" style="--ddshigherth-bg:${data.background};--ddshigherth-mainc:${data.mainColor};--ddshigherth-maincs:${escapeHtml(data.mainSoftColor)};--ddshigherth-fontf:${data.fontColor};--ddshigherth-fontfz:${data.polaroidTextColor};--ddshigherth-dot-color:${data.dotColor};--ddshigherth-main-img:url('${escapeHtml(data.mainImage)}');--ddshigherth-main-pos:${data.mainImageX}% ${data.mainImageY}%;--ddshigherth-mini-img-1:url('${escapeHtml(data.miniTopImage)}');--ddshigherth-mini-img-2:url('${escapeHtml(data.miniBottomImage)}');"><div class="ddshigherth-scale"><div class="ddshigherth-pearl"><div class="ddshigherth-bg-script one">${escapeHtml(data.bgLetterOne)}</div><div class="ddshigherth-bg-script two">${escapeHtml(data.bgLetterTwo)}</div><div class="ddshigherth-top-title">${escapeHtml(data.species)}</div><div class="ddshigherth-side-text">${escapeHtml(data.sideText)}</div><div class="ddshigherth-nav"><span>${escapeHtml(data.navOne)}</span><span>${escapeHtml(data.navTwo)}</span><span>${escapeHtml(data.navThree)}</span></div><div class="ddshigherth-mini-img top" style="background-position:${data.miniTopImageX}% ${data.miniTopImageY}%;"></div><div class="ddshigherth-soft-dot"></div><div class="ddshigherth-brand"><div class="ddshigherth-brand-main">${escapeHtml(data.initial)}<span>${escapeHtml(data.firstName)}</span></div><div class="ddshigherth-brand-sub">${escapeHtml(data.lastName)}</div></div><div class="ddshigherth-photo-wrap"><div class="ddshigherth-photo"></div></div><div class="ddshigherth-tag left">${escapeHtml(data.leftTag)}</div><div class="ddshigherth-tag right">${escapeHtml(data.rightTag)}</div><div class="ddshigherth-roleplay"><div class="ddshigherth-roleplay-text">
${data.roleplay}
</div></div><div class="ddshigherth-lower-row"><div class="ddshigherth-mini-img bottom" style="background-position:${data.miniBottomImageX}% ${data.miniBottomImageY}%;"></div><div class="ddshigherth-note-box"><div class="ddshigherth-note-text">${escapeHtml(data.note)}</div></div></div></div></div></div>
${fdreviewCreditMarkup}`;
}

function buildHigherHeavenFinalCode(data) {
  return `<link href="https://guindaeyo.github.io/deepdshop/ddsh-hthvn.css" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet">
${buildCreditStyleTag()}
${buildHigherHeavenMarkup(data)}`;
}

function updateHigherHeaven() {
  if (!generatedHigherHeavenCode) {
    return;
  }

  const data =
    getHigherHeavenData();

  generatedHigherHeavenCode.value =
    buildHigherHeavenFinalCode(data);

  if (higherHeavenPreview) {
    queuePreviewDocument(
      higherHeavenPreview,
      buildEditorPreviewDocument(
        higherHeavenStylesheets,
        buildHigherHeavenMarkup(data)
      ),
      resizeEditorPreview
    );
  }

  if (roleplayCardPreview009) {
    queuePreviewDocument(
      roleplayCardPreview009,
      buildCardPreviewDocument(
        higherHeavenStylesheets,
        buildHigherHeavenMarkup(data)
      ),
      resizeCardPreview
    );
  }
}



/* ==================================================
   REVIEW CODE001 — GGUM VER.EDM
================================================== */

const foodReviewPreview =
  document.querySelector(
    "#foodReviewPreview"
  );

const reviewCardPreview001 =
  document.querySelector(
    "#reviewCardPreview001"
  );

const generatedFoodReviewCode =
  document.querySelector(
    "#generatedFoodReviewCode"
  );

const fieldsReview001 = {
  mainColor:
    document.querySelector(
      "#reviewMainColor"
    ),

  darkColor:
    document.querySelector(
      "#reviewDarkColor"
    ),

  starColor:
    document.querySelector(
      "#reviewStarColor"
    ),

  paperColor:
    document.querySelector(
      "#reviewPaperColor"
    ),

  textColor:
    document.querySelector(
      "#reviewTextColor"
    ),

  tagColor:
    document.querySelector(
      "#reviewTagColor"
    ),

  backgroundImage:
    document.querySelector(
      "#reviewBackgroundImage"
    ),

  backgroundImageX:
    document.querySelector(
      "#reviewBackgroundImageX"
    ),

  backgroundImageY:
    document.querySelector(
      "#reviewBackgroundImageY"
    ),

  place:
    document.querySelector(
      "#reviewPlace"
    ),

  scoreIcon:
    document.querySelector(
      "#reviewScoreIcon"
    ),

  scoreLabel:
    document.querySelector(
      "#reviewScoreLabel"
    ),

  scoreTitle:
    document.querySelector(
      "#reviewScoreTitle"
    ),

  stars:
    document.querySelector(
      "#reviewStars"
    ),

  overallScore:
    document.querySelector(
      "#reviewOverallScore"
    ),

  scoreDenominator:
    document.querySelector(
      "#reviewScoreDenominator"
    ),

  scoreOneLabel:
    document.querySelector(
      "#reviewScoreOneLabel"
    ),

  scoreOneValue:
    document.querySelector(
      "#reviewScoreOneValue"
    ),

  scoreTwoLabel:
    document.querySelector(
      "#reviewScoreTwoLabel"
    ),

  scoreTwoValue:
    document.querySelector(
      "#reviewScoreTwoValue"
    ),

  scoreThreeLabel:
    document.querySelector(
      "#reviewScoreThreeLabel"
    ),

  scoreThreeValue:
    document.querySelector(
      "#reviewScoreThreeValue"
    ),

  logoImage:
    document.querySelector(
      "#reviewLogoImage"
    ),

  logoImageX:
    document.querySelector(
      "#reviewLogoImageX"
    ),

  logoImageY:
    document.querySelector(
      "#reviewLogoImageY"
    ),

  accountName:
    document.querySelector(
      "#reviewAccountName"
    ),

  accountSubtitle:
    document.querySelector(
      "#reviewAccountSubtitle"
    ),

  photoOne:
    document.querySelector(
      "#reviewPhotoOne"
    ),

  photoOneX:
    document.querySelector(
      "#reviewPhotoOneX"
    ),

  photoOneY:
    document.querySelector(
      "#reviewPhotoOneY"
    ),

  photoTwo:
    document.querySelector(
      "#reviewPhotoTwo"
    ),

  photoTwoX:
    document.querySelector(
      "#reviewPhotoTwoX"
    ),

  photoTwoY:
    document.querySelector(
      "#reviewPhotoTwoY"
    ),

  photoThree:
    document.querySelector(
      "#reviewPhotoThree"
    ),

  photoThreeX:
    document.querySelector(
      "#reviewPhotoThreeX"
    ),

  photoThreeY:
    document.querySelector(
      "#reviewPhotoThreeY"
    ),

  photoCount:
    document.querySelector(
      "#reviewPhotoCount"
    ),

  heartIcon:
    document.querySelector(
      "#reviewHeartIcon"
    ),

  chatIcon:
    document.querySelector(
      "#reviewChatIcon"
    ),

  sendIcon:
    document.querySelector(
      "#reviewSendIcon"
    ),

  bookmarkIcon:
    document.querySelector(
      "#reviewBookmarkIcon"
    ),

  captionAccount:
    document.querySelector(
      "#reviewCaptionAccount"
    ),

  captionText:
    document.querySelector(
      "#reviewCaptionText"
    ),

  recommendedIcon:
    document.querySelector(
      "#reviewRecommendedIcon"
    ),

  recommendedLabel:
    document.querySelector(
      "#reviewRecommendedLabel"
    ),

  recommendedTitle:
    document.querySelector(
      "#reviewRecommendedTitle"
    ),

  foodName:
    document.querySelector(
      "#reviewFoodName"
    ),

  description:
    document.querySelector(
      "#reviewDescription"
    ),

  tags:
    document.querySelector(
      "#reviewTags"
    ),

  contactAvatar:
    document.querySelector(
      "#reviewContactAvatar"
    ),

  contactAvatarX:
    document.querySelector(
      "#reviewContactAvatarX"
    ),

  contactAvatarY:
    document.querySelector(
      "#reviewContactAvatarY"
    ),

  contactLabel:
    document.querySelector(
      "#reviewContactLabel"
    ),

  contactName:
    document.querySelector(
      "#reviewContactName"
    ),

  contactIcon:
    document.querySelector(
      "#reviewContactIcon"
    )
};

const defaultsReview001 = {
  mainColor: "#ffcad4",
  darkColor: "#b689b0",
  starColor: "#ffb000",
  paperColor: "#fffdf9",
  textColor: "#27201c",
  tagColor: "#faf0f2",
  backgroundImage:
    "https://iili.io/CNUekHQ.png",
  backgroundImageX: 50,
  backgroundImageY: 50,
  place: "Food Review",
  scoreIcon: "★",
  scoreLabel: "FOOD REVIEW",
  scoreTitle: "คะแนนโดยรวม",
  stars: "★★★★★",
  overallScore: "9.9",
  scoreDenominator: "/ 10",
  scoreOneLabel: "รสชาติ",
  scoreOneValue: "10",
  scoreTwoLabel: "รูปลักษณ์",
  scoreTwoValue: "10",
  scoreThreeLabel:
    "ความสมเหตุสมผลของราคา",
  scoreThreeValue: "10",
  logoImage:
    "https://i.pinimg.com/vwebp/1200x/cb/76/88/cb76889bbad391355af7c3c819ccb02b.webp",
  logoImageX: 50,
  logoImageY: 50,
  accountName: "deadbutrich",
  accountSubtitle: "Food Review",
  photoOne:
    "https://i.pinimg.com/736x/e8/f4/3d/e8f43dae4d9a58d3f7a9bab7f080e0b0.jpg",
  photoOneX: 50,
  photoOneY: 50,
  photoTwo:
    "https://i.pinimg.com/736x/a2/14/3c/a2143cae7c46e2937acf54914c179652.jpg",
  photoTwoX: 50,
  photoTwoY: 50,
  photoThree:
    "https://i.pinimg.com/736x/88/4a/d3/884ad393abce8919d72b0305646f79bf.jpg",
  photoThreeX: 50,
  photoThreeY: 50,
  photoCount: "3 PHOTOS",
  heartIcon: "❤︎",
  chatIcon: "128172",
  sendIcon: "✉︎",
  bookmarkIcon: "⛉",
  captionAccount: "deadbutrich",
  captionText:
    "กดวงกลมใต้รูปเพื่อเปลี่ยนภาพอาหาร",
  recommendedIcon: "✦",
  recommendedLabel: "RECOMMENDED",
  recommendedTitle: "เมนูแนะนำ",
  foodName: "It’s me",
  description:
    "แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
  tags:
    "ของทานเล่น\nใช่ นี่ของอร่อย",
  contactAvatar:
    "https://i.pinimg.com/vwebp/1200x/17/2a/f3/172af366be2a5e78b088d5fe0413a17b.webp",
  contactAvatarX: 50,
  contactAvatarY: 35,
  contactLabel: "RECOMMENDED BY",
  contactName:
    "Franklin D. Bloodworth",
  contactIcon: "✝"
};

const foodReviewStylesheet =
  "https://guindaeyo.github.io/deepdshop/ddsh-revfoodie.css";

const foodReviewEditorPreviewCss = `<style data-review-preview-only>.dds-preview-target{width:1300px!important;min-width:1300px!important;max-width:1300px!important}.fdpopup-wrap{width:1300px!important;min-width:1300px!important;max-width:1300px!important;margin:0!important}.fdpopup-container{width:760px!important;max-width:760px!important}</style>`;

const foodReviewCardPreviewCss = `<style data-review-card-preview-only>html,body{width:1300px!important;min-width:1300px!important;max-width:1300px!important;height:920px!important;min-height:920px!important;max-height:920px!important;overflow:hidden!important}body{padding:0!important}.dds-card-preview-shell{width:1300px!important;height:920px!important;display:block!important;overflow:hidden!important}.dds-card-preview-target{width:1300px!important;min-width:1300px!important;max-width:1300px!important;height:920px!important;min-height:920px!important;max-height:920px!important;transform:none!important}.fdpopup-wrap{width:1300px!important;min-width:1300px!important;max-width:1300px!important;margin:0!important}.fdpopup-container{width:760px!important;max-width:760px!important}</style>`;

function buildFoodReviewTags(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => {
      return `<span>${escapeHtml(tag)}</span>`;
    })
    .join("");
}

function getFoodReviewData() {
  return {
    mainColor:
      normalizeColor(
        fieldsReview001.mainColor.value,
        defaultsReview001.mainColor
      ),

    darkColor:
      normalizeColor(
        fieldsReview001.darkColor.value,
        defaultsReview001.darkColor
      ),

    starColor:
      normalizeColor(
        fieldsReview001.starColor.value,
        defaultsReview001.starColor
      ),

    paperColor:
      normalizeColor(
        fieldsReview001.paperColor.value,
        defaultsReview001.paperColor
      ),

    textColor:
      normalizeColor(
        fieldsReview001.textColor.value,
        defaultsReview001.textColor
      ),

    tagColor:
      normalizeColor(
        fieldsReview001.tagColor.value,
        defaultsReview001.tagColor
      ),

    backgroundImage:
      fieldsReview001.backgroundImage.value.trim(),

    backgroundImageX:
      normalizePosition(
        fieldsReview001.backgroundImageX.value,
        defaultsReview001.backgroundImageX
      ),

    backgroundImageY:
      normalizePosition(
        fieldsReview001.backgroundImageY.value,
        defaultsReview001.backgroundImageY
      ),

    place:
      fieldsReview001.place.value,

    scoreIcon:
      fieldsReview001.scoreIcon.value,

    scoreLabel:
      fieldsReview001.scoreLabel.value,

    scoreTitle:
      fieldsReview001.scoreTitle.value,

    stars:
      fieldsReview001.stars.value,

    overallScore:
      fieldsReview001.overallScore.value,

    scoreDenominator:
      fieldsReview001.scoreDenominator.value,

    scoreOneLabel:
      fieldsReview001.scoreOneLabel.value,

    scoreOneValue:
      fieldsReview001.scoreOneValue.value,

    scoreTwoLabel:
      fieldsReview001.scoreTwoLabel.value,

    scoreTwoValue:
      fieldsReview001.scoreTwoValue.value,

    scoreThreeLabel:
      fieldsReview001.scoreThreeLabel.value,

    scoreThreeValue:
      fieldsReview001.scoreThreeValue.value,

    logoImage:
      fieldsReview001.logoImage.value.trim(),

    logoImageX:
      normalizePosition(
        fieldsReview001.logoImageX.value,
        defaultsReview001.logoImageX
      ),

    logoImageY:
      normalizePosition(
        fieldsReview001.logoImageY.value,
        defaultsReview001.logoImageY
      ),

    accountName:
      fieldsReview001.accountName.value,

    accountSubtitle:
      fieldsReview001.accountSubtitle.value,

    photoOne:
      fieldsReview001.photoOne.value.trim(),

    photoOneX:
      normalizePosition(
        fieldsReview001.photoOneX.value,
        defaultsReview001.photoOneX
      ),

    photoOneY:
      normalizePosition(
        fieldsReview001.photoOneY.value,
        defaultsReview001.photoOneY
      ),

    photoTwo:
      fieldsReview001.photoTwo.value.trim(),

    photoTwoX:
      normalizePosition(
        fieldsReview001.photoTwoX.value,
        defaultsReview001.photoTwoX
      ),

    photoTwoY:
      normalizePosition(
        fieldsReview001.photoTwoY.value,
        defaultsReview001.photoTwoY
      ),

    photoThree:
      fieldsReview001.photoThree.value.trim(),

    photoThreeX:
      normalizePosition(
        fieldsReview001.photoThreeX.value,
        defaultsReview001.photoThreeX
      ),

    photoThreeY:
      normalizePosition(
        fieldsReview001.photoThreeY.value,
        defaultsReview001.photoThreeY
      ),

    photoCount:
      fieldsReview001.photoCount.value,

    heartIcon:
      fieldsReview001.heartIcon.value,

    chatIcon:
      fieldsReview001.chatIcon.value,

    sendIcon:
      fieldsReview001.sendIcon.value,

    bookmarkIcon:
      fieldsReview001.bookmarkIcon.value,

    captionAccount:
      fieldsReview001.captionAccount.value,

    captionText:
      fieldsReview001.captionText.value,

    recommendedIcon:
      fieldsReview001.recommendedIcon.value,

    recommendedLabel:
      fieldsReview001.recommendedLabel.value,

    recommendedTitle:
      fieldsReview001.recommendedTitle.value,

    foodName:
      fieldsReview001.foodName.value,

    description:
      fieldsReview001.description.value,

    tags:
      fieldsReview001.tags.value,

    contactAvatar:
      fieldsReview001.contactAvatar.value.trim(),

    contactAvatarX:
      normalizePosition(
        fieldsReview001.contactAvatarX.value,
        defaultsReview001.contactAvatarX
      ),

    contactAvatarY:
      normalizePosition(
        fieldsReview001.contactAvatarY.value,
        defaultsReview001.contactAvatarY
      ),

    contactLabel:
      fieldsReview001.contactLabel.value,

    contactName:
      fieldsReview001.contactName.value,

    contactIcon:
      fieldsReview001.contactIcon.value
  };
}

function buildFoodReviewMarkup(data) {
  return `<div class="fdpopup-wrap" style="--fdpopup-bg:url('${escapeHtml(data.backgroundImage)}');--fdpopup-main:${data.mainColor};--fdpopup-dark:${data.darkColor};--fdpopup-star:${data.starColor};--fdpopup-paper:${data.paperColor};--fdpopup-text:${data.textColor};--fdpopup-tagbg:${data.tagColor};background-position:${data.backgroundImageX}% ${data.backgroundImageY}%;"><div class="fdpopup-container"><div class="fdpopup-place">${escapeHtml(data.place)}</div><div class="fdpopup-stage"><div class="fdpopup-info fdpopup-info-left"><div class="fdpopup-info-head"><div class="fdpopup-info-icon">${formatEmojiOrSymbol(data.scoreIcon)}</div><div class="fdpopup-info-title"><span>${escapeHtml(data.scoreLabel)}</span><strong>${escapeHtml(data.scoreTitle)}</strong></div></div><div class="fdpopup-stars">${escapeHtml(data.stars)}</div><div class="fdpopup-score-row"><strong>${escapeHtml(data.overallScore)}</strong><span>${escapeHtml(data.scoreDenominator)}</span></div><div class="fdpopup-score-list"><div><span>${escapeHtml(data.scoreOneLabel)}</span><b>${escapeHtml(data.scoreOneValue)}</b></div><div><span>${escapeHtml(data.scoreTwoLabel)}</span><b>${escapeHtml(data.scoreTwoValue)}</b></div><div><span>${escapeHtml(data.scoreThreeLabel)}</span><b>${escapeHtml(data.scoreThreeValue)}</b></div></div></div><div class="fdpopup-card"><div class="fdpopup-card-head"><div class="fdpopup-brand"><div class="fdpopup-logo" style="background-image:url('${escapeHtml(data.logoImage)}');background-position:${data.logoImageX}% ${data.logoImageY}%;"></div><div class="fdpopup-brand-text"><strong>${escapeHtml(data.accountName)}</strong><span>${escapeHtml(data.accountSubtitle)}</span></div></div><div class="fdpopup-menu">⋮</div></div><div class="fdpopup-gallery"><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-1" checked><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-2"><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-3"><div class="fdpopup-slides"><div class="fdpopup-photo fdpopup-photo-1" style="--fdpopup-img-1:url('${escapeHtml(data.photoOne)}');--fdpopup-img-1-y:${data.photoOneY}%;background-position:${data.photoOneX}% ${data.photoOneY}%;"></div><div class="fdpopup-photo fdpopup-photo-2" style="--fdpopup-img-2:url('${escapeHtml(data.photoTwo)}');--fdpopup-img-2-y:${data.photoTwoY}%;background-position:${data.photoTwoX}% ${data.photoTwoY}%;"></div><div class="fdpopup-photo fdpopup-photo-3" style="--fdpopup-img-3:url('${escapeHtml(data.photoThree)}');--fdpopup-img-3-y:${data.photoThreeY}%;background-position:${data.photoThreeX}% ${data.photoThreeY}%;"></div></div><div class="fdpopup-gallery-number"><span>${escapeHtml(data.photoCount)}</span></div><div class="fdpopup-dots"><label for="fdpopup-photo-1"></label><label for="fdpopup-photo-2"></label><label for="fdpopup-photo-3"></label></div></div><div class="fdpopup-actions"><div class="fdpopup-actions-left"><span class="fdpopup-heart">${formatEmojiOrSymbol(data.heartIcon)}</span><span class="fdpopup-chat">${formatEmojiOrSymbol(data.chatIcon)}</span><span class="fdpopup-send">${formatEmojiOrSymbol(data.sendIcon)}</span></div><span class="fdpopup-bookmark">${formatEmojiOrSymbol(data.bookmarkIcon)}</span></div><div class="fdpopup-caption"><strong>${escapeHtml(data.captionAccount)}</strong><span>${escapeHtml(data.captionText)}</span></div></div><div class="fdpopup-info fdpopup-info-right"><div class="fdpopup-info-head"><div class="fdpopup-info-icon">${formatEmojiOrSymbol(data.recommendedIcon)}</div><div class="fdpopup-info-title"><span>${escapeHtml(data.recommendedLabel)}</span><strong>${escapeHtml(data.recommendedTitle)}</strong></div></div><h3 class="fdpopup-food-name">${escapeHtml(data.foodName)}</h3><p class="fdpopup-description">${textWithBreaks(data.description)}</p><div class="fdpopup-tags">${buildFoodReviewTags(data.tags)}</div></div></div><div class="fdpopup-contact"><div class="fdpopup-contact-avatar" style="--fdpopup-avatar:url('${escapeHtml(data.contactAvatar)}');--fdpopup-avatar-y:${data.contactAvatarY}%;background-position:${data.contactAvatarX}% ${data.contactAvatarY}%;"></div><div class="fdpopup-contact-text"><span>${escapeHtml(data.contactLabel)}</span><strong>${escapeHtml(data.contactName)}</strong></div><div class="fdpopup-contact-icon">${formatEmojiOrSymbol(data.contactIcon)}</div></div></div></div>
${fdreviewCreditMarkup}`;
}

function buildFoodReviewFinalCode(data) {
  return `<link href="${foodReviewStylesheet}" rel="stylesheet">
${buildCreditStyleTag()}
${buildFoodReviewMarkup(data)}`;
}

function updateFoodReview() {
  if (!generatedFoodReviewCode) {
    return;
  }

  const data =
    getFoodReviewData();

  generatedFoodReviewCode.value =
    buildFoodReviewFinalCode(data);

  const editorPreviewMarkup =
    foodReviewEditorPreviewCss +
    buildFoodReviewMarkup(data);

  const cardPreviewMarkup =
    foodReviewCardPreviewCss +
    buildFoodReviewMarkup(data);

  if (foodReviewPreview) {
    queuePreviewDocument(
      foodReviewPreview,
      buildEditorPreviewDocument(
        foodReviewStylesheet,
        editorPreviewMarkup
      ),
      resizeEditorPreview
    );
  }

  if (reviewCardPreview001) {
    queuePreviewDocument(
      reviewCardPreview001,
      buildCardPreviewDocument(
        foodReviewStylesheet,
        cardPreviewMarkup
      ),
      resizeReviewDesktopCardPreview
    );
  }
}



/* ==================================================
   PROFILE CODE001 — POLAROID LOVE
================================================== */

const polaroidLovePreview =
  document.querySelector(
    "#polaroidLovePreview"
  );

const profileCardPreview001 =
  document.querySelector(
    "#profileCardPreview001"
  );

const generatedPolaroidLoveCode =
  document.querySelector(
    "#generatedPolaroidLoveCode"
  );

const fieldsProfile001 = {
  backgroundColor:
    document.querySelector(
      "#profileLoveBgColor"
    ),

  borderColor:
    document.querySelector(
      "#profileLoveBorderColor"
    ),

  textColor:
    document.querySelector(
      "#profileLoveTextColor"
    ),

  subtitleColor:
    document.querySelector(
      "#profileLoveSubtitleColor"
    ),

  quoteColor:
    document.querySelector(
      "#profileLoveQuoteColor"
    ),

  lineColor:
    document.querySelector(
      "#profileLoveLineColor"
    ),

  background:
    document.querySelector(
      "#profileLoveBackground"
    ),

  backgroundX:
    document.querySelector(
      "#profileLoveBackgroundX"
    ),

  backgroundY:
    document.querySelector(
      "#profileLoveBackgroundY"
    ),

  topOne:
    document.querySelector(
      "#profileLoveTopOne"
    ),

  topTwo:
    document.querySelector(
      "#profileLoveTopTwo"
    ),

  title:
    document.querySelector(
      "#profileLoveTitle"
    ),

  subtitle:
    document.querySelector(
      "#profileLoveSubtitle"
    ),

  quote:
    document.querySelector(
      "#profileLoveQuote"
    ),

  imageOne:
    document.querySelector(
      "#profileLoveImageOne"
    ),

  imageOneX:
    document.querySelector(
      "#profileLoveImageOneX"
    ),

  imageOneY:
    document.querySelector(
      "#profileLoveImageOneY"
    ),

  imageTwo:
    document.querySelector(
      "#profileLoveImageTwo"
    ),

  imageTwoX:
    document.querySelector(
      "#profileLoveImageTwoX"
    ),

  imageTwoY:
    document.querySelector(
      "#profileLoveImageTwoY"
    ),

  mainPolaroid:
    document.querySelector(
      "#profileLoveMainPolaroid"
    ),

  mainPolaroidX:
    document.querySelector(
      "#profileLoveMainPolaroidX"
    ),

  mainPolaroidY:
    document.querySelector(
      "#profileLoveMainPolaroidY"
    ),

  imageThree:
    document.querySelector(
      "#profileLoveImageThree"
    ),

  imageThreeX:
    document.querySelector(
      "#profileLoveImageThreeX"
    ),

  imageThreeY:
    document.querySelector(
      "#profileLoveImageThreeY"
    ),

  boxOne:
    document.querySelector(
      "#profileLoveBoxOne"
    ),

  boxTwo:
    document.querySelector(
      "#profileLoveBoxTwo"
    ),

  itemOne:
    document.querySelector(
      "#profileLoveItemOne"
    ),

  itemOneX:
    document.querySelector(
      "#profileLoveItemOneX"
    ),

  itemOneY:
    document.querySelector(
      "#profileLoveItemOneY"
    ),

  itemTwo:
    document.querySelector(
      "#profileLoveItemTwo"
    ),

  itemTwoX:
    document.querySelector(
      "#profileLoveItemTwoX"
    ),

  itemTwoY:
    document.querySelector(
      "#profileLoveItemTwoY"
    ),

  itemThree:
    document.querySelector(
      "#profileLoveItemThree"
    ),

  itemThreeX:
    document.querySelector(
      "#profileLoveItemThreeX"
    ),

  itemThreeY:
    document.querySelector(
      "#profileLoveItemThreeY"
    ),

  bottomOne:
    document.querySelector(
      "#profileLoveBottomOne"
    ),

  bottomTwo:
    document.querySelector(
      "#profileLoveBottomTwo"
    )
};

const defaultsProfile001 = {
  backgroundColor: "#ffffff",
  borderColor: "#b0120a",
  textColor: "#b0120a",
  subtitleColor: "#212121",
  quoteColor: "#b0120a",
  lineColor: "#b0120a",
  background:
    "https://i.pinimg.com/736x/11/c0/19/11c019679c28bfaad2d28f49838024c6.jpg",
  backgroundX: 50,
  backgroundY: 50,
  topOne: "✦",
  topTwo: "1309",
  title: "Franklin D.",
  subtitle: "Bloodworth",
  quote:
    "The blood jet is poetry,\nThere is no stopping it",
  imageOne:
    "https://i.pinimg.com/vwebp/1200x/9a/99/8e/9a998e55b0c30fd5e9a1a1e4187f5a6a.webp",
  imageOneX: 50,
  imageOneY: 50,
  imageTwo:
    "https://i.pinimg.com/vwebp/1200x/c6/3f/be/c63fbe4103fbb557bb7ab7febe112b21.webp",
  imageTwoX: 50,
  imageTwoY: 50,
  mainPolaroid:
    "https://i.pinimg.com/736x/7b/74/d5/7b74d50004297483ea4194c6dc24ca40.jpg",
  mainPolaroidX: 50,
  mainPolaroidY: 50,
  imageThree:
    "https://i.pinimg.com/vwebp/736x/a3/b1/88/a3b1883afa7e30d282a8ba6678c4c689.webp",
  imageThreeX: 50,
  imageThreeY: 50,
  boxOne: "PRETTY",
  boxTwo: "RICH",
  itemOne:
    "https://i.pinimg.com/vwebp/1200x/38/22/95/382295e880a508f9254d24ffc817f438.webp",
  itemOneX: 50,
  itemOneY: 50,
  itemTwo:
    "https://i.pinimg.com/vwebp/736x/f1/e3/b7/f1e3b717c1bf18dc196b95cb5ed35cb6.webp",
  itemTwoX: 50,
  itemTwoY: 50,
  itemThree:
    "https://i.pinimg.com/vwebp/736x/26/6b/33/266b33d8d05d2d8c895ca7807082ef21.webp",
  itemThreeX: 50,
  itemThreeY: 50,
  bottomOne: "1205",
  bottomTwo: "✦"
};

const polaroidLoveStylesheets = [
  "https://guindaeyo.github.io/deepdshop/pf01-pfrpjnszone.css",
  "https://dl.dropboxusercontent.com/scl/fi/4bhb8cdq3nd36sz6sgt58/modern20.css?rlkey=mw7nh42n09idz94gokoau6ilk&dl=0",
  "https://dl.dropboxusercontent.com/scl/fi/os2925rpysr3u17l94qdn/Calora.css?rlkey=kdfklertinadqg8p6co8aesyh&dl=0"
];

const polaroidLoveEditorPreviewCss = `<style data-polaroid-preview-only>html,body{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;overflow:hidden!important}body{position:relative!important}.dds-preview-shell{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;display:block!important;position:relative!important;overflow:hidden!important}.dds-preview-target{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;transform:none!important;overflow:hidden!important}.jnz-polaroidlove-bg{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;overflow:hidden!important;background-size:cover!important;background-repeat:no-repeat!important;background-position:center!important}.jnz-polaroidlove-center-wrapper{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important}.jnz-polaroidlove-jnz-prolar-box{margin:0!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;flex:0 0 auto!important}</style>`;

const polaroidLoveCardPreviewCss = `<style data-polaroid-card-preview-only>html,body{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;overflow:hidden!important}body{position:relative!important}.dds-card-preview-shell{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;display:block!important;position:relative!important;overflow:hidden!important}.dds-card-preview-target{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;transform:none!important;overflow:hidden!important}.jnz-polaroidlove-bg{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;overflow:hidden!important;background-size:cover!important;background-repeat:no-repeat!important;background-position:center!important}.jnz-polaroidlove-center-wrapper{width:1100px!important;min-width:1100px!important;max-width:1100px!important;height:1500px!important;min-height:1500px!important;max-height:1500px!important;margin:0!important;padding:0!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important}.jnz-polaroidlove-jnz-prolar-box{margin:0!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;flex:0 0 auto!important}</style>`;

function getPolaroidLoveData() {
  return {
    backgroundColor:
      normalizeColor(
        fieldsProfile001.backgroundColor.value,
        defaultsProfile001.backgroundColor
      ),

    borderColor:
      normalizeColor(
        fieldsProfile001.borderColor.value,
        defaultsProfile001.borderColor
      ),

    textColor:
      normalizeColor(
        fieldsProfile001.textColor.value,
        defaultsProfile001.textColor
      ),

    subtitleColor:
      normalizeColor(
        fieldsProfile001.subtitleColor.value,
        defaultsProfile001.subtitleColor
      ),

    quoteColor:
      normalizeColor(
        fieldsProfile001.quoteColor.value,
        defaultsProfile001.quoteColor
      ),

    lineColor:
      normalizeColor(
        fieldsProfile001.lineColor.value,
        defaultsProfile001.lineColor
      ),

    background:
      fieldsProfile001.background.value.trim(),

    backgroundX:
      normalizePosition(
        fieldsProfile001.backgroundX.value,
        defaultsProfile001.backgroundX
      ),

    backgroundY:
      normalizePosition(
        fieldsProfile001.backgroundY.value,
        defaultsProfile001.backgroundY
      ),

    topOne:
      fieldsProfile001.topOne.value,

    topTwo:
      fieldsProfile001.topTwo.value,

    title:
      fieldsProfile001.title.value,

    subtitle:
      fieldsProfile001.subtitle.value,

    quote:
      fieldsProfile001.quote.value,

    imageOne:
      fieldsProfile001.imageOne.value.trim(),

    imageOneX:
      normalizePosition(
        fieldsProfile001.imageOneX.value,
        defaultsProfile001.imageOneX
      ),

    imageOneY:
      normalizePosition(
        fieldsProfile001.imageOneY.value,
        defaultsProfile001.imageOneY
      ),

    imageTwo:
      fieldsProfile001.imageTwo.value.trim(),

    imageTwoX:
      normalizePosition(
        fieldsProfile001.imageTwoX.value,
        defaultsProfile001.imageTwoX
      ),

    imageTwoY:
      normalizePosition(
        fieldsProfile001.imageTwoY.value,
        defaultsProfile001.imageTwoY
      ),

    mainPolaroid:
      fieldsProfile001.mainPolaroid.value.trim(),

    mainPolaroidX:
      normalizePosition(
        fieldsProfile001.mainPolaroidX.value,
        defaultsProfile001.mainPolaroidX
      ),

    mainPolaroidY:
      normalizePosition(
        fieldsProfile001.mainPolaroidY.value,
        defaultsProfile001.mainPolaroidY
      ),

    imageThree:
      fieldsProfile001.imageThree.value.trim(),

    imageThreeX:
      normalizePosition(
        fieldsProfile001.imageThreeX.value,
        defaultsProfile001.imageThreeX
      ),

    imageThreeY:
      normalizePosition(
        fieldsProfile001.imageThreeY.value,
        defaultsProfile001.imageThreeY
      ),

    boxOne:
      fieldsProfile001.boxOne.value,

    boxTwo:
      fieldsProfile001.boxTwo.value,

    itemOne:
      fieldsProfile001.itemOne.value.trim(),

    itemOneX:
      normalizePosition(
        fieldsProfile001.itemOneX.value,
        defaultsProfile001.itemOneX
      ),

    itemOneY:
      normalizePosition(
        fieldsProfile001.itemOneY.value,
        defaultsProfile001.itemOneY
      ),

    itemTwo:
      fieldsProfile001.itemTwo.value.trim(),

    itemTwoX:
      normalizePosition(
        fieldsProfile001.itemTwoX.value,
        defaultsProfile001.itemTwoX
      ),

    itemTwoY:
      normalizePosition(
        fieldsProfile001.itemTwoY.value,
        defaultsProfile001.itemTwoY
      ),

    itemThree:
      fieldsProfile001.itemThree.value.trim(),

    itemThreeX:
      normalizePosition(
        fieldsProfile001.itemThreeX.value,
        defaultsProfile001.itemThreeX
      ),

    itemThreeY:
      normalizePosition(
        fieldsProfile001.itemThreeY.value,
        defaultsProfile001.itemThreeY
      ),

    bottomOne:
      fieldsProfile001.bottomOne.value,

    bottomTwo:
      fieldsProfile001.bottomTwo.value
  };
}

function buildPolaroidLoveMarkup(data) {
  return `<div class="jnz-polaroidlove-bg" style="background-image:url('${escapeHtml(data.background)}');background-position:${data.backgroundX}% ${data.backgroundY}%;"><div class="jnz-polaroidlove-center-wrapper"><div class="jnz-polaroidlove-jnz-prolar-box" style="--ppylbackg:${data.backgroundColor};--ppylborder:${data.borderColor};--ppyltext:${data.textColor};--ppylsubt:${data.subtitleColor};--ppylquote:${data.quoteColor};--ppylline:${data.lineColor};"><div class="jnz-polaroidlove-vv"><div>${formatEmojiOrSymbol(data.topOne)}</div><div>${formatEmojiOrSymbol(data.topTwo)}</div></div><div class="jnz-polaroidlove-line"></div><div class="jnz-polaroidlove-title">${escapeHtml(data.title)}</div><div class="jnz-polaroidlove-subtitle">${escapeHtml(data.subtitle)}</div><div class="jnz-polaroidlove-quote2d">${textWithBreaks(data.quote)}</div><div class="jnz-polaroidlove-image-wrapper"><div class="jnz-polaroidlove-stacked-images"><img src="${escapeHtml(data.imageOne)}" alt="" style="object-position:${data.imageOneX}% ${data.imageOneY}%;"><div class="jnz-polaroidlove-image-with-polaroid"><img src="${escapeHtml(data.imageTwo)}" alt="" style="object-position:${data.imageTwoX}% ${data.imageTwoY}%;"><img src="${escapeHtml(data.mainPolaroid)}" alt="" class="jnz-polaroidlove-main-polaroid" style="object-position:${data.mainPolaroidX}% ${data.mainPolaroidY}%;"></div><img src="${escapeHtml(data.imageThree)}" alt="" style="margin-top:-15px;object-position:${data.imageThreeX}% ${data.imageThreeY}%;"></div></div><div class="jnz-polaroidlove-quote-boxes"><div class="jnz-polaroidlove-quote">${escapeHtml(data.boxOne)}</div><div class="jnz-polaroidlove-quote">${escapeHtml(data.boxTwo)}</div></div><div class="jnz-polaroidlove-items"><div class="jnz-polaroidlove-item"><img src="${escapeHtml(data.itemOne)}" alt="" style="object-position:${data.itemOneX}% ${data.itemOneY}%;"></div><div class="jnz-polaroidlove-item"><img src="${escapeHtml(data.itemTwo)}" alt="" style="object-position:${data.itemTwoX}% ${data.itemTwoY}%;"></div><div class="jnz-polaroidlove-item"><img src="${escapeHtml(data.itemThree)}" alt="" style="object-position:${data.itemThreeX}% ${data.itemThreeY}%;"></div></div><div class="jnz-polaroidlove-linevvz"></div><div class="jnz-polaroidlove-vvvz"><div>${formatEmojiOrSymbol(data.bottomOne)}</div><div>${formatEmojiOrSymbol(data.bottomTwo)}</div></div></div></div></div>
${fdreviewCreditMarkup}`;
}

function buildPolaroidLoveFinalCode(data) {
  return `${buildStylesheetLinks(polaroidLoveStylesheets)}
${buildCreditStyleTag()}
${buildPolaroidLoveMarkup(data)}`;
}

function updatePolaroidLove() {
  if (!generatedPolaroidLoveCode) {
    return;
  }

  const data =
    getPolaroidLoveData();

  generatedPolaroidLoveCode.value =
    buildPolaroidLoveFinalCode(data);

  const editorPreviewMarkup =
    polaroidLoveEditorPreviewCss +
    buildPolaroidLoveMarkup(data);

  const cardPreviewMarkup =
    polaroidLoveCardPreviewCss +
    buildPolaroidLoveMarkup(data);

  if (polaroidLovePreview) {
    queuePreviewDocument(
      polaroidLovePreview,
      buildEditorPreviewDocument(
        polaroidLoveStylesheets,
        editorPreviewMarkup
      ),
      resizePolaroidFixedCanvasPreview
    );
  }

  if (profileCardPreview001) {
    queuePreviewDocument(
      profileCardPreview001,
      buildCardPreviewDocument(
        polaroidLoveStylesheets,
        cardPreviewMarkup
      ),
      resizePolaroidFixedCanvasPreview
    );
  }
}


/* ==================================================
   POLAROID LOVE — PREVIEW ZOOM
================================================== */

document
  .querySelectorAll(
    "[data-polaroid-zoom-step]"
  )
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const iframe =
          document.querySelector(
            "#polaroidLovePreview"
          );

        if (!iframe) {
          return;
        }

        const currentZoom =
          Number(
            iframe.dataset
              .profileZoom || 1
          ) || 1;

        const step =
          Number(
            button.dataset
              .polaroidZoomStep || 0
          ) || 0;

        setPolaroidLoveZoom(
          currentZoom + step
        );
      }
    );
  });

const resetPolaroidLoveZoomButton =
  document.querySelector(
    "#resetPolaroidLoveZoom"
  );

if (resetPolaroidLoveZoomButton) {
  resetPolaroidLoveZoomButton
    .addEventListener(
      "click",
      () => {
        setPolaroidLoveZoom(1);
      }
    );
}

updatePolaroidLoveZoomOutput();


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

Object.values(fields004).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateUuiaa
  );

  field.addEventListener(
    "change",
    updateUuiaa
  );

  field.addEventListener(
    "blur",
    updateUuiaa
  );
});

Object.values(fields005).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateComma
  );

  field.addEventListener(
    "change",
    updateComma
  );

  field.addEventListener(
    "blur",
    updateComma
  );
});

Object.values(fields006).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateNewRules
  );

  field.addEventListener(
    "change",
    updateNewRules
  );

  field.addEventListener(
    "blur",
    updateNewRules
  );
});

Object.values(fields007).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateLoveSong
  );

  field.addEventListener(
    "change",
    updateLoveSong
  );

  field.addEventListener(
    "blur",
    updateLoveSong
  );
});

Object.values(fields008).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateDumbDumber
  );

  field.addEventListener(
    "change",
    updateDumbDumber
  );

  field.addEventListener(
    "blur",
    updateDumbDumber
  );
});

Object.values(fields009).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateHigherHeaven
  );

  field.addEventListener(
    "change",
    updateHigherHeaven
  );

  field.addEventListener(
    "blur",
    updateHigherHeaven
  );
});

Object.values(fieldsProfile001).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updatePolaroidLove
  );

  field.addEventListener(
    "change",
    updatePolaroidLove
  );

  field.addEventListener(
    "blur",
    updatePolaroidLove
  );
});

Object.values(fieldsReview001).forEach((field) => {
  if (!field) {
    return;
  }

  field.addEventListener(
    "input",
    updateFoodReview
  );

  field.addEventListener(
    "change",
    updateFoodReview
  );

  field.addEventListener(
    "blur",
    updateFoodReview
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

bindColorPairs(
  [
    ["mmBackgColor", "mmBackgColorPicker"],
    ["mmBorderColor", "mmBorderColorPicker"],
    ["mmTextOneColor", "mmTextOneColorPicker"],
    ["mmNameColor", "mmNameColorPicker"],
    ["mmTextTwoColor", "mmTextTwoColorPicker"],
    ["mmMiniTextColor", "mmMiniTextColorPicker"]
  ],
  updateUuiaa
);

bindColorPairs(
  [
    ["commaBgColor", "commaBgColorPicker"],
    ["commaBorderColor", "commaBorderColorPicker"],
    ["commaNameColor", "commaNameColorPicker"],
    ["commaTextColor", "commaTextColorPicker"],
    ["commaMutedColor", "commaMutedColorPicker"]
  ],
  updateComma
);

bindColorPairs(
  [
    ["nrBgColor", "nrBgColorPicker"],
    ["nrCardColor", "nrCardColorPicker"],
    ["nrPillColor", "nrPillColorPicker"],
    ["nrPillTwoColor", "nrPillTwoColorPicker"],
    ["nrTextRoleplayColor", "nrTextRoleplayColorPicker"],
    ["nrTextNameColor", "nrTextNameColorPicker"],
    ["nrTextUnderColor", "nrTextUnderColorPicker"],
    ["nrDotOneColor", "nrDotOneColorPicker"],
    ["nrDotTwoColor", "nrDotTwoColorPicker"],
    ["nrDotThreeColor", "nrDotThreeColorPicker"],
    ["nrDotFourColor", "nrDotFourColorPicker"]
  ],
  updateNewRules
);

bindColorPairs(
  [
    ["loveBgColor", "loveBgColorPicker"],
    ["loveBorderColor", "loveBorderColorPicker"],
    ["loveNameColor", "loveNameColorPicker"],
    ["loveSubnameColor", "loveSubnameColorPicker"],
    ["loveHeaderColor", "loveHeaderColorPicker"],
    ["loveDotColor", "loveDotColorPicker"],
    ["lovePillBgColor", "lovePillBgColorPicker"],
    ["lovePillTextColor", "lovePillTextColorPicker"],
    ["loveRoleplayColor", "loveRoleplayColorPicker"]
  ],
  updateLoveSong
);

bindColorPairs(
  [
    ["dndBgColor", "dndBgColorPicker"],
    ["dndMainColor", "dndMainColorPicker"],
    ["dndRoleColor", "dndRoleColorPicker"]
  ],
  updateDumbDumber
);

bindColorPairs(
  [
    ["hthBgColor", "hthBgColorPicker"],
    ["hthMainColor", "hthMainColorPicker"],
    ["hthMainSoftColor", "hthMainSoftColorPicker"],
    ["hthFontColor", "hthFontColorPicker"],
    ["hthPolaroidTextColor", "hthPolaroidTextColorPicker"],
    ["hthDotColor", "hthDotColorPicker"]
  ],
  updateHigherHeaven
);

bindColorPairs(
  [
    ["profileLoveBgColor", "profileLoveBgColorPicker"],
    ["profileLoveBorderColor", "profileLoveBorderColorPicker"],
    ["profileLoveTextColor", "profileLoveTextColorPicker"],
    ["profileLoveSubtitleColor", "profileLoveSubtitleColorPicker"],
    ["profileLoveQuoteColor", "profileLoveQuoteColorPicker"],
    ["profileLoveLineColor", "profileLoveLineColorPicker"]
  ],
  updatePolaroidLove
);

bindColorPairs(
  [
    ["reviewMainColor", "reviewMainColorPicker"],
    ["reviewDarkColor", "reviewDarkColorPicker"],
    ["reviewStarColor", "reviewStarColorPicker"],
    ["reviewPaperColor", "reviewPaperColorPicker"],
    ["reviewTextColor", "reviewTextColorPicker"],
    ["reviewTagColor", "reviewTagColorPicker"]
  ],
  updateFoodReview
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
    updateHihi,

  uuiaaRoleplayEditor:
    updateUuiaa,

  commaRoleplayEditor:
    updateComma,

  newRulesRoleplayEditor:
    updateNewRules,

  loveSongRoleplayEditor:
    updateLoveSong,

  dumbDumberRoleplayEditor:
    updateDumbDumber,

  higherHeavenRoleplayEditor:
    updateHigherHeaven
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



const copyButton004 =
  document.querySelector(
    "#copyGeneratedUuiaaCode"
  );

if (copyButton004) {
  copyButton004.addEventListener(
    "click",
    async () => {
      updateUuiaa();

      await copyText(
        generatedUuiaaCode.value,
        generatedUuiaaCode
      );

      showToast(
        "คัดลอกโค้ด CODE004 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton005 =
  document.querySelector(
    "#copyGeneratedCommaCode"
  );

if (copyButton005) {
  copyButton005.addEventListener(
    "click",
    async () => {
      updateComma();

      await copyText(
        generatedCommaCode.value,
        generatedCommaCode
      );

      showToast(
        "คัดลอกโค้ด CODE005 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton006 =
  document.querySelector(
    "#copyGeneratedNewRulesCode"
  );

if (copyButton006) {
  copyButton006.addEventListener(
    "click",
    async () => {
      updateNewRules();

      await copyText(
        generatedNewRulesCode.value,
        generatedNewRulesCode
      );

      showToast(
        "คัดลอกโค้ด CODE006 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton007 =
  document.querySelector(
    "#copyGeneratedLoveSongCode"
  );

if (copyButton007) {
  copyButton007.addEventListener(
    "click",
    async () => {
      updateLoveSong();

      await copyText(
        generatedLoveSongCode.value,
        generatedLoveSongCode
      );

      showToast(
        "คัดลอกโค้ด CODE007 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton008 =
  document.querySelector(
    "#copyGeneratedDumbDumberCode"
  );

if (copyButton008) {
  copyButton008.addEventListener(
    "click",
    async () => {
      updateDumbDumber();

      await copyText(
        generatedDumbDumberCode.value,
        generatedDumbDumberCode
      );

      showToast(
        "คัดลอกโค้ด CODE008 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyButton009 =
  document.querySelector(
    "#copyGeneratedHigherHeavenCode"
  );

if (copyButton009) {
  copyButton009.addEventListener(
    "click",
    async () => {
      updateHigherHeaven();

      await copyText(
        generatedHigherHeavenCode.value,
        generatedHigherHeavenCode
      );

      showToast(
        "คัดลอกโค้ด CODE009 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyProfileButton001 =
  document.querySelector(
    "#copyGeneratedPolaroidLoveCode"
  );

if (copyProfileButton001) {
  copyProfileButton001.addEventListener(
    "click",
    async () => {
      updatePolaroidLove();

      await copyText(
        generatedPolaroidLoveCode.value,
        generatedPolaroidLoveCode
      );

      showToast(
        "คัดลอก PROFILE CODE001 เรียบร้อยแล้ว"
      );
    }
  );
}



const copyReviewButton001 =
  document.querySelector(
    "#copyGeneratedFoodReviewCode"
  );

if (copyReviewButton001) {
  copyReviewButton001.addEventListener(
    "click",
    async () => {
      updateFoodReview();

      await copyText(
        generatedFoodReviewCode.value,
        generatedFoodReviewCode
      );

      showToast(
        "คัดลอก REVIEW CODE001 เรียบร้อยแล้ว"
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




const resetButton004 =
  document.querySelector(
    "#resetUuiaa"
  );

if (resetButton004) {
  resetButton004.addEventListener(
    "click",
    () => {
      fields004.backg.value =
        defaults004.backg;

      fields004.border.value =
        defaults004.border;

      fields004.textOne.value =
        defaults004.textOne;

      fields004.name.value =
        defaults004.name;

      fields004.textTwo.value =
        defaults004.textTwo;

      fields004.miniText.value =
        defaults004.miniText;

      fields004.species.value =
        defaults004.species;

      fields004.firstLetter.value =
        defaults004.firstLetter;

      fields004.displayName.value =
        defaults004.displayName;

      fields004.caption.value =
        defaults004.caption;

      fields004.leftVerticalText.value =
        defaults004.leftVerticalText;

      fields004.leftImage.value =
        defaults004.leftImage;

      fields004.leftImageX.value =
        defaults004.leftImageX;

      fields004.leftImageY.value =
        defaults004.leftImageY;

      fields004.leftIcon.value =
        defaults004.leftIcon;

      fields004.leftIconX.value =
        defaults004.leftIconX;

      fields004.leftIconY.value =
        defaults004.leftIconY;

      fields004.centerImage.value =
        defaults004.centerImage;

      fields004.centerImageX.value =
        defaults004.centerImageX;

      fields004.centerImageY.value =
        defaults004.centerImageY;

      fields004.centerIcon.value =
        defaults004.centerIcon;

      fields004.centerIconX.value =
        defaults004.centerIconX;

      fields004.centerIconY.value =
        defaults004.centerIconY;

      fields004.rightShortText.value =
        defaults004.rightShortText;

      fields004.rightVerticalText.value =
        defaults004.rightVerticalText;

      fields004.rightImage.value =
        defaults004.rightImage;

      fields004.rightImageX.value =
        defaults004.rightImageX;

      fields004.rightImageY.value =
        defaults004.rightImageY;

      fields004.rightIcon.value =
        defaults004.rightIcon;

      fields004.rightIconX.value =
        defaults004.rightIconX;

      fields004.rightIconY.value =
        defaults004.rightIconY;

      fields004.roleplay.innerHTML =
        defaults004.roleplay;

      fields004.footer.value =
        defaults004.footer;

      [
        ["mmBackgColor", "mmBackgColorPicker"],
        ["mmBorderColor", "mmBorderColorPicker"],
        ["mmTextOneColor", "mmTextOneColorPicker"],
        ["mmNameColor", "mmNameColorPicker"],
        ["mmTextTwoColor", "mmTextTwoColorPicker"],
        ["mmMiniTextColor", "mmMiniTextColorPicker"]
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
      updateUuiaa();

      showToast(
        "คืนค่า CODE004 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetButton005 =
  document.querySelector(
    "#resetComma"
  );

if (resetButton005) {
  resetButton005.addEventListener(
    "click",
    () => {
      fields005.backg.value =
        defaults005.backg;

      fields005.border.value =
        defaults005.border;

      fields005.name.value =
        defaults005.name;

      fields005.text.value =
        defaults005.text;

      fields005.muted.value =
        defaults005.muted;

      fields005.topText.value =
        defaults005.topText;

      fields005.displayName.value =
        defaults005.displayName;

      fields005.imageOne.value =
        defaults005.imageOne;

      fields005.imageOneX.value =
        defaults005.imageOneX;

      fields005.imageOneY.value =
        defaults005.imageOneY;

      fields005.imageTwo.value =
        defaults005.imageTwo;

      fields005.imageTwoX.value =
        defaults005.imageTwoX;

      fields005.imageTwoY.value =
        defaults005.imageTwoY;

      fields005.imageThree.value =
        defaults005.imageThree;

      fields005.imageThreeX.value =
        defaults005.imageThreeX;

      fields005.imageThreeY.value =
        defaults005.imageThreeY;

      fields005.imageFour.value =
        defaults005.imageFour;

      fields005.imageFourX.value =
        defaults005.imageFourX;

      fields005.imageFourY.value =
        defaults005.imageFourY;

      fields005.roleplay.innerHTML =
        defaults005.roleplay;

      fields005.footerLeft.value =
        defaults005.footerLeft;

      fields005.footerCenter.value =
        defaults005.footerCenter;

      fields005.footerRight.value =
        defaults005.footerRight;

      [
        ["commaBgColor", "commaBgColorPicker"],
        ["commaBorderColor", "commaBorderColorPicker"],
        ["commaNameColor", "commaNameColorPicker"],
        ["commaTextColor", "commaTextColorPicker"],
        ["commaMutedColor", "commaMutedColorPicker"]
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
      updateComma();

      showToast(
        "คืนค่า CODE005 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetButton006 =
  document.querySelector(
    "#resetNewRules"
  );

if (resetButton006) {
  resetButton006.addEventListener(
    "click",
    () => {
      fields006.bg.value =
        defaults006.bg;

      fields006.card.value =
        defaults006.card;

      fields006.pill.value =
        defaults006.pill;

      fields006.pillTwo.value =
        defaults006.pillTwo;

      fields006.textRoleplay.value =
        defaults006.textRoleplay;

      fields006.textName.value =
        defaults006.textName;

      fields006.textUnder.value =
        defaults006.textUnder;

      fields006.dotOne.value =
        defaults006.dotOne;

      fields006.dotTwo.value =
        defaults006.dotTwo;

      fields006.dotThree.value =
        defaults006.dotThree;

      fields006.dotFour.value =
        defaults006.dotFour;

      fields006.sideInfo.value =
        defaults006.sideInfo;

      fields006.sideProfile.value =
        defaults006.sideProfile;

      fields006.displayName.value =
        defaults006.displayName;

      fields006.bigAvatar.value =
        defaults006.bigAvatar;

      fields006.bigAvatarX.value =
        defaults006.bigAvatarX;

      fields006.bigAvatarY.value =
        defaults006.bigAvatarY;

      fields006.species.value =
        defaults006.species;

      fields006.miniAvatar.value =
        defaults006.miniAvatar;

      fields006.miniAvatarX.value =
        defaults006.miniAvatarX;

      fields006.miniAvatarY.value =
        defaults006.miniAvatarY;

      fields006.websiteText.value =
        defaults006.websiteText;

      fields006.accountAvatar.value =
        defaults006.accountAvatar;

      fields006.accountAvatarX.value =
        defaults006.accountAvatarX;

      fields006.accountAvatarY.value =
        defaults006.accountAvatarY;

      fields006.accountName.value =
        defaults006.accountName;

      fields006.accountSubtitle.value =
        defaults006.accountSubtitle;

      fields006.roleplay.innerHTML =
        defaults006.roleplay;

      fields006.replyText.value =
        defaults006.replyText;

      fields006.actionOne.value =
        defaults006.actionOne;

      fields006.actionTwo.value =
        defaults006.actionTwo;

      fields006.actionThree.value =
        defaults006.actionThree;

      fields006.sendIcon.value =
        defaults006.sendIcon;

      fields006.noteText.value =
        defaults006.noteText;

      fields006.footerAvatar.value =
        defaults006.footerAvatar;

      fields006.footerAvatarX.value =
        defaults006.footerAvatarX;

      fields006.footerAvatarY.value =
        defaults006.footerAvatarY;

      fields006.footerText.value =
        defaults006.footerText;

      [
        ["nrBgColor", "nrBgColorPicker"],
        ["nrCardColor", "nrCardColorPicker"],
        ["nrPillColor", "nrPillColorPicker"],
        ["nrPillTwoColor", "nrPillTwoColorPicker"],
        ["nrTextRoleplayColor", "nrTextRoleplayColorPicker"],
        ["nrTextNameColor", "nrTextNameColorPicker"],
        ["nrTextUnderColor", "nrTextUnderColorPicker"],
        ["nrDotOneColor", "nrDotOneColorPicker"],
        ["nrDotTwoColor", "nrDotTwoColorPicker"],
        ["nrDotThreeColor", "nrDotThreeColorPicker"],
        ["nrDotFourColor", "nrDotFourColorPicker"]
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
      updateNewRules();

      showToast(
        "คืนค่า CODE006 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetButton007 =
  document.querySelector(
    "#resetLoveSong"
  );

if (resetButton007) {
  resetButton007.addEventListener(
    "click",
    () => {
      fields007.background.value =
        defaults007.background;

      fields007.border.value =
        defaults007.border;

      fields007.name.value =
        defaults007.name;

      fields007.subname.value =
        defaults007.subname;

      fields007.header.value =
        defaults007.header;

      fields007.dot.value =
        defaults007.dot;

      fields007.pillBackground.value =
        defaults007.pillBackground;

      fields007.pillTextColor.value =
        defaults007.pillTextColor;

      fields007.roleplayColor.value =
        defaults007.roleplayColor;

      fields007.since.value =
        defaults007.since;

      fields007.year.value =
        defaults007.year;

      fields007.firstName.value =
        defaults007.firstName;

      fields007.lastName.value =
        defaults007.lastName;

      fields007.gridOne.value =
        defaults007.gridOne;

      fields007.gridOneX.value =
        defaults007.gridOneX;

      fields007.gridOneY.value =
        defaults007.gridOneY;

      fields007.gridTwo.value =
        defaults007.gridTwo;

      fields007.gridTwoX.value =
        defaults007.gridTwoX;

      fields007.gridTwoY.value =
        defaults007.gridTwoY;

      fields007.gridThree.value =
        defaults007.gridThree;

      fields007.gridThreeX.value =
        defaults007.gridThreeX;

      fields007.gridThreeY.value =
        defaults007.gridThreeY;

      fields007.gridFour.value =
        defaults007.gridFour;

      fields007.gridFourX.value =
        defaults007.gridFourX;

      fields007.gridFourY.value =
        defaults007.gridFourY;

      fields007.portrait.value =
        defaults007.portrait;

      fields007.portraitX.value =
        defaults007.portraitX;

      fields007.portraitY.value =
        defaults007.portraitY;

      fields007.leftSmall.value =
        defaults007.leftSmall;

      fields007.leftMain.value =
        defaults007.leftMain;

      fields007.pillText.value =
        defaults007.pillText;

      fields007.rightText.value =
        defaults007.rightText;

      fields007.species.value =
        defaults007.species;

      fields007.quote.value =
        defaults007.quote;

      fields007.roleplay.innerHTML =
        defaults007.roleplay;

      [
        ["loveBgColor", "loveBgColorPicker"],
        ["loveBorderColor", "loveBorderColorPicker"],
        ["loveNameColor", "loveNameColorPicker"],
        ["loveSubnameColor", "loveSubnameColorPicker"],
        ["loveHeaderColor", "loveHeaderColorPicker"],
        ["loveDotColor", "loveDotColorPicker"],
        ["lovePillBgColor", "lovePillBgColorPicker"],
        ["lovePillTextColor", "lovePillTextColorPicker"],
        ["loveRoleplayColor", "loveRoleplayColorPicker"]
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
      updateLoveSong();

      showToast(
        "คืนค่า CODE007 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetButton008 =
  document.querySelector(
    "#resetDumbDumber"
  );

if (resetButton008) {
  resetButton008.addEventListener(
    "click",
    () => {
      fields008.background.value =
        defaults008.background;

      fields008.mainColor.value =
        defaults008.mainColor;

      fields008.roleColor.value =
        defaults008.roleColor;

      fields008.topSymbol.value =
        defaults008.topSymbol;

      fields008.displayName.value =
        defaults008.displayName;

      fields008.species.value =
        defaults008.species;

      fields008.imageOne.value =
        defaults008.imageOne;

      fields008.imageOneX.value =
        defaults008.imageOneX;

      fields008.imageOneY.value =
        defaults008.imageOneY;

      fields008.imageTwo.value =
        defaults008.imageTwo;

      fields008.imageTwoX.value =
        defaults008.imageTwoX;

      fields008.imageTwoY.value =
        defaults008.imageTwoY;

      fields008.imageThree.value =
        defaults008.imageThree;

      fields008.imageThreeX.value =
        defaults008.imageThreeX;

      fields008.imageThreeY.value =
        defaults008.imageThreeY;

      fields008.imageFour.value =
        defaults008.imageFour;

      fields008.imageFourX.value =
        defaults008.imageFourX;

      fields008.imageFourY.value =
        defaults008.imageFourY;

      fields008.heartSymbol.value =
        defaults008.heartSymbol;

      fields008.tabOne.value =
        defaults008.tabOne;

      fields008.tabTwo.value =
        defaults008.tabTwo;

      fields008.tabThree.value =
        defaults008.tabThree;

      fields008.roleplay.innerHTML =
        defaults008.roleplay;

      fields008.bottomOne.value =
        defaults008.bottomOne;

      fields008.bottomTwo.value =
        defaults008.bottomTwo;

      fields008.bottomThree.value =
        defaults008.bottomThree;

      [
        ["dndBgColor", "dndBgColorPicker"],
        ["dndMainColor", "dndMainColorPicker"],
        ["dndRoleColor", "dndRoleColorPicker"]
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
      updateDumbDumber();

      showToast(
        "คืนค่า CODE008 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetButton009 =
  document.querySelector(
    "#resetHigherHeaven"
  );

if (resetButton009) {
  resetButton009.addEventListener(
    "click",
    () => {
      fields009.background.value =
        defaults009.background;

      fields009.mainColor.value =
        defaults009.mainColor;

      fields009.mainSoftColor.value =
        defaults009.mainSoftColor;

      fields009.fontColor.value =
        defaults009.fontColor;

      fields009.polaroidTextColor.value =
        defaults009.polaroidTextColor;

      fields009.dotColor.value =
        defaults009.dotColor;

      fields009.mainImage.value =
        defaults009.mainImage;

      fields009.mainImageX.value =
        defaults009.mainImageX;

      fields009.mainImageY.value =
        defaults009.mainImageY;

      fields009.miniTopImage.value =
        defaults009.miniTopImage;

      fields009.miniTopImageX.value =
        defaults009.miniTopImageX;

      fields009.miniTopImageY.value =
        defaults009.miniTopImageY;

      fields009.miniBottomImage.value =
        defaults009.miniBottomImage;

      fields009.miniBottomImageX.value =
        defaults009.miniBottomImageX;

      fields009.miniBottomImageY.value =
        defaults009.miniBottomImageY;

      fields009.bgLetterOne.value =
        defaults009.bgLetterOne;

      fields009.bgLetterTwo.value =
        defaults009.bgLetterTwo;

      fields009.species.value =
        defaults009.species;

      fields009.sideText.value =
        defaults009.sideText;

      fields009.navOne.value =
        defaults009.navOne;

      fields009.navTwo.value =
        defaults009.navTwo;

      fields009.navThree.value =
        defaults009.navThree;

      fields009.initial.value =
        defaults009.initial;

      fields009.firstName.value =
        defaults009.firstName;

      fields009.lastName.value =
        defaults009.lastName;

      fields009.leftTag.value =
        defaults009.leftTag;

      fields009.rightTag.value =
        defaults009.rightTag;

      fields009.roleplay.innerHTML =
        defaults009.roleplay;

      fields009.note.value =
        defaults009.note;

      [
        ["hthBgColor", "hthBgColorPicker"],
        ["hthMainColor", "hthMainColorPicker"],
        ["hthFontColor", "hthFontColorPicker"],
        ["hthPolaroidTextColor", "hthPolaroidTextColorPicker"],
        ["hthDotColor", "hthDotColorPicker"]
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

      const softPicker =
        document.querySelector(
          "#hthMainSoftColorPicker"
        );

      if (softPicker) {
        softPicker.value = "#f2e8e8";
      }

      syncImagePositionOutputs();
      updateHigherHeaven();

      showToast(
        "คืนค่า CODE009 เรียบร้อยแล้ว"
      );
    }
  );
}




const resetProfileButton001 =
  document.querySelector(
    "#resetPolaroidLove"
  );

if (resetProfileButton001) {
  resetProfileButton001.addEventListener(
    "click",
    () => {
      Object.entries(
        defaultsProfile001
      ).forEach(([key, value]) => {
        const field =
          fieldsProfile001[key];

        if (field) {
          field.value = value;
        }
      });

      [
        ["profileLoveBgColor", "profileLoveBgColorPicker"],
        ["profileLoveBorderColor", "profileLoveBorderColorPicker"],
        ["profileLoveTextColor", "profileLoveTextColorPicker"],
        ["profileLoveSubtitleColor", "profileLoveSubtitleColorPicker"],
        ["profileLoveQuoteColor", "profileLoveQuoteColorPicker"],
        ["profileLoveLineColor", "profileLoveLineColorPicker"]
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
      updatePolaroidLove();

      showToast(
        "คืนค่า PROFILE CODE001 เรียบร้อยแล้ว"
      );
    }
  );
}



const resetReviewButton001 =
  document.querySelector(
    "#resetFoodReview"
  );

if (resetReviewButton001) {
  resetReviewButton001.addEventListener(
    "click",
    () => {
      Object.entries(
        defaultsReview001
      ).forEach(([key, value]) => {
        const field =
          fieldsReview001[key];

        if (field) {
          field.value = value;
        }
      });

      [
        ["reviewMainColor", "reviewMainColorPicker"],
        ["reviewDarkColor", "reviewDarkColorPicker"],
        ["reviewStarColor", "reviewStarColorPicker"],
        ["reviewPaperColor", "reviewPaperColorPicker"],
        ["reviewTextColor", "reviewTextColorPicker"],
        ["reviewTagColor", "reviewTagColorPicker"]
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
      updateFoodReview();

      showToast(
        "คืนค่า REVIEW CODE001 เรียบร้อยแล้ว"
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
  uuiaaPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  commaPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  newRulesPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  loveSongPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  dumbDumberPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  higherHeavenPreview,
  resizeEditorPreview
);

schedulePreviewResize(
  polaroidLovePreview,
  resizePolaroidFixedCanvasPreview
);

schedulePreviewResize(
  foodReviewPreview,
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

schedulePreviewResize(
  roleplayCardPreview004,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview005,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview006,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview007,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview008,
  resizeCardPreview
);

schedulePreviewResize(
  roleplayCardPreview009,
  resizeCardPreview
);

schedulePreviewResize(
  profileCardPreview001,
  resizePolaroidFixedCanvasPreview
);

schedulePreviewResize(
  reviewCardPreview001,
  resizeReviewDesktopCardPreview
);

let resizeTimer;

window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      document
        .querySelectorAll(
          ".dds-panel.is-active .dds-editor-preview-frame, .dds-panel.is-active .dds-roleplay-card-preview-frame"
        )
        .forEach((iframe) => {
          const state =
            getPreviewState(iframe);

          if (
            !state.loaded ||
            typeof state.resizeFunction !==
              "function"
          ) {
            return;
          }

          if (
            isCardPreviewIframe(iframe) &&
            !isPreviewNearViewport(iframe)
          ) {
            return;
          }

          runPreviewResize(
            iframe,
            state.resizeFunction,
            true
          );
        });
    }, 120);
  }
);


/* ==================================================
   INITIALIZE
================================================== */

updatePageOfOne();
updateWeirdo();
updateHihi();
updateUuiaa();
updateComma();
updateNewRules();
updateLoveSong();
updateDumbDumber();
updateHigherHeaven();
updatePolaroidLove();
updateFoodReview();
openPageFromHash();
