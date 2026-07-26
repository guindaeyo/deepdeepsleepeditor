"use strict";

/*
 * DEEP DEEP SLEEP CODE SHOP
 * LIVE PREVIEW + COMMISSION, ACTIVITY & MY OWN CODE BUILD
 *
 * ไฟล์นี้ใช้แทน script.js เดิมได้ทันที
 * - โหลดระบบเว็บไซต์เดิมจาก commit ที่ล็อกเวอร์ชันไว้
 * - จากนั้นติดตั้งตัวแก้ LIVE PREVIEW ให้ซูม/ขยับรูปได้ลื่นขึ้น
 * - เพิ่มหน้า COMMISSION & ACTIVITY พร้อมแท็บ ACTIVITY
 * - เพิ่ม MY OWN CODE เป็นผลงานลำดับที่ 3 แบบดูอย่างเดียว ไม่มีหน้าแก้ไข
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

  function installCommissionActivityLayout() {
    if (window.__DDS_COMMISSION_ACTIVITY_INSTALLED__) {
      return;
    }

    const commissionPanel = document.querySelector(
      '[data-panel="commission"]'
    );

    if (!commissionPanel) {
      return;
    }

    window.__DDS_COMMISSION_ACTIVITY_INSTALLED__ = true;

    const homeDescription = document.querySelector(
      ".dds-home-description"
    );

    if (homeDescription) {
      homeDescription.textContent =
        "คลังโค้ดสำหรับตกแต่งโรลเพลย์ โปรไฟล์ รีวิว งานคอมมิชชั่น และโค้ดจากกิจกรรม";
    }

    const homeCommissionButton = document.querySelector(
      '.dds-home-buttons [data-go="commission"]'
    );

    if (homeCommissionButton) {
      homeCommissionButton.textContent =
        "COMMISSION & ACTIVITY";
    }

    const commissionNavText = document.querySelector(
      '.dds-nav-button[data-page="commission"] .dds-nav-text'
    );

    if (commissionNavText) {
      commissionNavText.innerHTML =
        "<small>CUSTOM / EVENT</small>COMMISSION &amp; ACTIVITY";
    }

    const pageEyebrow = commissionPanel.querySelector(
      ".dds-page-intro .dds-eyebrow"
    );
    const pageHeading = commissionPanel.querySelector(
      ".dds-page-intro h1"
    );

    if (pageEyebrow) {
      pageEyebrow.textContent = "CUSTOM & EVENT WORK";
    }

    if (pageHeading) {
      pageHeading.textContent = "COMMISSION & ACTIVITY";
    }

    const contactBox = commissionPanel.querySelector(
      ".dds-commission-contact-box"
    );
    const commissionGrid = commissionPanel.querySelector(
      ".dds-commission-grid"
    );

    if (!contactBox || !commissionGrid) {
      return;
    }

    const tabs = document.createElement("div");
    tabs.className = "dds-work-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute(
      "aria-label",
      "เลือกดูผลงานคอมมิชชั่นหรือกิจกรรม"
    );
    tabs.innerHTML = `
      <button
        class="dds-work-tab is-active"
        type="button"
        role="tab"
        aria-selected="true"
        data-work-tab="commission"
      >
        <small>01</small>
        <span>COMMISSION</span>
      </button>
      <button
        class="dds-work-tab"
        type="button"
        role="tab"
        aria-selected="false"
        data-work-tab="activity"
      >
        <small>02</small>
        <span>ACTIVITY</span>
      </button>
    `;

    const commissionWorkPanel = document.createElement("div");
    commissionWorkPanel.className =
      "dds-work-panel is-active";
    commissionWorkPanel.dataset.workPanel = "commission";

    const commissionSectionHeading =
      document.createElement("div");
    commissionSectionHeading.className =
      "dds-work-section-heading";
    commissionSectionHeading.innerHTML = `
      <div>
        <p>CLIENT WORK ARCHIVE</p>
        <h2>COMMISSION</h2>
      </div>
    `;

    contactBox.before(tabs);
    commissionWorkPanel.append(
      commissionSectionHeading,
      contactBox,
      commissionGrid
    );
    tabs.after(commissionWorkPanel);

    const activityWorkPanel = document.createElement("div");
    activityWorkPanel.className = "dds-work-panel";
    activityWorkPanel.dataset.workPanel = "activity";
    activityWorkPanel.hidden = true;
    activityWorkPanel.innerHTML = `
      <div class="dds-work-section-heading">
        <div>
          <p>EVENT CODE ARCHIVE</p>
          <h2>ACTIVITY</h2>
        </div>
      </div>

      <div class="dds-activity-empty">
        <span class="dds-activity-empty-index">ACTIVITY / READY</span>
        <div class="dds-activity-empty-mark">✦</div>
        <h3>ACTIVITY CODE ARCHIVE</h3>
        <p>
          พื้นที่นี้เตรียมไว้สำหรับเพิ่มโค้ดจากกิจกรรม
          เมื่อมีผลงานใหม่สามารถนำการ์ดและหน้าพรีวิวมาใส่ต่อได้ทันที
        </p>
        <small>NO ACTIVITY WORK ADDED YET</small>
      </div>
    `;
    commissionWorkPanel.after(activityWorkPanel);

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-work-tab]");

      if (!button) {
        return;
      }

      const selectedTab = button.dataset.workTab;

      tabs.querySelectorAll("[data-work-tab]").forEach(
        (tabButton) => {
          const isSelected =
            tabButton.dataset.workTab === selectedTab;

          tabButton.classList.toggle(
            "is-active",
            isSelected
          );
          tabButton.setAttribute(
            "aria-selected",
            String(isSelected)
          );
        }
      );

      commissionPanel
        .querySelectorAll("[data-work-panel]")
        .forEach((workPanel) => {
          const isSelected =
            workPanel.dataset.workPanel === selectedTab;

          workPanel.hidden = !isSelected;
          workPanel.classList.toggle(
            "is-active",
            isSelected
          );
        });
    });

    const style = document.createElement("style");
    style.id = "ddsCommissionActivityStyles";
    style.textContent = `
      .dds-nav-button[data-page="commission"] .dds-nav-text {
        max-width: 142px;
        font-size: 10px;
        line-height: 1.35;
        letter-spacing: 0.045em;
      }

      .dds-work-tabs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 30px 0 38px;
        padding: 6px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
      }

      .dds-work-tab {
        min-height: 62px;
        padding: 11px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        border: 1px solid transparent;
        background: transparent;
        color: rgba(255, 255, 255, 0.42);
        font: inherit;
        cursor: pointer;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          color 0.2s ease;
      }

      .dds-work-tab small {
        color: rgba(255, 255, 255, 0.24);
        font-size: 9px;
        letter-spacing: 0.16em;
      }

      .dds-work-tab span {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.13em;
      }

      .dds-work-tab:hover,
      .dds-work-tab.is-active {
        border-color: rgba(169, 14, 25, 0.56);
        background: rgba(123, 8, 16, 0.16);
        color: #ffffff;
      }

      .dds-work-tab.is-active small {
        color: var(--dds-red-bright, #b31520);
      }

      .dds-work-panel[hidden] {
        display: none !important;
      }

      .dds-work-section-heading {
        margin: 0 0 22px;
        padding: 0 0 15px;
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .dds-work-section-heading p {
        margin: 0 0 5px;
        color: var(--dds-red-bright, #b31520);
        font-size: 8px;
        font-weight: 600;
        letter-spacing: 0.2em;
      }

      .dds-work-section-heading h2 {
        margin: 0;
        color: #ffffff;
        font-size: clamp(24px, 3vw, 38px);
        font-weight: 500;
        line-height: 1;
        letter-spacing: -0.03em;
      }

      .dds-work-section-heading > span {
        max-width: 330px;
        color: rgba(255, 255, 255, 0.36);
        font-size: 11px;
        line-height: 1.7;
        text-align: right;
      }

      .dds-activity-empty {
        min-height: 330px;
        padding: clamp(34px, 6vw, 68px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background:
          radial-gradient(
            circle at 50% 20%,
            rgba(142, 10, 20, 0.17),
            transparent 40%
          ),
          rgba(255, 255, 255, 0.02);
        text-align: center;
      }

      .dds-activity-empty::before,
      .dds-activity-empty::after {
        content: "";
        width: 140px;
        height: 1px;
        position: absolute;
        background: rgba(255, 255, 255, 0.08);
      }

      .dds-activity-empty::before {
        top: 22px;
        left: -36px;
        transform: rotate(-35deg);
      }

      .dds-activity-empty::after {
        right: -36px;
        bottom: 22px;
        transform: rotate(-35deg);
      }

      .dds-activity-empty-index {
        margin-bottom: 24px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 8px;
        font-weight: 600;
        letter-spacing: 0.22em;
      }

      .dds-activity-empty-mark {
        margin-bottom: 18px;
        color: var(--dds-red-bright, #b31520);
        font-size: 28px;
        line-height: 1;
      }

      .dds-activity-empty h3 {
        margin: 0;
        color: #ffffff;
        font-size: clamp(24px, 4vw, 46px);
        font-weight: 500;
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .dds-activity-empty p {
        max-width: 560px;
        margin: 20px auto 0;
        color: rgba(255, 255, 255, 0.48);
        font-size: 12px;
        line-height: 1.85;
      }

      .dds-activity-empty small {
        margin-top: 28px;
        color: rgba(255, 255, 255, 0.22);
        font-size: 8px;
        letter-spacing: 0.18em;
      }

      @media (max-width: 700px) {
        .dds-work-tabs {
          margin-top: 22px;
        }

        .dds-work-tab {
          min-height: 56px;
          padding: 10px 12px;
        }

        .dds-work-tab span {
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .dds-work-section-heading {
          align-items: flex-start;
          flex-direction: column;
        }

        .dds-work-section-heading > span {
          max-width: none;
          text-align: left;
        }

        .dds-activity-empty {
          min-height: 290px;
          padding: 38px 22px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function installMyOwnCodeCommission() {
    if (window.__DDS_MY_OWN_CODE_INSTALLED__) {
      return;
    }

    const commissionGrid = document.querySelector(
      ".dds-commission-grid"
    );
    const footer = document.querySelector(
      ".dds-footer"
    );

    if (!commissionGrid || !footer) {
      return;
    }

    window.__DDS_MY_OWN_CODE_INSTALLED__ = true;

    const stylesheetUrl =
      "https://guindaeyo.github.io/css/prof-frkl.-css";

    const myOwnCodeMarkup = String.raw`<div class="myyouth-wrap" style="--myyouth-bg: #f7f7f9;--myyouth-red: #d71920;--myyouth-red-dark: #a80d13;--myyouth-main-img: url('https://i.pinimg.com/736x/e8/0d/2c/e80d2c1cd2699b51c4618f7987c41bc5.jpg');--myyouth-main-y: 45%;--myyouth-right-img: url('https://i.pinimg.com/736x/61/4c/a7/614ca7170e3172d3cf153c81e8d88041.jpg');--myyouth-right-y: 50%;--myyouth-left-img: url('https://i.pinimg.com/1200x/48/dd/16/48dd16899cc51c9a3211a91dcd37ddb3.jpg');--myyouth-left-y: 48%;--myyouth-object-img: url('https://iili.io/CNMzVl2.png');--myyouth-object-left: 65%;--myyouth-object-top: 40%;--myyouth-object-width: 100%;--myyouth-object-height: 88%;--myyouth-object-scale: 1.3;--myyouth-object-rotate: -20deg;"><div class="myyouth-page"><div class="myyouth-browser"><div class="myyouth-browser-left"><span class="myyouth-sidebar-icon"></span><span class="myyouth-browser-arrow">‹</span><span class="myyouth-browser-arrow">›</span><span class="myyouth-shield">◐</span></div><div class="myyouth-address"><span class="myyouth-lock">▣</span><span>i can smell that hot blood just under your skin</span><span class="myyouth-refresh">↻</span></div><div class="myyouth-browser-right"><span>◉</span><span>⇧</span><span>＋</span><span>▦</span></div></div><div class="myyouth-heading"><div class="myyouth-pixel-title"><span>Franklin D.</span><span class="myyouth-pixel-title-red"><br>Bloodworth</span></div><div class="myyouth-title-glitch myyouth-title-glitch-one"></div><div class="myyouth-title-glitch myyouth-title-glitch-two"></div><div class="myyouth-title-glitch myyouth-title-glitch-three"></div></div><div class="myyouth-star myyouth-star-top"></div><div class="myyouth-star myyouth-star-left"></div><div class="myyouth-main-photo"></div><div class="myyouth-bubble myyouth-bubble-white">I love you okay?</div><div class="myyouth-bubble myyouth-bubble-red">You’re really lovely too</div><div class="myyouth-window myyouth-window-right"><div class="myyouth-window-bar"><div class="myyouth-window-buttons"><i></i><i></i><i></i></div><div class="myyouth-window-icons"><span>◉</span><span>⌕</span><span>⌂</span><span>□</span></div></div><div class="myyouth-right-photo"></div><div class="myyouth-right-caption"><strong>Sorry, I’m an anti-romantic</strong><br>I want to run away, far away<br>My heart is already chasing you<br>In a small fire</div></div><div class="myyouth-folder-row"><div class="myyouth-folder-item"><div class="myyouth-folder myyouth-folder-gray"><span></span></div><p>fresh.blood_1</p></div><div class="myyouth-folder-item"><div class="myyouth-folder myyouth-folder-red"><span></span></div><p>fresh.blood_2</p></div></div><div class="myyouth-alert"><div class="myyouth-alert-bar"><div class="myyouth-window-buttons"><i></i><i></i><i></i></div></div><div class="myyouth-alert-content"><div class="myyouth-warning-icon"><span>!</span></div><div class="myyouth-alert-text"><strong>“App” is not optimized for your Mac</strong><p>This app needs to be updated by its developer to<br>improve compatibility.</p></div></div><div class="myyouth-alert-actions"><button type="button">Learn More...</button><button type="button" class="myyouth-alert-ok">OK</button></div></div><div class="myyouth-window myyouth-window-left"><div class="myyouth-window-bar"><div class="myyouth-window-buttons"><i></i><i></i><i></i></div><div class="myyouth-window-icons"><span>◉</span><span>⌕</span><span>⌂</span><span>□</span></div></div><div class="myyouth-left-photo"></div></div><div class="myyouth-lyrics">I know<br>Sweet love song<br>The words of the promise<br>When you turn around<br>You end up being someone unfamiliar</div><div class="myyouth-object-area"><div class="myyouth-red-blob"></div><div class="myyouth-object-png"></div><div class="myyouth-bottom-title">franklin</div></div></div></div>`;

    const previewOnlyCss = `
      <style data-my-own-code-preview-only>
        html,
        body {
          width: 1040px !important;
          min-width: 1040px !important;
          max-width: 1040px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        body {
          position: relative !important;
        }

        .dds-preview-shell,
        .dds-preview-target,
        .dds-card-preview-shell,
        .dds-card-preview-target,
        .dds-commission-preview-content {
          width: 1040px !important;
          min-width: 1040px !important;
          max-width: 1040px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
          transform: none !important;
        }

        .dds-commission-preview-content > .myyouth-wrap {
          margin-left: auto !important;
          margin-right: auto !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
        }
      </style>
    `;

    const previewMarkup =
      previewOnlyCss +
      `<div class="dds-commission-preview-content">${myOwnCodeMarkup}</div>`;

    function buildFallbackPreviewDocument(markup) {
      return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="${stylesheetUrl}" rel="stylesheet">
<style>
  html, body { margin: 0; min-height: 100%; background: #242424; }
  body { padding: 0; overflow: hidden; }
  .dds-preview-shell,
  .dds-card-preview-shell {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .dds-preview-target,
  .dds-card-preview-target {
    flex: 0 0 auto;
    transform-origin: top center;
  }
</style>
</head>
<body>
  <div class="dds-preview-shell">
    <div class="dds-preview-target">${markup}</div>
  </div>
</body>
</html>`;
    }

    function buildPreviewDocument(isFullView) {
      const builder = isFullView
        ? window.buildEditorPreviewDocument
        : window.buildCardPreviewDocument;

      if (typeof builder === "function") {
        return builder(
          [stylesheetUrl],
          previewMarkup
        );
      }

      return buildFallbackPreviewDocument(
        previewMarkup
      );
    }

    const card = document.createElement("article");
    card.className =
      "dds-roleplay-card dds-commission-card dds-my-own-code-card";
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="1040"
          id="commissionCardPreview003"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่าง MY OWN CODE — Franklin D. Bloodworth"
        ></iframe>
        <span class="dds-roleplay-preview-badge">PRIVATE</span>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">MY OWN CODE</h2>
        <p class="dds-commission-card-type">โค้ดประเภทประวัติตัวละคร</p>
        <p class="dds-commission-card-client">
          สถานะ <strong>PRIVATE</strong>
        </p>
        <button
          class="dds-roleplay-edit"
          data-view-my-own-code="commission003"
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    commissionGrid.appendChild(card);

    const viewPanel = document.createElement("section");
    viewPanel.className =
      "dds-panel dds-commission-view-panel dds-my-own-code-view-panel";
    viewPanel.dataset.panel =
      "editor-commission003-my-own-code";
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า COMMISSION"
          class="dds-back-button"
          data-my-own-code-back
          title="กลับหน้า COMMISSION"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="commissionPreviewStage003"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="1040"
          id="commissionPreview003"
          scrolling="no"
          title="MY OWN CODE — Franklin D. Bloodworth"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector(
      "#commissionCardPreview003"
    );
    const fullIframe = viewPanel.querySelector(
      "#commissionPreview003"
    );
    const viewButton = card.querySelector(
      "[data-view-my-own-code]"
    );
    const backButton = viewPanel.querySelector(
      "[data-my-own-code-back]"
    );

    let cardRendered = false;
    let fullRendered = false;

    function measureCanvasHeight(iframe) {
      const previewDocument =
        iframe?.contentDocument;

      if (!previewDocument) {
        return 0;
      }

      const root = previewDocument.querySelector(
        ".myyouth-wrap"
      );
      const content = previewDocument.querySelector(
        ".dds-commission-preview-content"
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect =
        content.getBoundingClientRect();

      return Math.max(
        1,
        Math.ceil(
          Math.max(
            rootRect.height,
            contentRect.height,
            root.offsetHeight,
            root.scrollHeight,
            content.offsetHeight,
            content.scrollHeight,
            previewDocument.body.scrollHeight,
            previewDocument.documentElement.scrollHeight
          )
        )
      );
    }

    function resizePreview(iframe) {
      if (!iframe) {
        return;
      }

      const stage = iframe.closest(
        ".dds-commission-preview-stage, .dds-roleplay-card-preview"
      );

      if (!stage || stage.clientWidth < 20) {
        return;
      }

      const canvasWidth = 1040;
      const measuredHeight =
        measureCanvasHeight(iframe);
      const previousHeight = Number(
        iframe.dataset.commissionMeasuredHeight || 0
      ) || 0;
      const canvasHeight = Math.max(
        1,
        measuredHeight || previousHeight || 800
      );

      iframe.dataset.commissionMeasuredHeight =
        String(canvasHeight);
      iframe.style.width = `${canvasWidth}px`;
      iframe.style.minWidth = `${canvasWidth}px`;
      iframe.style.maxWidth = `${canvasWidth}px`;
      iframe.style.height = `${canvasHeight}px`;
      iframe.style.minHeight = `${canvasHeight}px`;
      iframe.style.maxHeight = `${canvasHeight}px`;
      iframe.style.setProperty(
        "--dds-commission-canvas-height",
        `${canvasHeight}px`
      );

      const isFullView = iframe.classList.contains(
        "dds-commission-view-frame"
      );

      if (isFullView) {
        const scale = Math.max(
          0.01,
          Math.min(
            1,
            stage.clientWidth / canvasWidth
          )
        );
        const scaledHeight = Math.ceil(
          canvasHeight * scale
        );

        iframe.style.setProperty(
          "--dds-commission-canvas-scale",
          String(scale)
        );
        stage.style.setProperty(
          "--dds-commission-stage-height",
          `${scaledHeight}px`
        );
        return;
      }

      if (stage.clientHeight < 20) {
        return;
      }

      const padding = 18;
      const scale = Math.max(
        0.01,
        Math.min(
          1,
          (stage.clientWidth - padding) /
            canvasWidth,
          (stage.clientHeight - padding) /
            canvasHeight
        )
      );

      iframe.style.setProperty(
        "--dds-commission-canvas-scale",
        String(scale)
      );
    }

    function scheduleResize(iframe) {
      const run = () => resizePreview(iframe);

      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });

      [80, 180, 420, 850, 1500, 2400].forEach(
        (delay) => {
          window.setTimeout(run, delay);
        }
      );
    }

    function watchAssets(iframe) {
      const previewDocument =
        iframe.contentDocument;

      if (!previewDocument) {
        return;
      }

      previewDocument
        .querySelectorAll("img")
        .forEach((image) => {
          if (!image.complete) {
            image.addEventListener(
              "load",
              () => scheduleResize(iframe),
              { once: true }
            );
            image.addEventListener(
              "error",
              () => scheduleResize(iframe),
              { once: true }
            );
          }
        });

      if (previewDocument.fonts?.ready) {
        previewDocument.fonts.ready.then(() => {
          scheduleResize(iframe);
        });
      }
    }

    function renderPreview(iframe, isFullView) {
      if (!iframe) {
        return;
      }

      iframe.addEventListener(
        "load",
        () => {
          watchAssets(iframe);
          scheduleResize(iframe);
        },
        { once: true }
      );
      iframe.srcdoc = buildPreviewDocument(
        isFullView
      );
    }

    function ensureCardPreview() {
      if (cardRendered) {
        scheduleResize(cardIframe);
        return;
      }

      cardRendered = true;
      renderPreview(cardIframe, false);
    }

    function ensureFullPreview() {
      if (fullRendered) {
        scheduleResize(fullIframe);
        return;
      }

      fullRendered = true;
      renderPreview(fullIframe, true);
    }

    function closeCustomViewState() {
      viewPanel.classList.remove("is-active");
    }

    function openCustomView() {
      ensureFullPreview();

      document.body.classList.add(
        "dds-editor-mode"
      );
      document
        .querySelectorAll("[data-panel]")
        .forEach((panel) => {
          panel.classList.toggle(
            "is-active",
            panel === viewPanel
          );
        });

      document
        .querySelectorAll("[data-page]")
        .forEach((button) => {
          const active =
            button.dataset.page === "commission";

          button.classList.toggle(
            "is-active",
            active
          );
          button.setAttribute(
            "aria-current",
            active ? "page" : "false"
          );
        });

      const pageNumber = document.querySelector(
        "#currentPageNumber"
      );

      if (pageNumber) {
        pageNumber.textContent = "04";
      }

      document.title =
        "― www. deep deep sleep code shop .com ―";
      history.replaceState(
        null,
        "",
        "#commission"
      );
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      scheduleResize(fullIframe);
    }

    viewButton.addEventListener(
      "click",
      openCustomView
    );

    backButton.addEventListener("click", () => {
      closeCustomViewState();

      if (typeof window.openPage === "function") {
        window.openPage("commission");
      } else {
        document.body.classList.remove(
          "dds-editor-mode"
        );
        document
          .querySelectorAll("[data-panel]")
          .forEach((panel) => {
            panel.classList.toggle(
              "is-active",
              panel.dataset.panel === "commission"
            );
          });
      }

      ensureCardPreview();
    });

    document
      .querySelectorAll(
        '[data-page="commission"], [data-go="commission"]'
      )
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeCustomViewState();
          requestAnimationFrame(
            ensureCardPreview
          );
        });
      });

    document
      .querySelectorAll("[data-page], [data-go]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            if (!button.matches(
              '[data-page="commission"], [data-go="commission"]'
            )) {
              closeCustomViewState();
            }
          },
          true
        );
      });

    window.addEventListener(
      "hashchange",
      closeCustomViewState
    );
    window.addEventListener("resize", () => {
      if (cardRendered) {
        scheduleResize(cardIframe);
      }
      if (fullRendered) {
        scheduleResize(fullIframe);
      }
    });

    const customStyle =
      document.createElement("style");
    customStyle.id = "ddsMyOwnCodeStyles";
    customStyle.textContent = `
      .dds-my-own-code-card
      .dds-roleplay-preview-badge {
        color: #ffffff;
        background: rgba(118, 8, 16, 0.92);
      }

      .dds-my-own-code-card
      .dds-commission-card-client strong {
        color: rgba(255, 255, 255, 0.74);
      }
    `;
    document.head.appendChild(customStyle);

    const commissionPanel = document.querySelector(
      '[data-panel="commission"]'
    );

    if (commissionPanel?.classList.contains("is-active")) {
      ensureCardPreview();
    }
  }


  appendClassicScript(CORE_CDN_URL)
    .catch(() => loadCoreFromRawFallback())
    .then(() => {
      installLivePreviewPerformanceFix();
      installCommissionActivityLayout();
      installMyOwnCodeCommission();
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
