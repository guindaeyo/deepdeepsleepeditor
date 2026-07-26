"use strict";

/*
 * DEEP DEEP SLEEP CODE SHOP
 * LIVE PREVIEW PERFORMANCE BUILD
 *
 * ไฟล์นี้ใช้แทน script.js เดิมได้ทันที
 * - โหลดระบบเว็บไซต์เดิมจาก commit ที่ล็อกเวอร์ชันไว้
 * - จากนั้นติดตั้งตัวแก้ LIVE PREVIEW ให้ซูม/ขยับรูปได้ลื่นขึ้น
 * - ไม่ต้องแก้ index.html และ style.css
 */

(() => {
  if (window.__DDS_PERFORMANCE_BUILD_LOADING__) {
    return;
  }

  window.__DDS_PERFORMANCE_BUILD_LOADING__ = true;

  const CORE_COMMIT =
    "9550fb74db2ae4898bb9b76fcdefab8af64134b3";

  const CORE_CDN_URL =
    `https://cdn.jsdelivr.net/gh/guindaeyo/deepdeepsleepeditor@${CORE_COMMIT}/script.js`;

  const CORE_RAW_URL =
    `https://raw.githubusercontent.com/guindaeyo/deepdeepsleepeditor/${CORE_COMMIT}/script.js`;

  function appendClassicScript(src, cleanup) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = src;
      script.async = false;
      script.dataset.ddsCoreScript = "true";

      script.addEventListener(
        "load",
        () => {
          if (typeof cleanup === "function") {
            cleanup();
          }

          resolve();
        },
        { once: true }
      );

      script.addEventListener(
        "error",
        () => {
          if (typeof cleanup === "function") {
            cleanup();
          }

          script.remove();
          reject(
            new Error(
              `โหลดระบบเว็บไซต์ไม่สำเร็จ: ${src}`
            )
          );
        },
        { once: true }
      );

      document.head.appendChild(script);
    });
  }

  async function loadCoreFromRawFallback() {
    const response = await fetch(CORE_RAW_URL, {
      cache: "force-cache",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(
        `โหลดระบบสำรองไม่สำเร็จ (${response.status})`
      );
    }

    const source = await response.text();
    const blob = new Blob([source], {
      type: "application/javascript;charset=utf-8"
    });
    const blobUrl = URL.createObjectURL(blob);

    return appendClassicScript(blobUrl, () => {
      URL.revokeObjectURL(blobUrl);
    });
  }

  function installLivePreviewPerformanceFix() {
    if (window.__DDS_LIVE_PREVIEW_FIX_INSTALLED__) {
      return;
    }

    window.__DDS_LIVE_PREVIEW_FIX_INSTALLED__ = true;

    const resizeFrames = new WeakMap();

    function extractUrls(value) {
      const urls = [];
      const text = String(value || "");
      const pattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
      let match;

      while ((match = pattern.exec(text))) {
        urls.push(match[2]);
      }

      return urls;
    }

    function getAssetSignature(root) {
      if (!root) {
        return "";
      }

      const assets = [];

      root.querySelectorAll("img").forEach((image) => {
        assets.push(
          `img:${image.getAttribute("src") || ""}`
        );
        assets.push(
          `srcset:${image.getAttribute("srcset") || ""}`
        );
      });

      root.querySelectorAll("source").forEach((source) => {
        assets.push(
          `source:${source.getAttribute("src") || ""}`
        );
        assets.push(
          `source-set:${source.getAttribute("srcset") || ""}`
        );
      });

      root
        .querySelectorAll("video, audio, iframe")
        .forEach((element) => {
          assets.push(
            `${element.tagName}:${element.getAttribute("src") || ""}`
          );
        });

      root.querySelectorAll("[style]").forEach((element) => {
        extractUrls(element.getAttribute("style")).forEach(
          (url) => {
            assets.push(`inline-url:${url}`);
          }
        );
      });

      root.querySelectorAll("style").forEach((styleElement) => {
        extractUrls(styleElement.textContent).forEach((url) => {
          assets.push(`style-url:${url}`);
        });
      });

      return assets.join("\n");
    }

    function syncAttributes(currentElement, nextElement) {
      Array.from(currentElement.attributes).forEach(
        (attribute) => {
          if (!nextElement.hasAttribute(attribute.name)) {
            currentElement.removeAttribute(attribute.name);
          }
        }
      );

      Array.from(nextElement.attributes).forEach(
        (attribute) => {
          if (
            currentElement.getAttribute(attribute.name) !==
            attribute.value
          ) {
            currentElement.setAttribute(
              attribute.name,
              attribute.value
            );
          }
        }
      );
    }

    function patchNode(currentNode, nextNode) {
      if (!currentNode || !nextNode) {
        return;
      }

      if (
        currentNode.nodeType !== nextNode.nodeType ||
        currentNode.nodeName !== nextNode.nodeName
      ) {
        currentNode.replaceWith(nextNode.cloneNode(true));
        return;
      }

      if (
        currentNode.nodeType === Node.TEXT_NODE ||
        currentNode.nodeType === Node.COMMENT_NODE
      ) {
        if (currentNode.nodeValue !== nextNode.nodeValue) {
          currentNode.nodeValue = nextNode.nodeValue;
        }

        return;
      }

      if (currentNode.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      syncAttributes(currentNode, nextNode);
      patchChildren(currentNode, nextNode);
    }

    function patchChildren(currentParent, nextParent) {
      const currentChildren = Array.from(
        currentParent.childNodes
      );
      const nextChildren = Array.from(nextParent.childNodes);
      const sharedLength = Math.min(
        currentChildren.length,
        nextChildren.length
      );

      for (let index = 0; index < sharedLength; index += 1) {
        patchNode(currentChildren[index], nextChildren[index]);
      }

      for (
        let index = currentChildren.length - 1;
        index >= nextChildren.length;
        index -= 1
      ) {
        currentParent.removeChild(
          currentParent.childNodes[index]
        );
      }

      for (
        let index = currentChildren.length;
        index < nextChildren.length;
        index += 1
      ) {
        currentParent.appendChild(
          nextChildren[index].cloneNode(true)
        );
      }
    }

    function scheduleLightResize(iframe, resizeFunction) {
      const previousFrame = resizeFrames.get(iframe);

      if (previousFrame) {
        cancelAnimationFrame(previousFrame);
      }

      const frame = requestAnimationFrame(() => {
        resizeFrames.delete(iframe);

        if (typeof resizeFunction === "function") {
          resizeFunction(iframe);
        }

        if (typeof window.revealPreview === "function") {
          window.revealPreview(iframe);
        }
      });

      resizeFrames.set(iframe, frame);
    }

    window.updateLoadedPreviewDocument =
      function updateLoadedPreviewDocumentFast(
        iframe,
        srcdoc,
        resizeFunction
      ) {
        const previewDocument = iframe?.contentDocument;

        if (
          !previewDocument ||
          previewDocument.readyState === "loading"
        ) {
          return false;
        }

        const selector =
          ".dds-preview-target, .dds-card-preview-target";
        const currentTarget =
          previewDocument.querySelector(selector);

        if (!currentTarget) {
          return false;
        }

        const parsedDocument =
          new DOMParser().parseFromString(
            srcdoc,
            "text/html"
          );
        const nextTarget =
          parsedDocument.querySelector(selector);

        if (!nextTarget) {
          return false;
        }

        const currentAssets =
          getAssetSignature(currentTarget);
        const nextAssets = getAssetSignature(nextTarget);
        const assetsChanged =
          currentAssets !== nextAssets;

        patchNode(currentTarget, nextTarget);

        if (
          assetsChanged &&
          typeof window.watchPreviewAssets === "function"
        ) {
          window.watchPreviewAssets(
            iframe,
            resizeFunction
          );
        }

        if (
          assetsChanged &&
          typeof window.runPreviewResize === "function"
        ) {
          window.runPreviewResize(
            iframe,
            resizeFunction,
            true
          );
        } else {
          scheduleLightResize(iframe, resizeFunction);
        }

        return true;
      };

    if (
      typeof window.getPreviewState === "function" &&
      typeof window.applyPreviewDocument === "function" &&
      typeof window.isCardPreviewIframe === "function"
    ) {
      window.commitPendingPreview =
        function commitPendingPreviewThrottled(
          iframe,
          immediate = false
        ) {
          const state = window.getPreviewState(iframe);

          clearTimeout(state.timer);
          state.timer = null;

          if (immediate) {
            clearTimeout(state.performanceTimer);
            state.performanceTimer = null;
            window.applyPreviewDocument(iframe);
            return;
          }

          if (state.performanceTimer) {
            return;
          }

          const delay =
            window.isCardPreviewIframe(iframe)
              ? 70
              : 34;

          state.performanceTimer = window.setTimeout(
            () => {
              state.performanceTimer = null;
              window.applyPreviewDocument(iframe);
            },
            delay
          );
        };
    }
  }


  const PAGE_OF_ONE_CATALOGUE_MARKUP = String.raw`<div class="pageof-wrapper" style="--backg:#e0e0e0;--border:#777;--text:#000;--quote:#9e9e9e;">
<div class="pageof-cr">ordinary vampire<br>(just a girl)</div>
<div class="pageof-star">✦</div>
<div class="pageof-title">Franklin D. Bloodworth</div>
<div class="pageof-subtitle">This hits like coma</div>
<div class="pageof-quote">“A deep sleep fell upon me — a sleep like that of death.”</div>
<div class="pageof-image-grid"><div class="pageof-image-block"><div class="pageof-image-frame"><img src="https://i.pinimg.com/736x/c1/26/66/c126669ccfa791304dc162adac595a0d.jpg" alt=""></div><div class="pageof-caption">01<br>Uh, you're in my zone</div></div>
<div class="pageof-image-block"><div class="pageof-image-frame"><img src="https://i.pinimg.com/736x/a1/f9/5b/a1f95bbc9e273540682aa8b279b23e95.jpg" alt=""></div><div class="pageof-caption">02<br>Come and follow</div></div></div>
<div class="pageof-text-box">คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</div>
<div class="pageof-remark"><div class="pageof-remark2">หมายเห็ดนะ : สมมุติว่ายาว</div></div></div>`;

  function buildStaticPageOfOneCardDocument() {
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://guindaeyo.github.io/deepdshop/pageofone.css" rel="stylesheet">
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
</style>
</head>
<body data-dds-static-preview="page-of-one">
  <div class="dds-card-preview-shell">
    <div class="dds-card-preview-target">
      ${PAGE_OF_ONE_CATALOGUE_MARKUP}
    </div>
  </div>
</body>
</html>`;
  }

  function renderStaticPageOfOneCataloguePreview() {
    const iframe = document.querySelector(
      "#roleplayCardPreview001"
    );

    if (!iframe) {
      return;
    }

    /*
     * พรีวิวบนหน้ารวมต้องใช้ข้อมูลตัวอย่างสมบูรณ์เสมอ
     * ไม่ผูกกับช่อง EDIT CODE ที่ตั้งใจเปิดมาเป็นข้อมูลว่าง
     */
    iframe.dataset.previewFit = "contain";
    iframe.dataset.previewVisualBounds = "true";

    const srcdoc =
      buildStaticPageOfOneCardDocument();

    if (
      typeof window.queuePreviewDocument === "function" &&
      typeof window.resizeCardPreview === "function"
    ) {
      window.queuePreviewDocument(
        iframe,
        srcdoc,
        window.resizeCardPreview
      );

      if (
        typeof window.activatePendingPreviews === "function"
      ) {
        window.activatePendingPreviews("roleplay");
      }

      return;
    }

    iframe.srcdoc = srcdoc;
  }

  function scheduleStaticPageOfOneCataloguePreview() {
    [0, 90, 260].forEach((delay) => {
      window.setTimeout(
        renderStaticPageOfOneCataloguePreview,
        delay
      );
    });
  }

  function installStaticCataloguePreviewFix() {
    if (window.__DDS_STATIC_CATALOGUE_PREVIEW_FIX__) {
      return;
    }

    window.__DDS_STATIC_CATALOGUE_PREVIEW_FIX__ = true;

    document.addEventListener("click", (event) => {
      const roleplayNavigation =
        event.target.closest(
          '[data-go="roleplay"], [data-page="roleplay"]'
        );

      if (roleplayNavigation) {
        scheduleStaticPageOfOneCataloguePreview();
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#roleplay") {
        scheduleStaticPageOfOneCataloguePreview();
      }
    });

    scheduleStaticPageOfOneCataloguePreview();
  }

  appendClassicScript(CORE_CDN_URL)
    .catch(() => loadCoreFromRawFallback())
    .then(() => {
      installLivePreviewPerformanceFix();
      installStaticCataloguePreviewFix();
      window.__DDS_PERFORMANCE_BUILD_READY__ = true;
    })
    .catch((error) => {
      console.error(
        "[DEEP DEEP SLEEP] โหลด script.js ไม่สำเร็จ",
        error
      );

      const toastText = document.querySelector(
        "#siteToastText"
      );
      const toast = document.querySelector("#siteToast");

      if (toastText && toast) {
        toastText.textContent =
          "โหลดระบบแก้ไขโค้ดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ";
        toast.classList.add("is-visible");
      }
    });
})();
