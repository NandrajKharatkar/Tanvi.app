"use strict";

// --- Application State ---
const STORAGE_KEY_WORKS = "tanvi_meas_calc_works_v2";
const STORAGE_KEY_PROJECT = "tanvi_meas_calc_project_name_v2";
const STORAGE_KEY_LANG = "tanvi_meas_calc_lang_v2";
const STORAGE_KEY_THEME = "tanvi_meas_calc_theme_v2";

let works = [];
let nextId = 1;
let editingWorkId = null;
let currentLanguage = localStorage.getItem(STORAGE_KEY_LANG) || "hi";
let currentTheme = localStorage.getItem(STORAGE_KEY_THEME) || "dark";
let searchQuery = "";

// Bilingual Translations Dictionary
const translations = {
  hi: {
    appTitle: "Measurement Pro",
    subtitle: "कमर्शियल 6\" नियम",
    ruleBadge: "6\" नियम",
    projectLabel: "PROJECT / साइट का नाम",
    formHeading: "नया नाप जोड़ें (Add Work)",
    formHeadingEdit: "नाप एडिट करें (Update Work)",
    workNameLabel: "Work / आइटम का नाम",
    workNamePlaceholder: "जैसे: Master Bed Window, Glass Door, Kitchen Top",
    heightLabel: "Height (ऊंचाई)",
    widthLabel: "Width (चौड़ाई)",
    qtyLabel: "Quantity (संख्या / नग)",
    rateLabel: "Rate / दर (₹ / Sq Ft)",
    addBtn: "+ Add Work (नाप जोड़ें)",
    updateBtn: "✓ Update Work (सेव करें)",
    cancelEditBtn: "रद्द करें (Cancel)",
    kpiTotalItems: "कुल आइटम",
    kpiTotalSqFt: "कुल बिलिंग Sq Ft",
    kpiEstCost: "अनुमानित कुल लागत",
    listHeading: "नाप सूची (Work List)",
    searchPlaceholder: "आइटम खोजें (Search)...",
    emptyList: "अभी कोई Work नहीं जोड़ा गया है। ऊपर से नाप दर्ज करें।",
    totalBannerSub: "कमर्शियल बिलिंग कुल क्षेत्रफल",
    btnWhatsApp: "WhatsApp",
    btnPrint: "Print / PDF",
    btnCopy: "Copy Text",
    btnClear: "Clear All",
    ruleModalTitle: "📐 6-इंच कमर्शियल नाप नियम",
    ruleP1: "ग्लास, मार्बल, ग्रेनाइट, एल्युमिनियम और कारपेंटर वर्क में बिलिंग के लिए 6-इंच राउंडिंग का नियम उपयोग होता है:",
    ruleP2: "इस ऐप में आपका यह कैलकुलेशन स्वचालित रूप से एकदम सही होता है जिससे समय और बिलिंग में कोई नुकसान नहीं होता।",
    toastAdded: "नाप सफलतापूर्वक जोड़ा गया! 📐",
    toastUpdated: "नाप अपडेट हो गया! ✓",
    toastDeleted: "नाप हटा दिया गया।",
    toastCopied: "रिपोर्ट क्लिपबोर्ड में कॉपी हो गई! 📋",
    toastCleared: "प्रोजेक्ट खाली कर दिया गया।",
    toastValidation: "कृपया सही Work Name, Height और Width दर्ज करें!"
  },
  en: {
    appTitle: "Measurement Pro",
    subtitle: "Commercial 6\" Rule",
    ruleBadge: "6\" Rule",
    projectLabel: "PROJECT / SITE NAME",
    formHeading: "Add New Measurement",
    formHeadingEdit: "Edit Measurement",
    workNameLabel: "Work / Item Name",
    workNamePlaceholder: "e.g., Master Bed Window, Glass Door, Kitchen Top",
    heightLabel: "Height",
    widthLabel: "Width",
    qtyLabel: "Quantity (Pcs)",
    rateLabel: "Rate (₹ / Sq Ft)",
    addBtn: "+ Add Work",
    updateBtn: "✓ Update Work",
    cancelEditBtn: "Cancel",
    kpiTotalItems: "Total Items",
    kpiTotalSqFt: "Total Billed Sq Ft",
    kpiEstCost: "Estimated Total",
    listHeading: "Measurements List",
    searchPlaceholder: "Search work by name...",
    emptyList: "No measurements added yet. Enter dimensions above.",
    totalBannerSub: "Commercial Billed Total Area",
    btnWhatsApp: "WhatsApp",
    btnPrint: "Print / PDF",
    btnCopy: "Copy Text",
    btnClear: "Clear All",
    ruleModalTitle: "📐 Commercial 6-Inch Measurement Rule",
    ruleP1: "In commercial glass, marble, granite, aluminum, and woodworking, billing uses this 6-inch rounding standard:",
    ruleP2: "Measurement Pro computes these calculations instantly to avoid manual errors and revenue loss.",
    toastAdded: "Measurement added successfully! 📐",
    toastUpdated: "Measurement updated! ✓",
    toastDeleted: "Measurement removed.",
    toastCopied: "Report copied to clipboard! 📋",
    toastCleared: "Project cleared.",
    toastValidation: "Please enter valid Work Name, Height, and Width!"
  }
};

