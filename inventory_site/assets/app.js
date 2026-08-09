const apiStateUrl = "/api/state";
const apiLoginUrl = "/api/login";
const apiLogoutUrl = "/api/logout";
const apiSessionUrl = "/api/session";
const apiSignupUrl = "/api/signup";
const apiImportExcelUrl = "/api/import-excel";
const storageKey = "stocktake-state-v3";
const baseGradeLabels = ["S+S", "SS", "SA", "AS", "AA"];
const gradeLabels = [...baseGradeLabels, "B"];
const systemGradeLabels = [...gradeLabels, "등급미정"];
const defaultCategories = ["PC", "올인원", "업로드예정", "주변기기", "B급", "노트북", "미분류"];
const unregisteredMakerFilter = "__unregistered_maker__";
const emptyState = {
  settings: {
    warehouseName: "실재고 조사",
    managerName: "Counter",
    currencyUnit: "KRW",
    lowStockDefault: 0
  },
  products: [],
  movements: [],
  stocktake: {
    counts: {},
    updatedAt: ""
  }
};

let state = structuredClone(emptyState);
let searchTerm = "";
let categoryFilter = "";
let makerFilter = "";
let serverOnline = false;
let currentUser = "";
let editingRowId = "";

const formatNumber = new Intl.NumberFormat("ko-KR");
const elements = {
  saveState: document.getElementById("saveState"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  loginView: document.getElementById("loginView"),
  loginForm: document.getElementById("loginForm"),
  loginId: document.getElementById("loginId"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  showSignup: document.getElementById("showSignup"),
  signupForm: document.getElementById("signupForm"),
  signupId: document.getElementById("signupId"),
  signupPassword: document.getElementById("signupPassword"),
  signupPasswordConfirm: document.getElementById("signupPasswordConfirm"),
  signupSubmit: document.getElementById("signupSubmit"),
  signupError: document.getElementById("signupError"),
  signupSuccess: document.getElementById("signupSuccess"),
  logoutButton: document.getElementById("logoutButton"),
  metricItems: document.getElementById("metricItems"),
  metricSystemQty: document.getElementById("metricSystemQty"),
  metricCountQty: document.getElementById("metricCountQty"),
  metricDiffQty: document.getElementById("metricDiffQty"),
  countBody: document.getElementById("countBody"),
  entryModal: document.getElementById("entryModal"),
  openEntryModal: document.getElementById("openEntryModal"),
  closeEntryModal: document.getElementById("closeEntryModal"),
  countForm: document.getElementById("countForm"),
  category: document.getElementById("category"),
  maker: document.getElementById("maker"),
  productCode: document.getElementById("productCode"),
  gradeCounts: Array.from(document.querySelectorAll(".grade-count")),
  gradeCounts6: Array.from(document.querySelectorAll('.grade-count[data-actual-site="6"]')),
  gradeCounts7: Array.from(document.querySelectorAll('.grade-count[data-actual-site="7"]')),
  systemGradeCounts: Array.from(document.querySelectorAll(".system-grade-count")),
  systemQty: document.getElementById("systemQty"),
  diffPreview: document.getElementById("diffPreview"),
  note: document.getElementById("note"),
  addMode: document.getElementById("addMode"),
  resetForm: document.getElementById("resetForm"),
  clearAll: document.getElementById("clearAll"),
  importExcel: document.getElementById("importExcel"),
  importExcelFile: document.getElementById("importExcelFile"),
  exportExcel: document.getElementById("exportExcel"),
  categoryFilter: document.getElementById("categoryFilter"),
  makerFilter: document.getElementById("makerFilter"),
  search: document.getElementById("search"),
  toast: document.getElementById("toast")
};

function setAuthenticated(isAuthenticated, username = "") {
  currentUser = isAuthenticated ? username : "";
  elements.currentUserLabel.textContent = `사용자: ${currentUser || "-"}`;
  document.body.classList.toggle("authenticated", isAuthenticated);
  if (isAuthenticated) {
    elements.loginError.hidden = true;
  } else {
    elements.loginPassword.value = "";
    elements.signupSuccess.hidden = true;
    setTimeout(() => elements.loginId.focus(), 0);
  }
}

function setServerStatus(isOnline) {
  serverOnline = isOnline;
  elements.saveState.classList.toggle("online", isOnline);
  elements.saveState.classList.toggle("offline", !isOnline);
  elements.saveState.classList.remove("checking");
  elements.saveState.textContent = isOnline ? "서버 온라인" : "서버 오프라인";
}

function normalizeItem(item) {
  const productCode = item.productCode ?? item.name ?? "";
  const legacySystemQty = Number(item.systemQty ?? item.bookQty ?? 0);
  const systemGradeCounts = normalizeGradeCounts(item.systemGradeCounts, "", legacySystemQty, systemGradeLabels, "등급미정");
  const systemQty = sumGradeCounts(systemGradeCounts, systemGradeLabels);
  const legacyGradeCounts = normalizeGradeCounts(item.gradeCounts, item.grade, item.countQty ?? item.qty);
  const hasSplitCounts = item.gradeCounts6 || item.gradeCounts7;
  const gradeCounts6 = hasSplitCounts ? normalizeGradeCounts(item.gradeCounts6) : normalizeGradeCounts(legacyGradeCounts);
  const gradeCounts7 = normalizeGradeCounts(item.gradeCounts7);
  const gradeCounts = combineGradeCounts(gradeCounts6, gradeCounts7);
  const countQty = sumGradeCounts(gradeCounts);

  return {
    ...item,
    category: normalizeCategory(item.category),
    productCode,
    systemGradeCounts,
    systemQty,
    gradeCounts6,
    gradeCounts7,
    gradeCounts,
    countQty,
    qty: countQty,
    grade: "",
    createdBy: item.createdBy || item.updatedBy || "",
    updatedBy: item.updatedBy || item.createdBy || "",
    checked: Boolean(item.checked),
    checkedBy: item.checkedBy || "",
    checkedAt: item.checkedAt || "",
    updatedAt: item.updatedAt || ""
  };
}

function normalizeCategory(value) {
  const text = String(value || "").trim();
  return text ? text.replace(/^\d+\.\s*/, "") : "미분류";
}

function isBCategory(item) {
  return normalizeCategory(item.category).includes("B급");
}

function getActualGradeLabels(item) {
  return isBCategory(item) ? ["B"] : baseGradeLabels;
}

function normalizeState() {
  state.settings = { ...emptyState.settings, ...(state.settings || {}) };
  state.products = Array.isArray(state.products) ? state.products.map(normalizeItem) : [];
  state.movements = Array.isArray(state.movements) ? state.movements : [];
  state.stocktake = { ...emptyState.stocktake, ...(state.stocktake || {}) };
}

async function loadState() {
  try {
    const response = await fetch(apiStateUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("state request failed");
    state = await response.json();
    setServerStatus(true);
  } catch {
    setServerStatus(false);
    const saved = localStorage.getItem(storageKey);
    if (saved) state = JSON.parse(saved);
  }
  normalizeState();
}

async function checkSession() {
  try {
    const response = await fetch(apiSessionUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("session check failed");
    const session = await response.json();
    return session;
  } catch {
    return { authenticated: false, username: "" };
  }
}

async function login(event) {
  event.preventDefault();
  elements.loginError.hidden = true;

  try {
    const response = await fetch(apiLoginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: elements.loginId.value.trim(),
        password: elements.loginPassword.value
      })
    });
    if (!response.ok) throw new Error("login failed");
    const data = await response.json();
    setAuthenticated(true, data.username || elements.loginId.value.trim());
    await initializeApp();
  } catch {
    elements.loginError.hidden = false;
    elements.loginPassword.select();
  }
}

async function signup() {
  elements.signupError.hidden = true;
  elements.signupSuccess.hidden = true;

  const username = elements.signupId.value.trim();
  const password = elements.signupPassword.value;
  const confirm = elements.signupPasswordConfirm.value;

  if (!/^[A-Za-z0-9._-]{3,24}$/.test(username) || password.length < 4 || password !== confirm) {
    elements.signupError.textContent = "아이디는 영문/숫자 3자 이상, 비밀번호는 4자 이상으로 입력하세요.";
    elements.signupError.hidden = false;
    return;
  }

  try {
    const response = await fetch(apiSignupUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (response.status === 409) {
      elements.signupError.textContent = "이미 사용 중인 아이디입니다.";
      elements.signupError.hidden = false;
      return;
    }
    if (!response.ok) throw new Error("signup failed");
    elements.signupSuccess.hidden = false;
    elements.loginId.value = username;
    elements.loginPassword.value = "";
    elements.signupId.value = "";
    elements.signupPassword.value = "";
    elements.signupPasswordConfirm.value = "";
    elements.loginPassword.focus();
  } catch {
    elements.signupError.textContent = "회원가입 중 오류가 발생했습니다.";
    elements.signupError.hidden = false;
  }
}

async function logout() {
  try {
    await fetch(apiLogoutUrl, { method: "POST" });
  } catch {
    // The UI still returns to the login screen if the local server is gone.
  }
  setAuthenticated(false, "");
}

async function saveState() {
  try {
    const response = await fetch(apiStateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    });
    if (!response.ok) throw new Error("save failed");
    setServerStatus(true);
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(state));
    setServerStatus(false);
  }
}

