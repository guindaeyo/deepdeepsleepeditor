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
        statusElement: null
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

  function installDraftManager(panel) {
    if (!isEditorPanel(panel) || panel.dataset.ddsDraftManager === "true") {
      return;
    }

    panel.dataset.ddsDraftManager = "true";
    const state = getPanelState(panel);
    const controls = panel.querySelector(".dds-editor-controls");

    if (controls) {
      const manager = document.createElement("section");
      manager.className = "dds-draft-manager";
      manager.innerHTML = `
        <div class="dds-draft-manager-copy">
          <strong>บันทึกแบบร่างในเครื่องนี้</strong>
          <span class="dds-draft-status" data-state="idle">บันทึกอัตโนมัติเมื่อมีการแก้ไข</span>
        </div>
        <div class="dds-draft-manager-actions">
          <button class="dds-draft-save-button" type="button">SAVE DRAFT</button>
          <button class="dds-draft-delete-button" type="button">DELETE SAVE</button>
        </div>
      `;

      controls.insertBefore(manager, controls.firstChild);
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