// --- Measurement Rounding Calculation ---
// 1–12 inches  = 1 ft
// 13–18 inches = 1.5 ft
// 19–24 inches = 2 ft
// 25–30 inches = 2.5 ft
// Continues in 6-inch groups.
function inchesToFeet(inches) {
  if (!Number.isFinite(inches) || inches <= 0) {
    return 0;
  }
  if (inches <= 12) {
    return 1;
  }
  return 1.5 + Math.floor((inches - 12 - 0.000000001) / 6) * 0.5;
}

// Format numbers with Indian commas & up to 2-3 decimals
function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return "0.00";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "₹0";
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });
}

// --- Initialization ---
function initApp() {
  applyTheme(currentTheme);

  // Load Project Name
  const savedProject = localStorage.getItem(STORAGE_KEY_PROJECT);
  if (savedProject) {
    document.getElementById("projectName").value = savedProject;
  }

  // Load Saved Works
  try {
    const savedWorks = localStorage.getItem(STORAGE_KEY_WORKS);
    if (savedWorks) {
      works = JSON.parse(savedWorks);
      if (works.length > 0) {
        nextId = Math.max(...works.map((w) => w.id || 0)) + 1;
      }
    }
  } catch (err) {
    console.error("Failed to parse saved works:", err);
    works = [];
  }

  applyLanguage(currentLanguage);
  updateLivePreview();
  renderWorks();
}

// --- Theme Management ---
function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(currentTheme);
  localStorage.setItem(STORAGE_KEY_THEME, currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = document.getElementById("themeIcon");
  if (theme === "dark") {
    // Sun icon
    themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `;
  } else {
    // Moon icon
    themeIcon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    `;
  }
}

// --- Language Management ---
function toggleLanguage() {
  currentLanguage = currentLanguage === "hi" ? "en" : "hi";
  localStorage.setItem(STORAGE_KEY_LANG, currentLanguage);
  applyLanguage(currentLanguage);
}

function applyLanguage(lang) {
  const t = translations[lang];
  document.getElementById("currentLangLabel").textContent = lang === "hi" ? "🇮🇳 हिंदी" : "🇬🇧 English";

  document.getElementById("txtAppTitle").textContent = t.appTitle;
  document.getElementById("txtSubtitle").textContent = t.subtitle;
  document.getElementById("txtRuleBadge").textContent = t.ruleBadge;
  document.getElementById("txtProjectLabel").textContent = t.projectLabel;
  document.getElementById("txtFormHeading").textContent = editingWorkId ? t.formHeadingEdit : t.formHeading;
  document.getElementById("txtWorkNameLabel").textContent = t.workNameLabel;
  document.getElementById("workName").placeholder = t.workNamePlaceholder;
  document.getElementById("txtHeightLabel").textContent = t.heightLabel;
  document.getElementById("txtWidthLabel").textContent = t.widthLabel;
  document.getElementById("txtQtyLabel").textContent = t.qtyLabel;
  document.getElementById("txtRateLabel").textContent = t.rateLabel;
  document.getElementById("txtAddBtnText").textContent = editingWorkId ? t.updateBtn : t.addBtn;
  document.getElementById("txtCancelEditBtn").textContent = t.cancelEditBtn;

  document.getElementById("txtKpiTotalItems").textContent = t.kpiTotalItems;
  document.getElementById("txtKpiTotalSqFt").textContent = t.kpiTotalSqFt;
  document.getElementById("txtKpiEstCost").textContent = t.kpiEstCost;
  document.getElementById("txtListHeading").textContent = t.listHeading;
  document.getElementById("searchInput").placeholder = t.searchPlaceholder;
  document.getElementById("txtTotalBannerSub").textContent = t.totalBannerSub;

  document.getElementById("txtBtnWhatsApp").textContent = t.btnWhatsApp;
  document.getElementById("txtBtnPrint").textContent = t.btnPrint;
  document.getElementById("txtBtnCopy").textContent = t.btnCopy;
  document.getElementById("txtBtnClear").textContent = t.btnClear;

  document.getElementById("txtRuleModalTitle").textContent = t.ruleModalTitle;
  document.getElementById("txtRuleP1").textContent = t.ruleP1;
  document.getElementById("txtRuleP2").textContent = t.ruleP2;

  updateLivePreview();
}