function nowText() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function makeId() {
  return `count-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGrade(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeGradeCounts(value, legacyGrade = "", legacyQty = 0, labels = gradeLabels, fallbackGrade = "") {
  const counts = Object.fromEntries(labels.map((grade) => [grade, 0]));

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([grade, qty]) => {
      const key = normalizeGrade(grade);
      if (key in counts) counts[key] = Math.max(0, Number(qty) || 0);
    });
  } else if (legacyGrade) {
    const key = normalizeGrade(legacyGrade);
    if (key in counts) counts[key] = Math.max(0, Number(legacyQty) || 0);
  } else if (fallbackGrade && Number(legacyQty || 0) > 0) {
    counts[fallbackGrade] = Math.max(0, Number(legacyQty) || 0);
  }

  return counts;
}

function sumGradeCounts(gradeCounts, labels = gradeLabels) {
  return labels.reduce((sum, grade) => sum + Number(gradeCounts?.[grade] || 0), 0);
}

function addGradeCounts(current, addition, labels = gradeLabels) {
  return Object.fromEntries(labels.map((grade) => [
    grade,
    Number(current?.[grade] || 0) + Number(addition?.[grade] || 0)
  ]));
}

function combineGradeCounts(gradeCounts6, gradeCounts7, labels = gradeLabels) {
  return addGradeCounts(gradeCounts6, gradeCounts7, labels);
}

function syncActualTotals(item) {
  item.gradeCounts6 = normalizeGradeCounts(item.gradeCounts6);
  item.gradeCounts7 = normalizeGradeCounts(item.gradeCounts7);
  item.gradeCounts = combineGradeCounts(item.gradeCounts6, item.gradeCounts7);
  item.countQty = sumGradeCounts(item.gradeCounts);
  item.qty = item.countQty;
}

function renderGradeCounts(gradeCounts, labels = gradeLabels) {
  const badges = labels
    .filter((grade) => Number(gradeCounts?.[grade] || 0) > 0)
    .map((grade) => `<span class="badge">${grade} ${formatNumber.format(Number(gradeCounts[grade]))}</span>`);
  return `<div class="grade-stack">${badges.length ? badges.join("") : labels.map((grade) => `<span class="muted">${grade} 0</span>`).join("")}</div>`;
}

function formatGradeCountsText(gradeCounts, labels = gradeLabels) {
  const parts = labels
    .filter((grade) => Number(gradeCounts?.[grade] || 0) > 0)
    .map((grade) => `${grade} ${Number(gradeCounts[grade] || 0)}`);
  return parts.length ? parts.join(" / ") : "0";
}

function renderActualCell(item) {
  const labels = getActualGradeLabels(item);
  if (editingRowId !== item.id) {
    return `
      <div class="actual-split">
        <div class="actual-site">
          <span class="actual-site-title">6호 실사</span>
          ${renderGradeCounts(item.gradeCounts6, labels)}
        </div>
        <div class="actual-site">
          <span class="actual-site-title">7호 실사</span>
          ${renderGradeCounts(item.gradeCounts7, labels)}
        </div>
      </div>
    `;
  }

  return `
    <div class="inline-grade-editor">
      ${["6", "7"].map((site) => {
        const counts = site === "6" ? item.gradeCounts6 : item.gradeCounts7;
        return `
          <div class="inline-grade-group">
            <div class="inline-grade-title">${site}호 실사</div>
            ${labels.map((grade) => `
              <div class="inline-grade-row">
                <span>${grade} 등급</span>
                <button class="mini-button" type="button" data-grade-step="${item.id}" data-actual-site="${site}" data-grade="${grade}" data-delta="-1">-</button>
                <input type="number" inputmode="numeric" min="0" step="1" value="${Number(counts?.[grade] || 0)}" data-grade-input="${item.id}" data-actual-site="${site}" data-grade="${grade}">
                <button class="mini-button" type="button" data-grade-step="${item.id}" data-actual-site="${site}" data-grade="${grade}" data-delta="1">+</button>
              </div>
            `).join("")}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function gradeCountsEqual(systemCounts, actualCounts) {
  return systemGradeLabels.every((grade) => Number(systemCounts?.[grade] || 0) === Number(actualCounts?.[grade] || 0));
}

function updateAutoCheck(item) {
  const matched = gradeCountsEqual(item.systemGradeCounts, item.gradeCounts);
  if (matched && !item.checked) {
    item.checked = true;
    item.checkedBy = currentUser || "system";
    item.checkedAt = nowText();
  }
}

function alignCountsForCategory(item) {
  item.systemGradeCounts = normalizeGradeCounts(item.systemGradeCounts, "", 0, systemGradeLabels);
  item.gradeCounts6 = normalizeGradeCounts(item.gradeCounts6);
  item.gradeCounts7 = normalizeGradeCounts(item.gradeCounts7);

  if (isBCategory(item)) {
    item.systemGradeCounts.B += Number(item.systemGradeCounts["등급미정"] || 0);
    item.systemGradeCounts["등급미정"] = 0;
  } else {
    item.systemGradeCounts["등급미정"] += Number(item.systemGradeCounts.B || 0);
    item.systemGradeCounts.B = 0;
    item.gradeCounts6.B = 0;
    item.gradeCounts7.B = 0;
  }

  item.systemQty = sumGradeCounts(item.systemGradeCounts, systemGradeLabels);
  syncActualTotals(item);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDiff(item) {
  return sumGradeCounts(item.gradeCounts) - sumGradeCounts(item.systemGradeCounts, systemGradeLabels);
}

function formatSigned(value) {
  if (value > 0) return `+${formatNumber.format(value)}`;
  return formatNumber.format(value);
}

function getRows() {
  const query = searchTerm.trim().toLowerCase();
  let rows = [...state.products];

  if (categoryFilter) {
    rows = rows.filter((item) => normalizeCategory(item.category) === categoryFilter);
  }

  if (makerFilter === unregisteredMakerFilter) {
    rows = rows.filter((item) => !String(item.maker || "").trim());
  } else if (makerFilter) {
    rows = rows.filter((item) => String(item.maker || "") === makerFilter);
  }

  if (query) {
    rows = rows.filter((item) =>
      [item.category, item.maker, item.productCode, Object.keys(item.gradeCounts || {}).join(" "), item.note].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }

  rows.sort((a, b) =>
    [
      normalizeCategory(a.category).localeCompare(normalizeCategory(b.category), "ko"),
      String(a.maker || "").localeCompare(String(b.maker || ""), "ko"),
      String(a.productCode || "").localeCompare(String(b.productCode || ""), "ko"),
      String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
    ].find((result) => result !== 0) || 0
  );

  return rows;
}

function getMetricRows() {
  return state.products.filter((item) =>
    (!categoryFilter || normalizeCategory(item.category) === categoryFilter) &&
    (
      !makerFilter ||
      (makerFilter === unregisteredMakerFilter && !String(item.maker || "").trim()) ||
      String(item.maker || "") === makerFilter
    )
  );
}

function renderCategoryFilter() {
  const counts = state.products.reduce((map, item) => {
    const category = normalizeCategory(item.category);
    map.set(category, (map.get(category) || 0) + 1);
    return map;
  }, new Map());
  const categories = [...new Set([...defaultCategories, ...counts.keys()])].sort((a, b) => a.localeCompare(b, "ko"));
  const current = categoryFilter;
  categoryFilter = categories.includes(current) ? current : "";
  elements.categoryFilter.innerHTML = [
    renderCategoryChip("", "전체", state.products.length),
    ...categories.map((category) => renderCategoryChip(category, category, counts.get(category) || 0))
  ].join("");
  renderEntryCategoryOptions();
  renderMakerFilterOptions();
}

function renderCategoryChip(value, label, count) {
  const active = value === categoryFilter;
  return `
    <button class="category-chip ${active ? "active" : ""}" type="button" data-category="${escapeHtml(value)}">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber.format(count)}</strong>
    </button>
  `;
}

function getCategoryOptions() {
  const existing = state.products.map((item) => normalizeCategory(item.category));
  return [...new Set([...defaultCategories, ...existing])].filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
}

function renderEntryCategoryOptions() {
  const selected = elements.category.value || categoryFilter || defaultCategories[0];
  const categories = getCategoryOptions();
  elements.category.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}" ${category === selected ? "selected" : ""}>${escapeHtml(category)}</option>`)
    .join("");
}

function getMakerOptions() {
  return [...new Set(state.products.map((item) => String(item.maker || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ko"));
}

function renderMakerFilterOptions() {
  const makers = getMakerOptions();
  const hasUnregistered = state.products.some((item) => !String(item.maker || "").trim());
  makerFilter = makers.includes(makerFilter) || (makerFilter === unregisteredMakerFilter && hasUnregistered) ? makerFilter : "";
  elements.makerFilter.innerHTML = [
    `<option value="">제조사 전체</option>`,
    hasUnregistered ? `<option value="${unregisteredMakerFilter}" ${makerFilter === unregisteredMakerFilter ? "selected" : ""}>제조사 미등록</option>` : "",
    ...makers.map((maker) => `<option value="${escapeHtml(maker)}" ${maker === makerFilter ? "selected" : ""}>${escapeHtml(maker)}</option>`)
  ].filter(Boolean).join("");
}

function renderCategoryCell(item) {
  if (editingRowId !== item.id) {
    return `<span class="badge">${escapeHtml(normalizeCategory(item.category))}</span>`;
  }

  const categories = [...new Set([...defaultCategories, normalizeCategory(item.category)])].filter(Boolean);
  return `
    <select class="inline-category-select" data-category-input="${item.id}">
      ${categories.map((category) => `<option value="${escapeHtml(category)}" ${category === normalizeCategory(item.category) ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
    </select>
  `;
}

function renderMakerCell(item) {
  if (editingRowId !== item.id) {
    return `
      <strong>${escapeHtml(item.maker || "-")}</strong>
      <small>${escapeHtml(item.id)}</small>
    `;
  }

  return `
    <input
      class="inline-maker-input"
      type="text"
      value="${escapeHtml(item.maker || "")}"
      placeholder="제조사"
      data-maker-input="${item.id}"
    >
    <small>${escapeHtml(item.id)}</small>
  `;
}

function renderNoteCell(item) {
  return `
    <input
      class="inline-note-input"
      type="text"
      value="${escapeHtml(item.note || "")}"
      placeholder="메모 입력"
      data-note-input="${item.id}"
    >
  `;
}

function renderMetrics() {
  const rows = getMetricRows();
  const systemQty = rows.reduce((sum, item) => sum + sumGradeCounts(item.systemGradeCounts, systemGradeLabels), 0);
  const countQty = rows.reduce((sum, item) => sum + sumGradeCounts(item.gradeCounts), 0);
  const diffQty = countQty - systemQty;

  elements.metricItems.textContent = formatNumber.format(rows.length);
  elements.metricSystemQty.textContent = formatNumber.format(systemQty);
  elements.metricCountQty.textContent = formatNumber.format(countQty);
  elements.metricDiffQty.textContent = formatSigned(diffQty);
  elements.metricDiffQty.classList.toggle("diff-plus", diffQty > 0);
  elements.metricDiffQty.classList.toggle("diff-minus", diffQty < 0);
}

function renderTable() {
  const rows = getRows();

  if (!rows.length) {
    elements.countBody.innerHTML = `
      <tr>
        <td colspan="13">
          <div class="empty-state">입력된 실재고 데이터가 없습니다.</div>
        </td>
      </tr>
    `;
    return;
  }

  elements.countBody.innerHTML = rows.map((item) => {
    const diff = getDiff(item);
    const diffClass = diff > 0 ? "diff-plus" : diff < 0 ? "diff-minus" : "";

    return `
      <tr>
        <td>${renderCategoryCell(item)}</td>
        <td class="maker-cell">${renderMakerCell(item)}</td>
        <td><strong>${escapeHtml(item.productCode || "-")}</strong></td>
        <td>
          <div class="grade-edit-actions">
            <button class="icon-button" title="수정" type="button" data-edit="${item.id}">
              <span class="material-symbols-outlined">edit</span>
            </button>
            ${renderGradeCounts(item.systemGradeCounts, systemGradeLabels)}
          </div>
        </td>
        <td>${renderActualCell(item)}</td>
        <td class="number">${formatNumber.format(sumGradeCounts(item.systemGradeCounts, systemGradeLabels))}</td>
        <td class="number"><strong>${formatNumber.format(sumGradeCounts(item.gradeCounts))}</strong></td>
        <td class="number ${diffClass}"><strong>${formatSigned(diff)}</strong></td>
        <td>${renderNoteCell(item)}</td>
        <td class="muted">${escapeHtml(item.updatedAt || "-")}</td>
        <td class="muted">${escapeHtml(item.updatedBy || item.createdBy || "-")}</td>
        <td class="check-cell">
          <input type="checkbox" data-check-input="${item.id}" title="${escapeHtml(item.checkedBy ? `${item.checkedBy} / ${item.checkedAt}` : "확인 체크")}" ${item.checked ? "checked" : ""}>
        </td>
        <td>
          <div class="row-actions">
            <button class="icon-button danger" title="삭제" type="button" data-delete="${item.id}">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAll() {
  renderCategoryFilter();
  renderMetrics();
  renderTable();
  saveState();
}

function openEntryModal() {
  elements.entryModal.classList.add("open");
  elements.entryModal.setAttribute("aria-hidden", "false");
  setTimeout(() => elements.maker.focus(), 0);
}

function closeEntryModal() {
  elements.entryModal.classList.remove("open");
  elements.entryModal.setAttribute("aria-hidden", "true");
  elements.openEntryModal.focus();
}

function updateDiffPreview() {
  const systemQty = sumGradeCounts(readSystemGradeCountsFromForm(), systemGradeLabels);
  const countQty = sumGradeCounts(combineGradeCounts(readGradeCountsFromForm("6"), readGradeCountsFromForm("7")));
  const diff = countQty - systemQty;
  elements.systemQty.value = formatNumber.format(systemQty);
  elements.diffPreview.value = formatSigned(diff);
}

function resetEntryForm() {
  elements.countForm.reset();
  renderEntryCategoryOptions();
  elements.category.value = categoryFilter || defaultCategories[0];
  elements.addMode.checked = true;
  elements.systemGradeCounts.forEach((input) => {
    input.value = 0;
  });
  elements.gradeCounts.forEach((input) => {
    input.value = 0;
  });
  updateDiffPreview();
  elements.maker.focus();
}

function readSystemGradeCountsFromForm() {
  return Object.fromEntries(elements.systemGradeCounts.map((input) => [
    input.dataset.grade,
    Math.max(0, Number(input.value || 0))
  ]));
}

function readGradeCountsFromForm(site) {
  const inputs = site ? elements.gradeCounts.filter((input) => input.dataset.actualSite === site) : elements.gradeCounts;
  return Object.fromEntries(inputs.map((input) => [
    input.dataset.grade,
    Math.max(0, Number(input.value || 0))
  ]));
}

function writeSystemGradeCountsToForm(gradeCounts) {
  elements.systemGradeCounts.forEach((input) => {
    input.value = Number(gradeCounts?.[input.dataset.grade] || 0);
  });
}

function writeGradeCountsToForm(gradeCounts6, gradeCounts7 = {}) {
  elements.gradeCounts.forEach((input) => {
    const counts = input.dataset.actualSite === "7" ? gradeCounts7 : gradeCounts6;
    input.value = Number(counts?.[input.dataset.grade] || 0);
  });
}

function readEntryForm() {
  const systemGradeCounts = readSystemGradeCountsFromForm();
  const gradeCounts6 = readGradeCountsFromForm("6");
  const gradeCounts7 = readGradeCountsFromForm("7");
  const gradeCounts = combineGradeCounts(gradeCounts6, gradeCounts7);
  return {
    category: normalizeCategory(elements.category.value),
    maker: elements.maker.value.trim(),
    productCode: elements.productCode.value.trim(),
    systemGradeCounts,
    systemQty: sumGradeCounts(systemGradeCounts, systemGradeLabels),
    gradeCounts6,
    gradeCounts7,
    gradeCounts,
    countQty: sumGradeCounts(gradeCounts),
    note: elements.note.value.trim(),
    addMode: elements.addMode.checked
  };
}

function submitCount(event) {
  event.preventDefault();

  const entry = readEntryForm();
  if (!entry.maker) {
    alert("제조사를 입력하세요.");
    return;
  }
  if (!entry.productCode) {
    alert("상품코드를 입력하세요.");
    return;
  }
  if (!Number.isFinite(entry.systemQty) || entry.systemQty < 0) {
    alert("전산재고를 올바르게 입력하세요.");
    return;
  }
  if (!Number.isFinite(entry.countQty) || entry.countQty < 0) {
    alert("실사수량을 올바르게 입력하세요.");
    return;
  }

  const updatedAt = nowText();
  const updatedBy = currentUser || "unknown";
  const existing = state.products.find((item) =>
    normalizeCategory(item.category) === entry.category &&
    String(item.maker || "").toLowerCase() === entry.maker.toLowerCase() &&
    String(item.productCode || "").toLowerCase() === entry.productCode.toLowerCase()
  );

  if (existing) {
    existing.systemGradeCounts = entry.systemGradeCounts;
    existing.systemQty = entry.systemQty;
    existing.gradeCounts6 = entry.addMode ? addGradeCounts(existing.gradeCounts6, entry.gradeCounts6) : entry.gradeCounts6;
    existing.gradeCounts7 = entry.addMode ? addGradeCounts(existing.gradeCounts7, entry.gradeCounts7) : entry.gradeCounts7;
    syncActualTotals(existing);
    existing.category = entry.category;
    existing.maker = entry.maker;
    existing.productCode = entry.productCode;
    existing.name = entry.productCode;
    existing.grade = "";
    existing.note = entry.note || existing.note;
    existing.updatedBy = updatedBy;
    existing.updatedAt = updatedAt;
    alignCountsForCategory(existing);
    updateAutoCheck(existing);
    toast(entry.addMode ? "기존 항목에 실사수량을 더했습니다." : "기존 항목 수량을 수정했습니다.");
  } else {
    const nextItem = {
      id: makeId(),
      category: entry.category,
      maker: entry.maker,
      productCode: entry.productCode,
      name: entry.productCode,
      grade: "",
      systemGradeCounts: entry.systemGradeCounts,
      gradeCounts6: entry.gradeCounts6,
      gradeCounts7: entry.gradeCounts7,
      gradeCounts: entry.gradeCounts,
      systemQty: entry.systemQty,
      countQty: entry.countQty,
      qty: entry.countQty,
      note: entry.note,
      createdBy: updatedBy,
      updatedBy,
      checked: false,
      checkedBy: "",
      checkedAt: "",
      updatedAt
    };
    alignCountsForCategory(nextItem);
    updateAutoCheck(nextItem);
    state.products.unshift(nextItem);
    toast("실사 항목을 저장했습니다.");
  }

  state.stocktake.updatedAt = updatedAt;
  resetEntryForm();
  closeEntryModal();
  renderAll();
}

function editItem(id) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;
  editingRowId = editingRowId === id ? "" : id;
  renderTable();
}

function deleteItem(id) {
  const item = state.products.find((row) => row.id === id);
  if (!item || !confirm(`${item.productCode || "선택한"} 항목을 삭제할까요?`)) return;

  state.products = state.products.filter((row) => row.id !== id);
  state.stocktake.updatedAt = nowText();
  toast("항목을 삭제했습니다.");
  renderAll();
}

function updateActualGradeCount(id, site, grade, value) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;

  const targetKey = site === "7" ? "gradeCounts7" : "gradeCounts6";
  item[targetKey] = normalizeGradeCounts(item[targetKey]);
  item[targetKey][grade] = Math.max(0, Number(value) || 0);
  syncActualTotals(item);
  item.updatedBy = currentUser || "unknown";
  item.updatedAt = nowText();
  updateAutoCheck(item);
  saveState();
  renderMetrics();
  renderTable();
}

function updateItemCategory(id, category) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;

  item.category = normalizeCategory(category);
  item.updatedBy = currentUser || "unknown";
  item.updatedAt = nowText();
  alignCountsForCategory(item);
  updateAutoCheck(item);
  saveState();
  renderCategoryFilter();
  renderMetrics();
  renderTable();
}

function updateItemMaker(id, maker) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;

  const nextMaker = String(maker || "").trim();
  if ((item.maker || "") === nextMaker) return;

  item.maker = nextMaker;
  item.updatedBy = currentUser || "unknown";
  item.updatedAt = nowText();
  saveState();
  renderMakerFilterOptions();
  renderMetrics();
  renderTable();
}

function updateItemNote(id, note) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;

  const nextNote = String(note || "").trim();
  if ((item.note || "") === nextNote) return;

  item.note = nextNote;
  item.updatedBy = currentUser || "unknown";
  item.updatedAt = nowText();
  saveState();
  renderTable();
}

function updateItemCheck(id, checked) {
  const item = state.products.find((row) => row.id === id);
  if (!item) return;

  item.checked = Boolean(checked);
  item.checkedBy = item.checked ? currentUser || "unknown" : "";
  item.checkedAt = item.checked ? nowText() : "";
  item.updatedBy = currentUser || "unknown";
  item.updatedAt = nowText();
  saveState();
  renderTable();
}

function clearAll() {
  if (!confirm("입력된 실재고 데이터를 전부 삭제할까요?")) return;
  state = structuredClone(emptyState);
  toast("모든 실사 데이터를 삭제했습니다.");
  renderAll();
}

async function importExcelFile(file) {
  if (!file) return;
  if (!confirm("현재 목록을 선택한 엑셀 파일 기준으로 교체할까요?")) {
    elements.importExcelFile.value = "";
    return;
  }

  elements.importExcel.disabled = true;
  elements.importExcel.textContent = "엑셀 넣는 중";

  try {
    const response = await fetch(apiImportExcelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "X-Filename": encodeURIComponent(file.name)
      },
      body: await file.arrayBuffer()
    });
    if (!response.ok) throw new Error("excel import failed");

    const result = await response.json();
    state = result.state || structuredClone(emptyState);
    setServerStatus(true);
    normalizeState();
    editingRowId = "";
    renderAll();
    toast("엑셀 파일을 불러왔습니다.");
  } catch {
    setServerStatus(false);
    toast("엑셀 파일 넣기에 실패했습니다.");
  } finally {
    elements.importExcel.disabled = false;
    elements.importExcel.innerHTML = `<span class="material-symbols-outlined">upload_file</span>엑셀 파일 넣기`;
    elements.importExcelFile.value = "";
  }
}

