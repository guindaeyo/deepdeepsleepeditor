"use strict";

/*
 * DEEP DEEP SLEEP CODE SHOP
 * LIVE PREVIEW + COMMISSION & ACTIVITY / COMMISSION 3 / MY OWN CODE BUILD
 *
 * ไฟล์นี้ใช้แทน script.js เดิมได้ทันที
 * - โหลดระบบเว็บไซต์เดิมจาก commit ที่ล็อกเวอร์ชันไว้
 * - จากนั้นติดตั้งตัวแก้ LIVE PREVIEW ให้ซูม/ขยับรูปได้ลื่นขึ้น
 * - หน้าเมนูหลักใช้ COMMISSION & ACTIVITY พร้อมแท็บ COMMISSION & SHOWCASE และ ACTIVITY
 * - เพิ่ม COMMISSION 3 (Mikael F. Kaiser), MY OWN CODE 1–3 และ ACTIVITY: MY TOP 5 MOVIES ทั้งหน้ากิจกรรมและแบบตอบกลับ แบบดูอย่างเดียว
 * - หน้า COMMISSION & SHOWCASE และ ACTIVITY ใช้การ์ด 3 ช่อง และหน้าดูงานใช้แคนวาส 1040px สูงตามเนื้อหา
 * - หน้า CODE006 รูปวงกลมใหญ่ รูปหน้าชื่อเว็บ และรูปวงกลมเล็กส่วนล่างเปลี่ยนเฉพาะลิงก์ ไม่มีเครื่องมือขยับ/ซูม
 * - ปุ่ม BBCode เรียงต่อในแถบเดิม และหน้า editor เปิดมาเป็นฟอร์มว่างทันที โดยพรีวิวหน้าหมวดยังคงสมบูรณ์
 * - พรีวิว PAGE OF ONE ในหน้ารวมใช้ข้อมูลตัวอย่างถาวร ไม่ถูกล้างตามหน้า editor
 * - หน้า editor ของ ROLEPLAY และ PROFILE ใช้การจัดการฟอร์มแบบเดียวกับ REVIEW เพื่อไม่ให้ค่าหายเมื่อเปลี่ยนช่อง
 * - ใช้ร่วมกับ index.html และ style.css ชุดล่าสุดใน ZIP นี้
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

    const showcaseMarkup = String.raw`<section class="profco01ddps-stage"><div class="profco01ddps-board"><aside class="profco01ddps-left"><img src="https://iili.io/CTb913J.png" class="profco01ddps-main-img" alt="Franklin Dominic Bloodworth"></aside><main class="profco01ddps-right"><nav class="profco01ddps-nav"><span class="profco01ddps-navitem">access</span><span class="profco01ddps-navitem">updates</span><span class="profco01ddps-navitem">indications</span><span class="profco01ddps-navitem">recreation</span><span class="profco01ddps-lock">●<small>view</small></span></nav><section class="profco01ddps-card profco01ddps-post"><div class="profco01ddpspost-head"><div class="profco01ddpsprofile"><img src="https://i.pinimg.com/736x/0e/70/0a/0e700a9be59ba8e21e6cd54cb2803e16.jpg" alt="deadbutrich"><span>deadbutrich</span></div><span class="profco01ddpsdots">⋮</span><b>interactive</b></div><p><b>Character name :</b> Franklin Dominic Bloodworth (แฟรงคลิน โดมินิก บลัดเวิร์ธ)
<b>Date of Birth :</b> 7 May 1995
<b>Age :</b> 31 ปี (ร่างกายอายุ 25 ปี)
<b>Race :</b> แวมไพร์
<b>Personality :</b> แฟรงคลินเป็นชายหนุ่มรูปร่างสูงสง่า หน้าตาดี ทว่ากลับมีแววตาคม และท่าทีที่มักนิ่งเฉย ทำให้ผู้คนรอบตัวรู้สึกว่าเขาเป็นคนหยิ่งยโส ไม่ชอบเข้าหาใครก่อน เขาเป็นคนหัวขบถ มีความเชื่อมั่นในตัวเองสูงจนบางครั้งอาจถูกมองว่าหยิ่งหรือเข้าถึงยาก แต่หากได้รู้จักตัวตนของเขาจริง ๆ จะพบว่าเขามีมุมที่อ่อนโยน และจริงใจอยู่มากกว่าที่ใครหลายคนคิด หรือเปล่า?</p><div class="profco01ddpspost-actions"><button type="button">post</button><span>♡</span></div><div class="profco01ddpspost-tabs"><a href="https://roleplayth.com/member.php?action=profile&amp;uid=600" target="_blank" rel="noopener noreferrer">PROFILE</a><a href="https://discord.com/users/759838371001401364" target="_blank" rel="noopener noreferrer">DISCORD</a><a href="https://roleplayth.com/showthread.php?tid=4932" target="_blank" rel="noopener noreferrer">CODE SHOPS</a></div></section><section class="profco01ddps-card profco01ddps-info"><div class="profco01ddpsabout"><h2>ABOUT ME <span>Biography</span></h2><p>แฟรงคลินเกิดมาในตระกูลแชโบลที่มั่งคั่งของเกาหลี เติบโตท่ามกลางความสะดวกสบาย และการตามใจจากครอบครัว ทำให้เขาเป็นคนค่อนข้างเอาแต่ใจเล็กน้อย เขาย้ายไปศึกษาต่อที่สหรัฐอเมริกา และใช้ชีวิตอยู่ในสังคมชนชั้นสูง ซึ่งทำให้เขาได้พบและมีความสัมพันธ์กับชายหนุ่มคนรักในวงสังคมเดียวกัน

โชคชะตาของแฟรงคลินเปลี่ยนไปตลอดกาลเมื่อเขาย้ายเข้าไปอยู่ในแมนชั่นหรูแห่งหนึ่ง โดยไม่เคยรู้มาก่อนว่าชายหนุ่มข้างห้องที่สนิทกันคือแวมไพร์ คืนนั้นแฟรงคลินได้ยินเสียงทะเลาะกันอย่างรุนแรงดังมาจากห้องข้าง ๆ จนพื้นสั่นสะเทือน ความหงุดหงิด และรำคาญทำให้เขาตัดสินใจจะเข้าไปห้ามปราม แต่กลับต้องเผชิญกับการโจมตีอย่างไม่ตั้งใจจากสิ่งที่เรียกกันว่านักล่าแวมไพร์

เพื่อนข้างห้องที่เป็นแวมไพร์ รู้สึกผิดอย่างยิ่งที่แฟรงคลินต้องพลอยเดือดร้อน จึงตัดสินใจเปลี่ยนแฟรงคลินให้กลายเป็นแวมไพร์เพื่อรักษาชีวิต และแนะนำให้เขาย้ายไปอาศัยอยู่ที่หมู่บ้านเอลิเชียน ซึ่งเป็นหมู่บ้านที่รวมตัวของสิ่งมีชีวิตเหนือธรรมชาติเพื่อปรับตัวเข้ากับชีวิตอมตะที่ไม่อาจหวนกลับไปเป็นเหมือนเดิมได้อีก และต้องจากคนรักของตนไปตลอดกาล เพราะไม่อยากให้อีกฝ่ายทนอยู่กับตนเองที่ไม่มีวันกลับไปเป็นเช่นเดิมได้อีก

แฟรงคลินตัดสินใจแยกทางกับคนรัก และมายังที่หมู่บ้านเอลิเชียนตามคำแนะนำของทวดที่เจอกันแบบงง ๆ แม้ยังมีความเย่อหยิ่ง ไม่ยอมให้ใครเข้าถึงตัวง่าย ๆ แต่แฟรงคลินก็กำลังเรียนรู้ที่จะใช้ชีวิตใหม่ในฐานะแวมไพร์ ทั้งในด้านพลังพิเศษ ความหิวกระหายอยู่เสมอ</p></div><div class="profco01ddpsgallery"><img src="https://i.pinimg.com/736x/42/ec/16/42ec16a5abf7c4b6522bba528c186f47.jpg" alt="Franklin gallery 1"><img src="https://i.pinimg.com/736x/6b/1a/ba/6b1abaa182ebd3e1d1f014dda7ee18d1.jpg" alt="Franklin gallery 2"></div></section><section class="profco01ddps-bottom lua-music"><div class="profco01ddpsmusic-cover"><img src="https://www.allkpop.com/upload/2025/11/content/091933/1762734818-132734965.jpg" alt="Coma by YEONJUN"></div><div class="profco01ddpsmusic-info"><div class="profco01ddpsmusic-top"><div><h3>Coma</h3><p>YEONJUN</p></div><a class="profco01ddpsmusic-play" href="https://www.youtube.com/watch?v=NgOO0NWe-o8" target="_blank" rel="noopener noreferrer">▶</a></div><div class="profco01ddpsmusic-line"><span>0:42</span><div class="profco01ddpsmusic-progress" style="--progress: 38%;">&nbsp;<div></div></div><span>2:34</span></div></div></section></main></div></section>`;

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
      "editor-profile001": "updatePolaroidLove",
      "editor-profile002": "updateMoodboard",
      "editor-profile003": "updateFortyOne",
      "editor-profile004": "updateNothinBoutMe",
      "editor-review001": "updateFoodReview"
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
      if (!panel || (!force && panel.dataset.ddsBlanked === "true")) {
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
              field.dataset.placeholder || "กรอกข้อความของคุณที่นี่";
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

    function clearActiveEditorPanel() {
      const activePanel = document.querySelector(
        `${editorPanelSelector}.is-active`
      );

      if (activePanel) {
        clearPanelFields(activePanel);
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
        ? document.querySelector(`[data-panel="editor-${editKey}"]`)
        : null;
    }

    function prepareBlankEditor(button) {
      const panel = getEditorPanelFromButton(button);

      if (!panel) {
        return;
      }

      /*
       * ล้างเฉพาะครั้งแรกที่ผู้ใช้เปิด editor นี้ในรอบการใช้งานหน้าเว็บ
       * หลังจากเริ่มกรอกแล้ว การออกไปหน้าหมวดและกดกลับเข้ามาอีกครั้ง
       * ต้องเก็บข้อความ/ลิงก์ที่กรอกไว้จนกว่าผู้ใช้จะลบหรือกด RESET เอง
       */
      if (panel.dataset.ddsBlanked === "true") {
        return;
      }

      clearPanelFields(panel);

      // กันระบบนำทางใน core เติมค่าตัวอย่างกลับมาเฉพาะจังหวะเปิดครั้งแรก
      requestAnimationFrame(() => {
        if (panel.dataset.ddsBlanked !== "true") {
          clearPanelFields(panel);
        }
      });
    }

    document
      .querySelectorAll(
        "[data-edit-code], [data-edit-profile], [data-edit-review]"
      )
      .forEach((button) => {
        // pointerdown ทำให้ฟอร์มถูกล้างก่อน panel ถูกเปิด จึงไม่เห็นข้อมูลตัวอย่างกระพริบขึ้นมา
        button.addEventListener(
          "pointerdown",
          () => prepareBlankEditor(button),
          { capture: true }
        );

        // รองรับการเปิดด้วยคีย์บอร์ด Enter/Space
        button.addEventListener(
          "click",
          () => prepareBlankEditor(button),
          { capture: true }
        );
      });

    document
      .querySelectorAll(`${editorPanelSelector} .dds-reset-button`)
      .forEach((button) => {
        button.addEventListener("click", () => {
          window.setTimeout(() => {
            const panel = button.closest(editorPanelSelector);
            clearPanelFields(panel, true);
          }, 0);
        });
      });

    window.addEventListener("hashchange", () => {
      queueMicrotask(clearActiveEditorPanel);
    });

    queueMicrotask(clearActiveEditorPanel);
  }


  function installEditorInputPersistenceFix() {
    if (window.__DDS_EDITOR_INPUT_PERSISTENCE_FIX__) {
      return;
    }

    window.__DDS_EDITOR_INPUT_PERSISTENCE_FIX__ = true;

    /*
     * แก้เฉพาะหน้า FOR ROLEPLAY และ FOR PROFILE
     * หน้า FOR REVIEW ใช้งานได้ถูกต้องอยู่แล้ว จึงไม่เข้าไปแตะระบบของหน้านั้น
     */
    const editorPanelSelector = [
      '[data-panel^="editor-code"]',
      '[data-panel^="editor-profile"]'
    ].join(',');

    const panelStates = new Map();
    const resetPanels = new WeakSet();
    const scheduledFields = new WeakSet();

    function isPersistableField(field) {
      if (!(field instanceof Element)) {
        return false;
      }

      if (field.matches('.dds-rich-editor[contenteditable="true"]')) {
        return true;
      }

      if (!field.matches('input, textarea, select')) {
        return false;
      }

      return !field.matches(
        '.dds-generated-code, [readonly], [disabled], input[type="button"], input[type="submit"], input[type="reset"], input[type="hidden"], input[type="file"]'
      );
    }

    function getPanel(field) {
      return field?.closest?.(editorPanelSelector) || null;
    }

    function getPanelState(panel, create = true) {
      const panelName = panel?.dataset?.panel || '';

      if (!panelName) {
        return null;
      }

      if (!panelStates.has(panelName) && create) {
        panelStates.set(panelName, new Map());
      }

      return panelStates.get(panelName) || null;
    }

    function getFieldKey(field) {
      if (field.id) {
        return `id:${field.id}`;
      }

      const panel = getPanel(field);
      const fields = panel
        ? Array.from(
            panel.querySelectorAll(
              'input, textarea, select, .dds-rich-editor[contenteditable="true"]'
            )
          ).filter(isPersistableField)
        : [];
      const index = fields.indexOf(field);
      const name = field.getAttribute('name') || '';
      const type = field.getAttribute('type') || field.tagName.toLowerCase();

      return `field:${type}:${name}:${index}`;
    }

    function readField(field) {
      if (field.matches('.dds-rich-editor[contenteditable="true"]')) {
        return {
          kind: 'html',
          value: field.innerHTML
        };
      }

      if (field.matches('input[type="checkbox"], input[type="radio"]')) {
        return {
          kind: 'checked',
          value: Boolean(field.checked)
        };
      }

      if (field instanceof HTMLSelectElement && field.multiple) {
        return {
          kind: 'multiple',
          value: Array.from(field.options, (option) => option.selected)
        };
      }

      return {
        kind: 'value',
        value: field.value
      };
    }

    function writeField(field, saved) {
      if (!saved || resetPanels.has(getPanel(field))) {
        return;
      }

      if (saved.kind === 'html') {
        if (field.innerHTML !== saved.value) {
          field.innerHTML = saved.value;
        }
        return;
      }

      if (saved.kind === 'checked') {
        if (field.checked !== saved.value) {
          field.checked = saved.value;
        }
        return;
      }

      if (saved.kind === 'multiple') {
        Array.from(field.options).forEach((option, index) => {
          option.selected = Boolean(saved.value[index]);
        });
        return;
      }

      if (field.value !== saved.value) {
        field.value = saved.value;
      }
    }

    function saveField(field) {
      if (!isPersistableField(field)) {
        return;
      }

      const panel = getPanel(field);

      if (!panel || resetPanels.has(panel)) {
        return;
      }

      const state = getPanelState(panel, true);
      state.set(getFieldKey(field), readField(field));
      field.dataset.ddsUserEdited = 'true';
    }

    function restoreField(field) {
      if (!isPersistableField(field)) {
        return;
      }

      const panel = getPanel(field);

      if (!panel || resetPanels.has(panel)) {
        return;
      }

      const state = getPanelState(panel, false);
      const saved = state?.get(getFieldKey(field));

      if (saved) {
        writeField(field, saved);
      }
    }

    function restorePanel(panel) {
      if (!panel || resetPanels.has(panel)) {
        return;
      }

      const state = getPanelState(panel, false);

      if (!state) {
        return;
      }

      panel
        .querySelectorAll(
          'input, textarea, select, .dds-rich-editor[contenteditable="true"]'
        )
        .forEach((field) => {
          if (!isPersistableField(field)) {
            return;
          }

          const saved = state.get(getFieldKey(field));

          if (saved) {
            writeField(field, saved);
          }
        });
    }

    function scheduleFieldRestore(field) {
      if (!isPersistableField(field) || scheduledFields.has(field)) {
        return;
      }

      scheduledFields.add(field);

      queueMicrotask(() => {
        restoreField(field);

        requestAnimationFrame(() => {
          restoreField(field);
          scheduledFields.delete(field);
        });
      });
    }

    document.querySelectorAll(editorPanelSelector).forEach((panel) => {
      /*
       * จำค่า "หลัง" ผู้ใช้พิมพ์แล้วเท่านั้น
       * ไม่ใช้ beforeinput เพราะเป็นจังหวะก่อนตัวอักษรถูกใส่และอาจดึงค่าเก่ากลับมา
       */
      panel.addEventListener(
        'input',
        (event) => {
          const field = event.target;
          saveField(field);
          scheduleFieldRestore(field);
        },
        true
      );

      panel.addEventListener(
        'change',
        (event) => {
          const field = event.target;
          saveField(field);
          scheduleFieldRestore(field);
        },
        true
      );

      /*
       * Core เดิมผูก update ซ้ำไว้กับ blur ทุกช่อง
       * input event อัปเดต LIVE PREVIEW อยู่แล้ว จึงหยุด blur ตัวเดิมได้อย่างปลอดภัย
       * เพื่อไม่ให้ตอนกดไปช่องถัดไปมีโค้ดใดเขียนค่าช่องก่อนหน้าทับ
       */
      panel.addEventListener(
        'blur',
        (event) => {
          const field = event.target;

          if (!isPersistableField(field)) {
            return;
          }

          saveField(field);
          event.stopImmediatePropagation();
          scheduleFieldRestore(field);
        },
        true
      );

      panel.addEventListener(
        'focusin',
        (event) => {
          restoreField(event.target);
        },
        true
      );

      panel.addEventListener(
        'pointerdown',
        (event) => {
          if (event.target.closest('.dds-reset-button')) {
            return;
          }

          const activeField = document.activeElement;

          if (activeField && getPanel(activeField) === panel) {
            saveField(activeField);
            scheduleFieldRestore(activeField);
          }
        },
        true
      );

      panel
        .querySelectorAll('.dds-reset-button')
        .forEach((button) => {
          const beginReset = () => {
            resetPanels.add(panel);
            panelStates.delete(panel.dataset.panel || '');

            panel
              .querySelectorAll('[data-dds-user-edited]')
              .forEach((field) => {
                delete field.dataset.ddsUserEdited;
              });
          };

          button.addEventListener('pointerdown', beginReset, true);
          button.addEventListener(
            'click',
            () => {
              beginReset();

              window.setTimeout(() => {
                resetPanels.delete(panel);
              }, 80);
            },
            true
          );
        });
    });

    document.addEventListener(
      'click',
      (event) => {
        const editButton = event.target.closest(
          '[data-edit-code], [data-edit-profile]'
        );

        if (!editButton) {
          return;
        }

        const editKey =
          editButton.dataset.editCode ||
          editButton.dataset.editProfile ||
          '';
        const panel = editKey
          ? document.querySelector(`[data-panel="editor-${editKey}"]`)
          : null;

        if (!panel) {
          return;
        }

        requestAnimationFrame(() => {
          restorePanel(panel);

          window.setTimeout(() => {
            restorePanel(panel);
          }, 40);
        });
      },
      true
    );

    window.addEventListener('hashchange', () => {
      requestAnimationFrame(() => {
        const activePanel = document.querySelector(
          `${editorPanelSelector}.is-active`
        );

        restorePanel(activePanel);
      });
    });
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
     * พรีวิวบนหน้าหมวด REVIEW ต้องเป็นตัวอย่างสมบูรณ์ถาวร
     * ไม่ให้การล้าง/พิมพ์ในหน้า EDIT CODE เขียนทับการ์ดพรีวิวนี้
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

    function renderStaticFoodReviewPreview() {
      const srcdoc = buildStaticFoodReviewCardDocument();
      const resizeFunction =
        typeof window.resizeReviewDesktopCardPreview === "function"
          ? window.resizeReviewDesktopCardPreview
          : typeof window.resizeCardPreview === "function"
            ? window.resizeCardPreview
            : null;

      iframe.dataset.reviewDesktopWidth = "1300";
      iframe.dataset.reviewDesktopHeight = "920";
      iframe.dataset.previewVisualBounds = "true";

      if (originalQueuePreviewDocument) {
        window.__DDS_RENDER_STATIC_FOOD_REVIEW__ = true;

        try {
          originalQueuePreviewDocument.call(
            window,
            iframe,
            srcdoc,
            resizeFunction
          );
        } finally {
          window.__DDS_RENDER_STATIC_FOOD_REVIEW__ = false;
        }

        if (typeof window.activatePendingPreviews === "function") {
          window.activatePendingPreviews("review");
        }
      } else {
        iframe.srcdoc = srcdoc;
        iframe.addEventListener(
          "load",
          () => {
            if (resizeFunction) {
              resizeFunction(iframe);
            }
          },
          { once: true }
        );
      }
    }

    function scheduleStaticFoodReviewPreview() {
      [0, 90, 260].forEach((delay) => {
        window.setTimeout(renderStaticFoodReviewPreview, delay);
      });
    }

    document.addEventListener("click", (event) => {
      if (
        event.target.closest(
          '[data-go="review"], [data-page="review"], [data-edit-review]'
        )
      ) {
        scheduleStaticFoodReviewPreview();
      }
    });

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#review") {
        scheduleStaticFoodReviewPreview();
      }
    });

    scheduleStaticFoodReviewPreview();
  }

  appendClassicScript(CORE_CDN_URL)
    .catch(() => loadCoreFromRawFallback())
    .then(() => {
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