// --- Live Input & Preview Helpers ---
function setWorkName(name) {
  const input = document.getElementById("workName");
  input.value = name;
  input.focus();
  updateLivePreview();
}

function addFraction(fieldId, value) {
  const input = document.getElementById(fieldId);
  const current = Number(input.value) || 0;
  const updated = current + value;
  input.value = Math.round(updated * 100) / 100;
  handleDimensionInput(fieldId);
}

function changeQty(delta) {
  const qtyInput = document.getElementById("quantity");
  let val = parseInt(qtyInput.value, 10) || 1;
  val = Math.max(1, val + delta);
  qtyInput.value = val;
  updateLivePreview();
}

function handleDimensionInput(type) {
  const input = document.getElementById(type);
  const tag = document.getElementById(type + "FtTag");
  const inches = Number(input.value);

  if (Number.isFinite(inches) && inches > 0) {
    const feet = inchesToFeet(inches);
    tag.style.display = "inline-block";
    tag.textContent = `${inches}" ➔ ${feet} ft`;
  } else {
    tag.style.display = "none";
  }

  updateLivePreview();
}

function updateLivePreview() {
  const hVal = Number(document.getElementById("height").value) || 0;
  const wVal = Number(document.getElementById("width").value) || 0;
  const qty = Math.max(1, parseInt(document.getElementById("quantity").value, 10) || 1);
  const rate = Number(document.getElementById("rate").value) || 0;

  const mH = inchesToFeet(hVal);
  const mW = inchesToFeet(wVal);

  const unitArea = mH * mW;
  const totalItemArea = unitArea * qty;
  const totalItemPrice = totalItemArea * rate;

  // Live calculation text
  const calcText = document.getElementById("liveDimCalc");
  calcText.textContent = `${hVal}" × ${wVal}" ➔ ${mH} ft × ${mW} ft (Qty: ${qty})`;

  const areaVal = document.getElementById("liveAreaVal");
  areaVal.textContent = `${formatNumber(totalItemArea)} Sq Ft`;

  const priceTag = document.getElementById("livePriceVal");
  if (rate > 0) {
    priceTag.style.display = "block";
    priceTag.textContent = `${formatCurrency(totalItemPrice)} (@ ₹${rate}/sqft)`;
  } else {
    priceTag.style.display = "none";
  }

  // Visual aspect ratio box
  const rect = document.getElementById("livePreviewRect");
  if (mH > 0 && mW > 0) {
    const maxDimension = 68;
    const maxVal = Math.max(mH, mW);
    const boxW = Math.max(14, (mW / maxVal) * maxDimension);
    const boxH = Math.max(14, (mH / maxVal) * maxDimension);
    rect.style.width = `${boxW}px`;
    rect.style.height = `${boxH}px`;
  } else {
    rect.style.width = "40px";
    rect.style.height = "40px";
  }
}