function exportExcel() {
  const headers = [
    "카테고리",
    "상품코드",
    "상품명",
    "판매가",
    "전산재고",
    ...systemGradeLabels.map((grade) => `전산_${grade}`),
    ...gradeLabels.map((grade) => `6호실사_${grade}`),
    "6호실사합계",
    ...gradeLabels.map((grade) => `7호실사_${grade}`),
    "7호실사합계",
    ...gradeLabels.map((grade) => `실사_${grade}`),
    "실사합계",
    "차이",
    "확인",
    "비고"
  ];
  const rows = state.products.map((item) => [
    normalizeCategory(item.category),
    item.productCode || item.name,
    item.description || "",
    item.price || "",
    sumGradeCounts(item.systemGradeCounts, systemGradeLabels),
    ...systemGradeLabels.map((grade) => item.systemGradeCounts?.[grade] || 0),
    ...gradeLabels.map((grade) => item.gradeCounts6?.[grade] || 0),
    sumGradeCounts(item.gradeCounts6),
    ...gradeLabels.map((grade) => item.gradeCounts7?.[grade] || 0),
    sumGradeCounts(item.gradeCounts7),
    ...gradeLabels.map((grade) => item.gradeCounts?.[grade] || 0),
    sumGradeCounts(item.gradeCounts),
    getDiff(item),
    item.checked ? "확인" : "미확인",
    item.note,
  ]);
  const tableRows = [headers, ...rows].map((row, index) => {
    const tag = index === 0 ? "th" : "td";
    return `<tr>${row.map((value) => `<${tag}>${escapeHtml(value ?? "")}</${tag}>`).join("")}</tr>`;
  }).join("");
  const workbook = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #999; padding: 6px 8px; mso-number-format:"\\@"; }
        th { background: #e6e8ea; font-weight: bold; }
      </style>
    </head>
    <body><table>${tableRows}</table></body>
    </html>
  `;
  const blob = new Blob(["\ufeff" + workbook], {
    type: "application/vnd.ms-excel;charset=utf-8"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `stocktake-${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast-item";
  item.textContent = message;
  elements.toast.appendChild(item);
  setTimeout(() => {
    item.style.opacity = "0";
    item.style.transform = "translateY(8px)";
    item.style.transition = "all .25s ease";
    setTimeout(() => item.remove(), 280);
  }, 2000);
}

elements.countForm.addEventListener("submit", submitCount);
elements.loginForm.addEventListener("submit", login);
elements.showSignup.addEventListener("click", () => {
  elements.signupForm.hidden = !elements.signupForm.hidden;
  elements.signupError.hidden = true;
  elements.signupSuccess.hidden = true;
  if (!elements.signupForm.hidden) elements.signupId.focus();
});
elements.signupSubmit.addEventListener("click", signup);
elements.logoutButton.addEventListener("click", logout);
elements.openEntryModal.addEventListener("click", () => {
  resetEntryForm();
  openEntryModal();
});
elements.closeEntryModal.addEventListener("click", closeEntryModal);
elements.entryModal.addEventListener("click", (event) => {
  if (event.target === elements.entryModal) closeEntryModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.entryModal.classList.contains("open")) {
    closeEntryModal();
  }
});
elements.resetForm.addEventListener("click", resetEntryForm);
elements.clearAll.addEventListener("click", clearAll);
elements.importExcel.addEventListener("click", () => elements.importExcelFile.click());
elements.importExcelFile.addEventListener("change", (event) => importExcelFile(event.target.files[0]));
elements.exportExcel.addEventListener("click", exportExcel);
elements.systemGradeCounts.forEach((input) => input.addEventListener("input", updateDiffPreview));
elements.gradeCounts.forEach((input) => input.addEventListener("input", updateDiffPreview));
elements.search.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderTable();
});
elements.makerFilter.addEventListener("change", (event) => {
  makerFilter = event.target.value;
  renderMakerFilterOptions();
  renderMetrics();
  renderTable();
});
elements.categoryFilter.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-category]");
  if (!chip) return;
  categoryFilter = chip.dataset.category;
  renderCategoryFilter();
  renderMetrics();
  renderTable();
});
document.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  const step = event.target.closest("[data-grade-step]");
  if (edit) editItem(edit.dataset.edit);
  if (del) deleteItem(del.dataset.delete);
  if (step) {
    const item = state.products.find((row) => row.id === step.dataset.gradeStep);
    const grade = step.dataset.grade;
    const site = step.dataset.actualSite || "6";
    const counts = site === "7" ? item?.gradeCounts7 : item?.gradeCounts6;
    const nextValue = Number(counts?.[grade] || 0) + Number(step.dataset.delta || 0);
    updateActualGradeCount(step.dataset.gradeStep, site, grade, nextValue);
  }
});
document.addEventListener("change", (event) => {
  const input = event.target.closest("[data-grade-input]");
  const category = event.target.closest("[data-category-input]");
  const maker = event.target.closest("[data-maker-input]");
  const note = event.target.closest("[data-note-input]");
  const check = event.target.closest("[data-check-input]");
  if (input) updateActualGradeCount(input.dataset.gradeInput, input.dataset.actualSite || "6", input.dataset.grade, input.value);
  if (category) updateItemCategory(category.dataset.categoryInput, category.value);
  if (maker) updateItemMaker(maker.dataset.makerInput, maker.value);
  if (note) updateItemNote(note.dataset.noteInput, note.value);
  if (check) updateItemCheck(check.dataset.checkInput, check.checked);
});
document.addEventListener("keydown", (event) => {
  const note = event.target.closest("[data-note-input]");
  const maker = event.target.closest("[data-maker-input]");
  if ((!note && !maker) || event.key !== "Enter") return;
  event.preventDefault();
  if (note) {
    updateItemNote(note.dataset.noteInput, note.value);
    note.blur();
  }
  if (maker) {
    updateItemMaker(maker.dataset.makerInput, maker.value);
    maker.blur();
  }
});

async function initializeApp() {
  await loadState();
  state.products.forEach((item) => {
    alignCountsForCategory(item);
    updateAutoCheck(item);
  });
  renderCategoryFilter();
  renderMetrics();
  renderTable();
  saveState();
  updateDiffPreview();
}

checkSession().then((session) => {
  setAuthenticated(Boolean(session.authenticated), session.username || "");
  if (session.authenticated) {
    initializeApp();
  }
});
