"use strict";


/* ==================================================
   ELEMENTS
================================================== */

const panels = document.querySelectorAll("[data-panel]");
const navigationButtons = document.querySelectorAll("[data-page]");
const goButtons = document.querySelectorAll("[data-go]");

const currentPageNumber = document.querySelector("#currentPageNumber");
const linkToast = document.querySelector("#linkToast");
const codeLinks = document.querySelectorAll("[data-code-link]");


/* ==================================================
   เลขประจำแต่ละหน้า
================================================== */

const pageNumbers = {
  home: "00",
  roleplay: "01",
  profile: "02",
  review: "03",
  commission: "04"
};


/* ==================================================
   ชื่อสำหรับ TITLE ของเบราว์เซอร์
================================================== */

const pageTitles = {
  home: "Deep Deep Sleep Code Shop",
  roleplay: "For Roleplay | Deep Deep Sleep Code Shop",
  profile: "For Profile | Deep Deep Sleep Code Shop",
  review: "For Review | Deep Deep Sleep Code Shop",
  commission: "Commission | Deep Deep Sleep Code Shop"
};


/* ==================================================
   เปิดหน้าที่เลือก
================================================== */

function openPage(pageName, updateHash = true) {
  const validPage = pageNumbers[pageName]
    ? pageName
    : "home";

  panels.forEach((panel) => {
    const isTargetPanel =
      panel.dataset.panel === validPage;

    panel.classList.toggle(
      "is-active",
      isTargetPanel
    );
  });

  navigationButtons.forEach((button) => {
    const isTargetButton =
      button.dataset.page === validPage;

    button.classList.toggle(
      "is-active",
      isTargetButton
    );

    button.setAttribute(
      "aria-current",
      isTargetButton ? "page" : "false"
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
}


/* ==================================================
   คลิกเมนูฝั่งขวา
================================================== */

navigationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const pageName = button.dataset.page;

    openPage(pageName);
  });
});


/* ==================================================
   ปุ่มบนหน้าแรก
================================================== */

goButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const pageName = button.dataset.go;

    openPage(pageName);
  });
});


/* ==================================================
   เปิดหน้าตาม HASH ในลิงก์

   ตัวอย่าง:
   yourwebsite.vercel.app/#profile
================================================== */

function openPageFromHash() {
  const hashPage =
    window.location.hash.replace("#", "");

  if (pageNumbers[hashPage]) {
    openPage(hashPage, false);
  } else {
    openPage("home", false);
  }
}

window.addEventListener(
  "hashchange",
  openPageFromHash
);

openPageFromHash();


/* ==================================================
   ตรวจสอบว่าลิงก์ยังเป็นลิงก์ตัวอย่างหรือไม่
================================================== */

function isPlaceholderLink(url) {
  return (
    url.includes("USERNAME") ||
    url.includes("ROLEPLAY-DEMO") ||
    url.includes("ROLEPLAY-EDIT") ||
    url.includes("PROFILE-DEMO") ||
    url.includes("PROFILE-EDIT") ||
    url.includes("REVIEW-DEMO") ||
    url.includes("REVIEW-EDIT") ||
    url.includes("example.com")
  );
}


/* ==================================================
   แสดงกล่องแจ้งเตือน
================================================== */

let toastTimer;

function showLinkToast() {
  if (!linkToast) {
    return;
  }

  clearTimeout(toastTimer);

  linkToast.classList.add("is-visible");

  toastTimer = setTimeout(() => {
    linkToast.classList.remove("is-visible");
  }, 3500);
}


/* ==================================================
   ป้องกันไม่ให้ลิงก์ตัวอย่างเปิดจริง
================================================== */

codeLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const linkUrl = link.getAttribute("href");

    if (!linkUrl || isPlaceholderLink(linkUrl)) {
      event.preventDefault();

      showLinkToast();
    }
  });
});


/* ==================================================
   ปิด Toast เมื่อกด Escape
================================================== */

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    linkToast
  ) {
    linkToast.classList.remove("is-visible");
  }
});