// --- CRUD Operations ---
function submitWork() {
  const projectName = document.getElementById("projectName").value.trim() || "Untitled Project";
  const workName = document.getElementById("workName").value.trim();
  const height = Number(document.getElementById("height").value);
  const width = Number(document.getElementById("width").value);
  const quantity = Math.max(1, parseInt(document.getElementById("quantity").value, 10) || 1);
  const rate = Number(document.getElementById("rate").value) || 0;

  const t = translations[currentLanguage];

  if (!workName || !Number.isFinite(height) || !Number.isFinite(width) || height <= 0 || width <= 0) {
    showToast(t.toastValidation, "error");
    document.getElementById("workName").focus();
    return;
  }

  const measuredHeight = inchesToFeet(height);
  const measuredWidth = inchesToFeet(width);
  const unitBilledArea = measuredHeight * measuredWidth;
  const billedArea = unitBilledArea * quantity;
  const actualArea = ((height * width) / 144) * quantity;
  const totalAmount = billedArea * rate;

  if (editingWorkId !== null) {
    // Update existing
    const index = works.findIndex((w) => w.id === editingWorkId);
    if (index !== -1) {
      works[index] = {
        ...works[index],
        projectName,
        workName,
        height,
        width,
        measuredHeight,
        measuredWidth,
        quantity,
        rate,
        billedArea,
        actualArea,
        totalAmount
      };
      showToast(t.toastUpdated, "success");
    }
    cancelEdit();
  } else {
    // Add new
    works.unshift({
      id: nextId++,
      projectName,
      workName,
      height,
      width,
      measuredHeight,
      measuredWidth,
      quantity,
      rate,
      billedArea,
      actualArea,
      totalAmount,
      createdAt: new Date().toISOString()
    });
    showToast(t.toastAdded, "success");
  }

  saveWorks();
  resetForm();
  renderWorks();
  document.getElementById("workName").focus();
}

function editWork(id) {
  const item = works.find((w) => w.id === id);
  if (!item) return;

  editingWorkId = id;
  const t = translations[currentLanguage];

  document.getElementById("workName").value = item.workName;
  document.getElementById("height").value = item.height;
  document.getElementById("width").value = item.width;
  document.getElementById("quantity").value = item.quantity || 1;
  document.getElementById("rate").value = item.rate || "";

  document.getElementById("editModeIndicator").style.display = "inline-block";
  document.getElementById("editIdVal").textContent = id;
  document.getElementById("editActionsRow").style.display = "flex";
  document.getElementById("txtFormHeading").textContent = t.formHeadingEdit;
  document.getElementById("txtAddBtnText").textContent = t.updateBtn;

  handleDimensionInput("height");
  handleDimensionInput("width");
  updateLivePreview();

  window.scrollTo({ top: 120, behavior: "smooth" });
}

function cancelEdit() {
  editingWorkId = null;
  const t = translations[currentLanguage];

  document.getElementById("editModeIndicator").style.display = "none";
  document.getElementById("editActionsRow").style.display = "none";
  document.getElementById("txtFormHeading").textContent = t.formHeading;
  document.getElementById("txtAddBtnText").textContent = t.addBtn;

  resetForm();
}

function duplicateWork(id) {
  const item = works.find((w) => w.id === id);
  if (!item) return;

  const clone = {
    ...item,
    id: nextId++,
    workName: `${item.workName} (Copy)`,
    createdAt: new Date().toISOString()
  };

  works.unshift(clone);
  saveWorks();
  renderWorks();
  showToast("नाप डुप्लीकेट किया गया! 📋", "success");
}

function removeWork(id) {
  const t = translations[currentLanguage];
  works = works.filter((w) => w.id !== id);
  if (editingWorkId === id) {
    cancelEdit();
  }
  saveWorks();
  renderWorks();
  showToast(t.toastDeleted);
}

function resetForm() {
  document.getElementById("workName").value = "";
  document.getElementById("height").value = "";
  document.getElementById("width").value = "";
  document.getElementById("quantity").value = "1";
  document.getElementById("heightFtTag").style.display = "none";
  document.getElementById("widthFtTag").style.display = "none";
  updateLivePreview();
}

function clearProject() {
  if (works.length === 0) return;
  const confirmMsg = currentLanguage === "hi"
    ? "क्या आप वर्तमान प्रोजेक्ट के सभी नाप हटाना चाहते हैं?"
    : "Are you sure you want to clear all measurements in this project?";

  if (confirm(confirmMsg)) {
    works = [];
    nextId = 1;
    cancelEdit();
    saveWorks();
    renderWorks();
    showToast(translations[currentLanguage].toastCleared);
  }
}

