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

  appendClassicScript(CORE_CDN_URL)
    .catch(() => loadCoreFromRawFallback())
    .then(() => {
      installLivePreviewPerformanceFix();
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
