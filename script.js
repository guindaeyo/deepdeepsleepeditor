"use strict";

/*
 * DEEP DEEP SLEEP CODE SHOP — STABLE LOCAL PATCH
 * Core โหลดแบบ script tag ปกติใน index.html
 * ไม่มี fetch, Blob, eval หรือ dynamic JavaScript loader
 */

(() => {
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
        <span>COMMISSION &amp; SHOWCASE</span>
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
        <h2>COMMISSION &amp; SHOWCASE</h2>
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


  function installActivityTopMovies() {
    if (window.__DDS_ACTIVITY_TOP_MOVIES_INSTALLED__) {
      return;
    }

    const activityPanel = document.querySelector(
      '[data-work-panel="activity"]'
    );
    const footer = document.querySelector(
      ".dds-footer"
    );

    if (!activityPanel || !footer) {
      return;
    }

    window.__DDS_ACTIVITY_TOP_MOVIES_INSTALLED__ = true;

    const stylesheetUrls = [
      "https://guindaeyo.github.io/css/activizz01.css",
      "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&family=Herr+Von+Muellerhoff&family=Playfair+Display:wght@500;700;900&display=swap"
    ];
    const canvasWidth = 1040;
    const rootSelector = ".ativfzr-movies";

    const activityMarkup = String.raw`<div class="ativfzr-movies"><section class="ativfzr-hero"><div class="ativfzr-title">MY TOP</div><div class="ativfzr-sub">xxx movies</div><div class="ativfzr-burst"><span>05</span></div><span class="ativfzr-dot l"></span><span class="ativfzr-dot r"></span><div class="ativfzr-search"><span class="ativfzr-bar"></span></div><div class="ativfzr-tv-bg"><img src="https://i.pinimg.com/originals/b5/7b/7c/b57b7c724a4cb609d5f40a83f7a9e1b3.gif" alt=""></div><div class="ativfzr-tv"><img src="https://s13.gifyu.com/images/b70mu.png" alt=""></div><div class="ativfzr-arrow l">‹</div><div class="ativfzr-arrow r">›</div><div class="ativfzr-name">รายละเอียดกิจกรรม</div></section><section class="ativfzr-list"><section class="ativfzr-info"><p>ถึงเวลาของคอหนังที่จะได้เปิดลิสต์ภาพยนตร์เรื่องโปรดในใจออกมาอวดกันแล้ว! ไม่ว่าจะเป็นหนังสยองขวัญที่ทำให้นอนไม่หลับ หนังรักที่ดูทีไรก็ใจเจ็บ หรือหนังแอคชั่นสุดมันส์ที่ดูวนได้ไม่มีเบื่อ</p><p><strong>— ภาพยนตร์ทุกเรื่องล้วนมีเหตุผลที่ทำให้เราตกหลุมรักมัน</strong></p><p>ร่วมสนุกไปกับกิจกรรม MY TOP 5 MOVIES กิจกรรมจัดอันดับภาพยนตร์ตามหมวดหมู่ประจำวัน ที่จะพาทุกคนมาพูดคุย แชร์รสนิยม บางทีคุณอาจได้เจอคนรสนิยมเหมือนกัน หรือค้นพบหนังเรื่องใหม่จากลิสต์ของคนอื่นก็ได้ &#127871;✨</p><div class="ativfzr-info-tag">กติกา</div><ul><li>ในแต่ละวัน ทีมงานจะประกาศ<strong>หมวดภาพยนตร์</strong>ประจำวัน</li><li>ใช้<strong>โค้ดกิจกรรม</strong>เท่านั้นในการโพสต์</li><li>1 คน สามารถส่งได้เพียง 1 ครั้ง ต่อ 1 โจทย์</li><li>สามารถใส่คำอธิบายหรือเหตุผลเพิ่มเติมได้ตามอิสระ</li><li>ตัวอย่างเช่น: หนังสยองขวัญ / หนังโรแมนติก / หนังแอนิเมชัน</li><li>ผู้เล่นต้องจัดอันดับ<strong>ภาพยนตร์ 5 เรื่องโปรด</strong>ของตัวเองในหมวดนั้น</li><li>เมื่อโพสต์ครบตามกติกา จะได้รับทันที 10 ดอลล่าร์ ต่อ 1 โจทย์</li><li>หากเข้าร่วมครบทั้ง 7 วัน จะได้รับรวมทั้งหมด 70 ดอลล่าร์</li><li>เมื่อเข้าร่วมโจทย์ครบ 5 ครั้งได้รับ 1 คริสตัล</li></ul><div class="ativfzr-info-tag">กรณีโพสต์ย้อนหลัง</div><p>หากไม่สามารถมาร่วมกิจกรรมภายในวันนั้นได้ ยังสามารถโพสต์ย้อนหลังได้ภายหลัง แต่จะได้รับรางวัลลดลงเหลือ</p><ul><li>5 ดอลล่าร์ ต่อ 1 โจทย์ย้อนหลัง</li></ul><h2>ถ้าพร้อมแล้วก็มาเริ่มจัดอันดับกันเล้ยยยย!</h2></section><div class="ativfzr-bottom-wrap"><div class="ativfzr-check"></div></div></section></div>`;

    const previewOnlyCss = `
      <style data-activity-preview-only>
        html,
        body {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
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
        .dds-activity-preview-content {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        .dds-activity-preview-content > .ativfzr-movies {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 auto !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          overflow: visible !important;
        }
      </style>
    `;

    const previewMarkup =
      `${previewOnlyCss}<div class="dds-activity-preview-content">${activityMarkup}</div>`;

    function buildFallbackPreviewDocument(markup) {
      const stylesheetLinks = stylesheetUrls
        .map((url) => `<link href="${url}" rel="stylesheet">`)
        .join("\n");

      return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${stylesheetLinks}
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
          stylesheetUrls,
          previewMarkup
        );
      }

      return buildFallbackPreviewDocument(
        previewMarkup
      );
    }

    activityPanel
      .querySelector(".dds-activity-empty")
      ?.remove();

    let activityGrid = activityPanel.querySelector(
      ".dds-activity-grid"
    );

    if (!activityGrid) {
      activityGrid = document.createElement("div");
      activityGrid.className =
        "dds-commission-grid dds-activity-grid";
      activityPanel.appendChild(activityGrid);
    }

    if (!document.getElementById("ddsActivityShowcaseStyles")) {
      const activityShowcaseStyle = document.createElement("style");
      activityShowcaseStyle.id = "ddsActivityShowcaseStyles";
      activityShowcaseStyle.textContent = `
        .dds-activity-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          align-items: start;
          gap: 22px !important;
        }

        .dds-activity-grid > .dds-commission-card {
          width: 100%;
          min-width: 0;
          margin: 0;
        }

        .dds-activity-top-movies-view-panel
          .dds-commission-preview-stage {
          width: 100%;
          min-height: 1px;
          height: var(--dds-commission-stage-height, auto);
          overflow: hidden;
        }

        .dds-activity-top-movies-view-panel
          .dds-commission-view-frame {
          width: 1040px !important;
          min-width: 1040px !important;
          max-width: 1040px !important;
          height: var(--dds-commission-canvas-height, 1px) !important;
          transform: scale(var(--dds-commission-canvas-scale, 1));
          transform-origin: top center;
        }

        @media (max-width: 760px) {
          .dds-activity-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 16px !important;
          }
        }
      `;
      document.head.appendChild(activityShowcaseStyle);
    }

    const card = document.createElement("article");
    card.className =
      "dds-roleplay-card dds-commission-card dds-activity-top-movies-card";
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="activityTopMoviesCardPreview"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่างโค้ดกิจกรรม MY TOP 5 MOVIES"
        ></iframe>
        <span class="dds-roleplay-preview-badge">ACTIVITY</span>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">MY TOP 5 MOVIES</h2>
        <p class="dds-commission-card-type">โค้ดกิจกรรม</p>
        <button
          class="dds-roleplay-edit"
          data-view-activity-top-movies
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    activityGrid.appendChild(card);

    const viewPanel = document.createElement("section");
    viewPanel.className =
      "dds-panel dds-commission-view-panel dds-activity-top-movies-view-panel";
    viewPanel.dataset.panel =
      "view-activity-top-movies";
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า ACTIVITY"
          class="dds-back-button"
          data-activity-top-movies-back
          title="กลับหน้า ACTIVITY"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="activityTopMoviesPreviewStage"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="activityTopMoviesPreview"
          scrolling="no"
          title="โค้ดกิจกรรม MY TOP 5 MOVIES"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector(
      "#activityTopMoviesCardPreview"
    );
    const fullIframe = viewPanel.querySelector(
      "#activityTopMoviesPreview"
    );
    const viewButton = card.querySelector(
      "[data-view-activity-top-movies]"
    );
    const backButton = viewPanel.querySelector(
      "[data-activity-top-movies-back]"
    );

    let cardRendered = false;
    let fullRendered = false;

    function measureCanvasHeight(iframe) {
      const previewDocument = iframe?.contentDocument;

      if (!previewDocument) {
        return 0;
      }

      const root = previewDocument.querySelector(
        rootSelector
      );
      const content = previewDocument.querySelector(
        ".dds-activity-preview-content"
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

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

      if (!stage) {
        return;
      }

      const canvasHeight = measureCanvasHeight(iframe);

      if (!canvasHeight) {
        return;
      }

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
          (stage.clientWidth - padding) / canvasWidth,
          (stage.clientHeight - padding) / canvasHeight
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

    function watchPreview(iframe) {
      const previewDocument = iframe.contentDocument;

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
          watchPreview(iframe);
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

    function activateActivityTab() {
      const commissionPanel = document.querySelector(
        '[data-panel="commission"]'
      );

      if (!commissionPanel) {
        return;
      }

      commissionPanel
        .querySelectorAll("[data-work-tab]")
        .forEach((tabButton) => {
          const selected =
            tabButton.dataset.workTab === "activity";

          tabButton.classList.toggle(
            "is-active",
            selected
          );
          tabButton.setAttribute(
            "aria-selected",
            String(selected)
          );
        });

      commissionPanel
        .querySelectorAll("[data-work-panel]")
        .forEach((workPanel) => {
          const selected =
            workPanel.dataset.workPanel === "activity";

          workPanel.hidden = !selected;
          workPanel.classList.toggle(
            "is-active",
            selected
          );
        });
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

      activateActivityTab();
      ensureCardPreview();
    });

    const activityTab = document.querySelector(
      '[data-work-tab="activity"]'
    );

    activityTab?.addEventListener("click", () => {
      requestAnimationFrame(ensureCardPreview);
    });

    document
      .querySelectorAll(
        '[data-page="commission"], [data-go="commission"]'
      )
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeCustomViewState();

          requestAnimationFrame(() => {
            if (!activityPanel.hidden) {
              ensureCardPreview();
            }
          });
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

    if (
      document
        .querySelector('[data-panel="commission"]')
        ?.classList.contains("is-active") &&
      !activityPanel.hidden
    ) {
      ensureCardPreview();
    }
  }

  function installActivityTopMoviesReply() {
    if (window.__DDS_ACTIVITY_TOP_MOVIES_REPLY_INSTALLED__) {
      return;
    }

    const activityPanel = document.querySelector(
      '[data-work-panel="activity"]'
    );
    const footer = document.querySelector(
      ".dds-footer"
    );

    if (!activityPanel || !footer) {
      return;
    }

    window.__DDS_ACTIVITY_TOP_MOVIES_REPLY_INSTALLED__ = true;

    const stylesheetUrls = [
      "https://guindaeyo.github.io/css/activizz01.css",
      "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700&family=Herr+Von+Muellerhoff&family=Playfair+Display:wght@500;700;900&display=swap"
    ];
    const canvasWidth = 1040;
    const rootSelector = ".ativfzr-movies";

    const activityMarkup = String.raw`<div class="ativfzr-movies"><section class="ativfzr-hero"><div class="ativfzr-title">MY TOP</div><div class="ativfzr-sub">xxx movies</div><div class="ativfzr-burst"><span>05</span></div><span class="ativfzr-dot l"></span><span class="ativfzr-dot r"></span><div class="ativfzr-search"><span class="ativfzr-bar"></span></div><div class="ativfzr-tv-bg"><img src="https://i.pinimg.com/736x/d7/9c/bf/d79cbfa03c3f06013dffa7d4e61e2b6f.jpg" alt=""></div><div class="ativfzr-tv"><img src="https://s13.gifyu.com/images/b70mu.png" alt=""></div><div class="ativfzr-arrow l">‹</div><div class="ativfzr-arrow r">›</div><div class="ativfzr-name">Franklin D. Bloodworth</div></section><section class="ativfzr-list"><div class="ativfzr-label">THE FILMS :</div><div class="ativfzr-main"><img class="ativfzr-poster" src="https://connect.bu.ac.th/wp-content/uploads/2022/11/Movie-Beautiful.png" alt="Er rer เอ๋อเหรอ"><div class="ativfzr-maintext"><span class="ativfzr-no">01.</span><span class="ativfzr-film-title">Er rer <span style="font-size:1.2em"><strong>เอ๋อเหรอ</strong></span></span><div class="ativfzr-desc">เป็นหนังที่อยากเอาเข้าลิสต์มาก ๆ แต่น่าเสียดายที่ไม่ได้มีหมวดดราม่า ส่วนนึงเพราะกลัวว่าคนจะดูน้อย เลยไม่ได้เข้ามาเล่น และมีอีกหลายหมวดที่ไม่ได้เอามาเพราะคนจัดไม่ค่อยดู ไม่รู้จะเอาเรื่องอะไรมาใส่ 55555555 เลยคิดว่าหลาย ๆ คนน่าจะมีเรื่องที่อยากเอามาแชร์แต่ไม่ได้เอามาลงเลย เลยกลายเป็นโจทย์นี้ขึ้นมา<br><br>ที่เอาเรื่องนี้มาลงเพราะชอบไดนามิกของความสัมพันธ์พ่อกับต๋องมาก มันน่ารักจริง ๆ ร้องไห้ด้วย นี่เอ็นดูต๋องทั้งเรื่อง รู้สึกดีใจมากที่ข้าง ๆ ต๋องมีลูกแก้ว ไม่งั้นก็แย่เหมือนกัน</div><div class="ativfzr-rate-big">rate : ★★★★★</div></div></div><div class="ativfzr-grid"><div class="ativfzr-card"><img src="https://m.media-amazon.com/images/M/MV5BZDI0Y2FiMzgtMzkxNC00ODdmLTk0NWEtZDMwNjdmZGE2M2ZkXkEyXkFqcGc@._V1_QL75_UX327_.jpg" alt="La La Land"><h3 class="ativfzr-title-1">02.<span>La La Land</span></h3><p class="ativfzr-text-1">ดูกี่ครั้งก็ร้องไห้ทุกครั้ง ความสัมพันธ์ของคนสองคนที่ไม่ได้ไปต่อ ความสัมพันธ์ที่จบลงด้วยการแยกทาง เติบโตแล้วไปใช้ชีวิตของตัวเอง แม้ว่าจะกลับมาเจอกันอีกครั้งทุกอย่างก็ยังคงสวยงามเสมอเมื่อมองย้อนกลับไป ฮือ ๆๆ</p><span class="ativfzr-rate ativfzr-rate-1">rate : ★★★★★</span></div><div class="ativfzr-card"><img src="https://www.khaosod.co.th/wpapp/uploads/2022/02/A.gif" alt="One for the Road วันสุดท้าย…ก่อนบายเธอ"><h3 class="ativfzr-title-2">03.<span>One for the Road วันสุดท้าย…ก่อนบายเธอ</span></h3><p class="ativfzr-text-2">โหห ทุกคนในเรื่องเล่นโคตรรรรรดี ช่วงนั้นหลายคนไม่ชอบเพราะมันจบไม่แฮปปี้ แต่ในขณะที่นี่ชอบมากกก หนังโคตรเป็นมนุษย์ มันดูจะเป็นชีวิตคนสุด ๆ แล้ว มันไม่มีใครดีไปทั้งหมด เลวไปทั้งหมดหรอก สุดท้ายคนเรามันก็เทา ๆ แบบนี้นี่แหละ โคตรสนุกเลยไปดูเถอะ</p><span class="ativfzr-rate ativfzr-rate-2">rate : ★★★★★</span></div><div class="ativfzr-card"><img src="https://lh5.googleusercontent.com/-TOkdMnaqSGE/TYm-ABi_NBI/AAAAAAABfH4/KkcF4UsXWls/s1600/SuckSeed0023.jpg" alt="Suck Seed ห่วยขั้นเทพ"><h3 class="ativfzr-title-3">04.<span>Suck Seed ห่วยขั้นเทพ</span></h3><p class="ativfzr-text-3">เป็นหนังที่ทำให้นี่ไปซื้อกีต้าร์ไฟฟ้า ไปเรียนกีต้าร์ แต่ตอนนี้ก็เล่นไม่เป็นเหมือนเดิม อืม แต่ขัดใจคุ้ง ลบ 2 แต้ม<br><br>ชีวิตต้องลองซัก Seed หนึ่ง<br>มันต้องมีดีซัก Seed หนึ่ง<br>ถึงแม้มันยังจะห่วย ชีวิตบรมห่วย<br>ถึงแม้มันยังจะซวย เราก็ซวยไปด้วยกัน<br>...อ้างอิง <a href="https://www.siamzone.com/music/thailyric/8225" target="_blank" rel="noopener noreferrer">Siamzone</a></p><span class="ativfzr-rate ativfzr-rate-3">rate : ★★★</span></div></div><div class="ativfzr-five"><div><h3>05.<br>Loveaholic โคตรรักเอ็งเลย</h3><p>หนังดีมาก ดีแบบมาก ๆๆๆ เสียดายมากที่เราไม่ค่อยได้เจอหนังแบบนี้อีกแล้ว ดูไปร้องไห้ไปจริง ๆ ทุกคน มันแบบ ง้ากกอะ อยากให้ลุงพิงแกกลับมาทำหน้งอะไรแบบนี้อีกเหมือนกันนะ ดำเนินเรื่องโคตรดีเลย เพลง<a href="https://www.youtube.com/watch?v=mNtAAzflYhQ" target="_blank" rel="noopener noreferrer">เขียนถึงคนบนฟ้า</a>ก็ดี ลองกดไปฟังดู ;อีโมจิร้องไห้น่าเกลียด;</p><span class="ativfzr-rate ativfzr-rate-4">rate : ★★★★★</span></div><img src="https://storage.googleapis.com/sahamongkolfilm-media/2020/06/Loveaholic-Still05.jpg" alt="Loveaholic โคตรรักเอ็งเลย"></div><div class="ativfzr-bottom-wrap"><div class="ativfzr-check"></div><div class="ativfzr-bottom-no">07</div></div></section></div>`;

    const previewOnlyCss = `
      <style data-activity-preview-only>
        html,
        body {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
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
        .dds-activity-preview-content {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        .dds-activity-preview-content > .ativfzr-movies {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 auto !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          overflow: visible !important;
        }
      </style>
    `;

    const previewMarkup =
      `${previewOnlyCss}<div class="dds-activity-preview-content">${activityMarkup}</div>`;

    function buildFallbackPreviewDocument(markup) {
      const stylesheetLinks = stylesheetUrls
        .map((url) => `<link href="${url}" rel="stylesheet">`)
        .join("\n");

      return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${stylesheetLinks}
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
          stylesheetUrls,
          previewMarkup
        );
      }

      return buildFallbackPreviewDocument(
        previewMarkup
      );
    }

    let activityGrid = activityPanel.querySelector(
      ".dds-activity-grid"
    );

    if (!activityGrid) {
      activityGrid = document.createElement("div");
      activityGrid.className =
        "dds-commission-grid dds-activity-grid";
      activityPanel.appendChild(activityGrid);
    }

    const card = document.createElement("article");
    card.className =
      "dds-roleplay-card dds-commission-card dds-activity-top-movies-reply-card";
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="activityTopMoviesReplyCardPreview"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่างโค้ดกิจกรรม MY TOP 5 MOVIES แบบตอบกลับ"
        ></iframe>
        <span class="dds-roleplay-preview-badge">ACTIVITY</span>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">MY TOP 5 MOVIES</h2>
        <p class="dds-commission-card-type">โค้ดกิจกรรม - แบบตอบกลับ</p>
        <button
          class="dds-roleplay-edit"
          data-view-activity-top-movies-reply
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    activityGrid.appendChild(card);

    const viewPanel = document.createElement("section");
    viewPanel.className =
      "dds-panel dds-commission-view-panel dds-activity-top-movies-view-panel dds-activity-top-movies-reply-view-panel";
    viewPanel.dataset.panel =
      "view-activity-top-movies-reply";
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า ACTIVITY"
          class="dds-back-button"
          data-activity-top-movies-reply-back
          title="กลับหน้า ACTIVITY"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="activityTopMoviesReplyPreviewStage"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="activityTopMoviesReplyPreview"
          scrolling="no"
          title="โค้ดกิจกรรม MY TOP 5 MOVIES แบบตอบกลับ"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector(
      "#activityTopMoviesReplyCardPreview"
    );
    const fullIframe = viewPanel.querySelector(
      "#activityTopMoviesReplyPreview"
    );
    const viewButton = card.querySelector(
      "[data-view-activity-top-movies-reply]"
    );
    const backButton = viewPanel.querySelector(
      "[data-activity-top-movies-reply-back]"
    );

    let cardRendered = false;
    let fullRendered = false;

    function measureCanvasHeight(iframe) {
      const previewDocument = iframe?.contentDocument;

      if (!previewDocument) {
        return 0;
      }

      const root = previewDocument.querySelector(
        rootSelector
      );
      const content = previewDocument.querySelector(
        ".dds-activity-preview-content"
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

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

      if (!stage) {
        return;
      }

      const canvasHeight = measureCanvasHeight(iframe);

      if (!canvasHeight) {
        return;
      }

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
          (stage.clientWidth - padding) / canvasWidth,
          (stage.clientHeight - padding) / canvasHeight
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

    function watchPreview(iframe) {
      const previewDocument = iframe.contentDocument;

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
          watchPreview(iframe);
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

      document
        .querySelector('[data-work-tab="activity"]')
        ?.click();
      ensureCardPreview();
    });

    const activityTab = document.querySelector(
      '[data-work-tab="activity"]'
    );

    activityTab?.addEventListener("click", () => {
      requestAnimationFrame(ensureCardPreview);
    });

    document
      .querySelectorAll(
        '[data-page="commission"], [data-go="commission"]'
      )
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeCustomViewState();

          requestAnimationFrame(() => {
            if (!activityPanel.hidden) {
              ensureCardPreview();
            }
          });
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

    if (
      document
        .querySelector('[data-panel="commission"]')
        ?.classList.contains("is-active") &&
      !activityPanel.hidden
    ) {
      ensureCardPreview();
    }
  }


  function installCommissionThreeHouse() {
    if (window.__DDS_COMMISSION_003_INSTALLED__) {
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

    window.__DDS_COMMISSION_003_INSTALLED__ = true;

    const stylesheetUrl =
      "https://guindaeyo.github.io/css/code-friedfs.css";
    const canvasWidth = 1040;
    const rootSelector = ".frdh-wrap";

    const commissionMarkup003 = String.raw`<div class="frdh-wrap" style="--frdh-hero:url('https://iili.io/C03vyut.png');--frdh-hero-pos:center 80%; --frdh-room-1:url('https://iili.io/C03vDap.png'); --frdh-room-1-pos:center 50%; --frdh-room-2:url('https://iili.io/C03vtFR.png'); --frdh-room-2-pos:center 50%; --frdh-room-3:url('https://iili.io/C03vQ6v.png'); --frdh-room-3-pos:center 50%; --frdh-room-4:url('https://iili.io/C03vsna.png'); --frdh-room-4-pos:center 50%; --frdh-room-5:url('https://iili.io/C03v4u1.png'); --frdh-room-5-pos:center 50%; --frdh-room-6:url('https://iili.io/C03vgyP.png'); --frdh-room-6-pos:center 50%; --frdh-room-7:url('https://iili.io/C03vU8B.png'); --frdh-room-7-pos:center 50%; --frdh-room-8:url('https://iili.io/C03vSaV.png'); --frdh-room-8-pos:center 50%; --frdh-person-1:url('https://i.pinimg.com/736x/bb/59/97/bb5997aa65a553ebdfb8f74308af1be1.jpg'); --frdh-person-1-pos:center 30%; --frdh-person-2:url('https://iili.io/C03vOCb.jpg'); --frdh-person-2-pos:center 30%; --frdh-person-3:url('https://iili.io/C03vk6x.jpg');--frdh-person-3-pos:center 30%;"><div class="frdh-hero"><div class="frdh-hero-shade"></div><div class="frdh-hero-top"><div class="frdh-monogram">F</div><div class="frdh-hero-label">House of Peace</div></div><div class="frdh-hero-title"><div class="frdh-hero-small">WELCOME TO</div><div class="frdh-name">Friedenheim</div><div class="frdh-hero-thai">(น.) บ้านแห่งความสงบ</div></div></div><div class="frdh-intro"><div class="frdh-intro-heading"><div class="frdh-number">01</div><div class="frdh-heading-small">ABOUT THE HOUSE</div><div class="frdh-heading-main">Friedenheim</div><div class="frdh-heading-line"></div><div class="frdh-house-tags"><span>Modern</span><span>Nordic</span><span>Classic</span><span>Nature</span></div></div><div class="frdh-intro-text"><p>บ้านกึ่งสตูดิโอสไตล์ยุโรปร่วมสมัยที่ผสมผสานเข้ากับรูปทรงเรียบง่ายของสถาปัตยกรรมนอร์ดิก โดดเด่นด้วยหลังคาทรงจั่วสูง ปล่องไฟอิฐ และกระจกขนาดใหญ่ที่ช่วยรับแสงธรรมชาติและเชื่อมพื้นที่ภายในกับสวนภายนอก วัสดุหลักทำจากผนังอิฐแดงโชว์แนว ให้ความรู้สึกอบอุ่นและแข็งแรง หลังคากระเบื้องสีเทาเข้มที่เสริมภาพลักษณ์เรียบหรู </p><p>กรอบประตูและหน้าต่างอะลูมิเนียมสีดำพร้อมกระจกเต็มบานเพื่อเพิ่มความโปร่งสบาย และงานไม้ธรรมชาติบริเวณชายคาและฝ้าเพดานภายนอก พื้นที่ทางเดินและเฉลียงใช้คอนกรีตสีอ่อนให้ความเรียบสะอาดตา เป็นบ้านที่ผสมผสานความคลาสสิก ความทันสมัย และความอบอุ่นของธรรมชาติได้อย่างลงตัว</p></div></div><div class="frdh-features"><div class="frdh-feature"><div class="frdh-feature-icon">♪</div><div><strong>The Pianist</strong><span>Vampire</span></div></div><div class="frdh-feature"><div class="frdh-feature-icon">⚘</div><div><strong>The Primrose</strong><span>Vampire</span></div></div><div class="frdh-feature"><div class="frdh-feature-icon">☾</div><div><strong>The Chosen</strong><span>Werewolf</span></div></div></div><div class="frdh-section"><div class="frdh-section-head"><div><div class="frdh-section-number">02</div><div class="frdh-section-small">ROOM DIRECTORY</div><div class="frdh-section-title">พื้นที่ภายในบ้าน</div></div><div class="frdh-section-note">กดที่รูปเพื่อเปิดอ่านรายละเอียดของแต่ละห้อง</div></div><div class="frdh-room-grid"><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-1"></div><div class="frdh-room-caption"><span>01</span><div><strong>Studio</strong><small>สตูดิโอ</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Studio</div><p>สตูดิโอส่วนตัวสำหรับทำเพลงของมิคาเอล ครบครันด้วยอุปกรณ์ทำเพลง เครื่องดนตรี และห้องอัดเสียงขนาดย่อม</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-2"></div><div class="frdh-room-caption"><span>02</span><div><strong>Workshop area</strong><small>พื้นที่เวิร์กช็อป</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Workshop area</div><p>พื้นที่เวิร์กช็อปกว้างขวางที่มีอุปกรณ์มากมายให้เลือกสรร สำหรับรองรับเหล่าสหายของเจ้าของบ้านที่ต้องการรังสรรค์ผลงานหลากหลายแขนง</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-3"></div><div class="frdh-room-caption"><span>03</span><div><strong>Livingroom</strong><small>ห้องนั่งเล่น</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Livingroom</div><p>ห้องนั่งเล่นขนาดกะทัดรัดที่ใช้รับแขกไปในตัว ตกแต่งโทนสีน้ำตาล ประดับพันธุ์ไม้สวยงาม ผนังติดกระจกบานเลื่อนสูงจรดศีรษะทั้งสองด้านเพื่อให้รู้สึกโปร่งสบาย สามารถเปิดไปยังพื้นที่สีเขียวรอบบ้านได้</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-4"></div><div class="frdh-room-caption"><span>04</span><div><strong>Bathroom</strong><small>ห้องน้ำส่วนกลาง</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Bathroom</div><p>ห้องน้ำส่วนกลาง ประกอบไปด้วยอ่างล้างหน้าสองอ่าง โถสุขภัณฑ์ และอ่างอาบน้ำขนาดกลาง</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-5"></div><div class="frdh-room-caption"><span>05</span><div><strong>Kitchen</strong><small>ห้องครัว</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Kitchen</div><p>ห้องครัวขนาดพอดี มีเคาน์เตอร์ครัว เตาอบ และอุปกรณ์ทำอาหารครบครัน พร้อมด้วยโต๊ะทานอาหารกลางห้องและเก้าอี้กลมทรงสูง</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-6"></div><div class="frdh-room-caption"><span>06</span><div><strong>Master Bedroom</strong><small>ห้องนอนใหญ่</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Master Bedroom</div><p>ห้องนอนส่วนตัวของเจ้าของบ้านอย่างมิคาเอลและลิลิธผู้เป็นภรรยา ตกแต่งด้วยโทนสีน้ำตาลอบอุ่น มีเตียงคิงไซส์ตั้งชิดผนังฝั่งหนึ่งของห้อง มุมนั่งเล่นริมหน้าต่างกระจกสูงซึ่งมองเห็นต้นไม้ใหญ่ในสวน นอกจากนี้ยังมีห้องน้ำในตัวที่กั้นโซนเปียกและโซนแห้งอย่างชัดเจน</p></div></details><details class="frdh-room"> <summary class="frdh-room-summary"> <div class="frdh-room-photo frdh-room-photo-7"></div><div class="frdh-room-caption"><span>07</span><div><strong>Ferist's Room</strong><small>ห้องนอนของเฟริช</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Ferist's Room</div><p>ห้องนอนขนาดกลางของเฟริชที่ตกแต่งอย่างเรียบหรู ประดับไม้สวยงามที่มุมหนึ่งของห้อง พร้อมมุมอ่านหนังสือเล็ก ๆ และเตียงควีนไซส์ขนาดพอดี มองเห็นมุมสระว่ายน้ำในสวนของบ้านผ่านหน้าต่างขนาดใหญ่</p></div></details><details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-8"></div><div class="frdh-room-caption"><span>08</span><div><strong>Backyard</strong><small>สวนหลังบ้าน</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">Backyard</div><p>สวนหลังบ้านที่มีทั้งมุมต้นไม้ใหญ่ร่มรื่น เฉลียงซึ่งเป็นพื้นที่ทานอาหารและนั่งเล่นด้านนอก คอร์ตเทนนิส และสระว่ายน้ำขนาดย่อม ทางเดินในสวนปูด้วยกระเบื้องสีเทาสว่างรับกับเฉลียงของบ้าน</p></div></details></div></div><div class="frdh-resident-section"><div class="frdh-resident-head"><div class="frdh-section-number frdh-section-number-light">03</div><div class="frdh-section-small frdh-section-small-light">CURRENT RESIDENTS</div><div class="frdh-resident-title">ผู้อาศัยภายในบ้าน</div></div><div class="frdh-resident-grid"><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-1"></div><div class="frdh-person-info"><div class="frdh-person-no">RESIDENT 01</div><div class="frdh-person-name">Mikael F. Kaiser</div></div></div><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-2"></div><div class="frdh-person-info"><div class="frdh-person-no">RESIDENT 02</div><div class="frdh-person-name">Lilith P. Kaiser</div></div></div><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-3"></div><div class="frdh-person-info"><div class="frdh-person-no">RESIDENT 03</div><div class="frdh-person-name">Ferist F. Spencer</div></div></div></div></div><div class="frdh-footer"><div class="frdh-footer-mark">F</div><div><strong>Friedenheim</strong><span>อนุญาตให้โรลเพลย์ได้เฉพาะผู้อาศัยและคนที่ได้รับอนุญาตจากผู้อาศัยเท่านั้น</span></div><div class="frdh-footer-line"></div></div></div>`;

    const previewOnlyCss = `
      <style data-commission-preview-only>
        html,
        body {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
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
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
          transform: none !important;
        }

        .dds-commission-preview-content > ${rootSelector} {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 auto !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          overflow: visible !important;
        }
      </style>
    `;

    const previewMarkup =
      previewOnlyCss +
      `<div class="dds-commission-preview-content">${commissionMarkup003}</div>`;

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
      "dds-roleplay-card dds-commission-card dds-commission-three-card";
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="commissionCardPreview003"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่างงานคอมมิชชั่นโค้ดประเภทกระทู้บ้าน"
        ></iframe>
        <span class="dds-roleplay-preview-badge">COMPLETED</span>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">COMMISSION</h2>
        <p class="dds-commission-card-type">โค้ดประเภทกระทู้บ้าน</p>
        <p class="dds-commission-card-client">
          ผู้จ้าง <strong>MIKAEL F. KAISER</strong>
        </p>
        <button
          class="dds-roleplay-edit"
          data-view-commission-three
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    commissionGrid.appendChild(card);

    const viewPanel = document.createElement("section");
    viewPanel.className =
      "dds-panel dds-commission-view-panel dds-commission-three-view-panel";
    viewPanel.dataset.panel =
      "editor-commission003";
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า COMMISSION & SHOWCASE"
          class="dds-back-button"
          data-commission-three-back
          title="กลับหน้า COMMISSION & SHOWCASE"
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
          data-commission-canvas-width="${canvasWidth}"
          id="commissionPreview003"
          scrolling="no"
          title="งานคอมมิชชั่นโค้ดประเภทกระทู้บ้านของ Mikael F. Kaiser"
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
      "[data-view-commission-three]"
    );
    const backButton = viewPanel.querySelector(
      "[data-commission-three-back]"
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
        rootSelector
      );
      const content = previewDocument.querySelector(
        ".dds-commission-preview-content"
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

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

      const measuredHeight = measureCanvasHeight(iframe);
      const previousHeight = Number(
        iframe.dataset.commissionMeasuredHeight || 0
      ) || 0;
      const canvasHeight = Math.max(
        1,
        measuredHeight || previousHeight || 1200
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
          (stage.clientWidth - padding) / canvasWidth,
          (stage.clientHeight - padding) / canvasHeight
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

    function watchPreview(iframe) {
      const previewDocument = iframe.contentDocument;

      if (!previewDocument) {
        return;
      }

      previewDocument
        .querySelectorAll("details")
        .forEach((detailsElement) => {
          detailsElement.addEventListener(
            "toggle",
            () => scheduleResize(iframe)
          );
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
          watchPreview(iframe);
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

    const commissionPanel = document.querySelector(
      '[data-panel="commission"]'
    );

    if (commissionPanel?.classList.contains("is-active")) {
      ensureCardPreview();
    }
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
      "https://guindaeyo.github.io/css/prof-frkl.css";

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
          id="myOwnCodeCardPreview"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่างโค้ดประเภทโปรไฟล์ — Franklin D. Bloodworth"
        ></iframe>
              </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title" data-my-own-code-title>MY OWN CODE</h2>
        <p class="dds-commission-card-type" data-my-own-code-type>โค้ดประเภทโปรไฟล์</p>
        <button
          class="dds-roleplay-edit"
          data-view-my-own-code="my-own-code"
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
          aria-label="กลับหน้า COMMISSION & SHOWCASE"
          class="dds-back-button"
          data-my-own-code-back
          title="กลับหน้า COMMISSION & SHOWCASE"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="myOwnCodePreviewStage"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="1040"
          id="myOwnCodePreview"
          scrolling="no"
          title="โค้ดประเภทโปรไฟล์ — Franklin D. Bloodworth"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector(
      "#myOwnCodeCardPreview"
    );
    const fullIframe = viewPanel.querySelector(
      "#myOwnCodePreview"
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
      .dds-my-own-code-card [data-my-own-code-title] {
        display: block;
        order: 1;
      }

      .dds-my-own-code-card [data-my-own-code-type] {
        display: block;
        order: 2;
      }

      .dds-my-own-code-card
      .dds-roleplay-edit {
        order: 3;
      }

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


  function installMyOwnCodeHistory() {
    if (window.__DDS_MY_OWN_CODE_HISTORY_INSTALLED__) {
      return;
    }

    const commissionGrid = document.querySelector(
      '[data-work-panel="commission"] .dds-commission-grid'
    ) || document.querySelector('.dds-commission-grid');
    const footer = document.querySelector('.dds-footer');

    if (!commissionGrid || !footer) {
      return;
    }

    window.__DDS_MY_OWN_CODE_HISTORY_INSTALLED__ = true;

    const stylesheetUrls = [
      'https://guindaeyo.github.io/deepdshop/dddshop-pr01eiei.css'
    ];
    const canvasWidth = 1040;
    const rootSelector = '.profco01ddps-stage';

    const showcaseMarkup = String.raw`<section class="profco01ddps-stage"><div class="profco01ddps-board"><aside class="profco01ddps-left"><img src="https://iili.io/CTb913J.png" class="profco01ddps-main-img"></aside><main class="profco01ddps-right"><nav class="profco01ddps-nav"><span class="profco01ddps-navitem">access</span><span class="profco01ddps-navitem">updates</span><span class="profco01ddps-navitem">indications</span><span class="profco01ddps-navitem">recreation</span><span class="profco01ddps-lock">●<small>view</small></span></nav><section class="profco01ddps-card profco01ddps-post"><div class="profco01ddpspost-head"><div class="profco01ddpsprofile"><img src="https://i.pinimg.com/736x/0e/70/0a/0e700a9be59ba8e21e6cd54cb2803e16.jpg"><span>deadbutrich</span></div><span class="profco01ddpsdots">⋮</span><b>interactive</b></div><p><br><b>Character name :</b> Franklin Dominic Bloodworth (แฟรงคลิน โดมินิก บลัดเวิร์ธ) <br><b>Date of Birth :</b> 7 May 1995<br><b>Age :</b> 31 ปี (ร่างกายอายุ 25 ปี)<br><b>Race :</b> แวมไพร์<br><b>Personality :</b> แฟรงคลินเป็นชายหนุ่มรูปร่างสูงสง่า หน้าตาดี ทว่ากลับมีแววตาคม และท่าทีที่มักนิ่งเฉย ทำให้ผู้คนรอบตัวรู้สึกว่าเขาเป็นคนหยิ่งยโส ไม่ชอบเข้าหาใครก่อน เขาเป็นคนหัวขบถ มีความเชื่อมั่นในตัวเองสูงจนบางครั้งอาจถูกมองว่าหยิ่งหรือเข้าถึงยาก แต่หากได้รู้จักตัวตนของเขาจริง ๆ จะพบว่าเขามีมุมที่อ่อนโยน และจริงใจอยู่มากกว่าที่ใครหลายคนคิด หรือเปล่า?</p>
<div class="profco01ddpspost-actions"><button>post</button><span>♡</span></div><div class="profco01ddpspost-tabs"><a href="https://roleplayth.com/member.php?action=profile&uid=600" target="_blank" rel="noopener noreferrer">PROFILE</a><a href="https://discord.com/users/759838371001401364" target="_blank" rel="noopener noreferrer">DISCORD</a><a href="https://roleplayth.com/showthread.php?tid=4932" target="_blank" rel="noopener noreferrer">CODE SHOPS</a>
</div></section><section class="profco01ddps-card profco01ddps-info"><div class="profco01ddpsabout"><h2>ABOUT ME <span>Biography</span></h2><p>แฟรงคลินเกิดมาในตระกูลแชโบลที่มั่งคั่งของเกาหลี เติบโตท่ามกลางความสะดวกสบาย และการตามใจจากครอบครัว ทำให้เขาเป็นคนค่อนข้างเอาแต่ใจเล็กน้อย เขาย้ายไปศึกษาต่อที่สหรัฐอเมริกา และใช้ชีวิตอยู่ในสังคมชนชั้นสูง แต่เขากลับพบรักกับเพื่อนร่วมชั้นสมัยมัธยมปลายที่เกาหลีและพยายามฝ่าฟันอุปสรรคความรักจนได้อาศัยอยู่ด้วยกัน<br><br>โชคชะตาของแฟรงคลินเปลี่ยนไปตลอดกาลเมื่อเขาย้ายเข้าไปอยู่ในแมนชั่นหรูแห่งหนึ่ง โดยไม่เคยรู้มาก่อนว่าชายหนุ่มข้างห้องที่สนิทกันคือแวมไพร์ คืนนั้นแฟรงคลินได้ยินเสียงทะเลาะกันอย่างรุนแรงดังมาจากห้องข้าง ๆ จนพื้นสั่นสะเทือน ความหงุดหงิด และรำคาญทำให้เขาตัดสินใจจะเข้าไปห้ามปราม แต่กลับต้องเผชิญกับการโจมตีอย่างไม่ตั้งใจจากสิ่งที่เรียกกันว่านักล่าแวมไพร์<br><br>เพื่อนข้างห้องที่เป็นแวมไพร์ รู้สึกผิดอย่างยิ่งที่แฟรงคลินต้องพลอยเดือดร้อน จึงตัดสินใจเปลี่ยนแฟรงคลินให้กลายเป็นแวมไพร์เพื่อรักษาชีวิต และแนะนำให้เขาย้ายไปอาศัยอยู่ที่หมู่บ้านเอลิเชียน ซึ่งเป็นหมู่บ้านที่รวมตัวของสิ่งมีชีวิตเหนือธรรมชาติเพื่อปรับตัวเข้ากับชีวิตอมตะที่ไม่อาจหวนกลับไปเป็นเหมือนเดิมได้อีก และต้องจากคนรักของตนไปตลอดกาล เพราะไม่อยากให้อีกฝ่ายทนอยู่กับตนเองที่ไม่มีวันกลับไปเป็นเช่นเดิมได้อีก<br><br>แฟรงคลินตัดสินใจแยกทางกับคนรัก และมายังที่หมู่บ้านเอลิเชียนตามคำแนะนำของทวดที่เจอกันแบบงง ๆ แม้ยังมีความเย่อหยิ่ง ไม่ยอมให้ใครเข้าถึงตัวง่าย ๆ แต่แฟรงคลินก็กำลังเรียนรู้ที่จะใช้ชีวิตใหม่ในฐานะแวมไพร์ ทั้งในด้านพลังพิเศษ ความหิวกระหายอยู่เสมอ</p></div><div class="profco01ddpsgallery"><img src="https://i.pinimg.com/736x/42/ec/16/42ec16a5abf7c4b6522bba528c186f47.jpg"><img src="https://i.pinimg.com/736x/6b/1a/ba/6b1abaa182ebd3e1d1f014dda7ee18d1.jpg"></div></section><section class="profco01ddps-bottom lua-music"><div class="profco01ddpsmusic-cover"><img src="https://www.allkpop.com/upload/2025/11/content/091933/1762734818-132734965.jpg"></div><div class="profco01ddpsmusic-info"><div class="profco01ddpsmusic-top"><div><h3>Coma</h3><p>YEONJUN</p></div><a class="profco01ddpsmusic-play" href="https://www.youtube.com/watch?v=NgOO0NWe-o8" target="_blank" rel="noopener noreferrer">▶</a></div><div class="profco01ddpsmusic-line"><span>0:42</span><div class="profco01ddpsmusic-progress" style="--progress: 38%;">  <div></div></div><span>2:34</span></div></div></section></main></div></section>`;

    const previewOnlyCss = `
      <style data-my-own-code-history-preview-only>
        html,
        body {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
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
        .dds-my-own-code-history-preview-content {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
          transform: none !important;
        }

        .dds-my-own-code-history-preview-content > ${rootSelector} {
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
      `${previewOnlyCss}<div class="dds-my-own-code-history-preview-content">${showcaseMarkup}</div>`;

    function buildFallbackPreviewDocument(markup) {
      const stylesheetLinks = stylesheetUrls
        .map((url) => `<link href="${url}" rel="stylesheet">`)
        .join('\n');

      return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${stylesheetLinks}
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

      if (typeof builder === 'function') {
        return builder(stylesheetUrls, previewMarkup);
      }

      return buildFallbackPreviewDocument(previewMarkup);
    }

    const card = document.createElement('article');
    card.className =
      'dds-roleplay-card dds-commission-card dds-my-own-code-history-card';
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="myOwnCodeHistoryCardPreview"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่าง MY OWN CODE — โค้ดประเภทประวัติ"
        ></iframe>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">MY OWN CODE</h2>
        <p class="dds-commission-card-type">โค้ดประเภทประวัติ</p>
        <button
          class="dds-roleplay-edit"
          data-view-my-own-code-history
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    commissionGrid.appendChild(card);

    const viewPanel = document.createElement('section');
    viewPanel.className =
      'dds-panel dds-commission-view-panel dds-my-own-code-history-view-panel';
    viewPanel.dataset.panel = 'view-my-own-code-history';
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า COMMISSION & SHOWCASE"
          class="dds-back-button"
          data-my-own-code-history-back
          title="กลับหน้า COMMISSION & SHOWCASE"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="myOwnCodeHistoryPreviewStage"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="myOwnCodeHistoryPreview"
          scrolling="no"
          title="MY OWN CODE — โค้ดประเภทประวัติ"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector('#myOwnCodeHistoryCardPreview');
    const fullIframe = viewPanel.querySelector('#myOwnCodeHistoryPreview');
    const viewButton = card.querySelector('[data-view-my-own-code-history]');
    const backButton = viewPanel.querySelector('[data-my-own-code-history-back]');

    let cardRendered = false;
    let fullRendered = false;

    function measureCanvasHeight(iframe) {
      const previewDocument = iframe?.contentDocument;

      if (!previewDocument) {
        return 0;
      }

      const root = previewDocument.querySelector(rootSelector);
      const content = previewDocument.querySelector(
        '.dds-my-own-code-history-preview-content'
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

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
        '.dds-commission-preview-stage, .dds-roleplay-card-preview'
      );

      if (!stage || stage.clientWidth < 20) {
        return;
      }

      const measuredHeight = measureCanvasHeight(iframe);
      const previousHeight = Number(
        iframe.dataset.commissionMeasuredHeight || 0
      ) || 0;
      const canvasHeight = Math.max(
        1,
        measuredHeight || previousHeight || 800
      );

      iframe.dataset.commissionMeasuredHeight = String(canvasHeight);
      iframe.style.width = `${canvasWidth}px`;
      iframe.style.minWidth = `${canvasWidth}px`;
      iframe.style.maxWidth = `${canvasWidth}px`;
      iframe.style.height = `${canvasHeight}px`;
      iframe.style.minHeight = `${canvasHeight}px`;
      iframe.style.maxHeight = `${canvasHeight}px`;
      iframe.style.setProperty(
        '--dds-commission-canvas-height',
        `${canvasHeight}px`
      );

      const isFullView = iframe.classList.contains(
        'dds-commission-view-frame'
      );

      if (isFullView) {
        const scale = Math.max(
          0.01,
          Math.min(1, stage.clientWidth / canvasWidth)
        );
        const scaledHeight = Math.ceil(canvasHeight * scale);

        iframe.style.setProperty(
          '--dds-commission-canvas-scale',
          String(scale)
        );
        stage.style.setProperty(
          '--dds-commission-stage-height',
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
          (stage.clientWidth - padding) / canvasWidth,
          (stage.clientHeight - padding) / canvasHeight
        )
      );

      iframe.style.setProperty(
        '--dds-commission-canvas-scale',
        String(scale)
      );
    }

    function scheduleResize(iframe) {
      const run = () => resizePreview(iframe);

      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });

      [80, 180, 420, 850, 1500, 2400].forEach((delay) => {
        window.setTimeout(run, delay);
      });
    }

    function watchAssets(iframe) {
      const previewDocument = iframe.contentDocument;

      if (!previewDocument) {
        return;
      }

      previewDocument.querySelectorAll('img').forEach((image) => {
        if (!image.complete) {
          image.addEventListener(
            'load',
            () => scheduleResize(iframe),
            { once: true }
          );
          image.addEventListener(
            'error',
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
        'load',
        () => {
          watchAssets(iframe);
          scheduleResize(iframe);
        },
        { once: true }
      );
      iframe.srcdoc = buildPreviewDocument(isFullView);
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
      viewPanel.classList.remove('is-active');
    }

    function openCustomView() {
      ensureFullPreview();
      document.body.classList.add('dds-editor-mode');

      document.querySelectorAll('[data-panel]').forEach((panel) => {
        panel.classList.toggle('is-active', panel === viewPanel);
      });

      document.querySelectorAll('[data-page]').forEach((button) => {
        const active = button.dataset.page === 'commission';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
      });

      const pageNumber = document.querySelector('#currentPageNumber');
      if (pageNumber) {
        pageNumber.textContent = '04';
      }

      document.title = '― www. deep deep sleep code shop .com ―';
      history.replaceState(null, '', '#commission');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      scheduleResize(fullIframe);
    }

    viewButton?.addEventListener('click', openCustomView);

    backButton?.addEventListener('click', () => {
      closeCustomViewState();

      if (typeof window.openPage === 'function') {
        window.openPage('commission');
      } else {
        document.body.classList.remove('dds-editor-mode');
        document.querySelectorAll('[data-panel]').forEach((panel) => {
          panel.classList.toggle(
            'is-active',
            panel.dataset.panel === 'commission'
          );
        });
      }

      ensureCardPreview();
    });

    document
      .querySelectorAll('[data-page="commission"], [data-go="commission"]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          closeCustomViewState();
          requestAnimationFrame(ensureCardPreview);
        });
      });

    document.querySelectorAll('[data-page], [data-go]').forEach((button) => {
      button.addEventListener(
        'click',
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

    window.addEventListener('hashchange', closeCustomViewState);
    window.addEventListener('resize', () => {
      if (cardRendered) {
        scheduleResize(cardIframe);
      }
      if (fullRendered) {
        scheduleResize(fullIframe);
      }
    });

    const commissionPanel = document.querySelector(
      '[data-panel="commission"]'
    );

    if (commissionPanel?.classList.contains('is-active')) {
      ensureCardPreview();
    }
  }


  function installMyOwnCodeTopicHeader() {
    if (window.__DDS_MY_OWN_CODE_TOPIC_HEADER_INSTALLED__) {
      return;
    }

    const commissionGrid = document.querySelector(
      '[data-work-panel="commission"] .dds-commission-grid'
    ) || document.querySelector('.dds-commission-grid');
    const footer = document.querySelector('.dds-footer');

    if (!commissionGrid || !footer) {
      return;
    }

    window.__DDS_MY_OWN_CODE_TOPIC_HEADER_INSTALLED__ = true;

    const stylesheetUrls = [];
    const canvasWidth = 1040;
    const rootSelector = '.dds-my-own-code-topic-root';

    const showcaseMarkup = String.raw`<div class="dds-my-own-code-topic-root"><div style="display:flex;align-items:stretch;max-width:850px;margin:40px auto;background-color:#111111;box-shadow:0 15px 40px rgba(0,0,0,0.9);position:relative;font-family:'Georgia','Times New Roman',serif;"><div style="position:absolute;top:-15px;left:40px;background-color:#8b0000;color:#ffffff;padding:25px 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;writing-mode:vertical-rl;transform:rotate(180deg);box-shadow:0 5px 15px rgba(139,0,0,0.4);z-index:10;">Vampire</div><div style="width:50%;position:relative;"><img src="https://i.pinimg.com/originals/76/5d/be/765dbe87b96ca7539134ea1de147f21e.gif" style="width:100%;height:100%;object-fit:cover;display:block;" alt="Franklin D. Bloodworth"></div><div style="width:50%;padding:60px 40px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;background-color:#111111;"><div style="text-align:center;color:#666666;font-size:11px;letter-spacing:3px;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;margin-bottom:10px;">15 JUNE 2026</div><h2 style="text-align:center;color:#b71c1c;font-size:20px;font-weight:normal;letter-spacing:2px;margin:0 0 25px 0;text-transform:uppercase;border-bottom:1px solid #2b2b2b;padding-bottom:20px;">Obsidian Tower</h2><div style="color:#cccccc;font-size:20px;line-height:1.8;text-align:justify;"><div style="text-align:center;"><i>F</i>ranklin D. Bloodworth</div></div></div></div></div>`;

    const previewOnlyCss = `
      <style data-my-own-code-topic-preview-only>
        html,
        body {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #242424 !important;
        }

        body {
          position: relative !important;
        }

        .dds-preview-shell,
        .dds-preview-target,
        .dds-card-preview-shell,
        .dds-card-preview-target,
        .dds-my-own-code-topic-preview-content {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          overflow: visible !important;
          transform: none !important;
        }

        .dds-my-own-code-topic-root {
          width: ${canvasWidth}px !important;
          min-width: ${canvasWidth}px !important;
          max-width: ${canvasWidth}px !important;
          min-height: 1px !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
      </style>
    `;

    const previewMarkup =
      `${previewOnlyCss}<div class="dds-my-own-code-topic-preview-content">${showcaseMarkup}</div>`;

    function buildFallbackPreviewDocument(markup) {
      return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

      if (typeof builder === 'function') {
        return builder(stylesheetUrls, previewMarkup);
      }

      return buildFallbackPreviewDocument(previewMarkup);
    }

    const card = document.createElement('article');
    card.className =
      'dds-roleplay-card dds-commission-card dds-my-own-code-topic-card';
    card.innerHTML = `
      <div class="dds-roleplay-card-preview dds-roleplay-card-preview-live">
        <iframe
          aria-hidden="true"
          class="dds-roleplay-card-preview-frame dds-commission-card-preview-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="myOwnCodeTopicCardPreview"
          loading="lazy"
          scrolling="no"
          tabindex="-1"
          title="ตัวอย่าง MY OWN CODE — โค้ดประเภทหัวกระทู้"
        ></iframe>
      </div>

      <div class="dds-roleplay-card-body dds-commission-card-body">
        <h2 class="dds-commission-card-title">MY OWN CODE</h2>
        <p class="dds-commission-card-type">โค้ดประเภทหัวกระทู้</p>
        <button
          class="dds-roleplay-edit"
          data-view-my-own-code-topic
          type="button"
        >
          VIEW WORK <span>↗</span>
        </button>
      </div>
    `;
    commissionGrid.appendChild(card);

    const viewPanel = document.createElement('section');
    viewPanel.className =
      'dds-panel dds-commission-view-panel dds-my-own-code-topic-view-panel';
    viewPanel.dataset.panel = 'view-my-own-code-topic';
    viewPanel.innerHTML = `
      <div class="dds-commission-view-toolbar">
        <button
          aria-label="กลับหน้า COMMISSION & SHOWCASE"
          class="dds-back-button"
          data-my-own-code-topic-back
          title="กลับหน้า COMMISSION & SHOWCASE"
          type="button"
        >
          ←
        </button>
      </div>

      <div
        class="dds-commission-preview-stage"
        id="myOwnCodeTopicPreviewStage"
      >
        <iframe
          class="dds-editor-preview-frame dds-commission-view-frame"
          data-commission-canvas-height="auto"
          data-commission-canvas-width="${canvasWidth}"
          id="myOwnCodeTopicPreview"
          scrolling="no"
          title="MY OWN CODE — โค้ดประเภทหัวกระทู้"
        ></iframe>
      </div>
    `;
    footer.before(viewPanel);

    const cardIframe = card.querySelector('#myOwnCodeTopicCardPreview');
    const fullIframe = viewPanel.querySelector('#myOwnCodeTopicPreview');
    const viewButton = card.querySelector('[data-view-my-own-code-topic]');
    const backButton = viewPanel.querySelector('[data-my-own-code-topic-back]');

    let cardRendered = false;
    let fullRendered = false;

    function measureCanvasHeight(iframe) {
      const previewDocument = iframe?.contentDocument;

      if (!previewDocument) {
        return 0;
      }

      const root = previewDocument.querySelector(rootSelector);
      const content = previewDocument.querySelector(
        '.dds-my-own-code-topic-preview-content'
      );

      if (!root || !content) {
        return 0;
      }

      const rootRect = root.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      return Math.max(
        1,
        Math.ceil(
          Math.max(
            rootRect.bottom,
            contentRect.bottom,
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
        '.dds-commission-preview-stage, .dds-roleplay-card-preview'
      );

      if (!stage || stage.clientWidth < 20) {
        return;
      }

      const measuredHeight = measureCanvasHeight(iframe);
      const previousHeight = Number(
        iframe.dataset.commissionMeasuredHeight || 0
      ) || 0;
      const canvasHeight = Math.max(
        1,
        measuredHeight || previousHeight || 520
      );

      iframe.dataset.commissionMeasuredHeight = String(canvasHeight);
      iframe.style.width = `${canvasWidth}px`;
      iframe.style.minWidth = `${canvasWidth}px`;
      iframe.style.maxWidth = `${canvasWidth}px`;
      iframe.style.height = `${canvasHeight}px`;
      iframe.style.minHeight = `${canvasHeight}px`;
      iframe.style.maxHeight = `${canvasHeight}px`;
      iframe.style.setProperty(
        '--dds-commission-canvas-height',
        `${canvasHeight}px`
      );

      const isFullView = iframe.classList.contains(
        'dds-commission-view-frame'
      );

      if (isFullView) {
        const scale = Math.max(
          0.01,
          Math.min(1, stage.clientWidth / canvasWidth)
        );
        const scaledHeight = Math.ceil(canvasHeight * scale);

        iframe.style.setProperty(
          '--dds-commission-canvas-scale',
          String(scale)
        );
        stage.style.setProperty(
          '--dds-commission-stage-height',
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
          (stage.clientWidth - padding) / canvasWidth,
          (stage.clientHeight - padding) / canvasHeight
        )
      );

      iframe.style.setProperty(
        '--dds-commission-canvas-scale',
        String(scale)
      );
    }

    function scheduleResize(iframe) {
      const run = () => resizePreview(iframe);

      requestAnimationFrame(() => {
        requestAnimationFrame(run);
      });

      [80, 180, 420, 850, 1500, 2400].forEach((delay) => {
        window.setTimeout(run, delay);
      });
    }

    function watchAssets(iframe) {
      const previewDocument = iframe.contentDocument;

      if (!previewDocument) {
        return;
      }

      previewDocument.querySelectorAll('img').forEach((image) => {
        if (!image.complete) {
          image.addEventListener(
            'load',
            () => scheduleResize(iframe),
            { once: true }
          );
          image.addEventListener(
            'error',
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
        'load',
        () => {
          watchAssets(iframe);
          scheduleResize(iframe);
        },
        { once: true }
      );
      iframe.srcdoc = buildPreviewDocument(isFullView);
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
      viewPanel.classList.remove('is-active');
    }

    function openCustomView() {
      ensureFullPreview();
      document.body.classList.add('dds-editor-mode');

      document.querySelectorAll('[data-panel]').forEach((panel) => {
        panel.classList.toggle('is-active', panel === viewPanel);
      });

      document.querySelectorAll('[data-page]').forEach((button) => {
        const active = button.dataset.page === 'commission';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'page' : 'false');
      });

      const pageNumber = document.querySelector('#currentPageNumber');
      if (pageNumber) {
        pageNumber.textContent = '04';
      }

      document.title = '― www. deep deep sleep code shop .com ―';
      history.replaceState(null, '', '#commission');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      scheduleResize(fullIframe);
    }

    viewButton?.addEventListener('click', openCustomView);

    backButton?.addEventListener('click', () => {
      closeCustomViewState();

      if (typeof window.openPage === 'function') {
        window.openPage('commission');
      } else {
        document.body.classList.remove('dds-editor-mode');
        document.querySelectorAll('[data-panel]').forEach((panel) => {
          panel.classList.toggle(
            'is-active',
            panel.dataset.panel === 'commission'
          );
        });
      }

      ensureCardPreview();
    });

    document
      .querySelectorAll('[data-page="commission"], [data-go="commission"]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          closeCustomViewState();
          requestAnimationFrame(ensureCardPreview);
        });
      });

    document.querySelectorAll('[data-page], [data-go]').forEach((button) => {
      button.addEventListener(
        'click',
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

    window.addEventListener('hashchange', closeCustomViewState);
    window.addEventListener('resize', () => {
      if (cardRendered) {
        scheduleResize(cardIframe);
      }
      if (fullRendered) {
        scheduleResize(fullIframe);
      }
    });

    const commissionPanel = document.querySelector(
      '[data-panel="commission"]'
    );

    if (commissionPanel?.classList.contains('is-active')) {
      ensureCardPreview();
    }
  }


  function normalizeShowcaseCardLabels() {
    document
      .querySelectorAll(".dds-commission-card-title")
      .forEach((title) => {
        const label = title.textContent.trim();

        if (/^COMMISSION\s+\d+$/i.test(label)) {
          title.textContent = "COMMISSION";
        } else if (/^MY OWN CODE\s+\d+$/i.test(label)) {
          title.textContent = "MY OWN CODE";
        }
      });

    document
      .querySelectorAll(
        '.dds-commission-card iframe[title], .dds-commission-view-panel iframe[title]'
      )
      .forEach((iframe) => {
        const currentTitle = iframe.getAttribute("title") || "";
        const normalizedTitle = currentTitle
          .replace(/COMMISSION\s+\d+/gi, "COMMISSION")
          .replace(/MY OWN CODE\s+\d+/gi, "MY OWN CODE");

        if (normalizedTitle !== currentTitle) {
          iframe.setAttribute("title", normalizedTitle);
        }
      });
  }

  function installThreeColumnShowcaseGrids() {
    if (window.__DDS_THREE_COLUMN_SHOWCASE_GRIDS__) {
      return;
    }

    window.__DDS_THREE_COLUMN_SHOWCASE_GRIDS__ = true;

    const style = document.createElement('style');
    style.id = 'ddsThreeColumnShowcaseGridStyles';
    style.textContent = `
      [data-work-panel="commission"] > .dds-commission-grid,
      .dds-activity-grid {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        align-items: start !important;
        gap: 18px !important;
      }

      [data-work-panel="commission"] > .dds-commission-grid
        > .dds-commission-card,
      .dds-activity-grid > .dds-commission-card {
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }

      @media (max-width: 980px) {
        [data-work-panel="commission"] > .dds-commission-grid,
        .dds-activity-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 650px) {
        [data-work-panel="commission"] > .dds-commission-grid,
        .dds-activity-grid {
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }


  function installNewRulesWebsiteImageFix() {
    if (window.__DDS_NEW_RULES_WEBSITE_IMAGE_FIX__) {
      return;
    }

    window.__DDS_NEW_RULES_WEBSITE_IMAGE_FIX__ = true;

    const panel = document.querySelector(
      '[data-panel="editor-code006"]'
    );
    const generatedCode = document.querySelector(
      "#generatedNewRulesCode"
    );
    const bigAvatarX = document.querySelector(
      "#nrBigAvatarX"
    );
    const miniAvatarX = document.querySelector(
      "#nrMiniAvatarX"
    );
    const footerAvatarX = document.querySelector(
      "#nrFooterAvatarX"
    );
    const bigAvatarPositionBox =
      bigAvatarX?.closest(".dds-image-position");
    const miniAvatarPositionBox =
      miniAvatarX?.closest(".dds-image-position");
    const footerAvatarPositionBox =
      footerAvatarX?.closest(".dds-image-position");

    /*
     * รูปวงกลมใหญ่ รูปหน้าชื่อเว็บ และรูปวงกลมเล็กส่วนล่าง
     * เป็นรูปตกแต่งที่ให้เปลี่ยนเฉพาะ URL เท่านั้น
     */
    bigAvatarPositionBox?.remove();
    miniAvatarPositionBox?.remove();
    footerAvatarPositionBox?.remove();

    function stripLockedImageInlineStyles(source) {
      return String(source || "")
        .replace(
          /(<img\b[^>]*class=["'][^"']*\bbigav\b[^"']*["'][^>]*?)\s+style=["'][^"']*["']/gi,
          "$1"
        )
        .replace(
          /(<img\b[^>]*class=["'][^"']*\bbabiezfrn-miniav\b[^"']*["'][^>]*?)\s+style=["'][^"']*["']/gi,
          "$1"
        )
        .replace(
          /(<img\b[^>]*class=["'][^"']*\bfava\b[^"']*["'][^>]*?)\s+style=["'][^"']*["']/gi,
          "$1"
        );
    }

    /*
     * กรอง textarea ตั้งแต่ตอนระบบหลักเขียนค่า
     * ปุ่ม COPY CODE จึงคัดลอกโค้ดสะอาดทันที
     */
    if (
      generatedCode &&
      !generatedCode.dataset.ddsLockedAvatarSanitized
    ) {
      const valueDescriptor =
        Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        );

      if (valueDescriptor?.get && valueDescriptor?.set) {
        const currentValue =
          valueDescriptor.get.call(generatedCode);

        Object.defineProperty(generatedCode, "value", {
          configurable: true,
          enumerable: true,
          get() {
            return valueDescriptor.get.call(this);
          },
          set(nextValue) {
            valueDescriptor.set.call(
              this,
              stripLockedImageInlineStyles(nextValue)
            );
          }
        });

        generatedCode.dataset.ddsLockedAvatarSanitized =
          "true";
        generatedCode.value = currentValue;
      }
    }

    const previewIds = new Set([
      "newRulesPreview",
      "roleplayCardPreview006"
    ]);

    /*
     * กรอง srcdoc ก่อนเข้าระบบพรีวิว
     * จึงไม่เหลือ inline object-position / transform
     * บนรูปทั้งสามจุดในพรีวิวใหญ่และการ์ดหน้า FOR ROLEPLAY
     */
    if (
      typeof window.queuePreviewDocument === "function" &&
      !window.__DDS_NEW_RULES_QUEUE_WRAPPED__
    ) {
      window.__DDS_NEW_RULES_QUEUE_WRAPPED__ = true;
      const originalQueuePreviewDocument =
        window.queuePreviewDocument;

      window.queuePreviewDocument = function (
        iframe,
        srcdoc,
        resizeFunction
      ) {
        const nextSrcdoc =
          iframe && previewIds.has(iframe.id)
            ? stripLockedImageInlineStyles(srcdoc)
            : srcdoc;

        return originalQueuePreviewDocument.call(
          this,
          iframe,
          nextSrcdoc,
          resizeFunction
        );
      };
    }

    function cleanPreviewIframe(iframe) {
      if (!iframe) {
        return;
      }

      if (typeof window.getPreviewState === "function") {
        const state = window.getPreviewState(iframe);

        if (state?.pendingSrcdoc) {
          state.pendingSrcdoc =
            stripLockedImageInlineStyles(
              state.pendingSrcdoc
            );
        }

        if (state?.currentSrcdoc) {
          state.currentSrcdoc =
            stripLockedImageInlineStyles(
              state.currentSrcdoc
            );
        }
      }

      const lockedImages =
        iframe.contentDocument?.querySelectorAll(
          ".babiezfrn-float .bigav, .babiezfrn-miniav, .babiezfrn-foot .fava"
        );

      lockedImages?.forEach((image) => {
        image.removeAttribute("style");
      });
    }

    const previewIframes = Array.from(
      previewIds,
      (id) => document.getElementById(id)
    ).filter(Boolean);

    previewIframes.forEach((iframe) => {
      iframe.addEventListener("load", () => {
        cleanPreviewIframe(iframe);
      });

      cleanPreviewIframe(iframe);
    });

    function cleanNewRulesOutputAndPreview() {
      if (generatedCode) {
        generatedCode.value = generatedCode.value;
      }

      previewIframes.forEach(cleanPreviewIframe);
    }

    ["input", "change"].forEach((eventName) => {
      panel?.addEventListener(
        eventName,
        () => {
          window.setTimeout(
            cleanNewRulesOutputAndPreview,
            0
          );
        },
        true
      );
    });

    cleanNewRulesOutputAndPreview();
  }


  function installBlankEditorFormsAndBbcodeTools() {
    if (window.__DDS_BLANK_EDITOR_BBCODE_TOOLS__) {
      return;
    }

    window.__DDS_BLANK_EDITOR_BBCODE_TOOLS__ = true;

    const updaterByPanel = {
      "editor-code001": "updatePageOfOne",
      "editor-code002": "updateWeirdo",
      "editor-code003": "updateHihi",
      "editor-code004": "updateUuiaa",
      "editor-code005": "updateComma",
      "editor-code006": "updateNewRules",
      "editor-code007": "updateLoveSong",
      "editor-code008": "updateDumbDumber",
      "editor-code009": "updateHigherHeaven",
      "editor-code010": "updateLongWayLongRide",
      "editor-profile001": "updatePolaroidLove",
      "editor-profile002": "updateMoodboard",
      "editor-profile003": "updateFortyOne",
      "editor-profile004": "updateNothinBoutMe",
      "editor-review001": "updateFoodReview",
      "editor-review002": "updateMusicReview"
    };

    const editorPanelSelector = [
      '[data-panel^="editor-code"]',
      '[data-panel^="editor-profile"]',
      '[data-panel^="editor-review"]'
    ].join(',');

    const style = document.createElement("style");
    style.id = "ddsBlankEditorBbcodeStyles";
    style.textContent = `
      .dds-rich-editor:empty::before {
        content: attr(data-placeholder);
        color: rgba(255,255,255,.28);
        pointer-events: none;
      }

      .dds-rich-toolbar .dds-bbcode-button {
        min-width: 0;
        height: 34px;
        padding: 0 11px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.025);
        color: rgba(255,255,255,.78);
        font: 600 9px/1 Arial, sans-serif;
        letter-spacing: .7px;
        white-space: nowrap;
      }

      .dds-rich-toolbar .dds-bbcode-button:hover {
        border-color: rgba(169,14,24,.8);
        background: rgba(169,14,24,.14);
        color: #fff;
      }

    `;
    document.head.appendChild(style);

    function isArchiveCardIframe(iframe) {
      if (!iframe) {
        return false;
      }

      return Boolean(
        iframe.matches(
          '.dds-roleplay-card-preview-frame, .dds-profile-card-preview-frame, .dds-review-card-preview-frame, .dds-commission-card iframe'
        ) ||
        iframe.closest(
          '.dds-roleplay-card, .dds-profile-card, .dds-review-card, .dds-commission-card'
        )
      );
    }

    if (
      typeof window.queuePreviewDocument === "function" &&
      !window.__DDS_BLANK_EDITOR_QUEUE_WRAPPED__
    ) {
      window.__DDS_BLANK_EDITOR_QUEUE_WRAPPED__ = true;
      const originalQueuePreviewDocument =
        window.queuePreviewDocument;

      function safePreviewUrl(value) {
        const text = String(value || "").trim();

        if (/^(https?:)?\/\//i.test(text)) {
          return text;
        }

        return "";
      }

      function escapePreviewAttribute(value) {
        return String(value || "")
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }

      function renderListBlocks(source, ordered) {
        const tag = ordered ? "ol" : "ul";
        const pattern = ordered
          ? /\[list=1\]([\s\S]*?)\[\/list\]/gi
          : /\[list\](?!\s*=)([\s\S]*?)\[\/list\]/gi;

        return source.replace(pattern, (_, body) => {
          const items = String(body)
            .split(/\[\*\]/i)
            .slice(1)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => `<li>${item}</li>`)
            .join("");

          return items
            ? `<${tag} style="margin:12px 0;padding-left:24px;">${items}</${tag}>`
            : "";
        });
      }

      function renderBbcodeForPreview(source) {
        let output = String(source || "");

        output = renderListBlocks(output, true);
        output = renderListBlocks(output, false);

        output = output.replace(
          /\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi,
          (_, align, body) =>
            `<div style="text-align:${align};">${body}</div>`
        );

        output = output.replace(
          /\[(hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi,
          (_, type, body) =>
            `<details style="margin:10px 0;border:1px solid rgba(127,127,127,.28);padding:10px 12px;"><summary style="cursor:pointer;font-weight:700;">${type.toUpperCase()}</summary><div style="margin-top:10px;">${body}</div></details>`
        );

        output = output.replace(
          /\[video=youtube\]([\s\S]*?)\[\/video\]/gi,
          (_, url) => {
            const safeUrl = safePreviewUrl(url);
            return safeUrl
              ? `<a href="${escapePreviewAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">▶ YouTube video</a>`
              : "[video=youtube][/video]";
          }
        );

        output = output.replace(
          /\[img\]([\s\S]*?)\[\/img\]/gi,
          (_, url) => {
            const safeUrl = safePreviewUrl(url);
            return safeUrl
              ? `<img src="${escapePreviewAttribute(safeUrl)}" alt="" style="display:block;max-width:100%;height:auto;margin:12px auto;">`
              : "[img][/img]";
          }
        );

        output = output.replace(
          /\[url=([^\]]*)\]([\s\S]*?)\[\/url\]/gi,
          (_, url, label) => {
            const safeUrl = safePreviewUrl(url);
            return safeUrl
              ? `<a href="${escapePreviewAttribute(safeUrl)}" target="_blank" rel="noopener noreferrer">${label || safeUrl}</a>`
              : label;
          }
        );

        output = output
          .replace(/\[hr\]/gi, '<hr style="margin:18px 0;border:0;border-top:1px solid rgba(127,127,127,.35);">')
          .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
          .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
          .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
          .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");

        return output;
      }

      window.queuePreviewDocument = function (
        iframe,
        srcdoc,
        resizeFunction
      ) {
        if (
          window.__DDS_SUPPRESS_ARCHIVE_CARD_UPDATE__ &&
          isArchiveCardIframe(iframe)
        ) {
          return true;
        }

        return originalQueuePreviewDocument.call(
          this,
          iframe,
          renderBbcodeForPreview(srcdoc),
          resizeFunction
        );
      };
    }

    const bbcodeSelections = new WeakMap();

    function saveBbcodeSelection(editor) {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      if (editor.contains(range.commonAncestorContainer)) {
        bbcodeSelections.set(editor, range.cloneRange());
      }
    }

    function getEditorRange(editor) {
      const savedRange = bbcodeSelections.get(editor);

      if (
        savedRange &&
        editor.contains(savedRange.commonAncestorContainer)
      ) {
        return savedRange.cloneRange();
      }

      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      return range;
    }

    function insertBbcodeText(editor, text, selectedOffset = null, selectedLength = 0) {
      editor.focus();
      const range = getEditorRange(editor);
      range.deleteContents();

      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      const nextRange = document.createRange();
      const start = Number.isInteger(selectedOffset)
        ? Math.max(0, Math.min(text.length, selectedOffset))
        : text.length;
      const end = Math.max(
        start,
        Math.min(text.length, start + selectedLength)
      );

      nextRange.setStart(textNode, start);
      nextRange.setEnd(textNode, end);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(nextRange);
      bbcodeSelections.set(editor, nextRange.cloneRange());

      editor.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: text
        })
      );
    }

    function getSelectionText(editor) {
      const range = getEditorRange(editor);
      return editor.contains(range.commonAncestorContainer)
        ? range.toString()
        : "";
    }

    function buildBbcodeInsertion(type, selectedText) {
      const selected = String(selectedText || "");
      const text = selected.trim();

      const wrappers = {
        left: ["[align=left]", "[/align]", "ข้อความ"],
        center: ["[align=center]", "[/align]", "ข้อความ"],
        right: ["[align=right]", "[/align]", "ข้อความ"],
        justify: ["[align=justify]", "[/align]", "ข้อความ"],
        hide: ["[hide]", "[/hide]", "ข้อความที่ต้องการซ่อน"],
        spoiler: ["[spoiler]", "[/spoiler]", "ข้อความสปอยล์"]
      };

      if (wrappers[type]) {
        const [open, close, placeholder] = wrappers[type];
        const body = text || placeholder;
        return {
          text: `${open}${body}${close}`,
          offset: text ? null : open.length,
          length: text ? 0 : body.length
        };
      }

      if (type === "youtube") {
        const body = text || "ใส่ลิงก์ YouTube";
        return {
          text: `[video=youtube]${body}[/video]`,
          offset: text ? null : "[video=youtube]".length,
          length: text ? 0 : body.length
        };
      }

      if (type === "hr") {
        return { text: "\n[hr]\n", offset: null, length: 0 };
      }

      if (type === "img") {
        const body = text || "ใส่ลิงก์รูป";
        return {
          text: `[img]${body}[/img]`,
          offset: text ? null : "[img]".length,
          length: text ? 0 : body.length
        };
      }

      if (type === "url") {
        const label = text || "ข้อความลิงก์";
        const opening = "[url=ใส่ลิงก์]";
        return {
          text: `${opening}${label}[/url]`,
          offset: "[url=".length,
          length: "ใส่ลิงก์".length
        };
      }

      if (type === "list" || type === "list1") {
        const opening = type === "list1" ? "[list=1]" : "[list]";
        const lines = text
          ? selected
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean)
          : ["รายการที่ 1", "รายการที่ 2"];
        const body = lines.map((line) => `[*]${line}`).join("\n");
        const result = `${opening}\n${body}\n[/list]`;
        const firstItem = lines[0] || "";
        const firstOffset = `${opening}\n[*]`.length;

        return {
          text: result,
          offset: text ? null : firstOffset,
          length: text ? 0 : firstItem.length
        };
      }

      return { text: selected, offset: null, length: 0 };
    }

    const bbcodeButtons = [
      ["left", "LEFT", "จัดชิดซ้าย"],
      ["center", "CENTER", "จัดกึ่งกลาง"],
      ["right", "RIGHT", "จัดชิดขวา"],
      ["justify", "JUSTIFY", "จัดเต็มบรรทัด"],
      ["hide", "HIDE", "ซ่อนข้อความ"],
      ["spoiler", "SPOILER", "ครอบข้อความสปอยล์"],
      ["youtube", "YOUTUBE", "ใส่วิดีโอ YouTube"],
      ["hr", "HR", "เส้นคั่น"],
      ["img", "IMG", "ใส่รูป"],
      ["url", "URL", "ใส่ลิงก์"],
      ["list", "LIST", "รายการหัวข้อ"],
      ["list1", "LIST 1", "รายการแบบตัวเลข"]
    ];

    document
      .querySelectorAll(".dds-rich-toolbar")
      .forEach((toolbar) => {
        if (toolbar.querySelector("[data-dds-bbcode]")) {
          return;
        }

        const editor = document.getElementById(
          toolbar.dataset.toolbarFor || ""
        );

        if (!editor) {
          return;
        }

        editor.dataset.placeholder = "กรอกข้อความของคุณที่นี่";

        ["focus", "keyup", "mouseup", "input"].forEach((eventName) => {
          editor.addEventListener(eventName, () => {
            saveBbcodeSelection(editor);
          });
        });

        bbcodeButtons.forEach(([type, label, title]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "dds-bbcode-button";
          button.dataset.ddsBbcode = type;
          button.textContent = label;
          button.title = title;

          button.addEventListener("mousedown", (event) => {
            event.preventDefault();
            const selectedText = getSelectionText(editor);
            const insertion = buildBbcodeInsertion(
              type,
              selectedText
            );

            insertBbcodeText(
              editor,
              insertion.text,
              insertion.offset,
              insertion.length
            );
          });

          toolbar.appendChild(button);
        });
      });

    function isProtectedField(field) {
      if (
        field.matches(
          'input[type="color"], input[type="range"], input[type="checkbox"], input[type="radio"], input[type="hidden"], input[type="button"], input[type="submit"], input[type="reset"], input[type="file"], button, output, select'
        )
      ) {
        return true;
      }

      if (
        field.matches(
          '.dds-generated-code, [readonly], [disabled]'
        )
      ) {
        return true;
      }

      if (
        field.matches('input[type="text"]') &&
        (
          field.closest(".dds-color-field") ||
          (/color/i.test(field.id || "") &&
            /^#[0-9a-f]{3,8}$/i.test(field.value || ""))
        )
      ) {
        return true;
      }

      return false;
    }

    function fieldLabelText(field) {
      const label = field.closest("label");
      const labelText = label?.querySelector(":scope > span")?.textContent;
      return String(labelText || "").trim();
    }

    function clearPanelFields(panel, force = false) {
      if (
        !panel ||
        (!force && panel.dataset.ddsBlanked === "true")
      ) {
        return;
      }

      panel.dataset.ddsBlanked = "true";
      const changedFields = [];

      panel
        .querySelectorAll("input, textarea, .dds-rich-editor")
        .forEach((field) => {
          if (isProtectedField(field)) {
            return;
          }

          if (field.classList?.contains("dds-rich-editor")) {
            field.innerHTML = "";
            field.dataset.placeholder =
              field.dataset.placeholder ||
              "กรอกข้อความของคุณที่นี่";
            changedFields.push(field);
            return;
          }

          field.value = "";
          const labelText = fieldLabelText(field);
          field.placeholder = labelText
            ? `กรอก${labelText}`
            : "กรอกข้อมูลของคุณ";
          changedFields.push(field);
        });

      const panelName = panel.dataset.panel || "";
      const updaterName = updaterByPanel[panelName];
      const updater = updaterName
        ? window[updaterName]
        : null;

      window.__DDS_SUPPRESS_ARCHIVE_CARD_UPDATE__ = true;

      try {
        if (typeof updater === "function") {
          updater();
        } else if (changedFields[0]) {
          changedFields[0].dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      } finally {
        window.__DDS_SUPPRESS_ARCHIVE_CARD_UPDATE__ = false;
      }
    }

    function getEditorPanelFromButton(button) {
      if (!button) {
        return null;
      }

      const editKey =
        button.dataset.editCode ||
        button.dataset.editProfile ||
        button.dataset.editReview ||
        "";

      return editKey
        ? document.querySelector(
            `[data-panel="editor-${editKey}"]`
          )
        : null;
    }

    function prepareBlankEditor(button) {
      const panel = getEditorPanelFromButton(button);

      if (!panel) {
        return;
      }

      /*
       * ล้างเฉพาะตอนเปิด editor ครั้งแรกเท่านั้น
       * หลังผู้ใช้เริ่มกรอกแล้ว การคลิกช่องอื่นหรือกลับเข้ามาหน้าเดิม
       * จะไม่ล้างข้อมูลซ้ำ
       */
      clearPanelFields(panel);
    }

    document
      .querySelectorAll(
        "[data-edit-code], [data-edit-profile], [data-edit-review]"
      )
      .forEach((button) => {
        button.addEventListener(
          "pointerdown",
          () => prepareBlankEditor(button),
          { capture: true }
        );

        button.addEventListener(
          "click",
          () => prepareBlankEditor(button),
          { capture: true }
        );
      });

    /*
     * สำคัญ: ต้องหา RESET ภายใน panel ทีละ panel
     * ห้ามต่อ `${editorPanelSelector} .dds-reset-button` ตรง ๆ
     * เพราะ editorPanelSelector มี comma และจะทำให้ทั้ง panel ของ
     * ROLEPLAY / PROFILE ถูกมองเป็นปุ่ม RESET ทุกครั้งที่คลิกข้างใน
     */
    document
      .querySelectorAll(editorPanelSelector)
      .forEach((panel) => {
        panel
          .querySelectorAll(".dds-reset-button")
          .forEach((button) => {
            button.addEventListener("click", () => {
              window.setTimeout(() => {
                clearPanelFields(panel, true);
              }, 0);
            });
          });
      });

    /* รองรับการเปิด editor จาก hash โดยตรงครั้งแรก */
    queueMicrotask(() => {
      const activePanel = document.querySelector(
        `${editorPanelSelector}.is-active`
      );

      if (activePanel) {
        clearPanelFields(activePanel);
      }
    });
  }


  /*
   * ROLEPLAY / PROFILE ไม่ต้องมีระบบ restore state เพิ่ม
   * ค่าใน input/textarea/contenteditable จะค้างอยู่ใน DOM ตามธรรมชาติ
   * เหมือนหน้า FOR REVIEW และจะถูกล้างเฉพาะครั้งแรกหรือเมื่อกด RESET
   */

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



  const FOOD_REVIEW_CATALOGUE_MARKUP = String.raw`<div class="fdpopup-wrap" style="--fdpopup-bg:url('https://s13.gifyu.com/images/blgAw.png');--fdpopup-main:#FFCAD4;--fdpopup-dark:#B689B0;--fdpopup-star:#ffb000;--fdpopup-paper:#fffdf9;--fdpopup-text:#27201c;--fdpopup-tagbg:#faf0f2;"><div class="fdpopup-container"><div class="fdpopup-place">Food Review</div><div class="fdpopup-stage"><div class="fdpopup-info fdpopup-info-left"><div class="fdpopup-info-head"><div class="fdpopup-info-icon">★</div><div class="fdpopup-info-title"><span>FOOD REVIEW</span><strong>คะแนนโดยรวม</strong></div></div><div class="fdpopup-stars">★★★★★</div><div class="fdpopup-score-row"><strong>9.9</strong><span>/ 10</span></div><div class="fdpopup-score-list"><div><span>รสชาติ</span><b>10</b></div><div><span>รูปลักษณ์</span><b>10</b></div><div><span>ความสมเหตุสมผลของราคา</span><b>10</b></div></div></div><div class="fdpopup-card"><div class="fdpopup-card-head"><div class="fdpopup-brand"><div class="fdpopup-logo" style="background-image:url('https://i.pinimg.com/vwebp/1200x/cb/76/88/cb76889bbad391355af7c3c819ccb02b.webp');background-position:center 50%;"></div><div class="fdpopup-brand-text"><strong>deadbutrich</strong><span>Food Review</span></div></div><div class="fdpopup-menu">⋮</div></div><div class="fdpopup-gallery"><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-1" checked><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-2"><input type="radio" name="fdpopup-gallery" id="fdpopup-photo-3"><div class="fdpopup-slides"><div class="fdpopup-photo fdpopup-photo-1" style="--fdpopup-img-1:url('https://i.pinimg.com/736x/e8/f4/3d/e8f43dae4d9a58d3f7a9bab7f080e0b0.jpg');--fdpopup-img-1-y:50%;"></div><div class="fdpopup-photo fdpopup-photo-2" style="--fdpopup-img-2:url('https://i.pinimg.com/736x/a2/14/3c/a2143cae7c46e2937acf54914c179652.jpg');--fdpopup-img-2-y:50%;"></div><div class="fdpopup-photo fdpopup-photo-3" style="--fdpopup-img-3:url('https://i.pinimg.com/736x/88/4a/d3/884ad393abce8919d72b0305646f79bf.jpg');--fdpopup-img-3-y:50%;"></div></div><div class="fdpopup-gallery-number"><span>3 PHOTOS</span></div><div class="fdpopup-dots"><label for="fdpopup-photo-1"></label><label for="fdpopup-photo-2"></label><label for="fdpopup-photo-3"></label></div></div><div class="fdpopup-actions"><div class="fdpopup-actions-left"><span class="fdpopup-heart">❤︎</span><span class="fdpopup-chat">&#128172;</span><span class="fdpopup-send">✉︎</span></div><span class="fdpopup-bookmark">⛉</span></div><div class="fdpopup-caption"><strong>deadbutrich</strong><span>กดวงกลมใต้รูปเพื่อเปลี่ยนภาพอาหาร</span></div></div><div class="fdpopup-info fdpopup-info-right"><div class="fdpopup-info-head"><div class="fdpopup-info-icon">✦</div><div class="fdpopup-info-title"><span>RECOMMENDED</span><strong>เมนูแนะนำ</strong></div></div><h3 class="fdpopup-food-name">It’s me</h3><p class="fdpopup-description">แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</p><div class="fdpopup-tags"><span>ของทานเล่น</span><span>ใช่ นี่ของอร่อย</span></div></div></div><div class="fdpopup-contact"><div class="fdpopup-contact-avatar" style="--fdpopup-avatar:url('https://i.pinimg.com/vwebp/1200x/17/2a/f3/172af366be2a5e78b088d5fe0413a17b.webp');--fdpopup-avatar-y:35%;"></div><div class="fdpopup-contact-text"><span>RECOMMENDED BY</span><strong>Franklin D. Bloodworth</strong></div><div class="fdpopup-contact-icon">✝</div></div></div></div>`;

  function buildStaticFoodReviewCardDocument() {
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://guindaeyo.github.io/deepdshop/ddsh-revfoodie.css" rel="stylesheet">
<style>
  html,
  body {
    margin: 0;
    width: 1300px;
    min-width: 1300px;
    max-width: 1300px;
    height: 920px;
    min-height: 920px;
    max-height: 920px;
    background: #242424;
    overflow: hidden;
  }

  body {
    padding: 0;
  }

  .dds-card-preview-shell {
    width: 1300px;
    height: 920px;
    display: block;
    overflow: hidden;
  }

  .dds-card-preview-target {
    width: 1300px;
    min-width: 1300px;
    max-width: 1300px;
    height: 920px;
    min-height: 920px;
    max-height: 920px;
    transform: none;
    transform-origin: top left;
  }

  .fdpopup-wrap {
    width: 1300px !important;
    min-width: 1300px !important;
    max-width: 1300px !important;
    margin: 0 !important;
    background-image: var(--fdpopup-bg) !important;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
  }

  .fdpopup-container {
    width: 760px !important;
    max-width: 760px !important;
  }
</style>
</head>
<body data-dds-static-preview="food-review">
  <div class="dds-card-preview-shell">
    <div class="dds-card-preview-target">
      ${FOOD_REVIEW_CATALOGUE_MARKUP}
    </div>
  </div>
</body>
</html>`;
  }

  function installStaticFoodReviewCataloguePreviewFix() {
    if (window.__DDS_STATIC_FOOD_REVIEW_PREVIEW_FIX__) {
      return;
    }

    window.__DDS_STATIC_FOOD_REVIEW_PREVIEW_FIX__ = true;

    const iframe = document.querySelector("#reviewCardPreview001");

    if (!iframe) {
      return;
    }

    const originalQueuePreviewDocument =
      typeof window.queuePreviewDocument === "function"
        ? window.queuePreviewDocument
        : null;

    /*
     * การ์ดหน้า FOR REVIEW เป็นตัวอย่างถาวร ไม่ให้ค่าจากหน้า EDIT
     * เขียนทับ และไม่โหลดเอกสาร 3 รอบเหมือนเวอร์ชันก่อน
     */
    if (originalQueuePreviewDocument) {
      window.queuePreviewDocument = function (
        targetIframe,
        srcdoc,
        resizeFunction
      ) {
        if (
          targetIframe?.id === "reviewCardPreview001" &&
          !window.__DDS_RENDER_STATIC_FOOD_REVIEW__
        ) {
          return true;
        }

        return originalQueuePreviewDocument.call(
          this,
          targetIframe,
          srcdoc,
          resizeFunction
        );
      };
    }

    const previewAssetUrls = [
      "https://s13.gifyu.com/images/blgAw.png",
      "https://i.pinimg.com/vwebp/1200x/cb/76/88/cb76889bbad391355af7c3c819ccb02b.webp",
      "https://i.pinimg.com/736x/e8/f4/3d/e8f43dae4d9a58d3f7a9bab7f080e0b0.jpg",
      "https://i.pinimg.com/736x/a2/14/3c/a2143cae7c46e2937acf54914c179652.jpg",
      "https://i.pinimg.com/736x/88/4a/d3/884ad393abce8919d72b0305646f79bf.jpg",
      "https://i.pinimg.com/vwebp/1200x/17/2a/f3/172af366be2a5e78b088d5fe0413a17b.webp"
    ];

    if (!window.__DDS_FOOD_REVIEW_PRELOAD_CACHE__) {
      window.__DDS_FOOD_REVIEW_PRELOAD_CACHE__ =
        previewAssetUrls.map((url) => {
          const image = new Image();
          image.decoding = "async";
          image.src = url;
          return image;
        });
    }

    const resizeFunction =
      typeof window.resizeReviewDesktopCardPreview === "function"
        ? window.resizeReviewDesktopCardPreview
        : typeof window.resizeCardPreview === "function"
          ? window.resizeCardPreview
          : null;

    function resizeAndReveal() {
      window.requestAnimationFrame(() => {
        if (resizeFunction) {
          resizeFunction(iframe);
        }

        if (typeof window.revealPreview === "function") {
          window.revealPreview(iframe);
        }
      });
    }

    function cancelOldQueuedRender() {
      if (typeof window.getPreviewState !== "function") {
        return;
      }

      const state = window.getPreviewState(iframe);

      ["timer", "performanceTimer", "resizeTimer"].forEach(
        (key) => {
          if (state?.[key]) {
            window.clearTimeout(state[key]);
            state[key] = null;
          }
        }
      );

      if (state) {
        state.pendingSrcdoc = "";
      }
    }

    function renderStaticFoodReviewPreview() {
      iframe.dataset.reviewDesktopWidth = "1300";
      iframe.dataset.reviewDesktopHeight = "920";
      iframe.dataset.previewVisualBounds = "true";

      if (
        iframe.dataset.ddsFoodReviewPreviewState === "ready" ||
        iframe.dataset.ddsFoodReviewPreviewState === "loading"
      ) {
        resizeAndReveal();
        return;
      }

      cancelOldQueuedRender();
      iframe.dataset.ddsFoodReviewPreviewState = "loading";

      iframe.addEventListener(
        "load",
        () => {
          iframe.dataset.ddsFoodReviewPreviewState = "ready";
          resizeAndReveal();
        },
        { once: true }
      );

      /*
       * เขียน srcdoc โดยตรงเพียงครั้งเดียว ลดคิว/การ parse/การโหลดรูปซ้ำ
       * ที่เคยเกิดจากรอบ 0, 90 และ 260 ms
       */
      window.__DDS_RENDER_STATIC_FOOD_REVIEW__ = true;

      try {
        iframe.srcdoc = buildStaticFoodReviewCardDocument();
      } finally {
        window.__DDS_RENDER_STATIC_FOOD_REVIEW__ = false;
      }
    }

    document.addEventListener("click", (event) => {
      if (
        event.target.closest(
          '[data-go="review"], [data-page="review"], [data-edit-review]'
        )
      ) {
        renderStaticFoodReviewPreview();
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#review") {
        renderStaticFoodReviewPreview();
      }
    });

    renderStaticFoodReviewPreview();
  }


  installLivePreviewPerformanceFix();
  installNewRulesWebsiteImageFix();
  installCommissionActivityLayout();
  installActivityTopMovies();
  installActivityTopMoviesReply();
  installCommissionThreeHouse();
  installMyOwnCodeCommission();
  installMyOwnCodeHistory();
  installMyOwnCodeTopicHeader();
  normalizeShowcaseCardLabels();
  installThreeColumnShowcaseGrids();
  installBlankEditorFormsAndBbcodeTools();
  installStaticCataloguePreviewFix();
  installStaticFoodReviewCataloguePreviewFix();
  window.__DDS_PERFORMANCE_BUILD_READY__ = true;
})();

/* ============================================================
   MERGED LOCAL EDITOR ENHANCEMENTS
   - local draft save
   - comprehensive BBCode toolbar
   - selected-text wrapping
   - Thai/English word counter excluding BBCode
============================================================ */

"use strict";

/*
 * DEEP DEEP SLEEP CODE SHOP — LOCAL ENHANCEMENTS
 *
 * ไฟล์นี้ทำงานต่อจาก core script ที่ถูกเรียกใน index.html
 *
 * Features:
 * - Lightweight live-preview patch
 * - Local draft save per editor (localStorage)
 * - Automatic draft restore on the same browser/device
 * - Comprehensive BBCode toolbar
 * - Wraps the currently selected text instead of inserting placeholder text
 */

(() => {
  if (window.__DDS_LOCAL_ENHANCEMENTS_INSTALLED__) {
    return;
  }

  window.__DDS_LOCAL_ENHANCEMENTS_INSTALLED__ = true;

  const EDITOR_PANEL_SELECTOR = [
    '[data-panel^="editor-code"]',
    '[data-panel^="editor-profile"]',
    '[data-panel^="editor-review"]'
  ].join(",");

  const STORAGE_PREFIX = "dds-code-draft-v3:";
  const panelStates = new WeakMap();
  const savedEditableRanges = new WeakMap();
  let generatedTargetId = 0;

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    const toast = document.querySelector("#siteToast");
    const toastText = document.querySelector("#siteToastText");

    if (!toast || !toastText) {
      return;
    }

    toastText.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("[DDS] localStorage read failed", error);
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("[DDS] localStorage write failed", error);
      return false;
    }
  }

  function safeStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("[DDS] localStorage remove failed", error);
      return false;
    }
  }

  function isEditorPanel(panel) {
    return Boolean(panel?.matches?.(EDITOR_PANEL_SELECTOR));
  }

  function getPanelKey(panel) {
    return `${STORAGE_PREFIX}${panel.dataset.panel || "unknown"}`;
  }

  function isGeneratedOrIgnoredField(field) {
    return Boolean(
      field.matches(
        '.dds-generated-code, [data-dds-no-save], [type="button"], [type="submit"], [type="reset"], button'
      ) ||
        field.readOnly ||
        field.disabled
    );
  }

  function getSavableFields(panel) {
    return Array.from(
      panel.querySelectorAll(
        "input, textarea, select, [contenteditable='true']"
      )
    ).filter((field) => !isGeneratedOrIgnoredField(field));
  }

  function ensureFieldKey(field) {
    if (field.id) {
      return field.id;
    }

    if (!field.dataset.ddsFieldKey) {
      generatedTargetId += 1;
      field.dataset.ddsFieldKey = `dds-field-${generatedTargetId}`;
    }

    return field.dataset.ddsFieldKey;
  }

  function readField(field) {
    if (field.matches("[contenteditable='true']")) {
      return {
        kind: "html",
        value: field.innerHTML
      };
    }

    if (field.type === "checkbox" || field.type === "radio") {
      return {
        kind: "checked",
        value: field.checked
      };
    }

    return {
      kind: "value",
      value: field.value
    };
  }

  function writeField(field, entry) {
    if (!entry || typeof entry !== "object") {
      return;
    }

    if (entry.kind === "html" && field.matches("[contenteditable='true']")) {
      field.innerHTML = String(entry.value ?? "");
      return;
    }

    if (
      entry.kind === "checked" &&
      (field.type === "checkbox" || field.type === "radio")
    ) {
      field.checked = Boolean(entry.value);
      return;
    }

    if ("value" in field) {
      field.value = String(entry.value ?? "");
    }
  }

  function capturePanel(panel) {
    const fields = {};

    getSavableFields(panel).forEach((field) => {
      fields[ensureFieldKey(field)] = readField(field);
    });

    return {
      version: 3,
      panel: panel.dataset.panel || "",
      savedAt: Date.now(),
      fields
    };
  }

  function getPanelState(panel) {
    let state = panelStates.get(panel);

    if (!state) {
      state = {
        baseline: capturePanel(panel),
        initialized: false,
        restoring: false,
        saveTimer: null,
        statusElement: null,
        toolsColumn: null,
        toolsResizeObserver: null,
        toolsResizeHandler: null
      };
      panelStates.set(panel, state);
    }

    return state;
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) {
      return "ยังไม่ได้บันทึก";
    }

    try {
      return `บันทึกล่าสุด ${new Date(timestamp).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    } catch (_error) {
      return "บันทึกแล้ว";
    }
  }

  function setDraftStatus(panel, text, stateName = "idle") {
    const state = getPanelState(panel);
    if (!state.statusElement) {
      return;
    }

    state.statusElement.textContent = text;
    state.statusElement.dataset.state = stateName;
  }

  function savePanel(panel, announce = false) {
    const state = getPanelState(panel);

    if (!state.initialized || state.restoring) {
      return false;
    }

    const payload = capturePanel(panel);
    const saved = safeStorageSet(getPanelKey(panel), JSON.stringify(payload));

    if (saved) {
      setDraftStatus(panel, formatSavedTime(payload.savedAt), "saved");
      if (announce) {
        notify("บันทึกแบบร่างลงในเครื่องนี้แล้ว");
      }
      return true;
    }

    setDraftStatus(panel, "เบราว์เซอร์ไม่อนุญาตให้บันทึก", "error");
    if (announce) {
      notify("บันทึกแบบร่างไม่สำเร็จ");
    }
    return false;
  }

  function schedulePanelSave(panel) {
    const state = getPanelState(panel);

    if (!state.initialized || state.restoring) {
      return;
    }

    setDraftStatus(panel, "กำลังบันทึก…", "saving");
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => {
      savePanel(panel, false);
    }, 320);
  }

  function dispatchFieldUpdate(field) {
    field.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );

    if (
      field.matches("select, input[type='checkbox'], input[type='radio']")
    ) {
      field.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    }
  }

  function refreshPanel(panel) {
    const field = getSavableFields(panel).find((candidate) => {
      return !candidate.matches("input[type='hidden']");
    });

    if (field) {
      dispatchFieldUpdate(field);
    }

    if (typeof window.syncImagePositionOutputs === "function") {
      window.syncImagePositionOutputs();
    }
  }

  function isColorValueField(field) {
    return Boolean(
      field.closest(".dds-color-field") ||
        field.type === "color" ||
        /color/i.test(field.id || "")
    );
  }

  function shouldKeepBaselineValue(field) {
    return Boolean(
      field.dataset.ddsKeepBaseline === "true" ||
        isColorValueField(field) ||
        ["range", "checkbox", "radio"].includes(field.type) ||
        field.tagName === "SELECT"
    );
  }

  function clearPanelForNewDraft(panel) {
    const state = getPanelState(panel);
    const baselineFields = state.baseline.fields;

    state.restoring = true;

    getSavableFields(panel).forEach((field) => {
      const key = ensureFieldKey(field);
      const baselineEntry = baselineFields[key];

      if (shouldKeepBaselineValue(field)) {
        writeField(field, baselineEntry);
        return;
      }

      if (field.id === "reviewStars" || field.id === "reviewScoreIcon") {
        field.value = "★";
        return;
      }

      if (field.matches("[contenteditable='true']")) {
        field.innerHTML = "";
        return;
      }

      if ("value" in field) {
        field.value = "";
      }
    });

    state.restoring = false;
    refreshPanel(panel);
    updateRoleplayWordCounters(panel);
  }

  function restorePanelDraft(panel) {
    const state = getPanelState(panel);
    const raw = safeStorageGet(getPanelKey(panel));

    if (!raw) {
      clearPanelForNewDraft(panel);
      setDraftStatus(panel, "แบบร่างใหม่ · บันทึกอัตโนมัติ", "idle");
      return false;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.warn("[DDS] invalid saved draft", error);
      safeStorageRemove(getPanelKey(panel));
      clearPanelForNewDraft(panel);
      setDraftStatus(panel, "แบบร่างใหม่ · บันทึกอัตโนมัติ", "idle");
      return false;
    }

    state.restoring = true;

    getSavableFields(panel).forEach((field) => {
      const entry = payload.fields?.[ensureFieldKey(field)];
      if (entry) {
        writeField(field, entry);
      }
    });

    state.restoring = false;
    refreshPanel(panel);
    updateRoleplayWordCounters(panel);
    setDraftStatus(panel, formatSavedTime(payload.savedAt), "saved");
    return true;
  }

  function activatePanel(panel) {
    if (!isEditorPanel(panel)) {
      return;
    }

    const state = getPanelState(panel);
    if (state.initialized) {
      return;
    }

    state.initialized = true;
    restorePanelDraft(panel);
  }

  function resetPanelToBlank(panel) {
    const state = getPanelState(panel);
    window.clearTimeout(state.saveTimer);
    safeStorageRemove(getPanelKey(panel));
    clearPanelForNewDraft(panel);
    setDraftStatus(panel, "ล้างแบบร่างแล้ว · บันทึกอัตโนมัติ", "idle");
    notify("ล้างข้อมูลในหน้าแก้ไขแล้ว");
  }

  function installEditorToolsColumn(panel, controls) {
    const layout = controls?.closest?.(".dds-editor-layout");

    if (!layout) {
      return controls;
    }

    const state = getPanelState(panel);
    let toolsColumn = Array.from(layout.children).find((child) =>
      child.classList?.contains("dds-editor-tools-column")
    );

    if (!toolsColumn) {
      toolsColumn = document.createElement("div");
      toolsColumn.className = "dds-editor-tools-column";
      layout.insertBefore(toolsColumn, controls);
      toolsColumn.appendChild(controls);
    } else if (controls.parentElement !== toolsColumn) {
      toolsColumn.appendChild(controls);
    }

    state.toolsColumn = toolsColumn;

    /*
     * ย้ายส่วนคัดลอกโค้ดออกจากพื้นที่สกรอลล์ของเครื่องมือ
     * เพื่อให้ปุ่ม COPY / RESET มองเห็นอยู่ด้านล่างของคอลัมน์เสมอ
     */
    const copySection = Array.from(controls.children).find((child) =>
      child.classList?.contains("dds-copy-section")
    );

    if (copySection) {
      let copyDock = Array.from(toolsColumn.children).find((child) =>
        child.classList?.contains("dds-editor-copy-dock")
      );

      if (!copyDock) {
        copyDock = document.createElement("div");
        copyDock.className = "dds-editor-copy-dock";
        toolsColumn.appendChild(copyDock);
      }

      if (copySection.parentElement !== copyDock) {
        copyDock.appendChild(copySection);
      }

      state.copyDock = copyDock;
    }

    const previewColumn = layout.querySelector(".dds-editor-preview-column");

    const syncColumnHeight = () => {
      if (!previewColumn || !toolsColumn.isConnected) {
        return;
      }

      const previewHeight = Math.ceil(
        previewColumn.getBoundingClientRect().height
      );

      if (previewHeight > 0) {
        toolsColumn.style.setProperty(
          "--dds-editor-preview-height",
          `${previewHeight}px`
        );
      }
    };

    if (previewColumn && !state.toolsResizeObserver && "ResizeObserver" in window) {
      state.toolsResizeObserver = new ResizeObserver(syncColumnHeight);
      state.toolsResizeObserver.observe(previewColumn);
    }

    if (!state.toolsResizeHandler) {
      state.toolsResizeHandler = syncColumnHeight;
      window.addEventListener("resize", state.toolsResizeHandler, {
        passive: true
      });
    }

    requestAnimationFrame(syncColumnHeight);
    window.setTimeout(syncColumnHeight, 250);
    window.setTimeout(syncColumnHeight, 1000);

    return toolsColumn;
  }

  function installDraftManager(panel) {
    if (!isEditorPanel(panel) || panel.dataset.ddsDraftManager === "true") {
      return;
    }

    panel.dataset.ddsDraftManager = "true";
    const state = getPanelState(panel);
    const controls = panel.querySelector(".dds-editor-controls");

    if (controls) {
      const toolsColumn = installEditorToolsColumn(panel, controls);
      const manager = document.createElement("section");
      manager.className = "dds-draft-manager";
      manager.innerHTML = `
        <div class="dds-draft-manager-copy">
          <strong>บันทึกแบบร่าง</strong>
          <span class="dds-draft-status" data-state="idle">บันทึกอัตโนมัติเมื่อมีการแก้ไข</span>
        </div>
        <div class="dds-draft-manager-actions">
          <button class="dds-draft-save-button" type="button">SAVE DRAFT</button>
          <button class="dds-draft-delete-button" type="button">DELETE SAVE</button>
        </div>
      `;

      toolsColumn.insertBefore(manager, controls);
      state.statusElement = manager.querySelector(".dds-draft-status");

      manager
        .querySelector(".dds-draft-save-button")
        ?.addEventListener("click", () => {
          activatePanel(panel);
          savePanel(panel, true);
        });

      manager
        .querySelector(".dds-draft-delete-button")
        ?.addEventListener("click", () => {
          const confirmed = window.confirm(
            "ลบแบบร่างที่บันทึกไว้ในเครื่องนี้หรือไม่? ข้อมูลที่กำลังกรอกอยู่จะยังไม่ถูกล้าง"
          );

          if (!confirmed) {
            return;
          }

          safeStorageRemove(getPanelKey(panel));
          setDraftStatus(panel, "ลบไฟล์บันทึกแล้ว · ข้อมูลบนหน้ายังอยู่", "idle");
          notify("ลบแบบร่างที่บันทึกไว้แล้ว");
        });
    }

    getSavableFields(panel).forEach((field) => {
      field.addEventListener("input", () => schedulePanelSave(panel));
      field.addEventListener("change", () => schedulePanelSave(panel));
    });

    panel.querySelectorAll(".dds-reset-button").forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          activatePanel(panel);
          resetPanelToBlank(panel);
        },
        true
      );
    });
  }

  function ensureTargetId(target) {
    if (!target.id) {
      generatedTargetId += 1;
      target.id = `dds-bbcode-target-${generatedTargetId}`;
    }
    return target.id;
  }

  function isLongTextTarget(target) {
    if (target.matches("[contenteditable='true']")) {
      return true;
    }

    if (target.tagName === "TEXTAREA") {
      return !target.classList.contains("dds-generated-code");
    }

    if (
      target.matches("input[type='text'], input:not([type])") &&
      !isColorValueField(target)
    ) {
      const maxLength = Number(target.getAttribute("maxlength") || 0);
      const initialLength = String(target.value || "").length;
      return maxLength > 70 || initialLength > 70;
    }

    return false;
  }

  function createToolbarMarkup(targetId) {
    return `
      <div class="dds-bbcode-group" aria-label="รูปแบบตัวอักษร">
        <button type="button" data-bbcode="b" title="ตัวหนา [b]" aria-label="ตัวหนา"><b>B</b></button>
        <button type="button" data-bbcode="i" title="ตัวเอียง [i]" aria-label="ตัวเอียง"><i>I</i></button>
        <button type="button" data-bbcode="u" title="ขีดเส้นใต้ [u]" aria-label="ขีดเส้นใต้"><u>U</u></button>
        <button type="button" data-bbcode="s" title="ขีดฆ่า [s]" aria-label="ขีดฆ่า"><s>S</s></button>
      </div>
      <div class="dds-bbcode-group" aria-label="สีและขนาด">
        <label class="dds-bbcode-color" title="สีตัวอักษร [color]"><span>A</span><input type="color" data-bbcode-color value="#8f0e16" aria-label="เลือกสีตัวอักษร"></label>
        <button type="button" data-bbcode="size-small" title="ตัวอักษรเล็ก [size=small]">A−</button>
        <button type="button" data-bbcode="size-medium" title="ตัวอักษรกลาง [size=medium]">A</button>
        <button type="button" data-bbcode="size-large" title="ตัวอักษรใหญ่ [size=large]">A+</button>
      </div>
      <div class="dds-bbcode-group" aria-label="จัดตำแหน่ง">
        <button type="button" data-bbcode="align-left" title="ชิดซ้าย [align=left]">⇤</button>
        <button type="button" data-bbcode="align-center" title="กึ่งกลาง [align=center]">↔</button>
        <button type="button" data-bbcode="align-right" title="ชิดขวา [align=right]">⇥</button>
        <button type="button" data-bbcode="align-justify" title="เต็มบรรทัด [align=justify]">☰</button>
      </div>
      <div class="dds-bbcode-group" aria-label="ลิงก์และสื่อ">
        <button type="button" data-bbcode="url" title="ลิงก์ [url=]">🔗</button>
        <button type="button" data-bbcode="img" title="รูปภาพ [img]">▣</button>
        <button type="button" data-bbcode="video" title="YouTube [video=youtube]">▶</button>
      </div>
      <div class="dds-bbcode-group" aria-label="กล่องข้อความ">
        <button type="button" data-bbcode="quote" title="คำพูดอ้างอิง [quote]">❝</button>
        <button type="button" data-bbcode="code" title="โค้ด [code]">&lt;/&gt;</button>
        <button type="button" data-bbcode="hide" title="ซ่อนข้อความ [hide]">◉</button>
        <button type="button" data-bbcode="spoiler" title="สปอยล์ [spoiler]">▤</button>
      </div>
      <div class="dds-bbcode-group" aria-label="รายการ">
        <button type="button" data-bbcode="list" title="รายการจุด [list]">•≡</button>
        <button type="button" data-bbcode="list-1" title="รายการตัวเลข [list=1]">1≡</button>
        <button type="button" data-bbcode="list-item" title="รายการย่อย [*]">[*]</button>
      </div>
      <div class="dds-bbcode-group" aria-label="เครื่องมืออื่น">
        <button type="button" data-bbcode="hr" title="เส้นคั่น [hr]">―</button>
        <button type="button" data-bbcode="clear" title="ล้าง BBCode จากข้อความที่เลือก">CLEAR</button>
      </div>
      <span class="dds-bbcode-toolbar-target" aria-hidden="true">${targetId}</span>
    `;
  }

  function saveContenteditableSelection(target) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (target.contains(range.commonAncestorContainer)) {
      savedEditableRanges.set(target, range.cloneRange());
    }
  }

  function getContenteditableRange(target) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const currentRange = selection.getRangeAt(0);
      if (target.contains(currentRange.commonAncestorContainer)) {
        return currentRange.cloneRange();
      }
    }

    const saved = savedEditableRanges.get(target);
    if (saved) {
      return saved.cloneRange();
    }

    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    return range;
  }

  function getSelectedText(target) {
    if (target.matches("textarea, input")) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      return target.value.slice(start, end);
    }

    if (target.matches("[contenteditable='true']")) {
      return getContenteditableRange(target).toString();
    }

    return "";
  }

  function replaceSelection(target, replacement, emptyCaretOffset = replacement.length) {
    if (target.matches("textarea, input")) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      const hadSelection = end > start;
      target.value =
        target.value.slice(0, start) +
        replacement +
        target.value.slice(end);

      const caret = start + (hadSelection ? replacement.length : emptyCaretOffset);
      target.focus();
      target.setSelectionRange(caret, caret);
      dispatchFieldUpdate(target);
      return;
    }

    if (target.matches("[contenteditable='true']")) {
      const range = getContenteditableRange(target);
      const hadSelection = !range.collapsed;
      range.deleteContents();
      const textNode = document.createTextNode(replacement);
      range.insertNode(textNode);

      const caret = hadSelection ? replacement.length : emptyCaretOffset;
      const nextRange = document.createRange();
      nextRange.setStart(textNode, Math.max(0, Math.min(caret, replacement.length)));
      nextRange.collapse(true);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(nextRange);
      savedEditableRanges.set(target, nextRange.cloneRange());
      target.focus();
      dispatchFieldUpdate(target);
    }
  }

  function stripBbcode(text) {
    return String(text || "")
      .replace(/\[(?:\/?)(?:b|i|u|s|color(?:=[^\]]+)?|size(?:=[^\]]+)?|align(?:=[^\]]+)?|url(?:=[^\]]*)?|img|video(?:=[^\]]+)?|quote|code|hide|spoiler|list(?:=1)?|\*)\]/gi, "")
      .replace(/\[hr\]/gi, "");
  }

  function isRoleplayWordCountTarget(target) {
    return Boolean(
      target?.matches?.("[contenteditable='true']") &&
        target.closest('[data-panel^="editor-code"]') &&
        /roleplayeditor/i.test(target.id || "")
    );
  }

  function getWordCountSource(target) {
    if (!target) {
      return "";
    }

    if (target.matches("[contenteditable='true']")) {
      return target.innerText || target.textContent || "";
    }

    return target.value || "";
  }

  function removeBbcodeForWordCount(value) {
    return String(value || "")
      // รูปและวิดีโอไม่มีข้อความที่ผู้อ่านเห็น จึงไม่นับ URL ภายในแท็ก
      .replace(/\[img(?:=[^\]]*)?\][\s\S]*?\[\/img\]/gi, " ")
      .replace(/\[video(?:=[^\]]*)?\][\s\S]*?\[\/video\]/gi, " ")
      // ลิงก์แบบมีข้อความให้นับเฉพาะข้อความที่แสดง ไม่รวม URL ในพารามิเตอร์
      .replace(/\[url(?:=[^\]]*)?\]([\s\S]*?)\[\/url\]/gi, " $1 ")
      // ลบคำสั่ง BBCode ทุกชนิด รวม [*] และ [hr]
      .replace(/\[(?:\/?[a-z][a-z0-9_-]*(?:=[^\]]*)?|\*|hr)\]/gi, " ")
      // URL เปล่าไม่ถือเป็นคำในเนื้อหาโรลเพลย์
      .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countThaiAndEnglishWords(value) {
    const cleanText = removeBbcodeForWordCount(value);

    if (!cleanText) {
      return 0;
    }

    if (typeof Intl?.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("th", {
        granularity: "word"
      });

      let count = 0;
      for (const segment of segmenter.segment(cleanText)) {
        if (segment.isWordLike) {
          count += 1;
        }
      }
      return count;
    }

    // fallback สำหรับเบราว์เซอร์เก่า: ภาษาไทยและคำภาษาอังกฤษ/ตัวเลข
    const fallbackWords = cleanText.match(
      /[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g
    );
    return fallbackWords ? fallbackWords.length : 0;
  }

  function updateRoleplayWordCounter(target) {
    if (!isRoleplayWordCountTarget(target)) {
      return;
    }

    const counter = target.nextElementSibling?.classList.contains("dds-word-counter")
      ? target.nextElementSibling
      : null;

    if (!counter) {
      return;
    }

    const count = countThaiAndEnglishWords(getWordCountSource(target));
    const number = counter.querySelector("[data-word-count-number]");

    if (number) {
      number.textContent = count.toLocaleString("th-TH");
    }

    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function installRoleplayWordCounter(target) {
    if (
      !isRoleplayWordCountTarget(target) ||
      target.dataset.ddsWordCounterReady === "true"
    ) {
      return;
    }

    target.dataset.ddsWordCounterReady = "true";

    const counter = document.createElement("div");
    counter.className = "dds-word-counter";
    counter.innerHTML = `
      <span class="dds-word-counter-label">จำนวนคำ</span>
      <strong><span data-word-count-number>0</span> คำ</strong>
      <small>ไม่นับคำสั่ง BBCode</small>
    `;

    target.insertAdjacentElement("afterend", counter);

    target.addEventListener("input", () => {
      updateRoleplayWordCounter(target);
    });

    target.addEventListener("paste", () => {
      window.setTimeout(() => updateRoleplayWordCounter(target), 0);
    });

    updateRoleplayWordCounter(target);
  }

  function installRoleplayWordCounters(panel) {
    panel
      .querySelectorAll("[contenteditable='true']")
      .forEach((target) => installRoleplayWordCounter(target));
  }

  function updateRoleplayWordCounters(panel) {
    if (!panel) {
      return;
    }

    panel
      .querySelectorAll("[contenteditable='true'][data-dds-word-counter-ready='true']")
      .forEach((target) => updateRoleplayWordCounter(target));
  }

  function wrapTag(target, openTag, closeTag) {
    const selected = getSelectedText(target);
    const replacement = `${openTag}${selected}${closeTag}`;
    const caretOffset = selected ? replacement.length : openTag.length;
    replaceSelection(target, replacement, caretOffset);
  }

  function applyList(target, ordered) {
    const selected = getSelectedText(target);
    const lines = selected
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const openTag = ordered ? "[list=1]" : "[list]";
    const body = lines.length
      ? lines.map((line) => `[*]${line}`).join("\n")
      : "[*]";
    const replacement = `${openTag}\n${body}\n[/list]`;
    const caretOffset = lines.length
      ? replacement.length
      : openTag.length + 4;

    replaceSelection(target, replacement, caretOffset);
  }

  function applyBbcodeAction(target, action, toolbar) {
    switch (action) {
      case "b":
      case "i":
      case "u":
      case "s":
      case "quote":
      case "code":
      case "hide":
      case "spoiler":
        wrapTag(target, `[${action}]`, `[/${action}]`);
        break;

      case "size-small":
        wrapTag(target, "[size=small]", "[/size]");
        break;
      case "size-medium":
        wrapTag(target, "[size=medium]", "[/size]");
        break;
      case "size-large":
        wrapTag(target, "[size=large]", "[/size]");
        break;

      case "align-left":
        wrapTag(target, "[align=left]", "[/align]");
        break;
      case "align-center":
        wrapTag(target, "[align=center]", "[/align]");
        break;
      case "align-right":
        wrapTag(target, "[align=right]", "[/align]");
        break;
      case "align-justify":
        wrapTag(target, "[align=justify]", "[/align]");
        break;

      case "url": {
        const selected = getSelectedText(target);
        const url = window.prompt("ใส่ลิงก์ URL", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) {
          return;
        }
        const label = selected || url;
        replaceSelection(target, `[url=${url}]${label}[/url]`);
        break;
      }

      case "img": {
        const selected = getSelectedText(target);
        const url = window.prompt("ใส่ลิงก์รูปภาพ", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) {
          return;
        }
        replaceSelection(target, `[img]${url}[/img]`);
        break;
      }

      case "video": {
        const selected = getSelectedText(target);
        const url = window.prompt("ใส่ลิงก์ YouTube", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) {
          return;
        }
        replaceSelection(target, `[video=youtube]${url}[/video]`);
        break;
      }

      case "list":
        applyList(target, false);
        break;
      case "list-1":
        applyList(target, true);
        break;
      case "list-item":
        replaceSelection(target, `[*]${getSelectedText(target)}`);
        break;

      case "hr":
        replaceSelection(target, "[hr]");
        break;

      case "clear": {
        const selected = getSelectedText(target);
        if (!selected) {
          notify("คลุมข้อความที่ต้องการล้าง BBCode ก่อน");
          return;
        }
        replaceSelection(target, stripBbcode(selected));
        break;
      }

      case "color": {
        const color = toolbar.querySelector("[data-bbcode-color]")?.value || "#8f0e16";
        wrapTag(target, `[color=${color}]`, "[/color]");
        break;
      }

      default:
        return;
    }
  }

  function installBbcodeToolbarForTarget(target) {
    if (!isLongTextTarget(target) || target.dataset.ddsBbcodeReady === "true") {
      return;
    }

    target.dataset.ddsBbcodeReady = "true";
    const targetId = ensureTargetId(target);
    let toolbar = target.previousElementSibling;

    if (!toolbar?.classList.contains("dds-rich-toolbar")) {
      toolbar = document.createElement("div");
      toolbar.className = "dds-rich-toolbar dds-bbcode-toolbar";
      target.parentNode.insertBefore(toolbar, target);
    } else {
      toolbar.classList.add("dds-bbcode-toolbar");
    }

    toolbar.dataset.toolbarFor = targetId;
    toolbar.innerHTML = createToolbarMarkup(targetId);

    if (target.matches("[contenteditable='true']")) {
      ["focus", "keyup", "mouseup", "input"].forEach((eventName) => {
        target.addEventListener(eventName, () => {
          saveContenteditableSelection(target);
        });
      });
    }

    toolbar.addEventListener("pointerdown", (event) => {
      const control = event.target.closest("button, label, input");
      if (!control) {
        return;
      }

      if (target.matches("[contenteditable='true']")) {
        saveContenteditableSelection(target);
      }

      if (control.closest("button")) {
        event.preventDefault();
      }
    });

    toolbar.querySelectorAll("[data-bbcode]").forEach((button) => {
      button.addEventListener("click", () => {
        applyBbcodeAction(target, button.dataset.bbcode, toolbar);
      });
    });

    const colorInput = toolbar.querySelector("[data-bbcode-color]");
    colorInput?.addEventListener("change", () => {
      applyBbcodeAction(target, "color", toolbar);
    });
  }

  function installBbcodeToolbars(panel) {
    const candidates = Array.from(
      panel.querySelectorAll(
        "textarea, input[type='text'], input:not([type]), [contenteditable='true']"
      )
    );

    candidates.forEach((target) => installBbcodeToolbarForTarget(target));
  }

  function installOfficialCardPreviewProtection() {
    if (typeof window.queuePreviewDocument !== "function") {
      return;
    }

    const originalQueuePreviewDocument = window.queuePreviewDocument;
    if (originalQueuePreviewDocument.__ddsProtectedCards) {
      return;
    }

    function protectedQueuePreviewDocument(iframe, srcdoc, resizeFunction) {
      if (
        iframe?.classList?.contains("dds-roleplay-card-preview-frame") &&
        document.body.classList.contains("dds-editor-mode")
      ) {
        return;
      }

      return originalQueuePreviewDocument(iframe, srcdoc, resizeFunction);
    }

    protectedQueuePreviewDocument.__ddsProtectedCards = true;
    window.queuePreviewDocument = protectedQueuePreviewDocument;
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
      root.querySelectorAll("img, source, video, audio, iframe").forEach((element) => {
        assets.push(`${element.tagName}:${element.getAttribute("src") || ""}`);
        assets.push(`${element.tagName}-set:${element.getAttribute("srcset") || ""}`);
      });
      root.querySelectorAll("[style], style").forEach((element) => {
        const source = element.tagName === "STYLE" ? element.textContent : element.getAttribute("style");
        extractUrls(source).forEach((url) => assets.push(`url:${url}`));
      });
      return assets.join("\n");
    }

    function syncAttributes(currentElement, nextElement) {
      Array.from(currentElement.attributes).forEach((attribute) => {
        if (!nextElement.hasAttribute(attribute.name)) {
          currentElement.removeAttribute(attribute.name);
        }
      });
      Array.from(nextElement.attributes).forEach((attribute) => {
        if (currentElement.getAttribute(attribute.name) !== attribute.value) {
          currentElement.setAttribute(attribute.name, attribute.value);
        }
      });
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
      const currentChildren = Array.from(currentParent.childNodes);
      const nextChildren = Array.from(nextParent.childNodes);
      const sharedLength = Math.min(currentChildren.length, nextChildren.length);

      for (let index = 0; index < sharedLength; index += 1) {
        patchNode(currentChildren[index], nextChildren[index]);
      }
      for (let index = currentChildren.length - 1; index >= nextChildren.length; index -= 1) {
        currentParent.removeChild(currentParent.childNodes[index]);
      }
      for (let index = currentChildren.length; index < nextChildren.length; index += 1) {
        currentParent.appendChild(nextChildren[index].cloneNode(true));
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

    window.updateLoadedPreviewDocument = function updateLoadedPreviewDocumentFast(
      iframe,
      srcdoc,
      resizeFunction
    ) {
      const previewDocument = iframe?.contentDocument;
      if (!previewDocument || previewDocument.readyState === "loading") {
        return false;
      }

      const selector = ".dds-preview-target, .dds-card-preview-target";
      const currentTarget = previewDocument.querySelector(selector);
      if (!currentTarget) {
        return false;
      }

      const parsedDocument = new DOMParser().parseFromString(srcdoc, "text/html");
      const nextTarget = parsedDocument.querySelector(selector);
      if (!nextTarget) {
        return false;
      }

      const assetsChanged =
        getAssetSignature(currentTarget) !== getAssetSignature(nextTarget);
      patchNode(currentTarget, nextTarget);

      if (assetsChanged && typeof window.watchPreviewAssets === "function") {
        window.watchPreviewAssets(iframe, resizeFunction);
      }

      if (assetsChanged && typeof window.runPreviewResize === "function") {
        window.runPreviewResize(iframe, resizeFunction, true);
      } else {
        scheduleLightResize(iframe, resizeFunction);
      }

      return true;
    };
  }

  function initialize() {
    installOfficialCardPreviewProtection();
    installLivePreviewPerformanceFix();

    const panels = Array.from(document.querySelectorAll(EDITOR_PANEL_SELECTOR));
    panels.forEach((panel) => {
      getPanelState(panel);
      installDraftManager(panel);
      installBbcodeToolbars(panel);
      installRoleplayWordCounters(panel);
    });

    const activateCurrentPanel = () => {
      const activePanel = panels.find((panel) => panel.classList.contains("is-active"));
      if (activePanel) {
        activatePanel(activePanel);
      }
    };

    activateCurrentPanel();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target.classList.contains("is-active") &&
          isEditorPanel(mutation.target)
        ) {
          activatePanel(mutation.target);
        }
      }
    });

    panels.forEach((panel) => {
      observer.observe(panel, {
        attributes: true,
        attributeFilter: ["class"]
      });
    });

    window.addEventListener("beforeunload", () => {
      panels.forEach((panel) => {
        const state = getPanelState(panel);
        if (state.initialized) {
          window.clearTimeout(state.saveTimer);
          savePanel(panel, false);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

/* ============================================================
   CODE010 — LONG WAY LONG RIDE
============================================================ */
(() => {
  if (window.__DDS_LONG_WAY_LONG_RIDE_INSTALLED__) {
    return;
  }

  window.__DDS_LONG_WAY_LONG_RIDE_INSTALLED__ = true;

  const stylesheetUrls = [
    "https://guindaeyo.github.io/deepdshop/ddsh-lwlrz.css",
    "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500&family=Italianno&display=swap"
  ];

  const officialValues = {
    bg: "#fcfafa",
    nameColor: "#c9c9c9",
    textColor: "#b5b5b5",
    textDarkColor: "#a9a9a9",
    lineColor: "#d2d2d2",
    dateText: "cranky vampire",
    displayName: "Franklin",
    subtitle: "D. Bloodworth",
    sideWords: ["it's", "like", "a", "polaroid", "love"],
    image: "https://pbs.twimg.com/media/HOKMus1XAAAy_6U?format=jpg&name=large",
    imageX: 50,
    imageY: 50,
    imageZoom: 1,
    noFilter: false,
    grayscale: 1,
    contrast: 0.9,
    brightness: 1.05,
    quoteSmall: "la luna refleja",
    quoteBefore: "nuestro",
    quoteEm: "amor",
    quoteAfter: " (｡› ᵕ ‹｡)",
    roleplay: "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
    note: "เจ้าที่แรง - บลูเบอร์รี่ อาร์สยาม"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeCssUrl(value) {
    return String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/[\r\n]+/g, "");
  }

  function formatNumber(value, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return String(fallback);
    }
    return number.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function getEditableText(element) {
    if (!element) {
      return "";
    }
    return String(element.innerText || element.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n");
  }

  function bbcodeToPreviewHtml(value) {
    let text = escapeHtml(value);

    text = text
      .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1" alt="" style="max-width:100%;height:auto;">')
      .replace(/\[video=youtube\]([\s\S]*?)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=(small|medium|large)\]([\s\S]*?)\[\/size\]/gi, (_match, size, content) => {
        const sizes = { small: "0.82em", medium: "1em", large: "1.28em" };
        return `<span style="font-size:${sizes[size]}">${content}</span>`;
      })
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[(quote|code|hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi, '<span class="dds-bbcode-$1">$2</span>')
      .replace(/\[list(?:=1)?\]/gi, "<div>")
      .replace(/\[\/list\]/gi, "</div>")
      .replace(/\[\*\]/g, "<br>• ")
      .replace(/\[hr\]/gi, "<hr>")
      .replace(/\n/g, "<br>");

    return text;
  }

  function buildFilter(values) {
    if (values.noFilter) {
      return "none";
    }

    return `grayscale(${formatNumber(values.grayscale, 1)}) contrast(${formatNumber(values.contrast, 0.9)}) brightness(${formatNumber(values.brightness, 1.05)})`;
  }

  function buildMarkup(values, previewMode) {
    const roleplayContent = previewMode
      ? bbcodeToPreviewHtml(values.roleplay)
      : escapeHtml(values.roleplay);
    const noteContent = previewMode
      ? bbcodeToPreviewHtml(values.note)
      : escapeHtml(values.note);
    const sideWords = values.sideWords
      .map((word) => `<span>${escapeHtml(word)}</span>`)
      .join("");

    return `<div class="ddsh-lwlrz-wrap" style="--ddsh-lwlrz-bg:${escapeHtml(values.bg)};--ddsh-lwlrz-name:${escapeHtml(values.nameColor)};--ddsh-lwlrz-text:${escapeHtml(values.textColor)};--ddsh-lwlrz-text-dark:${escapeHtml(values.textDarkColor)};--ddsh-lwlrz-line:${escapeHtml(values.lineColor)};"><div class="ddsh-lwlrz-top"><span class="ddsh-lwlrz-top-block"></span><div class="ddsh-lwlrz-date">${escapeHtml(values.dateText)}</div><span class="ddsh-lwlrz-top-block"></span></div><div class="ddsh-lwlrz-top-line"></div><div class="ddsh-lwlrz-title-zone"><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-one">✧</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-two">＋</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-three">·</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-four">＋</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-five">✧</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-six">✧</span><span class="ddsh-lwlrz-spark ddsh-lwlrz-spark-seven">✧</span><div class="ddsh-lwlrz-title">${escapeHtml(values.displayName)}</div><div class="ddsh-lwlrz-subtitle">${escapeHtml(values.subtitle)} <span>✧</span></div></div><div class="ddsh-lwlrz-photo-area"><div class="ddsh-lwlrz-side-word">${sideWords}</div><div class="ddsh-lwlrz-photo-frame"><div class="ddsh-lwlrz-photo"><div class="ddsh-lwlrz-photo-image" style="--ddsh-lwlrz-image:url('${escapeCssUrl(values.image)}');--ddsh-lwlrz-image-x:${values.imageX}%;--ddsh-lwlrz-image-y:${values.imageY}%;--ddsh-lwlrz-image-zoom:${formatNumber(values.imageZoom, 1)};--ddsh-lwlrz-image-filter:${buildFilter(values)};"></div></div><span class="ddsh-lwlrz-photo-block ddsh-lwlrz-photo-block-one"></span><span class="ddsh-lwlrz-photo-block ddsh-lwlrz-photo-block-two"></span></div><div class="ddsh-lwlrz-photo-quote"><span>${escapeHtml(values.quoteSmall)}</span><strong>${escapeHtml(values.quoteBefore)}<em>${escapeHtml(values.quoteEm)}</em>${escapeHtml(values.quoteAfter)}</strong></div></div><div class="ddsh-lwlrz-under-photo"><span>✧</span><span>＋</span><span>·</span><span>＋</span><span>·</span><span>✧</span></div><div class="ddsh-lwlrz-content">${roleplayContent}</div><div class="ddsh-lwlrz-section-label"><strong>หมายเหตุ :</strong>${noteContent}</div></div><div class="fdreview-credit"><span></span></div>`;
  }

  function buildCopyCode(values) {
    return `<link href="https://guindaeyo.github.io/deepdshop/ddsh-lwlrz.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500&family=Italianno&display=swap" rel="stylesheet">${buildMarkup(values, false)}`;
  }

  function buildPreviewDocument(markup) {
    const links = stylesheetUrls
      .map((url) => `<link href="${url}" rel="stylesheet">`)
      .join("");

    return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${links}<style>html,body{margin:0;min-height:100%;background:#242424}body{padding:18px;overflow:hidden}.dds-lwl-preview-shell{width:100%;display:flex;align-items:flex-start;justify-content:center}.dds-preview-target{flex:0 0 auto;transform-origin:top center}.dds-bbcode-quote,.dds-bbcode-code,.dds-bbcode-hide,.dds-bbcode-spoiler{display:inline-block;padding:2px 5px;border:1px solid rgba(0,0,0,.12)}</style></head><body><div class="dds-lwl-preview-shell"><div class="dds-preview-target">${markup}</div></div></body></html>`;
  }

  function measureAndResize(iframe, isCard) {
    const doc = iframe?.contentDocument;
    const target = doc?.querySelector(".dds-preview-target");
    const root = doc?.querySelector(".ddsh-lwlrz-wrap") || target;
    const shell = doc?.querySelector(".dds-lwl-preview-shell");

    if (!iframe || !target || !root || !shell) {
      return;
    }

    target.style.transform = "none";
    shell.style.height = "auto";

    const rootRect = root.getBoundingClientRect();
    const naturalWidth = Math.max(rootRect.width, root.scrollWidth, root.offsetWidth, 1);
    const naturalHeight = Math.max(rootRect.height, root.scrollHeight, root.offsetHeight, 1);
    const stage = iframe.closest(".dds-roleplay-card-preview, .dds-editor-preview-column");
    const availableWidth = Math.max(1, (stage?.clientWidth || iframe.clientWidth || naturalWidth) - 28);
    let scale = Math.min(1, availableWidth / naturalWidth);

    if (isCard) {
      const availableHeight = Math.max(1, (stage?.clientHeight || 300) - 28);
      scale = Math.min(scale, availableHeight / naturalHeight);
    }

    const scaledHeight = Math.ceil(naturalHeight * scale);
    target.style.transform = `scale(${Math.max(0.01, scale)})`;
    shell.style.height = `${scaledHeight}px`;

    if (!isCard) {
      iframe.style.height = `${Math.max(720, scaledHeight + 40)}px`;
    }
  }

  function scheduleResize(iframe, isCard) {
    const run = () => measureAndResize(iframe, isCard);
    requestAnimationFrame(() => requestAnimationFrame(run));
    [80, 220, 500, 1000, 1800].forEach((delay) => window.setTimeout(run, delay));
  }

  const previewRenderStates = new WeakMap();

  function revealLongWayPreview(iframe) {
    iframe.classList.remove("dds-preview-loading");
    iframe.classList.add("dds-preview-ready");

    if (typeof window.revealPreview === "function") {
      window.revealPreview(iframe);
    }
  }

  function renderPreview(iframe, markup, isCard) {
    if (!iframe) {
      return;
    }

    const srcdoc = buildPreviewDocument(markup);
    const resize = () => {
      scheduleResize(iframe, isCard);
      revealLongWayPreview(iframe);
    };
    const state = previewRenderStates.get(iframe) || {
      srcdoc: "",
      loaded: false,
      token: 0
    };

    state.token += 1;
    const token = state.token;
    previewRenderStates.set(iframe, state);

    if (
      state.loaded &&
      iframe.contentDocument?.readyState !== "loading" &&
      typeof window.updateLoadedPreviewDocument === "function"
    ) {
      try {
        const updated = window.updateLoadedPreviewDocument(
          iframe,
          srcdoc,
          resize
        );

        if (updated) {
          state.srcdoc = srcdoc;
          revealLongWayPreview(iframe);
          return;
        }
      } catch (error) {
        console.warn("[DDS CODE010] preview patch failed; reloading srcdoc", error);
      }
    }

    iframe.classList.add("dds-preview-loading");
    iframe.classList.remove("dds-preview-ready");

    const onLoad = () => {
      const currentState = previewRenderStates.get(iframe);
      if (!currentState || currentState.token !== token) {
        return;
      }

      currentState.loaded = true;
      currentState.srcdoc = srcdoc;
      resize();
    };

    iframe.addEventListener("load", onLoad, { once: true });
    iframe.srcdoc = srcdoc;
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
  }

  function initialize() {
    const panel = document.querySelector('[data-panel="editor-code010"]');
    const cardIframe = document.querySelector("#roleplayCardPreview010");
    const editorIframe = document.querySelector("#longWayLongRidePreview");
    const generatedCode = document.querySelector("#generatedLongWayLongRideCode");
    const copyButton = document.querySelector("#copyGeneratedLongWayLongRideCode");
    const editButton = document.querySelector('[data-edit-code="code010"]');

    if (!panel || !cardIframe || !editorIframe || !generatedCode) {
      return;
    }

    const ids = {
      bg: "lwlBgColor",
      nameColor: "lwlNameColor",
      textColor: "lwlTextColor",
      textDarkColor: "lwlTextDarkColor",
      lineColor: "lwlLineColor",
      dateText: "lwlDateText",
      displayName: "lwlDisplayName",
      subtitle: "lwlSubtitle",
      image: "lwlImage",
      imageX: "lwlImageX",
      imageY: "lwlImageY",
      imageZoom: "lwlImageZoom",
      noFilter: "lwlNoFilter",
      grayscale: "lwlGrayscale",
      contrast: "lwlContrast",
      brightness: "lwlBrightness",
      quoteSmall: "lwlPhotoQuoteSmall",
      quoteBefore: "lwlPhotoQuoteBefore",
      quoteEm: "lwlPhotoQuoteEm",
      quoteAfter: "lwlPhotoQuoteAfter",
      note: "lwlNote"
    };

    function value(id, fallback = "") {
      const element = document.getElementById(id);
      return element ? element.value : fallback;
    }

    const sideWordsData = document.getElementById("lwlSideWordsData");
    const sideWordsList = document.getElementById("lwlSideWordsList");
    const addSideWordButton = document.getElementById("lwlAddSideWord");
    const resetFilterButton = document.getElementById("lwlResetFilter");
    let renderedSideWordsSource = null;

    function normalizeSideWords(words) {
      if (!Array.isArray(words)) {
        return [];
      }

      return words.map((word) => {
        const text = String(word ?? "");
        return /^#[0-9a-f]{3,8}$/i.test(text.trim()) ? "" : text;
      });
    }

    function parseSideWords(source) {
      const text = String(source ?? "").trim();
      if (!text) {
        return [];
      }

      try {
        return normalizeSideWords(JSON.parse(text));
      } catch (_error) {
        return text
          .split(/\r?\n/)
          .map((word) => word.trim())
          .filter((word) => word.length > 0);
      }
    }

    function readSideWordsData() {
      return parseSideWords(sideWordsData?.value || "");
    }

    function serializeSideWords(words) {
      return JSON.stringify(normalizeSideWords(words));
    }

    function writeSideWordsData(words, dispatch = false) {
      if (!sideWordsData) {
        return;
      }

      const nextValue = serializeSideWords(words);
      sideWordsData.value = nextValue;
      renderedSideWordsSource = nextValue;

      if (dispatch) {
        sideWordsData.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    function getSideWordsFromRows() {
      if (!sideWordsList) {
        return readSideWordsData();
      }

      return Array.from(
        sideWordsList.querySelectorAll("[data-lwl-side-word-input]")
      ).map((input) => input.value);
    }

    function createSideWordRow(word, index) {
      const row = document.createElement("div");
      row.className = "dds-side-word-row";
      row.innerHTML = `
        <label class="dds-field">
          <span>คำที่ ${index + 1}</span>
          <input
            type="text"
            value="${escapeHtml(word)}"
            data-lwl-side-word-input
            data-dds-no-save
            aria-label="คำด้านข้างรูปที่ ${index + 1}"
          >
        </label>
        <button
          class="dds-side-word-remove"
          type="button"
          data-lwl-remove-side-word
          aria-label="ลบคำที่ ${index + 1}"
          title="ลบคำนี้"
        >×</button>
      `;
      return row;
    }

    function renderSideWordRows(force = false) {
      if (!sideWordsList || !sideWordsData) {
        return;
      }

      const source = sideWordsData.value || "";
      if (!force && renderedSideWordsSource === source) {
        return;
      }

      const words = readSideWordsData();
      sideWordsList.replaceChildren(
        ...words.map((word, index) => createSideWordRow(word, index))
      );
      renderedSideWordsSource = source;
    }

    function syncSideWordsFromRows(dispatch = false) {
      writeSideWordsData(getSideWordsFromRows(), dispatch);
    }

    function readValues() {
      return {
        bg: value(ids.bg, officialValues.bg),
        nameColor: value(ids.nameColor, officialValues.nameColor),
        textColor: value(ids.textColor, officialValues.textColor),
        textDarkColor: value(ids.textDarkColor, officialValues.textDarkColor),
        lineColor: value(ids.lineColor, officialValues.lineColor),
        dateText: value(ids.dateText),
        displayName: value(ids.displayName),
        subtitle: value(ids.subtitle),
        sideWords: readSideWordsData(),
        image: value(ids.image),
        imageX: Number(value(ids.imageX, 50)),
        imageY: Number(value(ids.imageY, 50)),
        imageZoom: Number(value(ids.imageZoom, 100)) / 100,
        noFilter: Boolean(document.getElementById(ids.noFilter)?.checked),
        grayscale: Number(value(ids.grayscale, 1)),
        contrast: Number(value(ids.contrast, 0.9)),
        brightness: Number(value(ids.brightness, 1.05)),
        quoteSmall: value(ids.quoteSmall),
        quoteBefore: value(ids.quoteBefore),
        quoteEm: value(ids.quoteEm),
        quoteAfter: value(ids.quoteAfter),
        roleplay: getEditableText(document.getElementById("lwlRoleplayEditor")),
        note: value(ids.note)
      };
    }

    function syncOutputs() {
      const pairs = [
        ["lwlImageX", "lwlImageX", "%"],
        ["lwlImageY", "lwlImageY", "%"],
        ["lwlImageZoom", "lwlImageZoom", "%"]
      ];

      pairs.forEach(([inputId, outputKey, suffix]) => {
        const input = document.getElementById(inputId);
        const output = document.querySelector(`[data-position-output="${outputKey}"]`);
        if (input && output) {
          output.textContent = `${input.value}${suffix}`;
        }
      });

      ["Grayscale", "Contrast", "Brightness"].forEach((name) => {
        const input = document.getElementById(`lwl${name}`);
        const output = document.getElementById(`lwl${name}Output`);
        if (input && output) {
          output.textContent = formatNumber(input.value, input.value);
        }
      });

      const noFilter = document.getElementById("lwlNoFilter")?.checked;
      const filterControls = document.getElementById("lwlFilterControls");
      filterControls?.classList.toggle("is-disabled", Boolean(noFilter));
      filterControls?.querySelectorAll("input").forEach((input) => {
        input.disabled = Boolean(noFilter);
      });
    }

    function updateLongWayLongRide() {
      renderSideWordRows();
      syncOutputs();
      const values = readValues();
      generatedCode.value = buildCopyCode(values);
      renderPreview(editorIframe, buildMarkup(values, true), false);
    }

    window.updateLongWayLongRide = updateLongWayLongRide;

    const colorPairs = [
      ["lwlBgColorPicker", "lwlBgColor"],
      ["lwlNameColorPicker", "lwlNameColor"],
      ["lwlTextColorPicker", "lwlTextColor"],
      ["lwlTextDarkColorPicker", "lwlTextDarkColor"],
      ["lwlLineColorPicker", "lwlLineColor"]
    ];

    colorPairs.forEach(([pickerId, textId]) => {
      const picker = document.getElementById(pickerId);
      const textInput = document.getElementById(textId);

      picker?.addEventListener("input", () => {
        if (textInput) {
          textInput.value = picker.value;
          textInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      textInput?.addEventListener("input", () => {
        if (picker && /^#[0-9a-f]{6}$/i.test(textInput.value.trim())) {
          picker.value = textInput.value.trim();
        }
      });
    });

    renderSideWordRows(true);

    sideWordsList?.addEventListener("input", (event) => {
      if (!event.target.closest("[data-lwl-side-word-input]")) {
        return;
      }

      syncSideWordsFromRows(true);
    });

    sideWordsList?.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-lwl-remove-side-word]");
      if (!removeButton) {
        return;
      }

      removeButton.closest(".dds-side-word-row")?.remove();
      Array.from(sideWordsList.querySelectorAll(".dds-side-word-row")).forEach(
        (row, index) => {
          const label = row.querySelector(".dds-field > span");
          const input = row.querySelector("[data-lwl-side-word-input]");
          const button = row.querySelector("[data-lwl-remove-side-word]");
          if (label) label.textContent = `คำที่ ${index + 1}`;
          if (input) input.setAttribute("aria-label", `คำด้านข้างรูปที่ ${index + 1}`);
          if (button) {
            button.setAttribute("aria-label", `ลบคำที่ ${index + 1}`);
          }
        }
      );
      syncSideWordsFromRows(true);
      updateLongWayLongRide();
    });

    addSideWordButton?.addEventListener("click", () => {
      if (!sideWordsList) {
        return;
      }

      const nextIndex = sideWordsList.querySelectorAll(".dds-side-word-row").length;
      const row = createSideWordRow("", nextIndex);
      sideWordsList.appendChild(row);
      syncSideWordsFromRows(true);
      updateLongWayLongRide();
      row.querySelector("[data-lwl-side-word-input]")?.focus();
    });

    resetFilterButton?.addEventListener("click", () => {
      const noFilter = document.getElementById("lwlNoFilter");
      const grayscale = document.getElementById("lwlGrayscale");
      const contrast = document.getElementById("lwlContrast");
      const brightness = document.getElementById("lwlBrightness");

      if (noFilter) noFilter.checked = false;
      if (grayscale) grayscale.value = String(officialValues.grayscale);
      if (contrast) contrast.value = String(officialValues.contrast);
      if (brightness) brightness.value = String(officialValues.brightness);

      syncOutputs();
      updateLongWayLongRide();

      // One bubbled input event is enough to trigger the shared draft autosave.
      grayscale?.dispatchEvent(new Event("input", { bubbles: true }));

      if (typeof window.showToast === "function") {
        window.showToast("คืนค่าฟิลเตอร์เริ่มต้นแล้ว");
      }
    });

    panel.addEventListener("input", updateLongWayLongRide);
    panel.addEventListener("change", updateLongWayLongRide);

    copyButton?.addEventListener("click", () => {
      updateLongWayLongRide();
      copyText(generatedCode.value)
        .then(() => {
          if (typeof window.showToast === "function") {
            window.showToast("คัดลอกโค้ด CODE010 แล้ว");
          }
        })
        .catch(() => {
          if (typeof window.showToast === "function") {
            window.showToast("คัดลอกโค้ดไม่สำเร็จ");
          }
        });
    });

    function openCode010Editor() {
      document.body.classList.add("dds-editor-mode");
      document.querySelectorAll("[data-panel]").forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === panel);
      });
      document.querySelectorAll("[data-page]").forEach((button) => {
        const active = button.dataset.page === "roleplay";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-current", active ? "page" : "false");
      });
      const pageNumber = document.querySelector("#currentPageNumber");
      if (pageNumber) {
        pageNumber.textContent = "01";
      }
      document.title = "― www. deep deep sleep code shop .com ―";
      history.replaceState(null, "", "#editor-code010");
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(updateLongWayLongRide);
    }

    editButton?.addEventListener("click", openCode010Editor);

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#editor-code010") {
        openCode010Editor();
      }
    });

    if (window.location.hash === "#editor-code010") {
      queueMicrotask(openCode010Editor);
    }

    panel.querySelector(".dds-back-button")?.addEventListener("click", () => {
      requestAnimationFrame(() => {
        renderPreview(cardIframe, buildMarkup(officialValues, true), true);
      });
    });

    document.querySelectorAll('[data-page="roleplay"], [data-go="roleplay"]').forEach((button) => {
      button.addEventListener("click", () => {
        requestAnimationFrame(() => {
          renderPreview(cardIframe, buildMarkup(officialValues, true), true);
        });
      });
    });

    renderPreview(cardIframe, buildMarkup(officialValues, true), true);
    updateLongWayLongRide();

    window.addEventListener("resize", () => {
      scheduleResize(cardIframe, true);
      if (panel.classList.contains("is-active")) {
        scheduleResize(editorIframe, false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

/* ==================================================
   CLEAN PASTE V2 — MICROSOFT WORD / WEB
   ดัก paste ใน capture phase ก่อนระบบเดิม เพื่อไม่ให้ HTML,
   inline font-size, สี และพื้นหลังจาก Word เข้าสู่ editor
   ================================================== */
(() => {
  if (window.__DDS_CLEAN_PASTE_V2_INSTALLED__) {
    return;
  }

  window.__DDS_CLEAN_PASTE_V2_INSTALLED__ = true;

  const EDITOR_SELECTOR = '.dds-rich-editor[contenteditable="true"]';

  function normalizeText(value) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[\u2028\u2029]/g, "\n");
  }

  function appendPlainText(container, value) {
    const text = normalizeText(value);
    const lines = text.split("\n");
    let lastNode = null;

    lines.forEach((line, index) => {
      if (index > 0) {
        const br = document.createElement("br");
        container.appendChild(br);
        lastNode = br;
      }

      if (line) {
        const textNode = document.createTextNode(line);
        container.appendChild(textNode);
        lastNode = textNode;
      }
    });

    if (!lastNode) {
      lastNode = document.createTextNode("");
      container.appendChild(lastNode);
    }

    return lastNode;
  }

  function insertTextAtSelection(editor, value) {
    const selection = window.getSelection();
    let range = null;

    editor.focus({ preventScroll: true });

    if (selection && selection.rangeCount > 0) {
      const selectedRange = selection.getRangeAt(0);
      if (editor.contains(selectedRange.commonAncestorContainer)) {
        range = selectedRange;
      }
    }

    if (!range) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();

    const fragment = document.createDocumentFragment();
    const lastNode = appendPlainText(fragment, value);
    range.insertNode(fragment);

    range.setStartAfter(lastNode);
    range.collapse(true);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const inputEvent = typeof InputEvent === "function"
      ? new InputEvent("input", {
          bubbles: true,
          inputType: "insertFromPaste",
          data: normalizeText(value)
        })
      : new Event("input", { bubbles: true });

    editor.dispatchEvent(inputEvent);
  }

  function getPlainEditorText(editor) {
    return normalizeText(
      typeof editor.innerText === "string"
        ? editor.innerText
        : editor.textContent
    );
  }

  function hasImportedFormatting(editor) {
    return Boolean(
      editor.querySelector(
        "font, span, p, div, section, article, h1, h2, h3, h4, h5, h6, " +
        "table, tbody, thead, tfoot, tr, td, th, ul, ol, li, blockquote, " +
        "[style], [class^='Mso'], [class*=' Mso']"
      )
    );
  }

  function cleanExistingImportedFormatting(editor) {
    if (
      !editor ||
      document.activeElement === editor ||
      !hasImportedFormatting(editor)
    ) {
      return;
    }

    const plainText = getPlainEditorText(editor);
    editor.replaceChildren();
    appendPlainText(editor, plainText);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // capture=true ทำให้ทำงานก่อน paste listener เดิมของระบบหลัก
  document.addEventListener(
    "paste",
    (event) => {
      const target = event.target;
      const editor = target instanceof Element
        ? target.closest(EDITOR_SELECTOR)
        : null;

      if (!editor) {
        return;
      }

      const clipboard = event.clipboardData || window.clipboardData;
      if (!clipboard) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      insertTextAtSelection(editor, clipboard.getData("text/plain"));
    },
    true
  );

  function initializeEditors() {
    document.querySelectorAll(EDITOR_SELECTOR).forEach((editor) => {
      editor.dataset.ddsPlainPasteInstalled = "v2";
    });

    // ล้าง style จากแบบร่างเก่าที่เคยวางจาก Word มาแล้ว
    [0, 250, 900].forEach((delay) => {
      window.setTimeout(() => {
        document.querySelectorAll(EDITOR_SELECTOR).forEach(
          cleanExistingImportedFormatting
        );
      }, delay);
    });

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches(EDITOR_SELECTOR)) {
            node.dataset.ddsPlainPasteInstalled = "v2";
          }

          node.querySelectorAll?.(EDITOR_SELECTOR).forEach((editor) => {
            editor.dataset.ddsPlainPasteInstalled = "v2";
          });
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeEditors, {
      once: true
    });
  } else {
    initializeEditors();
  }
})();

/* ============================================================
   FAST CATALOGUE PREVIEWS — FOR ROLEPLAY / FOR PROFILE
   - เร่งการสร้างพรีวิวเฉพาะการ์ดหน้ารวม
   - สร้างใบที่อยู่ใกล้หน้าจอทันที
   - ใบด้านล่างเตรียมข้อมูลไว้และค่อยสร้างเมื่อเลื่อนเข้าใกล้
   - ไม่สร้าง iframe เดิมซ้ำเมื่อกลับเข้าหมวด
============================================================ */
(() => {
  if (window.__DDS_ROLE_PROFILE_FAST_CATALOGUE__) {
    return;
  }

  window.__DDS_ROLE_PROFILE_FAST_CATALOGUE__ = true;

  const CARD_ID_PATTERN = /^(?:roleplayCardPreview00[1-9]|profileCardPreview00[1-4])$/;
  const cardStates = new WeakMap();
  const preloadLinks = new Set();
  const preloadImages = new Map();

  const originalQueuePreviewDocument =
    typeof window.queuePreviewDocument === "function"
      ? window.queuePreviewDocument
      : null;

  if (!originalQueuePreviewDocument) {
    return;
  }

  function isFastCatalogueCard(iframe) {
    return Boolean(
      iframe &&
      CARD_ID_PATTERN.test(iframe.id || "") &&
      iframe.classList?.contains("dds-roleplay-card-preview-frame")
    );
  }

  function getCardState(iframe) {
    let state = cardStates.get(iframe);

    if (!state) {
      state = {
        pendingSrcdoc: "",
        currentSrcdoc: "",
        resizeFunction: null,
        timer: null,
        renderToken: 0,
        status: "idle",
        observed: false
      };

      cardStates.set(iframe, state);
    }

    return state;
  }

  function isPanelActive(iframe) {
    return Boolean(
      iframe.closest("[data-panel]")?.classList.contains("is-active")
    );
  }

  function isNearViewport(iframe) {
    const rect = iframe.getBoundingClientRect();
    const margin = 780;

    return (
      rect.bottom >= -margin &&
      rect.top <= window.innerHeight + margin
    );
  }

  function extractAssetUrls(srcdoc) {
    const stylesheets = [];
    const images = [];
    const parsed = new DOMParser().parseFromString(srcdoc, "text/html");

    parsed.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
      const href = link.getAttribute("href")?.trim();
      if (href) {
        stylesheets.push(href);
      }
    });

    parsed.querySelectorAll("img[src]").forEach((image) => {
      const src = image.getAttribute("src")?.trim();
      if (src) {
        images.push(src);
      }
    });

    parsed.querySelectorAll("[style]").forEach((element) => {
      const styleText = element.getAttribute("style") || "";
      const pattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
      let match;

      while ((match = pattern.exec(styleText))) {
        if (match[2]) {
          images.push(match[2]);
        }
      }
    });

    return {
      stylesheets: [...new Set(stylesheets)],
      images: [...new Set(images)]
    };
  }

  function warmAssets(iframe, srcdoc) {
    const { stylesheets, images } = extractAssetUrls(srcdoc);

    stylesheets.forEach((href) => {
      if (preloadLinks.has(href)) {
        return;
      }

      preloadLinks.add(href);
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "style";
      link.href = href;
      link.dataset.ddsCataloguePreload = "style";
      document.head.appendChild(link);
    });

    /*
     * อุ่นเฉพาะรูปของการ์ดที่อยู่ใกล้จอ และจำกัดจำนวน
     * เพื่อไม่ให้รูปด้านล่างแย่งเน็ตกับการ์ดแถวแรก
     */
    if (!isNearViewport(iframe)) {
      return;
    }

    images.slice(0, 3).forEach((src) => {
      if (preloadImages.has(src)) {
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.src = src;
      preloadImages.set(src, image);
    });
  }

  function resizeAndReveal(iframe, resizeFunction) {
    window.requestAnimationFrame(() => {
      if (typeof resizeFunction === "function") {
        resizeFunction(iframe);
      }

      window.requestAnimationFrame(() => {
        if (typeof resizeFunction === "function") {
          resizeFunction(iframe);
        }

        if (typeof window.revealPreview === "function") {
          window.revealPreview(iframe);
        } else {
          iframe.classList.remove("dds-preview-loading");
          iframe.classList.add("dds-preview-ready");
        }
      });
    });
  }

  function cancelCoreQueue(iframe) {
    if (typeof window.getPreviewState !== "function") {
      return;
    }

    const state = window.getPreviewState(iframe);

    ["timer", "performanceTimer", "resizeTimer", "assetTimer"].forEach(
      (key) => {
        if (state?.[key]) {
          window.clearTimeout(state[key]);
          state[key] = null;
        }
      }
    );

    if (state) {
      state.pendingSrcdoc = "";
    }
  }

  function renderCard(iframe) {
    const state = getCardState(iframe);
    const srcdoc = state.pendingSrcdoc;

    if (!srcdoc || !isPanelActive(iframe)) {
      return;
    }

    if (state.currentSrcdoc === srcdoc) {
      resizeAndReveal(iframe, state.resizeFunction);
      return;
    }

    cancelCoreQueue(iframe);
    state.currentSrcdoc = srcdoc;
    state.status = "loading";
    state.renderToken += 1;

    const token = state.renderToken;

    iframe.setAttribute("loading", "eager");
    iframe.classList.add("dds-preview-loading");
    warmAssets(iframe, srcdoc);

    iframe.addEventListener(
      "load",
      () => {
        if (token !== state.renderToken) {
          return;
        }

        state.status = "ready";
        resizeAndReveal(iframe, state.resizeFunction);
      },
      { once: true }
    );

    iframe.srcdoc = srcdoc;
  }

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                renderCard(entry.target);
              }
            });
          },
          {
            root: null,
            rootMargin: "780px 0px 780px 0px",
            threshold: 0.01
          }
        )
      : null;

  function queueFastCard(iframe, srcdoc, resizeFunction) {
    const state = getCardState(iframe);

    state.pendingSrcdoc = srcdoc;
    state.resizeFunction = resizeFunction;
    iframe.setAttribute("loading", "eager");

    warmAssets(iframe, srcdoc);

    if (!state.observed && observer) {
      state.observed = true;
      observer.observe(iframe);
    }

    window.clearTimeout(state.timer);

    /*
     * หน่วงสั้นมากเพื่อรวมคำสั่งซ้ำของ PAGE OF ONE
     * และการเรียก initializer ซ้ำ ให้เขียน srcdoc เพียงรอบเดียว
     */
    state.timer = window.setTimeout(
      () => {
        state.timer = null;

        if (!observer || isNearViewport(iframe)) {
          renderCard(iframe);
        }
      },
      iframe.id === "roleplayCardPreview001" ? 24 : 0
    );
  }

  window.queuePreviewDocument = function fastCatalogueQueue(
    iframe,
    srcdoc,
    resizeFunction
  ) {
    if (!isFastCatalogueCard(iframe)) {
      return originalQueuePreviewDocument.call(
        this,
        iframe,
        srcdoc,
        resizeFunction
      );
    }

    /* การ์ดหน้ารวมต้องไม่ถูกค่าจากหน้า EDIT เขียนทับ */
    if (document.body.classList.contains("dds-editor-mode")) {
      return true;
    }

    if (!isPanelActive(iframe)) {
      return originalQueuePreviewDocument.call(
        this,
        iframe,
        srcdoc,
        resizeFunction
      );
    }

    queueFastCard(iframe, srcdoc, resizeFunction);
    return true;
  };

  const initializers = {
    roleplay: [
      "updatePageOfOne",
      "updateWeirdo",
      "updateHihi",
      "updateUuiaa",
      "updateComma",
      "updateNewRules",
      "updateLoveSong",
      "updateDumbDumber",
      "updateHigherHeaven"
    ],
    profile: [
      "updatePolaroidLove",
      "updateMoodboard",
      "updateFortyOne",
      "updateNothinBoutMe"
    ]
  };

  function initializeCatalogue(pageName) {
    const panel = document.querySelector(`[data-panel="${pageName}"]`);

    if (!panel?.classList.contains("is-active")) {
      return;
    }

    (initializers[pageName] || []).forEach((functionName) => {
      const initializer = window[functionName];

      if (typeof initializer === "function") {
        initializer();
      }
    });

    panel
      .querySelectorAll(".dds-roleplay-card-preview-frame")
      .forEach((iframe) => {
        iframe.setAttribute("loading", "eager");

        const state = cardStates.get(iframe);
        if (state?.pendingSrcdoc && isNearViewport(iframe)) {
          renderCard(iframe);
        } else if (iframe.classList.contains("dds-preview-ready")) {
          resizeAndReveal(iframe, state?.resizeFunction);
        }
      });
  }

  function scheduleCatalogue(pageName) {
    window.requestAnimationFrame(() => {
      initializeCatalogue(pageName);
    });
  }

  document
    .querySelectorAll(
      '[data-panel="roleplay"] .dds-roleplay-card-preview-frame, ' +
      '[data-panel="profile"] .dds-roleplay-card-preview-frame'
    )
    .forEach((iframe) => {
      iframe.setAttribute("loading", "eager");
    });

  document.addEventListener("click", (event) => {
    if (event.target.closest('[data-go="roleplay"], [data-page="roleplay"]')) {
      scheduleCatalogue("roleplay");
    }

    if (event.target.closest('[data-go="profile"], [data-page="profile"]')) {
      scheduleCatalogue("profile");
    }
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#roleplay") {
      scheduleCatalogue("roleplay");
    }

    if (window.location.hash === "#profile") {
      scheduleCatalogue("profile");
    }
  });

  if (window.location.hash === "#roleplay") {
    scheduleCatalogue("roleplay");
  } else if (window.location.hash === "#profile") {
    scheduleCatalogue("profile");
  }
})();


/* ============================================================
   FOR REVIEW — REVIEW CODE002 / LO$ER=LO♡ER
   เพิ่มแบบแยกส่วนบนฐานเดิม ไม่แทนที่ REVIEW CODE001
============================================================ */
(() => {
  const PANEL_NAME = "editor-review002";
  const CSS_URL = "https://guindaeyo.github.io/deepdshop/ddsh-revmus.css";
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Anton&family=Bai+Jamjuree:wght@300;400;500;600;700&family=Italianno&display=swap";

  const officialValues = {
    bg: "#ffffff",
    main: "#b0120a",
    border: "#000000",
    text: "#000000",
    youtubeId: "JzODRUBBXpc",
    lyricOne: "I'm a loser, I'm a loser",
    lyricTwo: "Lover with a dollar sign Is a loser",
    recommender: "Franklin D. Bloodworth",
    trackTitle: "LO$ER=LO♡ER",
    artist: "TOMORROW X TOGETHER",
    reviewTitle: "ต่อให้โลกแต่ก็ช่างมันปะไร",
    reviewText: "ลองมารีวิวเพลงเก่า ๆ ของทีเร้กแต่ขึ้นหิ่งบ้าง แพ้รักเป็นอีกเพลงที่ดีมาก ๆ สำหรับนี่ รองจากพระมหาอ้อกวันน่ะนะ เป็นเพลงที่ตีหัวนี่ได้เต็ม ๆ โดนตกเข้าด้อมเลยล่ะ แม้ว่าจะไม่ได้ตามตั้งแต่แรกแต่ดีใจมากที่ได้เจอทีเร้ก ชอบเนื้อหาเพลงด้วยที่ต่อให้เราจะเป็นพวกจี้แพ้ในสังคมแต่เพื่อเธออะไรก็ยอมมาก ไปบ้าในโลกนี้กันเถอะ ฟีลพี่เสกโลโซป่ะ 555555555",
    reviewFooter: "\"Run\" 절대 뒤돌아보지 마 두 손엔 hunnit bands I'm a loser",
    youtubeLink: "https://www.youtube.com/watch?v=JzODRUBBXpc",
    spotifyLink: "https://open.spotify.com/track/21aOLk12MksET8AsbU0SI6?si=5e5e47a39f2d4618",
    appleLink: "https://music.apple.com/us/song/lo%24er-lo-er/1580999419"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
  }

  function htmlLines(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
  }

  function extractYoutubeId(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /youtube\.com\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return text.replace(/[^A-Za-z0-9_-]/g, "");
  }

  function buildMarkup(values, previewMode = false) {
    const videoId = extractYoutubeId(values.youtubeId);
    const videoSrc = videoId
      ? `https://www.youtube.com/embed/${escapeAttribute(videoId)}?autoplay=${previewMode ? "0" : "1"}&controls=1&loop=1&playlist=${escapeAttribute(videoId)}&playsinline=1&rel=0&modestbranding=1`
      : "about:blank";

    return `<div class="ddsh-revmus-wrap" style="--ddsh-revmus-bg:${escapeAttribute(values.bg)};--ddsh-revmus-main:${escapeAttribute(values.main)};--ddsh-revmus-border:${escapeAttribute(values.border)};--ddsh-revmus-text:${escapeAttribute(values.text)};"><div class="ddsh-revmus-kicker">A song <span>picked for you</span></div><div class="ddsh-revmus-heading"><div class="ddsh-revmus-title">GIVE</div><div class="ddsh-revmus-script">it a</div><div class="ddsh-revmus-subtitle">listen</div></div><div class="ddsh-revmus-hearts"><svg viewBox="0 0 220 125" aria-hidden="true"><g transform="translate(4 10) rotate(-8 55 55)"><path d="M55 101 C46 92 16 69 10 47 C4 25 18 11 36 13 C47 14 53 21 57 29 C62 18 72 11 84 13 C103 16 111 33 104 51 C96 71 70 92 55 101Z"></path><path class="ddsh-revmus-heart-inner" d="M55 91 C45 81 25 65 21 49 C17 36 25 25 37 26 C47 26 53 33 57 41 C62 32 69 26 80 27 C92 28 98 39 94 51 C89 65 69 82 55 91Z"></path><text x="55" y="60">YOU</text></g><g transform="translate(102 3) rotate(7 55 55)"><path d="M55 101 C46 92 16 69 10 47 C4 25 18 11 36 13 C47 14 53 21 57 29 C62 18 72 11 84 13 C103 16 111 33 104 51 C96 71 70 92 55 101Z"></path><path class="ddsh-revmus-heart-inner" d="M55 91 C45 81 25 65 21 49 C17 36 25 25 37 26 C47 26 53 33 57 41 C62 32 69 26 80 27 C92 28 98 39 94 51 C89 65 69 82 55 91Z"></path><text x="55" y="60">ME</text></g><g transform="translate(-34 6)"><path class="ddsh-revmus-bow" d="M123 15 C113 -1 124 -7 134 8 C142 20 144 31 142 39 M144 31 C153 14 170 4 178 12 C185 20 170 32 151 37 M145 38 C159 39 185 49 187 59 C188 68 169 62 150 44 M142 40 C132 53 119 69 113 63 C106 55 123 44 139 38 M142 39 C142 57 139 70 135 82"></path></g></svg></div><div class="ddsh-revmus-video-frame"><div class="ddsh-revmus-video"><iframe src="${videoSrc}" title="YouTube video" loading="${previewMode ? "lazy" : "eager"}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><span class="ddsh-revmus-star ddsh-revmus-star-right"></span></div><div class="ddsh-revmus-meta"><div class="ddsh-revmus-lyric-area"><div class="ddsh-revmus-lyric">${escapeHtml(values.lyricOne)}<br>${escapeHtml(values.lyricTwo)}</div><div class="ddsh-revmus-recommender"><div class="ddsh-revmus-swatches"><span class="ddsh-revmus-swatch-primary"></span><span class="ddsh-revmus-swatch-secondary"></span></div><div class="ddsh-revmus-recommender-name"><span>RECOMMENDED BY</span>${escapeHtml(values.recommender)}</div></div></div><div class="ddsh-revmus-track"><strong>${escapeHtml(values.trackTitle)}</strong><span>${escapeHtml(values.artist)}</span></div></div><div class="ddsh-revmus-review"><div class="ddsh-revmus-review-title">${escapeHtml(values.reviewTitle)}</div><div class="ddsh-revmus-review-text">${htmlLines(values.reviewText)}</div><div class="ddsh-revmus-review-footer">${htmlLines(values.reviewFooter)}</div></div><div class="ddsh-revmus-links"><a class="ddsh-revmus-link" href="${escapeAttribute(values.youtubeLink)}" target="_blank" rel="noopener noreferrer"><span class="ddsh-revmus-link-icon">▶</span><span class="ddsh-revmus-link-text"><small>WATCH ON</small>YOUTUBE</span></a><a class="ddsh-revmus-link" href="${escapeAttribute(values.spotifyLink)}" target="_blank" rel="noopener noreferrer"><span class="ddsh-revmus-link-icon">◉</span><span class="ddsh-revmus-link-text"><small>LISTEN ON</small>SPOTIFY</span></a><a class="ddsh-revmus-link" href="${escapeAttribute(values.appleLink)}" target="_blank" rel="noopener noreferrer"><span class="ddsh-revmus-link-icon">♪</span><span class="ddsh-revmus-link-text"><small>LISTEN ON</small>APPLE MUSIC</span></a></div><div class="ddsh-revmus-progress"><span></span></div></div><div class="ddshopfz-credit01"><span></span></div>`;
  }

  function buildCopyCode(values) {
    return `<link href="${CSS_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_URL}" rel="stylesheet">${buildMarkup(values, false)}`;
  }

  function buildPreviewDocument(markup, mode) {
    if (mode === "card") {
      /*
       * การ์ด FOR REVIEW ใช้แคนวาสเดิม 1300×920 เหมือน REVIEW CODE001
       * ไม่ย่อ/ขยายตัวโค้ดภายใน ไม่เปลี่ยนสัดส่วน แค่จัดชิ้นงานให้อยู่กึ่งกลางแคนวาส
       */
      return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="${CSS_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_URL}" rel="stylesheet"><style>html,body{margin:0;width:1300px;min-width:1300px;max-width:1300px;height:920px;min-height:920px;max-height:920px;background:#242424;overflow:hidden}.dds-music-preview-shell{position:relative;width:1300px;height:920px;overflow:hidden}.dds-music-preview-target{position:absolute;inset:0;width:1300px;height:920px;transform:translate(0,0);transform-origin:0 0}.dds-music-preview-target>.ddsh-revmus-wrap{margin:0!important}</style></head><body data-preview-mode="card"><div class="dds-music-preview-shell"><div class="dds-preview-target dds-music-preview-target">${markup}</div></div><script>(()=>{const shell=document.querySelector('.dds-music-preview-shell');const target=document.querySelector('.dds-music-preview-target');const wrap=document.querySelector('.ddsh-revmus-wrap');let raf=0;function centerOnly(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(!shell||!target||!wrap)return;target.style.transform='translate(0px,0px)';const shellRect=shell.getBoundingClientRect();const wrapRect=wrap.getBoundingClientRect();const dx=(shellRect.left+shellRect.width/2)-(wrapRect.left+wrapRect.width/2);const dy=(shellRect.top+shellRect.height/2)-(wrapRect.top+wrapRect.height/2);target.style.transform='translate('+dx+'px,'+dy+'px)';window.frameElement?.classList.add('dds-preview-ready');window.frameElement?.classList.remove('dds-preview-loading')})}window.addEventListener('load',centerOnly,{once:true});document.fonts?.ready?.then(centerOnly);if(window.ResizeObserver&&wrap)new ResizeObserver(centerOnly).observe(wrap);setTimeout(centerOnly,100);setTimeout(centerOnly,500);centerOnly()})();<\/script></body></html>`;
    }

    return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="${CSS_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_URL}" rel="stylesheet"><style>html,body{margin:0;width:100%;min-height:100%;background:#242424;overflow:hidden}.dds-music-preview-shell{position:relative;width:100%;min-height:100%;overflow:hidden}.dds-music-preview-target{position:absolute!important;top:14px!important;left:0;right:auto!important;bottom:auto!important;width:max-content!important;min-width:0!important;max-width:none!important;height:auto!important;will-change:transform}.dds-music-preview-target>.ddsh-revmus-wrap{margin:0!important;flex:none!important}</style></head><body data-preview-mode="editor"><div class="dds-music-preview-shell"><div class="dds-preview-target dds-music-preview-target">${markup}</div></div><script>(()=>{const shell=document.querySelector('.dds-music-preview-shell');const target=document.querySelector('.dds-music-preview-target');const wrap=document.querySelector('.ddsh-revmus-wrap');let raf=0;function set(name,value){target.style.setProperty(name,value,'important')}function fit(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(!target||!wrap||!shell)return;set('transform','none');set('transform-origin','top left');set('left','0px');set('top','14px');set('width','max-content');set('height','auto');const rect=wrap.getBoundingClientRect();const w=Math.max(Math.ceil(wrap.scrollWidth),Math.ceil(wrap.offsetWidth),Math.ceil(rect.width),1);const h=Math.max(Math.ceil(wrap.scrollHeight),Math.ceil(wrap.offsetHeight),Math.ceil(rect.height),1);const vw=Math.max(shell.clientWidth,document.documentElement.clientWidth,1);const scale=Math.max(Math.min((vw-28)/w,1),.08);const x=Math.max(14,Math.round((vw-(w*scale))/2));set('width',w+'px');set('height',h+'px');set('left',x+'px');set('transform-origin','top left');set('transform','scale('+scale+')');const scaledHeight=Math.ceil(h*scale+28);shell.style.height=scaledHeight+'px';document.body.style.height=scaledHeight+'px';document.documentElement.style.height=scaledHeight+'px';if(window.frameElement){window.frameElement.style.height=Math.max(720,scaledHeight)+'px';window.frameElement.classList.add('dds-preview-ready');window.frameElement.classList.remove('dds-preview-loading')}})}window.addEventListener('load',fit);window.addEventListener('resize',fit);document.fonts?.ready?.then(fit);if(window.ResizeObserver&&wrap)new ResizeObserver(fit).observe(wrap);if(window.MutationObserver&&wrap)new MutationObserver(fit).observe(wrap,{childList:true,subtree:true,characterData:true});setTimeout(fit,80);setTimeout(fit,350);window.__ddsFitMusic=fit;fit()})();<\/script></body></html>`;
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
  }

  function initializeMusicReview() {
    if (window.__DDS_MUSIC_REVIEW_002_INSTALLED__) return;

    const panel = document.querySelector(`[data-panel="${PANEL_NAME}"]`);
    const cardIframe = document.querySelector("#reviewCardPreview002");
    const editorIframe = document.querySelector("#musicReviewPreview");
    const generatedCode = document.querySelector("#generatedMusicReviewCode");
    const copyButton = document.querySelector("#copyGeneratedMusicReviewCode");
    const editButton = document.querySelector('[data-edit-review="review002"]');

    if (!panel || !cardIframe || !editorIframe || !generatedCode || !editButton) return;
    window.__DDS_MUSIC_REVIEW_002_INSTALLED__ = true;

    const ids = {
      bg: "musicReviewBgColor",
      main: "musicReviewMainColor",
      border: "musicReviewBorderColor",
      text: "musicReviewTextColor",
      youtubeId: "musicReviewYoutubeId",
      lyricOne: "musicReviewLyricOne",
      lyricTwo: "musicReviewLyricTwo",
      recommender: "musicReviewRecommender",
      trackTitle: "musicReviewTrackTitle",
      artist: "musicReviewArtist",
      reviewTitle: "musicReviewTitle",
      reviewText: "musicReviewText",
      reviewFooter: "musicReviewFooter",
      youtubeLink: "musicReviewYoutubeLink",
      spotifyLink: "musicReviewSpotifyLink",
      appleLink: "musicReviewAppleLink"
    };

    function value(id, fallback = "") {
      return document.getElementById(id)?.value ?? fallback;
    }

    function readValues() {
      return Object.fromEntries(
        Object.entries(ids).map(([key, id]) => [key, value(id, officialValues[key] || "")])
      );
    }

    function renderIframe(iframe, markup, mode) {
      const srcdoc = buildPreviewDocument(markup, mode);
      if (iframe.dataset.ddsMusicSrcdoc === srcdoc) return;

      /* การ์ด REVIEW CODE002 ต้องโหลดเอกสารใหม่ทั้งชุดเสมอเมื่อเวอร์ชันเปลี่ยน
         เพื่อให้ CSS/สคริปต์จัดกึ่งกลางใน <head> ถูกอัปเดต ไม่ใช้ตัว patch เฉพาะเนื้อหา */
      if (mode === "card") {
        iframe.dataset.ddsMusicSrcdoc = srcdoc;
        iframe.classList.add("dds-preview-loading");
        iframe.classList.remove("dds-preview-ready");
        iframe.srcdoc = srcdoc;
        return;
      }

      const previewDocument = iframe.contentDocument;
      if (
        previewDocument &&
        previewDocument.readyState !== "loading" &&
        previewDocument.querySelector(".dds-music-preview-target") &&
        typeof window.updateLoadedPreviewDocument === "function"
      ) {
        try {
          const patched = window.updateLoadedPreviewDocument(
            iframe,
            srcdoc,
            () => iframe.contentWindow?.__ddsFitMusic?.()
          );

          if (patched) {
            iframe.dataset.ddsMusicSrcdoc = srcdoc;
            iframe.contentWindow?.__ddsFitMusic?.();
            return;
          }
        } catch (error) {
          console.warn("[DDS REVIEW002] preview patch failed; reloading srcdoc", error);
        }
      }

      iframe.dataset.ddsMusicSrcdoc = srcdoc;
      iframe.classList.add("dds-preview-loading");
      iframe.classList.remove("dds-preview-ready");
      iframe.srcdoc = srcdoc;
    }

    function updateMusicReview() {
      const values = readValues();
      generatedCode.value = buildCopyCode(values);
      renderIframe(editorIframe, buildMarkup(values, true), "editor");
    }

    window.updateMusicReview = updateMusicReview;

    [
      ["musicReviewBgColorPicker", "musicReviewBgColor"],
      ["musicReviewMainColorPicker", "musicReviewMainColor"],
      ["musicReviewBorderColorPicker", "musicReviewBorderColor"],
      ["musicReviewTextColorPicker", "musicReviewTextColor"]
    ].forEach(([pickerId, textId]) => {
      const picker = document.getElementById(pickerId);
      const textInput = document.getElementById(textId);
      picker?.addEventListener("input", () => {
        if (!textInput) return;
        textInput.value = picker.value;
        textInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
      textInput?.addEventListener("input", () => {
        const next = textInput.value.trim();
        if (picker && /^#[0-9a-f]{6}$/i.test(next)) picker.value = next;
      });
    });

    panel.addEventListener("input", updateMusicReview);
    panel.addEventListener("change", updateMusicReview);

    copyButton.addEventListener("click", () => {
      updateMusicReview();
      copyText(generatedCode.value)
        .then(() => window.showToast?.("คัดลอกโค้ด REVIEW CODE002 แล้ว"))
        .catch(() => window.showToast?.("คัดลอกโค้ดไม่สำเร็จ"));
    });

    function renderOfficialCard() {
      renderIframe(cardIframe, buildMarkup(officialValues, true), "card");
    }

    function openEditor() {
      document.body.classList.add("dds-editor-mode");
      document.querySelectorAll("[data-panel]").forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === panel);
      });
      document.querySelectorAll("[data-page]").forEach((button) => {
        const active = button.dataset.page === "review";
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-current", active ? "page" : "false");
      });
      const pageNumber = document.querySelector("#currentPageNumber");
      if (pageNumber) pageNumber.textContent = "03";
      history.replaceState(null, "", "#editor-review002");
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(updateMusicReview);
    }

    editButton.addEventListener("click", openEditor);
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#editor-review002") openEditor();
      if (window.location.hash === "#review") renderOfficialCard();
    });

    document.querySelectorAll('[data-page="review"], [data-go="review"]').forEach((button) => {
      button.addEventListener("click", () => requestAnimationFrame(renderOfficialCard));
    });

    if (window.location.hash === "#editor-review002") queueMicrotask(openEditor);

    renderOfficialCard();
    updateMusicReview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMusicReview, { once: true });
  } else {
    initializeMusicReview();
  }
})();


/* =========================================================
   LANDON COMMISSION — PASSWORD-GATED EDITOR (TRIAL)
   This is a client-side access gate for the static site.
   ========================================================= */
(() => {
  "use strict";

  const ACCESS_HASH = "6d05de9e9a208dc2beb7d5e594b39064b36142353ffc8db10295131098a1bcd6";
  const ACCESS_SESSION_KEY = "dds:landon-commission-editor:unlocked";
  const commissions = {
    commission001: {
      panel: "protected-commission001",
      title: "COMMISSION — โค้ดประเภทรีวิวอาหาร",
      codeLabel: "LANDON / COMMISSION 01",
      sourceFrames: ["commissionPreview001", "commissionCardPreview001"],
      draftKey: "dds:commission-draft:landon:commission001"
    },
    commission002: {
      panel: "protected-commission002",
      title: "COMMISSION 2 — โค้ดประเภทประวัติ",
      codeLabel: "LANDON / COMMISSION 02",
      sourceFrames: ["commissionPreview002", "commissionCardPreview002"],
      draftKey: "dds:commission-draft:landon:commission002"
    }
  };

  const states = new Map();
  let pendingCommissionId = "";
  let modal = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2100);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function createModal() {
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <form class="dds-commission-lock-dialog" data-commission-lock-form>
        <small>CLIENT ACCESS / LANDON A. RUTHERFORD</small>
        <h2>Protected editor</h2>
        <p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p>
        <label class="dds-commission-lock-field">
          <span>รหัสผ่าน</span>
          <input
            type="password"
            autocomplete="current-password"
            data-commission-password
            placeholder="กรอกรหัสผ่าน"
          >
        </label>
        <p class="dds-commission-lock-error" data-commission-lock-error></p>
        <div class="dds-commission-lock-actions">
          <button type="submit">UNLOCK EDITOR</button>
          <button type="button" data-commission-lock-cancel>CANCEL</button>
        </div>
      </form>
    `;
    document.body.appendChild(modal);

    modal.querySelector("[data-commission-lock-cancel]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector("[data-commission-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-commission-password]");
      const error = modal.querySelector("[data-commission-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;

      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";

      try {
        const hash = await sha256(input.value);
        if (hash !== ACCESS_HASH) {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
          return;
        }

        sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
        const target = pendingCommissionId;
        closeModal();
        if (target) openEditor(target);
      } catch (errorObject) {
        console.error(errorObject);
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });

    return modal;
  }

  function openModal(commissionId) {
    pendingCommissionId = commissionId;
    const dialog = createModal();
    const input = dialog.querySelector("[data-commission-password]");
    const error = dialog.querySelector("[data-commission-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input?.focus(), 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function setCommissionSidebarActive() {
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === "commission");
    });
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === panelName);
    });
    setCommissionSidebarActive();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBackToCommission() {
    document.body.classList.remove("dds-commission-editor-mode");

    if (typeof window.openPage === "function") {
      window.openPage("commission");
    } else {
      showPanel("commission");
    }

    requestAnimationFrame(() => {
      document.querySelectorAll("[data-work-tab]").forEach((button) => {
        const selected = button.dataset.workTab === "commission";
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", String(selected));
      });

      document.querySelectorAll("[data-work-panel]").forEach((panel) => {
        const selected = panel.dataset.workPanel === "commission";
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
      });

      document.body.classList.remove("dds-commission-editor-mode");
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function createEditorPanel(commissionId) {
    const info = commissions[commissionId];
    const main = document.querySelector(".dds-main");
    const footer = main?.querySelector(".dds-footer");
    if (!info || !main) return null;

    let panel = document.querySelector(`[data-panel="${info.panel}"]`);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor";
    panel.dataset.panel = info.panel;
    panel.dataset.protectedCommission = commissionId;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button
          aria-label="กลับหน้า COMMISSION"
          class="dds-back-button"
          data-protected-commission-back
          title="กลับหน้า COMMISSION"
          type="button"
        >←</button>
        <div>
          <p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p>
          <h1>${escapeHtml(info.title)}</h1>
          <p>แก้โค้ดทางขวาและดูผลลัพธ์ทางซ้ายได้ทันที</p>
        </div>
      </div>

      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top">
            <span>LIVE PREVIEW</span>
            <strong>${escapeHtml(info.codeLabel)}</strong>
          </div>
          <div class="dds-protected-commission-preview-stage" data-commission-preview-stage>
            <iframe
              class="dds-protected-commission-preview-frame"
              data-commission-edit-preview
              scrolling="no"
              title="ตัวอย่างงานคอมมิชชั่นที่กำลังแก้ไข"
            ></iframe>
          </div>
        </div>

        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft">
            <div>
              <strong>บันทึกแบบร่าง</strong>
              <small data-commission-draft-status>ยังไม่มีแบบร่าง</small>
            </div>
            <button type="button" data-commission-save>SAVE DRAFT</button>
            <button type="button" data-commission-delete-save>DELETE SAVE</button>
          </div>

          <div class="dds-protected-commission-scroll">
            <section class="dds-protected-commission-section">
              <div class="dds-control-title">
                <span>01</span>
                <h2>แก้ไขโค้ด HTML</h2>
              </div>
              <p class="dds-protected-commission-help">
                กล่องนี้เป็นโค้ดงานคอมมิชชั่นจริง สามารถแก้ข้อความ ลิงก์รูป สี และค่า style ได้โดยตรง
              </p>
              <textarea
                class="dds-protected-code-editor"
                data-commission-code-editor
                spellcheck="false"
                wrap="off"
              ></textarea>
            </section>
          </div>

          <section class="dds-protected-commission-copy">
            <p>คัดลอกโค้ดที่แก้ไขแล้ว หรือรีเซ็ตกลับเป็นงานต้นฉบับ</p>
            <div class="dds-protected-commission-copy-actions">
              <button type="button" data-commission-copy>COPY CODE <span>↗</span></button>
              <button type="button" data-commission-reset>RESET</button>
            </div>
          </section>
        </div>
      </div>
    `;

    if (footer) main.insertBefore(panel, footer);
    else main.appendChild(panel);

    panel.querySelector("[data-protected-commission-back]")?.addEventListener("click", goBackToCommission);
    panel.querySelector("[data-commission-code-editor]")?.addEventListener("input", () => {
      const state = states.get(commissionId);
      if (!state) return;
      clearTimeout(state.previewTimer);
      state.previewTimer = window.setTimeout(() => updatePreview(commissionId), 120);
    });
    panel.querySelector("[data-commission-save]")?.addEventListener("click", () => saveDraft(commissionId));
    panel.querySelector("[data-commission-delete-save]")?.addEventListener("click", () => deleteDraft(commissionId));
    panel.querySelector("[data-commission-copy]")?.addEventListener("click", () => copyCode(commissionId));
    panel.querySelector("[data-commission-reset]")?.addEventListener("click", () => resetCode(commissionId));

    return panel;
  }

  function isPreviewWrapper(element) {
    if (!element || element.nodeType !== 1) return false;
    const classes = Array.from(element.classList);
    if (!classes.length) return false;
    return classes.some((name) =>
      name === "dds-preview-shell" ||
      name === "dds-preview-target" ||
      name === "dds-card-preview-shell" ||
      name === "dds-card-preview-target" ||
      name === "dds-commission-preview-content" ||
      name.includes("preview-content") ||
      name.includes("preview-target") ||
      name.includes("preview-shell")
    );
  }

  function extractMarkupFromDocument(doc) {
    if (!doc?.body) return "";

    const selectors = [
      ".dds-commission-preview-content",
      ".dds-preview-target",
      ".dds-card-preview-target",
      ".dds-preview-content",
      ".dds-card-preview-content"
    ];

    let container = selectors.map((selector) => doc.querySelector(selector)).find(Boolean) || doc.body;

    while (container) {
      const children = Array.from(container.children).filter((element) =>
        !["STYLE", "SCRIPT", "LINK", "META"].includes(element.tagName)
      );
      if (children.length === 1 && isPreviewWrapper(children[0])) {
        container = children[0];
        continue;
      }
      break;
    }

    let roots = Array.from(container.children).filter((element) =>
      !["STYLE", "SCRIPT", "LINK", "META"].includes(element.tagName) &&
      !element.classList.contains("dds-preview-loader")
    );

    if (!roots.length && container !== doc.body && !isPreviewWrapper(container)) {
      roots = [container];
    }

    if (!roots.length) {
      roots = Array.from(doc.body.children).filter((element) =>
        !["STYLE", "SCRIPT", "LINK", "META"].includes(element.tagName) &&
        !isPreviewWrapper(element)
      );
    }

    return roots.map((element) => element.outerHTML).join("");
  }

  function extractStylesheetLinks(doc) {
    if (!doc?.head) return "";
    const seen = new Set();
    return Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]'))
      .filter((link) => {
        const href = link.href || link.getAttribute("href") || "";
        if (!href || seen.has(href)) return false;
        seen.add(href);
        return !href.includes("/style.css?v=");
      })
      .map((link) => {
        const clone = link.cloneNode(true);
        clone.removeAttribute("integrity");
        return clone.outerHTML;
      })
      .join("");
  }

  function extractCodeFromFrame(frame) {
    if (!frame) return "";

    try {
      const doc = frame.contentDocument;
      if (doc?.body) {
        const markup = extractMarkupFromDocument(doc);
        if (markup) return `${extractStylesheetLinks(doc)}${markup}`;
      }
    } catch (error) {
      console.warn("Could not read commission preview frame", error);
    }

    const source = frame.getAttribute("srcdoc") || frame.srcdoc || "";
    if (!source.trim()) return "";

    try {
      const doc = new DOMParser().parseFromString(source, "text/html");
      const markup = extractMarkupFromDocument(doc);
      return markup ? `${extractStylesheetLinks(doc)}${markup}` : "";
    } catch (error) {
      console.warn("Could not parse commission preview source", error);
      return "";
    }
  }

  async function captureOriginalCode(commissionId) {
    const info = commissions[commissionId];
    if (!info) return "";

    for (let attempt = 0; attempt < 70; attempt += 1) {
      for (const frameId of info.sourceFrames) {
        const code = extractCodeFromFrame(document.getElementById(frameId));
        if (code && code.length > 80) return code;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }

    return "";
  }

  function buildPreviewDocument(code) {
    return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1040">
<style>
  html, body {
    width: 1040px !important;
    min-width: 1040px !important;
    max-width: 1040px !important;
    min-height: 1px;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: transparent !important;
  }
  body {
    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
  }
</style>
</head>
<body>${code}</body>
</html>`;
  }

  function fitPreview(commissionId) {
    const state = states.get(commissionId);
    if (!state) return;
    const { panel } = state;
    const iframe = panel.querySelector("[data-commission-edit-preview]");
    const stage = panel.querySelector("[data-commission-preview-stage]");
    if (!iframe || !stage) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const height = Math.max(
        doc.body.scrollHeight,
        doc.documentElement?.scrollHeight || 0,
        1
      );
      const scale = Math.min(1, stage.clientWidth / 1040);
      iframe.style.height = `${height}px`;
      iframe.style.transform = `translateX(-50%) scale(${scale})`;
      stage.style.height = `${Math.max(680, Math.ceil(height * scale))}px`;
    } catch (error) {
      console.warn("Could not resize protected commission preview", error);
    }
  }

  function updatePreview(commissionId) {
    const state = states.get(commissionId);
    if (!state) return;
    const editor = state.panel.querySelector("[data-commission-code-editor]");
    const iframe = state.panel.querySelector("[data-commission-edit-preview]");
    if (!editor || !iframe) return;

    const documentText = buildPreviewDocument(editor.value);
    if (iframe.srcdoc === documentText) {
      fitPreview(commissionId);
      return;
    }

    iframe.onload = () => {
      fitPreview(commissionId);
      const doc = iframe.contentDocument;
      doc?.fonts?.ready?.then(() => fitPreview(commissionId)).catch(() => {});
      window.setTimeout(() => fitPreview(commissionId), 120);
      window.setTimeout(() => fitPreview(commissionId), 500);
    };
    iframe.srcdoc = documentText;
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) return "ยังไม่มีแบบร่าง";
    try {
      return `บันทึกล่าสุด ${new Date(timestamp).toLocaleString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    } catch {
      return "มีแบบร่างที่บันทึกไว้";
    }
  }

  function getDraft(info) {
    try {
      const raw = localStorage.getItem(info.draftKey);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value || typeof value.code !== "string") return null;
      return value;
    } catch {
      return null;
    }
  }

  function updateDraftStatus(commissionId, timestamp = 0) {
    const state = states.get(commissionId);
    const status = state?.panel.querySelector("[data-commission-draft-status]");
    if (status) status.textContent = formatSavedTime(timestamp);
  }

  function saveDraft(commissionId) {
    const state = states.get(commissionId);
    const info = commissions[commissionId];
    const editor = state?.panel.querySelector("[data-commission-code-editor]");
    if (!state || !info || !editor) return;

    const savedAt = Date.now();
    localStorage.setItem(info.draftKey, JSON.stringify({ code: editor.value, savedAt }));
    updateDraftStatus(commissionId, savedAt);
    showToast("บันทึกแบบร่างงานคอมมิชชั่นแล้ว");
  }

  function deleteDraft(commissionId) {
    const info = commissions[commissionId];
    const state = states.get(commissionId);
    const editor = state?.panel.querySelector("[data-commission-code-editor]");
    if (!info || !state || !editor) return;

    localStorage.removeItem(info.draftKey);
    editor.value = state.originalCode;
    updateDraftStatus(commissionId, 0);
    updatePreview(commissionId);
    showToast("ลบแบบร่างและกลับเป็นงานต้นฉบับแล้ว");
  }

  function resetCode(commissionId) {
    const state = states.get(commissionId);
    const editor = state?.panel.querySelector("[data-commission-code-editor]");
    if (!state || !editor) return;
    editor.value = state.originalCode;
    updatePreview(commissionId);
    showToast("รีเซ็ตกลับเป็นงานต้นฉบับแล้ว");
  }

  async function copyCode(commissionId) {
    const state = states.get(commissionId);
    const editor = state?.panel.querySelector("[data-commission-code-editor]");
    if (!editor) return;

    try {
      await navigator.clipboard.writeText(editor.value);
      showToast("คัดลอกโค้ดงานคอมมิชชั่นแล้ว");
    } catch {
      editor.focus();
      editor.select();
      document.execCommand("copy");
      showToast("คัดลอกโค้ดงานคอมมิชชั่นแล้ว");
    }
  }

  async function openEditor(commissionId) {
    const info = commissions[commissionId];
    if (!info) return;

    const panel = createEditorPanel(commissionId);
    if (!panel) return;
    showPanel(info.panel);

    let state = states.get(commissionId);
    if (!state) {
      state = { panel, originalCode: "", previewTimer: 0, loading: false };
      states.set(commissionId, state);
    }

    const editor = panel.querySelector("[data-commission-code-editor]");
    if (!editor || state.loading) return;

    if (!state.originalCode) {
      state.loading = true;
      editor.value = "กำลังโหลดโค้ดงานคอมมิชชั่น...";
      editor.disabled = true;
      const originalCode = await captureOriginalCode(commissionId);
      state.loading = false;
      editor.disabled = false;

      if (!originalCode) {
        editor.value = "";
        showToast("ยังโหลดโค้ดต้นฉบับไม่ได้ กรุณากลับไปเปิด VIEW WORK แล้วลองอีกครั้ง");
        return;
      }

      state.originalCode = originalCode;
      const draft = getDraft(info);
      editor.value = draft?.code || originalCode;
      updateDraftStatus(commissionId, draft?.savedAt || 0);
    }

    updatePreview(commissionId);
  }

  function handleProtectedEditClick(event) {
    const button = event.target.closest("[data-edit-protected-commission]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const commissionId = button.dataset.editProtectedCommission;
    if (!commissions[commissionId]) return;

    if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "1") {
      openEditor(commissionId);
    } else {
      openModal(commissionId);
    }
  }

  function install() {
    createModal();
    document.addEventListener("click", handleProtectedEditClick, true);
    window.addEventListener("resize", () => {
      states.forEach((_, commissionId) => fitPreview(commissionId));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* =========================================================
   LANDON COMMISSION 01 — STRUCTURED FOOD REVIEW EDITOR
   Keeps the existing protected raw editor for other commissions.
   ========================================================= */
(() => {
  "use strict";

  const ACCESS_HASH = "6d05de9e9a208dc2beb7d5e594b39064b36142353ffc8db10295131098a1bcd6";
  const ACCESS_SESSION_KEY = "dds:landon-commission-editor:unlocked";
  const DRAFT_KEY = "dds:commission-draft:landon:commission001:structured";
  const PANEL_NAME = "protected-commission001-food";
  const CANVAS_WIDTH = 1040;

  const defaults = Object.freeze({
    image1: "",
    image2: "",
    image3: "",
    image4: "",
    dateTime: "",
    category1: "",
    category2: "",
    category3: "",
    restaurantName: "",
    location: "",
    score: "",
    scoreMax: "",
    stars: "3",
    ratingText: "",
    quote: "",
    reviewText: "",
    price: "",
    taste: "",
    menuAdvice: "",
    extraAdvice: "",
    verdict: ""
  });

  let panel = null;
  let modal = null;
  let previewTimer = 0;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssUrl(value) {
    return String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/[\r\n]/g, "");
  }

  function nl2br(value) {
    return h(value).replace(/\r?\n/g, "<br>");
  }

  function createFoodBbcodeToolbarMarkup() {
    return `
      <div class="dds-bbcode-group" aria-label="รูปแบบตัวอักษร">
        <button type="button" data-food-bbcode="b" title="ตัวหนา [b]" aria-label="ตัวหนา"><b>B</b></button>
        <button type="button" data-food-bbcode="i" title="ตัวเอียง [i]" aria-label="ตัวเอียง"><i>I</i></button>
        <button type="button" data-food-bbcode="u" title="ขีดเส้นใต้ [u]" aria-label="ขีดเส้นใต้"><u>U</u></button>
        <button type="button" data-food-bbcode="s" title="ขีดฆ่า [s]" aria-label="ขีดฆ่า"><s>S</s></button>
      </div>
      <div class="dds-bbcode-group" aria-label="สีและขนาด">
        <label class="dds-bbcode-color" title="สีตัวอักษร [color]"><span>A</span><input type="color" data-food-bbcode-color value="#8f0e16" aria-label="เลือกสีตัวอักษร"></label>
        <button type="button" data-food-bbcode="size-small" title="ตัวอักษรเล็ก [size=small]">A−</button>
        <button type="button" data-food-bbcode="size-medium" title="ตัวอักษรกลาง [size=medium]">A</button>
        <button type="button" data-food-bbcode="size-large" title="ตัวอักษรใหญ่ [size=large]">A+</button>
      </div>
      <div class="dds-bbcode-group" aria-label="จัดตำแหน่ง">
        <button type="button" data-food-bbcode="align-left" title="ชิดซ้าย [align=left]">⇤</button>
        <button type="button" data-food-bbcode="align-center" title="กึ่งกลาง [align=center]">↔</button>
        <button type="button" data-food-bbcode="align-right" title="ชิดขวา [align=right]">⇥</button>
        <button type="button" data-food-bbcode="align-justify" title="เต็มบรรทัด [align=justify]">☰</button>
      </div>
      <div class="dds-bbcode-group" aria-label="ลิงก์และสื่อ">
        <button type="button" data-food-bbcode="url" title="ลิงก์ [url=]">🔗</button>
        <button type="button" data-food-bbcode="img" title="รูปภาพ [img]">▣</button>
        <button type="button" data-food-bbcode="video" title="YouTube [video=youtube]">▶</button>
      </div>
      <div class="dds-bbcode-group" aria-label="กล่องข้อความ">
        <button type="button" data-food-bbcode="quote" title="คำพูดอ้างอิง [quote]">❝</button>
        <button type="button" data-food-bbcode="code" title="โค้ด [code]">&lt;/&gt;</button>
        <button type="button" data-food-bbcode="hide" title="ซ่อนข้อความ [hide]">◉</button>
        <button type="button" data-food-bbcode="spoiler" title="สปอยล์ [spoiler]">▤</button>
      </div>
      <div class="dds-bbcode-group" aria-label="รายการ">
        <button type="button" data-food-bbcode="list" title="รายการจุด [list]">•≡</button>
        <button type="button" data-food-bbcode="list-1" title="รายการตัวเลข [list=1]">1≡</button>
        <button type="button" data-food-bbcode="list-item" title="รายการย่อย [*]">[*]</button>
      </div>
      <div class="dds-bbcode-group" aria-label="เครื่องมืออื่น">
        <button type="button" data-food-bbcode="hr" title="เส้นคั่น [hr]">―</button>
        <button type="button" data-food-bbcode="clear" title="ล้าง BBCode จากข้อความที่เลือก">CLEAR</button>
      </div>
    `;
  }

  function stripFoodBbcode(value) {
    return String(value || "")
      .replace(/\[(?:\/?)(?:b|i|u|s|color(?:=[^\]]+)?|size(?:=[^\]]+)?|align(?:=[^\]]+)?|url(?:=[^\]]*)?|img|video(?:=[^\]]+)?|quote|code|hide|spoiler|list(?:=1)?|\*)\]/gi, "")
      .replace(/\[hr\]/gi, "");
  }

  function foodBbcodeToPreviewHtml(value) {
    let text = h(value);

    text = text
      .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, '<img src="$1" alt="" style="max-width:100%;height:auto;">')
      .replace(/\[video=youtube\]([\s\S]*?)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=(small|medium|large)\]([\s\S]*?)\[\/size\]/gi, (_match, size, content) => {
        const sizes = { small: "0.82em", medium: "1em", large: "1.28em" };
        return `<span style="font-size:${sizes[size]}">${content}</span>`;
      })
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[(quote|code|hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi, '<span class="dds-food-bbcode-$1">$2</span>')
      .replace(/\[list(?:=1)?\]/gi, "<div>")
      .replace(/\[\/list\]/gi, "</div>")
      .replace(/\[\*\]/g, "<br>• ")
      .replace(/\[hr\]/gi, "<hr>")
      .replace(/\r?\n/g, "<br>");

    return text;
  }

  function removeFoodBbcodeForWordCount(value) {
    return String(value || "")
      .replace(/\[img(?:=[^\]]*)?\][\s\S]*?\[\/img\]/gi, " ")
      .replace(/\[video(?:=[^\]]*)?\][\s\S]*?\[\/video\]/gi, " ")
      .replace(/\[url(?:=[^\]]*)?\]([\s\S]*?)\[\/url\]/gi, " $1 ")
      .replace(/\[(?:\/?[a-z][a-z0-9_-]*(?:=[^\]]*)?|\*|hr)\]/gi, " ")
      .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countFoodReviewWords(value) {
    const cleanText = removeFoodBbcodeForWordCount(value);
    if (!cleanText) return 0;

    if (typeof Intl?.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      let count = 0;
      for (const segment of segmenter.segment(cleanText)) {
        if (segment.isWordLike) count += 1;
      }
      return count;
    }

    const fallbackWords = cleanText.match(/[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g);
    return fallbackWords ? fallbackWords.length : 0;
  }

  function updateFoodReviewWordCounter() {
    const target = panel?.querySelector("[data-food-review-editor]");
    const counter = panel?.querySelector("[data-food-word-counter]");
    if (!target || !counter) return;

    const count = countFoodReviewWords(target.value);
    const number = counter.querySelector("[data-food-word-count-number]");
    if (number) number.textContent = count.toLocaleString("th-TH");
    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function replaceFoodSelection(target, replacement, emptyCaretOffset = replacement.length) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const hadSelection = end > start;
    target.value = target.value.slice(0, start) + replacement + target.value.slice(end);
    const caret = start + (hadSelection ? replacement.length : emptyCaretOffset);
    target.focus();
    target.setSelectionRange(caret, caret);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function getFoodSelectedText(target) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    return target.value.slice(start, end);
  }

  function wrapFoodTag(target, openTag, closeTag) {
    const selected = getFoodSelectedText(target);
    const replacement = `${openTag}${selected}${closeTag}`;
    replaceFoodSelection(target, replacement, selected ? replacement.length : openTag.length);
  }

  function applyFoodList(target, ordered) {
    const selected = getFoodSelectedText(target);
    const lines = selected.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const openTag = ordered ? "[list=1]" : "[list]";
    const body = lines.length ? lines.map((line) => `[*]${line}`).join("\n") : "[*]";
    const replacement = `${openTag}\n${body}\n[/list]`;
    replaceFoodSelection(target, replacement, lines.length ? replacement.length : openTag.length + 4);
  }

  function applyFoodBbcode(target, action, toolbar) {
    switch (action) {
      case "b": case "i": case "u": case "s": case "quote": case "code": case "hide": case "spoiler":
        wrapFoodTag(target, `[${action}]`, `[/${action}]`);
        break;
      case "size-small": wrapFoodTag(target, "[size=small]", "[/size]"); break;
      case "size-medium": wrapFoodTag(target, "[size=medium]", "[/size]"); break;
      case "size-large": wrapFoodTag(target, "[size=large]", "[/size]"); break;
      case "align-left": wrapFoodTag(target, "[align=left]", "[/align]"); break;
      case "align-center": wrapFoodTag(target, "[align=center]", "[/align]"); break;
      case "align-right": wrapFoodTag(target, "[align=right]", "[/align]"); break;
      case "align-justify": wrapFoodTag(target, "[align=justify]", "[/align]"); break;
      case "url": {
        const selected = getFoodSelectedText(target);
        const url = window.prompt("ใส่ลิงก์ URL", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) return;
        replaceFoodSelection(target, `[url=${url}]${selected || url}[/url]`);
        break;
      }
      case "img": {
        const selected = getFoodSelectedText(target);
        const url = window.prompt("ใส่ลิงก์รูปภาพ", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) return;
        replaceFoodSelection(target, `[img]${url}[/img]`);
        break;
      }
      case "video": {
        const selected = getFoodSelectedText(target);
        const url = window.prompt("ใส่ลิงก์ YouTube", /^https?:\/\//i.test(selected) ? selected : "https://");
        if (url === null) return;
        replaceFoodSelection(target, `[video=youtube]${url}[/video]`);
        break;
      }
      case "list": applyFoodList(target, false); break;
      case "list-1": applyFoodList(target, true); break;
      case "list-item": replaceFoodSelection(target, `[*]${getFoodSelectedText(target)}`); break;
      case "hr": replaceFoodSelection(target, "[hr]"); break;
      case "clear": {
        const selected = getFoodSelectedText(target);
        if (!selected) {
          showToast("คลุมข้อความที่ต้องการล้าง BBCode ก่อน");
          return;
        }
        replaceFoodSelection(target, stripFoodBbcode(selected));
        break;
      }
      case "color": {
        const color = toolbar.querySelector("[data-food-bbcode-color]")?.value || "#8f0e16";
        wrapFoodTag(target, `[color=${color}]`, "[/color]");
        break;
      }
      default:
        break;
    }
  }

  function installFoodReviewBbcode() {
    const target = panel?.querySelector("[data-food-review-editor]");
    const toolbar = panel?.querySelector("[data-food-bbcode-toolbar]");
    if (!target || !toolbar || target.dataset.foodBbcodeReady === "true") return;

    target.dataset.foodBbcodeReady = "true";
    toolbar.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    toolbar.querySelectorAll("[data-food-bbcode]").forEach((button) => {
      button.addEventListener("click", () => applyFoodBbcode(target, button.dataset.foodBbcode, toolbar));
    });
    toolbar.querySelector("[data-food-bbcode-color]")?.addEventListener("change", () => {
      applyFoodBbcode(target, "color", toolbar);
    });
    target.addEventListener("input", updateFoodReviewWordCounter);
    target.addEventListener("paste", () => window.setTimeout(updateFoodReviewWordCounter, 0));
    updateFoodReviewWordCounter();
  }

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2100);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function setCommissionSidebarActive() {
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === "commission");
    });
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.panel === panelName);
    });
    setCommissionSidebarActive();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function backToCommission() {
    document.body.classList.remove("dds-commission-editor-mode");

    if (typeof window.openPage === "function") window.openPage("commission");
    else showPanel("commission");

    requestAnimationFrame(() => {
      document.querySelectorAll("[data-work-tab]").forEach((button) => {
        const selected = button.dataset.workTab === "commission";
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", String(selected));
      });

      document.querySelectorAll("[data-work-panel]").forEach((panel) => {
        const selected = panel.dataset.workPanel === "commission";
        panel.hidden = !selected;
        panel.classList.toggle("is-active", selected);
      });

      document.body.classList.remove("dds-commission-editor-mode");
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  function createModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <form class="dds-commission-lock-dialog" data-food-lock-form>
        <small>CLIENT ACCESS / LANDON A. RUTHERFORD</small>
        <h2>Protected editor</h2>
        <p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p>
        <label class="dds-commission-lock-field">
          <span>รหัสผ่าน</span>
          <input type="password" autocomplete="current-password" data-food-password placeholder="กรอกรหัสผ่าน">
        </label>
        <p class="dds-commission-lock-error" data-food-lock-error></p>
        <div class="dds-commission-lock-actions">
          <button type="submit">UNLOCK EDITOR</button>
          <button type="button" data-food-lock-cancel>CANCEL</button>
        </div>
      </form>
    `;
    document.body.appendChild(modal);

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
    };

    modal.querySelector("[data-food-lock-cancel]")?.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    modal.querySelector("[data-food-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-food-password]");
      const error = modal.querySelector("[data-food-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;
      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";
      try {
        const hash = await sha256(input.value);
        if (hash !== ACCESS_HASH) {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
          return;
        }
        sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
        close();
        openEditor();
      } catch (err) {
        console.error(err);
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });
    return modal;
  }

  function openModal() {
    const dialog = createModal();
    const input = dialog.querySelector("[data-food-password]");
    const error = dialog.querySelector("[data-food-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input?.focus(), 30);
  }

  function createField(label, key, options = {}) {
    const { full = false, textarea = false, rows = 3, type = "text", placeholder = "กรอกข้อมูล", help = "" } = options;
    const className = `dds-field${full ? " dds-field-full" : ""}`;
    const helpText = help ? `<small class="dds-food-field-help">${help}</small>` : "";
    if (textarea) {
      return `<label class="${className}"><span>${label}</span><textarea rows="${rows}" data-food-field="${key}" placeholder="${placeholder}"></textarea>${helpText}</label>`;
    }
    return `<label class="${className}"><span>${label}</span><input type="${type}" data-food-field="${key}" placeholder="${placeholder}">${helpText}</label>`;
  }

  function createPanel() {
    if (panel) return panel;
    const main = document.querySelector(".dds-main");
    const footer = main?.querySelector(".dds-footer");
    if (!main) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-food-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION" class="dds-back-button" data-food-back title="กลับหน้า COMMISSION" type="button">←</button>
        <div>
          <p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p>
          <h1 class="dds-food-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทรีวิวอาหาร</span></h1>
          <p>กรอกข้อมูลทางขวา แล้วดูผลลัพธ์ทางซ้ายได้ทันที สีและโครงสร้างถูกฟิกไว้ตามงานต้นฉบับ</p>
        </div>
      </div>

      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>LANDON / COMMISSION 01</strong></div>
          <div class="dds-protected-commission-preview-stage" data-food-preview-stage>
            <iframe class="dds-protected-commission-preview-frame" data-food-preview scrolling="no" title="ตัวอย่างโค้ดรีวิวอาหาร"></iframe>
          </div>
        </div>

        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft">
            <div><strong>บันทึกแบบร่าง</strong><small data-food-draft-status>ยังไม่มีแบบร่าง</small></div>
            <button type="button" data-food-save>SAVE DRAFT</button>
            <button type="button" data-food-delete>DELETE SAVE</button>
          </div>

          <div class="dds-protected-commission-scroll dds-food-commission-scroll">
            <section class="dds-control-section">
              <div class="dds-control-title"><span>01</span><h2>รูปภาพ</h2></div>
              <div class="dds-form-grid">
                ${createField("รูปขวาใหญ่", "image1", { full: true, type: "url", placeholder: "วางลิงก์รูปขวาใหญ่" })}
                ${createField("รูปซ้ายฟิล์มด้านบน", "image2", { full: true, type: "url", placeholder: "วางลิงก์รูปซ้ายด้านบน" })}
                ${createField("รูปซ้ายฟิล์มด้านล่าง", "image3", { full: true, type: "url", placeholder: "วางลิงก์รูปซ้ายด้านล่าง" })}
                ${createField("รูปโพลารอยด์ล่างสุด", "image4", { full: true, type: "url", placeholder: "วางลิงก์รูปล่างสุด" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>02</span><h2>เมนูและหมวดหมู่</h2></div>
              <div class="dds-form-grid">
                ${createField("วันที่และเวลาในแถบเมนู", "dateTime", { full: true, placeholder: "เช่น Thu 09:41" })}
                ${createField("หมวดหมู่ที่ 1", "category1", { placeholder: "เช่น Café" })}
                ${createField("หมวดหมู่ที่ 2", "category2", { placeholder: "เช่น Dinner" })}
                ${createField("หมวดหมู่ที่ 3", "category3", { placeholder: "เช่น Dessert" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>03</span><h2>ข้อมูลร้านและคะแนน</h2></div>
              <div class="dds-form-grid">
                ${createField("ชื่อร้าน", "restaurantName", { full: true, placeholder: "กรอกชื่อร้าน" })}
                ${createField("สถานที่และวันที่", "location", { full: true, placeholder: "เช่น Bangkok, Thailand · 18 July 2026", help: "หรือจะใส่ว่า รีวิวโดย LANDON A. RUTHERFORD ก็ได้" })}
                ${createField("คะแนน", "score", { placeholder: "เช่น 9.4" })}
                ${createField("คะแนนเต็ม", "scoreMax", { placeholder: "เช่น 10" })}
                <label class="dds-field"><span>จำนวนดาวที่ติดสี</span><select data-food-field="stars">
                  <option value="0">0 ดาว</option><option value="1">1 ดาว</option><option value="2">2 ดาว</option>
                  <option value="3">3 ดาว</option><option value="4">4 ดาว</option><option value="5">5 ดาว</option>
                </select></label>
                ${createField("ข้อความข้างดาว", "ratingText", { placeholder: "เช่น 4.5 / 5 — ..." })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>04</span><h2>ข้อความรีวิว</h2></div>
              <div class="dds-form-grid">
                ${createField("ข้อความโควต", "quote", { full: true, textarea: true, rows: 2, placeholder: "กรอกข้อความโควต" })}
                <label class="dds-field dds-field-full dds-food-review-bbcode-field">
                  <span>เนื้อหารีวิว</span>
                  <div class="dds-rich-toolbar dds-bbcode-toolbar" data-food-bbcode-toolbar>
                    ${createFoodBbcodeToolbarMarkup()}
                  </div>
                  <textarea rows="8" data-food-field="reviewText" data-food-review-editor placeholder="กรอกข้อความรีวิว"></textarea>
                  <div class="dds-word-counter" data-food-word-counter data-empty="true">
                    <span class="dds-word-counter-label">จำนวนคำ</span>
                    <strong><span data-food-word-count-number>0</span> คำ</strong>
                    <small>ไม่นับคำสั่ง BBCode</small>
                  </div>
                </label>
                ${createField("ราคา", "price", { placeholder: "เช่น 320" })}
                ${createField("คะแนนรสชาติ", "taste", { placeholder: "เช่น 9.5 / 10" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>05</span><h2>คำแนะนำ</h2></div>
              <div class="dds-form-grid">
                ${createField("เมนูที่แนะนำ", "menuAdvice", { full: true, textarea: true, rows: 3, placeholder: "กรอกเมนูที่แนะนำ" })}
                ${createField("คำแนะนำเพิ่มเติม", "extraAdvice", { full: true, textarea: true, rows: 3, placeholder: "กรอกคำแนะนำเพิ่มเติม" })}
                ${createField("FINAL VERDICT", "verdict", { full: true, textarea: true, rows: 3, placeholder: "กรอกบทสรุปหรือคำแนะนำสุดท้าย" })}
              </div>
            </section>
          </div>

          <section class="dds-protected-commission-copy dds-food-commission-copy">
            <div class="dds-control-title"><span>06</span><h2>คัดลอกโค้ด</h2></div>
            <p>กดปุ่มด้านล่างเพื่อคัดลอกโค้ดที่กรอกเสร็จแล้วไปใช้งาน</p>
            <div class="dds-protected-commission-copy-actions">
              <button type="button" data-food-copy>COPY CODE <span>↗</span></button>
              <button type="button" data-food-reset>RESET</button>
            </div>
          </section>
        </div>
      </div>
    `;

    if (footer) main.insertBefore(panel, footer);
    else main.appendChild(panel);

    panel.querySelector("[data-food-back]")?.addEventListener("click", backToCommission);
    panel.querySelector("[data-food-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-food-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-food-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-food-reset]")?.addEventListener("click", resetFields);
    panel.addEventListener("input", schedulePreview);
    panel.addEventListener("change", schedulePreview);
    installFoodReviewBbcode();
    return panel;
  }

  function getValues() {
    const result = { ...defaults };
    panel?.querySelectorAll("[data-food-field]").forEach((field) => {
      result[field.dataset.foodField] = field.value;
    });
    return result;
  }

  function setValues(values = defaults) {
    const next = { ...defaults, ...(values || {}) };
    panel?.querySelectorAll("[data-food-field]").forEach((field) => {
      const key = field.dataset.foodField;
      field.value = next[key] ?? defaults[key] ?? "";
    });
    updateFoodReviewWordCounter();
  }

  function buildCode(values = getValues(), previewMode = false) {
    const filled = Math.max(0, Math.min(5, Number.parseInt(values.stars, 10) || 0));
    const off = 5 - filled;
    const reviewContent = previewMode
      ? foodBbcodeToPreviewHtml(values.reviewText)
      : nl2br(values.reviewText);
    return `<link href="https://guindaeyo.github.io/css/foodierv-land.css" rel="stylesheet"><div class="fdreview-wrap" style="--fdreview-bg:url('https://i.pinimg.com/vwebp/736x/ce/ab/58/ceab58c646655aeddcf6b0d1248c7174.webp');--fdreview-img1:url('${cssUrl(values.image1)}');--fdreview-img1-x:50%;--fdreview-img1-y:35%;--fdreview-img2:url('${cssUrl(values.image2)}');--fdreview-img2-x:50%;--fdreview-img2-y:50%;--fdreview-img3:url('${cssUrl(values.image3)}');--fdreview-img3-x:50%;--fdreview-img3-y:50%;--fdreview-img4:url('${cssUrl(values.image4)}');--fdreview-img4-x:50%;--fdreview-img4-y:50%;--fdreview-accent:#d8a520;--fdreview-text:#292825;--fdreview-soft:#eeece7;"><div class="fdreview-menubar"><div class="fdreview-menubar-left"><span class="fdreview-apple">●</span><b>Food Journal</b><span>File</span><span>Edit</span><span>View</span><span>Review</span><span>Help</span></div><div class="fdreview-menubar-right"><span>⌁</span><span>⌕</span><span>◖</span><span>${h(values.dateTime)}</span></div></div><div class="fdreview-desktop"><div class="fdreview-film fdreview-film-left"><div class="fdreview-film-hole"></div><div class="fdreview-film-photo" style="background-image:var(--fdreview-img2);background-position:var(--fdreview-img2-x) var(--fdreview-img2-y);"></div><div class="fdreview-film-photo" style="background-image:var(--fdreview-img3);background-position:var(--fdreview-img3-x) var(--fdreview-img3-y);"></div><div class="fdreview-film-hole"></div></div><div class="fdreview-window fdreview-review-window"><div class="fdreview-window-head"><div class="fdreview-dots"><span class="fdreview-dot-red"></span><span class="fdreview-dot-yellow"></span><span class="fdreview-dot-green"></span></div><div class="fdreview-window-title">FOOD REVIEW — DAILY JOURNAL</div><div class="fdreview-window-tools"><span>⌑</span><span>⌕</span><span>↥</span></div></div><div class="fdreview-review-body"><div class="fdreview-sidebar"><div class="fdreview-sidebar-title">Quick Notes</div><div class="fdreview-sidebar-menu fdreview-sidebar-menu-active"><span>▣</span><b>Food Reviews</b><small>119</small></div><div class="fdreview-sidebar-menu"><span>□</span><b>Recently Visited</b><small>16</small></div><div class="fdreview-sidebar-label">Categories</div><div class="fdreview-tag"><span class="fdreview-tag-dot"></span>${h(values.category1)}</div><div class="fdreview-tag"><span class="fdreview-tag-dot"></span>${h(values.category2)}</div><div class="fdreview-tag"><span class="fdreview-tag-dot"></span>${h(values.category3)}</div></div><div class="fdreview-note"><div class="fdreview-note-toolbar"><span>✎</span><span>Aa</span><span>☷</span><span>▦</span><span>⌁</span><span>▧</span><span>⌕</span></div><div class="fdreview-note-scroll"><div class="fdreview-note-heading"><span>✦</span><strong>— TODAY'S FOOD REVIEW</strong></div><div class="fdreview-title-row"><div><div class="fdreview-eyebrow">RESTAURANT JOURNAL</div><h1>${h(values.restaurantName)}</h1><div class="fdreview-location">${h(values.location)}</div></div><div class="fdreview-score-box"><span class="fdreview-score-number">${h(values.score)}</span><small>/ ${h(values.scoreMax)}</small></div></div><div class="fdreview-rating"><div class="fdreview-stars" aria-label="${filled} of 5 stars"><span>${"★".repeat(filled)}</span><span class="fdreview-star-off">${"★".repeat(off)}</span></div><div class="fdreview-rating-text">${h(values.ratingText)}</div></div><div class="fdreview-quote">${nl2br(values.quote)}</div><div class="fdreview-review-text"><p>${reviewContent}</p></div><div class="fdreview-detail-grid"><div class="fdreview-detail"><span>ราคา</span><strong>฿${h(values.price)}</strong></div><div class="fdreview-detail"><span>รสชาติ</span><strong>${h(values.taste)}</strong></div></div></div></div></div><div class="fdreview-window-bottom"><span>▢</span><span>✎</span><span>Aa</span><span>☷</span><span>▦</span><span>⌁</span><div class="fdreview-search">⌕ Search</div></div></div><div class="fdreview-window fdreview-photo-window"><div class="fdreview-window-head fdreview-photo-head"><div class="fdreview-dots"><span class="fdreview-dot-red"></span><span class="fdreview-dot-yellow"></span><span class="fdreview-dot-green"></span></div><div class="fdreview-window-title">Photo Booth</div><div></div></div><div class="fdreview-main-photo" style="background-image:var(--fdreview-img1);background-position:var(--fdreview-img1-x) var(--fdreview-img1-y);"></div><div class="fdreview-camera-bottom"><div class="fdreview-camera-icons"><span>▦</span><span>▧</span><span>▣</span></div><div class="fdreview-camera-button"><span>◉</span></div><div class="fdreview-effects">Effects</div></div></div><div class="fdreview-window fdreview-advice-window"><div class="fdreview-window-head"><div class="fdreview-dots"><span class="fdreview-dot-red"></span><span class="fdreview-dot-yellow"></span><span class="fdreview-dot-green"></span></div><div class="fdreview-window-title">คำแนะนำ.txt</div><div class="fdreview-window-tools"><span>⌕</span><span>↥</span></div></div><div class="fdreview-advice-body"><div class="fdreview-advice-section"><span class="fdreview-advice-number">01</span><div><h3>เมนูที่แนะนำ</h3><p>${nl2br(values.menuAdvice)}</p></div></div><div class="fdreview-advice-section"><span class="fdreview-advice-number">02</span><div><h3>คำแนะนำเพิ่มเติม</h3><p>${nl2br(values.extraAdvice)}</p></div></div><div class="fdreview-recommend-box"><span>FINAL VERDICT</span><strong>${nl2br(values.verdict)}</strong></div></div></div><div class="fdreview-polaroid"><div class="fdreview-polaroid-photo" style="background-image:var(--fdreview-img4);background-position:var(--fdreview-img4-x) var(--fdreview-img4-y);"></div><div class="fdreview-polaroid-caption">good food, good mood.</div></div><div class="fdreview-dock"><span>⌘</span><span>◉</span><span>♫</span><span>✉</span><span>⌁</span><span>▧</span><span>☼</span><span>▣</span></div></div></div><div class="fdreview-credit"><span></span></div>`;
  }

  function buildPreviewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=${CANVAS_WIDTH}"><style>
      html,body{
        width:${CANVAS_WIDTH}px!important;
        min-width:${CANVAS_WIDTH}px!important;
        max-width:${CANVAS_WIDTH}px!important;
        margin:0!important;
        padding:0!important;
        overflow:hidden!important;
        background:transparent!important;
      }
      body{
        position:relative!important;
        min-height:1px!important;
      }
      .dds-food-preview-positioner{
        position:relative!important;
        display:block!important;
        width:${CANVAS_WIDTH}px!important;
        min-width:${CANVAS_WIDTH}px!important;
        max-width:${CANVAS_WIDTH}px!important;
        margin:0!important;
        padding:0!important;
        transform:none!important;
      }
      .dds-food-preview-positioner > .fdreview-wrap,
      .fdreview-wrap{
        width:${CANVAS_WIDTH}px!important;
        min-width:${CANVAS_WIDTH}px!important;
        max-width:${CANVAS_WIDTH}px!important;
        margin:0!important;
        transform:none!important;
      }
      .dds-food-bbcode-quote,.dds-food-bbcode-code,.dds-food-bbcode-hide,.dds-food-bbcode-spoiler{display:inline-block;padding:2px 5px;border:1px solid rgba(0,0,0,.12)}
    </style></head><body><div class="dds-food-preview-positioner" data-food-preview-positioner>${code}</div></body></html>`;
  }

  function fitPreview() {
    const iframe = panel?.querySelector("[data-food-preview]");
    const stage = panel?.querySelector("[data-food-preview-stage]");
    if (!iframe || !stage) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;

      const positioner = doc.querySelector("[data-food-preview-positioner]");
      const codeRoot = doc.querySelector(".fdreview-wrap");

      if (positioner) {
        positioner.style.width = `${CANVAS_WIDTH}px`;
        positioner.style.minWidth = `${CANVAS_WIDTH}px`;
        positioner.style.maxWidth = `${CANVAS_WIDTH}px`;
        positioner.style.transform = "none";
      }

      if (codeRoot) {
        codeRoot.style.width = `${CANVAS_WIDTH}px`;
        codeRoot.style.minWidth = `${CANVAS_WIDTH}px`;
        codeRoot.style.maxWidth = `${CANVAS_WIDTH}px`;
        codeRoot.style.margin = "0";
        codeRoot.style.transform = "none";
      }

      const naturalHeight = Math.max(
        positioner?.scrollHeight || 0,
        positioner?.offsetHeight || 0,
        codeRoot?.scrollHeight || 0,
        codeRoot?.offsetHeight || 0,
        doc.body.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        1
      );

      const availableWidth = Math.max(1, stage.clientWidth - 24);
      const scale = Math.min(1, availableWidth / CANVAS_WIDTH);

      iframe.style.width = `${CANVAS_WIDTH}px`;
      iframe.style.maxWidth = "none";
      iframe.style.left = "50%";
      iframe.style.top = "0";
      iframe.style.height = `${Math.ceil(naturalHeight)}px`;
      iframe.style.transformOrigin = "top center";
      iframe.style.transform = `translateX(-50%) scale(${scale})`;

      stage.style.height = `${Math.max(680, Math.ceil(naturalHeight * scale))}px`;
    } catch (err) {
      console.warn("Could not fit food commission preview", err);
    }
  }

  function updatePreview() {
    if (!panel) return;
    const iframe = panel.querySelector("[data-food-preview]");
    if (!iframe) return;
    const next = buildPreviewDocument(buildCode(getValues(), true));
    if (iframe.srcdoc === next) {
      fitPreview();
      return;
    }
    iframe.onload = () => {
      fitPreview();
      iframe.contentDocument?.fonts?.ready?.then(fitPreview).catch(() => {});
      window.setTimeout(fitPreview, 120);
      window.setTimeout(fitPreview, 500);
    };
    iframe.srcdoc = next;
  }

  function schedulePreview() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(updatePreview, 90);
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) return "ยังไม่มีแบบร่าง";
    try {
      return `บันทึกล่าสุด ${new Date(timestamp).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return "มีแบบร่างที่บันทึกไว้";
    }
  }

  function setDraftStatus(timestamp = 0) {
    const status = panel?.querySelector("[data-food-draft-status]");
    if (status) status.textContent = formatSavedTime(timestamp);
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.values ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
    setDraftStatus(savedAt);
    showToast("บันทึกแบบร่างงานรีวิวอาหารแล้ว");
  }

  function deleteDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setValues(defaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(defaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode();
    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ดรีวิวอาหารแล้ว");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("คัดลอกโค้ดรีวิวอาหารแล้ว");
    }
  }

  function openEditor() {
    const editorPanel = createPanel();
    if (!editorPanel) return;
    const draft = getDraft();
    setValues(draft?.values || editorDefaults);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    updatePreview();
  }

  function install() {
    const button = document.querySelector('[data-edit-protected-commission="commission001"]');
    if (!button) return;
    button.removeAttribute("data-edit-protected-commission");
    button.setAttribute("data-edit-food-commission", "commission001");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "1") openEditor();
      else openModal();
    });
    window.addEventListener("resize", fitPreview);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();


/* =========================================================
   COMMISSION EDITOR — FULL-WIDTH MODE SYNC
   ซ่อนเมนูหลักเฉพาะหน้าแก้ไขคอมมิชชั่น
   ========================================================= */
(() => {
  "use strict";

  function syncCommissionEditorMode() {
    const activeCommissionEditor = document.querySelector(
      ".dds-panel.is-active.dds-protected-commission-editor"
    );

    document.body.classList.toggle(
      "dds-commission-editor-mode",
      Boolean(activeCommissionEditor)
    );
  }

  const observer = new MutationObserver(syncCommissionEditorMode);

  function installCommissionEditorModeSync() {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"]
    });

    document.addEventListener(
      "click",
      () => requestAnimationFrame(syncCommissionEditorMode),
      true
    );
    window.addEventListener(
      "hashchange",
      () => requestAnimationFrame(syncCommissionEditorMode)
    );
    syncCommissionEditorMode();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      installCommissionEditorModeSync,
      { once: true }
    );
  } else {
    installCommissionEditorModeSync();
  }
})();

/* =========================================================
   COMMISSION EDITOR — FORCE BACK TO SHOWCASE
   กลับจากหน้าแก้คอมมิชชั่นไปหน้า COMMISSION & ACTIVITY
   และเปิดแท็บ COMMISSION & SHOWCASE ทุกครั้ง
   ========================================================= */
(() => {
  "use strict";

  function activateCommissionShowcase() {
    // ปิดโหมด editor เต็มจอก่อน เพื่อคืน sidebar และ layout หลัก
    document.body.classList.remove(
      "dds-editor-mode",
      "dds-commission-editor-mode",
      "dds-modal-open"
    );
    document.documentElement.classList.remove(
      "dds-editor-mode",
      "dds-commission-editor-mode",
      "dds-modal-open"
    );

    // ให้ระบบหลักอัปเดตหัวข้อ/เลขหน้า หากมีฟังก์ชันนี้
    if (typeof window.openPage === "function") {
      try {
        window.openPage("commission");
      } catch (error) {
        console.warn("[DDS] openPage('commission') failed", error);
      }
    }

    // บังคับ panel โดยตรง เพื่อไม่ให้ hash หรือ listener ตัวอื่นพาไปหน้าอื่น
    document.querySelectorAll(".dds-panel").forEach((panel) => {
      const isCommission = panel.dataset.panel === "commission";
      panel.classList.toggle("is-active", isCommission);
    });

    // เปิดแท็บ COMMISSION & SHOWCASE
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const isCommissionTab = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", isCommissionTab);
      button.setAttribute("aria-selected", String(isCommissionTab));
      button.tabIndex = isCommissionTab ? 0 : -1;
    });

    document.querySelectorAll("[data-work-panel]").forEach((panel) => {
      const isCommissionPanel = panel.dataset.workPanel === "commission";
      panel.hidden = !isCommissionPanel;
      panel.classList.toggle("is-active", isCommissionPanel);
    });

    // ไฮไลต์เมนู COMMISSION & ACTIVITY ทางขวา
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.page === "commission"
      );
    });

    const currentPageNumber = document.getElementById("currentPageNumber");
    if (currentPageNumber) currentPageNumber.textContent = "04";

    // แก้ URL ให้ตรงกับหน้าที่แสดง โดยไม่เพิ่มประวัติย้อนกลับซ้ำ
    if (window.location.hash !== "#commission") {
      history.replaceState(null, "", "#commission");
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function handleCommissionBack(event) {
    const button = event.target.closest(
      "[data-food-back], [data-protected-commission-back], [data-vmac-back], [data-vmac-view-back]"
    );

    if (!button) return;

    // กัน listener เดิมหรือระบบหลักรับ click ต่อแล้วเปลี่ยนไปหน้าอื่น
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    activateCommissionShowcase();

    // บังคับซ้ำหลัง DOM/MutationObserver ของระบบเดิมทำงานครบ
    requestAnimationFrame(() => {
      activateCommissionShowcase();
      requestAnimationFrame(activateCommissionShowcase);
    });
    window.setTimeout(activateCommissionShowcase, 80);
  }

  // ใช้ capture เพื่อรับเหตุการณ์ก่อน listener เดิมทั้งหมด
  document.addEventListener("click", handleCommissionBack, true);
})();

/* =========================================================
   LANDON COMMISSION 02 — STRUCTURED PROFILE EDITOR
   หน้าแก้ไขแบบช่องกรอก แทนกล่อง HTML ดิบ
   ========================================================= */
(() => {
  "use strict";

  const ACCESS_HASH = "6d05de9e9a208dc2beb7d5e594b39064b36142353ffc8db10295131098a1bcd6";
  const ACCESS_SESSION_KEY = "dds:landon-commission-editor:unlocked";
  const PANEL_NAME = "protected-commission002-structured";
  const DRAFT_KEY = "dds:commission-draft:landon:commission002:structured-v1";
  const CANVAS_WIDTH = 1040;

  const defaults = Object.freeze({
    polaroidOne: "",
    polaroidTwo: "",
    sidebarImage: "",
    photoMain: "",
    stripOne: "",
    stripTwo: "",
    stripThree: "",
    traitsImage: "",
    menuDate: "",
    menuTime: "",
    noteDate: "",
    mainTitle: "",
    thaiSubtitle: "",
    sidebarTag: "",
    sidebarName: "",
    sidebarRoles: "",
    nameEnglish: "",
    nameThai: "",
    nickname: "",
    birthday: "",
    age: "",
    race: "",
    className: "",
    occupation: "",
    faceclaim: "",
    mainBiography: "",
    mainQuote: "",
    afterQuote: "",
    secondWindowTitle: "",
    secondLabel: "",
    secondHeading: "",
    secondBiography: "",
    audioTitle: "",
    audioDuration: "",
    audioLink: "",
    traitsWindowTitle: "",
    traitsCaption: "",
    traitsCaptionMeta: "",
    traitsText: "",
    observationWindowTitle: "",
    observationText: "",
    finalQuote: ""
  });

  let panel = null;
  let modal = null;
  let previewTimer = 0;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cssUrl(value) {
    return String(value ?? "").replace(/[\\'\"\n\r]/g, "");
  }

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2100);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function createModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <form class="dds-commission-lock-dialog" data-history-lock-form>
        <small>CLIENT ACCESS / LANDON A. RUTHERFORD</small>
        <h2>Protected editor</h2>
        <p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p>
        <label class="dds-commission-lock-field">
          <span>รหัสผ่าน</span>
          <input type="password" autocomplete="current-password" data-history-password placeholder="กรอกรหัสผ่าน">
        </label>
        <p class="dds-commission-lock-error" data-history-lock-error></p>
        <div class="dds-commission-lock-actions">
          <button type="submit">UNLOCK EDITOR</button>
          <button type="button" data-history-lock-cancel>CANCEL</button>
        </div>
      </form>`;
    document.body.appendChild(modal);

    const close = () => {
      modal.hidden = true;
      document.body.style.overflow = "";
    };

    modal.querySelector("[data-history-lock-cancel]")?.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    modal.querySelector("[data-history-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-history-password]");
      const error = modal.querySelector("[data-history-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;
      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";
      try {
        const hash = await sha256(input.value);
        if (hash !== ACCESS_HASH) {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
          return;
        }
        sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
        close();
        openEditor();
      } catch (err) {
        console.error(err);
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });
    return modal;
  }

  function openModal() {
    const dialog = createModal();
    const input = dialog.querySelector("[data-history-password]");
    const error = dialog.querySelector("[data-history-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => input?.focus(), 30);
  }

  function createField(label, key, options = {}) {
    const full = options.full ? " dds-field-full" : "";
    const placeholder = h(options.placeholder || "");
    const help = options.help ? `<small class="dds-field-help">${h(options.help)}</small>` : "";
    if (options.textarea) {
      return `<label class="dds-field${full}"><span>${h(label)}</span><textarea rows="${options.rows || 3}" data-history-field="${h(key)}" placeholder="${placeholder}"></textarea>${help}</label>`;
    }
    return `<label class="dds-field${full}"><span>${h(label)}</span><input type="${options.type || "text"}" data-history-field="${h(key)}" placeholder="${placeholder}">${help}</label>`;
  }

  function bbcodeToolbar(target) {
    return `
      <div class="dds-rich-toolbar dds-bbcode-toolbar dds-history-bbcode-toolbar" data-history-bbcode-toolbar data-history-target="${h(target)}">
        <button type="button" data-history-bbcode="b" title="ตัวหนา"><b>B</b></button>
        <button type="button" data-history-bbcode="i" title="ตัวเอียง"><i>I</i></button>
        <button type="button" data-history-bbcode="u" title="ขีดเส้นใต้"><u>U</u></button>
        <button type="button" data-history-bbcode="s" title="ขีดฆ่า"><s>S</s></button>
        <label class="dds-rich-color" title="สีตัวอักษร"><span>A</span><input type="color" value="#8f0e16" data-history-bbcode-color></label>
        <button type="button" data-history-bbcode="size-small" title="ตัวอักษรเล็ก">A−</button>
        <button type="button" data-history-bbcode="size-medium" title="ตัวอักษรปกติ">A</button>
        <button type="button" data-history-bbcode="size-large" title="ตัวอักษรใหญ่">A+</button>
        <button type="button" data-history-bbcode="align-left" title="ชิดซ้าย">⇤</button>
        <button type="button" data-history-bbcode="align-center" title="กึ่งกลาง">↔</button>
        <button type="button" data-history-bbcode="align-right" title="ชิดขวา">⇥</button>
        <button type="button" data-history-bbcode="align-justify" title="เต็มบรรทัด">☰</button>
        <button type="button" data-history-bbcode="url" title="ลิงก์">↗</button>
        <button type="button" data-history-bbcode="img" title="รูปภาพ">▣</button>
        <button type="button" data-history-bbcode="video" title="YouTube">▶</button>
        <button type="button" data-history-bbcode="quote" title="Quote">❝</button>
        <button type="button" data-history-bbcode="code" title="Code">&lt;/&gt;</button>
        <button type="button" data-history-bbcode="spoiler" title="Spoiler">◉</button>
        <button type="button" data-history-bbcode="hide" title="Hide">▤</button>
        <button type="button" data-history-bbcode="list" title="รายการ">≡</button>
        <button type="button" data-history-bbcode="list-1" title="รายการตัวเลข">1≡</button>
        <button type="button" data-history-bbcode="hr" title="เส้นคั่น">—</button>
        <button type="button" data-history-bbcode="clear">CLEAR</button>
      </div>`;
  }

  function createLongTextField(label, key, rows = 8) {
    return `<label class="dds-field dds-field-full dds-history-bbcode-field"><span>${h(label)}</span>${bbcodeToolbar(key)}<textarea rows="${rows}" data-history-field="${h(key)}" data-history-textarea placeholder="กรอกข้อความ"></textarea><div class="dds-word-counter" data-history-word-counter="${h(key)}" data-empty="true"><span class="dds-word-counter-label">จำนวนคำ</span><strong><span data-history-word-count-number>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label>`;
  }

  function createPanel() {
    if (panel) return panel;
    const main = document.querySelector(".dds-main");
    const footer = main?.querySelector(".dds-footer");
    if (!main) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-history-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION" class="dds-back-button" data-protected-commission-back title="กลับหน้า COMMISSION" type="button">←</button>
        <div>
          <p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p>
          <h1 class="dds-history-commission-heading"><span>COMMISSION 2</span><span>— โค้ดประเภทประวัติ</span></h1>
          <p>กรอกข้อมูลทางขวา แล้วดูผลลัพธ์ทางซ้ายได้ทันที สี พื้นหลัง และโครงสร้างถูกฟิกไว้ตามงานต้นฉบับ</p>
        </div>
      </div>

      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>LANDON / COMMISSION 02</strong></div>
          <div class="dds-protected-commission-preview-stage dds-history-preview-stage" data-history-preview-stage>
            <iframe class="dds-protected-commission-preview-frame" data-history-preview scrolling="no" title="ตัวอย่างโค้ดประวัติ"></iframe>
          </div>
        </div>

        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft">
            <div><strong>บันทึกแบบร่าง</strong><small data-history-draft-status>ยังไม่มีแบบร่าง</small></div>
            <button type="button" data-history-save>SAVE DRAFT</button>
            <button type="button" data-history-delete>DELETE SAVE</button>
          </div>

          <div class="dds-protected-commission-scroll dds-history-commission-scroll">
            <section class="dds-control-section">
              <div class="dds-control-title"><span>01</span><h2>รูปภาพ</h2></div>
              <div class="dds-form-grid">
                ${createField("รูปโพลารอยด์ด้านซ้ายรูปที่ 1", "polaroidOne", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปโพลารอยด์ด้านซ้ายรูปที่ 2", "polaroidTwo", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปโปรไฟล์ในแถบ Notes", "sidebarImage", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปหลักใน Photo Booth", "photoMain", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปแถบ Photo Booth รูปที่ 1", "stripOne", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปแถบ Photo Booth รูปที่ 2", "stripTwo", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปแถบ Photo Booth รูปที่ 3", "stripThree", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูป Personality & Traits", "traitsImage", { full: true, type: "url", placeholder: "วางลิงก์รูป" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>02</span><h2>ข้อมูลส่วนบนและโปรไฟล์ย่อ</h2></div>
              <div class="dds-form-grid">
                ${createField("วันที่บนแถบเมนู", "menuDate", { placeholder: "เช่น Thu 6 Jun" })}
                ${createField("เวลาบนแถบเมนู", "menuTime", { placeholder: "เช่น 11:25 a.m." })}
                ${createField("วันที่เหนือหัวข้อ Notes", "noteDate", { full: true, placeholder: "เช่น 6 June 2026 at 11:25" })}
                ${createField("ชื่อหัวข้อหลัก", "mainTitle", { full: true, placeholder: "เช่น ♫ — LANDON ARCHIBALD RUTHERFORD" })}
                ${createField("ชื่อภาษาไทยใต้หัวข้อ", "thaiSubtitle", { full: true, placeholder: "กรอกชื่อภาษาไทย" })}
                ${createField("ชื่อแท็กใน Sidebar", "sidebarTag", { placeholder: "เช่น landon" })}
                ${createField("ชื่อในโปรไฟล์ย่อ", "sidebarName", { placeholder: "เช่น LANDON" })}
                ${createField("คำอธิบายในโปรไฟล์ย่อ", "sidebarRoles", { full: true, textarea: true, rows: 3, placeholder: "เช่น Musician\nSongwriter\nOmega" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>03</span><h2>Personal Info</h2></div>
              <div class="dds-form-grid">
                ${createField("ชื่อภาษาอังกฤษ", "nameEnglish", { full: true, placeholder: "กรอกชื่อภาษาอังกฤษ" })}
                ${createField("ชื่อภาษาไทย", "nameThai", { full: true, placeholder: "กรอกชื่อภาษาไทย" })}
                ${createField("ชื่อเล่น", "nickname", { placeholder: "กรอกชื่อเล่น" })}
                ${createField("วันเกิด", "birthday", { placeholder: "กรอกวันเกิด" })}
                ${createField("อายุ", "age", { placeholder: "กรอกอายุ" })}
                ${createField("เผ่าพันธุ์", "race", { placeholder: "กรอกเผ่าพันธุ์" })}
                ${createField("ชนชั้น", "className", { placeholder: "กรอกชนชั้น" })}
                ${createField("อาชีพ", "occupation", { full: true, placeholder: "กรอกอาชีพ" })}
                ${createField("Faceclaim", "faceclaim", { full: true, placeholder: "กรอก Faceclaim" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>04</span><h2>Biography หลัก</h2></div>
              <div class="dds-form-grid">
                ${createLongTextField("เนื้อหา Biography ก่อนข้อความคั่น — เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า", "mainBiography", 10)}
                ${createField("ข้อความคั่นกลาง", "mainQuote", { full: true, textarea: true, rows: 3, placeholder: "กรอกข้อความคั่นกลาง" })}
                ${createLongTextField("เนื้อหาหลังข้อความคั่น", "afterQuote", 6)}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>05</span><h2>บันทึกที่สองและเพลง</h2></div>
              <div class="dds-form-grid">
                ${createField("ชื่อหน้าต่าง", "secondWindowTitle", { full: true, placeholder: "เช่น Biography — Landon" })}
                ${createField("ข้อความเล็กเหนือหัวข้อ", "secondLabel", { placeholder: "เช่น UNTITLED NOTE" })}
                ${createField("หัวข้อบันทึก", "secondHeading", { placeholder: "เช่น Life without a pack" })}
                ${createLongTextField("เนื้อหาบันทึก — เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า", "secondBiography", 9)}
                ${createField("ชื่อเพลงหรือชื่อไฟล์เสียง", "audioTitle", { placeholder: "เช่น untitled song.mp3" })}
                ${createField("ระยะเวลาเพลง", "audioDuration", { placeholder: "เช่น 03:17" })}
                ${createField("ลิงก์เพลง (ไม่บังคับ)", "audioLink", { full: true, type: "url", placeholder: "วางลิงก์เพลง" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>06</span><h2>Personality & Traits</h2></div>
              <div class="dds-form-grid">
                ${createField("ชื่อหน้าต่าง", "traitsWindowTitle", { full: true, placeholder: "เช่น Personality & Traits" })}
                ${createField("ชื่อใต้รูป", "traitsCaption", { placeholder: "เช่น ARCHIE" })}
                ${createField("คำอธิบายใต้รูป", "traitsCaptionMeta", { placeholder: "เช่น CAMERA ROLL · 003" })}
                ${createLongTextField("เนื้อหา Personality & Traits — เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า", "traitsText", 11)}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>07</span><h2>Observation และแท็ก</h2></div>
              <div class="dds-form-grid">
                ${createField("ชื่อหน้าต่าง", "observationWindowTitle", { full: true, placeholder: "เช่น Observation Log.txt" })}
                ${createLongTextField("เนื้อหา Observation — เว้นบรรทัดว่างเพื่อแบ่งย่อหน้า", "observationText", 9)}
                ${createField("ข้อความคำพูดท้ายสุด", "finalQuote", { full: true, textarea: true, rows: 4, placeholder: "กรอกข้อความคำพูดท้ายสุด" })}
                <div class="dds-field dds-field-full dds-history-tags-field">
                  <span>แท็ก</span>
                  <div class="dds-history-tags-list" data-history-tags-list></div>
                  <button class="dds-history-add-tag" type="button" data-history-add-tag>＋ เพิ่มแท็ก</button>
                </div>
              </div>
            </section>
          </div>

          <section class="dds-protected-commission-copy dds-history-commission-copy">
            <div class="dds-control-title"><span>08</span><h2>คัดลอกโค้ด</h2></div>
            <p>กดปุ่มด้านล่างเพื่อคัดลอกโค้ดประวัติที่กรอกเสร็จแล้วไปใช้งาน</p>
            <div class="dds-protected-commission-copy-actions">
              <button type="button" data-history-copy>COPY CODE <span>↗</span></button>
              <button type="button" data-history-reset>RESET</button>
            </div>
          </section>
        </div>
      </div>`;

    if (footer) main.insertBefore(panel, footer);
    else main.appendChild(panel);

    panel.addEventListener("input", schedulePreview);
    panel.addEventListener("change", schedulePreview);
    panel.querySelector("[data-history-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-history-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-history-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-history-reset]")?.addEventListener("click", resetFields);
    panel.querySelector("[data-history-add-tag]")?.addEventListener("click", () => addTagRow(""));

    installBbcodeEditors();
    renderTagRows([]);
    return panel;
  }

  function stripBbcode(value) {
    return String(value ?? "")
      .replace(/\[(?:\/?(?:b|i|u|s|quote|code|hide|spoiler|list|\*)|hr)\]/gi, " ")
      .replace(/\[(?:color|size|align|url|video)(?:=[^\]]*)?\]/gi, " ")
      .replace(/\[\/(?:color|size|align|url|video)\]/gi, " ")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countWords(value) {
    const clean = stripBbcode(value);
    if (!clean) return 0;
    if (typeof Intl?.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("th", { granularity: "word" });
      let count = 0;
      for (const segment of segmenter.segment(clean)) if (segment.isWordLike) count += 1;
      return count;
    }
    return (clean.match(/[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g) || []).length;
  }

  function updateWordCounter(key) {
    const input = panel?.querySelector(`[data-history-field="${CSS.escape(key)}"]`);
    const counter = panel?.querySelector(`[data-history-word-counter="${CSS.escape(key)}"]`);
    if (!input || !counter) return;
    const count = countWords(input.value);
    const number = counter.querySelector("[data-history-word-count-number]");
    if (number) number.textContent = count.toLocaleString("th-TH");
    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function selectedText(target) {
    return target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0);
  }

  function replaceSelection(target, replacement, caretOffset = replacement.length) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.value = target.value.slice(0, start) + replacement + target.value.slice(end);
    const caret = start + caretOffset;
    target.focus();
    target.setSelectionRange(caret, caret);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function wrapTag(target, open, close) {
    const selected = selectedText(target);
    const replacement = `${open}${selected}${close}`;
    replaceSelection(target, replacement, selected ? replacement.length : open.length);
  }

  function applyBbcode(target, action, toolbar) {
    if (["b", "i", "u", "s", "quote", "code", "hide", "spoiler"].includes(action)) {
      wrapTag(target, `[${action}]`, `[/${action}]`);
      return;
    }
    const map = {
      "size-small": ["[size=small]", "[/size]"],
      "size-medium": ["[size=medium]", "[/size]"],
      "size-large": ["[size=large]", "[/size]"],
      "align-left": ["[align=left]", "[/align]"],
      "align-center": ["[align=center]", "[/align]"],
      "align-right": ["[align=right]", "[/align]"],
      "align-justify": ["[align=justify]", "[/align]"]
    };
    if (map[action]) {
      wrapTag(target, map[action][0], map[action][1]);
      return;
    }
    if (action === "color") {
      const color = toolbar.querySelector("[data-history-bbcode-color]")?.value || "#8f0e16";
      wrapTag(target, `[color=${color}]`, "[/color]");
      return;
    }
    if (action === "url" || action === "img" || action === "video") {
      const selected = selectedText(target);
      const promptText = action === "img" ? "ใส่ลิงก์รูปภาพ" : action === "video" ? "ใส่ลิงก์ YouTube" : "ใส่ลิงก์ URL";
      const url = window.prompt(promptText, /^https?:\/\//i.test(selected) ? selected : "https://");
      if (url === null) return;
      if (action === "img") replaceSelection(target, `[img]${url}[/img]`);
      else if (action === "video") replaceSelection(target, `[video=youtube]${url}[/video]`);
      else replaceSelection(target, `[url=${url}]${selected || url}[/url]`);
      return;
    }
    if (action === "list" || action === "list-1") {
      const selected = selectedText(target);
      const lines = selected.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const open = action === "list-1" ? "[list=1]" : "[list]";
      const body = lines.length ? lines.map((line) => `[*]${line}`).join("\n") : "[*]";
      replaceSelection(target, `${open}\n${body}\n[/list]`);
      return;
    }
    if (action === "hr") {
      replaceSelection(target, "[hr]");
      return;
    }
    if (action === "clear") {
      const selected = selectedText(target);
      if (!selected) {
        showToast("คลุมข้อความที่ต้องการล้าง BBCode ก่อน");
        return;
      }
      replaceSelection(target, stripBbcode(selected));
    }
  }

  function installBbcodeEditors() {
    panel?.querySelectorAll("[data-history-bbcode-toolbar]").forEach((toolbar) => {
      if (toolbar.dataset.ready === "true") return;
      toolbar.dataset.ready = "true";
      const key = toolbar.dataset.historyTarget;
      const target = panel.querySelector(`[data-history-field="${CSS.escape(key)}"]`);
      if (!target) return;
      toolbar.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) event.preventDefault();
      });
      toolbar.querySelectorAll("[data-history-bbcode]").forEach((button) => {
        button.addEventListener("click", () => applyBbcode(target, button.dataset.historyBbcode, toolbar));
      });
      toolbar.querySelector("[data-history-bbcode-color]")?.addEventListener("change", () => applyBbcode(target, "color", toolbar));
      target.addEventListener("input", () => updateWordCounter(key));
      updateWordCounter(key);
    });
  }

  function renderTagRows(tags) {
    const list = panel?.querySelector("[data-history-tags-list]");
    if (!list) return;
    list.innerHTML = "";
    const values = Array.isArray(tags) && tags.length ? tags : [""];
    values.forEach((value) => addTagRow(value));
  }

  function addTagRow(value = "") {
    const list = panel?.querySelector("[data-history-tags-list]");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "dds-history-tag-row";
    row.innerHTML = `<input type="text" data-history-tag placeholder="เช่น #werewolf" value="${h(value)}"><button type="button" aria-label="ลบแท็ก">×</button>`;
    row.querySelector("button")?.addEventListener("click", () => {
      row.remove();
      if (!list.querySelector("[data-history-tag]")) addTagRow("");
      schedulePreview();
    });
    row.querySelector("input")?.addEventListener("input", schedulePreview);
    list.appendChild(row);
  }

  function getValues() {
    const values = { ...defaults };
    panel?.querySelectorAll("[data-history-field]").forEach((field) => {
      values[field.dataset.historyField] = field.value;
    });
    values.tags = Array.from(panel?.querySelectorAll("[data-history-tag]") || [])
      .map((input) => input.value.trim())
      .filter(Boolean);
    return values;
  }

  function setValues(values) {
    const next = { ...defaults, ...(values || {}) };
    panel?.querySelectorAll("[data-history-field]").forEach((field) => {
      field.value = next[field.dataset.historyField] ?? "";
    });
    renderTagRows(Array.isArray(next.tags) ? next.tags : []);
    panel?.querySelectorAll("[data-history-word-counter]").forEach((counter) => updateWordCounter(counter.dataset.historyWordCounter));
  }

  function bbcodeToHtml(value) {
    let text = h(value).replace(/\r\n?/g, "\n");
    text = text
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=small\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:12px">$1</span>')
      .replace(/\[size=medium\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:15px">$1</span>')
      .replace(/\[size=large\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:20px">$1</span>')
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[img\]([^\[]+)\[\/img\]/gi, '<img src="$1" alt="" style="max-width:100%">')
      .replace(/\[video=youtube\]([^\[]+)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">▶ YouTube</a>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<span class="dds-history-bbcode-block">$1</span>')
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="dds-history-bbcode-block">$1</code>')
      .replace(/\[(?:hide|spoiler)\]([\s\S]*?)\[\/(?:hide|spoiler)\]/gi, '<span class="dds-history-bbcode-block">$1</span>')
      .replace(/\[hr\]/gi, "<hr>")
      .replace(/\[list(?:=1)?\]([\s\S]*?)\[\/list\]/gi, (_m, inner) => `<ul>${inner.replace(/\[\*\]([^\n]*)/g, "<li>$1</li>")}</ul>`)
      .replace(/\n/g, "<br>");
    return text;
  }

  function renderInline(value, previewMode) {
    return previewMode ? bbcodeToHtml(value) : h(value).replace(/\r\n?|\n/g, "<br>");
  }

  function renderParagraphs(value, previewMode) {
    const parts = String(value ?? "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return "<p></p>";
    return parts.map((part) => `<p>${renderInline(part, previewMode)}</p>`).join("");
  }

  function tagMarkup(tags) {
    return (tags || []).map((tag) => {
      const clean = String(tag || "").trim();
      if (!clean) return "";
      return `<span>${h(clean.startsWith("#") ? clean : `#${clean}`)}</span>`;
    }).join("");
  }

  function audioButton(values) {
    const button = '<button type="button">▶</button>';
    if (!String(values.audioLink || "").trim()) return button;
    return `<a href="${h(values.audioLink)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit">${button}</a>`;
  }

  function buildCode(values = getValues(), previewMode = false) {
    return `<link href="https://guindaeyo.github.io/css/commit-profland.css" rel="stylesheet"><div class="ldmac-wrap" style="--ldmac-bg:url('https://i.pinimg.com/736x/0b/86/83/0b8683bfc06629594074828c1cd50cdc.jpg');--ldmac-accent:#d69d12;"><div class="ldmac-menubar"><div class="ldmac-menu-left"><span class="ldmac-apple">●</span><strong>Finder</strong><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></div><div class="ldmac-menu-right"><span>⌁</span><span>◉</span><span>⌕</span><span>${h(values.menuDate)}</span><span>${h(values.menuTime)}</span></div></div><div class="ldmac-desktop"><div class="ldmac-polaroids"><div class="ldmac-polaroid ldmac-polaroid-one"><div style="--img:url('${cssUrl(values.polaroidOne)}');--x:50%;--y:30%;"></div></div><div class="ldmac-polaroid ldmac-polaroid-two"><div style="--img:url('${cssUrl(values.polaroidTwo)}');--x:50%;--y:30%;"></div></div></div><section class="ldmac-window ldmac-main-notes"><div class="ldmac-windowbar"><div class="ldmac-traffic"><i></i><i></i><i></i></div><div class="ldmac-window-title">Notes</div><div class="ldmac-window-actions"><span>⌕</span><span>⌘</span></div></div><div class="ldmac-notes-app"><aside class="ldmac-sidebar"><div class="ldmac-sidebar-heading"><strong>Notes</strong><span>147</span></div><div class="ldmac-sidebar-label">iCloud</div><div class="ldmac-sidebar-active"><span>▣ All iCloud</span><small>143</small></div><div class="ldmac-sidebar-item"><span>Recently Deleted</span><small>1</small></div><div class="ldmac-sidebar-label">Tags</div><div class="ldmac-sidebar-tag"><span>#</span><small>${h(values.sidebarTag)}</small></div><div class="ldmac-sidebar-preview"><div class="ldmac-sidebar-image" style="--img:url('${cssUrl(values.sidebarImage)}');--x:50%;--y:30%;"></div><strong>${h(values.sidebarName)}</strong><span>${h(values.sidebarRoles).replace(/\r\n?|\n/g, "<br>")}</span></div></aside><article class="ldmac-note"><div class="ldmac-note-toolbar"><span>✎</span><span>Aa</span><span>☷</span><span>▦</span><span>♩</span><span>⌕</span></div><div class="ldmac-note-date">${h(values.noteDate)}</div><h1>${h(values.mainTitle)}</h1><div class="ldmac-note-subtitle">${h(values.thaiSubtitle)}</div><h2>Personal Info</h2><div class="ldmac-info-grid"><div><span>ชื่อ</span><strong>${h(values.nameEnglish)}</strong><p>${h(values.nameThai)}</p></div><div><span>ชื่อเล่น</span><strong>${h(values.nickname)}</strong></div><div><span>วันเกิด</span><strong>${h(values.birthday)}</strong></div><div><span>อายุ</span><strong>${h(values.age)}</strong></div><div><span>เผ่าพันธุ์</span><strong>${h(values.race)}</strong></div><div><span>ชนชั้น</span><strong>${h(values.className)}</strong></div><div><span>อาชีพ</span><strong>${h(values.occupation)}</strong></div><div><span>Faceclaim</span><strong>${h(values.faceclaim)}</strong></div></div><h2>Biography</h2>${renderParagraphs(values.mainBiography, previewMode)}<div class="ldmac-note-quote">${renderInline(values.mainQuote, previewMode)}</div>${renderParagraphs(values.afterQuote, previewMode)}</article></div></section><section class="ldmac-window ldmac-photobooth"><div class="ldmac-windowbar ldmac-photo-bar"><div class="ldmac-traffic"><i></i><i></i><i></i></div><div class="ldmac-window-title">Photo Booth</div><div></div></div><div class="ldmac-photo-screen"><div class="ldmac-photo-main" style="--img:url('${cssUrl(values.photoMain)}');--x:50%;--y:30%;"></div><div class="ldmac-photo-strip"><div class="ldmac-strip-img" style="--img:url('${cssUrl(values.stripOne)}');--x:50%;--y:30%;"></div><div class="ldmac-strip-img" style="--img:url('${cssUrl(values.stripTwo)}');--x:50%;--y:30%;"></div><div class="ldmac-strip-img" style="--img:url('${cssUrl(values.stripThree)}');--x:50%;--y:30%;"></div></div></div><div class="ldmac-photo-control"><div><span>▦</span><span>▣</span></div><button type="button"></button><span>Effects</span></div></section><section class="ldmac-window ldmac-second-notes"><div class="ldmac-windowbar"><div class="ldmac-traffic"><i></i><i></i><i></i></div><div class="ldmac-window-title">${h(values.secondWindowTitle)}</div><div class="ldmac-window-actions"><span>Aa</span><span>⌕</span></div></div><article class="ldmac-document"><div class="ldmac-document-heading"><span>${h(values.secondLabel)}</span><strong>${h(values.secondHeading)}</strong></div>${renderParagraphs(values.secondBiography, previewMode)}<div class="ldmac-audio">${audioButton(values)}<div class="ldmac-audio-info"><strong>${h(values.audioTitle)}</strong><div class="ldmac-audio-line"><span></span></div></div><small>${h(values.audioDuration)}</small></div></article></section><section class="ldmac-window ldmac-traits-window"><div class="ldmac-windowbar"><div class="ldmac-traffic"><i></i><i></i><i></i></div><div class="ldmac-window-title">${h(values.traitsWindowTitle)}</div><div class="ldmac-window-actions"><span>⌕</span><span>↥</span></div></div><div class="ldmac-traits-layout"><div class="ldmac-traits-picture"><div class="ldmac-traits-img" style="--img:url('${cssUrl(values.traitsImage)}');--x:50%;--y:30%;"></div><div class="ldmac-picture-caption"><strong>${h(values.traitsCaption)}</strong><span>${h(values.traitsCaptionMeta)}</span></div></div><article class="ldmac-traits-text">${renderParagraphs(values.traitsText, previewMode)}</article></div></section><section class="ldmac-window ldmac-last-window"><div class="ldmac-windowbar"><div class="ldmac-traffic"><i></i><i></i><i></i></div><div class="ldmac-window-title">${h(values.observationWindowTitle)}</div><div class="ldmac-window-actions"><span>⌕</span></div></div><article class="ldmac-last-content">${renderParagraphs(values.observationText, previewMode)}<div class="ldmac-final-quote">${renderInline(values.finalQuote, previewMode)}</div><div class="ldmac-tags">${tagMarkup(values.tags)}</div></article></section><div class="ldmac-dock"><span class="ldmac-dock-finder">◉</span><span class="ldmac-dock-browser">⌕</span><span class="ldmac-dock-music">♫</span><span class="ldmac-dock-mail">✉</span><span class="ldmac-dock-notes">▤</span><span class="ldmac-dock-photo">✿</span><span class="ldmac-dock-settings">⚙</span></div></div></div><div class="fdreview-credit"><span></span></div>`;
  }

  function buildPreviewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=${CANVAS_WIDTH}"><style>
      html,body{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important}
      body{position:relative!important;min-height:1px!important}
      .dds-history-preview-positioner{position:relative!important;display:block!important;width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;transform:none!important}
      .dds-history-preview-positioner>.ldmac-wrap,.ldmac-wrap{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;transform:none!important}
      .dds-history-bbcode-block{display:inline-block;padding:2px 5px;border:1px solid rgba(0,0,0,.12)}
    </style></head><body><div class="dds-history-preview-positioner" data-history-preview-positioner>${code}</div></body></html>`;
  }

  function fitPreview() {
    const iframe = panel?.querySelector("[data-history-preview]");
    const stage = panel?.querySelector("[data-history-preview-stage]");
    if (!iframe || !stage) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const positioner = doc.querySelector("[data-history-preview-positioner]");
      const root = doc.querySelector(".ldmac-wrap");
      if (positioner) {
        positioner.style.width = `${CANVAS_WIDTH}px`;
        positioner.style.minWidth = `${CANVAS_WIDTH}px`;
        positioner.style.maxWidth = `${CANVAS_WIDTH}px`;
        positioner.style.transform = "none";
      }
      if (root) {
        root.style.width = `${CANVAS_WIDTH}px`;
        root.style.minWidth = `${CANVAS_WIDTH}px`;
        root.style.maxWidth = `${CANVAS_WIDTH}px`;
        root.style.margin = "0";
        root.style.transform = "none";
      }
      const naturalHeight = Math.max(
        positioner?.scrollHeight || 0,
        positioner?.offsetHeight || 0,
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        doc.body.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        1
      );
      const availableWidth = Math.max(1, stage.clientWidth - 24);
      const scale = Math.min(1, availableWidth / CANVAS_WIDTH);
      iframe.style.width = `${CANVAS_WIDTH}px`;
      iframe.style.maxWidth = "none";
      iframe.style.left = "50%";
      iframe.style.top = "0";
      iframe.style.height = `${Math.ceil(naturalHeight)}px`;
      iframe.style.transformOrigin = "top center";
      iframe.style.transform = `translateX(-50%) scale(${scale})`;
      stage.style.height = `${Math.max(720, Math.ceil(naturalHeight * scale))}px`;
    } catch (err) {
      console.warn("Could not fit history commission preview", err);
    }
  }

  function updatePreview() {
    if (!panel) return;
    const iframe = panel.querySelector("[data-history-preview]");
    if (!iframe) return;
    const next = buildPreviewDocument(buildCode(getValues(), true));
    if (iframe.srcdoc === next) {
      fitPreview();
      return;
    }
    iframe.onload = () => {
      fitPreview();
      iframe.contentDocument?.fonts?.ready?.then(fitPreview).catch(() => {});
      const images = Array.from(iframe.contentDocument?.images || []);
      images.forEach((image) => {
        if (!image.complete) image.addEventListener("load", fitPreview, { once: true });
      });
      window.setTimeout(fitPreview, 120);
      window.setTimeout(fitPreview, 500);
      window.setTimeout(fitPreview, 1200);
    };
    iframe.srcdoc = next;
  }

  function schedulePreview() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(updatePreview, 90);
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) return "ยังไม่มีแบบร่าง";
    try {
      return `บันทึกล่าสุด ${new Date(timestamp).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return "มีแบบร่างที่บันทึกไว้";
    }
  }

  function setDraftStatus(timestamp = 0) {
    const status = panel?.querySelector("[data-history-draft-status]");
    if (status) status.textContent = formatSavedTime(timestamp);
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.values ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
    setDraftStatus(savedAt);
    showToast("บันทึกแบบร่างโค้ดประวัติแล้ว");
  }

  function deleteDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setValues(defaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(defaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode(getValues(), false);
    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ดประวัติแล้ว");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("คัดลอกโค้ดประวัติแล้ว");
    }
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.panel === panelName);
    });
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === "commission");
    });
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openEditor() {
    const editorPanel = createPanel();
    if (!editorPanel) return;
    const draft = getDraft();
    setValues(draft?.values || defaults);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    updatePreview();
  }

  function install() {
    const original = document.querySelector('[data-edit-protected-commission="commission002"], [data-edit-history-commission="commission002"]');
    if (!original) return;

    // เปลี่ยนปุ่มทั้งก้อนเพื่อล้าง listener ของ editor HTML ดิบเดิม
    const button = original.cloneNode(true);
    button.removeAttribute("data-edit-protected-commission");
    button.setAttribute("data-edit-history-commission", "commission002");
    original.replaceWith(button);

    // ลบ panel HTML ดิบเก่าหากเคยถูกสร้างไว้
    document.querySelector('[data-panel="protected-commission002"]')?.remove();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "1") openEditor();
      else openModal();
    });

    window.addEventListener("resize", fitPreview);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* =========================================================
   MIKAEL COMMISSION 003 — PASSWORD-GATED HOUSE EDITOR
   ใช้รหัสร่วมสำหรับงานของ MIKAEL F. KAISER
   ========================================================= */
(() => {
  "use strict";

  const ACCESS_HASH = "eb826ef52686f3139fee3102ae3309a785481071f03a55fb0d8a5f80b5f72789";
  const ACCESS_SESSION_KEY = "dds:mikael-commission-editor:unlocked";
  const PANEL_NAME = "protected-commission003-mikael-house";
  const DRAFT_KEY = "dds:commission-draft:mikael:commission003:structured-v1";
  const CANVAS_WIDTH = 1040;
  const CARD_SELECTOR = ".dds-commission-three-card";

  const defaults = Object.freeze({
    heroImage: "",
    roomImage1: "",
    roomImage2: "",
    roomImage3: "",
    roomImage4: "",
    roomImage5: "",
    roomImage6: "",
    roomImage7: "",
    roomImage8: "",
    residentImage1: "",
    residentImage2: "",
    residentImage3: "",

    monogram: "",
    heroLabel: "",
    heroSmall: "",
    houseName: "",
    heroThai: "",

    introSmall: "",
    introHeading: "",
    houseTag1: "",
    houseTag2: "",
    houseTag3: "",
    houseTag4: "",
    introText1: "",
    introText2: "",

    featureIcon1: "",
    featureTitle1: "",
    featureSubtitle1: "",
    featureIcon2: "",
    featureTitle2: "",
    featureSubtitle2: "",
    featureIcon3: "",
    featureTitle3: "",
    featureSubtitle3: "",

    roomSectionSmall: "",
    roomSectionTitle: "",
    roomSectionNote: "",

    roomName1: "",
    roomSubtitle1: "",
    roomDescription1: "",
    roomName2: "",
    roomSubtitle2: "",
    roomDescription2: "",
    roomName3: "",
    roomSubtitle3: "",
    roomDescription3: "",
    roomName4: "",
    roomSubtitle4: "",
    roomDescription4: "",
    roomName5: "",
    roomSubtitle5: "",
    roomDescription5: "",
    roomName6: "",
    roomSubtitle6: "",
    roomDescription6: "",
    roomName7: "",
    roomSubtitle7: "",
    roomDescription7: "",
    roomName8: "",
    roomSubtitle8: "",
    roomDescription8: "",

    residentSectionSmall: "",
    residentSectionTitle: "",
    residentLabel1: "",
    residentName1: "",
    residentLabel2: "",
    residentName2: "",
    residentLabel3: "",
    residentName3: "",

    footerMark: "",
    footerHeading: "",
    footerText: ""
  });

  let panel = null;
  let modal = null;
  let previewTimer = 0;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cssUrl(value) {
    return String(value ?? "")
      .trim()
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/[\r\n]+/g, "");
  }

  function textWithBreaks(value) {
    return h(value).replace(/\r\n?|\n/g, "<br>");
  }

  function textParagraph(value) {
    return textWithBreaks(value);
  }

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    let toast = document.getElementById("ddsMikaelEditorToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "ddsMikaelEditorToast";
      toast.className = "dds-copy-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toast._hideTimer);
    toast._hideTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  }

  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function createField(label, key, options = {}) {
    const {
      full = false,
      textarea = false,
      rows = 3,
      placeholder = "กรอกข้อความ",
      type = "text",
      help = ""
    } = options;

    const fieldClass = `dds-field${full ? " dds-field-full" : ""}`;
    const control = textarea
      ? `<textarea rows="${rows}" data-mikael-field="${h(key)}" placeholder="${h(placeholder)}"></textarea>`
      : `<input type="${h(type)}" data-mikael-field="${h(key)}" placeholder="${h(placeholder)}">`;

    return `<label class="${fieldClass}"><span>${h(label)}</span>${control}${help ? `<small class="dds-food-field-help">${h(help)}</small>` : ""}</label>`;
  }

  function createRoomGroup(index, title) {
    return `
      <div class="dds-mikael-room-group">
        <div class="dds-mikael-room-group-title"><span>${String(index).padStart(2, "0")}</span><strong>${h(title)}</strong></div>
        <div class="dds-form-grid">
          ${createField("ชื่อห้อง", `roomName${index}`, { placeholder: "กรอกชื่อห้อง" })}
          ${createField("ข้อความใต้ชื่อห้อง", `roomSubtitle${index}`, { placeholder: "กรอกข้อความใต้ชื่อ" })}
          ${createField("รายละเอียดห้อง", `roomDescription${index}`, { full: true, textarea: true, rows: 5, placeholder: "กรอกรายละเอียดห้อง" })}
        </div>
      </div>`;
  }

  function getValues() {
    const values = { ...defaults };
    panel?.querySelectorAll("[data-mikael-field]").forEach((field) => {
      values[field.dataset.mikaelField] = field.value;
    });
    return values;
  }

  function setValues(values = defaults) {
    const next = { ...defaults, ...(values || {}) };
    panel?.querySelectorAll("[data-mikael-field]").forEach((field) => {
      field.value = next[field.dataset.mikaelField] ?? "";
    });
  }

  function roomMarkup(values, index) {
    const number = String(index).padStart(2, "0");
    const name = values[`roomName${index}`];
    const subtitle = values[`roomSubtitle${index}`];
    const description = values[`roomDescription${index}`];

    return `<details class="frdh-room"><summary class="frdh-room-summary"><div class="frdh-room-photo frdh-room-photo-${index}"></div><div class="frdh-room-caption"><span>${number}</span><div><strong>${h(name)}</strong><small>${h(subtitle)}</small></div></div><div class="frdh-open-icon"></div></summary><div class="frdh-room-detail"><div class="frdh-room-detail-title">${h(name)}</div><p>${textParagraph(description)}</p></div></details>`;
  }

  function buildCode(values = getValues()) {
    const rooms = Array.from({ length: 8 }, (_, index) => roomMarkup(values, index + 1)).join("");

    return `<link href="https://guindaeyo.github.io/css/code-friedfs.css" rel="stylesheet"><div class="frdh-wrap" style="--frdh-hero:url('${cssUrl(values.heroImage)}');--frdh-hero-pos:center 80%; --frdh-room-1:url('${cssUrl(values.roomImage1)}'); --frdh-room-1-pos:center 50%; --frdh-room-2:url('${cssUrl(values.roomImage2)}'); --frdh-room-2-pos:center 50%; --frdh-room-3:url('${cssUrl(values.roomImage3)}'); --frdh-room-3-pos:center 50%; --frdh-room-4:url('${cssUrl(values.roomImage4)}'); --frdh-room-4-pos:center 50%; --frdh-room-5:url('${cssUrl(values.roomImage5)}'); --frdh-room-5-pos:center 50%; --frdh-room-6:url('${cssUrl(values.roomImage6)}'); --frdh-room-6-pos:center 50%; --frdh-room-7:url('${cssUrl(values.roomImage7)}'); --frdh-room-7-pos:center 50%; --frdh-room-8:url('${cssUrl(values.roomImage8)}'); --frdh-room-8-pos:center 50%; --frdh-person-1:url('${cssUrl(values.residentImage1)}'); --frdh-person-1-pos:center 30%; --frdh-person-2:url('${cssUrl(values.residentImage2)}'); --frdh-person-2-pos:center 30%; --frdh-person-3:url('${cssUrl(values.residentImage3)}');--frdh-person-3-pos:center 30%;"><div class="frdh-hero"><div class="frdh-hero-shade"></div><div class="frdh-hero-top"><div class="frdh-monogram">${h(values.monogram)}</div><div class="frdh-hero-label">${h(values.heroLabel)}</div></div><div class="frdh-hero-title"><div class="frdh-hero-small">${h(values.heroSmall)}</div><div class="frdh-name">${h(values.houseName)}</div><div class="frdh-hero-thai">${textWithBreaks(values.heroThai)}</div></div></div><div class="frdh-intro"><div class="frdh-intro-heading"><div class="frdh-number">01</div><div class="frdh-heading-small">${h(values.introSmall)}</div><div class="frdh-heading-main">${h(values.introHeading)}</div><div class="frdh-heading-line"></div><div class="frdh-house-tags"><span>${h(values.houseTag1)}</span><span>${h(values.houseTag2)}</span><span>${h(values.houseTag3)}</span><span>${h(values.houseTag4)}</span></div></div><div class="frdh-intro-text"><p>${textParagraph(values.introText1)}</p><p>${textParagraph(values.introText2)}</p></div></div><div class="frdh-features"><div class="frdh-feature"><div class="frdh-feature-icon">${h(values.featureIcon1)}</div><div><strong>${h(values.featureTitle1)}</strong><span>${h(values.featureSubtitle1)}</span></div></div><div class="frdh-feature"><div class="frdh-feature-icon">${h(values.featureIcon2)}</div><div><strong>${h(values.featureTitle2)}</strong><span>${h(values.featureSubtitle2)}</span></div></div><div class="frdh-feature"><div class="frdh-feature-icon">${h(values.featureIcon3)}</div><div><strong>${h(values.featureTitle3)}</strong><span>${h(values.featureSubtitle3)}</span></div></div></div><div class="frdh-section"><div class="frdh-section-head"><div><div class="frdh-section-number">02</div><div class="frdh-section-small">${h(values.roomSectionSmall)}</div><div class="frdh-section-title">${h(values.roomSectionTitle)}</div></div><div class="frdh-section-note">${textWithBreaks(values.roomSectionNote)}</div></div><div class="frdh-room-grid">${rooms}</div></div><div class="frdh-resident-section"><div class="frdh-resident-head"><div class="frdh-section-number frdh-section-number-light">03</div><div class="frdh-section-small frdh-section-small-light">${h(values.residentSectionSmall)}</div><div class="frdh-resident-title">${h(values.residentSectionTitle)}</div></div><div class="frdh-resident-grid"><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-1"></div><div class="frdh-person-info"><div class="frdh-person-no">${h(values.residentLabel1)}</div><div class="frdh-person-name">${h(values.residentName1)}</div></div></div><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-2"></div><div class="frdh-person-info"><div class="frdh-person-no">${h(values.residentLabel2)}</div><div class="frdh-person-name">${h(values.residentName2)}</div></div></div><div class="frdh-person-card" style="--frdh-person-bottom:20px;"><div class="frdh-person-photo frdh-person-photo-3"></div><div class="frdh-person-info"><div class="frdh-person-no">${h(values.residentLabel3)}</div><div class="frdh-person-name">${h(values.residentName3)}</div></div></div></div></div><div class="frdh-footer"><div class="frdh-footer-mark">${h(values.footerMark)}</div><div><strong>${h(values.footerHeading)}</strong><span>${textWithBreaks(values.footerText)}</span></div><div class="frdh-footer-line"></div></div></div>`;
  }

  function buildPreviewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=${CANVAS_WIDTH}"><style>
      html,body{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important}
      body{position:relative!important;min-height:1px!important}
      .dds-mikael-preview-positioner{position:relative!important;display:block!important;width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;transform:none!important}
      .dds-mikael-preview-positioner>.frdh-wrap,.frdh-wrap{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;transform:none!important}
    </style></head><body><div class="dds-mikael-preview-positioner" data-mikael-preview-positioner>${code}</div></body></html>`;
  }

  function fitPreview() {
    const iframe = panel?.querySelector("[data-mikael-preview]");
    const stage = panel?.querySelector("[data-mikael-preview-stage]");
    if (!iframe || !stage) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      const positioner = doc.querySelector("[data-mikael-preview-positioner]");
      const root = doc.querySelector(".frdh-wrap");

      if (positioner) {
        positioner.style.width = `${CANVAS_WIDTH}px`;
        positioner.style.minWidth = `${CANVAS_WIDTH}px`;
        positioner.style.maxWidth = `${CANVAS_WIDTH}px`;
        positioner.style.transform = "none";
      }

      if (root) {
        root.style.width = `${CANVAS_WIDTH}px`;
        root.style.minWidth = `${CANVAS_WIDTH}px`;
        root.style.maxWidth = `${CANVAS_WIDTH}px`;
        root.style.margin = "0";
        root.style.transform = "none";
      }

      const naturalHeight = Math.max(
        positioner?.scrollHeight || 0,
        positioner?.offsetHeight || 0,
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        doc.body.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
        1
      );
      const availableWidth = Math.max(1, stage.clientWidth - 24);
      const scale = Math.min(1, availableWidth / CANVAS_WIDTH);
      const scaledHeight = Math.ceil(naturalHeight * scale);

      iframe.style.width = `${CANVAS_WIDTH}px`;
      iframe.style.minWidth = `${CANVAS_WIDTH}px`;
      iframe.style.maxWidth = "none";
      iframe.style.left = "50%";
      iframe.style.top = "0";
      iframe.style.height = `${Math.ceil(naturalHeight)}px`;
      iframe.style.minHeight = `${Math.ceil(naturalHeight)}px`;
      iframe.style.transformOrigin = "top center";
      iframe.style.transform = `translateX(-50%) scale(${scale})`;
      stage.style.height = `${Math.max(720, scaledHeight)}px`;
    } catch (error) {
      console.warn("[DDS] Could not fit Mikael commission preview", error);
    }
  }

  function updatePreview() {
    if (!panel) return;
    const iframe = panel.querySelector("[data-mikael-preview]");
    if (!iframe) return;

    const next = buildPreviewDocument(buildCode(getValues()));
    iframe.onload = () => {
      fitPreview();
      const doc = iframe.contentDocument;
      doc?.fonts?.ready?.then(fitPreview).catch(() => {});
      doc?.querySelectorAll("details").forEach((detailsElement) => {
        detailsElement.addEventListener("toggle", fitPreview);
      });
      Array.from(doc?.images || []).forEach((image) => {
        if (!image.complete) image.addEventListener("load", fitPreview, { once: true });
      });
      [100, 350, 800, 1500].forEach((delay) => window.setTimeout(fitPreview, delay));
    };
    iframe.srcdoc = next;
  }

  function schedulePreview() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(updatePreview, 80);
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) return "ยังไม่มีแบบร่าง";
    try {
      return `บันทึกล่าสุด ${new Date(timestamp).toLocaleString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    } catch {
      return "มีแบบร่างที่บันทึกไว้";
    }
  }

  function setDraftStatus(timestamp = 0) {
    const status = panel?.querySelector("[data-mikael-draft-status]");
    if (status) status.textContent = formatSavedTime(timestamp);
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.values ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
    setDraftStatus(savedAt);
    showToast("บันทึกแบบร่างโค้ดบ้านแล้ว");
  }

  function deleteDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setValues(defaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(defaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode(getValues());
    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ดกระทู้บ้านแล้ว");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("คัดลอกโค้ดกระทู้บ้านแล้ว");
    }
  }

  function createPanel() {
    if (panel?.isConnected) return panel;

    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-mikael-house-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION" class="dds-back-button" data-protected-commission-back title="กลับหน้า COMMISSION" type="button">←</button>
        <div>
          <p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p>
          <h1 class="dds-mikael-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทกระทู้บ้าน</span></h1>
          <p>กรอกข้อมูลทางขวา แล้วดูตัวอย่างทั้งหมดทางซ้าย สีและโครงสร้างถูกฟิกไว้ตามงานต้นฉบับ</p>
        </div>
      </div>

      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>MIKAEL / COMMISSION 03</strong></div>
          <div class="dds-protected-commission-preview-stage dds-mikael-preview-stage" data-mikael-preview-stage>
            <iframe class="dds-protected-commission-preview-frame" data-mikael-preview scrolling="no" title="ตัวอย่างโค้ดกระทู้บ้าน"></iframe>
          </div>
        </div>

        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft">
            <div><strong>บันทึกแบบร่าง</strong><small data-mikael-draft-status>ยังไม่มีแบบร่าง</small></div>
            <button type="button" data-mikael-save>SAVE DRAFT</button>
            <button type="button" data-mikael-delete>DELETE SAVE</button>
          </div>

          <div class="dds-protected-commission-scroll dds-mikael-house-scroll">
            <section class="dds-control-section">
              <div class="dds-control-title"><span>01</span><h2>รูปภาพ</h2></div>
              <div class="dds-form-grid">
                ${createField("รูปหน้าปกบ้าน", "heroImage", { full: true, type: "url", placeholder: "วางลิงก์รูปหน้าปก" })}
                ${Array.from({ length: 8 }, (_, index) => createField(`รูปห้องที่ ${index + 1}`, `roomImage${index + 1}`, { type: "url", placeholder: "วางลิงก์รูปห้อง" })).join("")}
                ${createField("รูปผู้อาศัยที่ 1", "residentImage1", { type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปผู้อาศัยที่ 2", "residentImage2", { type: "url", placeholder: "วางลิงก์รูป" })}
                ${createField("รูปผู้อาศัยที่ 3", "residentImage3", { type: "url", placeholder: "วางลิงก์รูป" })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>02</span><h2>ส่วนหัวและข้อมูลบ้าน</h2></div>
              <div class="dds-form-grid">
                ${createField("สัญลักษณ์มุมบน", "monogram", { placeholder: "เช่น F" })}
                ${createField("ชื่อมุมบน", "heroLabel", { placeholder: "กรอกชื่อ" })}
                ${createField("ข้อความเหนือชื่อบ้าน", "heroSmall", { placeholder: "เช่น WELCOME TO" })}
                ${createField("ชื่อบ้าน", "houseName", { placeholder: "กรอกชื่อบ้าน" })}
                ${createField("ข้อความใต้ชื่อบ้าน", "heroThai", { full: true, textarea: true, rows: 3 })}
                ${createField("หัวข้อเล็กส่วนแนะนำ", "introSmall", { placeholder: "เช่น ABOUT THE HOUSE" })}
                ${createField("หัวข้อหลักส่วนแนะนำ", "introHeading", { placeholder: "กรอกหัวข้อ" })}
                ${createField("แท็กบ้าน 1", "houseTag1", { placeholder: "กรอกแท็ก" })}
                ${createField("แท็กบ้าน 2", "houseTag2", { placeholder: "กรอกแท็ก" })}
                ${createField("แท็กบ้าน 3", "houseTag3", { placeholder: "กรอกแท็ก" })}
                ${createField("แท็กบ้าน 4", "houseTag4", { placeholder: "กรอกแท็ก" })}
                ${createField("คำอธิบายบ้าน ย่อหน้าที่ 1", "introText1", { full: true, textarea: true, rows: 7 })}
                ${createField("คำอธิบายบ้าน ย่อหน้าที่ 2", "introText2", { full: true, textarea: true, rows: 7 })}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>03</span><h2>จุดเด่นของบ้าน</h2></div>
              <div class="dds-mikael-feature-grid">
                ${[1, 2, 3].map((index) => `
                  <div class="dds-mikael-feature-group">
                    <strong>จุดเด่นที่ ${index}</strong>
                    <div class="dds-form-grid">
                      ${createField("สัญลักษณ์", `featureIcon${index}`, { placeholder: "เช่น ☼" })}
                      ${createField("หัวข้อ", `featureTitle${index}`, { placeholder: "กรอกหัวข้อ" })}
                      ${createField("ข้อความใต้หัวข้อ", `featureSubtitle${index}`, { full: true, placeholder: "กรอกข้อความ" })}
                    </div>
                  </div>`).join("")}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>04</span><h2>พื้นที่ภายในบ้าน</h2></div>
              <div class="dds-form-grid">
                ${createField("หัวข้อเล็ก", "roomSectionSmall", { placeholder: "เช่น ROOM DIRECTORY" })}
                ${createField("หัวข้อหลัก", "roomSectionTitle", { placeholder: "กรอกหัวข้อ" })}
                ${createField("ข้อความกำกับ", "roomSectionNote", { full: true, textarea: true, rows: 3 })}
              </div>
              <div class="dds-mikael-room-list">
                ${createRoomGroup(1, "ห้องที่ 1")}
                ${createRoomGroup(2, "ห้องที่ 2")}
                ${createRoomGroup(3, "ห้องที่ 3")}
                ${createRoomGroup(4, "ห้องที่ 4")}
                ${createRoomGroup(5, "ห้องที่ 5")}
                ${createRoomGroup(6, "ห้องที่ 6")}
                ${createRoomGroup(7, "ห้องที่ 7")}
                ${createRoomGroup(8, "ห้องที่ 8")}
              </div>
            </section>

            <section class="dds-control-section">
              <div class="dds-control-title"><span>05</span><h2>ผู้อาศัยและส่วนท้าย</h2></div>
              <div class="dds-form-grid">
                ${createField("หัวข้อเล็กส่วนผู้อาศัย", "residentSectionSmall", { placeholder: "เช่น CURRENT RESIDENTS" })}
                ${createField("หัวข้อหลักส่วนผู้อาศัย", "residentSectionTitle", { placeholder: "กรอกหัวข้อ" })}
                ${createField("ป้ายผู้อาศัยที่ 1", "residentLabel1", { placeholder: "เช่น RESIDENT 01" })}
                ${createField("ชื่อผู้อาศัยที่ 1", "residentName1", { placeholder: "กรอกชื่อ" })}
                ${createField("ป้ายผู้อาศัยที่ 2", "residentLabel2", { placeholder: "เช่น RESIDENT 02" })}
                ${createField("ชื่อผู้อาศัยที่ 2", "residentName2", { placeholder: "กรอกชื่อ" })}
                ${createField("ป้ายผู้อาศัยที่ 3", "residentLabel3", { placeholder: "เช่น RESIDENT 03" })}
                ${createField("ชื่อผู้อาศัยที่ 3", "residentName3", { placeholder: "กรอกชื่อ" })}
                ${createField("สัญลักษณ์ส่วนท้าย", "footerMark", { placeholder: "เช่น F" })}
                ${createField("ชื่อส่วนท้าย", "footerHeading", { placeholder: "กรอกชื่อ" })}
                ${createField("ข้อความส่วนท้าย", "footerText", { full: true, textarea: true, rows: 5 })}
              </div>
            </section>
          </div>

          <section class="dds-protected-commission-copy dds-mikael-house-copy">
            <div class="dds-control-title"><span>06</span><h2>คัดลอกโค้ด</h2></div>
            <p>กดปุ่มด้านล่างเพื่อคัดลอกโค้ดที่กรอกเสร็จแล้วไปใช้งาน</p>
            <div class="dds-protected-commission-copy-actions">
              <button type="button" data-mikael-copy>COPY CODE <span>↗</span></button>
              <button type="button" data-mikael-reset>RESET</button>
            </div>
          </section>
        </div>
      </div>`;

    footer.before(panel);

    panel.addEventListener("input", schedulePreview);
    panel.addEventListener("change", schedulePreview);
    panel.querySelector("[data-mikael-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-mikael-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-mikael-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-mikael-reset]")?.addEventListener("click", resetFields);

    return panel;
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.panel === panelName);
    });
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === "commission");
    });
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    history.replaceState(null, "", "#commission-mikael-editor");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openEditor() {
    const editorPanel = createPanel();
    if (!editorPanel) return;
    const draft = getDraft();
    setValues(draft?.values || defaults);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    updatePreview();
  }

  function createModal() {
    if (modal?.isConnected) return modal;

    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.id = "ddsMikaelCommissionLockModal";
    modal.hidden = true;
    modal.innerHTML = `
      <form class="dds-commission-lock-dialog" data-mikael-lock-form>
        <small>CLIENT ACCESS / MIKAEL F. KAISER</small>
        <h2>Protected editor</h2>
        <p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p>
        <label class="dds-commission-lock-field">
          <span>รหัสผ่าน</span>
          <input type="password" autocomplete="current-password" data-mikael-lock-input placeholder="กรอกรหัสผ่าน">
        </label>
        <p class="dds-commission-lock-error" data-mikael-lock-error aria-live="polite"></p>
        <div class="dds-commission-lock-actions">
          <button type="submit">UNLOCK EDITOR</button>
          <button type="button" data-mikael-lock-close>CANCEL</button>
        </div>
      </form>`;

    document.body.appendChild(modal);

    modal.querySelector("[data-mikael-lock-close]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector("[data-mikael-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-mikael-lock-input]");
      const error = modal.querySelector("[data-mikael-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;

      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";

      try {
        const hash = await sha256(input.value || "");
        if (hash === ACCESS_HASH) {
          sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
          error.textContent = "";
          closeModal();
          openEditor();
          return;
        }

        error.textContent = "รหัสผ่านไม่ถูกต้อง";
        input.select();
      } catch (errorObject) {
        console.warn("[DDS] Could not verify Mikael password", errorObject);
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });

    return modal;
  }

  function openModal() {
    const lockModal = createModal();
    lockModal.hidden = false;
    document.body.classList.add("dds-modal-open");
    const input = lockModal.querySelector("[data-mikael-lock-input]");
    const error = lockModal.querySelector("[data-mikael-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    requestAnimationFrame(() => input?.focus());
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("dds-modal-open");
  }

  function addEditButton() {
    const card = document.querySelector(CARD_SELECTOR);
    if (!card) return false;
    if (card.querySelector("[data-edit-mikael-commission]")) return true;

    const body = card.querySelector(".dds-commission-card-body");
    const viewButton = card.querySelector("[data-view-commission-three]");
    if (!body || !viewButton) return false;

    let actions = body.querySelector(".dds-commission-card-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "dds-commission-card-actions";
      viewButton.before(actions);
      actions.appendChild(viewButton);
    }

    const editButton = document.createElement("button");
    editButton.className = "dds-roleplay-edit dds-commission-protected-edit";
    editButton.type = "button";
    editButton.dataset.editMikaelCommission = "commission003";
    editButton.innerHTML = "EDIT CODE <span>↗</span>";
    actions.appendChild(editButton);

    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (sessionStorage.getItem(ACCESS_SESSION_KEY) === "1") openEditor();
      else openModal();
    });

    return true;
  }

  function install() {
    createModal();
    window.addEventListener("resize", fitPreview);

    if (addEditButton()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (addEditButton() || attempts > 40) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();

/* =========================================================
   ERIC HAWKINS COMMISSION — PASSWORD-GATED PROFILE EDITOR
   รหัสร่วมสำหรับงานของ ERIC HAWKINS
   ========================================================= */
(() => {
  "use strict";

  const ACCESS_HASH = "0f12c03d3ca823c878c0ee0eb5dd848796d95d8a99b0c6e34bb955aa422760a4";
  const ACCESS_SESSION_KEY = "dds:eric-hawkins-commission-editor:unlocked";
  const PANEL_NAME = "protected-commission-eric-profile";
  const VIEW_PANEL_NAME = "editor-commission-eric-profile-view";
  const DRAFT_KEY = "dds:commission-draft:eric-hawkins:profile-v1";
  const CANVAS_WIDTH = 1040;
  const STYLESHEET_URL = "https://guindaeyo.github.io/css/commit-profer02.css";

  const PROFILE_LABELS = Object.freeze([
    "ชื่อเล่น",
    "อายุ",
    "วันเกิด",
    "เผ่าพันธุ์",
    "สถานะ",
    "ภูมิลำเนา"
  ]);

  const defaults = Object.freeze({
    bgImage: "", coverImage: "", avatarImage: "", widgetOneImage: "", widgetTwoImage: "", miniImage: "",
    coverY: "50", avatarY: "35", widgetOneY: "50", widgetTwoY: "30", widgetOneFade: "80", widgetTwoFade: "80",
    themeMain: "#789b55", themeMainDark: "#536e3c", themeBackground: "#eff5e6", themePanel: "#fbfcf7",
    themeCard: "#f8fbf2", themeText: "#22271e", themeTextSoft: "#718064", messageBackground: "#789b55",
    displayName: "", englishName: "", thaiName: "", smallButtonOne: "",
    bubbleSymbol: "", symbolLineOne: "", symbolLineTwo: "", profileIcon: "",
    profileValue1: "", profileValue2: "", profileValue3: "", profileValue4: "", profileValue5: "", profileValue6: "",
    biographyIcon: "", biographyText: "",
    educationMain: "", educationSub: "", faceclaimMain: "", faceclaimSub: "",
    widgetOneSymbol: "", widgetOneAbstract: "", musicTitle: "", musicArtist: "",
    widgetTwoSymbol: "", widgetTwoTitle: "", widgetTwoSubtitle: "",
    statValue1: "", statLabel1: "", statValue2: "", statLabel2: "", statValue3: "", statLabel3: "",
    statValue4: "", statLabel4: "", statValue5: "", statLabel5: "", statValue6: "", statLabel6: "",
    personalityIcon: "", personalityText: "", tmiIcon: "", tmiCount: "1",
    footerText: ""
  });

  const OFFICIAL_CODE = String.raw`<link href="https://guindaeyo.github.io/css/commit-profer02.css" rel="stylesheet"><div class="erw-profile" style="--erw-bg:url('https://i.pinimg.com/736x/24/ee/4c/24ee4c78d1bf27f9b031b92b60772ad9.jpg');--erw-cover:url('https://i.pinimg.com/736x/d6/32/9f/d6329f6a058c75b34f37786694df8fdd.jpg');--erw-avatar:url('https://i.pinimg.com/vwebp/1200x/2a/64/e0/2a64e057a2b06009de0ee4daf538f949.webp');--erw-widget-one:url('https://i.pinimg.com/736x/9d/b9/d2/9db9d24ae8d72e2da6c5b98709e560d4.jpg');--erw-widget-two:url('https://i.pinimg.com/vwebp/1200x/27/31/2f/27312fff33b348dbc152d1e659147eac.webp');--erw-mini:url('https://i.pinimg.com/vwebp/736x/f3/ab/22/f3ab223672e2efb857a05aaab4250c8a.webp');--erw-cover-y:50%;--erw-avatar-y:35%;--erw-widget-one-y:50%;--erw-widget-two-y:30%;--erw-widget-one-fade:80%;--erw-widget-two-fade:80%;--erw-theme-main:#789b55;--erw-theme-main-dark:#536e3c;--erw-theme-background:#eff5e6;--erw-theme-panel:#fbfcf7;--erw-theme-card:#f8fbf2;--erw-theme-text:#22271e;--erw-theme-text-soft:#718064;"><div class="erw-layout"><section class="erw-left"><div class="erw-cover"></div><div class="erw-avatar-area"><div class="erw-avatar-frame"><div class="erw-avatar"></div><div class="erw-moon-status"></div></div><div class="erw-bubble-wrap"><span class="erw-bubble-dot erw-bubble-dot-one"></span><span class="erw-bubble-dot erw-bubble-dot-two"></span><div class="erw-bubble"><span>☘</span></div></div></div><div class="erw-identity"><div class="erw-display-name"></div><h1>Eric Hawkins</h1><div class="erw-thai-name">เอริค ฮอว์กินส์</div><div class="erw-actions"><div class="erw-message-button"><span>&#128172;</span>Message</div><div class="erw-small-button">☻</div><div class="erw-small-button">•••</div></div></div><div class="erw-symbol-art"><div>˙ ◌　&#127811; ᐟᐟ　✿ ˙</div><div>⌣　⌁　☾　˙</div></div><div class="erw-left-block erw-basic-block"><div class="erw-heading"><div><span>01</span><h2>Profile</h2></div><small>☘</small></div><div class="erw-info-grid"><div class="erw-info-item"><small>ชื่อเล่น</small><strong>เอริค, ริค</strong></div><div class="erw-info-item"><small>อายุ</small><strong>20 ปี</strong></div><div class="erw-info-item"><small>วันเกิด</small><strong>21 January 2006</strong></div><div class="erw-info-item"><small>เผ่าพันธุ์</small><strong>มนุษย์หมาป่า</strong></div><div class="erw-info-item"><small>สถานะ</small><strong>โอเมก้า</strong></div><div class="erw-info-item"><small>ภูมิลำเนา</small><strong>Colorado, USA</strong></div></div></div><div class="erw-left-block"><div class="erw-heading"><div><span>02</span><h2>Biography</h2></div><small>✦</small></div><div class="erw-prose"><p class="erw-dropcap">เอริคเติบโตมาในครอบครัวฐานะปานกลางในรัฐโคโลราโด วัยเด็กของเขาแสนจะเรียบง่ายเหมือนเด็กอเมริกันทั่วไปที่รักการเล่นกีฬา เขาเป็นกัปตันทีมฟุตบอลของโรงเรียนไฮสคูลและใช้ชีวิตอยู่กับความฝันที่อยากจะเป็นนักกีฬาอาชีพ จนกระทั่งจุดเปลี่ยนสำคัญมาถึงในช่วงปิดเทอมฤดูร้อนปีสุดท้ายของไฮสคูล<br><br>ในระหว่างการไปตั้งแคมป์กับเพื่อน เขาได้เจอกับหมาป่าขนาดใหญ่ในป่าลึก รูปร่างของมันดูใหญ่เกินกว่าหมาป่าทั่วไปที่เขาเคยเห็น แววตาสีแดงน่ากลัว แม้ว่าเขาจะพยายามป้องกันตัวแต่ก็ได้รับบาดเจ็บสาหัสที่แขนข้างขวา เหตุการณ์ในครั้งนั้นไม่ได้จบลงเพียงแค่การบาดเจ็บทางร่างกาย เพราะในเวลาต่อมาเขาก็เริ่มสังเกตเห็นความเปลี่ยนแปลงในร่างกายของตัวเองที่ไม่สามารถอธิบายได้ ทั้งประสาทสัมผัสที่ดีขึ้น พละกำลังที่มากกว่าปกติ และความเจ็บปวดบางอย่างที่รุนแรงมากขึ้นในช่วงคืนพระจันทร์เต็มดวง<br><br>หลังจากจบไฮสคูลเขาพยายามใช้ชีวิตในมหาวิทยาลัยอย่างปกติ เล่นกีฬา เรียน สังสรรค์ และรักษาความลับนี้ไว้ แต่ด้วยสัญชาตญาณที่เริ่มควบคุมยากขึ้นเรื่อย ๆ ทำให้เขาพยายามออกหาข้อมูลเกี่ยวกับความจริงของสิ่งที่เขากำลังเผชิญอยู่ จนกระทั่งได้พบกับชื่อหมู่บ้านแห่งหนึ่งที่เขาไม่เคยรู้จักมาก่อน ‘หมู่บ้านเอลิเชียน’ และเมื่ออายุครบ 20 ปี เอริคจึงตัดสินใจที่จะย้ายเข้ามาในหมู่บ้านแห่งนี้เพื่อทำความเข้าใจกับตัวเองมากยิ่งขึ้น<br><br>หลังจากย้ายเข้ามาอยู่ที่หมู่บ้านเอลิเชียนหลายเดือน เอริคตัดสินใจเริ่มต้นศึกษาเรียนต่อในคณะมนุษยศาสตร์ฯ สาขาจิตวิทยา</p></div></div><div class="erw-left-bottom"><div class="erw-side-detail"><small>EDUCATION</small><strong>คณะมนุษยศาสตร์ฯ</strong><span>สาขาจิตวิทยา</span></div><div class="erw-side-detail"><small>FACE CLAIM</small><strong>Ohyul</strong><span>Lngshot</span></div><div class="erw-side-detail erw-side-detail-wide"><div class="erw-connection-row"><div></div></div></div></div></section><section class="erw-right"><div class="erw-close">×</div><div class="erw-tabs"><div class="erw-tab erw-tab-active">Board</div><div class="erw-tab">Activity</div><div class="erw-tab">Wishlist</div></div><div class="erw-widget-header"><strong>Your Widgets</strong><div class="erw-add-widget"><span>＋</span>Add Widget</div></div><div class="erw-widget erw-widget-one"><div class="erw-widget-one-photo"></div><div class="erw-widget-one-content"><div class="erw-widget-symbol">☘ ˙⌁ ︵ ☾ ᐟᐟ</div><div class="erw-widget-abstract"><span>⌜</span><div>˙　◌　˙<br>ᐟᐟ　⌁　⌣<br>˙　☾　｡ </div><span>⌟</span></div></div><div class="erw-music-player"><div class="erw-music-cover"></div><div class="erw-music-detail"><div class="erw-progress"><span></span></div><strong>ชื่อเพลง</strong><small>ชื่อนักร้อง</small></div><div class="erw-player-switch">▶</div></div></div><div class="erw-widget erw-widget-two"><div class="erw-widget-two-top"><div class="erw-widget-two-photo"></div><div class="erw-widget-two-content"><div class="erw-widget-symbol">☘ ˙⌁ &#9749; ⌁ ☾ ⌁</div><div class="erw-steam-title">˚₊‧<strong>Omega Wolf</strong>⌣</div><div class="erw-steam-subtitle">woof woof woof!</div></div></div><div class="erw-stat-grid"><div class="erw-stat"><strong>95%</strong><span>Competitive</span></div><div class="erw-stat"><strong>93%</strong><span>Athletic</span></div><div class="erw-stat"><strong>88%</strong><span>Friendly</span></div><div class="erw-stat"><strong>96%</strong><span>Observant</span></div><div class="erw-stat"><strong>91%</strong><span>Caring</span></div><div class="erw-stat"><strong>89%</strong><span>Loyal</span></div></div></div><div class="erw-right-block"><div class="erw-heading"><div><span>03</span><h2>Personality</h2></div><small>✚</small></div><div class="erw-prose">รอยยิ้มที่เป็นเอกลักษณ์ต่างเป็นเสน่ห์เฉพาะตัวของเขาที่ใครต่างก็ต้องทัก บางครั้งยังช่วยทำให้บรรยากาศรอบข้างผ่อนคลายได้ เอริคเป็นคนที่เข้าถึงได้ง่าย และมักจะเป็นจุดสนใจโดยที่ไม่ได้ตั้งใจ<br><br>การที่เป็นนักกีฬาตั้งแต่เด็กหล่อหลอมให้เขาเป็นคนที่ใจสู้และรักในการแข่งขันอยู่เสมอ แม้จะเป็นเรื่องเล็กน้อยอย่างการเล่นเกมหรือการแข่งขันท้าทายสนุก ๆ เขาก็จะงัดเอาความจริงจังออกมาเสมอ แต่เขาก็มีน้ำใจนักกีฬา รู้แพ้รู้ชนะรู้อภัย<br><br>แม้ภายนอกจะดูเป็นวัยรุ่นยุคใหม่ แต่เขาหลงใหลในบีทหนัก ๆ ของสไตล์ฮิปฮอฟแต่ไหนแต่ไร การแต่งตัวและไลฟ์สไตล์ของเขามักจะชอบใส่เสื้อผ้าวินเทจมาประยุกต์ให้ทันสมัย<br><br>และภายใต้ความแข็งแกร่งของร่างกายนักกีฬา เอริคมีความละเอียดอ่อนและช่างสังเกตอย่างน่าประหลาด เขาเป็นคนชอบเอาใจใส่โดยเฉพาะกับคนใกล้ชิด เขามักจะจำรายละเอียดเล็ก ๆ น้อย ๆ ของเพื่อนได้ และพร้อมจะเป็นคนคอยดูแล เทคแคร์เสมอ</div></div><div class="erw-right-block erw-personality-block"><div class="erw-heading"><div><span>04</span><h2>TMI</h2></div><small>♫</small></div><div class="erw-trait-grid"><article class="erw-trait"><div class="erw-trait-icon">☀</div><div><h3>หัวข้อ</h3><p>อธิบายนิดหน่อย</p></div></article><article class="erw-trait"><div class="erw-trait-icon">✦</div><div><h3>หัวข้อ</h3><p>อธิบายนิดหน่อย</p></div></article><article class="erw-trait"><div class="erw-trait-icon">♫</div><div><h3>หัวข้อ</h3><p>อธิบายนิดหน่อย</p></div></article><article class="erw-trait"><div class="erw-trait-icon">☘</div><div><h3>หัวข้อ</h3><p>อธิบายนิดหน่อย</p></div></article></div></div><div class="erw-footer"><span>☾</span>ERIC HAWKINS<span>☘</span>WEREWOLF <span>♫</span></div></section></div></div><div class="fdreview-credit"><span></span></div>`;

  let editorPanel = null;
  let viewPanel = null;
  let card = null;
  let modal = null;
  let previewTimer = 0;
  let cardRendered = false;
  let viewRendered = false;

  const h = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const cssUrl = (value) => String(value || "").trim().replace(/[\\'\")]/g, "");
  const pct = (value, fallback) => Math.max(0, Math.min(100, Number(value) || fallback));

  function richToHtml(value) {
    let text = h(value || "");
    const replacements = [
      [/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>"],
      [/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>"],
      [/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>"],
      [/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>"],
      [/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align:center">$1</div>'],
      [/\[right\]([\s\S]*?)\[\/right\]/gi, '<div style="text-align:right">$1</div>'],
      [/\[left\]([\s\S]*?)\[\/left\]/gi, '<div style="text-align:left">$1</div>'],
      [/\[quote\]([\s\S]*?)\[\/quote\]/gi, "<blockquote>$1</blockquote>"],
      [/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>'],
      [/\[size=([^\]]+)\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:$1">$2</span>'],
      [/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>']
    ];
    replacements.forEach(([pattern, output]) => { text = text.replace(pattern, output); });
    return text.replace(/\r?\n/g, "<br>");
  }

  function normalizeTmiCount(value) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return 1;
    return Math.max(0, Math.min(20, number));
  }

  function buildCode(v) {
    const profileItems = PROFILE_LABELS.map((label, index) =>
      `<div class="erw-info-item"><small>${h(label)}</small><strong>${h(v[`profileValue${index + 1}`])}</strong></div>`
    ).join("");
    const stats = Array.from({length: 6}, (_, i) =>
      `<div class="erw-stat"><strong>${h(v[`statValue${i + 1}`])}</strong><span>${h(v[`statLabel${i + 1}`])}</span></div>`
    ).join("");
    const tmiCount = normalizeTmiCount(v.tmiCount);
    const tmis = Array.from({length: tmiCount}, (_, i) =>
      `<article class="erw-trait"><div class="erw-trait-icon">${h(v[`tmiSymbol${i + 1}`])}</div><div><h3>${h(v[`tmiTitle${i + 1}`])}</h3><p>${richToHtml(v[`tmiText${i + 1}`])}</p></div></article>`
    ).join("");
    return `<link href="${STYLESHEET_URL}" rel="stylesheet"><div class="erw-profile" style="--erw-bg:url('${cssUrl(v.bgImage)}');--erw-cover:url('${cssUrl(v.coverImage)}');--erw-avatar:url('${cssUrl(v.avatarImage)}');--erw-widget-one:url('${cssUrl(v.widgetOneImage)}');--erw-widget-two:url('${cssUrl(v.widgetTwoImage)}');--erw-mini:url('${cssUrl(v.miniImage)}');--erw-cover-y:${pct(v.coverY,50)}%;--erw-avatar-y:${pct(v.avatarY,35)}%;--erw-widget-one-y:${pct(v.widgetOneY,50)}%;--erw-widget-two-y:${pct(v.widgetTwoY,30)}%;--erw-widget-one-fade:${pct(v.widgetOneFade,80)}%;--erw-widget-two-fade:${pct(v.widgetTwoFade,80)}%;--erw-theme-main:${h(v.themeMain)};--erw-theme-main-dark:${h(v.themeMainDark)};--erw-theme-background:${h(v.themeBackground)};--erw-theme-panel:${h(v.themePanel)};--erw-theme-card:${h(v.themeCard)};--erw-theme-text:${h(v.themeText)};--erw-theme-text-soft:${h(v.themeTextSoft)};--erw-message-bg:${h(v.messageBackground)};"><div class="erw-layout"><section class="erw-left"><div class="erw-cover"></div><div class="erw-avatar-area"><div class="erw-avatar-frame"><div class="erw-avatar"></div><div class="erw-moon-status"></div></div><div class="erw-bubble-wrap"><span class="erw-bubble-dot erw-bubble-dot-one"></span><span class="erw-bubble-dot erw-bubble-dot-two"></span><div class="erw-bubble"><span>${h(v.bubbleSymbol)}</span></div></div></div><div class="erw-identity"><div class="erw-display-name">${h(v.displayName)}</div><h1>${h(v.englishName)}</h1><div class="erw-thai-name">${h(v.thaiName)}</div><div class="erw-actions"><div class="erw-message-button" style="background:var(--erw-message-bg);"><span>&#128172;</span>Message</div><div class="erw-small-button">${h(v.smallButtonOne)}</div><div class="erw-small-button">•••</div></div></div><div class="erw-symbol-art"><div>${h(v.symbolLineOne)}</div><div>${h(v.symbolLineTwo)}</div></div><div class="erw-left-block erw-basic-block"><div class="erw-heading"><div><span>01</span><h2>Profile</h2></div><small>${h(v.profileIcon)}</small></div><div class="erw-info-grid">${profileItems}</div></div><div class="erw-left-block"><div class="erw-heading"><div><span>02</span><h2>Biography</h2></div><small>${h(v.biographyIcon)}</small></div><div class="erw-prose"><p class="erw-dropcap">${richToHtml(v.biographyText)}</p></div></div><div class="erw-left-bottom"><div class="erw-side-detail"><small>EDUCATION</small><strong>${h(v.educationMain)}</strong><span>${h(v.educationSub)}</span></div><div class="erw-side-detail"><small>FACE CLAIM</small><strong>${h(v.faceclaimMain)}</strong><span>${h(v.faceclaimSub)}</span></div><div class="erw-side-detail erw-side-detail-wide"><div class="erw-connection-row"><div></div></div></div></div></section><section class="erw-right"><div class="erw-close">×</div><div class="erw-tabs"><div class="erw-tab erw-tab-active">Board</div><div class="erw-tab">Activity</div><div class="erw-tab">Wishlist</div></div><div class="erw-widget-header"><strong>Your Widgets</strong><div class="erw-add-widget"><span>＋</span>Add Widget</div></div><div class="erw-widget erw-widget-one"><div class="erw-widget-one-photo"></div><div class="erw-widget-one-content"><div class="erw-widget-symbol">${h(v.widgetOneSymbol)}</div><div class="erw-widget-abstract"><div>${richToHtml(v.widgetOneAbstract)}</div></div></div><div class="erw-music-player"><div class="erw-music-cover"></div><div class="erw-music-detail"><div class="erw-progress"><span></span></div><strong>${h(v.musicTitle)}</strong><small>${h(v.musicArtist)}</small></div><div class="erw-player-switch">▶</div></div></div><div class="erw-widget erw-widget-two"><div class="erw-widget-two-top"><div class="erw-widget-two-photo"></div><div class="erw-widget-two-content"><div class="erw-widget-symbol">${h(v.widgetTwoSymbol)}</div><div class="erw-steam-title"><strong>${h(v.widgetTwoTitle)}</strong></div><div class="erw-steam-subtitle">${h(v.widgetTwoSubtitle)}</div></div></div><div class="erw-stat-grid">${stats}</div></div><div class="erw-right-block"><div class="erw-heading"><div><span>03</span><h2>Personality</h2></div><small>${h(v.personalityIcon)}</small></div><div class="erw-prose">${richToHtml(v.personalityText)}</div></div><div class="erw-right-block erw-personality-block"><div class="erw-heading"><div><span>04</span><h2>TMI</h2></div><small>${h(v.tmiIcon)}</small></div><div class="erw-trait-grid">${tmis}</div></div><div class="erw-footer">${h(v.footerText)}</div></section></div></div><div class="fdreview-credit"><span></span></div>`;
  }

  function buildDocument(code, marker) {
    return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="${STYLESHEET_URL}" rel="stylesheet"><style>html,body{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;background:#242424!important;overflow:hidden!important}.dds-eric-preview-root{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important}.dds-eric-preview-root>.erw-profile,.erw-profile{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;transform:none!important}</style></head><body><div class="dds-eric-preview-root" data-eric-preview-root="${marker}">${code}</div></body></html>`;
  }

  function fitEditorPreview() {
    const iframe = editorPanel?.querySelector("[data-eric-preview]");
    const holder = editorPanel?.querySelector("[data-eric-preview-holder]");
    const stage = editorPanel?.querySelector("[data-eric-preview-stage]");
    if (!iframe || !holder || !stage) return;
    try {
      const doc = iframe.contentDocument;
      const root = doc?.querySelector("[data-eric-preview-root]");
      if (!root) return;
      const height = Math.max(1, Math.ceil(root.scrollHeight || root.getBoundingClientRect().height));
      const available = Math.max(320, stage.clientWidth - 32);
      const scale = Math.min(1, available / CANVAS_WIDTH);
      iframe.style.width = `${CANVAS_WIDTH}px`;
      iframe.style.height = `${height}px`;
      iframe.style.transform = `scale(${scale})`;
      iframe.style.transformOrigin = "top left";
      holder.style.width = `${Math.ceil(CANVAS_WIDTH * scale)}px`;
      holder.style.height = `${Math.ceil(height * scale)}px`;
    } catch (error) {
      console.warn("[DDS] Could not fit Eric editor preview", error);
    }
  }

  function fitCardPreview(iframe) {
    const parent = iframe?.parentElement;
    if (!iframe || !parent) return;
    try {
      const root = iframe.contentDocument?.querySelector("[data-eric-preview-root]");
      if (!root) return;
      const height = Math.max(1, Math.ceil(root.scrollHeight || root.getBoundingClientRect().height));
      const scale = Math.min((parent.clientWidth - 24) / CANVAS_WIDTH, (parent.clientHeight - 24) / height);
      iframe.style.width = `${CANVAS_WIDTH}px`;
      iframe.style.height = `${height}px`;
      iframe.style.position = "absolute";
      iframe.style.left = "50%";
      iframe.style.top = "50%";
      iframe.style.transformOrigin = "center center";
      iframe.style.transform = `translate(-50%, -50%) scale(${Math.max(0.05, scale)})`;
    } catch (error) {
      console.warn("[DDS] Could not fit Eric card preview", error);
    }
  }

  function fitViewPreview() {
    const iframe = viewPanel?.querySelector("[data-eric-view-preview]");
    const holder = viewPanel?.querySelector("[data-eric-view-holder]");
    const stage = viewPanel?.querySelector("[data-eric-view-stage]");
    if (!iframe || !holder || !stage) return;

    try {
      const doc = iframe.contentDocument;
      const root = doc?.querySelector("[data-eric-preview-root]");
      if (!root) return;

      const height = Math.max(
        1,
        Math.ceil(root.scrollHeight || 0),
        Math.ceil(root.offsetHeight || 0),
        Math.ceil(root.getBoundingClientRect().height || 0),
        Math.ceil(doc.body?.scrollHeight || 0),
        Math.ceil(doc.documentElement?.scrollHeight || 0)
      );
      const horizontalPadding = window.innerWidth <= 700 ? 20 : 48;
      const availableWidth = Math.max(280, stage.clientWidth - horizontalPadding);
      const scale = Math.min(1, availableWidth / CANVAS_WIDTH);
      const scaledWidth = Math.ceil(CANVAS_WIDTH * scale);
      const scaledHeight = Math.ceil(height * scale);
      const verticalPadding = window.innerWidth <= 700 ? 20 : 48;

      /* Override the old generic COMMISSION rules that fixed the iframe at 800px. */
      iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
      iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
      iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
      iframe.style.setProperty("height", `${height}px`, "important");
      iframe.style.setProperty("min-height", `${height}px`, "important");
      iframe.style.setProperty("max-height", `${height}px`, "important");
      iframe.style.setProperty("position", "absolute", "important");
      iframe.style.setProperty("inset", "0 auto auto 0", "important");
      iframe.style.setProperty("top", "0", "important");
      iframe.style.setProperty("left", "0", "important");
      iframe.style.setProperty("transform-origin", "top left", "important");
      iframe.style.setProperty("transform", `scale(${scale})`, "important");

      holder.style.setProperty("width", `${scaledWidth}px`, "important");
      holder.style.setProperty("height", `${scaledHeight}px`, "important");
      holder.style.setProperty("margin", "0 auto", "important");

      /* The VIEW WORK page now grows exactly with the scaled code height. */
      stage.style.setProperty("height", `${scaledHeight + verticalPadding}px`, "important");
      stage.style.setProperty("min-height", `${scaledHeight + verticalPadding}px`, "important");
      stage.style.setProperty("overflow", "visible", "important");

      if (!iframe.__ddsEricViewResizeObserver && "ResizeObserver" in window) {
        const observer = new ResizeObserver(() => {
          requestAnimationFrame(fitViewPreview);
        });
        observer.observe(root);
        iframe.__ddsEricViewResizeObserver = observer;
      }

      if (!iframe.__ddsEricFontsReadyBound && doc.fonts?.ready) {
        iframe.__ddsEricFontsReadyBound = true;
        doc.fonts.ready.then(() => requestAnimationFrame(fitViewPreview)).catch(() => {});
      }
    } catch (error) {
      console.warn("[DDS] Could not fit Eric full work preview", error);
    }
  }

  function writeIframe(iframe, code, marker, afterLoad) {
    if (!iframe) return;
    iframe.onload = () => {
      requestAnimationFrame(() => {
        afterLoad?.();
        setTimeout(() => afterLoad?.(), 180);
        setTimeout(() => afterLoad?.(), 650);
      });
    };
    iframe.srcdoc = buildDocument(code, marker);
  }

  function field(label, key, options = {}) {
    const { full = false, textarea = false, rows = 3, type = "text", placeholder = "" } = options;
    return `<label class="dds-field${full ? " dds-field-full" : ""}"><span>${h(label)}</span>${textarea ? `<textarea rows="${rows}" data-eric-field="${h(key)}" placeholder="${h(placeholder)}"></textarea>` : `<input type="${h(type)}" data-eric-field="${h(key)}" placeholder="${h(placeholder)}">`}</label>`;
  }

  function colorField(label, key, value) {
    return `<label class="dds-color-field"><span>${h(label)}</span><div><input type="color" data-eric-color-picker="${h(key)}" value="${h(value)}"><input type="text" data-eric-field="${h(key)}" value="${h(value)}" spellcheck="false"></div></label>`;
  }

  function rangeField(label, key, value, suffix = "%") {
    return `<label class="dds-position-row"><span>${h(label)}</span><small>0</small><input type="range" min="0" max="100" step="1" value="${h(value)}" data-eric-field="${h(key)}"><small>100</small><output data-eric-range-output="${h(key)}">${h(value)}${suffix}</output></label>`;
  }

  function toolbar(targetKey) {
    const buttons = [
      ["B", "[b]", "[/b]"], ["I", "[i]", "[/i]"], ["U", "[u]", "[/u]"], ["S", "[s]", "[/s]"],
      ["↤", "[left]", "[/left]"], ["≡", "[center]", "[/center]"], ["↦", "[right]", "[/right]"], ["❝", "[quote]", "[/quote]"]
    ];
    return `<div class="dds-rich-toolbar dds-bbcode-toolbar dds-eric-bbcode-toolbar" data-eric-toolbar="${h(targetKey)}">${buttons.map(([label, open, close]) => `<button type="button" data-eric-open="${h(open)}" data-eric-close="${h(close)}">${label}</button>`).join("")}<button type="button" data-eric-clear>CLEAR</button></div>`;
  }

  function richField(label, key, rows = 8) {
    return `<label class="dds-field dds-field-full dds-eric-rich-field"><span>${h(label)}</span>${toolbar(key)}<textarea rows="${rows}" data-eric-field="${h(key)}" data-eric-rich="${h(key)}" placeholder="กรอกข้อความ"></textarea><div class="dds-word-counter" data-eric-word-counter="${h(key)}" data-empty="true"><span class="dds-word-counter-label">จำนวนคำ</span><strong><span>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label>`;
  }

  function inferTmiCount(values = {}) {
    if (Object.prototype.hasOwnProperty.call(values, "tmiCount")) {
      return normalizeTmiCount(values.tmiCount);
    }
    let highest = 0;
    for (let index = 1; index <= 20; index += 1) {
      if (["Symbol", "Title", "Text"].some((part) => String(values[`tmi${part}${index}`] || "").trim())) {
        highest = index;
      }
    }
    return highest || normalizeTmiCount(defaults.tmiCount);
  }

  function tmiGroupMarkup(index) {
    return `<div class="dds-eric-tmi-group" data-eric-tmi-group="${index}">
      <div class="dds-eric-tmi-group-head"><strong>TMI ${index}</strong><button type="button" data-eric-remove-tmi="${index}" aria-label="ลบ TMI ${index}">× ลบ</button></div>
      <div class="dds-form-grid">
        ${field("สัญลักษณ์", `tmiSymbol${index}`, {placeholder:"เช่น ☀"})}
        ${field("หัวข้อ", `tmiTitle${index}`)}
        ${field("คำอธิบาย", `tmiText${index}`, {full:true,textarea:true,rows:4})}
      </div>
    </div>`;
  }

  function renderTmiGroups(count, values = {}) {
    const list = editorPanel?.querySelector("[data-eric-tmi-list]");
    if (!list) return;
    const safeCount = normalizeTmiCount(count);
    list.innerHTML = Array.from({length: safeCount}, (_, index) => tmiGroupMarkup(index + 1)).join("");
    list.querySelectorAll("[data-eric-field]").forEach((item) => {
      item.value = values[item.dataset.ericField] ?? "";
    });
    const empty = editorPanel?.querySelector("[data-eric-tmi-empty]");
    if (empty) empty.hidden = safeCount !== 0;
  }

  function collectTmiItems() {
    return Array.from(editorPanel?.querySelectorAll("[data-eric-tmi-group]") || []).map((group) => ({
      symbol: group.querySelector('[data-eric-field^="tmiSymbol"]')?.value || "",
      title: group.querySelector('[data-eric-field^="tmiTitle"]')?.value || "",
      text: group.querySelector('[data-eric-field^="tmiText"]')?.value || ""
    }));
  }

  function renderTmiItems(items) {
    const values = {};
    items.forEach((item, index) => {
      values[`tmiSymbol${index + 1}`] = item.symbol || "";
      values[`tmiTitle${index + 1}`] = item.title || "";
      values[`tmiText${index + 1}`] = item.text || "";
    });
    renderTmiGroups(items.length, values);
  }

  function getValues() {
    const values = {...defaults};
    editorPanel?.querySelectorAll("[data-eric-field]").forEach((item) => { values[item.dataset.ericField] = item.value; });
    values.tmiCount = String(editorPanel?.querySelectorAll("[data-eric-tmi-group]").length || 0);
    return values;
  }

  function setValues(values = defaults) {
    const next = {...defaults, ...values};
    if (!String(next.footerText || "").trim()) {
      const legacyFooter = [values.footerSymbolOne, values.footerName, values.footerSymbolTwo, values.footerRace, values.footerSymbolThree]
        .filter((part) => String(part || "").trim())
        .join(" ");
      if (legacyFooter) next.footerText = legacyFooter;
    }
    renderTmiGroups(inferTmiCount(values), next);
    editorPanel?.querySelectorAll("[data-eric-field]").forEach((item) => {
      item.value = next[item.dataset.ericField] ?? "";
      if (item.type === "range") editorPanel.querySelector(`[data-eric-range-output="${CSS.escape(item.dataset.ericField)}"]`)?.replaceChildren(document.createTextNode(`${item.value}%`));
    });
    editorPanel?.querySelectorAll("[data-eric-color-picker]").forEach((picker) => { picker.value = next[picker.dataset.ericColorPicker] || "#000000"; });
    updateAllWordCounters();
  }

  function countWords(value) {
    const cleaned = String(value || "").replace(/\[[^\]]*\]/g, " ").replace(/https?:\/\/\S+/gi, " ").trim();
    if (!cleaned) return 0;
    const thai = cleaned.match(/[\u0E00-\u0E7F]+/g) || [];
    const latin = cleaned.replace(/[\u0E00-\u0E7F]+/g, " ").match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
    return thai.length + latin.length;
  }

  function updateWordCounter(key) {
    const editor = editorPanel?.querySelector(`[data-eric-rich="${CSS.escape(key)}"]`);
    const counter = editorPanel?.querySelector(`[data-eric-word-counter="${CSS.escape(key)}"]`);
    if (!editor || !counter) return;
    const count = countWords(editor.value);
    counter.dataset.empty = String(count === 0);
    const number = counter.querySelector("strong span");
    if (number) number.textContent = String(count);
  }

  function updateAllWordCounters() {
    editorPanel?.querySelectorAll("[data-eric-rich]").forEach((editor) => updateWordCounter(editor.dataset.ericRich));
  }

  function installToolbarEvents() {
    editorPanel?.querySelectorAll("[data-eric-toolbar]").forEach((bar) => {
      bar.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const key = bar.dataset.ericToolbar;
        const textarea = editorPanel.querySelector(`[data-eric-rich="${CSS.escape(key)}"]`);
        if (!textarea) return;
        if (button.hasAttribute("data-eric-clear")) {
          textarea.value = textarea.value.replace(/\[[^\]]*\]/g, "");
        } else {
          const open = button.dataset.ericOpen || "";
          const close = button.dataset.ericClose || "";
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selected = textarea.value.slice(start, end);
          textarea.setRangeText(`${open}${selected}${close}`, start, end, "end");
        }
        textarea.dispatchEvent(new Event("input", {bubbles: true}));
        textarea.focus();
      });
    });
  }

  function updateEditorPreview() {
    if (!editorPanel) return;
    const iframe = editorPanel.querySelector("[data-eric-preview]");
    writeIframe(iframe, buildCode(getValues()), "editor", fitEditorPreview);
  }

  function scheduleEditorPreview() {
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(updateEditorPreview, 70);
  }

  function draftStatus(timestamp = 0) {
    const el = editorPanel?.querySelector("[data-eric-draft-status]");
    if (!el) return;
    el.textContent = timestamp ? `บันทึกล่าสุด ${new Date(timestamp).toLocaleTimeString("th-TH", {hour: "2-digit", minute: "2-digit"})}` : "ยังไม่มีแบบร่าง";
  }

  function saveDraft() {
    const payload = {savedAt: Date.now(), values: getValues()};
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    draftStatus(payload.savedAt);
    showToast("บันทึกแบบร่างของ Eric Hawkins แล้ว");
  }

  function deleteDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setValues(defaults);
    draftStatus(0);
    updateEditorPreview();
  }

  function getDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
  }

  async function copyCode() {
    const code = buildCode(getValues());
    try { await navigator.clipboard.writeText(code); }
    catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("คัดลอกโค้ดประวัติ Eric Hawkins แล้ว");
  }

  function showToast(message) {
    let toast = document.getElementById("ddsEricEditorToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "ddsEricEditorToast";
      toast.className = "dds-editor-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function showOnly(panelName) {
    document.querySelectorAll(".dds-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === panelName));
    document.querySelectorAll(".dds-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === "commission"));
    const page = document.getElementById("currentPageNumber");
    if (page) page.textContent = "04";
    window.scrollTo({top: 0, behavior: "auto"});
  }

  function backToCommission(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    document.body.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
    document.querySelectorAll(".dds-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === "commission");
    });
    document.querySelectorAll(".dds-nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.page === "commission");
    });
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const active = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-work-panel]").forEach((panel) => {
      const active = panel.dataset.workPanel === "commission";
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    const page = document.getElementById("currentPageNumber");
    if (page) page.textContent = "04";
    history.replaceState(null, "", "#commission");
    window.scrollTo({top: 0, behavior: "auto"});
    requestAnimationFrame(() => {
      const commissionPanel = document.querySelector('[data-panel="commission"]');
      commissionPanel?.classList.add("is-active");
      document.querySelector('[data-work-tab="commission"]')?.classList.add("is-active");
      window.scrollTo({top: 0, behavior: "auto"});
    });
  }

  function createEditorPanel() {
    if (editorPanel?.isConnected) return editorPanel;
    const footer = document.querySelector(".dds-footer");
    const main = document.querySelector(".dds-main");
    if (!main) return null;
    editorPanel = document.createElement("section");
    editorPanel.className = "dds-panel dds-protected-commission-editor dds-eric-profile-editor";
    editorPanel.dataset.panel = PANEL_NAME;
    editorPanel.innerHTML = `
      <div class="dds-editor-heading"><button aria-label="กลับหน้า COMMISSION" class="dds-back-button" data-eric-back type="button">←</button><div><p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p><h1 class="dds-eric-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทประวัติ</span></h1><p>ผู้จ้าง ERIC HAWKINS — แก้ข้อความ รูป สัญลักษณ์ และสีได้จากเครื่องมือด้านขวา</p></div></div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column"><div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>ERIC HAWKINS / COMMISSION</strong></div><div class="dds-protected-commission-preview-stage dds-eric-preview-stage" data-eric-preview-stage><div class="dds-eric-preview-holder" data-eric-preview-holder><iframe class="dds-protected-commission-preview-frame" data-eric-preview scrolling="no" title="ตัวอย่างโค้ดประวัติ Eric Hawkins"></iframe></div></div></div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-eric-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-eric-save>SAVE DRAFT</button><button type="button" data-eric-delete>DELETE SAVE</button></div>
          <div class="dds-protected-commission-scroll dds-eric-profile-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโค้ด</h2></div><div class="dds-color-grid">${colorField("สีหลัก — --erw-theme-main", "themeMain", defaults.themeMain)}${colorField("สีหลักเข้ม — --erw-theme-main-dark", "themeMainDark", defaults.themeMainDark)}${colorField("สีพื้นหลังปุ่ม 💬 Message", "messageBackground", defaults.messageBackground)}${colorField("สีพื้นหลัง — --erw-theme-background", "themeBackground", defaults.themeBackground)}${colorField("สีพาเนล — --erw-theme-panel", "themePanel", defaults.themePanel)}${colorField("สีการ์ด — --erw-theme-card", "themeCard", defaults.themeCard)}${colorField("สีตัวอักษร — --erw-theme-text", "themeText", defaults.themeText)}${colorField("สีตัวอักษรรอง — --erw-theme-text-soft", "themeTextSoft", defaults.themeTextSoft)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>รูปภาพ</h2></div><div class="dds-form-grid">${field("รูปพื้นหลัง", "bgImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}${field("รูปปก", "coverImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}${field("รูปโปรไฟล์", "avatarImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}${field("รูป Widget 1", "widgetOneImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}${field("รูป Widget 2", "widgetTwoImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}${field("รูป Mini / Music", "miniImage", {full:true,type:"url",placeholder:"วางลิงก์รูป"})}</div><div class="dds-image-position dds-field-full"><div class="dds-image-position-heading"><span>ตำแหน่งและขอบเฟดรูป</span><small>ปรับค่าเปอร์เซ็นต์</small></div>${rangeField("ตำแหน่งรูปปก", "coverY", 50)}${rangeField("ตำแหน่งรูปโปรไฟล์", "avatarY", 35)}${rangeField("ตำแหน่ง Widget 1", "widgetOneY", 50)}${rangeField("ตำแหน่ง Widget 2", "widgetTwoY", 30)}${rangeField("ขอบเฟด Widget 1", "widgetOneFade", 80)}${rangeField("ขอบเฟด Widget 2", "widgetTwoFade", 80)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>ชื่อและข้อมูลโปรไฟล์</h2></div><div class="dds-form-grid">${field("ดิสเพลย์เนม", "displayName")}${field("ชื่อภาษาอังกฤษ", "englishName")}${field("ชื่อภาษาไทย", "thaiName")}${field("สัญลักษณ์ปุ่มเล็กกลาง", "smallButtonOne", {placeholder:"เช่น ☻"})}${field("สัญลักษณ์ใน Bubble", "bubbleSymbol")}${field("Symbol Art บรรทัด 1", "symbolLineOne", {full:true})}${field("Symbol Art บรรทัด 2", "symbolLineTwo", {full:true})}${field("สัญลักษณ์หัวข้อ Profile", "profileIcon")}${PROFILE_LABELS.map((label,index)=>field(label,`profileValue${index+1}`,{placeholder:`กรอก${label}`})).join("")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>Biography และข้อมูลด้านล่าง</h2></div><div class="dds-form-grid">${field("สัญลักษณ์ Biography", "biographyIcon")}${richField("เนื้อหา Biography", "biographyText", 12)}${field("Education บรรทัดหลัก", "educationMain")}${field("Education บรรทัดรอง", "educationSub")}${field("Face Claim บรรทัดหลัก", "faceclaimMain")}${field("Face Claim บรรทัดรอง", "faceclaimSub")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>Widgets และเพลง</h2></div><div class="dds-form-grid">${field("สัญลักษณ์ Widget 1", "widgetOneSymbol", {full:true})}${field("Abstract Widget 1", "widgetOneAbstract", {full:true,textarea:true,rows:4,placeholder:"กรอกข้อความและสัญลักษณ์เอง"})}${field("ชื่อเพลง", "musicTitle")}${field("ชื่อนักร้อง", "musicArtist")}${field("สัญลักษณ์ Widget 2", "widgetTwoSymbol", {full:true})}${field("หัวข้อ Widget 2", "widgetTwoTitle", {placeholder:"กรอกข้อความและสัญลักษณ์เอง"})}${field("ข้อความใต้ Widget 2", "widgetTwoSubtitle")}${Array.from({length:6},(_,i)=>field(`ค่าสถานะ ${i+1}`,`statValue${i+1}`,{placeholder:"เช่น 95%"})+field(`ชื่อสถานะ ${i+1}`,`statLabel${i+1}`,{placeholder:"เช่น Competitive"})).join("")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>06</span><h2>Personality และ TMI</h2></div><div class="dds-form-grid">${field("สัญลักษณ์ Personality", "personalityIcon")}${richField("เนื้อหา Personality", "personalityText", 12)}${field("สัญลักษณ์ TMI", "tmiIcon")}</div><div class="dds-eric-tmi-toolbar"><div><strong>รายการ TMI</strong><small>เพิ่มหรือลดจำนวนได้ตามต้องการ</small></div><button type="button" data-eric-add-tmi>＋ เพิ่ม TMI</button></div><div class="dds-eric-tmi-list" data-eric-tmi-list></div><p class="dds-eric-tmi-empty" data-eric-tmi-empty hidden>ยังไม่มีรายการ TMI — กด “＋ เพิ่ม TMI” เพื่อเพิ่มรายการ</p></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>07</span><h2>ส่วนท้าย</h2></div><div class="dds-form-grid">${field("ข้อความส่วนท้าย", "footerText", {full:true,textarea:true,rows:3,placeholder:"เช่น ☾ ERIC HAWKINS ☘ WEREWOLF ♫"})}</div></section>
          </div>
          <section class="dds-protected-commission-copy dds-eric-profile-copy"><div class="dds-control-title"><span>08</span><h2>คัดลอกโค้ด</h2></div><p>กดปุ่มด้านล่างเพื่อคัดลอกโค้ดที่กรอกเสร็จแล้วไปใช้งาน</p><div class="dds-protected-commission-copy-actions"><button type="button" data-eric-copy>COPY CODE <span>↗</span></button><button type="button" data-eric-reset>RESET</button></div></section>
        </div>
      </div>`;
    if (footer) main.insertBefore(editorPanel, footer); else main.appendChild(editorPanel);
    editorPanel.querySelector("[data-eric-back]")?.addEventListener("click", backToCommission, true);
    editorPanel.querySelector("[data-eric-save]")?.addEventListener("click", saveDraft);
    editorPanel.querySelector("[data-eric-delete]")?.addEventListener("click", deleteDraft);
    editorPanel.querySelector("[data-eric-copy]")?.addEventListener("click", copyCode);
    editorPanel.querySelector("[data-eric-reset]")?.addEventListener("click", () => { setValues(defaults); draftStatus(0); updateEditorPreview(); });
    editorPanel.addEventListener("input", (event) => { if (event.target.matches("[data-eric-rich]")) updateWordCounter(event.target.dataset.ericRich); if (event.target.type === "range") { const out = editorPanel.querySelector(`[data-eric-range-output="${CSS.escape(event.target.dataset.ericField)}"]`); if (out) out.textContent = `${event.target.value}%`; } scheduleEditorPreview(); });
    editorPanel.addEventListener("change", scheduleEditorPreview);
    editorPanel.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-eric-add-tmi]");
      if (addButton) {
        event.preventDefault();
        const items = collectTmiItems();
        if (items.length >= 20) {
          showToast("เพิ่ม TMI ได้สูงสุด 20 รายการ");
          return;
        }
        items.push({symbol:"", title:"", text:""});
        renderTmiItems(items);
        scheduleEditorPreview();
        return;
      }
      const removeButton = event.target.closest("[data-eric-remove-tmi]");
      if (removeButton) {
        event.preventDefault();
        const index = Number(removeButton.dataset.ericRemoveTmi) - 1;
        const items = collectTmiItems();
        if (index >= 0 && index < items.length) items.splice(index, 1);
        renderTmiItems(items);
        scheduleEditorPreview();
      }
    });
    editorPanel.querySelectorAll("[data-eric-color-picker]").forEach((picker) => picker.addEventListener("input", () => { const text = editorPanel.querySelector(`[data-eric-field="${CSS.escape(picker.dataset.ericColorPicker)}"]`); if (text) text.value = picker.value; scheduleEditorPreview(); }));
    editorPanel.querySelectorAll(".dds-color-field input[type=text]").forEach((text) => text.addEventListener("input", () => { const picker = editorPanel.querySelector(`[data-eric-color-picker="${CSS.escape(text.dataset.ericField)}"]`); if (picker && /^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value; }));
    installToolbarEvents();
    return editorPanel;
  }

  function openEditor() {
    const panel = createEditorPanel();
    if (!panel) return;
    const draft = getDraft();
    setValues(draft?.values || defaults);
    draftStatus(draft?.savedAt || 0);
    document.body.classList.add("dds-editor-mode", "dds-commission-editor-mode");
    showOnly(PANEL_NAME);
    history.replaceState(null, "", "#commission-eric-editor");
    updateEditorPreview();
  }

  function createViewPanel() {
    if (viewPanel?.isConnected) return viewPanel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;
    viewPanel = document.createElement("section");
    viewPanel.className = "dds-panel dds-commission-view-panel dds-eric-view-panel";
    viewPanel.dataset.panel = VIEW_PANEL_NAME;
    viewPanel.innerHTML = `<div class="dds-commission-view-toolbar"><button class="dds-back-button" data-eric-view-back type="button">←</button></div><div class="dds-commission-preview-stage dds-eric-view-stage" data-eric-view-stage><div class="dds-eric-view-holder" data-eric-view-holder><iframe class="dds-editor-preview-frame dds-commission-view-frame" data-eric-view-preview scrolling="no" title="งานคอมมิชชั่นโค้ดประเภทประวัติ Eric Hawkins"></iframe></div></div>`;
    footer.before(viewPanel);
    viewPanel.querySelector("[data-eric-view-back]")?.addEventListener("click", backToCommission, true);
    return viewPanel;
  }

  function openView() {
    const panel = createViewPanel();
    if (!panel) return;

    const toast = document.getElementById("ddsEricEditorToast");
    if (toast) {
      clearTimeout(toast._timer);
      toast.classList.remove("is-visible");
      toast.textContent = "";
    }

    document.body.classList.add("dds-editor-mode");
    showOnly(VIEW_PANEL_NAME);
    history.replaceState(null, "", "#commission-eric-view");
    const iframe = panel.querySelector("[data-eric-view-preview]");

    if (!viewRendered) {
      writeIframe(iframe, OFFICIAL_CODE, "view", fitViewPreview);
      viewRendered = true;
    } else {
      requestAnimationFrame(fitViewPreview);
    }
  }

  function createModal() {
    if (modal?.isConnected) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.id = "ddsEricCommissionLockModal";
    modal.hidden = true;
    modal.innerHTML = `<form class="dds-commission-lock-dialog" data-eric-lock-form><small>CLIENT ACCESS / ERIC HAWKINS</small><h2>Protected editor</h2><p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" data-eric-lock-input placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" data-eric-lock-error aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-eric-lock-close>CANCEL</button></div></form>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-eric-lock-close]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.querySelector("[data-eric-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-eric-lock-input]");
      const error = modal.querySelector("[data-eric-lock-error]");
      const submit = event.submitter;
      if (submit) submit.disabled = true;
      try {
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.value));
        const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
        if (hash !== ACCESS_HASH) { error.textContent = "รหัสผ่านไม่ถูกต้อง"; input.select(); return; }
        sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
        closeModal();
        openEditor();
      } catch { error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่"; }
      finally { if (submit) submit.disabled = false; }
    });
    return modal;
  }

  function openModal() {
    const lock = createModal();
    lock.hidden = false;
    document.body.classList.add("dds-modal-open");
    const input = lock.querySelector("[data-eric-lock-input]");
    const error = lock.querySelector("[data-eric-lock-error]");
    input.value = ""; error.textContent = "";
    requestAnimationFrame(() => input.focus());
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("dds-modal-open");
  }

  function installCard() {
    const grid = document.querySelector(".dds-commission-grid");
    if (!grid) return false;
    if (document.querySelector(".dds-eric-commission-card")) return true;
    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-commission-card dds-eric-commission-card";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-eric-card-preview-frame" data-eric-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น Eric Hawkins"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดประเภทประวัติ</p><p class="dds-commission-card-client">ผู้จ้าง <strong>ERIC HAWKINS</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-eric-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-eric-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;
    grid.appendChild(card);
    card.querySelector("[data-eric-view]")?.addEventListener("click", openView);
    card.querySelector("[data-eric-edit]")?.addEventListener("click", () => sessionStorage.getItem(ACCESS_SESSION_KEY) === "1" ? openEditor() : openModal());
    const iframe = card.querySelector("[data-eric-card-preview]");
    const renderCard = () => {
      if (cardRendered) return;
      writeIframe(iframe, OFFICIAL_CODE, "card", () => fitCardPreview(iframe));
      cardRendered = true;
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { renderCard(); observer.disconnect(); } }, {rootMargin:"300px"});
      observer.observe(card);
    } else renderCard();
    return true;
  }

  function install() {
    createModal();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 60) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      fitEditorPreview();
      fitViewPreview();
      const iframe = card?.querySelector("[data-eric-card-preview]");
      if (iframe) fitCardPreview(iframe);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();

/* =========================================================
   NAMED LOCAL SAVE LIBRARY — MULTIPLE SAVES PER EDITOR
   - ผู้ใช้ตั้งชื่อเซฟเองได้หลายรายการ
   - แยกคลังตาม editor / commission
   - เก็บใน localStorage ของ browser profile เครื่องนั้นเท่านั้น
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_NAMED_LOCAL_SAVES_INSTALLED__) return;
  window.__DDS_NAMED_LOCAL_SAVES_INSTALLED__ = true;

  const STORAGE_PREFIX = "dds:named-local-saves:v1:";
  const MAX_NAME_LENGTH = 80;
  const installedHosts = new WeakSet();

  function notify(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.querySelector("#siteToast");
    const text = document.querySelector("#siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast.__ddsNamedSaveTimer);
    toast.__ddsNamedSaveTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function editorKey(panel) {
    const raw = panel?.dataset?.panel || panel?.id || "unknown-editor";
    return raw.replace(/[^a-z0-9:_-]+/gi, "-").toLowerCase();
  }

  function libraryKey(panel) {
    return `${STORAGE_PREFIX}${editorKey(panel)}`;
  }

  function readLibrary(panel) {
    const parsed = safeParse(safeGet(libraryKey(panel)), null);
    if (!parsed || !Array.isArray(parsed.saves)) {
      return { version: 1, saves: [] };
    }
    return {
      version: 1,
      saves: parsed.saves.filter((item) => item && item.id && item.snapshot)
    };
  }

  function writeLibrary(panel, library) {
    return safeSet(libraryKey(panel), JSON.stringify({ version: 1, saves: library.saves || [] }));
  }

  function fieldIdentity(field, fallbackIndex) {
    if (field.id) return { type: "id", value: field.id };

    const attrs = [
      "data-food-field",
      "data-history-field",
      "data-mikael-field",
      "data-eric-field",
      "data-vmac-field",
      "data-dds-field-key",
      "data-review-field",
      "data-profile-field"
    ];

    for (const attr of attrs) {
      const value = field.getAttribute(attr);
      if (value) return { type: attr, value };
    }

    if (field.name) return { type: "name", value: field.name };
    return { type: "index", value: String(fallbackIndex) };
  }

  function isSavableField(field) {
    if (!field) return false;
    if (field.matches("button, [type='button'], [type='submit'], [type='reset'], [type='file']")) return false;
    if (field.matches(".dds-generated-code, [data-dds-no-save]")) return false;
    if (field.readOnly || field.disabled) return false;
    if (field.matches("[data-history-tag], [data-lwl-side-word-input]")) return false;
    return true;
  }

  function readField(field) {
    if (field.matches("[contenteditable='true']")) {
      return { valueType: "html", value: field.innerHTML };
    }
    if (field.type === "checkbox" || field.type === "radio") {
      return { valueType: "checked", value: Boolean(field.checked) };
    }
    return { valueType: "value", value: field.value ?? "" };
  }

  function captureSpecial(panel) {
    const special = {};

    const historyTags = panel.querySelectorAll("[data-history-tag]");
    if (historyTags.length) {
      special.historyTags = Array.from(historyTags, (input) => input.value || "");
    }

    const sideWords = panel.querySelectorAll("[data-lwl-side-word-input]");
    if (sideWords.length || panel.querySelector("[data-lwl-side-words-list]") || panel.querySelector("#lwlSideWordsList")) {
      special.sideWords = Array.from(sideWords, (input) => input.value || "");
    }

    const tmiGroups = panel.querySelectorAll("[data-eric-tmi-group]");
    if (tmiGroups.length || panel.querySelector("[data-eric-tmi-list]")) {
      special.ericTmi = Array.from(tmiGroups, (group) => ({
        symbol: group.querySelector('[data-eric-field^="tmiSymbol"]')?.value || "",
        title: group.querySelector('[data-eric-field^="tmiTitle"]')?.value || "",
        text: group.querySelector('[data-eric-field^="tmiText"]')?.value || ""
      }));
    }

    return special;
  }

  function captureSnapshot(panel) {
    const fields = [];
    const occurrence = new Map();
    const candidates = Array.from(panel.querySelectorAll("input, textarea, select, [contenteditable='true']"));

    candidates.forEach((field, index) => {
      if (!isSavableField(field)) return;
      const identity = fieldIdentity(field, index);
      const sig = `${identity.type}:${identity.value}`;
      const count = occurrence.get(sig) || 0;
      occurrence.set(sig, count + 1);
      fields.push({ identity, occurrence: count, ...readField(field) });
    });

    return {
      version: 1,
      editor: editorKey(panel),
      savedAt: Date.now(),
      fields,
      special: captureSpecial(panel)
    };
  }

  function queryIdentity(panel, identity) {
    if (!identity) return [];
    const esc = (value) => CSS.escape(String(value));
    switch (identity.type) {
      case "id": {
        const node = panel.querySelector(`#${esc(identity.value)}`);
        return node ? [node] : [];
      }
      case "name":
        return Array.from(panel.querySelectorAll(`[name="${esc(identity.value)}"]`));
      case "data-food-field":
      case "data-history-field":
      case "data-mikael-field":
      case "data-eric-field":
      case "data-vmac-field":
      case "data-dds-field-key":
      case "data-review-field":
      case "data-profile-field":
        return Array.from(panel.querySelectorAll(`[${identity.type}="${esc(identity.value)}"]`));
      case "index":
        return Array.from(panel.querySelectorAll("input, textarea, select, [contenteditable='true']")).filter(isSavableField).slice(Number(identity.value), Number(identity.value) + 1);
      default:
        return [];
    }
  }

  function setField(field, entry) {
    if (!field || !entry) return;
    if (entry.valueType === "html" && field.matches("[contenteditable='true']")) {
      field.innerHTML = String(entry.value ?? "");
    } else if (entry.valueType === "checked" && (field.type === "checkbox" || field.type === "radio")) {
      field.checked = Boolean(entry.value);
    } else if ("value" in field) {
      field.value = String(entry.value ?? "");
    }
  }

  function clickUntil(panel, getCount, target, addSelector, removeSelector) {
    let guard = 0;
    while (getCount() < target && guard < 50) {
      const button = panel.querySelector(addSelector);
      if (!button) break;
      button.click();
      guard += 1;
    }
    guard = 0;
    while (getCount() > target && guard < 50) {
      const buttons = panel.querySelectorAll(removeSelector);
      const button = buttons[buttons.length - 1];
      if (!button) break;
      button.click();
      guard += 1;
    }
  }

  function rebuildSpecial(panel, special = {}) {
    if (Array.isArray(special.historyTags) && panel.querySelector("[data-history-tags-list]")) {
      const desired = Math.max(1, special.historyTags.length);
      const count = () => panel.querySelectorAll("[data-history-tag]").length;
      clickUntil(panel, count, desired, "[data-history-add-tag]", ".dds-history-tag-row button");
      const inputs = panel.querySelectorAll("[data-history-tag]");
      inputs.forEach((input, index) => {
        input.value = special.historyTags[index] ?? "";
      });
    }

    if (Array.isArray(special.sideWords)) {
      const list = panel.querySelector("[data-lwl-side-words-list]") || panel.querySelector("#lwlSideWordsList");
      if (list) {
        const desired = special.sideWords.length;
        const count = () => list.querySelectorAll("[data-lwl-side-word-input]").length;
        clickUntil(panel, count, desired, "[data-lwl-add-side-word], #lwlAddSideWord", "[data-lwl-remove-side-word]");
        list.querySelectorAll("[data-lwl-side-word-input]").forEach((input, index) => {
          input.value = special.sideWords[index] ?? "";
        });
      }
    }

    if (Array.isArray(special.ericTmi) && panel.querySelector("[data-eric-tmi-list]")) {
      const desired = special.ericTmi.length;
      const count = () => panel.querySelectorAll("[data-eric-tmi-group]").length;
      clickUntil(panel, count, desired, "[data-eric-add-tmi]", "[data-eric-remove-tmi]");
      panel.querySelectorAll("[data-eric-tmi-group]").forEach((group, index) => {
        const item = special.ericTmi[index] || {};
        const symbol = group.querySelector('[data-eric-field^="tmiSymbol"]');
        const title = group.querySelector('[data-eric-field^="tmiTitle"]');
        const text = group.querySelector('[data-eric-field^="tmiText"]');
        if (symbol) symbol.value = item.symbol || "";
        if (title) title.value = item.title || "";
        if (text) text.value = item.text || "";
      });
    }
  }

  function dispatchRefresh(panel) {
    const fields = Array.from(panel.querySelectorAll("input, textarea, select, [contenteditable='true']")).filter(isSavableField);
    fields.forEach((field) => {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      if (field.matches("select, input[type='checkbox'], input[type='radio'], input[type='color'], input[type='range']")) {
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    if (typeof window.syncImagePositionOutputs === "function") window.syncImagePositionOutputs();
    if (typeof window.updateLongWayLongRide === "function" && panel.dataset.panel === "editor-code010") {
      window.updateLongWayLongRide();
    }
  }

  function restoreSnapshot(panel, snapshot) {
    if (!snapshot || !Array.isArray(snapshot.fields)) return false;
    rebuildSpecial(panel, snapshot.special || {});

    snapshot.fields.forEach((entry) => {
      const matches = queryIdentity(panel, entry.identity);
      const field = matches[entry.occurrence || 0];
      if (field) setField(field, entry);
    });

    dispatchRefresh(panel);
    return true;
  }

  function formatDate(timestamp) {
    try {
      return new Date(timestamp).toLocaleString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  function originalSaveButton(host) {
    return host.querySelector([
      ".dds-draft-save-button",
      "[data-commission-save]",
      "[data-food-save]",
      "[data-history-save]",
      "[data-mikael-save]",
      "[data-eric-save]",
      "[data-vmac-save]"
    ].join(","));
  }

  function originalDeleteButton(host) {
    return host.querySelector([
      ".dds-draft-delete-button",
      "[data-commission-delete-save]",
      "[data-food-delete]",
      "[data-history-delete]",
      "[data-mikael-delete]",
      "[data-eric-delete]",
      "[data-vmac-delete]"
    ].join(","));
  }

  function syncCurrentDraft(host) {
    const button = originalSaveButton(host);
    if (button) button.click();
  }

  function renderList(host, panel) {
    const select = host.querySelector("[data-named-save-select]");
    const empty = host.querySelector("[data-named-save-empty]");
    const picker = host.querySelector("[data-named-save-picker]");
    if (!select || !empty || !picker) return;

    const previousValue = select.value;
    const library = readLibrary(panel);
    const saves = [...library.saves].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = saves.length ? "กดเพื่อเลือกไฟล์ที่บันทึก" : "ยังไม่มีไฟล์บันทึก";
    select.appendChild(placeholder);

    saves.forEach((save) => {
      const option = document.createElement("option");
      option.value = save.id;
      option.textContent = `${save.name || "ไม่มีชื่อ"} · ${formatDate(save.savedAt)}`;
      select.appendChild(option);
    });

    if (previousValue && saves.some((save) => save.id === previousValue)) {
      select.value = previousValue;
    }

    const hasSaves = saves.length > 0;
    select.disabled = !hasSaves;
    picker.querySelector("[data-named-save-load-selected]")?.toggleAttribute("disabled", !hasSaves);
    picker.querySelector("[data-named-save-delete-selected]")?.toggleAttribute("disabled", !hasSaves);
    empty.hidden = hasSaves;
  }

  function saveNamed(host, panel) {
    const input = host.querySelector("[data-named-save-name]");
    const name = String(input?.value || "").trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      notify("กรุณาตั้งชื่อการบันทึกก่อน");
      input?.focus();
      return;
    }

    const library = readLibrary(panel);
    const duplicate = library.saves.find((item) => item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    const snapshot = captureSnapshot(panel);

    if (duplicate) {
      if (!window.confirm(`มีเซฟชื่อ “${name}” อยู่แล้ว ต้องการเขียนทับหรือไม่?`)) return;
      duplicate.snapshot = snapshot;
      duplicate.savedAt = snapshot.savedAt;
      duplicate.name = name;
    } else {
      library.saves.push({
        id: `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        savedAt: snapshot.savedAt,
        snapshot
      });
    }

    if (!writeLibrary(panel, library)) {
      notify("บันทึกไม่สำเร็จ พื้นที่จัดเก็บของเบราว์เซอร์อาจเต็ม");
      return;
    }

    syncCurrentDraft(host);
    if (input) input.value = "";
    renderList(host, panel);
    notify(`บันทึก “${name}” ลงในเครื่องนี้แล้ว`);
  }

  function loadNamed(host, panel, id) {
    const library = readLibrary(panel);
    const save = library.saves.find((item) => item.id === id);
    if (!save) {
      notify("ไม่พบไฟล์บันทึกนี้");
      renderList(host, panel);
      return;
    }
    if (!restoreSnapshot(panel, save.snapshot)) {
      notify("โหลดไฟล์บันทึกไม่สำเร็จ");
      return;
    }
    window.setTimeout(() => syncCurrentDraft(host), 30);
    notify(`โหลด “${save.name}” แล้ว`);
  }

  function deleteNamed(host, panel, id) {
    const library = readLibrary(panel);
    const save = library.saves.find((item) => item.id === id);
    if (!save) return;
    if (!window.confirm(`ลบเซฟ “${save.name}” ออกจากเครื่องนี้หรือไม่?`)) return;
    library.saves = library.saves.filter((item) => item.id !== id);
    writeLibrary(panel, library);
    renderList(host, panel);
    notify(`ลบเซฟ “${save.name}” แล้ว`);
  }

  function buildNamedUi(host, panel) {
    const wrap = document.createElement("div");
    wrap.className = "dds-named-save-library";
    wrap.innerHTML = `
      <div class="dds-named-save-create">
        <label class="dds-named-save-name-field">
          <span>ชื่อการบันทึก</span>
          <input type="text" maxlength="${MAX_NAME_LENGTH}" data-named-save-name placeholder="กรอกชื่อการบันทึก" autocomplete="off">
        </label>
        <button type="button" class="dds-named-save-create-button" data-named-save-create>SAVE AS</button>
      </div>
      <div class="dds-named-save-heading">
        <strong>ไฟล์ที่บันทึกไว้ในเครื่องนี้</strong>
      </div>
      <div class="dds-named-save-picker" data-named-save-picker>
        <select data-named-save-select aria-label="เลือกไฟล์ที่บันทึก">
          <option value="">ยังไม่มีไฟล์บันทึก</option>
        </select>
        <button type="button" data-named-save-load-selected>LOAD</button>
        <button type="button" data-named-save-delete-selected>DELETE</button>
      </div>
      <p class="dds-named-save-empty" data-named-save-empty>ยังไม่มีไฟล์บันทึก</p>
    `;

    host.appendChild(wrap);
    host.querySelectorAll(".dds-draft-manager-actions, [data-commission-save], [data-commission-delete-save], [data-food-save], [data-food-delete], [data-history-save], [data-history-delete], [data-mikael-save], [data-mikael-delete], [data-eric-save], [data-eric-delete], [data-vmac-save], [data-vmac-delete]").forEach((node) => {
      node.classList.add("dds-original-draft-control");
    });

    wrap.querySelector("[data-named-save-create]")?.addEventListener("click", () => saveNamed(host, panel));
    wrap.querySelector("[data-named-save-name]")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveNamed(host, panel);
      }
    });

    wrap.addEventListener("click", (event) => {
      const select = wrap.querySelector("[data-named-save-select]");
      const selectedId = select?.value || "";

      if (event.target.closest("[data-named-save-load-selected]")) {
        if (!selectedId) {
          notify("กรุณาเลือกไฟล์ที่ต้องการโหลด");
          select?.focus();
          return;
        }
        loadNamed(host, panel, selectedId);
        return;
      }

      if (event.target.closest("[data-named-save-delete-selected]")) {
        if (!selectedId) {
          notify("กรุณาเลือกไฟล์ที่ต้องการลบ");
          select?.focus();
          return;
        }
        deleteNamed(host, panel, selectedId);
      }
    });

    renderList(host, panel);
  }

  function upgradeHost(host) {
    if (!host || installedHosts.has(host)) return;
    const panel = host.closest(".dds-panel");
    if (!panel || !panel.dataset.panel) return;
    installedHosts.add(host);
    host.classList.add("dds-named-save-host");
    buildNamedUi(host, panel);
  }

  function scan(root = document) {
    root.querySelectorAll?.(".dds-draft-manager, .dds-protected-commission-draft").forEach(upgradeHost);
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(".dds-draft-manager, .dds-protected-commission-draft")) upgradeHost(node);
        scan(node);
      });
    });
  });

  function install() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();

/* =========================================================
   MIKAEL F. KAISER — COVER SONG COMMISSION EDITOR
   รหัสร่วมกับงาน MIKAEL อื่น: thesecretk (เก็บเป็น SHA-256)
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_MIKAEL_COVER_EDITOR_INSTALLED__) return;
  window.__DDS_MIKAEL_COVER_EDITOR_INSTALLED__ = true;

  const ACCESS_HASH = "eb826ef52686f3139fee3102ae3309a785481071f03a55fb0d8a5f80b5f72789";
  const ACCESS_SESSION_KEY = "dds:mikael-commission-editor:unlocked";
  const PANEL_NAME = "protected-commission-mikael-cover-song";
  const VIEW_PANEL_NAME = "editor-commission-mikael-cover-song";
  const DRAFT_KEY = "dds:commission-draft:mikael:cover-song:structured-v1";
  const CANVAS_WIDTH = 900;

  const LINK_PREFIX = String.raw`<link href="https://guindaeyo.github.io/css/commit-mklsinsong.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

  const OFFICIAL_CODE = String.raw`<link href="https://guindaeyo.github.io/css/commit-mklsinsong.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><div class="ddsh-vmac-fullbg" style="--ddsh-vmac-bg:url('https://i.pinimg.com/1200x/23/10/8b/23108b4dbecdb3dbce78de778b701828.jpg');--ddsh-vmac-inner-bg:url('https://i.pinimg.com/1200x/a1/f9/43/a1f943fa7e48fd29ae372ec4505c2be9.jpg');"><div class="ddsh-vmac"><div class="ddsh-vmac-menubar"><div class="ddsh-vmac-menu-left"><span class="ddsh-vmac-apple">●</span><strong>Finder</strong><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></div><div class="ddsh-vmac-menu-right"><span>◖◗</span><span>⌁</span><span>100%</span><span>&#128267;</span><span>Sun 23:25</span></div></div><div class="ddsh-vmac-desktop"><div class="ddsh-vmac-emoji ddsh-vmac-emoji-one">&#127911;</div><div class="ddsh-vmac-emoji ddsh-vmac-emoji-two">&#11088;</div><div class="ddsh-vmac-emoji ddsh-vmac-emoji-three">&#128191;</div><div class="ddsh-vmac-emoji ddsh-vmac-emoji-four">&#127872;</div><div class="ddsh-vmac-finder"><div class="ddsh-vmac-finder-top"><span></span><span></span><span></span></div><div class="ddsh-vmac-finder-title">Favorites</div><div class="ddsh-vmac-finder-item"><b>◉</b><span>AirDrop</span></div><div class="ddsh-vmac-finder-item"><b>◷</b><span>Recents</span></div><div class="ddsh-vmac-finder-item"><b>□</b><span>Documents</span></div><div class="ddsh-vmac-finder-item"><b>☁</b><span>iCloud</span></div><div class="ddsh-vmac-finder-title ddsh-vmac-finder-title2">iCloud</div><div class="ddsh-vmac-finder-item"><b>↓</b><span>Downloads</span></div><div class="ddsh-vmac-finder-item"><b>♫</b><span>Music</span></div></div><div class="ddsh-vmac-photo ddsh-vmac-photo-one"><div class="ddsh-vmac-photo-bar"><div class="ddsh-vmac-dots"><i></i><i></i><i></i></div><span>Preview</span></div><img src="https://i.pinimg.com/736x/a4/1a/f2/a41af2da9102c60a827281f67da9e827.jpg"><div class="ddsh-vmac-photo-info"><span>IMG_0624</span><b>•••</b></div></div><div class="ddsh-vmac-video-stage"><div class="ddsh-vmac-song-head"><div class="ddsh-vmac-song-small">NOW PLAYING</div><div class="ddsh-vmac-song-name">ชื่อเพลง</div><div class="ddsh-vmac-song-artist">Original Artist — ชื่อศิลปิน</div></div><div class="ddsh-vmac-video-window"><div class="ddsh-vmac-window-head"><div class="ddsh-vmac-window-dots"><i></i><i></i><i></i></div><span>Video Booth</span></div><div class="ddsh-vmac-video-area"><iframe src="https://www.youtube.com/embed/Jq19C6hi5mU?rel=0&playsinline=1" title="Video" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="ddsh-vmac-video-bottom"><div class="ddsh-vmac-bottom-left"><span>▦</span><span class="active">▣</span><span>▤</span></div><div class="ddsh-vmac-record"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="11" height="10" rx="2"></rect><path d="M15 10l5-3v10l-5-3z"></path></svg></div><div class="ddsh-vmac-effect">Effects</div></div></div></div><div class="ddsh-vmac-photo ddsh-vmac-photo-two"><div class="ddsh-vmac-photo-bar"><div class="ddsh-vmac-dots"><i></i><i></i><i></i></div><span>Photos</span></div><img src="https://i.pinimg.com/1200x/96/e7/cf/96e7cf2edc621eda58b0bc38d11014e8.jpg"><div class="ddsh-vmac-photo-actions"><span>♡</span><span>Today</span><span>↥</span></div></div><div class="ddsh-vmac-description"><div class="ddsh-vmac-description-head"><div><div class="ddsh-vmac-description-label">VOICE MEMO</div><div class="ddsh-vmac-description-title">about this cover</div></div><div class="ddsh-vmac-description-more">•••</div></div><div class="ddsh-vmac-cover"><div class="ddsh-vmac-cover-info"><span>COVERED BY</span><strong>ชื่อคนร้อง Cover</strong></div><div class="ddsh-vmac-cover-status">REC</div></div><div class="ddsh-vmac-description-text">สุขใดเล่าจะเท่า มีคุณแม่เป็นทรงซ้อ มีคุณพ่อเป็นทรงเอ
แม่หนูเป็นทรงซ้อ ทรงซ้อ ทรงซ้อ ทรงซ้อ
พ่อหนูเป็นทรงเอ ทรงเอ ทรงเอ ทรงเอ
แม่หนูเป็นทรงซ้อ พ่อหนูเป็นทรงเอ
เขาเรียกแม่หนูทรงซ้อ เขาเรียกพ่อหนูทรงเอ
บ้านหนูมันโคตรเท่
พ่อแม่โอเค เปย์หนูทั้งใจ
...อ้างอิง https://www.siamzone.com/music/thailyric/38553</div><div class="ddsh-vmac-description-bottom"><span>recorded with video booth</span><span>♡ 01</span></div></div><div class="ddsh-vmac-notify"><span class="ddsh-vmac-notify-icon">✓</span><div><strong>Video Saved</strong><small>just now</small></div></div><div class="ddsh-vmac-dock"><div class="ddsh-vmac-dock-icon"><span>◒</span></div><div class="ddsh-vmac-dock-icon"><span>▦</span></div><div class="ddsh-vmac-dock-icon"><span>A</span></div><div class="ddsh-vmac-dock-icon"><span>◎</span></div><div class="ddsh-vmac-dock-icon"><span>▰</span></div><div class="ddsh-vmac-dock-icon"><span>◉</span></div><div class="ddsh-vmac-dock-icon"><span>✦</span></div><div class="ddsh-vmac-dock-icon"><span>●</span></div><div class="ddsh-vmac-dock-icon"><span>□</span></div><div class="ddsh-vmac-dock-icon"><span>⌁</span></div><div class="ddsh-vmac-dock-separator"></div><div class="ddsh-vmac-dock-icon"><span>⌫</span></div></div></div></div></div><div class="ddshopfz-credit"><span></span></div>`;

  const defaults = Object.freeze({
    bgImage: "https://i.pinimg.com/1200x/23/10/8b/23108b4dbecdb3dbce78de778b701828.jpg",
    innerBgImage: "https://i.pinimg.com/1200x/a1/f9/43/a1f943fa7e48fd29ae372ec4505c2be9.jpg",
    photoOne: "https://i.pinimg.com/736x/a4/1a/f2/a41af2da9102c60a827281f67da9e827.jpg",
    photoTwo: "https://i.pinimg.com/1200x/96/e7/cf/96e7cf2edc621eda58b0bc38d11014e8.jpg",
    youtubeId: "Jq19C6hi5mU",
    emojiOne: "127911",
    emojiTwo: "11088",
    emojiThree: "128191",
    emojiFour: "127872",
    menuDate: "Sun 23:25",
    photoOneName: "IMG_0624",
    songName: "ชื่อเพลง",
    originalArtist: "ชื่อศิลปิน",
    coverName: "ชื่อคนร้อง Cover",
    descriptionLabel: "VOICE MEMO",
    descriptionTitle: "about this cover",
    descriptionText: "สุขใดเล่าจะเท่า มีคุณแม่เป็นทรงซ้อ มีคุณพ่อเป็นทรงเอ\nแม่หนูเป็นทรงซ้อ ทรงซ้อ ทรงซ้อ ทรงซ้อ\nพ่อหนูเป็นทรงเอ ทรงเอ ทรงเอ ทรงเอ\nแม่หนูเป็นทรงซ้อ พ่อหนูเป็นทรงเอ\nเขาเรียกแม่หนูทรงซ้อ เขาเรียกพ่อหนูทรงเอ\nบ้านหนูมันโคตรเท่\nพ่อแม่โอเค เปย์หนูทั้งใจ\n...อ้างอิง https://www.siamzone.com/music/thailyric/38553",
    recordedText: "recorded with video booth",
    likeText: "♡ 01",
    notifyTitle: "Video Saved",
    notifyTime: "just now",
    dock1: "◒", dock2: "▦", dock3: "A", dock4: "◎", dock5: "▰", dock6: "◉",
    dock7: "✦", dock8: "●", dock9: "□", dock10: "⌁", dock11: "⌫"
  });

  let panel = null;
  let viewPanel = null;
  let card = null;
  let modal = null;
  let previewTimer = 0;

  function showToast(message) {
    if (typeof window.showToast === "function") return window.showToast(message);
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast.__ddsVmacTimer);
    toast.__ddsVmacTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  async function sha256(value) {
    const data = new TextEncoder().encode(String(value || ""));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssUrl(value) {
    return String(value || "").replace(/[\\'\r\n]/g, (char) => ({"\\":"\\\\", "'":"\\'", "\r":"", "\n":""}[char] ?? ""));
  }

  function decimal(value, fallback) {
    const match = String(value || "").match(/\d+/);
    return match ? match[0] : String(fallback || "");
  }

  function youtubeId(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^[A-Za-z0-9_-]{6,20}$/.test(raw)) return raw;
    const patterns = [/[?&]v=([A-Za-z0-9_-]{6,20})/, /youtu\.be\/([A-Za-z0-9_-]{6,20})/, /embed\/([A-Za-z0-9_-]{6,20})/, /shorts\/([A-Za-z0-9_-]{6,20})/];
    for (const pattern of patterns) {
      const match = raw.match(pattern);
      if (match) return match[1];
    }
    return raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20);
  }

  function field(label, key, options = {}) {
    const { full = false, textarea = false, rows = 3, type = "text", placeholder = "" } = options;
    return `<label class="dds-field${full ? " dds-field-full" : ""}"><span>${h(label)}</span>${textarea
      ? `<textarea rows="${rows}" data-vmac-field="${h(key)}" placeholder="${h(placeholder)}"></textarea>`
      : `<input type="${h(type)}" data-vmac-field="${h(key)}" placeholder="${h(placeholder)}" spellcheck="false">`}</label>`;
  }

  function getValues() {
    const result = {};
    panel?.querySelectorAll("[data-vmac-field]").forEach((input) => {
      result[input.dataset.vmacField] = input.value;
    });
    return result;
  }

  function setValues(values = defaults) {
    panel?.querySelectorAll("[data-vmac-field]").forEach((input) => {
      const key = input.dataset.vmacField;
      input.value = values?.[key] ?? defaults[key] ?? "";
    });
  }

  function parseOfficial() {
    return new DOMParser().parseFromString(`<!doctype html><html><body>${OFFICIAL_CODE}</body></html>`, "text/html");
  }

  function setText(doc, selector, value) {
    const node = doc.querySelector(selector);
    if (node) node.textContent = String(value ?? "");
  }

  function buildCode(values = getValues()) {
    const doc = parseOfficial();
    const root = doc.querySelector(".ddsh-vmac-fullbg");
    if (root) {
      root.style.setProperty("--ddsh-vmac-bg", `url('${cssUrl(values.bgImage)}')`);
      root.style.setProperty("--ddsh-vmac-inner-bg", `url('${cssUrl(values.innerBgImage)}')`);
    }

    const images = doc.querySelectorAll(".ddsh-vmac-photo img");
    if (images[0]) images[0].setAttribute("src", values.photoOne || "");
    if (images[1]) images[1].setAttribute("src", values.photoTwo || "");

    const video = doc.querySelector(".ddsh-vmac-video-area iframe");
    if (video) video.setAttribute("src", `https://www.youtube.com/embed/${youtubeId(values.youtubeId)}?rel=0&playsinline=1`);

    const emojiSelectors = [".ddsh-vmac-emoji-one", ".ddsh-vmac-emoji-two", ".ddsh-vmac-emoji-three", ".ddsh-vmac-emoji-four"];
    const emojiValues = [values.emojiOne, values.emojiTwo, values.emojiThree, values.emojiFour];
    emojiSelectors.forEach((selector, index) => {
      const node = doc.querySelector(selector);
      if (node) node.textContent = `__DDS_VMAC_EMOJI_${index + 1}__`;
    });

    const menuRight = doc.querySelectorAll(".ddsh-vmac-menu-right > span");
    if (menuRight.length) menuRight[menuRight.length - 1].textContent = values.menuDate || "";
    setText(doc, ".ddsh-vmac-photo-one .ddsh-vmac-photo-info > span", values.photoOneName);
    setText(doc, ".ddsh-vmac-song-name", values.songName);
    setText(doc, ".ddsh-vmac-song-artist", `Original Artist — ${values.originalArtist || ""}`);
    setText(doc, ".ddsh-vmac-cover-info > strong", values.coverName);
    setText(doc, ".ddsh-vmac-description-label", values.descriptionLabel);
    setText(doc, ".ddsh-vmac-description-title", values.descriptionTitle);
    setText(doc, ".ddsh-vmac-description-text", values.descriptionText);
    const bottom = doc.querySelectorAll(".ddsh-vmac-description-bottom > span");
    if (bottom[0]) bottom[0].textContent = values.recordedText || "";
    if (bottom[1]) bottom[1].textContent = values.likeText || "";
    setText(doc, ".ddsh-vmac-notify strong", values.notifyTitle);
    setText(doc, ".ddsh-vmac-notify small", values.notifyTime);

    const dock = doc.querySelectorAll(".ddsh-vmac-dock-icon > span");
    dock.forEach((node, index) => {
      node.textContent = values[`dock${index + 1}`] ?? "";
    });

    let output = doc.body.innerHTML.replace(/<link\b[^>]*>/gi, "");
    output = LINK_PREFIX + output;
    emojiValues.forEach((value, index) => {
      output = output.replace(`__DDS_VMAC_EMOJI_${index + 1}__`, `&#${decimal(value, [127911,11088,128191,127872][index])};`);
    });
    return output;
  }

  function previewDocument(code) {
    /*
     * ใช้ viewport desktop ตามความกว้างจริงของงาน Cover Song (900px)
     * แล้วค่อย scale iframe ทั้งชิ้นจากด้านนอก เพื่อไม่ให้ CSS ภายใน
     * เข้า breakpoint แคบจน layout เบี้ยว
     *
     * สำคัญ: OFFICIAL_CODE มี ddshopfz-credit เป็น sibling ของชิ้นงานหลัก
     * จึงต้องเรียง preview shell เป็นแนวตั้ง ไม่เช่นนั้น flex แถวเดียวจะบีบ
     * .ddsh-vmac-fullbg ให้แคบและดันชิ้นงานออกจากกึ่งกลาง
     */
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=${CANVAS_WIDTH},initial-scale=1"><style>html,body{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;min-height:100%;background:#242424;overflow:hidden!important}.dds-vmac-preview-shell{width:${CANVAS_WIDTH}px!important;min-width:${CANVAS_WIDTH}px!important;max-width:${CANVAS_WIDTH}px!important;margin:0!important;padding:0!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important}.dds-vmac-preview-shell>.ddsh-vmac-fullbg,.dds-vmac-preview-shell>.ddshopfz-credit{flex:0 0 auto!important;max-width:none}</style></head><body><div class="dds-vmac-preview-shell">${code}</div></body></html>`;
  }

  function writeIframe(iframe, code, afterLoad) {
    if (!iframe) return;
    iframe.onload = () => {
      window.setTimeout(() => afterLoad?.(), 40);
      window.setTimeout(() => afterLoad?.(), 250);
      try {
        iframe.contentDocument?.fonts?.ready?.then(() => afterLoad?.());
      } catch {}
    };
    iframe.srcdoc = previewDocument(code);
  }

  /*
   * หน้า COMMISSION ใช้พรีวิวแบบเบาเพื่อไม่ให้ YouTube player จริง
   * และ Google Fonts ถูกโหลดซ้ำตั้งแต่ยังไม่ได้เปิด VIEW WORK.
   * VIEW WORK / EDIT CODE ยังคงใช้ OFFICIAL_CODE เต็มเหมือนเดิม.
   */
  function buildLightCardPreviewCode(code) {
    let output = String(code || "");

    output = output
      .replace(/<link\b[^>]*rel=["']preconnect["'][^>]*>/gi, "")
      .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']*["'][^>]*>/gi, "")
      .replace(/<link\b[^>]*href=["']https:\/\/fonts\.gstatic\.com\/[^"']*["'][^>]*>/gi, "");

    const poster = [
      '<!doctype html><html><head><meta charset="utf-8">',
      '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#080808}',
      'body{display:grid;place-items:center;color:rgba(255,255,255,.72);font:600 28px/1 Arial,sans-serif}',
      '.p{width:58px;height:58px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(255,255,255,.06)}</style>',
      '</head><body><div class="p">▶</div></body></html>'
    ].join("")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    output = output.replace(
      /\ssrc=["']https:\/\/www\.youtube\.com\/embed\/[^"']+["']/i,
      ` srcdoc="${poster}" loading="lazy"`
    );

    return output;
  }

  function contentHeight(iframe) {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return 900;
      const root = doc.querySelector(".ddsh-vmac-fullbg") || doc.querySelector(".ddsh-vmac") || doc.body;
      return Math.max(1, Math.ceil(Math.max(
        root?.scrollHeight || 0,
        root?.getBoundingClientRect?.().height || 0,
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0
      )));
    } catch {
      return 900;
    }
  }

  function fitHolder(stage, holder, iframe) {
    if (!stage || !holder || !iframe) return;
    const height = contentHeight(iframe);
    const available = Math.max(280, stage.clientWidth - 48);
    const scale = Math.min(1, available / CANVAS_WIDTH);
    holder.style.width = `${Math.ceil(CANVAS_WIDTH * scale)}px`;
    holder.style.height = `${Math.ceil(height * scale)}px`;
    iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.height = `${height}px`;
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = "top left";
  }

  function fitEditorPreview() {
    if (!panel) return;
    fitHolder(panel.querySelector("[data-vmac-preview-stage]"), panel.querySelector("[data-vmac-preview-holder]"), panel.querySelector("[data-vmac-preview]"));
  }

  function fitViewPreview() {
    if (!viewPanel) return;
    fitHolder(viewPanel.querySelector("[data-vmac-view-stage]"), viewPanel.querySelector("[data-vmac-view-holder]"), viewPanel.querySelector("[data-vmac-view-preview]"));
  }

  function fitCardPreview() {
    const iframe = card?.querySelector("[data-vmac-card-preview]");
    const stage = iframe?.closest(".dds-roleplay-card-preview");
    if (!iframe || !stage) return;
    const height = contentHeight(iframe);
    const widthScale = stage.clientWidth / CANVAS_WIDTH;
    const heightScale = stage.clientHeight / Math.max(1, height);
    const scale = Math.min(widthScale, heightScale, 0.42);
    iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.height = `${height}px`;
    iframe.style.left = "50%";
    iframe.style.top = "50%";
    iframe.style.transformOrigin = "center center";
    iframe.style.setProperty("transform", `translate(-50%, -50%) scale(${scale})`, "important");
  }

  function updatePreview() {
    if (!panel) return;
    const iframe = panel.querySelector("[data-vmac-preview]");
    writeIframe(iframe, buildCode(), fitEditorPreview);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 70);
  }

  function setDraftStatus(savedAt) {
    const status = panel?.querySelector("[data-vmac-draft-status]");
    if (!status) return;
    status.textContent = savedAt ? `บันทึกล่าสุด ${new Date(savedAt).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "ยังไม่มีแบบร่าง";
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
      setDraftStatus(savedAt);
      showToast("บันทึกแบบร่างโค้ด Cover แล้ว");
    } catch {
      showToast("บันทึกแบบร่างไม่สำเร็จ");
    }
  }

  function deleteDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setValues(editorDefaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(editorDefaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode();
    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ด Cover แล้ว");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("คัดลอกโค้ด Cover แล้ว");
    }
  }

  function setCommissionTab() {
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const selected = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-work-panel]").forEach((workPanel) => {
      const selected = workPanel.dataset.workPanel === "commission";
      workPanel.hidden = !selected;
      workPanel.classList.toggle("is-active", selected);
    });
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => item.classList.toggle("is-active", item.dataset.panel === panelName));
    document.querySelectorAll(".dds-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === "commission"));
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    const restoreCommissionPage = () => {
      document.body.classList.remove(
        "dds-editor-mode",
        "dds-commission-editor-mode",
        "dds-modal-open"
      );
      document.documentElement.classList.remove(
        "dds-editor-mode",
        "dds-commission-editor-mode",
        "dds-modal-open"
      );

      document.querySelectorAll(".dds-panel").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.panel === "commission");
      });
      document.querySelectorAll(".dds-nav-button").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.page === "commission");
      });
      setCommissionTab();

      const pageNumber = document.getElementById("currentPageNumber");
      if (pageNumber) pageNumber.textContent = "04";
      history.replaceState(null, "", "#commission");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    restoreCommissionPage();
    requestAnimationFrame(() => {
      restoreCommissionPage();
      requestAnimationFrame(restoreCommissionPage);
    });
    window.setTimeout(restoreCommissionPage, 80);
  }

  function createPanel() {
    if (panel?.isConnected) return panel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-vmac-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-vmac-back type="button">←</button>
        <div><p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p><h1 class="dds-vmac-commission-heading"><span>COMMISSION</span><span>— โค้ดสำหรับการลงโคฟเวอร์เพลง</span></h1><p>ผู้จ้าง MIKAEL F. KAISER — แก้รูป วิดีโอ Emoji ข้อความ และ Dock ได้จากเครื่องมือด้านขวา</p></div>
      </div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>MIKAEL / COVER SONG</strong></div>
          <div class="dds-protected-commission-preview-stage dds-vmac-preview-stage" data-vmac-preview-stage><div class="dds-vmac-preview-holder" data-vmac-preview-holder><iframe class="dds-protected-commission-preview-frame" data-vmac-preview scrolling="no" title="ตัวอย่างโค้ด Cover Song"></iframe></div></div>
        </div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-vmac-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-vmac-save>SAVE DRAFT</button><button type="button" data-vmac-delete>DELETE SAVE</button></div>
          <div class="dds-protected-commission-scroll dds-vmac-commission-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>รูปภาพ</h2></div><div class="dds-form-grid">
              ${field("รูปพื้นหลังด้านนอก — --ddsh-vmac-bg", "bgImage", {full:true,type:"url",placeholder:defaults.bgImage})}
              ${field("รูปพื้นหลังด้านใน — --ddsh-vmac-inner-bg", "innerBgImage", {full:true,type:"url",placeholder:defaults.innerBgImage})}
              ${field("รูป Preview ด้านซ้าย", "photoOne", {full:true,type:"url",placeholder:defaults.photoOne})}
              ${field("รูป Photos ด้านขวา", "photoTwo", {full:true,type:"url",placeholder:defaults.photoTwo})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>เพลงและ YouTube</h2></div><div class="dds-form-grid">
              ${field("YouTube Video ID", "youtubeId", {full:true,placeholder:"เช่น Jq19C6hi5mU"})}
              ${field("ชื่อเพลง", "songName", {placeholder:"ชื่อเพลง"})}
              ${field("ชื่อศิลปิน", "originalArtist", {placeholder:"ชื่อศิลปิน"})}
              ${field("ชื่อคนร้อง Cover", "coverName", {full:true,placeholder:"ชื่อคนร้อง Cover"})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>Emoji บน Desktop</h2></div><p class="dds-vmac-emoji-help">กรอกเฉพาะเลขจากช่อง <strong>Decimal Value</strong> ระบบจะสร้างเป็น HTML Emoji Code ให้อัตโนมัติ · <a href="https://www.dremendo.com/html-tutorial/html-emoji-codes" target="_blank" rel="noopener noreferrer">เปิดตาราง Emoji Codes ↗</a></p><div class="dds-form-grid">
              ${field("Emoji 01 — หูฟัง", "emojiOne", {placeholder:"127911"})}
              ${field("Emoji 02 — ดาว", "emojiTwo", {placeholder:"11088"})}
              ${field("Emoji 03 — ซีดี", "emojiThree", {placeholder:"128191"})}
              ${field("Emoji 04 — โบว์", "emojiFour", {placeholder:"127872"})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>ข้อความในโค้ด</h2></div><div class="dds-form-grid">
              ${field("วัน / เวลาแถบเมนู", "menuDate", {placeholder:"Sun 23:25"})}
              ${field("ชื่อไฟล์รูป Preview", "photoOneName", {placeholder:"IMG_0624"})}
              ${field("ป้ายคำอธิบาย", "descriptionLabel", {placeholder:"VOICE MEMO"})}
              ${field("หัวข้อคำอธิบาย", "descriptionTitle", {placeholder:"about this cover"})}
              ${field("ข้อความ .ddsh-vmac-description-text", "descriptionText", {full:true,textarea:true,rows:9,placeholder:"กรอกรายละเอียด Cover"})}
              ${field("ข้อความล่างซ้าย", "recordedText", {placeholder:"recorded with video booth"})}
              ${field("ข้อความล่างขวา", "likeText", {placeholder:"♡ 01"})}
              ${field("ข้อความแจ้งเตือน", "notifyTitle", {placeholder:"Video Saved"})}
              ${field("เวลาการแจ้งเตือน", "notifyTime", {placeholder:"just now"})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>Dock Symbols</h2></div><p class="dds-vmac-emoji-help">แก้สัญลักษณ์ใน <code>.ddsh-vmac-dock-icon</code> ได้ทุกช่อง จะพิมพ์ตัวอักษรหรือสัญลักษณ์โดยตรงก็ได้</p><div class="dds-form-grid dds-vmac-dock-editor-grid">
              ${field("Dock 01", "dock1", {placeholder:"◒"})}${field("Dock 02", "dock2", {placeholder:"▦"})}${field("Dock 03", "dock3", {placeholder:"A"})}${field("Dock 04", "dock4", {placeholder:"◎"})}${field("Dock 05", "dock5", {placeholder:"▰"})}${field("Dock 06", "dock6", {placeholder:"◉"})}${field("Dock 07", "dock7", {placeholder:"✦"})}${field("Dock 08", "dock8", {placeholder:"●"})}${field("Dock 09", "dock9", {placeholder:"□"})}${field("Dock 10", "dock10", {placeholder:"⌁"})}${field("Dock 11 — หลังเส้นคั่น", "dock11", {placeholder:"⌫"})}
            </div></section>
          </div>
          <section class="dds-protected-commission-copy dds-vmac-commission-copy"><div class="dds-control-title"><span>06</span><h2>คัดลอกโค้ด</h2></div><p>กดปุ่มด้านล่างเพื่อคัดลอกโค้ด Cover ที่แก้เสร็จแล้ว</p><div class="dds-protected-commission-copy-actions"><button type="button" data-vmac-copy>COPY CODE <span>↗</span></button><button type="button" data-vmac-reset>RESET</button></div></section>
        </div>
      </div>`;

    footer.before(panel);
    panel.querySelector("[data-vmac-back]")?.addEventListener("click", goBack);
    panel.addEventListener("input", schedulePreview);
    panel.addEventListener("change", schedulePreview);
    panel.querySelector("[data-vmac-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-vmac-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-vmac-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-vmac-reset]")?.addEventListener("click", resetFields);
    return panel;
  }

  function createViewPanel() {
    if (viewPanel?.isConnected) return viewPanel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;
    viewPanel = document.createElement("section");
    viewPanel.className = "dds-panel dds-commission-view-panel dds-vmac-view-panel";
    viewPanel.dataset.panel = VIEW_PANEL_NAME;
    viewPanel.innerHTML = `<div class="dds-commission-view-toolbar"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-vmac-view-back type="button">←</button></div><div class="dds-vmac-view-stage" data-vmac-view-stage><div class="dds-vmac-view-holder" data-vmac-view-holder><iframe class="dds-editor-preview-frame dds-vmac-view-frame" data-vmac-view-preview scrolling="no" title="งานคอมมิชชั่น Cover Song ของ Mikael F. Kaiser"></iframe></div></div>`;
    footer.before(viewPanel);
    viewPanel.querySelector("[data-vmac-view-back]")?.addEventListener("click", goBack);
    return viewPanel;
  }

  function openView() {
    const target = createViewPanel();
    if (!target) return;

    // VIEW WORK ใช้โหมดเต็มหน้าเหมือนคอมมิชชั่นอื่น
    // ซ่อน sidebar / topbar / footer และแสดงเฉพาะชิ้นงาน
    document.body.classList.add("dds-editor-mode");
    document.documentElement.classList.add("dds-editor-mode");

    showPanel(VIEW_PANEL_NAME);
    history.replaceState(null, "", "#commission-mikael-cover-view");
    writeIframe(target.querySelector("[data-vmac-view-preview]"), OFFICIAL_CODE, fitViewPreview);

    // กันระบบ layout อื่นคืน sidebar หลังสลับ panel
    requestAnimationFrame(() => {
      document.body.classList.add("dds-editor-mode");
      document.documentElement.classList.add("dds-editor-mode");
      fitViewPreview();
    });
  }

  function openEditor() {
    const editor = createPanel();
    if (!editor) return;
    const draft = getDraft();
    setValues(draft?.values || defaults);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    history.replaceState(null, "", "#commission-mikael-cover-editor");
    updatePreview();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("dds-modal-open");
  }

  function createModal() {
    if (modal?.isConnected) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.id = "ddsMikaelCoverLockModal";
    modal.hidden = true;
    modal.innerHTML = `<form class="dds-commission-lock-dialog" data-vmac-lock-form><small>CLIENT ACCESS / MIKAEL F. KAISER</small><h2>Protected editor</h2><p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" data-vmac-lock-input placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" data-vmac-lock-error aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-vmac-lock-close>CANCEL</button></div></form>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-vmac-lock-close]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.querySelector("[data-vmac-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-vmac-lock-input]");
      const error = modal.querySelector("[data-vmac-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;
      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";
      try {
        if (await sha256(input.value || "") === ACCESS_HASH) {
          sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
          error.textContent = "";
          closeModal();
          openEditor();
        } else {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
        }
      } catch {
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });
    return modal;
  }

  function openModal() {
    const lock = createModal();
    lock.hidden = false;
    document.body.classList.add("dds-modal-open");
    const input = lock.querySelector("[data-vmac-lock-input]");
    const error = lock.querySelector("[data-vmac-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    requestAnimationFrame(() => input?.focus());
  }

  function installCard() {
    if (card?.isConnected) return true;
    const grid = document.querySelector('[data-work-panel="commission"] .dds-commission-grid') || document.querySelector(".dds-commission-grid");
    if (!grid) return false;
    if (grid.querySelector(".dds-vmac-commission-card")) return true;

    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-commission-card dds-vmac-commission-card";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-vmac-card-preview-frame" data-vmac-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น Cover Song"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดสำหรับการลงโคฟเวอร์เพลง</p><p class="dds-commission-card-client">ผู้จ้าง <strong>MIKAEL F. KAISER</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-vmac-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-vmac-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;
    grid.appendChild(card);
    card.querySelector("[data-vmac-view]")?.addEventListener("click", openView);
    card.querySelector("[data-vmac-edit]")?.addEventListener("click", () => sessionStorage.getItem(ACCESS_SESSION_KEY) === "1" ? openEditor() : openModal());

    const cardPreview = card.querySelector("[data-vmac-card-preview]");
    let cardPreviewRendered = false;
    const renderCardPreview = () => {
      if (cardPreviewRendered || !cardPreview) return;
      cardPreviewRendered = true;
      writeIframe(cardPreview, buildLightCardPreviewCode(OFFICIAL_CODE), fitCardPreview);
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        renderCardPreview();
      }, { rootMargin: "420px 0px" });
      observer.observe(card);
    } else {
      renderCardPreview();
    }

    return true;
  }

  function install() {
    createModal();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 80) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      fitCardPreview();
      fitEditorPreview();
      fitViewPreview();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, {once:true});
  else install();
})();


/* =========================================================
   LANDON A. RUTHERFORD — PROFILE COMMISSION EDITOR
   รหัสร่วมกับงาน LANDON อื่น: tomhuakaigetout (เก็บเป็น SHA-256)
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_LANDON_DESKTOP_PROFILE_EDITOR_INSTALLED__) return;
  window.__DDS_LANDON_DESKTOP_PROFILE_EDITOR_INSTALLED__ = true;

  const ACCESS_HASH = "6d05de9e9a208dc2beb7d5e594b39064b36142353ffc8db10295131098a1bcd6";
  const ACCESS_SESSION_KEY = "dds:landon-commission-editor:unlocked";
  const PANEL_NAME = "protected-commission-landon-desktop-profile";
  const VIEW_PANEL_NAME = "editor-commission-landon-desktop-profile";
  const DRAFT_KEY = "dds:commission-draft:landon:desktop-profile:structured-v1";
  const PREVIEW_BOOT_WIDTH = 1400;

  const LINK_PREFIX = String.raw`<link href="https://guindaeyo.github.io/css/commit-landdprof.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600&family=Inter:wght@300;400;500;600;700&family=Italianno&display=swap" rel="stylesheet">`;

  const defaults = Object.freeze({
    wallpaper: "https://i.pinimg.com/736x/bd/bd/c0/bdbdc0ce2162f4608fb1e1d6f42f0bc4.jpg",
    mainImage: "https://i.pinimg.com/736x/78/53/ae/7853aeec402ed13d6146df2add711570.jpg",
    photoOne: "https://i.pinimg.com/736x/a7/70/11/a770113ea393749c1ab94f01034840d2.jpg",
    photoTwo: "https://i.pinimg.com/736x/24/d3/b1/24d3b1a06503232b2bc77daec164357f.jpg",
    photoThree: "https://i.pinimg.com/736x/0f/5a/c6/0f5ac6653a0cc646d73241002f91df60.jpg",
    avatar: "https://i.pinimg.com/736x/fe/68/b8/fe68b80ea6533c91f320040c59e5a2d3.jpg",
    bigName: "landon",
    bigSurname: "A. RUTHERFORD",
    photoSmall: "somewhere between",
    photoBig: "midnight & memory",
    airdropText: "Landon would like to share a photo.",
    smallWindowLetter: "K",
    archiveText: "ARCHIVE",
    archiveNo: "NO. 07",
    polaroidTime: "00:17 AM",
    bottomWord: "woof.",
    bottomName: "LANDON A. RUTHERFORD",
    mainCaption: "STAY AFTER DARK",
    reminderText: "Don't disappear tonight.",
    keyEmoji1: "10022",
    keyEmoji2: "9824",
    keyEmoji3: "9790",
    keyEmoji4: "128420",
    keyEmoji5: "9939 65039",
    keyEmoji6: "127911",
    float1: "9729 65039",
    float2: "10022",
    float3: "127911",
    float4: "9790",
    float5: "128420",
    float6: "9824 65038",
    float7: "9939 65039",
    float8: "10023",
    float9: "128477 65039",
    float10: "9729 65039",
    float11: "10022",
    float12: "128375 65039",
    float13: "9841",
    float14: "127925",
    float15: "9733",
    dock1: "⌘", dock2: "✦", dock3: "12", dock4: "▤", dock5: "▲", dock6: "◎", dock7: "◫",
    dock8: "◇", dock9: "◉", dock10: "N", dock11: "●", dock12: "♫", dock13: "▰", dock14: "⌫"
  });

  let panel = null;
  let viewPanel = null;
  let card = null;
  let modal = null;
  let previewTimer = 0;
  let cardRendered = false;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssUrl(value) {
    return String(value || "").replace(/[\\'\r\n]/g, (char) => ({"\\":"\\\\", "'":"\\'", "\r":"", "\n":""}[char] ?? ""));
  }

  function emojiEntities(value, fallback = "") {
    const values = (String(value || "").match(/\d+/g) || []).slice(0, 4);
    const source = values.length ? values : (String(fallback || "").match(/\d+/g) || []);
    return source.map((item) => `&#${item};`).join("");
  }

  function showToast(message) {
    if (typeof window.showToast === "function") return window.showToast(message);
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast.__ddsLrProfileTimer);
    toast.__ddsLrProfileTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value || ""));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function field(label, key, options = {}) {
    const { full = false, type = "text", textarea = false, rows = 3, placeholder = "" } = options;
    return `<label class="dds-field${full ? " dds-field-full" : ""}"><span>${h(label)}</span>${textarea
      ? `<textarea rows="${rows}" data-profile-field="${h(key)}" placeholder="${h(placeholder)}"></textarea>`
      : `<input type="${h(type)}" data-profile-field="${h(key)}" placeholder="${h(placeholder)}" spellcheck="false">`}</label>`;
  }

  function getValues() {
    const values = { ...defaults };
    if (!panel) return values;
    panel.querySelectorAll("[data-profile-field]").forEach((input) => {
      values[input.dataset.profileField] = input.value;
    });
    return values;
  }

  function setValues(values = {}) {
    if (!panel) return;
    panel.querySelectorAll("[data-profile-field]").forEach((input) => {
      const key = input.dataset.profileField;
      input.value = values[key] ?? defaults[key] ?? "";
    });
  }

  function buildCode(values = getValues()) {
    const v = { ...defaults, ...values };
    const keyEmojis = [1,2,3,4,5,6].map((n) => emojiEntities(v[`keyEmoji${n}`], defaults[`keyEmoji${n}`]));
    const floats = Array.from({ length: 15 }, (_, index) => emojiEntities(v[`float${index + 1}`], defaults[`float${index + 1}`]));
    const docks = Array.from({ length: 14 }, (_, index) => h(v[`dock${index + 1}`] ?? defaults[`dock${index + 1}`]));

    return LINK_PREFIX + `<div class="ddsh-landon-desktop" style="--lr-wallpaper:url('${cssUrl(v.wallpaper)}');--lr-main:url('${cssUrl(v.mainImage)}');--lr-photo-one:url('${cssUrl(v.photoOne)}');--lr-photo-two:url('${cssUrl(v.photoTwo)}');--lr-photo-three:url('${cssUrl(v.photoThree)}');--lr-avatar:url('${cssUrl(v.avatar)}');--lr-black:#07090c;--lr-deep:#0b0e13;--lr-panel:#11151c;--lr-panel-2:#171c24;--lr-silver:#d9dde3;--lr-soft:#9ca4af;--lr-muted:#727b88;--lr-blue:#7d91aa;--lr-blue-soft:#aab7c8;"><div class="ddsh-landon-menubar"><div class="ddsh-landon-menu-left"><span class="ddsh-landon-apple">●</span><b>Werewolf</b><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></div><div class="ddsh-landon-menu-right"><span>◉</span><span>◐</span><span>⌁</span><span>100%</span><span>&#128267;</span><span>◌</span></div></div><div class="ddsh-landon-wallpaper"></div><div class="ddsh-landon-wallpaper-shade"></div><div class="ddsh-landon-big-name"><span>${h(v.bigName)}</span><small>${h(v.bigSurname)}</small></div><div class="ddsh-landon-finder"><div class="ddsh-landon-window-head"><div class="ddsh-landon-dots"><i></i><i></i><i></i></div><div class="ddsh-landon-finder-title"><span>‹</span><span>›</span><b>Macintosh HD</b></div><div class="ddsh-landon-search">Search</div></div><div class="ddsh-landon-finder-body"><div class="ddsh-landon-sidebar"><small>FAVORITES</small><span>✦ Recents</span><span>☁ iCloud Drive</span><span>⌂ Desktop</span><span>▣ Applications</span><span>▤ Documents</span><span>⬇ Downloads</span><small>LANDON</small><span>♫ Music</span><span>◇ Pictures</span><span>♠ Archive</span></div><div class="ddsh-landon-folders"><div class="ddsh-landon-folder"><i></i><span>Midnight</span></div><div class="ddsh-landon-folder"><i></i><span>Archive</span></div><div class="ddsh-landon-folder"><i></i><span>Memories</span></div><div class="ddsh-landon-folder"><i></i><span>Private</span></div><div class="ddsh-landon-folder"><i></i><span>Photobooth</span></div><div class="ddsh-landon-folder"><i></i><span>Untitled</span></div></div></div></div><div class="ddsh-landon-volume"><span>VOLUME</span><b>&#128266;</b><div class="ddsh-landon-volume-bar"><i></i></div></div><div class="ddsh-landon-photobooth"><div class="ddsh-landon-photo-head"><div class="ddsh-landon-dots"><i></i><i></i><i></i></div><span>Photo Booth</span></div><div class="ddsh-landon-main-photo"><div class="ddsh-landon-main-img"></div><div class="ddsh-landon-photo-text"><small>${h(v.photoSmall)}</small><b>${h(v.photoBig)}</b></div><div class="ddsh-landon-main-sticker one">✦</div><div class="ddsh-landon-main-caption">${h(v.mainCaption)}</div></div><div class="ddsh-landon-photo-controls"><div class="ddsh-landon-mode"><span></span><span class="active"></span><span></span></div><div class="ddsh-landon-camera">◉</div><div class="ddsh-landon-mini-control">◫</div></div></div><div class="ddsh-landon-polaroid ddsh-landon-polaroid-one"><div class="ddsh-landon-polaroid-img one"></div><div class="ddsh-landon-polaroid-caption">LANDON<small>${h(v.polaroidTime)}</small></div></div><div class="ddsh-landon-airdrop"><b>AirDrop</b><span>${h(v.airdropText)}</span><div class="ddsh-landon-airdrop-img"></div><div class="ddsh-landon-airdrop-actions"><span>Decline</span><span>Accept</span></div></div><div class="ddsh-landon-reminder"><b>Reminder</b><span>${h(v.reminderText)}</span><div>Okay</div></div><div class="ddsh-landon-toggle"><span class="active">On</span><span>Off</span></div><div class="ddsh-landon-small-window"><div class="ddsh-landon-small-head"><span>${h(v.smallWindowLetter)}</span><small>Today</small></div><div class="ddsh-landon-small-img"></div><div class="ddsh-landon-small-bottom"><span>◈</span><span>◌</span><span>⌁</span></div></div><div class="ddsh-landon-message"><div class="ddsh-landon-avatar"></div><div><b>UNKNOWN</b><span>you still awake?</span></div></div><div class="ddsh-landon-keyboard ddsh-landon-keyboard-left"><div class="ddsh-landon-key-search">⌕ &nbsp; Search Emoji</div><div class="ddsh-landon-emoji-row"><span>${keyEmojis[0]}</span><span>${keyEmojis[1]}</span><span>${keyEmojis[2]}</span><span>${keyEmojis[3]}</span><span>${keyEmojis[4]}</span><span>${keyEmojis[5]}</span></div><div class="ddsh-landon-keys"><span>q</span><span>w</span><span>e</span><span>r</span><span>t</span><span>y</span><span>u</span><span>i</span><span>o</span><span>p</span><span>a</span><span>s</span><span>d</span><span>f</span><span>g</span><span>h</span><span>j</span><span>k</span><span>l</span><span>z</span><span>x</span><span>c</span><span>v</span><span>b</span><span>n</span><span>m</span></div><div class="ddsh-landon-space">space</div></div><div class="ddsh-landon-keyboard ddsh-landon-keyboard-right"><div class="ddsh-landon-keys"><span>q</span><span>w</span><span>e</span><span>r</span><span>t</span><span>y</span><span>u</span><span>i</span><span>o</span><span>p</span><span>a</span><span>s</span><span>d</span><span>f</span><span>g</span><span>h</span><span>j</span><span>k</span><span>l</span><span>z</span><span>x</span><span>c</span><span>v</span><span>b</span><span>n</span><span>m</span></div><div class="ddsh-landon-space">space</div></div><div class="ddsh-landon-deco-photo"><div class="ddsh-landon-deco-img"></div><span>${h(v.archiveText)}<br>${h(v.archiveNo)}</span></div>${floats.map((emoji, index) => `<span class="ddsh-landon-float e${index + 1}">${emoji}</span>`).join("")}<div class="ddsh-landon-bottom-title"><b>${h(v.bottomWord)}</b><span>${h(v.bottomName)}</span></div><div class="ddsh-landon-dock">${docks.map((symbol) => `<span>${symbol}</span>`).join("")}</div></div><div class="ddshopfz-credit"><span></span></div>`;
  }

  const OFFICIAL_CODE = buildCode(defaults);

  function previewDocument(code) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}.dds-landon-profile-preview-root{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;margin:0 auto}.dds-landon-profile-preview-root>.ddsh-landon-desktop{flex:0 0 auto!important}.dds-landon-profile-preview-root>.ddshopfz-credit{flex:0 0 auto!important;width:100%!important}</style></head><body><div class="dds-landon-profile-preview-root">${code}</div></body></html>`;
  }

  function writeIframe(iframe, code, fit) {
    if (!iframe) return;
    iframe.style.setProperty("width", `${PREVIEW_BOOT_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${PREVIEW_BOOT_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${PREVIEW_BOOT_WIDTH}px`, "important");
    iframe.style.height = "1500px";
    iframe.onload = () => {
      fit?.();
      setTimeout(() => fit?.(), 80);
      setTimeout(() => fit?.(), 260);
      setTimeout(() => fit?.(), 700);
    };
    iframe.srcdoc = previewDocument(code);
  }

  function measureIframe(iframe) {
    try {
      const doc = iframe?.contentDocument;
      if (!doc) return { width: 1040, height: 900 };
      const target = doc.querySelector(".ddsh-landon-desktop");
      const wrapper = doc.querySelector(".dds-landon-profile-preview-root") || doc.body;
      const targetRect = target?.getBoundingClientRect?.();
      const width = Math.max(1, Math.ceil(targetRect?.width || target?.offsetWidth || target?.scrollWidth || 1040));
      const height = Math.max(1, Math.ceil(Math.max(
        wrapper?.scrollHeight || 0,
        wrapper?.getBoundingClientRect?.().height || 0,
        doc.body?.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0
      )));
      return { width, height };
    } catch {
      return { width: 1040, height: 900 };
    }
  }

  function fitHolder(stage, holder, iframe) {
    if (!stage || !holder || !iframe) return;
    const { width, height } = measureIframe(iframe);
    const available = Math.max(260, stage.clientWidth - 48);
    const scale = Math.min(1, available / width);
    holder.style.width = `${Math.ceil(width * scale)}px`;
    holder.style.height = `${Math.ceil(height * scale)}px`;
    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("transform", `scale(${scale})`, "important");
    iframe.style.setProperty("transform-origin", "top left", "important");
  }

  function fitEditorPreview() {
    if (!panel) return;
    fitHolder(panel.querySelector("[data-lr-profile-preview-stage]"), panel.querySelector("[data-lr-profile-preview-holder]"), panel.querySelector("[data-lr-profile-preview]"));
  }

  function fitViewPreview() {
    if (!viewPanel) return;
    fitHolder(viewPanel.querySelector("[data-lr-profile-view-stage]"), viewPanel.querySelector("[data-lr-profile-view-holder]"), viewPanel.querySelector("[data-lr-profile-view-preview]"));
  }

  function fitCardPreview() {
    const iframe = card?.querySelector("[data-lr-profile-card-preview]");
    const stage = iframe?.closest(".dds-roleplay-card-preview");
    if (!iframe || !stage) return;
    const { width, height } = measureIframe(iframe);
    const scale = Math.min(stage.clientWidth / width, stage.clientHeight / height, 0.42);
    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("left", "50%", "important");
    iframe.style.setProperty("top", "50%", "important");
    iframe.style.setProperty("transform", `translate(-50%, -50%) scale(${scale})`, "important");
    iframe.style.setProperty("transform-origin", "center center", "important");
  }

  function updatePreview() {
    if (!panel) return;
    writeIframe(panel.querySelector("[data-lr-profile-preview]"), buildCode(), fitEditorPreview);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 65);
  }

  function setDraftStatus(savedAt) {
    const status = panel?.querySelector("[data-lr-profile-draft-status]");
    if (!status) return;
    status.textContent = savedAt ? `บันทึกล่าสุด ${new Date(savedAt).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "ยังไม่มีแบบร่าง";
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
      setDraftStatus(savedAt);
      showToast("บันทึกแบบร่างโปรไฟล์ Landon แล้ว");
    } catch {
      showToast("บันทึกแบบร่างไม่สำเร็จ");
    }
  }

  function deleteDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setValues(defaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(defaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode();
    try {
      await navigator.clipboard.writeText(code);
      showToast("คัดลอกโค้ดโปรไฟล์ Landon แล้ว");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("คัดลอกโค้ดโปรไฟล์ Landon แล้ว");
    }
  }

  function setCommissionTab() {
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const selected = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-work-panel]").forEach((workPanel) => {
      const selected = workPanel.dataset.workPanel === "commission";
      workPanel.hidden = !selected;
      workPanel.classList.toggle("is-active", selected);
    });
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => item.classList.toggle("is-active", item.dataset.panel === panelName));
    document.querySelectorAll(".dds-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === "commission"));
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function goBack(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const restore = () => {
      document.body.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      document.documentElement.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      showPanel("commission");
      setCommissionTab();
      history.replaceState(null, "", "#commission");
    };
    restore();
    requestAnimationFrame(() => requestAnimationFrame(restore));
    setTimeout(restore, 90);
  }

  function emojiFields(prefix, count, labels) {
    return Array.from({ length: count }, (_, index) => {
      const key = `${prefix}${index + 1}`;
      const example = defaults[key];
      const label = labels?.[index] || `Emoji ${String(index + 1).padStart(2, "0")}`;
      return field(label, key, { placeholder: `Decimal Value เช่น ${example}` });
    }).join("");
  }

  function dockFields() {
    return Array.from({ length: 14 }, (_, index) => {
      const key = `dock${index + 1}`;
      return field(`Dock ${String(index + 1).padStart(2, "0")}`, key, { placeholder: `เช่น ${defaults[key]}` });
    }).join("");
  }

  function createPanel() {
    if (panel?.isConnected) return panel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-lr-profile-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-lr-profile-back type="button">←</button>
        <div><p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p><h1 class="dds-lr-profile-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทโปรไฟล์</span></h1><p>ผู้จ้าง LANDON A. RUTHERFORD — แก้ข้อความ รูป Emoji และ Dock ได้จากเครื่องมือด้านขวา</p></div>
      </div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>LANDON / PROFILE</strong></div>
          <div class="dds-protected-commission-preview-stage dds-lr-profile-preview-stage" data-lr-profile-preview-stage><div class="dds-lr-profile-preview-holder" data-lr-profile-preview-holder><iframe class="dds-protected-commission-preview-frame" data-lr-profile-preview scrolling="no" title="ตัวอย่างโค้ดโปรไฟล์ Landon"></iframe></div></div>
        </div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-lr-profile-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-lr-profile-save>SAVE DRAFT</button><button type="button" data-lr-profile-delete>DELETE SAVE</button></div>
          <div class="dds-protected-commission-scroll dds-lr-profile-commission-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>รูปภาพทั้งหมด</h2></div><div class="dds-form-grid">
              ${field("รูป BG หลัก — --lr-wallpaper", "wallpaper", {full:true,type:"url",placeholder:defaults.wallpaper})}
              ${field("รูปหลัก Photo Booth — --lr-main", "mainImage", {full:true,type:"url",placeholder:defaults.mainImage})}
              ${field("รูป Polaroid / AirDrop — --lr-photo-one", "photoOne", {full:true,type:"url",placeholder:defaults.photoOne})}
              ${field("รูป Small Window — --lr-photo-two", "photoTwo", {full:true,type:"url",placeholder:defaults.photoTwo})}
              ${field("รูป Deco Photo — --lr-photo-three", "photoThree", {full:true,type:"url",placeholder:defaults.photoThree})}
              ${field("รูป Avatar ข้อความ — --lr-avatar", "avatar", {full:true,type:"url",placeholder:defaults.avatar})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>ข้อความ</h2></div><div class="dds-form-grid">
              ${field("landon", "bigName", {placeholder:"เช่น landon"})}
              ${field("A. RUTHERFORD", "bigSurname", {placeholder:"เช่น A. RUTHERFORD"})}
              ${field("somewhere between", "photoSmall", {full:true,placeholder:"เช่น somewhere between"})}
              ${field("midnight & memory", "photoBig", {full:true,placeholder:"เช่น midnight & memory"})}
              ${field("ข้อความ AirDrop", "airdropText", {full:true,placeholder:"เช่น Landon would like to share a photo."})}
              ${field("ตัวอักษรใน Small Window", "smallWindowLetter", {placeholder:"เช่น K"})}
              ${field("ARCHIVE", "archiveText", {placeholder:"เช่น ARCHIVE"})}
              ${field("NO. 07", "archiveNo", {placeholder:"เช่น NO. 07"})}
              ${field("เวลาใต้ Polaroid", "polaroidTime", {placeholder:"เช่น 00:17 AM"})}
              ${field("woof.", "bottomWord", {placeholder:"เช่น woof."})}
              ${field("ชื่อด้านล่าง", "bottomName", {full:true,placeholder:"เช่น LANDON A. RUTHERFORD"})}
              ${field("STAY AFTER DARK", "mainCaption", {full:true,placeholder:"เช่น STAY AFTER DARK"})}
              ${field("ข้อความ Reminder", "reminderText", {full:true,placeholder:"เช่น Don't disappear tonight."})}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>Emoji ใน Search Emoji</h2></div><p class="dds-lr-profile-emoji-help">กรอกเฉพาะเลขจากช่อง <strong>Decimal Value</strong> เช่น <code>127911</code> ถ้ามีหลายค่าให้เว้นวรรค เช่น <code>9939 65039</code> · <a href="https://www.dremendo.com/html-tutorial/html-emoji-codes" target="_blank" rel="noopener noreferrer">เปิดตาราง Emoji ↗</a></p><div class="dds-form-grid dds-lr-profile-emoji-grid">
              ${emojiFields("keyEmoji", 6, ["Emoji Search 01 — ✦", "Emoji Search 02 — ♠", "Emoji Search 03 — ☾", "Emoji Search 04 — 🖤", "Emoji Search 05 — ⚓️", "Emoji Search 06 — 🎧"])}
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>Emoji ลอยรอบโค้ด</h2></div><p class="dds-lr-profile-emoji-help">แก้ Emoji ลอยทั้ง 15 จุดด้วย Decimal Value โดย <strong>VOLUME ถูกล็อกไว้ตามต้นฉบับ</strong></p><div class="dds-form-grid dds-lr-profile-emoji-grid">${emojiFields("float", 15)}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>Dock symbols</h2></div><p class="dds-lr-profile-emoji-help">แก้สัญลักษณ์ใน Dock ได้ทุกช่อง ตัวอย่างเดิมแสดงอยู่ใน placeholder</p><div class="dds-form-grid dds-lr-profile-dock-grid">${dockFields()}</div></section>
          </div>
          <section class="dds-protected-commission-copy dds-lr-profile-commission-copy"><div class="dds-control-title"><span>06</span><h2>คัดลอกโค้ด</h2></div><p>กด COPY CODE เพื่อคัดลอก HTML โปรไฟล์ที่แก้ไขเสร็จแล้ว</p><div class="dds-protected-commission-copy-actions"><button type="button" data-lr-profile-copy>COPY CODE <span>↗</span></button><button type="button" data-lr-profile-reset>RESET</button></div></section>
        </div>
      </div>`;

    footer.before(panel);
    panel.querySelector("[data-lr-profile-back]")?.addEventListener("click", goBack);
    panel.addEventListener("input", schedulePreview);
    panel.addEventListener("change", schedulePreview);
    panel.querySelector("[data-lr-profile-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-lr-profile-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-lr-profile-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-lr-profile-reset]")?.addEventListener("click", resetFields);
    return panel;
  }

  function createViewPanel() {
    if (viewPanel?.isConnected) return viewPanel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;
    viewPanel = document.createElement("section");
    viewPanel.className = "dds-panel dds-commission-view-panel dds-lr-profile-view-panel";
    viewPanel.dataset.panel = VIEW_PANEL_NAME;
    viewPanel.innerHTML = `<div class="dds-commission-view-toolbar"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-lr-profile-view-back type="button">←</button></div><div class="dds-lr-profile-view-stage" data-lr-profile-view-stage><div class="dds-lr-profile-view-holder" data-lr-profile-view-holder><iframe class="dds-editor-preview-frame dds-lr-profile-view-frame" data-lr-profile-view-preview scrolling="no" title="งานคอมมิชชั่นโค้ดประเภทโปรไฟล์ Landon A. Rutherford"></iframe></div></div>`;
    footer.before(viewPanel);
    viewPanel.querySelector("[data-lr-profile-view-back]")?.addEventListener("click", goBack);
    return viewPanel;
  }

  function openView() {
    const target = createViewPanel();
    if (!target) return;
    document.body.classList.add("dds-editor-mode");
    document.documentElement.classList.add("dds-editor-mode");
    showPanel(VIEW_PANEL_NAME);
    history.replaceState(null, "", "#commission-landon-profile-view");
    writeIframe(target.querySelector("[data-lr-profile-view-preview]"), OFFICIAL_CODE, fitViewPreview);
    requestAnimationFrame(() => {
      document.body.classList.add("dds-editor-mode");
      document.documentElement.classList.add("dds-editor-mode");
      fitViewPreview();
    });
  }

  function openEditor() {
    const editor = createPanel();
    if (!editor) return;
    const draft = getDraft();
    setValues(draft?.values || defaults);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    history.replaceState(null, "", "#commission-landon-profile-editor");
    updatePreview();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("dds-modal-open");
  }

  function createModal() {
    if (modal?.isConnected) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.id = "ddsLandonDesktopProfileLockModal";
    modal.hidden = true;
    modal.innerHTML = `<form class="dds-commission-lock-dialog" data-lr-profile-lock-form><small>CLIENT ACCESS / LANDON A. RUTHERFORD</small><h2>Protected editor</h2><p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" data-lr-profile-lock-input placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" data-lr-profile-lock-error aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-lr-profile-lock-close>CANCEL</button></div></form>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-lr-profile-lock-close]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.querySelector("[data-lr-profile-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-lr-profile-lock-input]");
      const error = modal.querySelector("[data-lr-profile-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;
      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";
      try {
        if (await sha256(input.value || "") === ACCESS_HASH) {
          sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
          error.textContent = "";
          closeModal();
          openEditor();
        } else {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
        }
      } catch {
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });
    return modal;
  }

  function openModal() {
    const lock = createModal();
    lock.hidden = false;
    document.body.classList.add("dds-modal-open");
    const input = lock.querySelector("[data-lr-profile-lock-input]");
    const error = lock.querySelector("[data-lr-profile-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    requestAnimationFrame(() => input?.focus());
  }

  function installCard() {
    if (card?.isConnected) return true;
    const grid = document.querySelector('[data-work-panel="commission"] .dds-commission-grid') || document.querySelector(".dds-commission-grid");
    if (!grid) return false;
    if (grid.querySelector(".dds-lr-profile-commission-card")) return true;

    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-commission-card dds-lr-profile-commission-card";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-lr-profile-card-preview-frame" data-lr-profile-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น Profile Landon"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดประเภทโปรไฟล์</p><p class="dds-commission-card-client">ผู้จ้าง <strong>LANDON A. RUTHERFORD</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-lr-profile-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-lr-profile-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;
    grid.appendChild(card);
    card.querySelector("[data-lr-profile-view]")?.addEventListener("click", openView);
    card.querySelector("[data-lr-profile-edit]")?.addEventListener("click", () => sessionStorage.getItem(ACCESS_SESSION_KEY) === "1" ? openEditor() : openModal());

    const cardPreview = card.querySelector("[data-lr-profile-card-preview]");
    const renderCard = () => {
      if (cardRendered || !cardPreview) return;
      cardRendered = true;
      writeIframe(cardPreview, OFFICIAL_CODE, fitCardPreview);
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        renderCard();
      }, { rootMargin: "420px 0px" });
      observer.observe(card);
    } else renderCard();
    return true;
  }

  function install() {
    createModal();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 80) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      fitCardPreview();
      fitEditorPreview();
      fitViewPreview();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();


/* =========================================================
   HANS X. FROST — ROLEPLAY COMMISSION EDITOR
   แก้สี, ชื่อ, HEAD / BOX, ตำแหน่งรูป, ข้อความ Crabby Fairy, Did you know..., โรลเพลย์แบบ BBCode และหมายเหตุ
   BARCODE ถูกล็อกไว้ตามต้นฉบับ
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_HANS_ROLEPLAY_COMMISSION_INSTALLED__) return;
  window.__DDS_HANS_ROLEPLAY_COMMISSION_INSTALLED__ = true;

  const PANEL_NAME = "editor-commission-hans-roleplay";
  const VIEW_PANEL_NAME = "view-commission-hans-roleplay";
  const DRAFT_KEY = "dds:commission-draft:hans:roleplay:structured-v6";
  const STYLESHEET_URL = "https://guindaeyo.github.io/css/commit-hansxcodrole.css";
  const FONT_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";
  const CANVAS_WIDTH = 770;
  const BARCODE_URL = "https://i.postimg.cc/kXCjW5Ws/bc.png";

  const defaults = Object.freeze({
    bgColor: "#b4e7f1",
    textColor: "#000000",
    headImage: "https://i.postimg.cc/ZYdgrg2R/image.jpg",
    boxImage: "https://i.postimg.cc/ZqWjJvhN/box.png",
    headX: "50",
    headY: "50",
    boxX: "50",
    boxY: "50",
    firstName: "Hans",
    lastName: "Xilvalur Frost",
    burstText: "Crabby\nFairy",
    title: "Did you know...",
    roleplay: "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
    note: "หมายเหตุ herb"
  });

  const editorDefaults = Object.freeze({
    bgColor: defaults.bgColor,
    textColor: defaults.textColor,
    headImage: "",
    boxImage: "https://i.postimg.cc/ZqWjJvhN/box.png",
    headX: "50",
    headY: "50",
    boxX: "50",
    boxY: "50",
    firstName: "",
    lastName: "",
    burstText: "",
    title: "",
    roleplay: "",
    note: ""
  });

  let panel = null;
  let viewPanel = null;
  let card = null;
  let previewTimer = 0;
  let cardRendered = false;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssUrl(value) {
    return String(value || "").replace(/[\\'\r\n]/g, (char) => ({"\\":"\\\\", "'":"\\'", "\r":"", "\n":""}[char] ?? ""));
  }

  function clampPosition(value, fallback = 50) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback;
  }

  function normalizeColor(value, fallback) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
  }

  function bbcodeToPreviewHtml(value) {
    let text = h(value || "").replace(/\r\n?/g, "\n");

    const renderList = (source, ordered) => {
      const pattern = ordered
        ? /\[list=1\]([\s\S]*?)\[\/list\]/gi
        : /\[list\](?!\s*=)([\s\S]*?)\[\/list\]/gi;
      const tag = ordered ? "ol" : "ul";
      return source.replace(pattern, (_match, body) => {
        const items = String(body || "")
          .split(/\[\*\]/i)
          .slice(1)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `<li>${item}</li>`)
          .join("");
        return items ? `<${tag} style="margin:10px 0;padding-left:24px">${items}</${tag}>` : "";
      });
    };

    text = renderList(text, true);
    text = renderList(text, false);

    text = text
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=small\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:.82em">$1</span>')
      .replace(/\[size=medium\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1em">$1</span>')
      .replace(/\[size=large\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1.28em">$1</span>')
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[img\]([^\[]+)\[\/img\]/gi, '<img src="$1" alt="" style="display:block;max-width:100%;height:auto;margin:10px auto">')
      .replace(/\[video=youtube\]([^\[]+)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">▶ YouTube</a>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<span class="dds-hans-bbcode-block">$1</span>')
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="dds-hans-bbcode-block">$1</code>')
      .replace(/\[(hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi, '<span class="dds-hans-bbcode-block">$2</span>')
      .replace(/\[hr\]/gi, '<hr style="margin:14px 0;border:0;border-top:1px solid currentColor;opacity:.25">')
      .replace(/\n/g, "<br>");

    return text;
  }

  function roleToHtml(value, previewMode = false) {
    return previewMode ? bbcodeToPreviewHtml(value) : h(value || "");
  }

  function removeBbcodeForWordCount(value) {
    return String(value || "")
      .replace(/\[url=[^\]]*\]/gi, " ")
      .replace(/\[\/?(?:b|i|u|s|quote|code|hide|spoiler|color|size|align|url|img|video|list)(?:=[^\]]*)?\]/gi, " ")
      .replace(/\[\*\]|\[hr\]/gi, " ")
      .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countRoleplayWords(value) {
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

    const words = clean.match(/[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g);
    return words ? words.length : 0;
  }

  function updateRoleplayWordCounter() {
    const textarea = panel?.querySelector('[data-hans-field="roleplay"]');
    const counter = panel?.querySelector("[data-hans-word-counter]");
    if (!textarea || !counter) return;
    const count = countRoleplayWords(textarea.value);
    const number = counter.querySelector("[data-hans-word-count-number]");
    if (number) number.textContent = count.toLocaleString("th-TH");
    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function replaceTextareaSelection(target, replacement, caretOffset = null) {
    if (!target) return;
    const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
    const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
    target.setRangeText(replacement, start, end, "end");
    if (Number.isInteger(caretOffset)) {
      const caret = start + caretOffset;
      target.setSelectionRange(caret, caret);
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
  }

  function wrapHansTag(target, openTag, closeTag) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const replacement = `${openTag}${selected}${closeTag}`;
    replaceTextareaSelection(target, replacement, selected ? replacement.length : openTag.length);
  }

  function applyHansList(target, ordered) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const lines = selected.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const openTag = ordered ? "[list=1]" : "[list]";
    const body = lines.length ? lines.map((line) => `[*]${line}`).join("\n") : "[*]";
    const replacement = `${openTag}\n${body}\n[/list]`;
    replaceTextareaSelection(target, replacement, lines.length ? replacement.length : openTag.length + 4);
  }

  function applyHansBbcode(target, action, toolbar) {
    if (!target) return;
    if (["b", "i", "u", "s", "quote", "code", "hide", "spoiler"].includes(action)) {
      wrapHansTag(target, `[${action}]`, `[/${action}]`);
      return;
    }

    const wrappers = {
      "size-small": ["[size=small]", "[/size]"],
      "size-medium": ["[size=medium]", "[/size]"],
      "size-large": ["[size=large]", "[/size]"],
      "align-left": ["[align=left]", "[/align]"],
      "align-center": ["[align=center]", "[/align]"],
      "align-right": ["[align=right]", "[/align]"],
      "align-justify": ["[align=justify]", "[/align]"]
    };
    if (wrappers[action]) {
      wrapHansTag(target, wrappers[action][0], wrappers[action][1]);
      return;
    }

    if (action === "color") {
      const color = toolbar?.querySelector("[data-hans-bbcode-color]")?.value || "#000000";
      wrapHansTag(target, `[color=${color}]`, "[/color]");
      return;
    }

    if (action === "url") {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      const selected = target.value.slice(start, end);
      const url = window.prompt("ใส่ลิงก์ URL", /^https?:\/\//i.test(selected) ? selected : "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[url=${url}]${selected || url}[/url]`);
      return;
    }

    if (action === "img") {
      const url = window.prompt("ใส่ลิงก์รูปภาพ", "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[img]${url}[/img]`);
      return;
    }

    if (action === "video") {
      const url = window.prompt("ใส่ลิงก์ YouTube", "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[video=youtube]${url}[/video]`);
      return;
    }

    if (action === "list") { applyHansList(target, false); return; }
    if (action === "list-1") { applyHansList(target, true); return; }
    if (action === "list-item") { replaceTextareaSelection(target, `[*]${target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0)}`); return; }
    if (action === "hr") { replaceTextareaSelection(target, "[hr]"); return; }

    if (action === "clear") {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      if (start === end) {
        showToast("คลุมข้อความที่ต้องการล้าง BBCode ก่อน");
        return;
      }
      const selected = target.value.slice(start, end).replace(/\[[^\]]*\]/g, "");
      replaceTextareaSelection(target, selected);
    }
  }

  function hansBbcodeToolbar() {
    return `<div class="dds-rich-toolbar dds-bbcode-toolbar dds-hans-bbcode-toolbar" data-hans-bbcode-toolbar>
      <div class="dds-bbcode-group" aria-label="รูปแบบตัวอักษร">
        <button type="button" data-hans-bbcode="b" title="ตัวหนา [b]" aria-label="ตัวหนา"><b>B</b></button>
        <button type="button" data-hans-bbcode="i" title="ตัวเอียง [i]" aria-label="ตัวเอียง"><i>I</i></button>
        <button type="button" data-hans-bbcode="u" title="ขีดเส้นใต้ [u]" aria-label="ขีดเส้นใต้"><u>U</u></button>
        <button type="button" data-hans-bbcode="s" title="ขีดฆ่า [s]" aria-label="ขีดฆ่า"><s>S</s></button>
      </div>
      <div class="dds-bbcode-group" aria-label="สีและขนาด">
        <label class="dds-bbcode-color" title="สีตัวอักษร [color]"><span>A</span><input type="color" data-hans-bbcode-color value="#8f0e16" aria-label="เลือกสีตัวอักษร"></label>
        <button type="button" data-hans-bbcode="size-small" title="ตัวอักษรเล็ก [size=small]">A−</button>
        <button type="button" data-hans-bbcode="size-medium" title="ตัวอักษรกลาง [size=medium]">A</button>
        <button type="button" data-hans-bbcode="size-large" title="ตัวอักษรใหญ่ [size=large]">A+</button>
      </div>
      <div class="dds-bbcode-group" aria-label="จัดตำแหน่ง">
        <button type="button" data-hans-bbcode="align-left" title="ชิดซ้าย [align=left]">⇤</button>
        <button type="button" data-hans-bbcode="align-center" title="กึ่งกลาง [align=center]">↔</button>
        <button type="button" data-hans-bbcode="align-right" title="ชิดขวา [align=right]">⇥</button>
        <button type="button" data-hans-bbcode="align-justify" title="เต็มบรรทัด [align=justify]">☰</button>
      </div>
      <div class="dds-bbcode-group" aria-label="ลิงก์และสื่อ">
        <button type="button" data-hans-bbcode="url" title="ลิงก์ [url=]">🔗</button>
        <button type="button" data-hans-bbcode="img" title="รูปภาพ [img]">▣</button>
        <button type="button" data-hans-bbcode="video" title="YouTube [video=youtube]">▶</button>
      </div>
      <div class="dds-bbcode-group" aria-label="กล่องข้อความ">
        <button type="button" data-hans-bbcode="quote" title="คำพูดอ้างอิง [quote]">❝</button>
        <button type="button" data-hans-bbcode="code" title="โค้ด [code]">&lt;/&gt;</button>
        <button type="button" data-hans-bbcode="hide" title="ซ่อนข้อความ [hide]">◉</button>
        <button type="button" data-hans-bbcode="spoiler" title="สปอยล์ [spoiler]">▤</button>
      </div>
      <div class="dds-bbcode-group" aria-label="รายการ">
        <button type="button" data-hans-bbcode="list" title="รายการจุด [list]">•≡</button>
        <button type="button" data-hans-bbcode="list-1" title="รายการตัวเลข [list=1]">1≡</button>
        <button type="button" data-hans-bbcode="list-item" title="รายการย่อย [*]">[*]</button>
      </div>
      <div class="dds-bbcode-group" aria-label="เครื่องมืออื่น">
        <button type="button" data-hans-bbcode="hr" title="เส้นคั่น [hr]">―</button>
        <button type="button" data-hans-bbcode="clear" title="ล้าง BBCode จากข้อความที่เลือก">CLEAR</button>
      </div>
    </div>`;
  }

  function getValues() {
    const values = { ...defaults };
    if (!panel) return values;
    panel.querySelectorAll("[data-hans-field]").forEach((input) => {
      values[input.dataset.hansField] = input.value;
    });
    return values;
  }

  function updateRangeOutputs() {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-output]").forEach((output) => {
      const input = panel.querySelector(`[data-hans-field="${output.dataset.hansOutput}"]`);
      if (input) output.textContent = `${input.value}%`;
    });
  }

  function syncColorPickers() {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-color-picker]").forEach((picker) => {
      const key = picker.dataset.hansColorPicker;
      const input = panel.querySelector(`[data-hans-field="${key}"]`);
      if (!input) return;
      const fallback = key === "bgColor" ? defaults.bgColor : defaults.textColor;
      const normalized = normalizeColor(input.value, fallback);
      if (picker.value.toLowerCase() !== normalized.toLowerCase()) picker.value = normalized;
    });
  }

  function setValues(values = {}) {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-field]").forEach((input) => {
      const key = input.dataset.hansField;
      input.value = values[key] ?? defaults[key] ?? "";
    });
    syncColorPickers();
    updateRangeOutputs();
    updateRoleplayWordCounter();
  }

  function buildCode(values = getValues(), previewMode = false) {
    const v = { ...defaults, ...values };
    const bg = normalizeColor(v.bgColor, defaults.bgColor);
    const color = normalizeColor(v.textColor, defaults.textColor);
    const headX = clampPosition(v.headX);
    const headY = clampPosition(v.headY);
    const boxX = clampPosition(v.boxX);
    const boxY = clampPosition(v.boxY);

    return `<link href="${STYLESHEET_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_STYLESHEET_URL}" rel="stylesheet"><div class="ddsh-hxf" style="--ddsh-hxf-bg:${bg};--ddsh-hxf-color:${color};--ddsh-hxf-head:url('${cssUrl(v.headImage)}');--ddsh-hxf-box:url('${cssUrl(v.boxImage)}');--ddsh-hxf-barcode:url('${BARCODE_URL}');--ddsh-hxf-head-x:${headX}%;--ddsh-hxf-head-y:${headY}%;--ddsh-hxf-burst-text-x:-5px;"><div class="ddsh-hxf-core"><div class="ddsh-hxf-name"><span class="ddsh-hxf-name-first">${h(v.firstName)}</span><span class="ddsh-hxf-name-last">${h(v.lastName)}</span></div><div class="ddsh-hxf-photo" style="background-position:${headX}% ${headY}%"><div class="ddsh-hxf-burst" style="background-position:${boxX}% ${boxY}%"><div class="ddsh-hxf-burst-text">${h(v.burstText).replace(/\r?\n/g, "<br>")}</div></div><div class="ddsh-hxf-side ddsh-hxf-side-top">Pine Woods Rd.</div><div class="ddsh-hxf-side ddsh-hxf-side-bottom">ISSUE 01</div></div><div class="ddsh-hxf-title">${h(v.title)}</div><div class="ddsh-hxf-role">${roleToHtml(v.roleplay, previewMode)}</div><div class="ddsh-hxf-bottom"><div class="ddsh-hxf-note"><strong>${h(v.note)}</strong></div><div class="ddsh-hxf-barcode"></div></div></div></div><div class="ddshopfz-credit"><span></span></div>`;
  }

  const OFFICIAL_CODE = buildCode(defaults, false);

  function previewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}.dds-hans-preview-root{width:${CANVAS_WIDTH}px;min-width:${CANVAS_WIDTH}px;max-width:${CANVAS_WIDTH}px;display:flex;flex-direction:column;align-items:center;margin:0 auto}.dds-hans-preview-root>.ddsh-hxf{flex:0 0 auto!important}.dds-hans-preview-root>.ddshopfz-credit{flex:0 0 auto!important;width:100%!important}</style></head><body><div class="dds-hans-preview-root">${code}</div></body></html>`;
  }

  function measureIframe(iframe) {
    try {
      const doc = iframe?.contentDocument;
      const root = doc?.querySelector(".dds-hans-preview-root");
      if (!doc || !root) return { width: CANVAS_WIDTH, height: 900 };
      const width = Math.max(1, Math.ceil(root.scrollWidth || root.getBoundingClientRect().width || CANVAS_WIDTH));
      const height = Math.max(1, Math.ceil(root.scrollHeight || root.getBoundingClientRect().height || 900));
      return { width, height };
    } catch {
      return { width: CANVAS_WIDTH, height: 900 };
    }
  }

  function writeIframe(iframe, code, fit) {
    if (!iframe) return;
    iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("height", "1200px", "important");
    iframe.onload = () => {
      fit?.();
      setTimeout(() => fit?.(), 90);
      setTimeout(() => fit?.(), 280);
      setTimeout(() => fit?.(), 750);
    };
    iframe.srcdoc = previewDocument(code);
  }

  function fitHolder(stage, holder, iframe) {
    if (!stage || !holder || !iframe) return;
    const { width, height } = measureIframe(iframe);
    const available = Math.max(260, stage.clientWidth - 48);
    const scale = Math.min(1, available / width);
    holder.style.width = `${Math.ceil(width * scale)}px`;
    holder.style.height = `${Math.ceil(height * scale)}px`;
    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("transform", `scale(${scale})`, "important");
    iframe.style.setProperty("transform-origin", "top left", "important");
  }

  function fitEditorPreview() {
    if (!panel) return;
    fitHolder(panel.querySelector("[data-hans-preview-stage]"), panel.querySelector("[data-hans-preview-holder]"), panel.querySelector("[data-hans-preview]"));
  }

  function fitViewPreview() {
    if (!viewPanel) return;
    fitHolder(viewPanel.querySelector("[data-hans-view-stage]"), viewPanel.querySelector("[data-hans-view-holder]"), viewPanel.querySelector("[data-hans-view-preview]"));
  }

  function fitCardPreview() {
    const iframe = card?.querySelector("[data-hans-card-preview]");
    const stage = iframe?.closest(".dds-roleplay-card-preview");
    if (!iframe || !stage) return;

    const { width, height } = measureIframe(iframe);
    const padding = 18;
    const availableWidth = Math.max(1, stage.clientWidth - padding * 2);
    const availableHeight = Math.max(1, stage.clientHeight - padding * 2);
    const scale = Math.min(1, availableWidth / width, availableHeight / height);
    const safeScale = Math.max(0.05, scale);

    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("left", "50%", "important");
    iframe.style.setProperty("top", "50%", "important");
    iframe.style.setProperty("transform", `translate(-50%, -50%) scale(${safeScale})`, "important");
    iframe.style.setProperty("transform-origin", "center center", "important");
  }

  function showToast(message) {
    if (typeof window.showToast === "function") return window.showToast(message);
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast.__ddsHansTimer);
    toast.__ddsHansTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function setDraftStatus(savedAt = 0) {
    const status = panel?.querySelector("[data-hans-draft-status]");
    if (!status) return;
    if (!savedAt) {
      status.textContent = "ยังไม่มีแบบร่าง";
      return;
    }
    try {
      status.textContent = `บันทึกล่าสุด ${new Date(savedAt).toLocaleString("th-TH")}`;
    } catch {
      status.textContent = "มีแบบร่างที่บันทึกไว้";
    }
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
      setDraftStatus(savedAt);
      showToast("บันทึกแบบร่าง Hans แล้ว");
    } catch {
      showToast("บันทึกแบบร่างไม่สำเร็จ");
    }
  }

  function deleteDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setValues(editorDefaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(editorDefaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("คัดลอกโค้ดโรลเพลย์ Hans แล้ว");
  }

  function setCommissionTab() {
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const selected = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-work-panel]").forEach((workPanel) => {
      const selected = workPanel.dataset.workPanel === "commission";
      workPanel.hidden = !selected;
      workPanel.classList.toggle("is-active", selected);
    });
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => item.classList.toggle("is-active", item.dataset.panel === panelName));
    document.querySelectorAll(".dds-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === "commission"));
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function enableEditorMode() {
    document.body.classList.add("dds-editor-mode", "dds-commission-editor-mode");
    document.documentElement.classList.add("dds-editor-mode", "dds-commission-editor-mode");
  }

  function goBack(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const restore = () => {
      document.body.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      document.documentElement.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      showPanel("commission");
      setCommissionTab();
      history.replaceState(null, "", "#commission");
    };
    restore();
    requestAnimationFrame(() => requestAnimationFrame(restore));
    setTimeout(restore, 80);
  }

  function updatePreview() {
    if (!panel) return;
    syncColorPickers();
    updateRangeOutputs();
    writeIframe(panel.querySelector("[data-hans-preview]"), buildCode(getValues(), true), fitEditorPreview);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 55);
  }

  function colorField(label, key) {
    return `<label class="dds-color-field dds-hans-color-field"><span>${h(label)}</span><div><input type="color" data-hans-color-picker="${h(key)}" value="${h(defaults[key])}"><input type="text" data-hans-field="${h(key)}" value="${h(defaults[key])}" spellcheck="false"></div></label>`;
  }

  function positionEditor(prefix, title) {
    return `<div class="dds-image-position dds-field-full dds-hans-position"><div class="dds-image-position-heading"><span>${h(title)}</span><small>ปรับซ้าย–ขวา และบน–ล่าง</small></div><label class="dds-position-row"><span>แนวนอน</span><small>ซ้าย</small><input data-hans-field="${prefix}X" min="0" max="100" type="range" value="50"><small>ขวา</small><output data-hans-output="${prefix}X">50%</output></label><label class="dds-position-row"><span>แนวตั้ง</span><small>บน</small><input data-hans-field="${prefix}Y" min="0" max="100" type="range" value="50"><small>ล่าง</small><output data-hans-output="${prefix}Y">50%</output></label></div>`;
  }

  function createPanel() {
    if (panel?.isConnected) return panel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-hans-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-hans-back type="button">←</button>
        <div><p class="dds-eyebrow">COMMISSION EDITOR</p><h1 class="dds-hans-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทโรลเพลย์</span></h1><p>ผู้จ้าง HANS X. FROST — สำหรับโรลเพลย์ภายใน Pine Woods Rd. No.7</p></div>
      </div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>HANS X. FROST / ROLEPLAY</strong></div>
          <div class="dds-protected-commission-preview-stage dds-hans-preview-stage" data-hans-preview-stage><div class="dds-hans-preview-holder" data-hans-preview-holder><iframe class="dds-protected-commission-preview-frame" data-hans-preview scrolling="no" title="ตัวอย่างโค้ดโรลเพลย์ Hans X. Frost"></iframe></div></div>
        </div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-hans-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-hans-save>SAVE DRAFT</button><button type="button" data-hans-delete>DELETE SAVE</button></div>
          <div class="dds-protected-commission-scroll dds-hans-commission-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโค้ด</h2></div><div class="dds-color-grid">${colorField("สีพื้นหลัง — --ddsh-hxf-bg", "bgColor")}${colorField("สีตัวอักษร — --ddsh-hxf-color", "textColor")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>ชื่อ</h2></div><div class="dds-form-grid">
              <label class="dds-field"><span>ชื่อด้านบน</span><input type="text" data-hans-field="firstName" value=""></label>
              <label class="dds-field"><span>ชื่อกลาง–นามสกุลด้านล่าง</span><input type="text" data-hans-field="lastName" value=""></label>
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>รูป HEAD / BOX</h2></div><div class="dds-form-grid">
              <label class="dds-field dds-field-full"><span>ลิงก์รูป HEAD</span><input type="url" data-hans-field="headImage" value="" spellcheck="false"></label>
              ${positionEditor("head", "ตำแหน่งรูป HEAD")}
              <label class="dds-field dds-field-full"><span>ลิงก์รูป BOX (สามารถแก้ไขลิ้งค์ได้)</span><input type="url" data-hans-field="boxImage" value="https://i.postimg.cc/ZqWjJvhN/box.png" spellcheck="false"></label>
              ${positionEditor("box", "ตำแหน่งรูป BOX")}
              <div class="dds-hans-barcode-lock dds-field-full"><span>BARCODE</span><strong>LOCKED</strong><small>ใช้รูปต้นฉบับเดิมและไม่มีช่องแก้ไข</small></div>
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>หัวข้อและข้อความ BOX</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความใน BOX</span><textarea data-hans-field="burstText" rows="2"></textarea></label><label class="dds-field dds-field-full"><span>หัวข้อ</span><input type="text" data-hans-field="title" value=""></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>เนื้อหาโรลเพลย์</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full dds-hans-roleplay-field"><span>ข้อความโรลเพลย์</span>${hansBbcodeToolbar()}<textarea data-hans-field="roleplay" rows="14"></textarea><div class="dds-word-counter" data-hans-word-counter data-empty="true"><span class="dds-word-counter-label">จำนวนคำ</span><strong><span data-hans-word-count-number>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>06</span><h2>หมายเหตุ</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความหมายเหตุ</span><input type="text" data-hans-field="note" value=""></label></div></section>
          </div>
          <section class="dds-protected-commission-copy dds-hans-commission-copy"><div class="dds-control-title"><span>07</span><h2>คัดลอกโค้ด</h2></div><p>กด COPY CODE เพื่อคัดลอก HTML ที่แก้ไขเสร็จแล้ว โดย BARCODE จะติดไปเป็นรูปต้นฉบับอัตโนมัติ</p><div class="dds-protected-commission-copy-actions"><button type="button" data-hans-copy>COPY CODE <span>↗</span></button><button type="button" data-hans-reset>RESET</button></div></section>
        </div>
      </div>`;

    footer.before(panel);
    panel.querySelector("[data-hans-back]")?.addEventListener("click", goBack);
    panel.addEventListener("input", (event) => {
      const picker = event.target.closest?.("[data-hans-color-picker]");
      if (picker) {
        const input = panel.querySelector(`[data-hans-field="${picker.dataset.hansColorPicker}"]`);
        if (input) input.value = picker.value;
      }
      if (event.target.matches?.('[data-hans-field="roleplay"]')) updateRoleplayWordCounter();
      schedulePreview();
    });
    panel.addEventListener("change", (event) => {
      const color = event.target.closest?.("[data-hans-bbcode-color]");
      if (color) {
        const textarea = panel.querySelector('[data-hans-field="roleplay"]');
        applyHansBbcode(textarea, "color", color.closest("[data-hans-bbcode-toolbar]"));
        return;
      }
      schedulePreview();
    });

    const hansToolbar = panel.querySelector("[data-hans-bbcode-toolbar]");
    hansToolbar?.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    hansToolbar?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-hans-bbcode]");
      if (!button) return;
      const textarea = panel.querySelector('[data-hans-field="roleplay"]');
      applyHansBbcode(textarea, button.dataset.hansBbcode, hansToolbar);
    });
    panel.querySelector("[data-hans-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-hans-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-hans-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-hans-reset]")?.addEventListener("click", resetFields);
    return panel;
  }

  function createViewPanel() {
    if (viewPanel?.isConnected) return viewPanel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;
    viewPanel = document.createElement("section");
    viewPanel.className = "dds-panel dds-commission-view-panel dds-hans-view-panel";
    viewPanel.dataset.panel = VIEW_PANEL_NAME;
    viewPanel.innerHTML = `<div class="dds-commission-view-toolbar"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-hans-view-back type="button">←</button></div><div class="dds-hans-view-stage" data-hans-view-stage><div class="dds-hans-view-holder" data-hans-view-holder><iframe class="dds-editor-preview-frame dds-hans-view-frame" data-hans-view-preview scrolling="no" title="งานคอมมิชชั่นโค้ดประเภทโรลเพลย์ Hans X. Frost"></iframe></div></div>`;
    footer.before(viewPanel);
    viewPanel.querySelector("[data-hans-view-back]")?.addEventListener("click", goBack);
    return viewPanel;
  }

  function openView() {
    const target = createViewPanel();
    if (!target) return;
    enableEditorMode();
    showPanel(VIEW_PANEL_NAME);
    history.replaceState(null, "", "#commission-hans-roleplay-view");
    writeIframe(target.querySelector("[data-hans-view-preview]"), OFFICIAL_CODE, fitViewPreview);
  }

  function openEditor() {
    const editor = createPanel();
    if (!editor) return;
    enableEditorMode();
    const draft = getDraft();
    const editorValues = draft?.values
      ? { ...editorDefaults, ...draft.values, boxImage: draft.values.boxImage || editorDefaults.boxImage }
      : editorDefaults;
    setValues(editorValues);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    history.replaceState(null, "", "#commission-hans-roleplay-editor");
    updatePreview();
  }

  function installCard() {
    if (card?.isConnected) return true;
    const grid = document.querySelector('[data-work-panel="commission"] .dds-commission-grid') || document.querySelector(".dds-commission-grid");
    if (!grid) return false;
    if (grid.querySelector(".dds-hans-roleplay-commission-card")) return true;

    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-commission-card dds-hans-roleplay-commission-card";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-hans-card-preview-frame" data-hans-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น Roleplay Hans X. Frost"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดประเภทโรลเพลย์<br><span class="dds-hans-commission-card-subtype">(สำหรับโรลเพลย์ภายใน Pine Woods Rd. No.7)</span></p><p class="dds-commission-card-client">ผู้จ้าง <strong>HANS X. FROST</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-hans-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-hans-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;
    grid.appendChild(card);
    card.querySelector("[data-hans-view]")?.addEventListener("click", openView);
    card.querySelector("[data-hans-edit]")?.addEventListener("click", openEditor);

    const cardPreview = card.querySelector("[data-hans-card-preview]");
    const renderCard = () => {
      if (cardRendered || !cardPreview) return;
      cardRendered = true;
      writeIframe(cardPreview, OFFICIAL_CODE, fitCardPreview);
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        renderCard();
      }, { rootMargin: "420px 0px" });
      observer.observe(card);
    } else renderCard();
    return true;
  }

  function install() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 100) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      fitCardPreview();
      fitEditorPreview();
      fitViewPreview();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();


/* =========================================================
   HANS X. FROST — SOLO ROLEPLAY COMMISSION EDITOR
   สำหรับฮันส์คนเดียว — แก้สี, ชื่อ, HEAD / BOX, ตำแหน่งรูป, ข้อความ BOX, หัวข้อ, โรลเพลย์แบบ BBCode และหมายเหตุ
   BARCODE ถูกล็อกไว้ตามต้นฉบับ / Editor protected
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_HANS_SOLO_ROLEPLAY_COMMISSION_INSTALLED__) return;
  window.__DDS_HANS_SOLO_ROLEPLAY_COMMISSION_INSTALLED__ = true;

  const PANEL_NAME = "editor-commission-hans-solo-roleplay";
  const VIEW_PANEL_NAME = "view-commission-hans-solo-roleplay";
  const DRAFT_KEY = "dds:commission-draft:hans:solo-roleplay:structured-v2";
  const STYLESHEET_URL = "https://guindaeyo.github.io/css/commit-hansxcodrole.css";
  const FONT_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap";
  const CANVAS_WIDTH = 770;
  const BARCODE_URL = "https://i.postimg.cc/kXCjW5Ws/bc.png";
  const ACCESS_HASH = "944c0533242b363788a46eae05b982069f17724030ca780af603d478b4d461e9";
  const ACCESS_SESSION_KEY = "dds:hans-solo-roleplay-editor:unlocked";

  const defaults = Object.freeze({
    bgColor: "#b4e7f1",
    textColor: "#000000",
    headImage: "https://i.postimg.cc/ZYdgrg2R/image.jpg",
    boxImage: "https://i.postimg.cc/ZqWjJvhN/box.png",
    headX: "50",
    headY: "50",
    boxX: "50",
    boxY: "50",
    firstName: "Hans X. Frost",
    lastName: "",
    burstText: "Crabby\nFairy",
    title: "Did you know...",
    roleplay: "คนนั้นเป็นใครกันนะ ใส ๆ อ๊ะ ๆ น่ากิ๊นน่ากิน เหมือนเนื้อโกเบไหมหนอ ที่มันนุ่มคอ ที่มันนุ่มลิ้น อย่างนี้สิเทรนด์เกาหลี มองดูดี ๆ นึกว่าวอนบิน โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน ชักช้าลีลามากนัก ยึกยัก ยึกยัก จะไม่ทันกิน เหมือน ๆ นั่งกินก๋วยเตี๋ยว หันหลังแว้บเดียวถูกฉกลูกชิ้น ต้องสู้ ต้องสู้ ต้องซ่า ต้องกล้า ต้องกล้า ต้องกินบ้าบิ่น โอ๊ย ยังไง ๆ จะต้องเอามาเป็นทรัพย์สิน แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊",
    note: "หมายเหตุ herb"
  });

  const editorDefaults = Object.freeze({
    bgColor: defaults.bgColor,
    textColor: defaults.textColor,
    headImage: defaults.headImage,
    boxImage: defaults.boxImage,
    headX: defaults.headX,
    headY: defaults.headY,
    boxX: defaults.boxX,
    boxY: defaults.boxY,
    firstName: defaults.firstName,
    lastName: "",
    burstText: defaults.burstText,
    title: defaults.title,
    roleplay: "",
    note: ""
  });

  let panel = null;
  let viewPanel = null;
  let card = null;
  let modal = null;
  let previewTimer = 0;
  let cardRendered = false;

  function h(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssUrl(value) {
    return String(value || "").replace(/[\\'\r\n]/g, (char) => ({"\\":"\\\\", "'":"\\'", "\r":"", "\n":""}[char] ?? ""));
  }

  function clampPosition(value, fallback = 50) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : fallback;
  }

  function normalizeColor(value, fallback) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(String(value || ""));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function bbcodeToPreviewHtml(value) {
    let text = h(value || "").replace(/\r\n?/g, "\n");

    const renderList = (source, ordered) => {
      const pattern = ordered
        ? /\[list=1\]([\s\S]*?)\[\/list\]/gi
        : /\[list\](?!\s*=)([\s\S]*?)\[\/list\]/gi;
      const tag = ordered ? "ol" : "ul";
      return source.replace(pattern, (_match, body) => {
        const items = String(body || "")
          .split(/\[\*\]/i)
          .slice(1)
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => `<li>${item}</li>`)
          .join("");
        return items ? `<${tag} style="margin:10px 0;padding-left:24px">${items}</${tag}>` : "";
      });
    };

    text = renderList(text, true);
    text = renderList(text, false);

    text = text
      .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>")
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
      .replace(/\[size=small\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:.82em">$1</span>')
      .replace(/\[size=medium\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1em">$1</span>')
      .replace(/\[size=large\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:1.28em">$1</span>')
      .replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
      .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
      .replace(/\[img\]([^\[]+)\[\/img\]/gi, '<img src="$1" alt="" style="display:block;max-width:100%;height:auto;margin:10px auto">')
      .replace(/\[video=youtube\]([^\[]+)\[\/video\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">▶ YouTube</a>')
      .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<span class="dds-hans-bbcode-block">$1</span>')
      .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="dds-hans-bbcode-block">$1</code>')
      .replace(/\[(hide|spoiler)\]([\s\S]*?)\[\/\1\]/gi, '<span class="dds-hans-bbcode-block">$2</span>')
      .replace(/\[hr\]/gi, '<hr style="margin:14px 0;border:0;border-top:1px solid currentColor;opacity:.25">')
      .replace(/\n/g, "<br>");

    return text;
  }

  function roleToHtml(value, previewMode = false) {
    return previewMode ? bbcodeToPreviewHtml(value) : h(value || "");
  }

  function removeBbcodeForWordCount(value) {
    return String(value || "")
      .replace(/\[url=[^\]]*\]/gi, " ")
      .replace(/\[\/?(?:b|i|u|s|quote|code|hide|spoiler|color|size|align|url|img|video|list)(?:=[^\]]*)?\]/gi, " ")
      .replace(/\[\*\]|\[hr\]/gi, " ")
      .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function countRoleplayWords(value) {
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

    const words = clean.match(/[\u0E00-\u0E7F]+|[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+(?:[.,]\d+)*/g);
    return words ? words.length : 0;
  }

  function updateRoleplayWordCounter() {
    const textarea = panel?.querySelector('[data-hans-field="roleplay"]');
    const counter = panel?.querySelector("[data-hans-word-counter]");
    if (!textarea || !counter) return;
    const count = countRoleplayWords(textarea.value);
    const number = counter.querySelector("[data-hans-word-count-number]");
    if (number) number.textContent = count.toLocaleString("th-TH");
    counter.dataset.empty = count === 0 ? "true" : "false";
  }

  function replaceTextareaSelection(target, replacement, caretOffset = null) {
    if (!target) return;
    const start = Number.isInteger(target.selectionStart) ? target.selectionStart : target.value.length;
    const end = Number.isInteger(target.selectionEnd) ? target.selectionEnd : start;
    target.setRangeText(replacement, start, end, "end");
    if (Number.isInteger(caretOffset)) {
      const caret = start + caretOffset;
      target.setSelectionRange(caret, caret);
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
  }

  function wrapHansTag(target, openTag, closeTag) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const replacement = `${openTag}${selected}${closeTag}`;
    replaceTextareaSelection(target, replacement, selected ? replacement.length : openTag.length);
  }

  function applyHansList(target, ordered) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    const selected = target.value.slice(start, end);
    const lines = selected.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const openTag = ordered ? "[list=1]" : "[list]";
    const body = lines.length ? lines.map((line) => `[*]${line}`).join("\n") : "[*]";
    const replacement = `${openTag}\n${body}\n[/list]`;
    replaceTextareaSelection(target, replacement, lines.length ? replacement.length : openTag.length + 4);
  }

  function applyHansBbcode(target, action, toolbar) {
    if (!target) return;
    if (["b", "i", "u", "s", "quote", "code", "hide", "spoiler"].includes(action)) {
      wrapHansTag(target, `[${action}]`, `[/${action}]`);
      return;
    }

    const wrappers = {
      "size-small": ["[size=small]", "[/size]"],
      "size-medium": ["[size=medium]", "[/size]"],
      "size-large": ["[size=large]", "[/size]"],
      "align-left": ["[align=left]", "[/align]"],
      "align-center": ["[align=center]", "[/align]"],
      "align-right": ["[align=right]", "[/align]"],
      "align-justify": ["[align=justify]", "[/align]"]
    };
    if (wrappers[action]) {
      wrapHansTag(target, wrappers[action][0], wrappers[action][1]);
      return;
    }

    if (action === "color") {
      const color = toolbar?.querySelector("[data-hans-bbcode-color]")?.value || "#000000";
      wrapHansTag(target, `[color=${color}]`, "[/color]");
      return;
    }

    if (action === "url") {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      const selected = target.value.slice(start, end);
      const url = window.prompt("ใส่ลิงก์ URL", /^https?:\/\//i.test(selected) ? selected : "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[url=${url}]${selected || url}[/url]`);
      return;
    }

    if (action === "img") {
      const url = window.prompt("ใส่ลิงก์รูปภาพ", "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[img]${url}[/img]`);
      return;
    }

    if (action === "video") {
      const url = window.prompt("ใส่ลิงก์ YouTube", "https://");
      if (url === null) return;
      replaceTextareaSelection(target, `[video=youtube]${url}[/video]`);
      return;
    }

    if (action === "list") { applyHansList(target, false); return; }
    if (action === "list-1") { applyHansList(target, true); return; }
    if (action === "list-item") { replaceTextareaSelection(target, `[*]${target.value.slice(target.selectionStart ?? 0, target.selectionEnd ?? 0)}`); return; }
    if (action === "hr") { replaceTextareaSelection(target, "[hr]"); return; }

    if (action === "clear") {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? start;
      if (start === end) {
        showToast("คลุมข้อความที่ต้องการล้าง BBCode ก่อน");
        return;
      }
      const selected = target.value.slice(start, end).replace(/\[[^\]]*\]/g, "");
      replaceTextareaSelection(target, selected);
    }
  }

  function hansBbcodeToolbar() {
    return `<div class="dds-rich-toolbar dds-bbcode-toolbar dds-hans-bbcode-toolbar" data-hans-bbcode-toolbar>
      <div class="dds-bbcode-group" aria-label="รูปแบบตัวอักษร">
        <button type="button" data-hans-bbcode="b" title="ตัวหนา [b]" aria-label="ตัวหนา"><b>B</b></button>
        <button type="button" data-hans-bbcode="i" title="ตัวเอียง [i]" aria-label="ตัวเอียง"><i>I</i></button>
        <button type="button" data-hans-bbcode="u" title="ขีดเส้นใต้ [u]" aria-label="ขีดเส้นใต้"><u>U</u></button>
        <button type="button" data-hans-bbcode="s" title="ขีดฆ่า [s]" aria-label="ขีดฆ่า"><s>S</s></button>
      </div>
      <div class="dds-bbcode-group" aria-label="สีและขนาด">
        <label class="dds-bbcode-color" title="สีตัวอักษร [color]"><span>A</span><input type="color" data-hans-bbcode-color value="#8f0e16" aria-label="เลือกสีตัวอักษร"></label>
        <button type="button" data-hans-bbcode="size-small" title="ตัวอักษรเล็ก [size=small]">A−</button>
        <button type="button" data-hans-bbcode="size-medium" title="ตัวอักษรกลาง [size=medium]">A</button>
        <button type="button" data-hans-bbcode="size-large" title="ตัวอักษรใหญ่ [size=large]">A+</button>
      </div>
      <div class="dds-bbcode-group" aria-label="จัดตำแหน่ง">
        <button type="button" data-hans-bbcode="align-left" title="ชิดซ้าย [align=left]">⇤</button>
        <button type="button" data-hans-bbcode="align-center" title="กึ่งกลาง [align=center]">↔</button>
        <button type="button" data-hans-bbcode="align-right" title="ชิดขวา [align=right]">⇥</button>
        <button type="button" data-hans-bbcode="align-justify" title="เต็มบรรทัด [align=justify]">☰</button>
      </div>
      <div class="dds-bbcode-group" aria-label="ลิงก์และสื่อ">
        <button type="button" data-hans-bbcode="url" title="ลิงก์ [url=]">🔗</button>
        <button type="button" data-hans-bbcode="img" title="รูปภาพ [img]">▣</button>
        <button type="button" data-hans-bbcode="video" title="YouTube [video=youtube]">▶</button>
      </div>
      <div class="dds-bbcode-group" aria-label="กล่องข้อความ">
        <button type="button" data-hans-bbcode="quote" title="คำพูดอ้างอิง [quote]">❝</button>
        <button type="button" data-hans-bbcode="code" title="โค้ด [code]">&lt;/&gt;</button>
        <button type="button" data-hans-bbcode="hide" title="ซ่อนข้อความ [hide]">◉</button>
        <button type="button" data-hans-bbcode="spoiler" title="สปอยล์ [spoiler]">▤</button>
      </div>
      <div class="dds-bbcode-group" aria-label="รายการ">
        <button type="button" data-hans-bbcode="list" title="รายการจุด [list]">•≡</button>
        <button type="button" data-hans-bbcode="list-1" title="รายการตัวเลข [list=1]">1≡</button>
        <button type="button" data-hans-bbcode="list-item" title="รายการย่อย [*]">[*]</button>
      </div>
      <div class="dds-bbcode-group" aria-label="เครื่องมืออื่น">
        <button type="button" data-hans-bbcode="hr" title="เส้นคั่น [hr]">―</button>
        <button type="button" data-hans-bbcode="clear" title="ล้าง BBCode จากข้อความที่เลือก">CLEAR</button>
      </div>
    </div>`;
  }

  function getValues() {
    const values = { ...defaults };
    if (!panel) return values;
    panel.querySelectorAll("[data-hans-field]").forEach((input) => {
      values[input.dataset.hansField] = input.value;
    });
    return values;
  }

  function updateRangeOutputs() {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-output]").forEach((output) => {
      const input = panel.querySelector(`[data-hans-field="${output.dataset.hansOutput}"]`);
      if (input) output.textContent = `${input.value}%`;
    });
  }

  function syncColorPickers() {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-color-picker]").forEach((picker) => {
      const key = picker.dataset.hansColorPicker;
      const input = panel.querySelector(`[data-hans-field="${key}"]`);
      if (!input) return;
      const fallback = key === "bgColor" ? defaults.bgColor : defaults.textColor;
      const normalized = normalizeColor(input.value, fallback);
      if (picker.value.toLowerCase() !== normalized.toLowerCase()) picker.value = normalized;
    });
  }

  function setValues(values = {}) {
    if (!panel) return;
    panel.querySelectorAll("[data-hans-field]").forEach((input) => {
      const key = input.dataset.hansField;
      input.value = values[key] ?? defaults[key] ?? "";
    });
    syncColorPickers();
    updateRangeOutputs();
    updateRoleplayWordCounter();
  }

  function buildCode(values = getValues(), previewMode = false) {
    const v = { ...defaults, ...values };
    const bg = normalizeColor(v.bgColor, defaults.bgColor);
    const color = normalizeColor(v.textColor, defaults.textColor);
    const headX = clampPosition(v.headX);
    const headY = clampPosition(v.headY);
    const boxX = clampPosition(v.boxX);
    const boxY = clampPosition(v.boxY);

    return `<link href="${STYLESHEET_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_STYLESHEET_URL}" rel="stylesheet"><div class="ddsh-hxf" style="--ddsh-hxf-bg:${bg};--ddsh-hxf-color:${color};--ddsh-hxf-head:url('${cssUrl(v.headImage)}');--ddsh-hxf-box:url('${cssUrl(v.boxImage)}');--ddsh-hxf-barcode:url('${BARCODE_URL}');--ddsh-hxf-head-x:${headX}%;--ddsh-hxf-head-y:${headY}%;--ddsh-hxf-burst-text-x:-5px;"><div class="ddsh-hxf-core"><div class="ddsh-hxf-name"><span class="ddsh-hxf-name-onlyy">${h(v.firstName)}</span></div><div class="ddsh-hxf-photo" style="background-position:${headX}% ${headY}%"><div class="ddsh-hxf-burst" style="background-position:${boxX}% ${boxY}%"><div class="ddsh-hxf-burst-text">${h(v.burstText).replace(/\r?\n/g, "<br>")}</div></div><div class="ddsh-hxf-side ddsh-hxf-side-top">Pine Woods Rd.</div><div class="ddsh-hxf-side ddsh-hxf-side-bottom">ISSUE 01</div></div><div class="ddsh-hxf-title">${h(v.title)}</div><div class="ddsh-hxf-role">${roleToHtml(v.roleplay, previewMode)}</div><div class="ddsh-hxf-bottom"><div class="ddsh-hxf-note"><strong>${h(v.note)}</strong></div><div class="ddsh-hxf-barcode"></div></div></div></div><div class="ddshopfz-credit"><span></span></div>`;
  }

  const OFFICIAL_CODE = buildCode(defaults, false);

  function previewDocument(code) {
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0!important;padding:0!important;background:transparent!important;overflow:hidden!important}.dds-hans-preview-root{width:${CANVAS_WIDTH}px;min-width:${CANVAS_WIDTH}px;max-width:${CANVAS_WIDTH}px;display:flex;flex-direction:column;align-items:center;margin:0 auto}.dds-hans-preview-root>.ddsh-hxf{flex:0 0 auto!important}.dds-hans-preview-root>.ddshopfz-credit{flex:0 0 auto!important;width:100%!important}</style></head><body><div class="dds-hans-preview-root">${code}</div></body></html>`;
  }

  function measureIframe(iframe) {
    try {
      const doc = iframe?.contentDocument;
      const root = doc?.querySelector(".dds-hans-preview-root");
      if (!doc || !root) return { width: CANVAS_WIDTH, height: 900 };
      const width = Math.max(1, Math.ceil(root.scrollWidth || root.getBoundingClientRect().width || CANVAS_WIDTH));
      const height = Math.max(1, Math.ceil(root.scrollHeight || root.getBoundingClientRect().height || 900));
      return { width, height };
    } catch {
      return { width: CANVAS_WIDTH, height: 900 };
    }
  }

  function writeIframe(iframe, code, fit) {
    if (!iframe) return;
    iframe.style.setProperty("width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("min-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("max-width", `${CANVAS_WIDTH}px`, "important");
    iframe.style.setProperty("height", "1200px", "important");
    iframe.onload = () => {
      fit?.();
      setTimeout(() => fit?.(), 90);
      setTimeout(() => fit?.(), 280);
      setTimeout(() => fit?.(), 750);
    };
    iframe.srcdoc = previewDocument(code);
  }

  function fitHolder(stage, holder, iframe) {
    if (!stage || !holder || !iframe) return;
    const { width, height } = measureIframe(iframe);
    const available = Math.max(260, stage.clientWidth - 48);
    const scale = Math.min(1, available / width);
    holder.style.width = `${Math.ceil(width * scale)}px`;
    holder.style.height = `${Math.ceil(height * scale)}px`;
    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("transform", `scale(${scale})`, "important");
    iframe.style.setProperty("transform-origin", "top left", "important");
  }

  function fitEditorPreview() {
    if (!panel) return;
    fitHolder(panel.querySelector("[data-hans-preview-stage]"), panel.querySelector("[data-hans-preview-holder]"), panel.querySelector("[data-hans-preview]"));
  }

  function fitViewPreview() {
    if (!viewPanel) return;
    fitHolder(viewPanel.querySelector("[data-hans-view-stage]"), viewPanel.querySelector("[data-hans-view-holder]"), viewPanel.querySelector("[data-hans-view-preview]"));
  }

  function fitCardPreview() {
    const iframe = card?.querySelector("[data-hans-card-preview]");
    const stage = iframe?.closest(".dds-roleplay-card-preview");
    if (!iframe || !stage) return;

    const { width, height } = measureIframe(iframe);
    const padding = 18;
    const availableWidth = Math.max(1, stage.clientWidth - padding * 2);
    const availableHeight = Math.max(1, stage.clientHeight - padding * 2);
    const scale = Math.min(1, availableWidth / width, availableHeight / height);
    const safeScale = Math.max(0.05, scale);

    iframe.style.setProperty("width", `${width}px`, "important");
    iframe.style.setProperty("min-width", `${width}px`, "important");
    iframe.style.setProperty("max-width", `${width}px`, "important");
    iframe.style.setProperty("height", `${height}px`, "important");
    iframe.style.setProperty("left", "50%", "important");
    iframe.style.setProperty("top", "50%", "important");
    iframe.style.setProperty("transform", `translate(-50%, -50%) scale(${safeScale})`, "important");
    iframe.style.setProperty("transform-origin", "center center", "important");
  }

  function showToast(message) {
    if (typeof window.showToast === "function") return window.showToast(message);
    const toast = document.getElementById("siteToast");
    const text = document.getElementById("siteToastText");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast.__ddsHansTimer);
    toast.__ddsHansTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function setDraftStatus(savedAt = 0) {
    const status = panel?.querySelector("[data-hans-draft-status]");
    if (!status) return;
    if (!savedAt) {
      status.textContent = "ยังไม่มีแบบร่าง";
      return;
    }
    try {
      status.textContent = `บันทึกล่าสุด ${new Date(savedAt).toLocaleString("th-TH")}`;
    } catch {
      status.textContent = "มีแบบร่างที่บันทึกไว้";
    }
  }

  function getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const savedAt = Date.now();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: getValues(), savedAt }));
      setDraftStatus(savedAt);
      showToast("บันทึกแบบร่าง Hans (สำหรับฮันส์คนเดียว) แล้ว");
    } catch {
      showToast("บันทึกแบบร่างไม่สำเร็จ");
    }
  }

  function deleteDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setValues(editorDefaults);
    setDraftStatus(0);
    updatePreview();
    showToast("ลบแบบร่างแล้ว");
  }

  function resetFields() {
    setValues(editorDefaults);
    updatePreview();
    showToast("รีเซ็ตช่องกรอกทั้งหมดแล้ว");
  }

  async function copyCode() {
    const code = buildCode();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("คัดลอกโค้ดโรลเพลย์ Hans (สำหรับฮันส์คนเดียว) แล้ว");
  }

  function setCommissionTab() {
    document.querySelectorAll("[data-work-tab]").forEach((button) => {
      const selected = button.dataset.workTab === "commission";
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("[data-work-panel]").forEach((workPanel) => {
      const selected = workPanel.dataset.workPanel === "commission";
      workPanel.hidden = !selected;
      workPanel.classList.toggle("is-active", selected);
    });
  }

  function showPanel(panelName) {
    document.querySelectorAll(".dds-panel").forEach((item) => item.classList.toggle("is-active", item.dataset.panel === panelName));
    document.querySelectorAll(".dds-nav-button").forEach((button) => button.classList.toggle("is-active", button.dataset.page === "commission"));
    const pageNumber = document.getElementById("currentPageNumber");
    if (pageNumber) pageNumber.textContent = "04";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function enableEditorMode() {
    document.body.classList.add("dds-editor-mode", "dds-commission-editor-mode");
    document.documentElement.classList.add("dds-editor-mode", "dds-commission-editor-mode");
  }

  function goBack(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const restore = () => {
      document.body.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      document.documentElement.classList.remove("dds-editor-mode", "dds-commission-editor-mode", "dds-modal-open");
      showPanel("commission");
      setCommissionTab();
      history.replaceState(null, "", "#commission");
    };
    restore();
    requestAnimationFrame(() => requestAnimationFrame(restore));
    setTimeout(restore, 80);
  }

  function updatePreview() {
    if (!panel) return;
    syncColorPickers();
    updateRangeOutputs();
    writeIframe(panel.querySelector("[data-hans-preview]"), buildCode(getValues(), true), fitEditorPreview);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 55);
  }

  function colorField(label, key) {
    return `<label class="dds-color-field dds-hans-color-field"><span>${h(label)}</span><div><input type="color" data-hans-color-picker="${h(key)}" value="${h(defaults[key])}"><input type="text" data-hans-field="${h(key)}" value="${h(defaults[key])}" spellcheck="false"></div></label>`;
  }

  function positionEditor(prefix, title) {
    return `<div class="dds-image-position dds-field-full dds-hans-position"><div class="dds-image-position-heading"><span>${h(title)}</span><small>ปรับซ้าย–ขวา และบน–ล่าง</small></div><label class="dds-position-row"><span>แนวนอน</span><small>ซ้าย</small><input data-hans-field="${prefix}X" min="0" max="100" type="range" value="50"><small>ขวา</small><output data-hans-output="${prefix}X">50%</output></label><label class="dds-position-row"><span>แนวตั้ง</span><small>บน</small><input data-hans-field="${prefix}Y" min="0" max="100" type="range" value="50"><small>ล่าง</small><output data-hans-output="${prefix}Y">50%</output></label></div>`;
  }

  function createPanel() {
    if (panel?.isConnected) return panel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;

    panel = document.createElement("section");
    panel.className = "dds-panel dds-protected-commission-editor dds-hans-commission-editor";
    panel.dataset.panel = PANEL_NAME;
    panel.innerHTML = `
      <div class="dds-editor-heading">
        <button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-hans-back type="button">←</button>
        <div><p class="dds-eyebrow">COMMISSION EDITOR</p><h1 class="dds-hans-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทโรลเพลย์</span></h1><p>ผู้จ้าง HANS X. FROST — สำหรับฮันส์คนเดียว</p></div>
      </div>
      <div class="dds-protected-commission-layout">
        <div class="dds-protected-commission-preview-column">
          <div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>HANS X. FROST / ROLEPLAY</strong></div>
          <div class="dds-protected-commission-preview-stage dds-hans-preview-stage" data-hans-preview-stage><div class="dds-hans-preview-holder" data-hans-preview-holder><iframe class="dds-protected-commission-preview-frame" data-hans-preview scrolling="no" title="ตัวอย่างโค้ดโรลเพลย์ Hans X. Frost"></iframe></div></div>
        </div>
        <div class="dds-protected-commission-controls-column">
          <div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-hans-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-hans-save>SAVE DRAFT</button><button type="button" data-hans-delete>DELETE SAVE</button></div>
          <div class="dds-protected-commission-scroll dds-hans-commission-scroll">
            <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโค้ด</h2></div><div class="dds-color-grid">${colorField("สีพื้นหลัง — --ddsh-hxf-bg", "bgColor")}${colorField("สีตัวอักษร — --ddsh-hxf-color", "textColor")}</div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>ชื่อ</h2></div><div class="dds-form-grid">
              <label class="dds-field dds-field-full"><span>ชื่อ</span><input type="text" data-hans-field="firstName" value="Hans X. Frost"></label>
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>03</span><h2>รูป HEAD / BOX</h2></div><div class="dds-form-grid">
              <label class="dds-field dds-field-full"><span>ลิงก์รูป HEAD</span><input type="url" data-hans-field="headImage" value="https://i.postimg.cc/ZYdgrg2R/image.jpg" spellcheck="false"></label>
              ${positionEditor("head", "ตำแหน่งรูป HEAD")}
              <label class="dds-field dds-field-full"><span>ลิงก์รูป BOX (สามารถแก้ไขลิ้งค์ได้)</span><input type="url" data-hans-field="boxImage" value="https://i.postimg.cc/ZqWjJvhN/box.png" spellcheck="false"></label>
              ${positionEditor("box", "ตำแหน่งรูป BOX")}
              <div class="dds-hans-barcode-lock dds-field-full"><span>BARCODE</span><strong>LOCKED</strong><small>ใช้รูปต้นฉบับเดิมและไม่มีช่องแก้ไข</small></div>
            </div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>04</span><h2>หัวข้อและข้อความ BOX</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความใน BOX</span><textarea data-hans-field="burstText" rows="2">Crabby
Fairy</textarea></label><label class="dds-field dds-field-full"><span>หัวข้อ</span><input type="text" data-hans-field="title" value="Did you know..."></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>05</span><h2>เนื้อหาโรลเพลย์</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full dds-hans-roleplay-field"><span>ข้อความโรลเพลย์</span>${hansBbcodeToolbar()}<textarea data-hans-field="roleplay" rows="14"></textarea><div class="dds-word-counter" data-hans-word-counter data-empty="true"><span class="dds-word-counter-label">จำนวนคำ</span><strong><span data-hans-word-count-number>0</span> คำ</strong><small>ไม่นับคำสั่ง BBCode</small></div></label></div></section>
            <section class="dds-control-section"><div class="dds-control-title"><span>06</span><h2>หมายเหตุ</h2></div><div class="dds-form-grid"><label class="dds-field dds-field-full"><span>ข้อความหมายเหตุ</span><input type="text" data-hans-field="note" value=""></label></div></section>
          </div>
          <section class="dds-protected-commission-copy dds-hans-commission-copy"><div class="dds-control-title"><span>07</span><h2>คัดลอกโค้ด</h2></div><p>กด COPY CODE เพื่อคัดลอก HTML ที่แก้ไขเสร็จแล้ว โดย BARCODE จะติดไปเป็นรูปต้นฉบับอัตโนมัติ</p><div class="dds-protected-commission-copy-actions"><button type="button" data-hans-copy>COPY CODE <span>↗</span></button><button type="button" data-hans-reset>RESET</button></div></section>
        </div>
      </div>`;

    footer.before(panel);
    panel.querySelector("[data-hans-back]")?.addEventListener("click", goBack);
    panel.addEventListener("input", (event) => {
      const picker = event.target.closest?.("[data-hans-color-picker]");
      if (picker) {
        const input = panel.querySelector(`[data-hans-field="${picker.dataset.hansColorPicker}"]`);
        if (input) input.value = picker.value;
      }
      if (event.target.matches?.('[data-hans-field="roleplay"]')) updateRoleplayWordCounter();
      schedulePreview();
    });
    panel.addEventListener("change", (event) => {
      const color = event.target.closest?.("[data-hans-bbcode-color]");
      if (color) {
        const textarea = panel.querySelector('[data-hans-field="roleplay"]');
        applyHansBbcode(textarea, "color", color.closest("[data-hans-bbcode-toolbar]"));
        return;
      }
      schedulePreview();
    });

    const hansToolbar = panel.querySelector("[data-hans-bbcode-toolbar]");
    hansToolbar?.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    hansToolbar?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-hans-bbcode]");
      if (!button) return;
      const textarea = panel.querySelector('[data-hans-field="roleplay"]');
      applyHansBbcode(textarea, button.dataset.hansBbcode, hansToolbar);
    });
    panel.querySelector("[data-hans-save]")?.addEventListener("click", saveDraft);
    panel.querySelector("[data-hans-delete]")?.addEventListener("click", deleteDraft);
    panel.querySelector("[data-hans-copy]")?.addEventListener("click", copyCode);
    panel.querySelector("[data-hans-reset]")?.addEventListener("click", resetFields);
    return panel;
  }

  function createViewPanel() {
    if (viewPanel?.isConnected) return viewPanel;
    const footer = document.querySelector(".dds-footer");
    if (!footer) return null;
    viewPanel = document.createElement("section");
    viewPanel.className = "dds-panel dds-commission-view-panel dds-hans-view-panel";
    viewPanel.dataset.panel = VIEW_PANEL_NAME;
    viewPanel.innerHTML = `<div class="dds-commission-view-toolbar"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-hans-view-back type="button">←</button></div><div class="dds-hans-view-stage" data-hans-view-stage><div class="dds-hans-view-holder" data-hans-view-holder><iframe class="dds-editor-preview-frame dds-hans-view-frame" data-hans-view-preview scrolling="no" title="งานคอมมิชชั่นโค้ดประเภทโรลเพลย์ Hans X. Frost"></iframe></div></div>`;
    footer.before(viewPanel);
    viewPanel.querySelector("[data-hans-view-back]")?.addEventListener("click", goBack);
    return viewPanel;
  }

  function openView() {
    const target = createViewPanel();
    if (!target) return;
    enableEditorMode();
    showPanel(VIEW_PANEL_NAME);
    history.replaceState(null, "", "#commission-hans-solo-roleplay-view");
    writeIframe(target.querySelector("[data-hans-view-preview]"), OFFICIAL_CODE, fitViewPreview);
  }

  function openEditor() {
    const editor = createPanel();
    if (!editor) return;
    enableEditorMode();
    const draft = getDraft();
    const editorValues = draft?.values
      ? { ...editorDefaults, ...draft.values, boxImage: draft.values.boxImage || editorDefaults.boxImage }
      : editorDefaults;
    setValues(editorValues);
    setDraftStatus(draft?.savedAt || 0);
    showPanel(PANEL_NAME);
    history.replaceState(null, "", "#commission-hans-solo-roleplay-editor");
    updatePreview();
  }


  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("dds-modal-open");
  }

  function createModal() {
    if (modal?.isConnected) return modal;
    modal = document.createElement("div");
    modal.className = "dds-commission-lock-modal";
    modal.id = "ddsHansSoloRoleplayLockModal";
    modal.hidden = true;
    modal.innerHTML = `<form class="dds-commission-lock-dialog" data-hans-solo-lock-form><small>CLIENT ACCESS / HANS X. FROST</small><h2>Protected editor</h2><p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขงานคอมมิชชั่น</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" data-hans-solo-lock-input placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" data-hans-solo-lock-error aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-hans-solo-lock-close>CANCEL</button></div></form>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-hans-solo-lock-close]")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.querySelector("[data-hans-solo-lock-form]")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = modal.querySelector("[data-hans-solo-lock-input]");
      const error = modal.querySelector("[data-hans-solo-lock-error]");
      const submit = modal.querySelector('button[type="submit"]');
      if (!input || !error || !submit) return;
      submit.disabled = true;
      error.textContent = "กำลังตรวจสอบ...";
      try {
        if (await sha256(input.value || "") === ACCESS_HASH) {
          sessionStorage.setItem(ACCESS_SESSION_KEY, "1");
          error.textContent = "";
          closeModal();
          openEditor();
        } else {
          error.textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
        }
      } catch {
        error.textContent = "ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่";
      } finally {
        submit.disabled = false;
      }
    });
    return modal;
  }

  function openModal() {
    const lock = createModal();
    lock.hidden = false;
    document.body.classList.add("dds-modal-open");
    const input = lock.querySelector("[data-hans-solo-lock-input]");
    const error = lock.querySelector("[data-hans-solo-lock-error]");
    if (input) input.value = "";
    if (error) error.textContent = "";
    requestAnimationFrame(() => input?.focus());
  }

  function installCard() {
    if (card?.isConnected) return true;
    const grid = document.querySelector('[data-work-panel="commission"] .dds-commission-grid') || document.querySelector(".dds-commission-grid");
    if (!grid) return false;
    if (grid.querySelector(".dds-hans-solo-roleplay-commission-card")) return true;

    card = document.createElement("article");
    card.className = "dds-roleplay-card dds-commission-card dds-hans-roleplay-commission-card dds-hans-solo-roleplay-commission-card";
    card.innerHTML = `<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-hans-card-preview-frame" data-hans-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น Roleplay Hans X. Frost"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดประเภทโรลเพลย์ <span class="dds-hans-commission-card-subtype">(สำหรับฮันส์คนเดียว)</span></p><p class="dds-commission-card-client">ผู้จ้าง <strong>HANS X. FROST</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-hans-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-hans-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;
    grid.appendChild(card);
    card.querySelector("[data-hans-view]")?.addEventListener("click", openView);
    card.querySelector("[data-hans-edit]")?.addEventListener("click", () => sessionStorage.getItem(ACCESS_SESSION_KEY) === "1" ? openEditor() : openModal());

    const cardPreview = card.querySelector("[data-hans-card-preview]");
    const renderCard = () => {
      if (cardRendered || !cardPreview) return;
      cardRendered = true;
      writeIframe(cardPreview, OFFICIAL_CODE, fitCardPreview);
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        renderCard();
      }, { rootMargin: "420px 0px" });
      observer.observe(card);
    } else renderCard();
    return true;
  }

  function install() {
    createModal();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (installCard() || attempts > 100) clearInterval(timer);
    }, 100);
    window.addEventListener("resize", () => {
      fitCardPreview();
      fitEditorPreview();
      fitViewPreview();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();


/* =========================================================
   HANS X. FROST — RORAIMA HOUSE COMMISSION EDITOR
   โค้ดประเภทกระทู้บ้าน / Protected editor
   ========================================================= */
(() => {
  "use strict";

  if (window.__DDS_RORAIMA_HOUSE_COMMISSION_INSTALLED__) return;
  window.__DDS_RORAIMA_HOUSE_COMMISSION_INSTALLED__ = true;

  const PANEL_NAME = "editor-commission-roraima-house";
  const VIEW_PANEL_NAME = "view-commission-roraima-house";
  const DRAFT_KEY = "dds:commission-draft:hans:roraima-house:v4";
  const ACCESS_HASH = "944c0533242b363788a46eae05b982069f17724030ca780af603d478b4d461e9";
  const ACCESS_SESSION_KEY = "dds:roraima-house-editor:unlocked";
  const CSS_URL = "https://guindaeyo.github.io/css/commit-hansxchouse.css";
  const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bai+Jamjuree:wght@300;400;500;600&display=swap";
  const CANVAS_WIDTH = 800;
  const VIEW_CANVAS_WIDTH = 1040;

  const OFFICIAL_CODE = `<link href="https://guindaeyo.github.io/css/commit-hansxchouse.css" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bai+Jamjuree:wght@300;400;500;600&display=swap" rel="stylesheet"><div class="ddsh-roraima"style="--ddsh-rora-house:url('https://i.postimg.cc/GmWbmjFJ/2.jpg');--ddsh-rora-garage:url('https://i.postimg.cc/KYh4HbHS/image.png');--ddsh-rora-peachtree:url('https://i.postimg.cc/x8ffSTKR/Stonepeaches.jpg');--ddsh-rora-ivy:url('https://i.postimg.cc/gJJwvDT1/3.png');--ddsh-rora-peach:url('https://i.postimg.cc/G22BkQ5W/1.png');--ddsh-rora-wood:url('https://i.postimg.cc/FRRfjZB2/22.png');--ddsh-rora-bentley:url('https://i.imgur.com/mlUZ7sC.png');--ddsh-rora-aston:url('https://iili.io/KZKSxft.png');--ddsh-rora-house-x:50%;--ddsh-rora-house-y:50%;--ddsh-rora-garage-x:50%;--ddsh-rora-garage-y:50%;--ddsh-rora-tree-x:50%;--ddsh-rora-tree-y:50%;--ddsh-rora-itembg-01:#ffffff;--ddsh-rora-itembg-02:#ffffff;--ddsh-rora-itembg-03:#ffffff;--ddsh-rora-itembg-04:#ffffff;--ddsh-rora-itembg-05:#ffffff;--ddsh-rora-ivy-x:50%;--ddsh-rora-ivy-y:50%;--ddsh-rora-peach-x:50%;--ddsh-rora-peach-y:50%;--ddsh-rora-wood-x:50%;--ddsh-rora-wood-y:50%;--ddsh-rora-bentley-x:50%;--ddsh-rora-bentley-y:65%;--ddsh-rora-aston-x:50%;--ddsh-rora-aston-y:60%;"><div class="ddsh-roraima-paper"><div class="ddsh-roraima-inner"><div class="ddsh-roraima-gallery"><div class="ddsh-roraima-photo ddsh-roraima-house"></div><div class="ddsh-roraima-side"><div class="ddsh-roraima-photo ddsh-roraima-garage"></div><div class="ddsh-roraima-photo ddsh-roraima-peachtree"></div></div></div><div class="ddsh-roraima-intro"><div class="ddsh-roraima-heading"><div class="ddsh-roraima-title">RORAIMA</div><div class="ddsh-roraima-subtitle">The Garage</div></div><div class="ddsh-roraima-roomtext">แต่แบบอุ๊ยดันมีจงอาง ยืนข้าง ๆ เป็นงูหวงไข่ ประมาณว่าใครแย่งแฟน ใครแย่งไปเอาตาย หวงสุดฤทธิ์ ไม่ให้ใกล้ ไม่ให้ชิดเข้าวงใน ก็แล้วใคร ใครล่ะใครจะกล้ากับเขา เจ้าที่แรง อ๊า จ้องแย่งซีน อ๊า เท้าเอววีน อ๊า ตาเขียวปั้ด อ๊า ดุคะดุ แถมหึงสู้ฟัด ก็เลยเลิกแลกหมัดกับเจ๊</div></div><div class="ddsh-roraima-items ddsh-roraima-items-top"><div class="ddsh-roraima-item ddsh-roraima-item-01"><span class="ddsh-roraima-number">01</span><div class="ddsh-roraima-item-image ddsh-roraima-ivy"></div></div><div class="ddsh-roraima-item ddsh-roraima-item-02"><span class="ddsh-roraima-number">02</span><div class="ddsh-roraima-item-image ddsh-roraima-peach"></div></div><div class="ddsh-roraima-item ddsh-roraima-item-03"><span class="ddsh-roraima-number">03</span><div class="ddsh-roraima-item-image ddsh-roraima-wood"></div></div></div><div class="ddsh-roraima-items ddsh-roraima-items-car"><div class="ddsh-roraima-item ddsh-roraima-item-04"><span class="ddsh-roraima-number">04</span><div class="ddsh-roraima-item-image ddsh-roraima-bentley"></div></div><div class="ddsh-roraima-item ddsh-roraima-item-05"><span class="ddsh-roraima-number">05</span><div class="ddsh-roraima-item-image ddsh-roraima-aston"></div></div></div><div class="ddsh-roraima-details"><div class="ddsh-roraima-detail"><div class="ddsh-roraima-detail-title">1. เถาไอวี่</div><div class="ddsh-roraima-detail-text">เครือเถาเลื้อยปกคลุมไปทั่วหลังคา ห้อยย้อยคล้อยต่ำลงมาถึงทางเข้า เมื่อต้องการเรียกฮันส์ ให้พูดคุยกับเถาไอวี มันจะส่งต่อข้อความไปหาเขาเอง</div></div><div class="ddsh-roraima-detail"><div class="ddsh-roraima-detail-title">2. ต้นพีช</div><div class="ddsh-roraima-detail-text">ปลูกไว้ในกระถางข้างบ้าน และบางส่วนถูกนำลงดินแล้ว ส่งกลิ่นหอมช่วงออกผล นิสัยส่วนใหญ่เป็นอินโทรเวิต ชวนคุยไม่ค่อยตอบสนองเท่าไร</div></div><div class="ddsh-roraima-detail"><div class="ddsh-roraima-detail-title">3. ฟืน</div><div class="ddsh-roraima-detail-text">ภายในบ้านไม่ติดตั้งเครื่องทำความร้อน อาศัยความอบอุ่นจากเตาผิงในห้องนั่งเล่น หรือไม่ก็แปลงร่างเป็นสัตว์ขนหนาเพื่อป้องกันความหนาวเย็นแทน</div></div><div class="ddsh-roraima-detail"><div class="ddsh-roraima-detail-title">4. เบนท์ลีย์</div><div class="ddsh-roraima-detail-text">รถยนต์คันแรกและเป็นลูกรักอันดับหนึ่งของฮันส์ หากพังก็เหมือนเอามีกรีดหัวใจ ไม่เข้าใจเหมือนกันว่าทำไม่ถึงพังบ่อย หรือเพราะเป็นรถฮันส์?</div></div><div class="ddsh-roraima-detail"><div class="ddsh-roraima-detail-title">5. แอสตัน</div><div class="ddsh-roraima-detail-text">รถยนต์คันที่สองของฮันส์ มักใช้เดินทางภายในหมู่บ้าน เอาไว้ทำตัวโก้หรูและเก๊กเข้มแบบสายลับเจม บอน 007 ตึ่งตึงตึงตึ๊งตึงตึงตึ่งตึงตึงตึง</div></div></div></div><div class="ddsh-roraima-footer"><div class="ddsh-roraima-footer-left">Pine Woods Rd. No.7</div><div class="ddsh-roraima-footer-right">ISSUE 01</div></div></div></div><div class="ddshopfz-credit"><span></span></div>`;

  const defaults = Object.freeze({
    bg1: "#ffffff", bg2: "#efeeab", bg3: "#fdca8e", borderColor: "#000000",
    houseImage: "https://i.postimg.cc/GmWbmjFJ/2.jpg", houseX: "50", houseY: "50",
    garageImage: "https://i.postimg.cc/KYh4HbHS/image.png", garageX: "50", garageY: "50",
    treeImage: "https://i.postimg.cc/x8ffSTKR/Stonepeaches.jpg", treeX: "50", treeY: "50",
    ivyImage: "https://i.postimg.cc/gJJwvDT1/3.png", ivyX: "50", ivyY: "50",
    peachImage: "https://i.postimg.cc/G22BkQ5W/1.png", peachX: "50", peachY: "50",
    woodImage: "https://i.postimg.cc/FRRfjZB2/22.png", woodX: "50", woodY: "50",
    bentleyImage: "https://i.imgur.com/mlUZ7sC.png", bentleyX: "50", bentleyY: "65",
    astonImage: "https://iili.io/KZKSxft.png", astonX: "50", astonY: "60",
    title: "RORAIMA", subtitle: "The Garage",
    roomText: "",
    detailTitle1: "1. เถาไอวี่", detailText1: "เครือเถาเลื้อยปกคลุมไปทั่วหลังคา ห้อยย้อยคล้อยต่ำลงมาถึงทางเข้า เมื่อต้องการเรียกฮันส์ ให้พูดคุยกับเถาไอวี มันจะส่งต่อข้อความไปหาเขาเอง",
    detailTitle2: "2. ต้นพีช", detailText2: "ปลูกไว้ในกระถางข้างบ้าน และบางส่วนถูกนำลงดินแล้ว ส่งกลิ่นหอมช่วงออกผล นิสัยส่วนใหญ่เป็นอินโทรเวิต ชวนคุยไม่ค่อยตอบสนองเท่าไร",
    detailTitle3: "3. ฟืน", detailText3: "ภายในบ้านไม่ติดตั้งเครื่องทำความร้อน อาศัยความอบอุ่นจากเตาผิงในห้องนั่งเล่น หรือไม่ก็แปลงร่างเป็นสัตว์ขนหนาเพื่อป้องกันความหนาวเย็นแทน",
    detailTitle4: "4. เบนท์ลีย์", detailText4: "รถยนต์คันแรกและเป็นลูกรักอันดับหนึ่งของฮันส์ หากพังก็เหมือนเอามีกรีดหัวใจ ไม่เข้าใจเหมือนกันว่าทำไม่ถึงพังบ่อย หรือเพราะเป็นรถฮันส์?",
    detailTitle5: "5. แอสตัน", detailText5: "รถยนต์คันที่สองของฮันส์ มักใช้เดินทางภายในหมู่บ้าน เอาไว้ทำตัวโก้หรูและเก๊กเข้มแบบสายลับเจม บอน 007 ตึ่งตึงตึงตึ๊งตึงตึงตึ่งตึงตึงตึง",
    footerLeft: "Pine Woods Rd. No.7", footerRight: "ISSUE 01"
  });

  let panel = null, viewPanel = null, card = null, modal = null, previewTimer = 0, cardRendered = false;

  function h(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function cssUrl(value) { return String(value || "").replace(/[\\'\r\n]/g, (c) => ({"\\":"\\\\", "'":"\\'", "\r":"", "\n":""}[c] ?? "")); }
  function clamp(value, fallback=50) { const n=Number(value); return Number.isFinite(n) ? Math.max(0,Math.min(100,n)) : fallback; }
  function validColor(value) { const s=String(value||"").trim(); return /^#[0-9a-f]{6}$/i.test(s) ? s : ""; }
  async function sha256(value) { const bytes=new TextEncoder().encode(String(value||"")); const digest=await crypto.subtle.digest("SHA-256",bytes); return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join(""); }

  function getValues() {
    const out={};
    panel?.querySelectorAll("[data-rora-field]").forEach((el)=>out[el.dataset.roraField]=el.value);
    return {...defaults,...out};
  }
  function setValues(values=defaults) {
    panel?.querySelectorAll("[data-rora-field]").forEach((el)=>{ el.value=values?.[el.dataset.roraField] ?? defaults[el.dataset.roraField] ?? ""; });
    syncPickers(); updateRangeOutputs();
  }
  function syncPickers() {
    panel?.querySelectorAll("[data-rora-color-picker]").forEach((picker)=>{
      const input=panel.querySelector(`[data-rora-field="${picker.dataset.roraColorPicker}"]`);
      const color=validColor(input?.value);
      if (color) picker.value=color;
    });
  }
  function updateRangeOutputs() {
    panel?.querySelectorAll("[data-rora-range]").forEach((range)=>{
      const output=panel.querySelector(`[data-rora-output="${range.dataset.roraField}"]`);
      if (output) output.textContent=`${range.value}%`;
    });
  }

  function buildCode(values=getValues()) {
    const doc=new DOMParser().parseFromString(`<!doctype html><html><body>${OFFICIAL_CODE}</body></html>`,"text/html");
    const root=doc.querySelector(".ddsh-roraima");
    if (root) {
      const vars={
        "--ddsh-rora-house":[values.houseImage,true], "--ddsh-rora-house-x":[`${clamp(values.houseX)}%`], "--ddsh-rora-house-y":[`${clamp(values.houseY)}%`],
        "--ddsh-rora-garage":[values.garageImage,true], "--ddsh-rora-garage-x":[`${clamp(values.garageX)}%`], "--ddsh-rora-garage-y":[`${clamp(values.garageY)}%`],
        "--ddsh-rora-peachtree":[values.treeImage,true], "--ddsh-rora-tree-x":[`${clamp(values.treeX)}%`], "--ddsh-rora-tree-y":[`${clamp(values.treeY)}%`],
        "--ddsh-rora-ivy":[values.ivyImage,true], "--ddsh-rora-ivy-x":[`${clamp(values.ivyX)}%`], "--ddsh-rora-ivy-y":[`${clamp(values.ivyY)}%`],
        "--ddsh-rora-peach":[values.peachImage,true], "--ddsh-rora-peach-x":[`${clamp(values.peachX)}%`], "--ddsh-rora-peach-y":[`${clamp(values.peachY)}%`],
        "--ddsh-rora-wood":[values.woodImage,true], "--ddsh-rora-wood-x":[`${clamp(values.woodX)}%`], "--ddsh-rora-wood-y":[`${clamp(values.woodY)}%`],
        "--ddsh-rora-bentley":[values.bentleyImage,true], "--ddsh-rora-bentley-x":[`${clamp(values.bentleyX)}%`], "--ddsh-rora-bentley-y":[`${clamp(values.bentleyY,65)}%`],
        "--ddsh-rora-aston":[values.astonImage,true], "--ddsh-rora-aston-x":[`${clamp(values.astonX)}%`], "--ddsh-rora-aston-y":[`${clamp(values.astonY,60)}%`]
      };
      Object.entries(vars).forEach(([name,[value,isImage]])=>root.style.setProperty(name,isImage?`url('${cssUrl(value)}')`:value));
    }
    const setText=(sel,val)=>{ const n=doc.querySelector(sel); if(n)n.textContent=String(val??""); };
    setText(".ddsh-roraima-title",values.title); setText(".ddsh-roraima-subtitle",values.subtitle); setText(".ddsh-roraima-roomtext",values.roomText);
    for(let i=1;i<=5;i+=1){ const d=doc.querySelectorAll(".ddsh-roraima-detail")[i-1]; if(d){ const t=d.querySelector(".ddsh-roraima-detail-title"); const x=d.querySelector(".ddsh-roraima-detail-text"); if(t)t.textContent=values[`detailTitle${i}`]||""; if(x)x.textContent=values[`detailText${i}`]||""; } }
    setText(".ddsh-roraima-footer-left",values.footerLeft); setText(".ddsh-roraima-footer-right",values.footerRight);
    const b1=validColor(values.bg1), b2=validColor(values.bg2), b3=validColor(values.bg3), border=validColor(values.borderColor);
    if (b1 || b2 || b3 || border) {
      const style=doc.createElement("style");
      const c1=b1||"#ffffff", c2=b2||b1||"#f1ede7", c3=b3||b2||b1||"#ddd3c6";
      style.textContent=`${b1||b2||b3?`.ddsh-roraima-paper{background:linear-gradient(180deg,${c1} 0%,${c2} 52%,${c3} 100%)!important;}`:""}${border?`.ddsh-roraima-footer{border-color:${border}!important}.ddsh-roraima-paper{border-bottom-color:${border}!important;}`:""}`;
      doc.body.appendChild(style);
    }
    return Array.from(doc.body.childNodes).map(n=>n.outerHTML??n.textContent).join("");
  }

  function fullCode(values=getValues()) {
    return `<link href="${CSS_URL}" rel="stylesheet"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${FONT_URL}" rel="stylesheet">${buildCode(values).replace(/^<link[^>]+>\s*<link[^>]+>\s*<link[^>]+>\s*<link[^>]+>/i,"")}`;
  }

  function previewDocument(code, canvasWidth = CANVAS_WIDTH) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;min-height:100%;background:#242424;overflow:hidden}.dds-rora-preview-shell{width:${canvasWidth}px;min-width:${canvasWidth}px;max-width:${canvasWidth}px;margin:0 auto;padding:26px 0;display:flex;flex-direction:column;align-items:center;box-sizing:border-box}.dds-rora-preview-shell>.ddsh-roraima,.dds-rora-preview-shell>.ddshopfz-credit{flex:0 0 auto;max-width:none}</style></head><body><div class="dds-rora-preview-shell">${code}</div></body></html>`;
  }

  function writeIframe(iframe, code, afterLoad, canvasWidth = CANVAS_WIDTH) {
    if(!iframe)return;
    iframe.onload=()=>{ setTimeout(()=>afterLoad?.(),40); setTimeout(()=>afterLoad?.(),250); try{iframe.contentDocument?.fonts?.ready?.then(()=>afterLoad?.())}catch{} };
    iframe.srcdoc=previewDocument(code, canvasWidth);
  }
  function shellMetrics(iframe) { const doc=iframe?.contentDocument; const shell=doc?.querySelector(".dds-rora-preview-shell"); if(!doc||!shell)return null; return {width:Math.max(CANVAS_WIDTH,shell.scrollWidth),height:Math.max(1,shell.scrollHeight)}; }
  function fitFrame(iframe, stage, holder, mode="fit") {
    if(!iframe||!stage||!holder)return;
    const m=shellMetrics(iframe); if(!m)return;
    const sw=Math.max(1,stage.clientWidth-28), sh=Math.max(1,stage.clientHeight-28);
    const scale=mode==="width"?Math.min(1,sw/m.width):Math.min(1,sw/m.width,sh/m.height);
    iframe.style.width=`${m.width}px`; iframe.style.height=`${m.height}px`; iframe.style.left="0"; iframe.style.top="0"; iframe.style.transform=`scale(${scale})`; iframe.style.transformOrigin="top left";
    holder.style.width=`${m.width*scale}px`; holder.style.height=`${m.height*scale}px`; holder.style.margin="auto";
  }
  function fitCardPreview(){ const iframe=card?.querySelector("[data-rora-card-preview]"); const stage=card?.querySelector(".dds-roleplay-card-preview"); if(!iframe||!stage)return; const m=shellMetrics(iframe); if(!m)return; const scale=Math.min(stage.clientWidth/m.width,stage.clientHeight/m.height); iframe.style.position="absolute"; iframe.style.left="50%"; iframe.style.top="50%"; iframe.style.width=`${m.width}px`; iframe.style.height=`${m.height}px`; iframe.style.transform=`translate(-50%,-50%) scale(${scale})`; iframe.style.transformOrigin="center center"; }
  function fitEditorPreview(){ fitFrame(panel?.querySelector("[data-rora-preview]"),panel?.querySelector("[data-rora-preview-stage]"),panel?.querySelector("[data-rora-preview-holder]"),"fit"); }
  function fitViewPreview(){ fitFrame(viewPanel?.querySelector("[data-rora-view-preview]"),viewPanel?.querySelector("[data-rora-view-stage]"),viewPanel?.querySelector("[data-rora-view-holder]"),"width"); }

  function schedulePreview(){ clearTimeout(previewTimer); previewTimer=setTimeout(updatePreview,45); }
  function updatePreview(){ if(!panel)return; syncPickers(); updateRangeOutputs(); writeIframe(panel.querySelector("[data-rora-preview]"),fullCode(getValues()),fitEditorPreview); }
  function showToast(msg){ if(typeof window.showToast==="function")window.showToast(msg); else { const t=document.getElementById("siteToastText"); if(t)t.textContent=msg; } }
  function getDraft(){ try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||"null")}catch{return null} }
  function setDraftStatus(ts=0){ const el=panel?.querySelector("[data-rora-draft-status]"); if(!el)return; el.textContent=ts?`บันทึกล่าสุด ${new Date(ts).toLocaleString("th-TH")}`:"ยังไม่มีแบบร่าง"; }
  function saveDraft(){ const data={values:getValues(),savedAt:Date.now()}; localStorage.setItem(DRAFT_KEY,JSON.stringify(data)); setDraftStatus(data.savedAt); showToast("บันทึกแบบร่าง RORAIMA แล้ว"); }
  function deleteDraft(){ localStorage.removeItem(DRAFT_KEY); setDraftStatus(0); showToast("ลบแบบร่าง RORAIMA แล้ว"); }
  function resetFields(){ setValues(defaults); updatePreview(); showToast("รีเซ็ต RORAIMA เป็นค่าต้นฉบับแล้ว"); }
  async function copyCode(){ const code=fullCode(getValues()); try{await navigator.clipboard.writeText(code)}catch{const ta=document.createElement("textarea");ta.value=code;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()} showToast("คัดลอกโค้ดกระทู้บ้าน RORAIMA แล้ว"); }

  function setCommissionTab(){ document.querySelectorAll("[data-work-tab]").forEach(b=>{const s=b.dataset.workTab==="commission";b.classList.toggle("is-active",s);b.setAttribute("aria-selected",String(s))}); document.querySelectorAll("[data-work-panel]").forEach(p=>{const s=p.dataset.workPanel==="commission";p.hidden=!s;p.classList.toggle("is-active",s)}); }
  function showPanel(name){ document.querySelectorAll(".dds-panel").forEach(p=>p.classList.toggle("is-active",p.dataset.panel===name)); document.querySelectorAll(".dds-nav-button").forEach(b=>b.classList.toggle("is-active",b.dataset.page==="commission")); const n=document.getElementById("currentPageNumber"); if(n)n.textContent="04"; window.scrollTo({top:0,left:0,behavior:"auto"}); }
  function enableEditorMode(){ document.body.classList.add("dds-editor-mode","dds-commission-editor-mode"); document.documentElement.classList.add("dds-editor-mode","dds-commission-editor-mode"); }
  function goBack(event){ event?.preventDefault?.(); event?.stopPropagation?.(); const restore=()=>{document.body.classList.remove("dds-editor-mode","dds-commission-editor-mode","dds-modal-open");document.documentElement.classList.remove("dds-editor-mode","dds-commission-editor-mode","dds-modal-open");showPanel("commission");setCommissionTab();history.replaceState(null,"","#commission")}; restore();requestAnimationFrame(()=>requestAnimationFrame(restore));setTimeout(restore,80); }

  function colorField(label,key,picker="#ffffff") { return `<label class="dds-color-field dds-rora-color-field"><span>${h(label)}</span><div><input type="color" value="${picker}" data-rora-color-picker="${key}"><input type="text" data-rora-field="${key}" value="" placeholder="เลือกสีเพื่อเปิดใช้" spellcheck="false"></div></label>`; }
  function field(label,key,{full=false,textarea=false,rows=3,type="text"}={}) { return `<label class="dds-field${full?" dds-field-full":""}"><span>${h(label)}</span>${textarea?`<textarea rows="${rows}" data-rora-field="${key}"></textarea>`:`<input type="${type}" data-rora-field="${key}" spellcheck="false">`}</label>`; }
  function positionBlock(label,keyX,keyY){ return `<div class="dds-image-position dds-field-full dds-rora-position"><div class="dds-image-position-heading"><span>${h(label)}</span><small>ปรับซ้าย–ขวา และบน–ล่าง</small></div><label class="dds-position-row"><span>แนวนอน</span><small>ซ้าย</small><input type="range" min="0" max="100" value="50" data-rora-field="${keyX}" data-rora-range><small>ขวา</small><output data-rora-output="${keyX}">50%</output></label><label class="dds-position-row"><span>แนวตั้ง</span><small>บน</small><input type="range" min="0" max="100" value="50" data-rora-field="${keyY}" data-rora-range><small>ล่าง</small><output data-rora-output="${keyY}">50%</output></label></div>`; }
  function imageSection(number,label,key,x,y){ return `<section class="dds-control-section"><div class="dds-control-title"><span>${number}</span><h2>${h(label)}</h2></div><div class="dds-form-grid">${field(`ลิงก์รูป ${label}`,key,{full:true,type:"url"})}${positionBlock(`ตำแหน่งรูป ${label}`,x,y)}</div></section>`; }

  function createPanel(){
    if(panel?.isConnected)return panel; const footer=document.querySelector(".dds-footer"); if(!footer)return null;
    panel=document.createElement("section"); panel.className="dds-panel dds-protected-commission-editor dds-rora-commission-editor"; panel.dataset.panel=PANEL_NAME;
    panel.innerHTML=`<div class="dds-editor-heading"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-rora-back type="button">←</button><div><p class="dds-eyebrow">PROTECTED COMMISSION EDITOR</p><h1 class="dds-rora-commission-heading"><span>COMMISSION</span><span>— โค้ดประเภทกระทู้บ้าน</span></h1><p>ผู้จ้าง HANS X. FROST</p></div></div><div class="dds-protected-commission-layout"><div class="dds-protected-commission-preview-column"><div class="dds-editor-preview-top"><span>LIVE PREVIEW</span><strong>RORAIMA / HOUSE THREAD</strong></div><div class="dds-rora-preview-stage" data-rora-preview-stage><div class="dds-rora-preview-holder" data-rora-preview-holder><iframe class="dds-protected-commission-preview-frame dds-rora-preview-frame" data-rora-preview scrolling="no" title="ตัวอย่างโค้ดกระทู้บ้าน RORAIMA"></iframe></div></div></div><div class="dds-protected-commission-controls-column"><div class="dds-protected-commission-draft"><div><strong>บันทึกแบบร่าง</strong><small data-rora-draft-status>ยังไม่มีแบบร่าง</small></div><button type="button" data-rora-save>SAVE DRAFT</button><button type="button" data-rora-delete>DELETE SAVE</button></div><div class="dds-protected-commission-scroll dds-rora-commission-scroll">
      <section class="dds-control-section"><div class="dds-control-title"><span>01</span><h2>สีของโค้ด</h2></div><div class="dds-color-grid">${colorField("พื้นหลังสีที่ 1","bg1","#ffffff")}${colorField("พื้นหลังสีที่ 2","bg2","#efeeab")}${colorField("พื้นหลังสีที่ 3","bg3","#fdca8e")}${colorField("สีขอบล่างสุด","borderColor","#000000")}</div><p class="dds-rora-color-help">สีพื้นหลังทั้ง 3 ช่องแก้ได้ และจะเกลี่ยแบบ linear-gradient(180deg, สีที่ 1 0%, สีที่ 2 52%, สีที่ 3 100%)</p></section>
      <section class="dds-control-section"><div class="dds-control-title"><span>02</span><h2>หัวข้อและเนื้อหาบ้าน</h2></div><div class="dds-form-grid">${field("หัวข้อหลัก — RORAIMA","title")}${field("หัวข้อรอง — The Garage","subtitle")}${field("เนื้อหาบ้าน","roomText",{full:true,textarea:true,rows:8})}</div></section>
      ${imageSection("03","HOUSE","houseImage","houseX","houseY")}${imageSection("04","GARAGE","garageImage","garageX","garageY")}${imageSection("05","PEACH TREE","treeImage","treeX","treeY")}${imageSection("06","IVY","ivyImage","ivyX","ivyY")}${imageSection("07","PEACH","peachImage","peachX","peachY")}${imageSection("08","WOOD","woodImage","woodX","woodY")}${imageSection("09","BENTLEY","bentleyImage","bentleyX","bentleyY")}${imageSection("10","ASTON","astonImage","astonX","astonY")}
      <section class="dds-control-section"><div class="dds-control-title"><span>11</span><h2>รายละเอียด 1–5</h2></div><div class="dds-form-grid">${[1,2,3,4,5].map(i=>`${field(`หัวข้อ ${i}`,`detailTitle${i}`,{full:true})}${field(`เนื้อหา ${i}`,`detailText${i}`,{full:true,textarea:true,rows:5})}`).join("")}</div></section>
      <section class="dds-control-section"><div class="dds-control-title"><span>12</span><h2>ข้อความท้าย</h2></div><div class="dds-form-grid">${field("ข้อความท้ายฝั่งซ้าย","footerLeft")}${field("ข้อความท้ายฝั่งขวา","footerRight")}</div></section>
    </div><section class="dds-protected-commission-copy dds-rora-commission-copy"><div class="dds-control-title"><span>13</span><h2>คัดลอกโค้ด</h2></div><p>กด COPY CODE เพื่อคัดลอกโค้ดกระทู้บ้านที่แก้ไขเสร็จแล้วไปใช้งานได้ทันที</p><div class="dds-protected-commission-copy-actions"><button type="button" data-rora-copy>COPY CODE <span>↗</span></button><button type="button" data-rora-reset>RESET</button></div></section></div></div>`;
    footer.before(panel);
    panel.querySelector("[data-rora-back]")?.addEventListener("click",goBack);
    panel.addEventListener("input",(event)=>{const picker=event.target.closest?.("[data-rora-color-picker]");if(picker){const input=panel.querySelector(`[data-rora-field="${picker.dataset.roraColorPicker}"]`);if(input)input.value=picker.value} schedulePreview()});
    panel.querySelector("[data-rora-save]")?.addEventListener("click",saveDraft); panel.querySelector("[data-rora-delete]")?.addEventListener("click",deleteDraft); panel.querySelector("[data-rora-copy]")?.addEventListener("click",copyCode); panel.querySelector("[data-rora-reset]")?.addEventListener("click",resetFields);
    return panel;
  }

  function createViewPanel(){ if(viewPanel?.isConnected)return viewPanel; const footer=document.querySelector(".dds-footer"); if(!footer)return null; viewPanel=document.createElement("section"); viewPanel.className="dds-panel dds-commission-view-panel dds-rora-view-panel"; viewPanel.dataset.panel=VIEW_PANEL_NAME; viewPanel.innerHTML=`<div class="dds-commission-view-toolbar"><button aria-label="กลับหน้า COMMISSION & SHOWCASE" class="dds-back-button" data-rora-view-back type="button">←</button></div><div class="dds-rora-view-stage" data-rora-view-stage><div class="dds-rora-view-holder" data-rora-view-holder><iframe class="dds-editor-preview-frame dds-rora-view-frame" data-rora-view-preview scrolling="no" title="งานคอมมิชชั่นโค้ดประเภทกระทู้บ้าน RORAIMA"></iframe></div></div>`; footer.before(viewPanel); viewPanel.querySelector("[data-rora-view-back]")?.addEventListener("click",goBack); return viewPanel; }
  function openView(){const target=createViewPanel();if(!target)return;enableEditorMode();showPanel(VIEW_PANEL_NAME);history.replaceState(null,"","#commission-roraima-house-view");writeIframe(target.querySelector("[data-rora-view-preview]"),OFFICIAL_CODE,fitViewPreview,VIEW_CANVAS_WIDTH)}
  function openEditor(){const editor=createPanel();if(!editor)return;enableEditorMode();const draft=getDraft();setValues(draft?.values?{...defaults,...draft.values}:defaults);setDraftStatus(draft?.savedAt||0);showPanel(PANEL_NAME);history.replaceState(null,"","#commission-roraima-house-editor");updatePreview()}

  function closeModal(){if(!modal)return;modal.hidden=true;document.body.classList.remove("dds-modal-open")}
  function createModal(){if(modal?.isConnected)return modal;modal=document.createElement("div");modal.className="dds-commission-lock-modal";modal.id="ddsRoraimaHouseLockModal";modal.hidden=true;modal.innerHTML=`<form class="dds-commission-lock-dialog" data-rora-lock-form><small>CLIENT ACCESS / HANS X. FROST</small><h2>Protected editor</h2><p>กรอกรหัสของผู้จ้างเพื่อเปิดหน้าแก้ไขโค้ดกระทู้บ้าน</p><label class="dds-commission-lock-field"><span>PASSWORD</span><input type="password" autocomplete="current-password" data-rora-lock-input placeholder="กรอกรหัสผ่าน"></label><p class="dds-commission-lock-error" data-rora-lock-error aria-live="polite"></p><div class="dds-commission-lock-actions"><button type="submit">UNLOCK CODE</button><button type="button" data-rora-lock-close>CANCEL</button></div></form>`;document.body.appendChild(modal);modal.querySelector("[data-rora-lock-close]")?.addEventListener("click",closeModal);modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});modal.querySelector("[data-rora-lock-form]")?.addEventListener("submit",async(e)=>{e.preventDefault();const input=modal.querySelector("[data-rora-lock-input]"),error=modal.querySelector("[data-rora-lock-error]"),submit=modal.querySelector('button[type="submit"]');if(!input||!error||!submit)return;submit.disabled=true;error.textContent="กำลังตรวจสอบ...";try{if(await sha256(input.value||"")===ACCESS_HASH){sessionStorage.setItem(ACCESS_SESSION_KEY,"1");error.textContent="";closeModal();openEditor()}else{error.textContent="รหัสผ่านไม่ถูกต้อง";input.select()}}catch{error.textContent="ไม่สามารถตรวจสอบรหัสได้ กรุณาลองใหม่"}finally{submit.disabled=false}});return modal}
  function openModal(){const lock=createModal();lock.hidden=false;document.body.classList.add("dds-modal-open");const input=lock.querySelector("[data-rora-lock-input]"),error=lock.querySelector("[data-rora-lock-error]");if(input)input.value="";if(error)error.textContent="";requestAnimationFrame(()=>input?.focus())}

  function installCard(){if(card?.isConnected)return true;const grid=document.querySelector('[data-work-panel="commission"] .dds-commission-grid')||document.querySelector(".dds-commission-grid");if(!grid)return false;if(grid.querySelector(".dds-roraima-house-commission-card"))return true;card=document.createElement("article");card.className="dds-roleplay-card dds-commission-card dds-roraima-house-commission-card";card.innerHTML=`<div class="dds-roleplay-card-preview dds-roleplay-card-preview-live"><iframe aria-hidden="true" class="dds-roleplay-card-preview-frame dds-rora-card-preview-frame" data-rora-card-preview loading="lazy" scrolling="no" tabindex="-1" title="ตัวอย่างงานคอมมิชชั่น RORAIMA House"></iframe><span class="dds-roleplay-preview-badge">COMPLETED</span></div><div class="dds-roleplay-card-body dds-commission-card-body"><h2 class="dds-commission-card-title">COMMISSION</h2><p class="dds-commission-card-type">โค้ดประเภทกระทู้บ้าน</p><p class="dds-commission-card-client">ผู้จ้าง <strong>HANS X. FROST</strong></p><div class="dds-commission-card-actions"><button class="dds-roleplay-edit" data-rora-view type="button">VIEW WORK <span>↗</span></button><button class="dds-roleplay-edit dds-commission-protected-edit" data-rora-edit type="button">EDIT CODE <span>↗</span></button></div></div>`;grid.appendChild(card);card.querySelector("[data-rora-view]")?.addEventListener("click",openView);card.querySelector("[data-rora-edit]")?.addEventListener("click",()=>sessionStorage.getItem(ACCESS_SESSION_KEY)==="1"?openEditor():openModal());const frame=card.querySelector("[data-rora-card-preview]");const render=()=>{if(cardRendered||!frame)return;cardRendered=true;writeIframe(frame,OFFICIAL_CODE,fitCardPreview)};if("IntersectionObserver" in window){const obs=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;obs.disconnect();render()},{rootMargin:"420px 0px"});obs.observe(card)}else render();return true}
  function install(){createModal();let attempts=0;const timer=setInterval(()=>{attempts+=1;if(installCard()||attempts>100)clearInterval(timer)},100);window.addEventListener("resize",()=>{fitCardPreview();fitEditorPreview();fitViewPreview()})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