function saveWorks() {
  localStorage.setItem(STORAGE_KEY_WORKS, JSON.stringify(works));
}

function saveCurrentProjectName() {
  const name = document.getElementById("projectName").value.trim();
  localStorage.setItem(STORAGE_KEY_PROJECT, name);
  renderWorks();
}

// --- Render & Search ---
function handleSearch() {
  searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
  renderWorks();
}

function renderWorks() {
  const listEl = document.getElementById("workList");
  const t = translations[currentLanguage];

  const filtered = works.filter((w) => {
    if (!searchQuery) return true;
    return (
      (w.workName && w.workName.toLowerCase().includes(searchQuery)) ||
      (w.projectName && w.projectName.toLowerCase().includes(searchQuery))
    );
  });

  document.getElementById("workCountBadge").textContent = `${filtered.length} Items`;

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
          </svg>
        </div>
        <p>${searchQuery ? "कोई मैच नहीं मिला (No matches found)" : t.emptyList}</p>
      </div>
    `;
  } else {
    listEl.innerHTML = filtered
      .map((work) => {
        const maxSize = 80;
        const scale = maxSize / Math.max(work.measuredHeight, work.measuredWidth);
        const visualHeight = Math.max(12, work.measuredHeight * scale);
        const visualWidth = Math.max(12, work.measuredWidth * scale);

        return `
          <div class="work-item" id="work-item-${work.id}">
            <div class="work-main-info">
              <div class="work-header-row">
                <div class="work-title-group">
                  <span class="work-item-name">${escapeHTML(work.workName)}</span>
                  ${work.quantity > 1 ? `<span class="qty-badge">${work.quantity} pcs</span>` : ""}
                </div>
                ${work.rate > 0 ? `<span class="work-cost-badge">${formatCurrency(work.totalAmount)}</span>` : ""}
              </div>

              <div class="dim-specs">
                <div class="dim-col">
                  <span>Actual Size (इंच)</span>
                  <strong>${formatNumber(work.height, 1)}" × ${formatNumber(work.width, 1)}"</strong>
                </div>
                <div class="dim-col">
                  <span>Billed Size (फीट)</span>
                  <strong>${formatNumber(work.measuredHeight, 1)} ft × ${formatNumber(work.measuredWidth, 1)} ft</strong>
                </div>
              </div>

              <div class="work-calc-row">
                <div class="work-area-highlight">
                  <span>Area:</span>
                  <strong>${formatNumber(work.billedArea)} Sq Ft</strong>
                  ${work.quantity > 1 ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(${formatNumber(work.measuredHeight * work.measuredWidth)} × ${work.quantity})</span>` : ""}
                </div>

                <div class="work-item-actions">
                  <button type="button" class="action-chip" onclick="editWork(${work.id})" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Edit</span>
                  </button>

                  <button type="button" class="action-chip" onclick="duplicateWork(${work.id})" title="Duplicate">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>Clone</span>
                  </button>

                  <button type="button" class="action-chip delete" onclick="removeWork(${work.id})" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                    <span>Del</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="work-visual-box" title="Scale: ${formatNumber(work.measuredWidth, 1)}ft × ${formatNumber(work.measuredHeight, 1)}ft">
              <div class="work-visual-inner" style="width: ${visualWidth}px; height: ${visualHeight}px;"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Calculate Totals across all works
  const totalBilledArea = works.reduce((sum, w) => sum + (w.billedArea || 0), 0);
  const totalActualArea = works.reduce((sum, w) => sum + (w.actualArea || 0), 0);
  const totalCost = works.reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  const totalPcs = works.reduce((sum, w) => sum + (w.quantity || 1), 0);
  const diffArea = totalBilledArea - totalActualArea;

  // Update KPI Dashboard
  document.getElementById("kpiWorksCount").textContent = works.length;
  document.getElementById("kpiQtyCount").textContent = `${totalPcs} Total Pcs`;
  document.getElementById("kpiTotalSqFt").textContent = formatNumber(totalBilledArea);
  document.getElementById("kpiActualDiff").textContent = `Actual: ${formatNumber(totalActualArea)} Sq Ft`;

  document.getElementById("kpiTotalCost").textContent = formatCurrency(totalCost);
  const avgRate = totalBilledArea > 0 && totalCost > 0 ? Math.round(totalCost / totalBilledArea) : 0;
  document.getElementById("kpiAvgRate").textContent = avgRate > 0 ? `Avg: ₹${avgRate}/sqft` : "Optional Rate";

  // Update Grand Total Banner
  document.getElementById("grandTotalSqFt").textContent = `${formatNumber(totalBilledArea)} Sq Ft`;
  const grandCostEl = document.getElementById("grandTotalCost");
  if (totalCost > 0) {
    grandCostEl.style.display = "block";
    grandCostEl.textContent = `Estimated Total: ${formatCurrency(totalCost)}`;
  } else {
    grandCostEl.style.display = "none";
  }

  document.getElementById("grandTotalPcsChip").textContent = `Items: ${works.length} (${totalPcs} pcs)`;
  document.getElementById("grandActualDiffChip").textContent = `Commercial Rounding: +${formatNumber(Math.max(0, diffArea))} Sq Ft`;
}

// --- WhatsApp Share ---
function shareWhatsApp() {
  if (works.length === 0) {
    showToast("पहले कोई Work जोड़ें!", "error");
    return;
  }

  const projectName = document.getElementById("projectName").value.trim() || "Project";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  let text = `📐 *MEASUREMENT & ESTIMATION REPORT*\n`;
  text += `📁 *Project:* ${projectName}\n`;
  text += `📅 *Date:* ${dateStr}\n`;
  text += `──────────────────\n`;

  works.forEach((w, i) => {
    text += `*${i + 1}. ${w.workName}*${w.quantity > 1 ? ` (Qty: ${w.quantity} pcs)` : ""}\n`;
    text += `   • Size: ${w.height}" × ${w.width}"\n`;
    text += `   • Billed: ${w.measuredHeight} ft × ${w.measuredWidth} ft\n`;
    text += `   • Area: *${formatNumber(w.billedArea)} Sq Ft*\n`;
    if (w.rate > 0) {
      text += `   • Rate: ₹${w.rate}/sqft ➔ *${formatCurrency(w.totalAmount)}*\n`;
    }
    text += `\n`;
  });

  const totalArea = works.reduce((sum, w) => sum + (w.billedArea || 0), 0);
  const totalCost = works.reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  const totalPcs = works.reduce((sum, w) => sum + (w.quantity || 1), 0);

  text += `──────────────────\n`;
  text += `📊 *SUMMARY:*\n`;
  text += `• Total Items: ${works.length} (${totalPcs} pcs)\n`;
  text += `• Total Billed Area: *${formatNumber(totalArea)} Sq Ft*\n`;
  if (totalCost > 0) {
    text += `• Grand Total: *${formatCurrency(totalCost)}*\n`;
  }
  text += `\n_Generated via Measurement Calculator Pro_`;

  const encoded = encodeURIComponent(text);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile ? `whatsapp://send?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, "_blank");
}

// --- Print / PDF Estimation Slip ---
function printQuotation() {
  if (works.length === 0) {
    showToast("प्रिंट करने के लिए पहले Work जोड़ें!", "error");
    return;
  }

  const projectName = document.getElementById("projectName").value.trim() || "Project";
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  document.getElementById("printProjectName").textContent = projectName;
  document.getElementById("printDate").textContent = dateStr;

  const tbody = document.getElementById("printTableBody");
  tbody.innerHTML = works
    .map((w, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${escapeHTML(w.workName)}</strong></td>
        <td>${formatNumber(w.height, 1)}" × ${formatNumber(w.width, 1)}"</td>
        <td>${formatNumber(w.measuredHeight, 1)} ft × ${formatNumber(w.measuredWidth, 1)} ft</td>
        <td style="text-align: center;">${w.quantity || 1}</td>
        <td style="text-align: right; font-weight: bold;">${formatNumber(w.billedArea)}</td>
        <td style="text-align: right;">${w.rate > 0 ? "₹" + w.rate : "—"}</td>
        <td style="text-align: right; font-weight: bold;">${w.totalAmount > 0 ? formatCurrency(w.totalAmount) : "—"}</td>
      </tr>
    `)
    .join("");

  const totalArea = works.reduce((sum, w) => sum + (w.billedArea || 0), 0);
  const totalCost = works.reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  const totalPcs = works.reduce((sum, w) => sum + (w.quantity || 1), 0);

  document.getElementById("printTotalQty").textContent = `${works.length} items (${totalPcs} pcs)`;
  document.getElementById("printTotalSqFt").textContent = `${formatNumber(totalArea)} Sq Ft`;

  const amountRow = document.getElementById("printAmountRow");
  if (totalCost > 0) {
    amountRow.style.display = "flex";
    document.getElementById("printGrandTotal").textContent = formatCurrency(totalCost);
  } else {
    amountRow.style.display = "none";
  }

  window.print();
}

// --- Copy Report ---
async function copyReport() {
  if (works.length === 0) {
    showToast("पहले कोई Work जोड़ें!", "error");
    return;
  }

  const projectName = document.getElementById("projectName").value.trim() || "Project";
  let report = `PROJECT MEASUREMENT & ESTIMATE REPORT\nProject: ${projectName}\nDate: ${new Date().toLocaleDateString("en-IN")}\n\n`;

  works.forEach((w, index) => {
    report += `${index + 1}. ${w.workName}${w.quantity > 1 ? ` (Qty: ${w.quantity})` : ""}\n`;
    report += `   Actual Size: ${w.height}" × ${w.width}"\n`;
    report += `   Billed Size: ${w.measuredHeight} ft × ${w.measuredWidth} ft\n`;
    report += `   Area: ${formatNumber(w.billedArea)} Sq Ft\n`;
    if (w.rate > 0) {
      report += `   Rate: ₹${w.rate}/sqft | Amount: ${formatCurrency(w.totalAmount)}\n`;
    }
    report += `\n`;
  });

  const totalArea = works.reduce((sum, w) => sum + (w.billedArea || 0), 0);
  const totalCost = works.reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  const totalPcs = works.reduce((sum, w) => sum + (w.quantity || 1), 0);

  report += `--------------------------------------\n`;
  report += `Total Items: ${works.length} (${totalPcs} pcs)\n`;
  report += `Total Billed Area: ${formatNumber(totalArea)} Sq Ft\n`;
  if (totalCost > 0) {
    report += `Total Estimated Amount: ${formatCurrency(totalCost)}\n`;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(report);
      showToast(translations[currentLanguage].toastCopied, "success");
    } else {
      window.prompt("रिपोर्ट कॉपी करें (Ctrl+C):", report);
    }
  } catch {
    window.prompt("रिपोर्ट कॉपी करें (Ctrl+C):", report);
  }
}

// --- Export CSV / Excel ---
function exportCSV() {
  if (works.length === 0) {
    showToast("डाउनलोड के लिए कोई डेटा नहीं है!", "error");
    return;
  }

  const projectName = document.getElementById("projectName").value.trim() || "Measurements";
  let csv = "ID,Project,Work Name,Height (Inches),Width (Inches),Billed Height (Ft),Billed Width (Ft),Quantity,Area (SqFt),Rate (INR),Amount (INR)\n";

  works.forEach((w, idx) => {
    const row = [
      idx + 1,
      `"${w.projectName || ""}"`,
      `"${w.workName || ""}"`,
      w.height,
      w.width,
      w.measuredHeight,
      w.measuredWidth,
      w.quantity || 1,
      w.billedArea.toFixed(2),
      w.rate || 0,
      w.totalAmount.toFixed(2)
    ];
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${projectName}_Measurements.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV फाइल डाउनलोड हो गई! 📊", "success");
}

// --- Rule Modal ---
function openRuleModal() {
  document.getElementById("ruleModal").style.display = "flex";
}

function closeRuleModal() {
  document.getElementById("ruleModal").style.display = "none";
}

function closeModalOnBg(e, modalId) {
  if (e.target.id === modalId) {
    document.getElementById(modalId).style.display = "none";
  }
}

// --- Floating Toast Notification ---
function showToast(message, type = "normal") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "success" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, -10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Keyboard shortcuts (Enter to add work when in inputs)
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    const active = document.activeElement;
    if (active && (active.id === "height" || active.id === "width" || active.id === "workName" || active.id === "rate")) {
      e.preventDefault();
      submitWork();
    }
  }
});

// Run on load
document.addEventListener("DOMContentLoaded", initApp);
